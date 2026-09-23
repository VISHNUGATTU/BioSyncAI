import mongoose from 'mongoose';
import LabAssistant from '../models/LabAssistant.js';
import Appointment from '../models/Appointment.js';
import Sample from '../models/Sample.js';
import Transaction from '../models/Transaction.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { uploadToCloudinary } from '../configs/cloudinary.js';

const generateLATokenAndCookie = (res, laId) => {
  const token = jwt.sign(
    { id: laId, role: 'lab_assistant' }, 
    process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );

  res.cookie('la_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return token;
};

export const loginLabAssistant = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;
  
  // Use lean() for read-only speed
  const labAssistant = await LabAssistant.findOne({ phone }).select('+password').lean();

  if (labAssistant && (await bcrypt.compare(password, labAssistant.password))) {
    const token = generateLATokenAndCookie(res, labAssistant._id);

    res.status(200).json({
      success: true,
      token,
      labAssistant: {
        _id: labAssistant._id,
        name: labAssistant.name,
        phone: labAssistant.phone,
        employeeId: labAssistant.employeeId,
        status: labAssistant.status,
      },
    });
  } else {
    res.status(401);
    throw new Error('Invalid phone number or password');
  }
});

export const collectSampleAndCOD = asyncHandler(async (req, res) => {
  const { barcode } = req.body; 
  
  const sample = await Sample.findById(req.params.sampleId);
  if (!sample) {
    res.status(404);
    throw new Error('Sample not found');
  }

  // START TRANSACTION: Ensure sample, transaction, and appointment update atomically
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    sample.status = 'Sample_Collected';
    sample.collectionTime = new Date();
    sample.barcode = barcode; 
    sample.labAssistant = req.labAssistant._id;
    await sample.save({ session });

    await Transaction.findOneAndUpdate(
      { appointment: sample.appointment, status: 'Pending' },
      { $set: { status: 'Success' } },
      { session }
    );

    await Appointment.findByIdAndUpdate(
      sample.appointment,
      { $set: { status: 'In_Progress' } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: 'Sample collected and COD payment recorded.', sample });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(`Collection failed: ${error.message}`);
  }
});

export const bulkLaboratoryDropoff = asyncHandler(async (req, res) => {
  const { sampleIds } = req.body; 
  
  if (!Array.isArray(sampleIds) || sampleIds.length === 0) {
    res.status(400);
    throw new Error('Please provide an array of sample IDs.');
  }

  const result = await Sample.updateMany(
    { _id: { $in: sampleIds }, labAssistant: req.labAssistant._id },
    { $set: { status: 'At_Laboratory' } }
  );

  res.status(200).json({ 
    success: true, 
    message: `Successfully handed over ${result.modifiedCount} samples to the laboratory.` 
  });
});

export const getPendingAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({
    labAssistant: req.labAssistant._id,
    status: { $in: ['Assistant_Assigned', 'On_The_Way', 'Arrived'] }
  })
  .populate('user', 'firstName lastName phoneNumber address')
  .sort({ scheduledDate: 1 })
  .lean();

  res.status(200).json({ success: true, count: appointments.length, data: appointments });
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, collectionOTP } = req.body;
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  if (status === 'Sample_Collected') {
    if (!collectionOTP || appointment.collectionOTP !== collectionOTP) {
      res.status(400);
      throw new Error('Invalid Collection OTP provided by user.');
    }
  }

  appointment.status = status;
  // Use MongoDB $push for atomicity instead of fetching array into memory
  await Appointment.findByIdAndUpdate(req.params.id, {
    $set: { status },
    $push: { trackingLogs: { status, timestamp: new Date() } }
  });

  res.status(200).json({ success: true, message: 'Status updated successfully' });
});

export const updateLiveLocation = asyncHandler(async (req, res) => {
  const { lat, lng, heading } = req.body;
  
  await LabAssistant.findByIdAndUpdate(
    req.labAssistant._id,
    { $set: { currentLocation: { lat, lng, heading, lastUpdated: new Date() } } }
  );

  res.status(200).json({ success: true, message: 'Location updated' });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { vehicleType, vehicleNumber, shiftTiming } = req.body;
  
  const updatedLabAssistant = await LabAssistant.findByIdAndUpdate(
    req.labAssistant._id,
    { $set: { vehicleType, vehicleNumber, shiftTiming } },
    { new: true, runValidators: true }
  ).lean();

  res.status(200).json({ success: true, data: updatedLabAssistant });
});

export const uploadCollectionEvidence = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image of the collected sample/barcode');
  }

  const sample = await Sample.findById(req.params.sampleId);
  if (!sample) {
    res.status(404);
    throw new Error('Sample not found');
  }

  if (sample.labAssistant.toString() !== req.labAssistant._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to upload evidence for this sample');
  }

  const cloudUpload = await uploadToCloudinary(req.file.buffer, 'sample_evidence');

  sample.evidenceImageUrl = cloudUpload.secure_url;
  await sample.save();

  res.status(200).json({ success: true, data: sample });
});