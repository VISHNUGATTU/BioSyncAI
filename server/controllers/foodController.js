import axios from 'axios';
import FormData from 'form-data';
import FoodLog from '../models/FoodLog.js';
import Vitals from '../models/Vitals.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { uploadToCloudinary } from '../configs/cloudinary.js';
import { GoogleGenAI, Type } from '@google/genai';

export const scanAndAnalyzeFood = asyncHandler(async (req, res) => {
  if (req.user.vitalsStatus === 'Pending') {
    res.status(403);
    throw new Error('You must complete your initial vitals before accessing the food scanner.');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image or video frame of your food');
  }

  // 1. Upload to Cloudinary for your permanent records
  const cloudUpload = await uploadToCloudinary(req.file.buffer, 'food_scans');

  let aiRecognitionResult;

  try {
    // 2. Prepare the file to send to your Python AI Engine
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // 3. Make the internal request to the Python microservice
    // Note: Use your Python engine's actual network IP if deployed separately
    const pythonAiUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000/api/v1/analyze';
    
    const aiResponse = await axios.post(pythonAiUrl, formData, {
      headers: { ...formData.getHeaders() }
    });

    aiRecognitionResult = aiResponse.data.data;
    aiRecognitionResult.source = req.body.source || 'Home_Cooked';

  } catch (err) {
    console.error('[AI Bridge] Failed to connect to Python Engine:', err.message);
    // Fallback if the Python server is offline
    aiRecognitionResult = {
      recognizedItemName: "Unknown Food Item (AI Offline)",
      confidenceScore: 0.0,
      nutrients: { calories: 0, carbohydrates: 0, proteins: 0, fats: 0, sugar: 0, fiber: 0, sodium: 0, cholesterol: 0 },
      mealType: req.body.mealType || 'Lunch',
      source: req.body.source || 'Home_Cooked'
    };
  }

  // 4. Save the Python engine's results to MongoDB
  const foodLog = await FoodLog.create({
    user: req.user._id,
    imageUrl: cloudUpload.secure_url,
    ...aiRecognitionResult,
    isConfirmed: false
  });

  res.status(201).json({
    success: true,
    message: 'Food analyzed by AI Engine and saved. Waiting for user confirmation.',
    data: foodLog
  });
});

export const confirmConsumption = asyncHandler(async (req, res) => {
  const { consumedQuantity, servingUnit } = req.body;
  const foodLogId = req.params.id;

  const foodLog = await FoodLog.findById(foodLogId);

  if (!foodLog) {
    res.status(404);
    throw new Error('Food log not found');
  }

  if (foodLog.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to modify this entry');
  }

  const latestVitals = await Vitals.findOne({ user: req.user._id }).sort({ recordedAt: -1 }).lean();

  const baseGlucose = latestVitals?.metabolicHealth?.glucoseFasting || 90;
  const carbLoad = (foodLog.nutrients?.carbohydrates || 0) * consumedQuantity;
  
  let predictedGlucoseSpike = carbLoad * 0.25; 
  let warningMessage = "Normal metabolic response expected.";

  if (baseGlucose > 100) {
    predictedGlucoseSpike = carbLoad * 0.40; 
    warningMessage = "Caution: Based on your recent elevated fasting glucose, this carb load may cause a sharper spike.";
  }

  foodLog.consumedQuantity = consumedQuantity;
  foodLog.servingUnit = servingUnit || 'servings';
  foodLog.isConfirmed = true;
  foodLog.predictedImpact = {
    glucoseSpike: Number(predictedGlucoseSpike.toFixed(2)),
    bpSpikeSystolic: Number(((foodLog.nutrients?.sodium || 0) * consumedQuantity * 0.01).toFixed(2)),
    aiWarningMessage: warningMessage,
    aiAlternativeSuggestions: ["Consider adding a side of leafy greens to slow digestion", "Walk for 10 mins post-meal"]
  };

  await foodLog.save();

  res.status(200).json({ success: true, message: 'Consumption confirmed.', data: foodLog });
});

export const getFoodHistory = asyncHandler(async (req, res) => {
  // CRITICAL: Added pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;

  const history = await FoodLog.find({ user: req.user._id, isConfirmed: true })
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .lean();

  res.status(200).json({ success: true, count: history.length, data: history });
});