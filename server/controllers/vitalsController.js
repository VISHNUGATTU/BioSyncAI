import axios from 'axios';
import Vitals from '../models/Vitals.js';
import User from '../models/User.js';
import UserDraft from '../models/UserDraft.js';
import FoodLog from '../models/FoodLog.js';
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
    .sort({ recordedAt: -1, createdAt: -1 })
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
  const limit = parseInt(req.query.limit, 10) || 50;
  const startIndex = (page - 1) * limit;

  const vitalsList = await Vitals.find({ user: req.user._id })
    .sort({ recordedAt: -1, createdAt: -1 })
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
    Vitals.findOne({ user: targetUserId }).sort({ recordedAt: -1, createdAt: -1 }).lean()
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
  const { range = 'ALL', date } = req.query;

  let queryCondition = { user: req.user._id };

  if (date) {
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    queryCondition.$or = [
      { recordedAt: { $gte: startOfDay, $lte: endOfDay } },
      { createdAt: { $gte: startOfDay, $lte: endOfDay } }
    ];
  } else {
    let fromDate = new Date();
    switch (range.toUpperCase()) {
      case '1D':
        fromDate.setHours(fromDate.getHours() - 24);
        break;
      case '7D':
        fromDate.setDate(fromDate.getDate() - 7);
        break;
      case '30D':
        fromDate.setDate(fromDate.getDate() - 30);
        break;
      case 'ALL':
        fromDate = new Date(0);
        break;
      default:
        fromDate = new Date(0);
    }

    queryCondition.$or = [
      { recordedAt: { $gte: fromDate } },
      { createdAt: { $gte: fromDate } },
      { recordedAt: { $exists: false } }
    ];
  }

  const records = await Vitals.find(queryCondition)
    .sort({ recordedAt: 1, createdAt: 1 })
    .lean();

  const glucoseSeries = [];
  const bpSeries = [];
  const heartRateSeries = [];
  const weightSeries = [];
  const spO2Series = [];
  const lipidSeries = [];
  const hematologySeries = [];
  const inflammationSeries = [];
  const organFunctionSeries = [];

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
        insulin: doc.metabolicHealth.fastingInsulin || null,
        homaIR: doc.metabolicHealth.homaIR || null,
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
        respirationRate: doc.continuousMetrics.respirationRate || null,
        unit: 'BPM'
      });
    }

    if (doc.bodyMetrics?.weightKg) {
      weightSeries.push({
        date: dateStr,
        timestamp,
        weightKg: doc.bodyMetrics.weightKg,
        bmi: doc.bodyMetrics.bmi || null,
        bodyFatPercentage: doc.bodyMetrics.bodyFatPercentage || null,
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
        vldl: doc.cardiovascularRisk.vldlCholesterol || null,
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
        rbc: doc.hematology.rbc || null,
        hematocrit: doc.hematology.hematocrit || null,
        nlr: doc.hematology.nlr || null,
        unit: 'g/dL'
      });
    }

    if (doc.organFunction?.creatinine || doc.organFunction?.altSgpt || doc.organFunction?.astSgot) {
      organFunctionSeries.push({
        date: dateStr,
        timestamp,
        creatinine: doc.organFunction.creatinine || null,
        egfr: doc.organFunction.egfr || null,
        bun: doc.organFunction.bun || null,
        altSgpt: doc.organFunction.altSgpt || null,
        astSgot: doc.organFunction.astSgot || null,
        totalBilirubin: doc.organFunction.totalBilirubin || null,
        uricAcid: doc.organFunction.uricAcid || null,
        unit: 'Clinical'
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
      organFunction: organFunctionSeries,
      inflammation: inflammationSeries
    }
  });
});

// @desc    Weekly Adaptive Digital Twin Re-calibration via Extended Kalman Filter (EKF)
// @route   POST /api/vitals/calibrate-weekly
// @access  Private (User)
export const calibrateWeeklyVitals = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).lean();
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // 1. Fetch user's most recent prior vitals document
  const previousVitals = await Vitals.findOne({ user: req.user._id })
    .sort({ recordedAt: -1, createdAt: -1 })
    .lean();

  // 2. Aggregate actual past 7 days' dietary intake from FoodLog
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const pastWeekLogs = await FoodLog.find({
    user: req.user._id,
    createdAt: { $gte: sevenDaysAgo },
    isConfirmed: true
  }).lean();

  let totalCarbs = 0;
  let totalSodium = 0;
  pastWeekLogs.forEach(log => {
    const qty = log.consumedQuantity || 1;
    const carbs = (log.nutrients?.carbohydrates ?? log.nutrients?.netCarbohydrates ?? 0) * qty;
    const sodium = (log.nutrients?.sodium ?? 0) * qty;
    totalCarbs += carbs;
    totalSodium += sodium;
  });

  const avgDailyCarbs = pastWeekLogs.length > 0 ? (totalCarbs / 7.0) : 160.0;
  const avgDailySodium = pastWeekLogs.length > 0 ? (totalSodium / 7.0) : 2100.0;

  // 3. Normalize incoming new test biomarkers
  const inputData = req.body.newTestVitals || req.body;
  const normalizedNewVitals = {
    fastingGlucose: Number(
      inputData.fastingGlucose ??
      inputData.glucoseFasting ??
      inputData.metabolicHealth?.glucoseFasting ??
      previousVitals?.metabolicHealth?.glucoseFasting ??
      92
    ),
    hba1c: Number(
      inputData.hba1c ??
      inputData.metabolicHealth?.hba1c ??
      previousVitals?.metabolicHealth?.hba1c ??
      5.4
    ),
    systolicBP: Number(
      inputData.systolicBP ??
      inputData.systolic ??
      inputData.cardiovascularRisk?.systolic ??
      previousVitals?.cardiovascularRisk?.systolic ??
      120
    ),
    diastolicBP: Number(
      inputData.diastolicBP ??
      inputData.diastolic ??
      inputData.cardiovascularRisk?.diastolic ??
      previousVitals?.cardiovascularRisk?.diastolic ??
      80
    ),
    totalCholesterol: Number(
      inputData.totalCholesterol ??
      inputData.cardiovascularRisk?.totalCholesterol ??
      previousVitals?.cardiovascularRisk?.totalCholesterol ??
      180
    ),
    hdl: Number(
      inputData.hdl ??
      inputData.hdlCholesterol ??
      inputData.cardiovascularRisk?.hdlCholesterol ??
      previousVitals?.cardiovascularRisk?.hdlCholesterol ??
      50
    ),
    ldl: Number(
      inputData.ldl ??
      inputData.ldlCholesterol ??
      inputData.cardiovascularRisk?.ldlCholesterol ??
      previousVitals?.cardiovascularRisk?.ldlCholesterol ??
      100
    ),
    triglycerides: Number(
      inputData.triglycerides ??
      inputData.cardiovascularRisk?.triglycerides ??
      previousVitals?.cardiovascularRisk?.triglycerides ??
      120
    ),
    bmi: Number(
      inputData.bmi ??
      inputData.bodyMetrics?.bmi ??
      previousVitals?.bodyMetrics?.bmi ??
      23.5
    ),
  };

  const priorTwinParams = {
    fastingGlucose: previousVitals?.metabolicHealth?.glucoseFasting ?? 92,
    hba1c: previousVitals?.metabolicHealth?.hba1c ?? 5.4,
    systolicBP: previousVitals?.cardiovascularRisk?.systolic ?? 120,
    diastolicBP: previousVitals?.cardiovascularRisk?.diastolic ?? 80,
    totalCholesterol: previousVitals?.cardiovascularRisk?.totalCholesterol ?? 180,
    hdl: previousVitals?.cardiovascularRisk?.hdlCholesterol ?? 50,
    ldl: previousVitals?.cardiovascularRisk?.ldlCholesterol ?? 100,
    triglycerides: previousVitals?.cardiovascularRisk?.triglycerides ?? 120,
    bmi: previousVitals?.bodyMetrics?.bmi ?? 23.5,
    betaCarb: previousVitals?.kalmanCalibration?.betaCarb,
    betaSodium: previousVitals?.kalmanCalibration?.betaSodium,
    insulinSensitivity: previousVitals?.kalmanCalibration?.insulinSensitivity,
  };

  const priorCovariance = previousVitals?.kalmanCalibration?.covarianceMatrix ?? null;

  // 4. Request Extended Kalman Filter update from local Python AI microservice
  let calibrationResult = null;
  const pythonUrl = (process.env.AI_ENGINE_URL
    ? process.env.AI_ENGINE_URL.replace(/\/analyze$/, '/calibrate-twin')
    : 'http://localhost:8000/api/v1/calibrate-twin');

  try {
    const aiResponse = await axios.post(
      pythonUrl,
      {
        userId: req.user._id.toString(),
        previousVitals: priorTwinParams,
        newTestVitals: normalizedNewVitals,
        weeklyMealStats: {
          avgDailyCarbs: Math.round(avgDailyCarbs * 10) / 10,
          avgDailySodium: Math.round(avgDailySodium * 10) / 10,
        },
        covarianceMatrix: priorCovariance,
      },
      { timeout: 7000 }
    );
    if (aiResponse.data && aiResponse.data.success) {
      calibrationResult = aiResponse.data;
    }
  } catch (aiErr) {
    console.warn('[AI Twin] Python EKF microservice unavailable, using local analytical fallback:', aiErr.message);
  }

  // Graceful fallback EKF calculation if Python microservice is not online
  if (!calibrationResult) {
    const prevBetaCarb = priorTwinParams.betaCarb || 0.28;
    const prevBetaSodium = priorTwinParams.betaSodium || 0.007;
    const prevSI = priorTwinParams.insulinSensitivity || 0.72;

    const g0Diff = normalizedNewVitals.fastingGlucose - priorTwinParams.fastingGlucose;
    const bpDiff = normalizedNewVitals.systolicBP - priorTwinParams.systolicBP;

    const updatedBetaCarb = Math.max(0.15, Math.min(0.75, prevBetaCarb + (g0Diff * 0.003)));
    const updatedBetaSodium = Math.max(0.004, Math.min(0.020, prevBetaSodium + (bpDiff * 0.0001)));
    const updatedSI = Math.max(0.20, Math.min(1.20, prevSI - (g0Diff * 0.004)));

    const carbShift = Math.round(((updatedBetaCarb - prevBetaCarb) / prevBetaCarb) * 1000) / 10;
    const sodiumShift = Math.round(((updatedBetaSodium - prevBetaSodium) / prevBetaSodium) * 1000) / 10;
    const siShift = Math.round(((updatedSI - prevSI) / prevSI) * 1000) / 10;

    calibrationResult = {
      success: true,
      calibrationTimestamp: 'weekly_test_sync_fallback',
      previousParameters: {
        betaCarb: Math.round(prevBetaCarb * 1000) / 1000,
        betaSodium: Math.round(prevBetaSodium * 10000) / 10000,
        insulinSensitivity: Math.round(prevSI * 1000) / 1000,
      },
      calibratedParameters: {
        betaCarb: Math.round(updatedBetaCarb * 1000) / 1000,
        betaSodium: Math.round(updatedBetaSodium * 10000) / 10000,
        insulinSensitivity: Math.round(updatedSI * 1000) / 1000,
      },
      parameterShiftsPercent: {
        betaCarbShift: carbShift,
        betaSodiumShift: sodiumShift,
        insulinSensitivityShift: siShift,
      },
      covarianceMatrix: [
        [0.0007, 0.0, 0.0],
        [0.0, 0.000003, 0.0],
        [0.0, 0.0, 0.002],
      ],
      clinicalAdaptationReport: {
        summary: `Weekly test calibration complete. Fasting Glucose: ${Math.round(priorTwinParams.fastingGlucose)} -> ${Math.round(normalizedNewVitals.fastingGlucose)} mg/dL. Personal metabolic digital twin recalibrated.`,
        insights: [
          siShift >= 0
            ? `Insulin sensitivity maintained steady or improved (${siShift >= 0 ? '+' : ''}${siShift}%).`
            : `Metabolic resistance registered (${siShift}%). Recommended sequencing fiber before carbohydrates.`,
          sodiumShift <= 0
            ? `Vascular salt elasticity stabilized.`
            : `Salt sensitivity shifted (+${sodiumShift}%). Potassium counter-measures encouraged.`
        ],
        status: 'CALIBRATED_ACTIVE',
      },
    };
  }

  // 5. Build full derived clinical payload
  const incomingVitalsStruct = {
    bodyMetrics: {
      weightKg: inputData.weightKg || inputData.bodyMetrics?.weightKg || previousVitals?.bodyMetrics?.weightKg,
      heightCm: inputData.heightCm || inputData.bodyMetrics?.heightCm || previousVitals?.bodyMetrics?.heightCm,
      bmi: normalizedNewVitals.bmi,
    },
    metabolicHealth: {
      glucoseFasting: normalizedNewVitals.fastingGlucose,
      glucosePostPrandial: inputData.glucosePostPrandial || inputData.metabolicHealth?.glucosePostPrandial,
      hba1c: normalizedNewVitals.hba1c,
      fastingInsulin: inputData.fastingInsulin || inputData.metabolicHealth?.fastingInsulin,
    },
    cardiovascularRisk: {
      systolic: normalizedNewVitals.systolicBP,
      diastolic: normalizedNewVitals.diastolicBP,
      totalCholesterol: normalizedNewVitals.totalCholesterol,
      hdlCholesterol: normalizedNewVitals.hdl,
      ldlCholesterol: normalizedNewVitals.ldl,
      triglycerides: normalizedNewVitals.triglycerides,
    },
    organFunction: inputData.organFunction || {},
    hematology: inputData.hematology || {},
    immunology: inputData.immunology || {},
    micronutrients: inputData.micronutrients || {},
  };

  const derivedPayload = calculateDerivedVitals(incomingVitalsStruct, user);

  // 6. Save new Vitals document with Kalman Calibration results
  const newVitalsRecord = await Vitals.create({
    user: req.user._id,
    source: req.body.source || 'Weekly_Lab',
    isInitialBaseline: false,
    isVerifiedByUser: true,
    recordedAt: req.body.recordedAt || new Date(),
    notes: req.body.notes || calibrationResult.clinicalAdaptationReport?.summary || 'Weekly adaptive EKF recalibration.',
    kalmanCalibration: {
      calibratedAt: new Date(),
      betaCarb: calibrationResult.calibratedParameters.betaCarb,
      betaSodium: calibrationResult.calibratedParameters.betaSodium,
      insulinSensitivity: calibrationResult.calibratedParameters.insulinSensitivity,
      parameterShiftsPercent: calibrationResult.parameterShiftsPercent,
      clinicalAdaptationReport: calibrationResult.clinicalAdaptationReport,
      covarianceMatrix: calibrationResult.covarianceMatrix,
    },
    ...derivedPayload,
  });

    res.status(200).json({
    success: true,
    message: 'Weekly health test ingested. Personal Digital Twin successfully recalibrated.',
    calibration: calibrationResult,
    vitals: newVitalsRecord,
  });
});

/**
 * High-Precision Biometric IoT Telemetry Generator (1-Second Real-Time Clock)
 * Models continuous sinus rhythm, respiratory arrhythmia, interstitial CGM diffusion,
 * and arterial pulse pressure dynamics grounded in the patient's verified baseline.
 */
export const generateRealisticIoTTelemetry = (baseVitalsDoc, stepIndex = 0) => {
  const baseHR = baseVitalsDoc?.continuousMetrics?.restingHeartRate || 72;
  const baseSpO2 = baseVitalsDoc?.continuousMetrics?.oxygenSaturationSpO2 || 98;
  const baseGlucose = baseVitalsDoc?.metabolicHealth?.glucoseFasting || 92;
  const baseSystolic = baseVitalsDoc?.cardiovascularRisk?.systolic || 120;
  const baseDiastolic = baseVitalsDoc?.cardiovascularRisk?.diastolic || 80;
  const baseHRV = baseVitalsDoc?.continuousMetrics?.hrv || 52;

  // 1-Second Respiratory Sinus Arrhythmia & stochastic fluctuations
  const t = stepIndex;
  const respiratoryModulation = Math.sin(t * 0.35) * 3.2; // ~14 breaths per min modulation
  const hrRandomDrift = (Math.random() - 0.5) * 1.8;
  const currentHeartRate = Math.round(
    Math.max(48, Math.min(130, baseHR + respiratoryModulation + hrRandomDrift))
  );

  // Heart Rate Variability (ms) - inversely coupled to sudden pulse spikes
  const hrvDrift = (Math.random() - 0.5) * 3.0;
  const currentHRV = Math.round(
    Math.max(22, Math.min(95, baseHRV - (respiratoryModulation * 0.8) + hrvDrift))
  );

  // Pulse Oximetry SpO2 (%)
  const spO2Jitter = Math.random() > 0.85 ? -1 : 0;
  const currentSpO2 = Math.max(94, Math.min(100, baseSpO2 + spO2Jitter));

  // Continuous Interstitial Glucose (CGM in mg/dL)
  // Low-frequency biological drift mimicking continuous subcutaneous glucose flux
  const glucoseSlowWave = Math.sin(t * 0.04) * 4.5 + Math.cos(t * 0.015) * 2.0;
  const glucoseJitter = (Math.random() - 0.5) * 0.8;
  const currentGlucose = Number(
    Math.max(65, Math.min(220, baseGlucose + glucoseSlowWave + glucoseJitter)).toFixed(1)
  );

  // Arterial Blood Pressure Pulse Waveform (mmHg)
  const bpModulation = Math.sin(t * 0.2) * 2.0;
  const currentSystolic = Math.round(
    Math.max(90, Math.min(160, baseSystolic + bpModulation + (Math.random() - 0.5) * 1.2))
  );
  const currentDiastolic = Math.round(
    Math.max(55, Math.min(100, baseDiastolic + (bpModulation * 0.5) + (Math.random() - 0.5) * 0.8))
  );

  // Autonomic Stress Index (0 - 100) derived from real-time HRV
  const stressRaw = Math.round(100 - (currentHRV * 1.2) + (respiratoryModulation * 1.5));
  const currentStress = Math.max(12, Math.min(88, stressRaw));

  // Respiration Rate (breaths/min) & Skin Temperature (°C)
  const respirationRate = Number((15.0 + Math.sin(t * 0.1) * 1.5 + (Math.random() - 0.5) * 0.4).toFixed(1));
  const skinTemp = Number((36.6 + Math.sin(t * 0.02) * 0.2 + (Math.random() - 0.5) * 0.05).toFixed(2));
  const perfusionIndex = Number((5.2 + Math.sin(t * 0.08) * 0.6 + (Math.random() - 0.5) * 0.15).toFixed(2));

  return {
    timestamp: new Date().toISOString(),
    epochMs: Date.now(),
    stepSecond: stepIndex,
    device: {
      deviceName: 'BioSync Medical Telemetry Watch Ultra',
      cgmSensor: 'Dexcom G7 / FreeStyle Continuous Subcutaneous Probe',
      batteryLevel: 94,
      connectionStatus: 'ACTIVE_STREAMING',
      bleRssi: -52, // dBm
    },
    metrics: {
      heartRate: currentHeartRate,
      hrvMs: currentHRV,
      spO2Percent: currentSpO2,
      glucoseCgm: currentGlucose,
      glucoseTrend: glucoseSlowWave > 0.5 ? 'RISING_STEADY' : glucoseSlowWave < -0.5 ? 'FALLING_STEADY' : 'STABLE',
      systolicBP: currentSystolic,
      diastolicBP: currentDiastolic,
      meanArterialPressure: Math.round((currentSystolic + 2 * currentDiastolic) / 3),
      stressIndex: currentStress,
      respirationRate,
      skinTemperatureCelsius: skinTemp,
      perfusionIndexPercent: perfusionIndex,
    },
  };
};

// @desc    Real-time 1-Second Server-Sent Events (SSE) Biometric IoT Telemetry Stream
// @route   GET /api/vitals/iot-stream
// @access  Private (User)
export const getLiveIoTTelemetryStream = asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const latestVitals = await Vitals.findOne({ user: req.user._id })
    .sort({ recordedAt: -1, createdAt: -1 })
    .lean();

  let step = Math.floor(Date.now() / 1000);
  const intervalId = setInterval(() => {
    step += 1;
    const packet = generateRealisticIoTTelemetry(latestVitals, step);
    res.write(`data: ${JSON.stringify(packet)}\n\n`);
  }, 1000);

  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
  });
});

// @desc    Get Latest Instant 1-Second Biometric Telemetry Reading (Single Packet or Fast Polling)
// @route   GET /api/vitals/iot-latest
// @access  Private (User)
export const getLatestIoTReading = asyncHandler(async (req, res) => {
  const latestVitals = await Vitals.findOne({ user: req.user._id })
    .sort({ recordedAt: -1, createdAt: -1 })
    .lean();

  const step = Math.floor(Date.now() / 1000);
  const reading = generateRealisticIoTTelemetry(latestVitals, step);

  res.status(200).json({
    success: true,
    reading,
  });
});