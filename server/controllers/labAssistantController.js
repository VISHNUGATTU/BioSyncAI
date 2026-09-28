import mongoose from 'mongoose';
import LabAssistant from '../models/LabAssistant.js';
import Appointment from '../models/Appointment.js';
import Sample from '../models/Sample.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Vitals from '../models/Vitals.js';
import Doctor from '../models/Doctor.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { uploadToCloudinary } from '../configs/cloudinary.js';
import { findNearestDoctor } from '../utils/distanceAssignment.js';

const generateLATokenAndCookie = (res, laId, role = 'lab_assistant') => {
  const token = jwt.sign(
    { id: laId, role }, 
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
  
  // 1. Check if phone belongs to a Lab Assistant
  const labAssistant = await LabAssistant.findOne({ phone }).select('+password').lean();

  if (labAssistant && (await bcrypt.compare(password, labAssistant.password))) {
    const token = generateLATokenAndCookie(res, labAssistant._id, 'lab_assistant');

    return res.status(200).json({
      success: true,
      role: 'lab_assistant',
      token,
      user: {
        _id: labAssistant._id,
        name: labAssistant.name,
        phone: labAssistant.phone,
        role: 'lab_assistant',
        employeeId: labAssistant.employeeId || 'EMP001',
        status: labAssistant.status || 'Available',
      },
      labAssistant: {
        _id: labAssistant._id,
        name: labAssistant.name,
        phone: labAssistant.phone,
        role: 'lab_assistant',
        employeeId: labAssistant.employeeId || 'EMP001',
        status: labAssistant.status || 'Available',
      },
    });
  }

  // 2. Check if phone belongs to a Doctor / Pathologist
  const doctor = await Doctor.findOne({ phone }).select('+password').lean();
  if (doctor && (await bcrypt.compare(password, doctor.password))) {
    const token = generateLATokenAndCookie(res, doctor._id, 'doctor');

    return res.status(200).json({
      success: true,
      role: 'doctor',
      token,
      user: {
        _id: doctor._id,
        name: doctor.name,
        phone: doctor.phone,
        email: doctor.email,
        role: 'doctor',
        specialty: doctor.specialty || 'Pathology & Laboratory Medicine',
        licenseNumber: doctor.licenseNumber || 'MCI-DOC-77291',
        hospitalAffiliation: doctor.hospitalAffiliation || 'BioSync Central Laboratory',
        status: doctor.status || 'Active',
      },
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        phone: doctor.phone,
        email: doctor.email,
        role: 'doctor',
        specialty: doctor.specialty || 'Pathology & Laboratory Medicine',
        licenseNumber: doctor.licenseNumber || 'MCI-DOC-77291',
        hospitalAffiliation: doctor.hospitalAffiliation || 'BioSync Central Laboratory',
        status: doctor.status || 'Active',
      },
    });
  }

  res.status(401);
  throw new Error('Invalid phone number or password');
});

export const collectSampleAndCOD = asyncHandler(async (req, res) => {
  const { barcode, specimenBarcodes, vitals, clinicalIntake, questionnaire, paymentDetails } = req.body; 
  
  const appointment = await Appointment.findById(req.params.appointmentId);
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  let sample = await Sample.findOne({ appointment: req.params.appointmentId });

  // 1. Strict Duplicate Barcode Verification: Guarantee zero barcode collisions across samples
  const finalBarcode = (barcode && barcode.trim().length > 0)
    ? barcode.trim()
    : `BIO-SMP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const duplicateSample = await Sample.findOne({
    barcode: finalBarcode,
    _id: { $ne: sample?._id }
  }).lean();

  if (duplicateSample) {
    res.status(400);
    throw new Error(`Duplicate barcode: Barcode "${finalBarcode}" is already assigned to sample ${duplicateSample._id}. Barcode must be unique.`);
  }

  const bloodBarcode = (specimenBarcodes?.blood || finalBarcode).trim();
  const urineBarcode = (specimenBarcodes?.urine || `${finalBarcode}-U`).trim();
  const stoolBarcode = (specimenBarcodes?.stool || `${finalBarcode}-S`).trim();

  // 2. Ensure nearest doctor is assigned if not already set on appointment
  let assignedDoctorId = appointment.doctor || sample?.doctor;
  if (!assignedDoctorId) {
    const coords = appointment.address?.coordinates?.lat != null
      ? appointment.address.coordinates
      : req.labAssistant?.currentLocation;
    const { nearestDoctor } = await findNearestDoctor(coords);
    if (nearestDoctor) {
      assignedDoctorId = nearestDoctor._id;
      appointment.doctor = nearestDoctor._id;
    }
  }

  // START TRANSACTION: Ensure sample, transaction, and appointment update atomically
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!sample) {
      // Find a default test catalog if missing
      const mongoose = await import('mongoose');
      const TestCatalog = mongoose.model('TestCatalog');
      const test = await TestCatalog.findOne();
      
      sample = new Sample({
        user: appointment.user,
        appointment: appointment._id,
        testCatalog: appointment.testCatalog || (test ? test._id : null),
        doctor: assignedDoctorId || null,
        status: 'Sample_Collected',
        collectionTime: new Date(),
        barcode: finalBarcode,
        specimens: {
          blood: { collected: true, barcode: bloodBarcode },
          urine: { collected: true, barcode: urineBarcode },
          stool: { collected: true, barcode: stoolBarcode }
        },
        labAssistant: req.labAssistant._id
      });
      await sample.save({ session });
    } else {
      sample.status = 'Sample_Collected';
      sample.collectionTime = new Date();
      sample.barcode = finalBarcode; 
      sample.doctor = assignedDoctorId || sample.doctor || null;
      sample.specimens = {
        blood: { collected: true, barcode: bloodBarcode },
        urine: { collected: true, barcode: urineBarcode },
        stool: { collected: true, barcode: stoolBarcode }
      };
      sample.labAssistant = req.labAssistant._id;
      await sample.save({ session });
    }

    await Transaction.findOneAndUpdate(
      { appointment: appointment._id, status: 'Pending' },
      { $set: { status: 'Success' } },
      { session }
    );

    const apptUpdateFields = {
      status: 'Sample_Collected',
      doctor: assignedDoctorId || appointment.doctor || undefined,
      specimens: {
        blood: { collected: true, barcode: bloodBarcode, tubesCount: 3 },
        urine: { collected: true, barcode: urineBarcode },
        stool: { collected: true, barcode: stoolBarcode },
        coldChainSecured: true,
      }
    };

    if (clinicalIntake) {
      apptUpdateFields.clinicalIntake = clinicalIntake;
      apptUpdateFields.questionnaire = clinicalIntake.preScreening || clinicalIntake;
    } else if (questionnaire) {
      apptUpdateFields.questionnaire = questionnaire;
    }

    if (paymentDetails) {
      apptUpdateFields.paymentDetails = {
        isPaid: !!paymentDetails.isPaid,
        amount: paymentDetails.amount || 499,
        method: paymentDetails.method || 'Cash',
        collectedAt: new Date(),
        collectedBy: req.labAssistant._id,
      };
    }

    await Appointment.findByIdAndUpdate(
      appointment._id,
      { 
        $set: apptUpdateFields,
        $push: { trackingLogs: { status: 'Sample_Collected', timestamp: new Date(), notes: 'Blood, Urine, and Stool specimens collected, labeled, and sealed in 4°C carrier.' } }
      },
      { session }
    );

    // Save field vitals & medical properties into database for AI engine prediction
    const intakeVitals = clinicalIntake?.vitals || vitals;
    if (intakeVitals && typeof intakeVitals === 'object') {
      const cleanVitalsData = {
        user: appointment.user,
        source: 'Lab_Assistant',
        isInitialBaseline: true,
        isVerifiedByUser: true,
        recordedAt: new Date(),
        bodyMetrics: {
          heightCm: Number(intakeVitals.heightCm || intakeVitals.bodyMetrics?.heightCm) || undefined,
          weightKg: Number(intakeVitals.weightKg || intakeVitals.bodyMetrics?.weightKg) || undefined,
          bmi: Number(intakeVitals.bmi || intakeVitals.bodyMetrics?.bmi) || undefined,
          waistCm: Number(intakeVitals.waistCm || intakeVitals.bodyMetrics?.measurements?.waistCm) || undefined,
        },
        continuousMetrics: {
          restingHeartRate: Number(intakeVitals.pulse || intakeVitals.continuousMetrics?.restingHeartRate) || undefined,
          oxygenSaturationSpO2: Number(intakeVitals.spO2 || intakeVitals.continuousMetrics?.oxygenSaturationSpO2) || undefined,
          basalBodyTemperatureF: Number(intakeVitals.temperatureF || intakeVitals.continuousMetrics?.basalBodyTemperatureF) || undefined,
        },
        cardiovascularRisk: {
          systolic: Number(intakeVitals.systolic || intakeVitals.cardiovascularRisk?.systolic) || undefined,
          diastolic: Number(intakeVitals.diastolic || intakeVitals.cardiovascularRisk?.diastolic) || undefined,
        }
      };

      await Vitals.findOneAndUpdate(
        { user: appointment.user, isInitialBaseline: true },
        { $set: cleanVitalsData },
        { upsert: true, new: true, session }
      );

      // Update User profile with lifestyle properties for AI prediction models
      const userUpdates = { vitalsStatus: 'Lab_Verified' };
      if (clinicalIntake?.lifestyle) {
        if (clinicalIntake.lifestyle.dietPreference) userUpdates['lifestyle.dietPreference'] = clinicalIntake.lifestyle.dietPreference;
        if (clinicalIntake.lifestyle.smokingHabit) userUpdates['lifestyle.smokingHabit'] = clinicalIntake.lifestyle.smokingHabit;
        if (clinicalIntake.lifestyle.alcoholConsumption) userUpdates['lifestyle.alcoholConsumption'] = clinicalIntake.lifestyle.alcoholConsumption;
        if (clinicalIntake.lifestyle.activityLevel) userUpdates['lifestyle.activityLevel'] = clinicalIntake.lifestyle.activityLevel;
      }
      await User.findByIdAndUpdate(
        appointment.user,
        { $set: userUpdates },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: 'Sample collected, vitals recorded, and payment cleared.', sample });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(`Collection failed: ${error.message}`);
  }
});

export const rejectSample = asyncHandler(async (req, res) => {
  const { reason, notes } = req.body;
  const appointmentId = req.params.appointmentId;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Update Sample
    let sample = await Sample.findOneAndUpdate(
      { appointment: appointmentId },
      { $set: { status: 'Rejected', rejectionReason: reason, rejectionNotes: notes } },
      { session, new: true }
    );

    if (!sample) {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      const mongoose = await import('mongoose');
      const TestCatalog = mongoose.model('TestCatalog');
      const test = await TestCatalog.findOne();

      sample = new Sample({
        user: appointment.user,
        appointment: appointment._id,
        testCatalog: test ? test._id : null,
        status: 'Rejected',
        rejectionReason: reason,
        rejectionNotes: notes,
        labAssistant: req.labAssistant._id
      });
      await sample.save({ session });
    }

    // 2. Update Appointment to Failed or similar
    await Appointment.findByIdAndUpdate(
      appointmentId,
      { 
        $set: { status: 'Failed' },
        $push: { trackingLogs: { status: 'Failed', timestamp: new Date() } }
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: 'Sample rejected successfully.' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(`Rejection failed: ${error.message}`);
  }
});

export const bulkLaboratoryDropoff = asyncHandler(async (req, res) => {
  const { sampleIds } = req.body; 
  
  if (!Array.isArray(sampleIds) || sampleIds.length === 0) {
    res.status(400);
    throw new Error('Please provide an array of sample IDs.');
  }

  const samples = await Sample.find({
    _id: { $in: sampleIds },
    labAssistant: req.labAssistant._id
  }).populate('appointment');

  const apptIds = [];
  for (const s of samples) {
    s.status = 'At_Laboratory';
    s.resultsDone = false;
    s.resultsStatus = 'Res yet to be obtained';

    // If sample does not have a doctor assigned, assign the nearest doctor
    if (!s.doctor) {
      const coords = s.appointment?.address?.coordinates || req.labAssistant?.currentLocation;
      const { nearestDoctor } = await findNearestDoctor(coords);
      if (nearestDoctor) {
        s.doctor = nearestDoctor._id;
        if (s.appointment) {
          s.appointment.doctor = nearestDoctor._id;
        }
      }
    }
    await s.save();

    if (s.appointment?._id) {
      apptIds.push(s.appointment._id);
    }
  }

  if (apptIds.length > 0) {
    await Appointment.updateMany(
      { _id: { $in: apptIds } },
      { 
        $set: { status: 'At_Laboratory' },
        $push: { trackingLogs: { status: 'At_Laboratory', timestamp: new Date(), notes: 'Courier delivered specimens to diagnostic laboratory.' } }
      }
    );
  }

  res.status(200).json({ 
    success: true, 
    message: `Successfully handed over ${samples.length} samples to the laboratory.` 
  });
});

export const getPendingAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({
    labAssistant: req.labAssistant._id,
    status: { $in: ['Assistant_Assigned', 'On_The_Way', 'Arrived', 'Collecting'] }
  })
  .populate('user', 'firstName lastName phoneNumber address profilePicture')
  .populate('doctor', 'name specialty licenseNumber hospitalAffiliation currentLocation')
  .populate('testCatalog', 'testName category preparationInstructions specimenType fastingRequirement')
  .sort({ scheduledDate: 1 })
  .lean();

  // Fetch samples for these appointments to get the test details
  const apptIds = appointments.map(a => a._id);
  const samples = await Sample.find({ appointment: { $in: apptIds } })
    .populate('testCatalog', 'testName category preparationInstructions')
    .lean();

  const data = appointments.map(appt => {
    const sampleTests = samples.filter(s => s.appointment.toString() === appt._id.toString()).map(s => s.testCatalog);
    const tests = sampleTests.length > 0 ? sampleTests : (appt.testCatalog ? [appt.testCatalog] : []);
    return {
      ...appt,
      tests,
      testCatalog: appt.testCatalog || tests[0] || null
    };
  });

  res.status(200).json({ success: true, count: data.length, data });
});

export const getDashboardKPIs = asyncHandler(async (req, res) => {
  const laId = req.labAssistant._id;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todayAppointments = await Appointment.find({
    labAssistant: laId
  });

  const pendingCollection = todayAppointments.filter(a => 
    ['Assistant_Assigned', 'On_The_Way', 'Arrived', 'Collecting'].includes(a.status)
  ).length;

  const completed = todayAppointments.filter(a =>
    ['Sample_Collected', 'At_Laboratory', 'Processing', 'Report_Generated', 'Completed'].includes(a.status)
  ).length;

  const rejected = todayAppointments.filter(a =>
    ['Failed', 'Cancelled', 'No_Show'].includes(a.status)
  ).length;

  const todaySamples = todayAppointments.length;
  
  // For 'inProcessing', check samples overall
  const samples = await Sample.find({ labAssistant: laId })
    .populate({
      path: 'appointment',
      populate: { path: 'user', select: 'firstName lastName phoneNumber profilePicture address' }
    })
    .populate('testCatalog', 'testName category specimenType preparationInstructions')
    .sort({ updatedAt: -1 })
    .lean();

  const inProcessing = samples.filter(s => ['At_Laboratory', 'Processing'].includes(s.status)).length;
  const testsDue = Math.max(0, todaySamples - completed - rejected);

  res.status(200).json({
    success: true,
    data: {
      todaySamples,
      pendingCollection,
      inProcessing,
      testsDue,
      completed,
      rejected,
      critical: 0,
      pendingReports: 0,
      progress: todaySamples === 0 ? 0 : Math.floor((completed / todaySamples) * 100),
      recentSamples: samples.slice(0, 15)
    }
  });
});

export const getAllAssistantSamples = asyncHandler(async (req, res) => {
  const samples = await Sample.find({
    labAssistant: req.labAssistant._id
  })
  .populate({
    path: 'appointment',
    populate: { path: 'user', select: 'firstName lastName phoneNumber profilePicture address' }
  })
  .populate('testCatalog')
  .sort({ updatedAt: -1 })
  .lean();

  res.status(200).json({ success: true, count: samples.length, data: samples });
});

export const recordAppointmentVitals = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { vitals } = req.body;

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  const cleanVitalsData = {
    user: appointment.user,
    source: 'Lab_Assistant',
    isInitialBaseline: true,
    isVerifiedByUser: true,
    recordedAt: new Date(),
    bodyMetrics: vitals?.bodyMetrics || {},
    continuousMetrics: vitals?.continuousMetrics || {},
    metabolicHealth: vitals?.metabolicHealth || {},
    cardiovascularRisk: vitals?.cardiovascularRisk || {},
    immunology: vitals?.immunology || {},
    hormones: vitals?.hormones || {},
    organFunction: vitals?.organFunction || {},
    micronutrients: vitals?.micronutrients || {},
    geneticAndGut: vitals?.geneticAndGut || {}
  };

  const record = await Vitals.findOneAndUpdate(
    { user: appointment.user, isInitialBaseline: true },
    { $set: cleanVitalsData },
    { upsert: true, new: true }
  );

  await User.findByIdAndUpdate(appointment.user, { vitalsStatus: 'Lab_Verified' });

  res.status(200).json({ success: true, message: 'All clinical vitals recorded successfully.', data: record });
});

export const getAppointmentVitals = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  const vitals = await Vitals.findOne({ user: appointment.user }).sort({ recordedAt: -1 }).lean();
  res.status(200).json({ success: true, data: vitals || null });
});

export const getAppointmentsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const laId = req.labAssistant._id;

  let query = { labAssistant: laId };
  
  if (category === 'pending') {
    query.status = { $in: ['Assistant_Assigned', 'On_The_Way', 'Arrived', 'Assigned', 'Booked', 'Collecting'] };
  } else if (category === 'completed') {
    query.status = { $in: ['Sample_Collected', 'At_Laboratory', 'Processing', 'Report_Generated', 'Completed'] };
  } else if (category === 'rejected') {
    query.status = { $in: ['Failed', 'Cancelled', 'No_Show', 'Patient_No_Show', 'Patient_Refused', 'Fasting_Violated', 'Wrong_Address'] };
  } else if (category === 'processing') {
    query.status = { $in: ['At_Laboratory', 'Processing'] };
  } else if (category === 'total' || category === 'all') {
    // No status filter - all appointments
  } else {
    // Fallback if specific status string
    query.status = category;
  }

  const appointments = await Appointment.find(query)
    .populate('user', 'firstName lastName phoneNumber address profilePicture')
    .populate('doctor', 'name specialty licenseNumber hospitalAffiliation currentLocation')
    .populate('testCatalog', 'testName category preparationInstructions specimenType fastingRequirement')
    .sort({ scheduledDate: -1 })
    .lean();

  const apptIds = appointments.map(a => a._id);
  const samples = await Sample.find({ appointment: { $in: apptIds } })
    .populate('testCatalog', 'testName category')
    .lean();

  const data = appointments.map(appt => {
    const sampleTests = samples.filter(s => s.appointment.toString() === appt._id.toString()).map(s => s.testCatalog);
    const tests = sampleTests.length > 0 ? sampleTests : (appt.testCatalog ? [appt.testCatalog] : []);
    return {
      ...appt,
      tests,
      testCatalog: appt.testCatalog || tests[0] || null
    };
  });

  res.status(200).json({ success: true, count: data.length, data });
});

export const getCollectedSamples = asyncHandler(async (req, res) => {
  const samples = await Sample.find({
    labAssistant: req.labAssistant._id,
    status: 'Sample_Collected'
  })
  .populate({
    path: 'appointment',
    populate: { path: 'user', select: 'firstName lastName profilePicture' }
  })
  .populate('testCatalog', 'testName category')
  .sort({ collectionTime: -1 })
  .lean();

  res.status(200).json({ success: true, count: samples.length, data: samples });
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

export const getProfile = asyncHandler(async (req, res) => {
  if (req.role === 'doctor' || req.doctor) {
    const doctor = await Doctor.findById(req.doctor?._id || req.user?._id).lean();
    if (!doctor) {
      res.status(404);
      throw new Error('Doctor not found');
    }
    return res.status(200).json({ success: true, data: doctor });
  }

  const labAssistant = await LabAssistant.findById(req.labAssistant?._id || req.user?._id).lean();
  if (!labAssistant) {
    res.status(404);
    throw new Error('Lab assistant not found');
  }
  res.status(200).json({ success: true, data: labAssistant });
});

export const updateProfile = asyncHandler(async (req, res) => {
  if (req.role === 'doctor' || req.doctor) {
    const { name, phone, specialty, hospitalAffiliation, status } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (specialty !== undefined) updateData.specialty = specialty;
    if (hospitalAffiliation !== undefined) updateData.hospitalAffiliation = hospitalAffiliation;
    if (status !== undefined) updateData.status = status;

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.doctor?._id || req.user?._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    return res.status(200).json({ success: true, data: updatedDoctor });
  }

  const { vehicleType, vehicleNumber, shiftTiming, status, phone } = req.body;
  
  const updateData = {};
  if (vehicleType !== undefined) updateData.vehicleType = vehicleType;
  if (vehicleNumber !== undefined) updateData.vehicleNumber = vehicleNumber;
  if (shiftTiming !== undefined) updateData.shiftTiming = shiftTiming;
  if (status !== undefined) updateData.status = status;
  if (phone !== undefined) updateData.phone = phone;

  const updatedLabAssistant = await LabAssistant.findByIdAndUpdate(
    req.labAssistant?._id || req.user?._id,
    { $set: updateData },
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

export const getProcessingQueue = asyncHandler(async (req, res) => {
  const samples = await Sample.find({
    status: { $in: ['At_Laboratory', 'Processing'] }
  })
  .populate({
    path: 'appointment',
    populate: { path: 'user', select: 'firstName lastName profilePicture' }
  })
  .populate('testCatalog')
  .sort({ updatedAt: -1 })
  .lean();

  res.status(200).json({ success: true, count: samples.length, data: samples });
});

export const startSampleProcessing = asyncHandler(async (req, res) => {
  const { sampleId } = req.params;
  const sample = await Sample.findById(sampleId);
  if (!sample) {
    res.status(404);
    throw new Error('Sample not found');
  }

  sample.status = 'Processing';
  sample.labProcessingStartTime = new Date();
  await sample.save();

  // Also update appointment if this is the first sample being processed
  await Appointment.findByIdAndUpdate(sample.appointment, {
    $set: { status: 'Processing' },
    $push: { trackingLogs: { status: 'Processing', timestamp: new Date() } }
  });

  res.status(200).json({ success: true, data: sample });
});

export const submitTestResults = asyncHandler(async (req, res) => {
  if (req.role !== 'doctor' && !req.doctor) {
    res.status(403);
    throw new Error('Access denied: Clinical test results and vitals can only be submitted by a Doctor, not a Lab Assistant.');
  }

  const { sampleId } = req.params;
  const { results, vitals } = req.body; // Array of { biomarker, value, isCritical } and optional full vitals

  const sample = await Sample.findById(sampleId);
  if (!sample) {
    res.status(404);
    throw new Error('Sample not found');
  }

  sample.structuredResults = Array.isArray(results) ? results : [];
  sample.status = 'Report_Generated';
  sample.resultsDone = true;
  sample.resultsStatus = 'Results Entered';
  sample.reportGenerationTime = new Date();
  await sample.save();

  // Determine if appointment is fully completed (all samples Report_Generated)
  const remainingSamples = await Sample.countDocuments({
    appointment: sample.appointment,
    status: { $ne: 'Report_Generated' }
  });

  if (remainingSamples === 0) {
    const updatedAppt = await Appointment.findByIdAndUpdate(sample.appointment, {
      $set: { status: 'Completed' },
      $push: { trackingLogs: { status: 'Completed', timestamp: new Date(), notes: 'All sample reports successfully generated and verified.' } }
    }, { new: true });

    if (updatedAppt && updatedAppt.user) {
      await User.findByIdAndUpdate(updatedAppt.user, { $set: { vitalsStatus: 'Lab_Verified' } });

      // Save/merge comprehensive vitals
      if (vitals && typeof vitals === 'object') {
        const cleanVitalsData = {
          user: updatedAppt.user,
          source: 'Lab_Assistant',
          isInitialBaseline: true,
          isVerifiedByUser: true,
          recordedAt: new Date(),
          bodyMetrics: vitals.bodyMetrics || {},
          continuousMetrics: vitals.continuousMetrics || {},
          metabolicHealth: vitals.metabolicHealth || {},
          cardiovascularRisk: vitals.cardiovascularRisk || {},
          immunology: vitals.immunology || {},
          hormones: vitals.hormones || {},
          organFunction: vitals.organFunction || {},
          micronutrients: vitals.micronutrients || {},
          geneticAndGut: vitals.geneticAndGut || {}
        };

        await Vitals.findOneAndUpdate(
          { user: updatedAppt.user, isInitialBaseline: true },
          { $set: cleanVitalsData },
          { upsert: true, new: true }
        );
      } else if (results && Array.isArray(results) && results.length > 0) {
        // Map any biomarkers from results
        const bodyMetrics = {};
        const metabolicHealth = {};
        const cardiovascularRisk = {};
        const continuousMetrics = {};
        const organFunction = {};
        const immunology = {};
        const hormones = {};
        const micronutrients = {};

        results.forEach(r => {
          const key = r.biomarker?.toLowerCase() || '';
          const val = Number(r.value);
          if (isNaN(val)) return;

          if (key.includes('glucose') || key.includes('sugar') || key.includes('fasting')) metabolicHealth.glucoseFasting = val;
          else if (key.includes('hba1c')) metabolicHealth.hba1c = val;
          else if (key.includes('systolic') || key.includes('bp systolic')) cardiovascularRisk.systolic = val;
          else if (key.includes('diastolic') || key.includes('bp diastolic')) cardiovascularRisk.diastolic = val;
          else if (key.includes('cholesterol') && !key.includes('hdl') && !key.includes('ldl')) cardiovascularRisk.totalCholesterol = val;
          else if (key.includes('ldl')) cardiovascularRisk.ldlCholesterol = val;
          else if (key.includes('hdl')) cardiovascularRisk.hdlCholesterol = val;
          else if (key.includes('triglyceride')) cardiovascularRisk.triglycerides = val;
          else if (key.includes('heart rate') || key.includes('pulse')) continuousMetrics.restingHeartRate = val;
          else if (key.includes('spo2') || key.includes('oxygen')) continuousMetrics.oxygenSaturationSpO2 = val;
          else if (key.includes('weight')) bodyMetrics.weightKg = val;
          else if (key.includes('height')) bodyMetrics.heightCm = val;
          else if (key.includes('creatinine')) organFunction.creatinine = val;
          else if (key.includes('uric acid')) organFunction.uricAcid = val;
          else if (key.includes('sgot') || key.includes('ast')) organFunction.astSgot = val;
          else if (key.includes('sgpt') || key.includes('alt')) organFunction.altSgpt = val;
          else if (key.includes('crp')) immunology.hsCRP = val;
          else if (key.includes('esr')) immunology.esr = val;
          else if (key.includes('ferritin')) immunology.ferritin = val;
          else if (key.includes('tsh')) hormones.tsh = val;
          else if (key.includes('vitamin d')) micronutrients.vitaminD3 = val;
          else if (key.includes('b12')) micronutrients.vitaminB12 = val;
        });

        await Vitals.findOneAndUpdate(
          { user: updatedAppt.user, isInitialBaseline: true },
          {
            $set: {
              user: updatedAppt.user,
              source: 'Lab_Assistant',
              isInitialBaseline: true,
              isVerifiedByUser: true,
              recordedAt: new Date(),
              bodyMetrics,
              metabolicHealth,
              cardiovascularRisk,
              continuousMetrics,
              organFunction,
              immunology,
              hormones,
              micronutrients
            }
          },
          { upsert: true, new: true }
        );
      }
    }
  }

  res.status(200).json({ success: true, data: sample });
});

// @desc    Get Lab Assistant Earnings and Shift History
// @route   GET /api/lab-assistant/earnings
// @access  Private (LabAssistant)
export const getEarnings = asyncHandler(async (req, res) => {
  try {
    const assistantId = req.labAssistant._id;

    // Assuming ₹100 per completed pickup
    const PAY_PER_PICKUP = 100;

    // Find all appointments where this assistant collected the samples. 
    const appointments = await Appointment.find({
      labAssistant: assistantId,
      status: { $in: ['Sample_Collected', 'At_Laboratory', 'Processing', 'Report_Generated', 'Completed'] }
    }).populate('user').sort({ scheduledDate: -1 });

    let totalEarnings = 0;
    let todaysEarnings = 0;
    const earningsHistory = [];

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    appointments.forEach(app => {
      // Determine the date
      const collectedDate = new Date(app.updatedAt);

      totalEarnings += PAY_PER_PICKUP;
      
      if (collectedDate >= startOfDay) {
        todaysEarnings += PAY_PER_PICKUP;
      }

      earningsHistory.push({
        id: app._id,
        patientName: (app.user?.firstName && app.user?.lastName) ? `${app.user.firstName} ${app.user.lastName}` : (app.user?.firstName || 'Unknown Patient'),
        amount: PAY_PER_PICKUP,
        date: collectedDate
      });
    });

    res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        todaysEarnings,
        completedPickups: appointments.length,
        history: earningsHistory
      }
    });
  } catch (error) {
    console.error('getEarnings ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update whether sample analyzer results are done or not
// @route   PUT /api/lab-assistant/samples/:sampleId/results-status
// @access  Private (LabAssistant)
export const updateSampleResultsStatus = asyncHandler(async (req, res) => {
  if (req.role !== 'doctor' && !req.doctor) {
    res.status(403);
    throw new Error('Access denied: The status of results can only be updated by a Doctor, not a Lab Assistant.');
  }

  const { sampleId } = req.params;
  const { resultsDone } = req.body;

  const sample = await Sample.findById(sampleId);
  if (!sample) {
    res.status(404);
    throw new Error('Sample not found');
  }

  sample.resultsDone = !!resultsDone;
  sample.resultsStatus = resultsDone ? 'Results Ready' : 'Res yet to be obtained';
  if (resultsDone && sample.status === 'At_Laboratory') {
    sample.status = 'Processing';
  }
  await sample.save();

  res.status(200).json({
    success: true,
    message: resultsDone
      ? 'Sample marked as results ready. You can enter vitals now.'
      : 'Sample marked as Res yet to be obtained.',
    sample
  });
});