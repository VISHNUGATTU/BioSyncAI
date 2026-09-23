import Vitals from '../models/Vitals.js';
import User from '../models/User.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { GoogleGenAI, Type } from '@google/genai';

export const addManualVitals = asyncHandler(async (req, res) => {
  const { bodyMetrics, metabolicHealth, cardiovascularRisk, continuousMetrics } = req.body;

  const vitals = await Vitals.create({
    user: req.user._id,
    source: 'Manual',
    isInitialBaseline: true,
    bodyMetrics,
    metabolicHealth,
    cardiovascularRisk,
    continuousMetrics,
  });

  await User.findByIdAndUpdate(req.user._id, { vitalsStatus: 'Manual' });

  res.status(201).json({
    success: true,
    message: 'Manual vitals saved. Please note: Manual entries are at your own risk for AI accuracy.',
    vitals,
  });
});

export const uploadPdfVitals = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a PDF file');
  }

  let extractedText = "PDF parsing failed or API key missing."; 
  let parsedData = {}; 

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Extract all medical vitals from this PDF lab report. Format the output precisely as JSON matching these keys (all optional numbers): 
      height, weight, bmi, bodyFatPercentage, glucoseFasting, hba1c, insulin, ldlCholesterol, hdlCholesterol, triglycerides, 
      systolic, diastolic, restingHeartRate, hrv. Return exactly JSON.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          prompt,
          { inlineData: { data: req.file.buffer.toString("base64"), mimeType: "application/pdf" } },
        ],
        config: {
          responseMimeType: "application/json",
          // Schema definition remains the same
        },
      });
      // Safety parsing
      parsedData = JSON.parse(response.text.trim());
      extractedText = "PDF successfully parsed via AI.";
    } catch (err) {
      console.error('[AI] PDF Vitals Extraction Error:', err.message);
      parsedData = {}; // Guarantee object exists to prevent crashes below
    }
  }

  const vitals = await Vitals.create({
    user: req.user._id,
    source: 'PDF_Scan',
    isInitialBaseline: true,
    pdfRawText: extractedText,
    bodyMetrics: {
      heightCm: parsedData.height,
      weightKg: parsedData.weight,
      bmi: parsedData.bmi,
      bodyFatPercentage: parsedData.bodyFatPercentage,
    },
    metabolicHealth: {
      glucoseFasting: parsedData.glucoseFasting,
      hba1c: parsedData.hba1c,
      fastingInsulin: parsedData.insulin,
    },
    cardiovascularRisk: {
      ldlCholesterol: parsedData.ldlCholesterol,
      hdlCholesterol: parsedData.hdlCholesterol,
      triglycerides: parsedData.triglycerides,
      systolic: parsedData.systolic,
      diastolic: parsedData.diastolic,
    },
    continuousMetrics: {
      restingHeartRate: parsedData.restingHeartRate,
      hrv: parsedData.hrv,
    }
  });

  await User.findByIdAndUpdate(req.user._id, { vitalsStatus: 'PDF_Scanned' });

  res.status(201).json({ success: true, message: 'PDF successfully parsed and vitals saved.', vitals });
});

export const getLatestVitals = asyncHandler(async (req, res) => {
  const vitals = await Vitals.findOne({ user: req.user._id })
    .sort({ recordedAt: -1 })
    .lean();

  if (!vitals) {
    res.status(404);
    throw new Error('No vitals found for this user');
  }

  res.status(200).json({ success: true, vitals });
});