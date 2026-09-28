import Vitals from '../models/Vitals.js';
import User from '../models/User.js';
import UserDraft from '../models/UserDraft.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { GoogleGenAI } from '@google/genai';
import { uploadToCloudinary } from '../configs/cloudinary.js';
import { calculateDerivedVitals, extractAIFeatureVector } from '../utils/aiFeatureExtractor.js';

// @desc    Add manual vitals for initial baseline or follow-up
// @route   POST /api/vitals/manual
// @access  Private (User)
export const addManualVitals = asyncHandler(async (req, res) => {
  const {
    bodyMetrics,
    metabolicHealth,
    cardiovascularRisk,
    continuousMetrics,
    hematology,
    organFunction,
    immunology,
    hormones,
    micronutrients,
    geneticAndGut,
  } = req.body;

  const user = await User.findById(req.user._id).lean();

  // Run automated clinical feature derivations
  const derivedPayload = calculateDerivedVitals(
    {
      bodyMetrics,
      metabolicHealth,
      cardiovascularRisk,
      continuousMetrics,
      hematology,
      organFunction,
      immunology,
      hormones,
      micronutrients,
      geneticAndGut,
    },
    user || {}
  );

  const vitals = await Vitals.create({
    user: req.user._id,
    source: 'Manual',
    isInitialBaseline: true,
    isVerifiedByUser: true,
    ...derivedPayload
  });

  await User.findByIdAndUpdate(req.user._id, { vitalsStatus: 'Manual' });

  // Clear health setup draft upon successful submission
  await UserDraft.deleteOne({ user: req.user._id, draftType: 'health_setup' });

  res.status(201).json({
    success: true,
    message: 'Manual vitals saved as baseline profile. Note: Manual entries are user-reported.',
    vitals,
  });
});

// @desc    Upload & Extract Medical Report (PDF or Photo) via AI without saving
// @route   POST /api/vitals/extract-report
// @access  Private (User)
export const extractReportVitals = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a PDF or image of your medical report');
  }

  let cloudResult = null;
  try {
    cloudResult = await uploadToCloudinary(req.file.buffer, 'medical_reports', 'auto');
  } catch (cloudErr) {
    console.warn('[Cloudinary] Report upload warning:', cloudErr.message);
  }

  let extractedText = "Document received.";
  let candidateData = {};

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are a clinical document parser for BioSync AI. Analyze this medical lab report / prescription image.
Extract all verified biomarkers. Return STRICTLY a valid JSON object matching these keys (all optional numbers, only include if clearly present):
{
  "height": number (in cm),
  "weight": number (in kg),
  "bmi": number,
  "bodyFatPercentage": number,
  "glucoseFasting": number (in mg/dL),
  "glucosePostPrandial": number (in mg/dL),
  "hba1c": number (in %),
  "insulin": number (in uIU/mL),
  "totalCholesterol": number (in mg/dL),
  "ldlCholesterol": number (in mg/dL),
  "hdlCholesterol": number (in mg/dL),
  "triglycerides": number (in mg/dL),
  "systolic": number (in mmHg),
  "diastolic": number (in mmHg),
  "restingHeartRate": number (in BPM),
  "hrv": number (in ms),
  "oxygenSaturationSpO2": number (in %),
  "hemoglobin": number (in g/dL),
  "hematocrit": number (in %),
  "rbc": number (in 10^6/uL),
  "platelets": number (in 10^3/uL),
  "wbc": number (in 10^3/uL),
  "neutrophilsPercent": number (in %),
  "lymphocytesPercent": number (in %),
  "creatinine": number (in mg/dL),
  "egfr": number (in mL/min),
  "bun": number (in mg/dL),
  "uricAcid": number (in mg/dL),
  "astSgot": number (in U/L),
  "altSgpt": number (in U/L),
  "ggt": number (in U/L),
  "hsCRP": number (in mg/L),
  "esr": number (in mm/hr),
  "ferritin": number (in ng/mL),
  "tsh": number (in uIU/mL),
  "vitaminD3": number (in ng/mL),
  "vitaminB12": number (in pg/mL)
}
Return only JSON. Do not include markdown codeblocks or other commentary.`;

      const mimeType = req.file.mimetype === 'application/pdf' ? 'application/pdf' : (req.file.mimetype || 'image/jpeg');

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          prompt,
          { inlineData: { data: req.file.buffer.toString("base64"), mimeType } },
        ],
        config: {
          responseMimeType: "application/json",
        },
      });

      const cleanJson = response.text.trim();
      candidateData = JSON.parse(cleanJson);
      extractedText = "Medical report successfully parsed with AI.";
    } catch (err) {
      console.error('[AI] Medical Report Extraction Error:', err.message);
      extractedText = "Automated extraction encountered an issue. You can review or manually input values.";
      candidateData = {};
    }
  }

  // Save progress as a draft so user never loses review state if interrupted
  await UserDraft.findOneAndUpdate(
    { user: req.user._id, draftType: 'pdf_upload' },
    {
      $set: {
        step: 2,
        totalSteps: 3,
        data: {
          candidateData,
          documentUrl: cloudResult?.secure_url || null,
          extractedSummary: extractedText
        },
        lastSaved: new Date()
      }
    },
    { upsert: true }
  );

  res.status(200).json({
    success: true,
    message: 'Medical report parsed. Please review and verify the extracted values before confirmation.',
    documentUrl: cloudResult?.secure_url || null,
    candidateData,
    extractedSummary: extractedText
  });
});

// @desc    Confirm & Save Extracted Medical Report Vitals after user review
// @route   POST /api/vitals/confirm-extracted
// @access  Private (User)
export const confirmExtractedVitals = asyncHandler(async (req, res) => {
  const {
    bodyMetrics,
    metabolicHealth,
    cardiovascularRisk,
    continuousMetrics,
    hematology,
    organFunction,
    immunology,
    hormones,
    micronutrients,
    geneticAndGut,
    documentUrl,
    pdfRawText
  } = req.body;

  const user = await User.findById(req.user._id).lean();

  const derivedPayload = calculateDerivedVitals(
    {
      bodyMetrics: bodyMetrics || {},
      metabolicHealth: metabolicHealth || {},
      cardiovascularRisk: cardiovascularRisk || {},
      continuousMetrics: continuousMetrics || {},
      hematology: hematology || {},
      organFunction: organFunction || {},
      immunology: immunology || {},
      hormones: hormones || {},
      micronutrients: micronutrients || {},
      geneticAndGut: geneticAndGut || {},
    },
    user || {}
  );

  const vitals = await Vitals.create({
    user: req.user._id,
    source: 'PDF_Scan',
    isInitialBaseline: true,
    isVerifiedByUser: true,
    documentUrl: documentUrl || '',
    pdfRawText: pdfRawText || 'User verified extracted report',
    ...derivedPayload
  });

  await User.findByIdAndUpdate(req.user._id, { vitalsStatus: 'PDF_Scanned' });

  // Clear PDF upload draft upon confirmation
  await UserDraft.deleteOne({ user: req.user._id, draftType: 'pdf_upload' });

  res.status(201).json({
    success: true,
    message: 'Verified report vitals successfully saved to your baseline health profile.',
    vitals
  });
});

// Legacy direct upload fallback
export const uploadPdfVitals = asyncHandler(async (req, res) => {
  return extractReportVitals(req, res);
});

// @desc    Get user's latest recorded vitals
// @route   GET /api/vitals/latest
// @access  Private (User)
export const getLatestVitals = asyncHandler(async (req, res) => {
  const vitals = await Vitals.findOne({ user: req.user._id })
    .sort({ recordedAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    vitals: vitals || null
  });
});

// @desc    Get paginated vitals history
// @route   GET /api/vitals/history
// @access  Private (User)
export const getVitalsHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;

  const vitalsList = await Vitals.find({ user: req.user._id })
    .sort({ recordedAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .lean();

  const total = await Vitals.countDocuments({ user: req.user._id });

  res.status(200).json({
    success: true,
    count: vitalsList.length,
    total,
    data: vitalsList
  });
});

// @desc    Get AI Feature Vector & Physiological Risk Classification
// @route   GET /api/vitals/ai-features/:userId?
// @access  Private (User or Authorized Staff)
export const getAIFeatureVector = asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId || req.user._id;

  const [user, latestVitals] = await Promise.all([
    User.findById(targetUserId).select('-password -otp').lean(),
    Vitals.findOne({ user: targetUserId }).sort({ recordedAt: -1 }).lean()
  ]);

  if (!latestVitals) {
    return res.status(200).json({
      success: true,
      hasData: false,
      message: 'No recorded vitals found for target user',
      features: null
    });
  }

  const aiFeatures = extractAIFeatureVector(latestVitals, user || {});

  res.status(200).json({
    success: true,
    hasData: true,
    ...aiFeatures
  });
});

// @desc    Get formatted time-series trends for interactive health charts
// @route   GET /api/vitals/trends
// @access  Private (User)
export const getVitalsTrends = asyncHandler(async (req, res) => {
  const { range = '30D' } = req.query;

  let fromDate = new Date();
  switch (range.toUpperCase()) {
    case '7D':
      fromDate.setDate(fromDate.getDate() - 7);
      break;
    case '30D':
      fromDate.setDate(fromDate.getDate() - 30);
      break;
    case '3M':
      fromDate.setMonth(fromDate.getMonth() - 3);
      break;
    case '6M':
      fromDate.setMonth(fromDate.getMonth() - 6);
      break;
    case '1Y':
      fromDate.setFullYear(fromDate.getFullYear() - 1);
      break;
    case 'ALL':
      fromDate = new Date(0);
      break;
    default:
      fromDate.setDate(fromDate.getDate() - 30);
  }

  const records = await Vitals.find({
    user: req.user._id,
    recordedAt: { $gte: fromDate }
  })
  .sort({ recordedAt: 1 })
  .lean();

  const glucoseSeries = [];
  const bpSeries = [];
  const heartRateSeries = [];
  const weightSeries = [];
  const spO2Series = [];
  const lipidSeries = [];
  const hematologySeries = [];
  const inflammationSeries = [];

  records.forEach(doc => {
    const timestamp = doc.recordedAt || doc.createdAt;
    const dateStr = new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (doc.metabolicHealth?.glucoseFasting || doc.metabolicHealth?.glucosePostPrandial) {
      glucoseSeries.push({
        date: dateStr,
        timestamp,
        fasting: doc.metabolicHealth.glucoseFasting || null,
        postPrandial: doc.metabolicHealth.glucosePostPrandial || null,
        hba1c: doc.metabolicHealth.hba1c || null,
        unit: 'mg/dL'
      });
    }

    if (doc.cardiovascularRisk?.systolic || doc.cardiovascularRisk?.diastolic) {
      bpSeries.push({
        date: dateStr,
        timestamp,
        systolic: doc.cardiovascularRisk.systolic || null,
        diastolic: doc.cardiovascularRisk.diastolic || null,
        map: doc.cardiovascularRisk.meanArterialPressure || null,
        pulsePressure: doc.cardiovascularRisk.pulsePressure || null,
        unit: 'mmHg'
      });
    }

    if (doc.continuousMetrics?.restingHeartRate) {
      heartRateSeries.push({
        date: dateStr,
        timestamp,
        restingHeartRate: doc.continuousMetrics.restingHeartRate,
        hrv: doc.continuousMetrics.hrv || null,
        unit: 'BPM'
      });
    }

    if (doc.bodyMetrics?.weightKg) {
      weightSeries.push({
        date: dateStr,
        timestamp,
        weightKg: doc.bodyMetrics.weightKg,
        bmi: doc.bodyMetrics.bmi || null,
        unit: 'kg'
      });
    }

    if (doc.continuousMetrics?.oxygenSaturationSpO2) {
      spO2Series.push({
        date: dateStr,
        timestamp,
        spO2: doc.continuousMetrics.oxygenSaturationSpO2,
        unit: '%'
      });
    }

    if (doc.cardiovascularRisk?.totalCholesterol || doc.cardiovascularRisk?.ldlCholesterol) {
      lipidSeries.push({
        date: dateStr,
        timestamp,
        totalCholesterol: doc.cardiovascularRisk.totalCholesterol || null,
        ldl: doc.cardiovascularRisk.ldlCholesterol || null,
        hdl: doc.cardiovascularRisk.hdlCholesterol || null,
        triglycerides: doc.cardiovascularRisk.triglycerides || null,
        aip: doc.cardiovascularRisk.atherogenicIndexPlasma || null,
        unit: 'mg/dL'
      });
    }

    if (doc.hematology?.hemoglobin || doc.hematology?.wbc) {
      hematologySeries.push({
        date: dateStr,
        timestamp,
        hemoglobin: doc.hematology.hemoglobin || null,
        wbc: doc.hematology.wbc || null,
        platelets: doc.hematology.platelets || null,
        nlr: doc.hematology.nlr || null,
        unit: 'g/dL'
      });
    }

    if (doc.immunology?.hsCRP) {
      inflammationSeries.push({
        date: dateStr,
        timestamp,
        hsCRP: doc.immunology.hsCRP,
        esr: doc.immunology.esr || null,
        unit: 'mg/L'
      });
    }
  });

  res.status(200).json({
    success: true,
    range,
    trends: {
      glucose: glucoseSeries,
      bloodPressure: bpSeries,
      heartRate: heartRateSeries,
      weight: weightSeries,
      spO2: spO2Series,
      lipids: lipidSeries,
      hematology: hematologySeries,
      inflammation: inflammationSeries
    }
  });
});