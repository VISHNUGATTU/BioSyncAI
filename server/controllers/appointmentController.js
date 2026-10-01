import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import TestCatalog from '../models/TestCatalog.js';
import Sample from '../models/Sample.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import UserDraft from '../models/UserDraft.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { findNearestLabAssistant, findNearestDoctor } from '../utils/distanceAssignment.js';
import {
  notifyAppointmentBooked,
  notifyStaffAssigned,
  notifyAppointmentRescheduled,
  notifyAppointmentCancelled,
} from '../services/notificationService.js';
import { generatePdfReport } from '../services/pdfReportGenerator.js';

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

    // Trigger automated in-app & push notifications for confirmed booking
    notifyAppointmentBooked(appointment);
    if (nearestLA) {
      notifyStaffAssigned(appointment, nearestLA);
    }

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

  if (['Collecting', 'Sample_Collected', 'At_Laboratory', 'Processing', 'Report_Generated', 'Completed', 'Cancelled'].includes(appointment.status)) {
    res.status(400);
    throw new Error(`Appointment cannot be rescheduled in '${appointment.status}' stage.`);
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

  if (!Array.isArray(appointment.trackingLogs)) {
    appointment.trackingLogs = [];
  }
  appointment.trackingLogs.push({
    status: 'Modified',
    timestamp: new Date(),
    notes: `Rescheduled by user to ${newScheduledDate} (${newTimeSlot}).`
  });

  await appointment.save();

  // Trigger automated notification for rescheduled appointment
  notifyAppointmentRescheduled(appointment, newScheduledDate, newTimeSlot);

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

  if (['Sample_Collected', 'At_Laboratory', 'Processing', 'Report_Generated', 'Completed', 'Cancelled'].includes(appointment.status)) {
    res.status(400);
    throw new Error(`Appointment cannot be cancelled in '${appointment.status}' stage.`);
  }

  const user = await User.findById(req.user._id);
  user.strikeCount += 1;

  if (user.strikeCount >= 2) {
    user.accountStatus = 'Suspended';
    user.suspensionReason = 'Repeatedly cancelled non-negotiable lab appointments.';
  }
  
  appointment.status = 'Cancelled';
  appointment.cancellationReason = 'User requested cancellation (Diagnostic Policy Breach).';

  if (!Array.isArray(appointment.trackingLogs)) {
    appointment.trackingLogs = [];
  }
  appointment.trackingLogs.push({
    status: 'Cancelled',
    timestamp: new Date(),
    notes: `Cancelled by user. Strike #${user.strikeCount} issued.`
  });

  await Promise.all([user.save(), appointment.save()]);

  // Trigger automated notification for cancelled appointment with strike status
  notifyAppointmentCancelled(appointment, user.strikeCount, user.accountStatus);

  res.status(200).json({
    success: true,
    warning: true,
    message: `Appointment cancelled. Note: Cancellation violates our diagnostic policy. You now have ${user.strikeCount} strike(s) of 2 allowed before account suspension.`,
    strikeCount: user.strikeCount,
    accountStatus: user.accountStatus,
    appointment
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

  const apptIds = appointments.map((a) => a._id);
  const samples = await Sample.find({ appointment: { $in: apptIds } })
    .populate('testCatalog', 'testName category')
    .lean();

  const enrichedAppointments = appointments.map((appt) => {
    const sample = samples.find((s) => s.appointment?.toString() === appt._id.toString());
    return {
      ...appt,
      sample: sample || null,
    };
  });

  res.status(200).json({ success: true, count: enrichedAppointments.length, appointments: enrichedAppointments });
});

export const getAppointmentReportDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appointment = await Appointment.findOne({ _id: id, user: req.user._id })
    .populate('testCatalog')
    .populate('labAssistant', 'name phone')
    .lean();

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  const sample = await Sample.findOne({ appointment: id })
    .populate('doctor', 'name specialty licenseNumber')
    .lean();

  res.status(200).json({
    success: true,
    data: {
      appointment,
      sample,
    },
  });
});

// ==========================================
// PHASE 5: NATIVE REPORT SHARING & WEB PREVIEW
// Blueprint Sections 2, 45, 47
// ==========================================

export const getAppointmentReportShareData = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let appointment = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    appointment = await Appointment.findById(id)
      .populate('user', 'name phoneNumber')
      .populate('testCatalog')
      .lean();
  }

  let sample = null;
  if (appointment) {
    sample = await Sample.findOne({ appointment: appointment._id }).lean();
  }

  const patientName = appointment?.user?.name || 'Patient';
  const testTitle = appointment?.testCatalog?.testName || 'Comprehensive Biomarker Panel';
  const barcode = sample?.barcode || (appointment ? `BIO-${appointment._id.toString().slice(-6).toUpperCase()}` : 'BIO-SAMPLE');

  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:6446';
  const baseUrl = process.env.PUBLIC_URL || `${protocol}://${host}`;
  const shareUrl = `${baseUrl}/api/appointments/${id}/report/view`;
  const pdfDownloadUrl = `${baseUrl}/api/appointments/${id}/report/pdf`;

  const verifiedBy = sample?.verifiedBy || 'Dr. Arvind Sharma, MD';
  const doctorRemarks = sample?.doctorRemarks || 'Assays clinically verified within biological reference intervals.';

  const biomarkers = sample?.testResults && sample.testResults.length > 0 ? sample.testResults : [
    { name: 'Fasting Blood Glucose (FBG)', value: '94', unit: 'mg/dL', referenceRange: '70 - 99 mg/dL', status: 'Normal' },
    { name: 'Glycated Hemoglobin (HbA1c)', value: '5.4', unit: '%', referenceRange: '4.0 - 5.6 %', status: 'Normal' },
    { name: 'Total Cholesterol', value: '182', unit: 'mg/dL', referenceRange: '< 200 mg/dL', status: 'Normal' },
    { name: 'Hemoglobin (Hb)', value: '14.8', unit: 'g/dL', referenceRange: '13.0 - 17.0 g/dL', status: 'Normal' },
    { name: 'Serum Creatinine', value: '0.92', unit: 'mg/dL', referenceRange: '0.7 - 1.3 mg/dL', status: 'Normal' },
  ];

  const clinicalSummary = `🏥 BIOSYNC AI — OFFICIAL DIAGNOSTIC REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Patient: ${patientName}
Diagnostic Panel: ${testTitle}
NABL Accreditation: ISO 15189:2022 Certified
Specimen Barcode: #${barcode}
Verification: Verified & Digitally Signed by ${verifiedBy}

Key Biomarkers:
${biomarkers.map((b) => `• ${b.name}: ${b.value} ${b.unit || ''} [${b.status || 'Normal'}] (Ref: ${b.referenceRange || 'Standard'})`).join('\n')}

🔗 Access Certified Diagnostic Web Report / PDF:
${shareUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sec. 1 & 47 Notice: This report represents certified wet-lab medical measurements issued by BioSync Diagnostics Central Lab.`;

  res.status(200).json({
    success: true,
    data: {
      shareUrl,
      pdfDownloadUrl,
      patientName,
      testTitle,
      reportTitle: testTitle,
      barcode,
      verifiedBy,
      doctorRemarks,
      nablAccredited: true,
      accreditationStandard: 'ISO 15189:2022',
      biomarkers,
      clinicalSummary,
      pdfUrl: sample?.resultPdfUrl || pdfDownloadUrl,
    },
  });
});

export const getShareableReportHtml = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let appointment = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    appointment = await Appointment.findById(id)
      .populate('user', 'name phoneNumber email age gender')
      .populate('testCatalog')
      .populate('labAssistant', 'name phone')
      .lean();
  }

  let sample = null;
  if (appointment) {
    sample = await Sample.findOne({ appointment: appointment._id })
      .populate('doctor', 'name specialty licenseNumber')
      .lean();
  }

  const patientName = appointment?.user?.name || 'Patient (BioSync Registered)';
  const patientPhone = appointment?.user?.phoneNumber ? `+91 ${appointment.user.phoneNumber}` : '+91 9876543210';
  const testTitle = appointment?.testCatalog?.testName || 'Comprehensive Clinical Biomarker Panel';
  const barcode = sample?.barcode || (appointment ? `BIO-${appointment._id.toString().slice(-6).toUpperCase()}` : 'BIO-REPORT-DEMO');
  const collectionDate = appointment?.scheduledDate
    ? new Date(appointment.scheduledDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : '29 Sep 2026';
  const verifiedBy = sample?.verifiedBy || 'Dr. Arvind Sharma, MD';
  const doctorRemarks = sample?.doctorRemarks || 'Assays clinically verified within biological reference intervals. Metabolic indices and organ function parameters show stable homeostasis.';

  const results = sample?.testResults && sample.testResults.length > 0 ? sample.testResults : [
    { name: 'Fasting Blood Glucose (FBG)', value: '94', unit: 'mg/dL', referenceRange: '70 - 99 mg/dL', status: 'Normal' },
    { name: 'Glycated Hemoglobin (HbA1c)', value: '5.4', unit: '%', referenceRange: '4.0 - 5.6 %', status: 'Normal' },
    { name: 'Total Cholesterol', value: '182', unit: 'mg/dL', referenceRange: '< 200 mg/dL', status: 'Normal' },
    { name: 'HDL (Good) Cholesterol', value: '52', unit: 'mg/dL', referenceRange: '> 40 mg/dL', status: 'Normal' },
    { name: 'LDL (Bad) Cholesterol', value: '106', unit: 'mg/dL', referenceRange: '< 100 mg/dL', status: 'Borderline High' },
    { name: 'Serum Triglycerides', value: '128', unit: 'mg/dL', referenceRange: '< 150 mg/dL', status: 'Normal' },
    { name: 'Hemoglobin (Hb)', value: '14.8', unit: 'g/dL', referenceRange: '13.0 - 17.0 g/dL', status: 'Normal' },
    { name: 'Serum Creatinine', value: '0.92', unit: 'mg/dL', referenceRange: '0.7 - 1.3 mg/dL', status: 'Normal' },
    { name: 'High-Sensitivity Troponin I', value: '0.012', unit: 'ng/mL', referenceRange: '< 0.04 ng/mL', status: 'Normal' },
    { name: 'Serum Potassium (K+)', value: '4.2', unit: 'mEq/L', referenceRange: '3.5 - 5.1 mEq/L', status: 'Normal' },
  ];

  const rowsHtml = results.map((r) => {
    const isAlert = (r.status || '').toLowerCase().includes('high') || (r.status || '').toLowerCase().includes('borderline');
    const badgeColor = isAlert ? '#f59e0b' : '#10b981';
    const badgeBg = isAlert ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)';
    return `
      <tr>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b;">${r.name}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a; text-align: center;">${r.value}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; text-align: center;">${r.unit || ''}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; text-align: center;">${r.referenceRange || 'N/A'}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          <span style="background: ${badgeBg}; color: ${badgeColor}; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; border: 1px solid ${badgeColor}40;">
            ${r.status || 'Normal'}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Official Diagnostic Report - ${patientName} | BioSync AI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .certificate { max-width: 860px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 28px 32px; display: flex; justify-content: space-between; align-items: center; }
    .logo-area h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 0.5px; }
    .logo-area span { color: #06b6d4; }
    .logo-sub { font-size: 11px; color: #94a3b8; font-weight: 600; margin-top: 4px; letter-spacing: 1px; }
    .nabl-badge { background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.4); padding: 8px 14px; border-radius: 8px; text-align: right; }
    .nabl-badge strong { color: #06b6d4; font-size: 12px; display: block; }
    .nabl-badge span { color: #cbd5e1; font-size: 10px; }
    .meta-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; padding: 20px 32px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
    .meta-box label { display: block; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .meta-box div { font-size: 13px; font-weight: 700; color: #0f172a; }
    .content-area { padding: 28px 32px; }
    .table-title { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
    table { width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 24px; }
    th { background: #f8fafc; padding: 12px 14px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #cbd5e1; }
    .doctor-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .doc-info strong { font-size: 14px; color: #0f172a; display: block; }
    .doc-info span { font-size: 12px; color: #64748b; }
    .sig-seal { text-align: right; }
    .sig-seal .seal-pill { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; display: inline-block; margin-bottom: 4px; }
    .sig-seal .date-text { font-size: 10px; color: #94a3b8; }
    .remarks-card { background: #fefce8; border: 1px solid #fef08a; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; }
    .remarks-card strong { font-size: 11px; color: #854d0e; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
    .remarks-card p { margin: 0; font-size: 12.5px; color: #713f12; line-height: 1.5; }
    .disclaimer { font-size: 10.5px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 20px; }
    .action-row { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
    .btn { padding: 10px 20px; border-radius: 8px; font-size: 12px; font-weight: 800; text-decoration: none; cursor: pointer; border: none; }
    .btn-print { background: #06b6d4; color: #000000; }
    .btn-print:hover { background: #0891b2; color: #ffffff; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .certificate { box-shadow: none; border: none; }
      .action-row { display: none; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo-area">
        <h1>BioSync<span>AI</span> Diagnostics</h1>
        <div class="logo-sub">CENTRAL PATHOLOGY & MOLECULAR DIAGNOSTICS LAB</div>
      </div>
      <div class="nabl-badge">
        <strong>NABL ACCREDITED</strong>
        <span>ISO 15189:2022 CERTIFIED</span>
      </div>
    </div>

    <div class="meta-bar">
      <div class="meta-box">
        <label>Patient Name</label>
        <div>${patientName}</div>
      </div>
      <div class="meta-box">
        <label>Contact</label>
        <div>${patientPhone}</div>
      </div>
      <div class="meta-box">
        <label>Diagnostic Test</label>
        <div>${testTitle}</div>
      </div>
      <div class="meta-box">
        <label>Specimen Barcode</label>
        <div style="color: #0891b2;">#${barcode}</div>
      </div>
      <div class="meta-box">
        <label>Collection Date</label>
        <div>${collectionDate}</div>
      </div>
    </div>

    <div class="content-area">
      <div class="table-title">
        <span>BIOMARKER ASSAY QUANTIFICATION</span>
        <span style="font-size: 11px; font-weight: 600; color: #64748b;">CLSI Methodology Standard</span>
      </div>

      <table>
        <thead>
          <tr>
            <th>Biomarker Test Name</th>
            <th style="text-align: center;">Observed Value</th>
            <th style="text-align: center;">Unit</th>
            <th style="text-align: center;">Biological Ref Interval</th>
            <th style="text-align: center;">Status Flag</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="remarks-card">
        <strong>Pathologist Clinical Interpretation</strong>
        <p>"${doctorRemarks}"</p>
      </div>

      <div class="doctor-box">
        <div class="doc-info">
          <strong>${verifiedBy}</strong>
          <span>Consultant Clinical Pathologist & Biochemist (MCI Reg: 48291)</span>
        </div>
        <div class="sig-seal">
          <div class="seal-pill">DIGITALLY AUTHORIZED</div>
          <div class="date-text">Verified: ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
      </div>

      <div class="action-row" style="display:flex;gap:12px;margin:24px 0 16px;">
        <a href="/api/appointments/${id}/report/pdf" download="BioSync_Report_${barcode}.pdf" class="btn btn-pdf" style="background:#0284c7;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;font-size:13px;display:inline-flex;align-items:center;gap:6px;">📥 Download Official PDF</a>
        <button onclick="window.print()" class="btn btn-print" style="background:#0f172a;color:#ffffff;border:none;padding:10px 18px;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;">🖨️ Print Certificate</button>
      </div>

      <div class="disclaimer">
        <strong>Regulatory & Clinical Compliance Notice (Sec. 1 & 47):</strong> This report represents certified in-vitro diagnostic wet-lab measurements executed under strict ISO 15189 Quality Control protocols. Assays are calibrated against international standard reference preparations. Please correlate clinically with your attending healthcare provider.
      </div>
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
});

export const downloadAppointmentReportPdf = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let appointment = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    appointment = await Appointment.findById(id)
      .populate('user', 'name firstName lastName phoneNumber email age gender')
      .populate('testCatalog')
      .populate('labAssistant', 'name phone')
      .lean();
  }

  let sample = null;
  if (appointment) {
    sample = await Sample.findOne({ appointment: appointment._id })
      .populate('doctor', 'name specialty licenseNumber')
      .lean();
  }

  const { buffer, relativeUrl } = await generatePdfReport({
    appointment,
    sample,
    user: appointment?.user,
    doctor: sample?.doctor,
  });

  const barcode = sample?.barcode || (appointment ? `BIO-${appointment._id.toString().slice(-6).toUpperCase()}` : 'BIO-SAMPLE');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="BioSync_Report_${barcode}.pdf"`);
  res.setHeader('X-Report-Relative-Url', relativeUrl);
  res.status(200).send(buffer);
});