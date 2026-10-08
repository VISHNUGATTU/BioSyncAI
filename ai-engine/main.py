import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from vision_pipeline import vision_pipeline

app = FastAPI(
    title="BioSync AI Engine",
    description="Edge Metabolic Perception & Digital Twin Microservice",
    version="2.0.0"
)

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
    return {
        "status": "healthy",
        "service": "BioSync AI Engine",
        "version": "2.0.0",
        "models": {
            "yolo_detector": vision_pipeline.yolo_model is not None,
            "scene_ocr": vision_pipeline.ocr_reader is not None,
            "barcode_detector": vision_pipeline.barcode_detector is not None,
        }
    }


@app.post("/api/v1/detect-items")
async def detect_items_in_frame(file: UploadFile = File(...)):
    """
    Primary Phase 1 Endpoint:
    Processes live frame snapshot, executes multi-hypothesis segmentation,
    OCR, and barcode inspection. Never hallucinates or uses static mocks.
    """
    try:
        image_bytes = await file.read()
        if not image_bytes or len(image_bytes) < 100:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "identified": False,
                    "message": "Empty or corrupted image frame received."
                }
            )

        inspection_result = vision_pipeline.inspect_frame(image_bytes)

        # Honest rejection when nothing eatable is identified
        if not inspection_result.get("identified", False):
            return JSONResponse(
                status_code=200,
                content={
                    "success": False,
                    "identified": False,
                    "message": inspection_result.get("message"),
                    "confidenceScore": 0.0,
                    "detectedCount": 0,
                    "items": []
                }
            )

        return {
            "success": True,
            "identified": True,
            "message": inspection_result.get("message"),
            "confidenceScore": inspection_result.get("confidenceScore"),
            "detectedCount": inspection_result.get("detectedCount"),
            "items": inspection_result.get("items")
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "identified": False,
                "message": f"Perception pipeline execution error: {str(e)}"
            }
        )


@app.post("/api/v1/analyze")
async def analyze_frame_legacy(file: UploadFile = File(...)):
    """
    Backward-compatible route for server/controllers/foodController.js
    Fuses multi-item detection with primary candidate resolution.
    Zero static/mock data.
    """
    try:
        image_bytes = await file.read()
        inspection_result = vision_pipeline.inspect_frame(image_bytes)

        if not inspection_result.get("identified", False) or not inspection_result.get("items"):
            return JSONResponse(
                status_code=200,
                content={
                    "success": False,
                    "identified": False,
                    "message": inspection_result.get("message", "I cannot identify any eatable food in this frame."),
                    "data": None
                }
            )

        # Primary recognized candidate
        primary_item = inspection_result["items"][0]

        return {
            "success": True,
            "identified": True,
            "data": {
                "recognizedItemName": primary_item["itemName"],
                "category": primary_item["category"],
                "confidenceScore": primary_item["confidenceScore"],
                "confidenceLevel": primary_item["confidenceLevel"],
                "brand": primary_item.get("brand"),
                "candidates": primary_item.get("candidates", []),
                "allDetectedItems": inspection_result["items"]
            }
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Analysis pipeline error: {str(e)}"
            }
        )


if __name__ == "__main__":
    host = os.getenv("AI_ENGINE_HOST", "0.0.0.0")
    port = int(os.getenv("AI_ENGINE_PORT", 8000))
    uvicorn.run(app, host=host, port=port)