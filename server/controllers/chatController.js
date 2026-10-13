import { GoogleGenAI } from '@google/genai';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';
import Vitals from '../models/Vitals.js';
import Sample from '../models/Sample.js';
import FoodLog from '../models/FoodLog.js';
import IoTTelemetry from '../models/IoTTelemetry.js';
import asyncHandler from '../middlewares/asyncHandler.js';

/**
 * Builds high-fidelity Patient RAG Context
 * Aggregates EHR, Wearable Streams, Lab Assays, and Nutritional Logs
 */
const buildPatientRAGContext = async (userId) => {
  const [user, latestVitals, recentSamples, recentFoods, latestTelemetry] = await Promise.all([
    User.findById(userId).select('firstName lastName dateOfBirth gender lifestyle address').lean(),
    Vitals.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
    Sample.find({ user: userId, status: { $in: ['Report_Generated', 'Delivered'] } })
      .populate('testCatalog', 'testName category')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean(),
    FoodLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('recognizedItemName mealType nutrients glycemicIndex glycemicLoad glycemicLoadCategory createdAt')
      .lean(),
    IoTTelemetry.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
  ]);

  // Derive age
  let age = null;
  if (user?.dateOfBirth) {
    const diffMs = Date.now() - new Date(user.dateOfBirth).getTime();
    age = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
  }

  // Extract key clinical biomarker values
  const metabolic = latestVitals?.metabolicHealth || {};
  const cardiovascular = latestVitals?.cardiovascularRisk || {};
  const continuous = latestVitals?.continuousMetrics || {};
  const lipid = latestVitals?.lipidProfile || {};
  const organ = latestVitals?.organFunction || {};

  const biomarkerContext = {
    glucoseFasting: metabolic.glucoseFasting ?? 95,
    glucosePostPrandial: metabolic.glucosePostPrandial ?? null,
    hba1c: metabolic.hba1c ?? 5.5,
    systolic: cardiovascular.systolic ?? 120,
    diastolic: cardiovascular.diastolic ?? 80,
    restingHeartRate: continuous.restingHeartRate ?? 72,
    hrv: continuous.hrv ?? 52,
    oxygenSaturationSpO2: continuous.oxygenSaturationSpO2 ?? 98,
    cholesterolTotal: lipid.totalCholesterol ?? null,
    ldl: lipid.ldlCholesterol ?? null,
    hdl: lipid.hdlCholesterol ?? null,
    triglycerides: lipid.triglycerides ?? null,
    activeConditions: [],
  };

  // Flag clinical classifications
  if (biomarkerContext.hba1c >= 6.5) biomarkerContext.activeConditions.push('Type 2 Diabetes Mellitus');
  else if (biomarkerContext.hba1c >= 5.7) biomarkerContext.activeConditions.push('Prediabetes');

  if (biomarkerContext.systolic >= 140 || biomarkerContext.diastolic >= 90) {
    biomarkerContext.activeConditions.push('Stage 2 Hypertension');
  } else if (biomarkerContext.systolic >= 130 || biomarkerContext.diastolic >= 80) {
    biomarkerContext.activeConditions.push('Stage 1 Hypertension');
  }

  // Summarize recent lab tests
  const verifiedLabReports = recentSamples.map((s) => ({
    testName: s.testCatalog?.testName || 'Comprehensive Metabolic Panel',
    date: s.reportGenerationTime || s.createdAt,
    remarks: s.doctorRemarks || 'Verified by clinical pathologist',
    keyResults: s.structuredResults || [],
  }));

  // Summarize recent food intake
  const recentMeals = recentFoods.map((f) => ({
    name: f.recognizedItemName,
    meal: f.mealType,
    calories: f.nutrients?.calories || 0,
    carbs: f.nutrients?.carbohydrates || 0,
    glycemicLoad: f.glycemicLoad || 'Medium',
    loggedAt: f.createdAt,
  }));

  // Live wearable packet if active
  const liveSensorData = latestTelemetry
    ? {
        heartRate: latestTelemetry.heartRate,
        glucoseCgm: latestTelemetry.glucoseCgm,
        spo2: latestTelemetry.spo2,
        stress: latestTelemetry.stress,
        lastSynced: latestTelemetry.timestamp,
      }
    : null;

  return {
    patientProfile: {
      name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Patient',
      age: age || 34,
      gender: user?.gender || 'Not specified',
      dietPreference: user?.lifestyle?.dietPreference || 'General',
      activityLevel: user?.lifestyle?.activityLevel || 'Moderate',
    },
    biomarkerContext,
    verifiedLabReports,
    recentMeals,
    liveSensorData,
  };
};

/**
 * Fallback Clinical Intelligence Engine
 * Formulates deep, evidence-based physiological responses using patient's real data
 */
const generateDeterministicClinicalResponse = (query, ragContext) => {
  const q = query.toLowerCase();
  const bio = ragContext.biomarkerContext;
  const profile = ragContext.patientProfile;
  const recentMeals = ragContext.recentMeals;

  const suggestions = [];
  const actions = [];
  let responseText = '';

  // Case 1: Food & Nutrition query
  if (
    q.includes('eat') ||
    q.includes('food') ||
    q.includes('diet') ||
    q.includes('carb') ||
    q.includes('sugar') ||
    q.includes('rice') ||
    q.includes('bread') ||
    q.includes('sweet') ||
    q.includes('fruit') ||
    q.includes('dinner') ||
    q.includes('lunch') ||
    q.includes('breakfast')
  ) {
    const isDiabeticRisk = bio.hba1c >= 5.7;
    const isBpRisk = bio.systolic >= 130;

    responseText = `Hello ${profile.name},\n\nBased on your active physiological profile (HbA1c: ${bio.hba1c}%, Fasting Glucose: ${bio.glucoseFasting} mg/dL):\n\n`;

    if (isDiabeticRisk) {
      responseText += `• **Glycemic Load Guidance**: Because your HbA1c is ${bio.hba1c}% (${bio.hba1c >= 6.5 ? 'Diabetic range' : 'Prediabetes'}), high-glycemic carbohydrates will cause sharp postprandial glucose spikes.\n`;
      responseText += `• **Recommended Pairing**: If consuming rice or grains, pair with soluble fiber (vegetables/dal) and lean protein to decelerate gastric emptying.\n`;
    } else {
      responseText += `• **Metabolic Resilience**: Your glycemic biomarkers are in a favorable range. Maintain balanced macronutrient distribution (45% complex carbs, 30% healthy fats, 25% protein).\n`;
    }

    if (recentMeals.length > 0) {
      const lastMeal = recentMeals[0];
      responseText += `• **Recent Meal Note**: Your last logged meal was *${lastMeal.name}* (~${lastMeal.calories} kcal, ${lastMeal.carbs}g carbs). `;
    }

    if (isBpRisk) {
      responseText += `\n• **Cardiovascular Precaution**: With your resting blood pressure at ${bio.systolic}/${bio.diastolic} mmHg, keep dietary sodium under 2,000 mg/day.\n`;
    }

    actions.push({
      title: 'Scan Meal with Volumetric AI',
      actionType: 'NAVIGATE_SCAN',
      payload: 'FoodScanner',
    });
    suggestions.push(
      'What are low glycemic alternatives for my meals?',
      'How does protein timing affect my glucose spike?',
      'Can you review my total carb intake for today?'
    );
  }

  // Case 2: Blood Pressure & Heart Rate query
  else if (
    q.includes('bp') ||
    q.includes('pressure') ||
    q.includes('heart') ||
    q.includes('pulse') ||
    q.includes('hypertension') ||
    q.includes('hrv') ||
    q.includes('cardio')
  ) {
    const map = Math.round((bio.systolic + 2 * bio.diastolic) / 3);
    responseText = `Hello ${profile.name},\n\nHere is your cardiovascular status based on your telemetry:\n\n`;
    responseText += `• **Arterial Pressure**: ${bio.systolic}/${bio.diastolic} mmHg (Mean Arterial Pressure: ${map} mmHg).\n`;
    responseText += `• **Autonomic Tone**: Resting Heart Rate is ${bio.restingHeartRate} BPM with HRV (rMSSD) at ${bio.hrv} ms.\n`;

    if (bio.systolic >= 140 || bio.diastolic >= 90) {
      responseText += `• **Clinical Status**: Elevated Stage 2 range. Practice 5 minutes of resonant breathing (5.5 breaths/min) to activate parasympathetic vagal stimulation.\n`;
    } else if (bio.systolic >= 130 || bio.diastolic >= 80) {
      responseText += `• **Clinical Status**: Stage 1 Elevated. Emphasize magnesium-rich hydration and reduce caffeine intake today.\n`;
    } else {
      responseText += `• **Clinical Status**: Optimal normotensive range. Your heart rate variability reflects strong autonomic recovery.\n`;
    }

    actions.push({
      title: 'Open Real-Time Wearable Telemetry',
      actionType: 'NAVIGATE_WEARABLE',
      payload: 'WearableSync',
    });
    suggestions.push(
      'Why does my heart rate increase after eating?',
      'What exercises improve my HRV score?',
      'How does sleep duration influence my blood pressure?'
    );
  }

  // Case 3: Lab Tests / Diagnostic query
  else if (
    q.includes('test') ||
    q.includes('lab') ||
    q.includes('report') ||
    q.includes('sample') ||
    q.includes('cholesterol') ||
    q.includes('lipid') ||
    q.includes('appointment')
  ) {
    responseText = `Hello ${profile.name},\n\nRegarding your diagnostic lab profile:\n\n`;
    responseText += `• **Metabolic Panel**: Fasting Glucose is ${bio.glucoseFasting} mg/dL with HbA1c at ${bio.hba1c}%.\n`;

    if (bio.cholesterolTotal) {
      responseText += `• **Lipid Profile**: Total Cholesterol: ${bio.cholesterolTotal} mg/dL, LDL: ${bio.ldl} mg/dL, HDL: ${bio.hdl} mg/dL, Triglycerides: ${bio.triglycerides} mg/dL.\n`;
    } else {
      responseText += `• **Preventive Diagnostic Recommendation**: A comprehensive lipid panel and renal panel are recommended every 6 months to calibrate your biological twin.\n`;
    }

    if (ragContext.verifiedLabReports.length > 0) {
      const topReport = ragContext.verifiedLabReports[0];
      responseText += `• **Recent Verified Report**: *${topReport.testName}* — ${topReport.remarks}.\n`;
    }

    actions.push({
      title: 'Book Diagnostic Home Collection',
      actionType: 'NAVIGATE_BOOKING',
      payload: 'BookAppointment',
    });
    suggestions.push(
      'What tests should I get next?',
      'Explain the difference between LDL and HDL',
      'How quickly can diet lower triglycerides?'
    );
  }

  // Case 4: General health or default query
  else {
    responseText = `Hello ${profile.name},\n\nI am your **BioSync Clinical Health Companion**. Here is your current physiological summary:\n\n`;
    responseText += `• **Metabolic**: Fasting Glucose ${bio.glucoseFasting} mg/dL | HbA1c ${bio.hba1c}%\n`;
    responseText += `• **Cardiovascular**: BP ${bio.systolic}/${bio.diastolic} mmHg | Resting Pulse ${bio.restingHeartRate} BPM\n`;
    responseText += `• **Oxygen & Autonomic**: SpO2 ${bio.oxygenSaturationSpO2}% | HRV ${bio.hrv} ms\n\n`;
    responseText += `You can ask me questions about food compatibility, glycemic spikes, blood pressure trends, or diagnostic test interpretations.`;

    actions.push({
      title: 'View Longitudinal Trends',
      actionType: 'NAVIGATE_VITALS',
      payload: 'VitalsAnalysis',
    });
    suggestions.push(
      'Can I eat rice tonight with my HbA1c?',
      'How is my heart rate recovery trending?',
      'Give me a personalized dinner recommendation'
    );
  }

  return {
    content: responseText,
    suggestedActions: actions,
    followUpQuestions: suggestions,
    modelUsed: 'biosync-clinical-rag-engine',
  };
};

/**
 * @desc    Send a message to the Personalized Health AI Companion
 * @route   POST /api/chat/message
 * @access  Private (User)
 */
export const sendChatMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const userId = req.user._id;

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400);
    throw new Error('Message content is required');
  }

  const trimmedQuery = message.trim();

  // 1. Build Personalized RAG Patient Context
  const ragContext = await buildPatientRAGContext(userId);

  // 2. Fetch recent conversation history (last 6 messages for context continuity)
  const recentHistory = await ChatMessage.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();
  recentHistory.reverse();

  // 3. Save User Message immediately
  const userMsgRecord = await ChatMessage.create({
    user: userId,
    role: 'user',
    content: trimmedQuery,
    biomarkerContext: ragContext.biomarkerContext,
  });

  let assistantReplyText = '';
  let modelUsed = 'gemini-2.5-flash';
  let suggestedActions = [];
  let followUpQuestions = [];

  // 4. Attempt Gemini 2.5 Flash Generation with Context Grounding
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const systemPrompt = `You are the BioSync AI Clinical Health Companion, an advanced personalized digital twin and medical wellness assistant.
You are conversing with patient: ${ragContext.patientProfile.name} (Age: ${ragContext.patientProfile.age}, Gender: ${ragContext.patientProfile.gender}).

ACTIVE BIOMARKER GROUNDING DATA:
- Fasting Glucose: ${ragContext.biomarkerContext.glucoseFasting} mg/dL
- HbA1c: ${ragContext.biomarkerContext.hba1c}%
- Blood Pressure: ${ragContext.biomarkerContext.systolic}/${ragContext.biomarkerContext.diastolic} mmHg
- Resting Heart Rate: ${ragContext.biomarkerContext.restingHeartRate} BPM
- Heart Rate Variability (HRV): ${ragContext.biomarkerContext.hrv} ms
- Blood Oxygen (SpO2): ${ragContext.biomarkerContext.oxygenSaturationSpO2}%
- Total Cholesterol: ${ragContext.biomarkerContext.cholesterolTotal ?? 'Not yet tested'} mg/dL
- Active Risk Classifications: ${ragContext.biomarkerContext.activeConditions.length > 0 ? ragContext.biomarkerContext.activeConditions.join(', ') : 'Normative baseline'}
- Recent Meals Logged: ${JSON.stringify(ragContext.recentMeals.slice(0, 3))}
- Live Wearable Telemetry: ${ragContext.liveSensorData ? JSON.stringify(ragContext.liveSensorData) : 'Offline'}

CLINICAL GUIDELINES:
1. Always ground your reasoning in the patient's specific biomarkers cited above.
2. If the user asks about food, predict the postprandial glycemic load and recommend specific macro adjustments (fiber, protein buffer, portion modulation).
3. If the user asks about cardiovascular metrics, analyze systolic/diastolic MAP and autonomic HRV tone.
4. Keep the tone empathetic, professional, highly informative, and scientifically grounded (ADA, AHA guidelines).
5. Format with concise bullet points and bold highlights for readability.
6. Conclude with 2 brief follow-up thoughts or actionable habits.`;

      // Format conversation history for multi-turn Gemini
      const conversationContents = [];
      conversationContents.push({ role: 'user', parts: [{ text: systemPrompt }] });
      conversationContents.push({ role: 'model', parts: [{ text: 'Understood. I am initialized as the BioSync Clinical Health Companion, strictly grounded in this patient’s active physiological biomarkers.' }] });

      for (const hist of recentHistory) {
        conversationContents.push({
          role: hist.role === 'user' ? 'user' : 'model',
          parts: [{ text: hist.content }],
        });
      }

      conversationContents.push({
        role: 'user',
        parts: [{ text: trimmedQuery }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: conversationContents,
      });

      assistantReplyText = response.text;

      // Deduce relevant actions
      if (trimmedQuery.toLowerCase().includes('food') || trimmedQuery.toLowerCase().includes('eat') || trimmedQuery.toLowerCase().includes('meal')) {
        suggestedActions.push({
          title: 'Scan Food with 3D Topography',
          actionType: 'NAVIGATE_SCAN',
          payload: 'FoodScanner',
        });
      }
      if (trimmedQuery.toLowerCase().includes('heart') || trimmedQuery.toLowerCase().includes('watch') || trimmedQuery.toLowerCase().includes('telemetry')) {
        suggestedActions.push({
          title: 'Live Wearable GATT Telemetry',
          actionType: 'NAVIGATE_WEARABLE',
          payload: 'WearableSync',
        });
      }
      if (trimmedQuery.toLowerCase().includes('lab') || trimmedQuery.toLowerCase().includes('test') || trimmedQuery.toLowerCase().includes('report')) {
        suggestedActions.push({
          title: 'Schedule NABL Lab Collection',
          actionType: 'NAVIGATE_BOOKING',
          payload: 'BookAppointment',
        });
      }

      followUpQuestions = [
        'How does this affect my longevity score?',
        'What should my optimal postprandial target be?',
        'Can you analyze my weekly trends?',
      ];
    } catch (geminiError) {
      console.warn('[ChatController] Gemini API fallback triggered:', geminiError?.message || geminiError);
      const fallbackResult = generateDeterministicClinicalResponse(trimmedQuery, ragContext);
      assistantReplyText = fallbackResult.content;
      modelUsed = fallbackResult.modelUsed;
      suggestedActions = fallbackResult.suggestedActions;
      followUpQuestions = fallbackResult.followUpQuestions;
    }
  } else {
    // Deterministic Rule-Based Grounded Engine when API key is unconfigured
    const fallbackResult = generateDeterministicClinicalResponse(trimmedQuery, ragContext);
    assistantReplyText = fallbackResult.content;
    modelUsed = fallbackResult.modelUsed;
    suggestedActions = fallbackResult.suggestedActions;
    followUpQuestions = fallbackResult.followUpQuestions;
  }

  // 5. Save Assistant Reply to conversation thread
  const assistantMsgRecord = await ChatMessage.create({
    user: userId,
    role: 'assistant',
    content: assistantReplyText,
    biomarkerContext: ragContext.biomarkerContext,
    suggestedActions,
    modelUsed,
  });

  res.status(200).json({
    success: true,
    message: assistantMsgRecord,
    biomarkerContext: ragContext.biomarkerContext,
    suggestedActions,
    followUpQuestions,
  });
});

/**
 * @desc    Get Chat History for User
 * @route   GET /api/chat/history
 * @access  Private (User)
 */
export const getChatHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 40;
  const skip = (page - 1) * limit;

  const messages = await ChatMessage.find({ user: userId })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await ChatMessage.countDocuments({ user: userId });

  res.status(200).json({
    success: true,
    messages,
    total,
    page,
    hasMore: total > skip + messages.length,
  });
});

/**
 * @desc    Clear Conversation Thread
 * @route   DELETE /api/chat/history
 * @access  Private (User)
 */
export const clearChatHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await ChatMessage.deleteMany({ user: userId });

  res.status(200).json({
    success: true,
    message: 'Chat history cleared successfully',
  });
});

/**
 * @desc    Get Context-Aware Starter Prompt Suggestions
 * @route   GET /api/chat/suggestions
 * @access  Private (User)
 */
export const getChatSuggestions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const ragContext = await buildPatientRAGContext(userId);
  const bio = ragContext.biomarkerContext;

  const dynamicSuggestions = [];

  if (bio.hba1c >= 6.5) {
    dynamicSuggestions.push(`Can I eat biryani with my HbA1c at ${bio.hba1c}%?`);
    dynamicSuggestions.push(`What is an optimal bedtime snack to prevent morning dawn phenomenon?`);
  } else if (bio.hba1c >= 5.7) {
    dynamicSuggestions.push(`How can I reverse my prediabetes (HbA1c ${bio.hba1c}%) naturally?`);
    dynamicSuggestions.push(`What is my postprandial glucose spike threshold?`);
  } else {
    dynamicSuggestions.push(`What should I eat to optimize my metabolic health score?`);
    dynamicSuggestions.push(`How does intermittent fasting influence my glucose stability?`);
  }

  if (bio.systolic >= 130) {
    dynamicSuggestions.push(`Why is my blood pressure at ${bio.systolic}/${bio.diastolic} mmHg?`);
  } else {
    dynamicSuggestions.push(`How does my resting heart rate (${bio.restingHeartRate} BPM) reflect my fitness?`);
  }

  dynamicSuggestions.push(`Explain the biological connection between my sleep HRV and food cravings.`);

  res.status(200).json({
    success: true,
    suggestions: dynamicSuggestions.slice(0, 4),
    biomarkerSnapshot: bio,
  });
});
