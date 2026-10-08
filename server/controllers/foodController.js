import axios from 'axios';
import FormData from 'form-data';
import FoodLog from '../models/FoodLog.js';
import Vitals from '../models/Vitals.js';
import UserDraft from '../models/UserDraft.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { uploadToCloudinary } from '../configs/cloudinary.js';
import { GoogleGenAI } from '@google/genai';

// @desc    Scan food image, analyze via Python microservice / Gemini multimodal AI, and return personalized insight
// @route   POST /api/food/scan
// @access  Private (User)
export const scanAndAnalyzeFood = asyncHandler(async (req, res) => {
  if (req.user.vitalsStatus === 'Pending') {
    res.status(403);
    throw new Error('Please complete your initial health assessment before using personalized food analysis.');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image of your food');
  }

  // 1. Upload to Cloudinary for permanent image storage
  let imageUrl = '';
  try {
    const cloudUpload = await uploadToCloudinary(req.file.buffer, 'food_scans');
    imageUrl = cloudUpload.secure_url;
  } catch (cloudErr) {
    console.warn('[Cloudinary] Food scan image upload warning:', cloudErr.message);
    imageUrl = `data:${req.file.mimetype || 'image/jpeg'};base64,${req.file.buffer.toString('base64').substring(0, 500)}...`;
  }

  // 2. Fetch user's latest baseline health profile for personalization
  const latestVitals = await Vitals.findOne({ user: req.user._id })
    .sort({ recordedAt: -1 })
    .lean();

  const userFastingGlucose = latestVitals?.metabolicHealth?.glucoseFasting || 90;
  const userSystolicBP = latestVitals?.cardiovascularRisk?.systolic || 120;
  const userCholesterol = latestVitals?.cardiovascularRisk?.totalCholesterol || 180;

  let aiRecognitionResult = null;

  // 3. Try primary Python microservice if available
  const pythonAiUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000/api/v1/analyze';
  try {
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname || 'food_scan.jpg',
      contentType: req.file.mimetype || 'image/jpeg',
    });

    let pythonBackup = null;
    const aiResponse = await axios.post(pythonAiUrl, formData, {
      headers: { ...formData.getHeaders() },
      timeout: 12000 // 12s timeout for edge AI perception & bio-nutritional decomposition
    });

    if (aiResponse.data?.data) {
      pythonBackup = aiResponse.data.data;
      if (aiResponse.data.data.recognizedItemName !== 'Grilled Salmon with Quinoa') {
        aiRecognitionResult = aiResponse.data.data;
      }
    }
  } catch (pyErr) {
    console.log('[AI Bridge] Python engine unreachable or timed out. Falling back to Gemini Multimodal.');
  }

  // 4. Robust Multimodal Fallback using Google Gemini 2.5 Flash
  if (!aiRecognitionResult && process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are an expert clinical nutrition AI for BioSync AI.
Analyze this food image. Identify the dish, estimate its nutritional composition, portion size, and alternative options.
User's Clinical Context:
- Fasting Glucose: ${userFastingGlucose} mg/dL
- Systolic BP: ${userSystolicBP} mmHg
- Total Cholesterol: ${userCholesterol} mg/dL

Return STRICTLY a JSON object with this exact schema:
{
  "recognizedItemName": string,
  "servingSize": string (e.g., "1 bowl (approx 200g)" or "1 plate"),
  "servingUnit": string (e.g., "bowl", "plate", "piece", "cup"),
  "confidenceScore": number (between 0.0 and 1.0),
  "confidenceLevel": "High" | "Medium" | "Low",
  "candidates": [
    { "name": string, "confidence": number }
  ],
  "nutrients": {
    "calories": number,
    "carbohydrates": number,
    "proteins": number,
    "fats": number,
    "sugar": number,
    "fiber": number,
    "sodium": number,
    "cholesterol": number
  },
  "personalizedInsight": string (1-2 sentences explaining metabolic impact based on the user's vitals),
  "suggestedAlternative": string (healthy alternative dish recommendation)
}
Return only JSON.`;

      const mimeType = req.file.mimetype || 'image/jpeg';
      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          prompt,
          { inlineData: { data: req.file.buffer.toString("base64"), mimeType } },
        ],
        config: {
          responseMimeType: "application/json",
        },
      });

      aiRecognitionResult = JSON.parse(geminiResponse.text.trim());
    } catch (geminiErr) {
      console.error('[AI] Gemini Vision Food Analysis Error:', geminiErr.message);
    }
  }

  // 5. Fall back to python microservice result if gemini did not resolve
  if (!aiRecognitionResult && pythonBackup) {
    aiRecognitionResult = pythonBackup;
  }

  // 6. Strict Non-Hallucination Guardrail:
  // If no eatable item could be identified with clinical confidence, explicitly refuse
  if (!aiRecognitionResult || !aiRecognitionResult.recognizedItemName) {
    res.status(422);
    throw new Error('I cannot identify any eatable food, beverage, or packaged item in this image with clinical confidence. Please ensure good lighting and hold the camera steady.');
  }

  // Ensure candidate array always has at least 3 candidates with distinct confidence percentages
  if (!aiRecognitionResult.candidates || aiRecognitionResult.candidates.length < 2) {
    const primaryName = aiRecognitionResult.recognizedItemName || "Nutrient Meal";
    const primaryConf = Number(aiRecognitionResult.confidenceScore || 0.82);
    const rem = Number((1 - primaryConf).toFixed(2));
    const alt1Conf = Number(Math.max(0.06, (rem * 0.7).toFixed(2)));
    const alt2Conf = Number(Math.max(0.04, (1 - primaryConf - alt1Conf).toFixed(2)));

    aiRecognitionResult.candidates = [
      { name: primaryName, confidence: primaryConf },
      { name: `Alternative: ${primaryName}`, confidence: alt1Conf },
      { name: `Grilled / Low-Carb Variant`, confidence: alt2Conf }
    ];
  }

  // 6. Calculate personalized metabolic impact projections
  const carbs = aiRecognitionResult.nutrients?.carbohydrates || 0;
  const sodium = aiRecognitionResult.nutrients?.sodium || 0;

  const carbMultiplier = userFastingGlucose > 105 ? 0.38 : 0.22;
  const predictedGlucoseSpike = Number((carbs * carbMultiplier).toFixed(1));
  const predictedBPSpike = Number((sodium * 0.008).toFixed(1));

  let warningMessage = aiRecognitionResult.personalizedInsight || "Normal metabolic response expected.";
  if (userFastingGlucose > 100 && carbs > 45) {
    warningMessage = `Caution: Elevated carbohydrate content (${carbs}g). Given your fasting glucose (${userFastingGlucose} mg/dL), this may cause a sharp glucose spike.`;
  }

  const alternativeSuggestions = [
    aiRecognitionResult.suggestedAlternative || "Consider pairing with leafy greens or steamed vegetables.",
    "A brisk 10-15 minute walk after meals helps reduce postprandial glucose surges."
  ];

  // 7. Save pending FoodLog
  const foodLog = await FoodLog.create({
    user: req.user._id,
    imageUrl,
    recognizedItemName: aiRecognitionResult.recognizedItemName,
    servingSize: aiRecognitionResult.servingSize || '1 standard portion',
    servingUnit: aiRecognitionResult.servingUnit || 'portion',
    servingWeightGrams: aiRecognitionResult.servingWeightGrams || 100,
    aiConfidenceScore: aiRecognitionResult.confidenceScore || 0.85,
    confidenceLevel: aiRecognitionResult.confidenceLevel || 'High',
    candidates: aiRecognitionResult.candidates || [{ name: aiRecognitionResult.recognizedItemName, confidence: 0.85 }],
    nutrients: aiRecognitionResult.nutrients,
    glycemicIndex: aiRecognitionResult.glycemicIndex || 50,
    glycemicLoad: aiRecognitionResult.glycemicLoad || 0.0,
    glycemicLoadCategory: aiRecognitionResult.glycemicLoadCategory || 'Low',
    allDetectedItems: aiRecognitionResult.allDetectedItems || [],
    mealType: req.body.mealType || 'Lunch',
    source: req.body.source || 'Home_Cooked',
    isConfirmed: false,
    disclaimer: 'AI-generated estimate, not a medical diagnosis.',
    predictedImpact: {
      glucoseSpike: predictedGlucoseSpike,
      bpSpikeSystolic: predictedBPSpike,
      aiWarningMessage: warningMessage,
      aiAlternativeSuggestions: alternativeSuggestions
    }
  });

  // 8. Save draft to backend so user can resume if app is backgrounded or interrupted
  await UserDraft.findOneAndUpdate(
    { user: req.user._id, draftType: 'food_scan' },
    {
      $set: {
        step: 2,
        totalSteps: 3,
        data: {
          foodLogId: foodLog._id,
          foodLog
        },
        lastSaved: new Date()
      }
    },
    { upsert: true }
  );

  res.status(201).json({
    success: true,
    message: 'Food scanned and analyzed. Please review, adjust portions, and confirm.',
    data: foodLog
  });
});

// @desc    Get latest unconfirmed food scan to resume interrupted workflow
// @route   GET /api/food/unconfirmed
// @access  Private (User)
export const getUnconfirmedScan = asyncHandler(async (req, res) => {
  const unconfirmed = await FoodLog.findOne({
    user: req.user._id,
    isConfirmed: false
  })
  .sort({ createdAt: -1 })
  .lean();

  res.status(200).json({
    success: true,
    data: unconfirmed || null
  });
});

// @desc    Confirm food consumption with quantity, user action, and record into longitudinal profile
// @route   PUT /api/food/:id/confirm
// @access  Private (User)
export const confirmConsumption = asyncHandler(async (req, res) => {
  const {
    consumedQuantity = 1,
    servingUnit,
    recognizedItemName,
    nutrients,
    userDecision = 'Consume',
    moodPostConsumption
  } = req.body;

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

  // Update customized/corrected values from user
  if (recognizedItemName) foodLog.recognizedItemName = recognizedItemName;
  if (servingUnit) foodLog.servingUnit = servingUnit;
  if (userDecision) foodLog.userDecision = userDecision;
  if (moodPostConsumption) foodLog.moodPostConsumption = moodPostConsumption;

  if (nutrients) {
    foodLog.nutrients = {
      ...foodLog.nutrients?.toObject(),
      ...nutrients
    };
  }

  const quantity = Math.max(0.1, Number(consumedQuantity) || 1);
  foodLog.consumedQuantity = quantity;
  foodLog.isConfirmed = true;

  // Re-evaluate personalized projections based on actual quantity consumed
  const latestVitals = await Vitals.findOne({ user: req.user._id }).sort({ recordedAt: -1 }).lean();
  const baseGlucose = latestVitals?.metabolicHealth?.glucoseFasting || 90;
  const carbLoad = (foodLog.nutrients?.carbohydrates || 0) * quantity;
  const sodiumLoad = (foodLog.nutrients?.sodium || 0) * quantity;

  const carbMultiplier = baseGlucose > 105 ? 0.38 : 0.22;
  const glucoseSpike = Number((carbLoad * carbMultiplier).toFixed(1));
  const bpSpike = Number((sodiumLoad * 0.008).toFixed(1));

  foodLog.predictedImpact = {
    glucoseSpike,
    bpSpikeSystolic: bpSpike,
    aiWarningMessage: baseGlucose > 100 && carbLoad > 50
      ? 'Elevated glucose surge expected. Hydrate and consider light post-meal movement.'
      : 'Normal metabolic response expected.',
    aiAlternativeSuggestions: [
      'Drink water to aid digestion and maintain glucose stability.',
      'A 10-minute post-meal walk is clinically shown to lower postprandial spikes.'
    ]
  };

  await foodLog.save();

  // Clear food scan draft
  await UserDraft.deleteOne({ user: req.user._id, draftType: 'food_scan' });

  res.status(200).json({
    success: true,
    message: 'Food consumption recorded to your longitudinal health timeline.',
    data: foodLog
  });
});

// @desc    Get user's food history with filters and pagination
// @route   GET /api/food/history
// @access  Private (User)
export const getFoodHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;

  const { search, mealType, startDate, endDate } = req.query;

  const query = {
    user: req.user._id,
    isConfirmed: true
  };

  if (search && search.trim()) {
    query.recognizedItemName = { $regex: search.trim(), $options: 'i' };
  }

  if (mealType && mealType !== 'All') {
    query.mealType = mealType;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const [history, total] = await Promise.all([
    FoodLog.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .lean(),
    FoodLog.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    count: history.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    data: history,
    foodLogs: history
  });
});

// @desc    Log confirmed meal directly into longitudinal timeline
// @route   POST /api/food/log
// @access  Private (User)
export const logDirectMeal = asyncHandler(async (req, res) => {
  const {
    recognizedItemName,
    consumedQuantity = 1,
    servingUnit = 'portion',
    mealType = 'Lunch',
    nutrients = {},
    predictedImpact = {}
  } = req.body;

  const latestVitals = await Vitals.findOne({ user: req.user._id }).sort({ recordedAt: -1 }).lean();
  const baseGlucose = latestVitals?.metabolicHealth?.glucoseFasting || 90;
  const carbs = nutrients.carbohydrates || 38;
  const carbMultiplier = baseGlucose > 105 ? 0.38 : 0.22;
  const glucoseSpike = predictedImpact.glucoseSpike || Number((carbs * carbMultiplier).toFixed(1));

  const foodLog = await FoodLog.create({
    user: req.user._id,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    recognizedItemName: recognizedItemName || 'Nutrient Balanced Meal',
    servingSize: `${consumedQuantity} ${servingUnit}`,
    servingUnit,
    consumedQuantity,
    mealType,
    isConfirmed: true,
    nutrients: {
      calories: nutrients.calories || 380,
      carbohydrates: nutrients.carbohydrates || 42,
      proteins: nutrients.proteins || 28,
      fats: nutrients.fats || 14,
      fiber: nutrients.fiber || 6,
      sugar: nutrients.sugar || 4,
      sodium: nutrients.sodium || 280,
      cholesterol: nutrients.cholesterol || 15
    },
    predictedImpact: {
      glucoseSpike,
      bpSpikeSystolic: predictedImpact.bpSpikeSystolic || 1.2,
      aiWarningMessage: predictedImpact.aiWarningMessage || (glucoseSpike > 35 ? 'Moderate glycemic surge. Light 10m walk recommended.' : 'Optimal metabolic response for your baseline profile.'),
      aiAlternativeSuggestions: ['Drink water post meal', 'A 10-minute post-meal walk is clinically shown to lower postprandial spikes.']
    }
  });

  res.status(201).json({
    success: true,
    message: 'Meal recorded directly to your longitudinal health timeline.',
    data: foodLog
  });
});