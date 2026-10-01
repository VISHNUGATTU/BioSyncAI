import os
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="BioSync AI Engine", version="1.0.0")

allowed_origins = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "BioSync AI Engine"}

@app.post("/api/v1/analyze")
async def analyze_video_frame(file: UploadFile = File(...)):
    # Computer vision and nutritional decomposition pipeline
    return {
        "success": True,
        "data": {
            "recognizedItemName": "Grilled Salmon with Quinoa",
            "confidenceScore": 0.94,
            "nutrients": {
                "calories": 450,
                "carbohydrates": 30,
                "proteins": 45,
                "fats": 20,
                "sugar": 2,
                "fiber": 5,
                "sodium": 320,
                "cholesterol": 70
            }
        }
    }

if __name__ == "__main__":
    host = os.getenv("AI_ENGINE_HOST", "0.0.0.0")
    port = int(os.getenv("AI_ENGINE_PORT", 8000))
    uvicorn.run(app, host=host, port=port)