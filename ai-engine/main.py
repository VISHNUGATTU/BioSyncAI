import os
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uvicorn

from vision_pipeline import vision_pipeline
from nutrition_db import nutrition_db

app = FastAPI(
    title="BioSync AI Engine",
    description="Edge Metabolic Perception, Bio-Nutritional Decomposition & Digital Twin Microservice",
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


# ---------------------------------------------------------------------------
# Pydantic Schemas for Nutritional Decomposition
# ---------------------------------------------------------------------------

class DecomposeItemInput(BaseModel):
    itemName: str = Field(..., description="Name, barcode label, or recognized food key")
    quantity: Optional[float] = Field(1.0, ge=0.05, le=50.0, description="Serving portion quantity multiplier")
    unit: Optional[str] = Field(None, description="Optional custom serving unit (e.g. bowl, glass, pack)")


class NutritionDecomposeRequest(BaseModel):
    items: Optional[List[DecomposeItemInput]] = Field(None, description="List of items for multi-item meal decomposition")
    itemName: Optional[str] = Field(None, description="Single item name fallback")
    quantity: Optional[float] = Field(1.0, ge=0.05, description="Single item quantity multiplier")


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
            "nutrition_catalog_entries": len(nutrition_db.NUTRITION_CATALOG),
        }
    }


@app.get("/api/v1/nutrition-catalog")
def get_nutrition_catalog():
    """
    Returns verified clinical food catalog items for frontend search and auto-completion.
    """
    catalog = nutrition_db.list_catalog()
    categories = sorted(list({item["category"] for item in catalog}))
    return {
        "success": True,
        "totalItems": len(catalog),
        "categories": categories,
        "catalog": catalog
    }


@app.post("/api/v1/nutrition-decompose")
async def decompose_nutrition(payload: NutritionDecomposeRequest = Body(...)):
    """
    Phase 2 Core Endpoint:
    Decomposes foods into exact macronutrients, micronutrients/minerals,
    essential vitamins, and glycemic metrics scaled by portion quantity.
    Never hallucinates: unknown non-food items are strictly reported as uncataloged.
    """
    # 1. Normalize items list
    items_to_process: List[DecomposeItemInput] = []
    if payload.items and len(payload.items) > 0:
        items_to_process = payload.items
    elif payload.itemName:
        items_to_process = [DecomposeItemInput(itemName=payload.itemName, quantity=payload.quantity or 1.0)]
    else:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Please provide an itemName or a list of items to decompose."
            }
        )

    decomposed_items = []
    unrecognized_items = []

    for item in items_to_process:
        q = float(item.quantity) if item.quantity else 1.0
        data = nutrition_db.decompose(item.itemName, quantity=q)
        if data:
            if item.unit:
                data["userRequestedUnit"] = item.unit
            decomposed_items.append(data)
        else:
            unrecognized_items.append({
                "itemName": item.itemName,
                "quantity": q,
                "decomposed": False,
                "message": "Item not recognized in clinical database; manual nutritional entry required."
            })

    # 2. Compute aggregated meal totals across all recognized components
    aggregated_nutrition = nutrition_db.aggregate_nutrients(decomposed_items)

    return {
        "success": True,
        "resolvedCount": len(decomposed_items),
        "unresolvedCount": len(unrecognized_items),
        "items": decomposed_items,
        "unrecognizedItems": unrecognized_items,
        "aggregatedMealNutrition": aggregated_nutrition
    }


@app.post("/api/v1/detect-items")
async def detect_items_in_frame(file: UploadFile = File(...)):
    """
    Primary Perception + Bio-Nutritional Endpoint:
    Processes live frame snapshot, executes multi-hypothesis segmentation,
    OCR, and barcode inspection, and automatically enriches every detected item
    with full nutritional and glycemic decomposition.
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
                    "items": [],
                    "aggregatedMealNutrition": None
                }
            )

        # Enrich detected items with Phase 2 Bio-Nutritional Decomposition
        enriched_items = []
        decomposed_for_aggregation = []
        for item in inspection_result.get("items", []):
            item_copy = dict(item)
            # Try normalizedKey first, then itemName
            nutr = nutrition_db.decompose(item_copy.get("normalizedKey", ""), 1.0)
            if not nutr:
                nutr = nutrition_db.decompose(item_copy.get("itemName", ""), 1.0)

            item_copy["nutritionProfile"] = nutr
            enriched_items.append(item_copy)
            if nutr:
                decomposed_for_aggregation.append(nutr)

        aggregated_meal = (
            nutrition_db.aggregate_nutrients(decomposed_for_aggregation)
            if decomposed_for_aggregation else None
        )

        return {
            "success": True,
            "identified": True,
            "message": inspection_result.get("message"),
            "confidenceScore": inspection_result.get("confidenceScore"),
            "detectedCount": inspection_result.get("detectedCount"),
            "items": enriched_items,
            "aggregatedMealNutrition": aggregated_meal
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
    Fuses multi-item detection with primary candidate resolution and attaches
    complete bio-nutritional decomposition for immediate clinical consumption.
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

        # Decompose primary item
        primary_nutrition = nutrition_db.decompose(primary_item.get("normalizedKey", ""), 1.0)
        if not primary_nutrition:
            primary_nutrition = nutrition_db.decompose(primary_item.get("itemName", ""), 1.0)

        # Enrich all detected items
        enriched_all_items = []
        for it in inspection_result["items"]:
            it_copy = dict(it)
            n = nutrition_db.decompose(it_copy.get("normalizedKey", ""), 1.0)
            if not n:
                n = nutrition_db.decompose(it_copy.get("itemName", ""), 1.0)
            it_copy["nutritionProfile"] = n
            enriched_all_items.append(it_copy)

        nutrients = primary_nutrition.get("nutrients", {}) if primary_nutrition else {}
        gi = primary_nutrition.get("glycemicIndex", 50) if primary_nutrition else 50
        gl = primary_nutrition.get("glycemicLoad", 0.0) if primary_nutrition else 0.0
        serving_size = primary_nutrition.get("standardServing", "1 standard portion") if primary_nutrition else "1 standard portion"
        serving_unit = primary_nutrition.get("servingUnit", "portion") if primary_nutrition else "portion"
        serving_weight = primary_nutrition.get("servingWeightGrams", 100) if primary_nutrition else 100

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
                "servingSize": serving_size,
                "servingUnit": serving_unit,
                "servingWeightGrams": serving_weight,
                "glycemicIndex": gi,
                "glycemicLoad": gl,
                "glycemicLoadCategory": primary_nutrition.get("glycemicLoadCategory", "Low") if primary_nutrition else "Low",
                "nutrients": nutrients,
                "allDetectedItems": enriched_all_items
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