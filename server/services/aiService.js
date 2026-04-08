import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch'; // Needed to grab the image buffer from Cloudinary

// Initialize the API (Make sure to put your API key in your .env file!)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const analyzeFoodAndPredictSpike = async (imageUrl, userBiometrics) => {
  try {
    // 1. Setup the Vision Model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 2. Fetch the image from Cloudinary and convert it to the format the AI needs
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageParts = [
      {
        inlineData: {
          data: Buffer.from(imageBuffer).toString("base64"),
          mimeType: imageResponse.headers.get("content-type"),
        },
      },
    ];

    // 3. The Contextual Prompt Engine
    // This is where we feed the AI the exact features we want to test for accuracy
    const prompt = `
      You are an expert endocrinologist and nutritionist AI. 
      Analyze the attached image of food.

      Here is the biological baseline of the user about to eat this:
      ${JSON.stringify(userBiometrics, null, 2)}

      Based on the visual portion size, macronutrient breakdown, and the user's specific metabolic profile (age, weight, activity level, diet, conditions), predict the estimated blood glucose impact (in mg/dL).

      You MUST respond with ONLY a raw JSON object. No markdown, no conversational text. Use this exact schema:
      {
        "foodName": "Short descriptive name of the meal",
        "macros": {
          "carbs": estimated_grams_number,
          "protein": estimated_grams_number,
          "fats": estimated_grams_number
        },
        "glucoseImpact": estimated_spike_number,
        "verdict": "OPTIMAL" | "MODERATE" | "SPIKE" 
      }

      Verdict rules:
      - OPTIMAL: Impact < 15 mg/dL
      - MODERATE: Impact 15 - 30 mg/dL
      - SPIKE: Impact > 30 mg/dL
    `;

    // 4. Execute the AI Analysis
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    let aiText = response.text();

    // 5. Clean the output (Strip markdown blocks if the AI accidentally adds them)
    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

    // Parse and return the structured JSON
    return JSON.parse(aiText);

  } catch (error) {
    console.error("AI Brain Failure:", error);
    throw new Error("Failed to process biometric analysis.");
  }
};