from fastapi import FastAPI, UploadFile, File
import cv2
import tempfile
import os
from PIL import Image
from transformers import pipeline

app = FastAPI()

print("Downloading & Loading CLIP Zero-Shot AI...")
print("(Note: This will take a minute to download the new model weights)")

# 1. Load the Zero-Shot Vision Classifier (CLIP)
# This model doesn't use a fixed list. It uses whatever words we give it!
vision_classifier = pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32")

print("Zero-Shot AI Online and Ready.")

# 2. OUR Custom Knowledge Base & Vocabulary
# We tell the AI exactly what to look for. Add local dishes here!
CANDIDATE_LABELS = [
    "a cup of indian chai", 
    "a cup of black coffee",
    "a latte or cappuccino",
    "a glass of water",
    "a slice of pizza", 
    "a hamburger", 
    "a fresh apple",
    "a bowl of salad",
    "creme brulee" # We left this in just to prove it won't pick it anymore!
]

# The Nutritional Database mapping
FOOD_DB = {
    "indian chai": {"carbs": 15, "protein": 2, "fats": 3},
    "black coffee": {"carbs": 0, "protein": 0, "fats": 0},
    "latte or cappuccino": {"carbs": 12, "protein": 6, "fats": 5},
    "water": {"carbs": 0, "protein": 0, "fats": 0},
    "pizza": {"carbs": 36, "protein": 12, "fats": 10},
    "hamburger": {"carbs": 30, "protein": 20, "fats": 15},
    "apple": {"carbs": 25, "protein": 0, "fats": 0},
    "salad": {"carbs": 10, "protein": 5, "fats": 5},
    "creme brulee": {"carbs": 40, "protein": 4, "fats": 25},
    "default": {"carbs": 20, "protein": 10, "fats": 10}
}

@app.post("/analyze")
async def analyze_video(
    file: UploadFile = File(...),
    weight: float = 70.0,
    activity_level: str = "Moderate"
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
        temp_video.write(await file.read())
        video_path = temp_video.name

    try:
        cap = cv2.VideoCapture(video_path)
        success, frame = cap.read()
        cap.release()

        ai_prediction_label = "unknown"

        if success:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(rgb_frame)

            # 3. Ask CLIP to match the image to OUR specific list of labels
            predictions = vision_classifier(pil_image, candidate_labels=CANDIDATE_LABELS)
            
            # Extract the highest confidence prediction
            top_prediction = predictions[0]
            confidence_score = top_prediction['score']
            raw_label = top_prediction['label'].lower()
            
            # Confidence Threshold (Keep it at 20% for zero-shot, as probabilities are distributed differently)
            if confidence_score < 0.20:
                print(f"⚠️ LOW CONFIDENCE ({confidence_score:.2f}). Rejecting guess of '{raw_label}'.")
                ai_prediction_label = "unknown"
            else:
                ai_prediction_label = raw_label
                print(f"✅ CLIP Detected: {ai_prediction_label} (Confidence: {confidence_score:.2f})")

        if not success:
            ai_prediction_label = "unknown"

        # 4. Map the CLIP label back to our database keys
        food_found = "Unidentified Bio-Matter"
        macros = FOOD_DB["default"]
        
        if ai_prediction_label != "unknown":
            for key in FOOD_DB.keys():
                if key in ai_prediction_label:
                    macros = FOOD_DB[key]
                    food_found = key.title() # Make it look nice for dictation
                    break

        # 5. The Metabolic Algorithm
        activity_modifier = 0.7 if activity_level == "Athlete" else 1.0
        raw_spike = (macros["carbs"] * 2) - (macros["protein"] * 0.5) - (macros["fats"] * 0.2)
        final_impact = max(0, round((raw_spike / (weight / 70)) * activity_modifier))

        # 6. Verdict Generation
        verdict = "NOT-TAKEN" if final_impact > 30 else "TAKEN"
        script = f"Target identified: {food_found}. Estimated glucose impact is {final_impact} points. Verdict: {verdict}."

        return {
            "itemsFound": [food_found],
            "macros": macros,
            "glucoseImpact": final_impact,
            "verdict": verdict,
            "eatImpact": "High spike probability." if final_impact > 30 else "Stable energy conversion.",
            "skipImpact": "Avoids inflammation." if final_impact > 30 else "No significant change.",
            "recommendedQuantity": "None" if final_impact > 30 else "Standard Portion",
            "dictationScript": script
        }
    finally:
        if os.path.exists(video_path):
            os.remove(video_path)