import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import fetch from 'node-fetch';

// --- THE LOCAL KNOWLEDGE BASE ---
// Since we don't have an LLM, we need a local dictionary of common macros.
// You can expand this JSON to include thousands of foods later.
const localFoodDatabase = {
  "pizza": { carbs: 36, protein: 12, fats: 10, type: "Heavy Carbs" },
  "apple": { carbs: 25, protein: 0, fats: 0, type: "Fructose" },
  "espresso": { carbs: 0, protein: 0, fats: 0, type: "Stimulant" },
  "ice cream": { carbs: 32, protein: 5, fats: 15, type: "High Sugar" },
  "burger": { carbs: 30, protein: 20, fats: 15, type: "Mixed" },
  "default": { carbs: 20, protein: 10, fats: 10, type: "Unknown" }
};

// Keep the model in memory so it doesn't have to load on every scan
let classificationModel = null;

export const analyzeFoodLocally = async (imageUrl, userBiometrics) => {
  try {
    // 1. Load the free, local TensorFlow model if it isn't loaded yet
    if (!classificationModel) {
      classificationModel = await mobilenet.load({ version: 2, alpha: 1.0 });
    }

    // 2. Fetch and format the image for TensorFlow
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.buffer();
    const tfImage = tf.node.decodeImage(imageBuffer, 3);

    // 3. Classify the image (Identify the food)
    const predictions = await classificationModel.classify(tfImage);
    tfImage.dispose(); // Free up server RAM

    // Grab the top prediction (e.g., "Granny Smith Apple" -> "apple")
    const topPrediction = predictions[0].className.toLowerCase();
    
    // 4. Cross-reference with our database
    let foodKey = "default";
    for (const key of Object.keys(localFoodDatabase)) {
      if (topPrediction.includes(key)) {
        foodKey = key;
        break;
      }
    }
    const nutritionalData = localFoodDatabase[foodKey];
    const foodNameFound = foodKey === "default" ? "Unidentified Bio-Matter" : topPrediction;

    // 5. THE ALGORITHM: Calculate Glucose Impact
    // This replaces the LLM. We calculate the spike using a mathematical heuristic.
    // Formula: (Carbs * 2) - (Protein * 0.5) - (Fat * 0.2) adjusted by User Weight
    const userWeight = userBiometrics.weight || 70; // fallback to 70kg
    const activityModifier = userBiometrics.activityLevel === "Athlete" ? 0.7 : 1.0; 
    
    let rawSpike = (nutritionalData.carbs * 2) - (nutritionalData.protein * 0.5) - (nutritionalData.fats * 0.2);
    // Heavier people generally have more blood volume, diluting the spike slightly
    let finalImpact = Math.max(0, Math.round((rawSpike / (userWeight / 70)) * activityModifier));

    // 6. Determine Verdict
    let verdict = "OPTIMAL";
    let eatImpactStr = "Stable energy conversion.";
    let skipImpactStr = "No significant metabolic change.";

    if (finalImpact > 30) {
      verdict = "SPIKE";
      eatImpactStr = "High probability of severe glycemic spike and subsequent crash.";
      skipImpactStr = "Avoids inflammatory glucose response.";
    } else if (finalImpact > 15) {
      verdict = "MODERATE";
      eatImpactStr = "Moderate insulin response required.";
    }

    // 7. Generate the Dictation Script
    const script = `Target identified: ${foodNameFound}. Analysis indicates a ${finalImpact} milligram per deciliter glucose impact. Verdict is ${verdict}.`;

    return {
      itemsFound: [foodNameFound],
      macros: nutritionalData,
      eatImpact: eatImpactStr,
      skipImpact: skipImpactStr,
      verdict: verdict,
      glucoseImpact: finalImpact,
      recommendedQuantity: verdict === "SPIKE" ? "Not Recommended" : "Standard Portion",
      dictationScript: script
    };

  } catch (error) {
    console.error("Local Brain Failure:", error);
    throw new Error("Failed to process local bio-scan.");
  }
};