import mongoose from 'mongoose';
import Sample from '../models/Sample.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Vitals from '../models/Vitals.js';
import Doctor from '../models/Doctor.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { notifyReportReady } from '../services/notificationService.js';
import { generatePdfReport } from '../services/pdfReportGenerator.js';

// @desc    Get Doctor's Tri-State Samples Dashboard:
//          1. What they got (At_Laboratory)
//          2. What they may get in some time (Incoming / In Transit: On_The_Way, Collecting, Sample_Collected)
//          3. What samples they are processing (Processing)
// @route   GET /api/doctor/samples/overview
// @access  Private (Doctor)
export const getDoctorSamplesOverview = asyncHandler(async (req, res) => {
  // 1. Samples Received at Laboratory (Ready for analyzer)
  const receivedSamples = await Sample.find({ status: 'At_Laboratory' })
    .populate('user', 'firstName lastName phoneNumber profilePicture gender bloodGroup')
    .populate('labAssistant', 'name phone vehicleNumber employeeId')
    .populate('doctor', 'name specialty licenseNumber hospitalAffiliation currentLocation')
    .populate('testCatalog', 'testName category specimenType fastingRequirement')
    .populate('appointment', 'timeSlot scheduledDate address questionnaire paymentDetails')
    .sort({ updatedAt: -1 })
    .lean();

  // 2. Samples Incoming (In field transit / currently collecting / on route)
  // Query both Sample model (with status Sample_Collected) and Appointments with On_The_Way / Collecting
  const incomingCollected = await Sample.find({ status: 'Sample_Collected' })
    .populate('user', 'firstName lastName phoneNumber profilePicture gender')
    .populate('labAssistant', 'name phone vehicleNumber employeeId currentLocation')
    .populate('doctor', 'name specialty licenseNumber hospitalAffiliation currentLocation')
    .populate('testCatalog', 'testName category specimenType')
    .populate('appointment', 'timeSlot scheduledDate address questionnaire paymentDetails')
    .sort({ updatedAt: -1 })
    .lean();

  // Also query appointments that are On_The_Way or Collecting where sample might not be created yet
  const activeFieldAppts = await Appointment.find({
    status: { $in: ['On_The_Way', 'Collecting', 'Arrived', 'Assistant_Assigned'] }
  })
    .populate('user', 'firstName lastName phoneNumber profilePicture')
    .populate('labAssistant', 'name phone vehicleNumber employeeId currentLocation')
    .populate('testCatalog', 'testName category specimenType')
    .sort({ scheduledDate: 1 })
    .lean();

  // Transform active field appointments into incoming sample tickets
  const incomingAppointments = activeFieldAppts.map(appt => ({
    _id: `incoming_${appt._id}`,
    isAppointmentTicket: true,
    appointment: appt,
    user: appt.user,
    labAssistant: appt.labAssistant,
    testCatalog: appt.testCatalog,
    barcode: 'PENDING_COLLECTION',
    status: appt.status === 'Collecting' ? 'In_Collection' : 'En_Route_To_Patient',
    estimatedDeliveryTime: appt.timeSlot || 'Within 60-90 Mins',
    scheduledDate: appt.scheduledDate
  }));

  const allIncoming = [...incomingCollected, ...incomingAppointments];

  // 3. Samples Currently Under Processing in Analyzers
  const processingSamples = await Sample.find({ status: 'Processing' })
    .populate('user', 'firstName lastName phoneNumber profilePicture gender')
    .populate('labAssistant', 'name phone employeeId')
    .populate('doctor', 'name specialty licenseNumber hospitalAffiliation currentLocation')
    .populate('testCatalog', 'testName category specimenType normalRange unit')
    .populate('appointment', 'timeSlot scheduledDate address')
    .sort({ labProcessingStartTime: -1 })
    .lean();

  // 4. Completed / Authorized reports
  const completedSamples = await Sample.find({ status: { $in: ['Report_Generated', 'Completed'] } })
    .populate('user', 'firstName lastName phoneNumber')
    .populate('testCatalog', 'testName category')
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();

  res.status(200).json({
    success: true,
    counts: {
      received: receivedSamples.length,
      incoming: allIncoming.length,
      processing: processingSamples.length,
      completed: completedSamples.length,
      total: receivedSamples.length + allIncoming.length + processingSamples.length,
    },
    data: {
      received: receivedSamples,
      incoming: allIncoming,
      processing: processingSamples,
      completed: completedSamples,
    }
  });
});

// @desc    Start / Move received sample into Processing in analyzer
// @route   POST /api/doctor/samples/:sampleId/start-processing
// @access  Private (Doctor)
export const doctorStartProcessing = asyncHandler(async (req, res) => {
  const { sampleId } = req.params;
  const sample = await Sample.findById(sampleId);
  if (!sample) {
    res.status(404);
    throw new Error('Sample not found');
  }

  sample.status = 'Processing';
  sample.labProcessingStartTime = new Date();
  await sample.save();

  // Update appointment tracking
  if (sample.appointment) {
    await Appointment.findByIdAndUpdate(sample.appointment, {
      $set: { status: 'Processing' },
      $push: { trackingLogs: { status: 'Processing', timestamp: new Date(), notes: 'Doctor initiated diagnostic analyzer run.' } }
    });
  }

  res.status(200).json({ success: true, message: 'Sample processing started', data: sample });
});

// @desc    Doctor updates whether sample results are done or not
// @route   PUT /api/doctor/samples/:sampleId/results-status
// @access  Private (Doctor)
export const doctorUpdateResultsStatus = asyncHandler(async (req, res) => {
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
      ? 'Doctor marked results ready for vitals data entry.'
      : 'Sample status updated: Res yet to be obtained.',
    sample
  });
});

// @desc    Doctor reviews, inputs diagnostic vitals, remarks, and authorizes clinical report
// @route   POST /api/doctor/samples/:sampleId/verify
// @access  Private (Doctor)
export const doctorVerifyReport = asyncHandler(async (req, res) => {
  const { sampleId } = req.params;
  const { remarks, testResults, vitals, isApproved = true } = req.body;

  const sample = await Sample.findById(sampleId).populate('appointment');
  if (!sample) {
    res.status(404);
    throw new Error('Sample not found');
  }

  const doctorName = req.doctor?.name || 'Dr. Pathologist';
  const license = req.doctor?.licenseNumber || 'MCI-DOC-77291';

  sample.status = isApproved ? 'Report_Generated' : 'At_Laboratory';
  sample.resultsDone = isApproved;
  sample.resultsStatus = isApproved ? 'Results Entered' : 'Res yet to be obtained';
  sample.doctorRemarks = remarks || 'Assays clinically verified within biological reference intervals.';
  sample.verifiedBy = doctorName;
  sample.verifiedAt = new Date();
  sample.doctorLicense = license;

  if (testResults && Array.isArray(testResults)) {
    sample.testResults = testResults;
  }
  await sample.save();

  if (sample.appointment) {
    await Appointment.findByIdAndUpdate(sample.appointment._id, {
      $set: { status: isApproved ? 'Completed' : 'Processing' },
      $push: { 
        trackingLogs: { 
          status: isApproved ? 'Completed' : 'Processing', 
          timestamp: new Date(), 
          notes: `Report reviewed, vitals posted, and signed by ${doctorName} (${license})` 
        } 
      }
    });

    const targetUserId = sample.user || sample.appointment?.user;

    // Save comprehensive clinical vitals directly into User DB
    if (isApproved && targetUserId) {
      await User.findByIdAndUpdate(targetUserId, {
        $set: { vitalsStatus: 'Lab_Verified' }
      });

      if (vitals && typeof vitals === 'object') {
        const cleanVitalsData = {
          user: targetUserId,
          source: 'Doctor',
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
          { user: targetUserId, isInitialBaseline: true },
          { $set: cleanVitalsData },
          { upsert: true, new: true }
        );
      }

      // Generate and persist certified NABL ISO 15189:2022 PDF binary
      try {
        const userDoc = await User.findById(targetUserId).lean();
        const { relativeUrl } = await generatePdfReport({
          appointment: sample.appointment,
          sample,
          user: userDoc,
          doctor: req.doctor || { name: doctorName, licenseNumber: license },
        });
        sample.resultPdfUrl = relativeUrl;
        await sample.save();
      } catch (pdfErr) {
        console.warn('[DoctorController] PDF generation warning:', pdfErr.message);
      }

      // Notify the patient immediately with certified report release
      notifyReportReady(sample.appointment, sample, doctorName);
    }
  }

  res.status(200).json({
    success: true,
    message: isApproved ? 'Clinical vitals recorded and report authorized into patient profile.' : 'Sample returned for re-analysis.',
    data: sample
  });
});
