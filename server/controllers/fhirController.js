import Sample from '../models/Sample.js';
import User from '../models/User.js';
import Vitals from '../models/Vitals.js';
import Doctor from '../models/Doctor.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import {
  exportSampleToFhirBundle,
  exportVitalsToFhirBundle,
  buildFhirObservation,
  LOINC_METRIC_MAP,
} from '../services/fhirService.js';

// @desc    Export Certified Lab Report Sample as HL7 FHIR R4 Document Bundle
// @route   GET /api/fhir/sample/:sampleId/bundle
// @access  Public / Authorized (User, Doctor, or EHR Interop)
export const getSampleFhirBundle = asyncHandler(async (req, res) => {
  const { sampleId } = req.params;

  const sample = await Sample.findById(sampleId)
    .populate('appointment')
    .populate('testCatalog')
    .lean();

  if (!sample) {
    res.status(404);
    throw new Error('Diagnostic sample not found');
  }

  const userId = sample.user || sample.appointment?.user;
  const user = userId ? await User.findById(userId).lean() : null;

  const doctorId = sample.doctor || sample.appointment?.doctor;
  const doctor = doctorId ? await Doctor.findById(doctorId).lean() : null;

  const fhirBundle = exportSampleToFhirBundle({
    sample,
    user,
    doctor,
  });

  res.setHeader('Content-Type', 'application/fhir+json; charset=utf-8');
  res.status(200).json(fhirBundle);
});

// @desc    Export Patient Longitudinal Vitals & Observations as HL7 FHIR R4 Collection Bundle
// @route   GET /api/fhir/user/:userId/vitals-bundle
// @access  Private (User or Doctor or Admin)
export const getUserVitalsFhirBundle = asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId || req.user?._id;

  if (!targetUserId) {
    res.status(400);
    throw new Error('User identifier required');
  }

  const user = await User.findById(targetUserId).lean();
  if (!user) {
    res.status(404);
    throw new Error('Patient not found');
  }

  const vitalsRecords = await Vitals.find({ user: targetUserId })
    .sort({ recordedAt: -1, createdAt: -1 })
    .limit(50)
    .lean();

  const fhirBundle = exportVitalsToFhirBundle({
    user,
    vitalsRecords,
  });

  res.setHeader('Content-Type', 'application/fhir+json; charset=utf-8');
  res.status(200).json(fhirBundle);
});

// @desc    Get Current Logged-in User's Full FHIR R4 Health Passport Bundle
// @route   GET /api/fhir/my-bundle
// @access  Private (User)
export const getMyHealthPassportFhirBundle = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).lean();
  if (!user) {
    res.status(404);
    throw new Error('User profile not found');
  }

  const vitalsRecords = await Vitals.find({ user: req.user._id })
    .sort({ recordedAt: -1, createdAt: -1 })
    .limit(100)
    .lean();

  const fhirBundle = exportVitalsToFhirBundle({
    user,
    vitalsRecords,
  });

  res.setHeader('Content-Type', 'application/fhir+json; charset=utf-8');
  res.status(200).json(fhirBundle);
});

// @desc    Retrieve LOINC Code Glossary and Supported FHIR Biomarkers
// @route   GET /api/fhir/loinc-dictionary
// @access  Public
export const getLoincGlossary = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    totalBiomarkers: Object.keys(LOINC_METRIC_MAP).length,
    dictionary: LOINC_METRIC_MAP,
  });
});
