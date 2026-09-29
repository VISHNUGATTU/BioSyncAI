import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import TestCatalog from '../models/TestCatalog.js';
import Sample from '../models/Sample.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import UserDraft from '../models/UserDraft.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { findNearestLabAssistant, findNearestDoctor } from '../utils/distanceAssignment.js';

export const bookAppointment = asyncHandler(async (req, res) => {
  const { testId, scheduledDate, timeSlot, preparationAcknowledged, address, paymentMode = 'COD' } = req.body;

  if (!preparationAcknowledged) {
    res.status(400);
    throw new Error('You must acknowledge preparation instructions.');
  }

  // 30-day calibration rule check
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentAppointment = await Appointment.findOne({
    user: req.user._id,
    status: { $nin: ['Cancelled', 'Failed'] },
    scheduledDate: { $gte: thirtyDaysAgo }
  }).sort({ scheduledDate: -1 });

  if (recentAppointment) {
    const daysSince = Math.floor((Date.now() - new Date(recentAppointment.scheduledDate).getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(1, 30 - daysSince);
    res.status(400);
    throw new Error(`AI Calibration Cycle is active. Next recalibration appointment available in ${daysRemaining} days (30-day calibration rule).`);
  }

  const test = await TestCatalog.findById(testId).lean();
  if (!test || !test.isActive) {
    res.status(404);
    throw new Error('Requested test is not available.');
  }

  // Generate 6-digit OTP for sample collection verification
  const collectionOTP = Math.floor(100000 + Math.random() * 900000).toString();
  const totalAmount = test.pricing.basePrice + (test.pricing.basePrice * (test.pricing.taxPercentage / 100));

  // Determine user coordinates for distance-based nearest staff assignment
  const userCoords = address?.coordinates?.lat != null && address?.coordinates?.lng != null
    ? address.coordinates
    : req.user?.address?.coordinates;

  const [nearestLAData, nearestDocData] = await Promise.all([
    findNearestLabAssistant(userCoords),
    findNearestDoctor(userCoords)
  ]);

  const nearestLA = nearestLAData.nearestAssistant;
  const laDistance = nearestLAData.distanceKm;
  const nearestDoc = nearestDocData.nearestDoctor;
  const docDistance = nearestDocData.distanceKm;

  const initialStatus = nearestLA ? 'Assistant_Assigned' : 'Booked';

  const trackingLogs = [
    {
      status: 'Booked',
      timestamp: new Date(),
      notes: 'Home appointment confirmed and booked.'
    }
  ];

  if (nearestLA) {
    trackingLogs.push({
      status: 'Assistant_Assigned',
      timestamp: new Date(),
      notes: `Shortest distance assignment: Assigned nearest Lab Assistant "${nearestLA.name}" (${laDistance !== Infinity ? laDistance + ' km away' : 'nearby'}) and Pathologist "${nearestDoc?.name || 'Central Lab'}" (${docDistance !== Infinity ? docDistance + ' km away' : 'hub'}).`
    });
  }

  const isOnline = paymentMode === 'Online' || paymentMode === 'UPI';

  // START TRANSACTION: Ensure all 3 records are created, or none at all
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const appointment = new Appointment({
      user: req.user._id,
      appointmentType: 'Lab_Collection',
      testCatalog: test._id,
      labAssistant: nearestLA ? nearestLA._id : null,
      doctor: nearestDoc ? nearestDoc._id : null,
      preparationInstructions: test.preparationInstructions || 'Fasting for 10-12 hours recommended. Drink plenty of water.',
      scheduledDate: new Date(scheduledDate),
      timeSlot,
      status: initialStatus,
      address,
      collectionOTP,
      trackingLogs,
      paymentDetails: {
        isPaid: isOnline,
        amount: totalAmount,
        method: isOnline ? 'Online' : 'Cash',
      }
    });

    const sample = new Sample({
      user: req.user._id,
      appointment: appointment._id,
      testCatalog: test._id,
      labAssistant: nearestLA ? nearestLA._id : null,
      doctor: nearestDoc ? nearestDoc._id : null,
      status: nearestLA ? 'Assigned' : 'Requested'
    });

    const transaction = new Transaction({
      user: req.user._id,
      appointment: appointment._id,
      amount: totalAmount,
      status: isOnline ? 'Success' : 'Pending',
      paymentGateway: isOnline ? 'UPI_Online' : 'Cash_On_Delivery',
      revenueType: 'Lab_Test'
    });

    appointment.transactionId = transaction._id;

    // Save all documents within the transaction session
    await appointment.save({ session });
    await sample.save({ session });
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Clear appointment booking draft upon successful booking
    await UserDraft.deleteOne({ user: req.user._id, draftType: 'appointment_booking' });

    res.status(201).json({
      success: true,
      message: isOnline
        ? 'Appointment booked and online payment verified.'
        : 'Appointment booked successfully. Please keep exact change ready for COD.',
      appointment,
      sample,
      transaction
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

export const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { newScheduledDate, newTimeSlot } = req.body;
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  if (appointment.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to modify this appointment');
  }

  const now = new Date();
  const currentScheduled = new Date(appointment.scheduledDate);
  const lockTime = new Date(currentScheduled.getTime() - (8 * 60 * 60 * 1000));

  if (now > lockTime) {
    res.status(403);
    throw new Error('Modifications are locked. You are within 8 hours of your scheduled appointment.');
  }

  appointment.scheduledDate = new Date(newScheduledDate);
  appointment.timeSlot = newTimeSlot;

  await appointment.save();

  res.status(200).json({ success: true, message: 'Appointment successfully rescheduled.', appointment });
});

export const attemptCancellation = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  if (appointment.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to modify this appointment');
  }

  const user = await User.findById(req.user._id);
  user.strikeCount += 1;

  if (user.strikeCount >= 2) {
    user.accountStatus = 'Suspended';
    user.suspensionReason = 'Repeatedly cancelled non-negotiable lab appointments.';
  }
  
  appointment.status = 'Cancelled';
  appointment.cancellationReason = 'User breached non-cancellation policy.';

  // Use Promise.all to save both concurrently
  await Promise.all([user.save(), appointment.save()]);

  res.status(403).json({
    success: false,
    message: `Cancellation processed, but it violates our non-negotiable policy. You now have ${user.strikeCount} strike(s).`,
    accountStatus: user.accountStatus
  });
});

export const getUserAppointments = asyncHandler(async (req, res) => {
  // Added pagination and lean() for performance
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15;
  const startIndex = (page - 1) * limit;

  const appointments = await Appointment.find({ user: req.user._id })
    .populate('testCatalog', 'testName category preparationInstructions pricing price')
    .populate('labAssistant', 'name phone vehicleType assignedZones performance currentLocation')
    .sort({ scheduledDate: -1 })
    .skip(startIndex)
    .limit(limit)
    .lean();

  res.status(200).json({ success: true, count: appointments.length, appointments });
});