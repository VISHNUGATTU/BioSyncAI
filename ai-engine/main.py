import os
import json
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, File, UploadFile, HTTPException, Body, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import numpy as np
import uvicorn

from vision_pipeline import vision_pipeline
from nutrition_db import nutrition_db
from metabolic_twin import MetabolicDigitalTwin
from clinical_ranker import clinical_ranker
from vital_simulator import vital_simulator

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
# Pydantic Schemas for Bio-Nutrition & Clinical Digital Twin
# ---------------------------------------------------------------------------

class DecomposeItemInput(BaseModel):
    itemName: str = Field(..., description="Name, barcode label, or recognized food key")
    quantity: Optional[float] = Field(1.0, ge=0.05, le=50.0, description="Serving portion quantity multiplier")
    unit: Optional[str] = Field(None, description="Optional custom serving unit (e.g. bowl, glass, pack)")


class NutritionDecomposeRequest(BaseModel):
    items: Optional[List[DecomposeItemInput]] = Field(None, description="List of items for multi-item meal decomposition")
    itemName: Optional[str] = Field(None, description="Single item name fallback")
    quantity: Optional[float] = Field(1.0, ge=0.05, description="Single item quantity multiplier")


class ClinicalRankRequest(BaseModel):
    items: List[Dict[str, Any]] = Field(..., description="List of candidate food items (by name, dictionary, or detection)")
    vitals: Optional[Dict[str, Any]] = Field(default_factory=dict, description="User's active blood biomarkers and clinical vitals")
    mealContext: Optional[str] = Field("Meal", description="Meal type context (Breakfast, Lunch, Dinner, Snack)")


class VitalSurgeSimulateRequest(BaseModel):
    itemName: Optional[str] = Field(None, description="Food item name or canonical key")
    netCarbs: Optional[float] = Field(None, description="Net digestible carbohydrates in grams")
    sodium: Optional[float] = Field(None, description="Sodium content in milligrams")
    glycemicIndex: Optional[int] = Field(None, description="Glycemic Index (0-100)")
    consumedQuantity: Optional[float] = Field(1.0, ge=0.05, le=50.0, description="Portion quantity multiplier")
    vitals: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Patient's active metabolic vitals")
    applyDoctorHacks: Optional[bool] = Field(False, description="Whether to simulate with doctor hacks applied")


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
            "digital_twin_engine": True,
            "clinical_pareto_ranker": True,
            "vital_surge_simulator": True,
        }
    }


@app.post("/api/v1/simulate-vital-surge")
async def simulate_vital_surge_endpoint(payload: VitalSurgeSimulateRequest = Body(...)):
    """
    Phase 4 Core Endpoint:
    Simulates continuous 180-minute postprandial vital dynamics using
    Runge-Kutta 4th Order integration of the Bergman Minimal Model and
    Windkessel Hemodynamic BP model, providing side-by-side standard vs.
    doctor-hacks projections.
    """
    carbs = payload.netCarbs
    sodium = payload.sodium
    gi = payload.glycemicIndex
    display_name = payload.itemName or "Custom Meal"

    # Auto-resolve nutrients if itemName is given
    if payload.itemName and (carbs is None or sodium is None or gi is None):
        data = nutrition_db.decompose(payload.itemName, quantity=1.0)
        if data:
            display_name = data["displayName"]
            if carbs is None:
                carbs = data["nutrients"].get("netCarbohydrates", data["nutrients"].get("carbohydrates", 20.0))
            if sodium is None:
                sodium = data["nutrients"].get("sodium", 150.0)
            if gi is None:
                gi = data.get("glycemicIndex", 50)

    carbs = max(0.0, float(carbs if carbs is not None else 25.0))
    sodium = max(0.0, float(sodium if sodium is not None else 200.0))
    gi = int(gi if gi is not None else 50)
    q = float(payload.consumedQuantity if payload.consumedQuantity is not None else 1.0)

    twin = MetabolicDigitalTwin.from_vitals_dict(payload.vitals or {})

    comparison = vital_simulator.simulate_comparison(
        net_carbs=carbs,
        sodium_mg=sodium,
        glycemic_index=gi,
        twin=twin,
        consumed_quantity=q
    )

    std_sim = comparison["standardIntake"]
    hacks_sim = comparison["withDoctorHacks"]

    return {
        "success": True,
        "itemName": display_name,
        "consumedQuantity": q,
        "effectiveCarbsGrams": float(np.round(carbs * q, 1)),
        "effectiveSodiumMg": float(np.round(sodium * q, 1)),
        "glycemicIndex": gi,
        "baselineVitals": std_sim["baselineVitals"],
        "peakProjections": std_sim["peakProjections"],
        "clinicalStatus": std_sim["clinicalStatus"],
        "clinicalAdvisory": std_sim["clinicalAdvisory"],
        "timeSeries": std_sim["timeSeries"],
        "withDoctorHacks": {
            "peakProjections": hacks_sim["peakProjections"],
            "clinicalStatus": hacks_sim["clinicalStatus"],
            "timeSeries": hacks_sim["timeSeries"],
        },
        "harmReductionBenefit": comparison["harmReductionBenefit"]
    }


@app.post("/api/v1/clinical-rank")
async def rank_candidates_endpoint(payload: ClinicalRankRequest = Body(...)):
    """
    Phase 3 Core Endpoint:
    Confined Personal Digital Twin (M_user) evaluates candidates using multi-objective
    Pareto optimization across Glycemic Stress, Vascular Strain, and Vitality,
    and returns non-preachy practical Doctor Hacks.
    """
    twin = MetabolicDigitalTwin.from_vitals_dict(payload.vitals or {})
    ranking_result = clinical_ranker.rank_candidates(payload.items, twin, meal_context=payload.mealContext)
    return ranking_result



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
async def detect_items_in_frame(
    file: UploadFile = File(...),
    vitals: Optional[str] = Form(None)
):
    """
    Primary Perception + Bio-Nutritional + Digital Twin Ranking Endpoint:
    Processes live frame snapshot, executes multi-hypothesis segmentation,
    OCR, and barcode inspection, enriches every detected item with full
    nutritional decomposition, and optionally evaluates against user vitals.
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
                    "aggregatedMealNutrition": None,
                    "clinicalRanking": None
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

        # Optional Phase 3 Digital Twin Pareto Ranking
        clinical_ranking = None
        vitals_dict = {}
        if vitals:
            try:
                vitals_dict = json.loads(vitals)
            except Exception:
                pass
        
        if enriched_items:
            twin = MetabolicDigitalTwin.from_vitals_dict(vitals_dict)
            clinical_ranking = clinical_ranker.rank_candidates(enriched_items, twin)

        return {
            "success": True,
            "identified": True,
            "message": inspection_result.get("message"),
            "confidenceScore": inspection_result.get("confidenceScore"),
            "detectedCount": inspection_result.get("detectedCount"),
            "items": enriched_items,
            "aggregatedMealNutrition": aggregated_meal,
            "clinicalRanking": clinical_ranking
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
async def analyze_frame_legacy(
    file: UploadFile = File(...),
    vitals: Optional[str] = Form(None)
):
    """
    Backward-compatible route for server/controllers/foodController.js
    Fuses multi-item detection with primary candidate resolution, attaches
    complete bio-nutritional decomposition, and computes digital twin Pareto ranking
    with realistic harm-reduction Doctor Hacks.
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

        # Parse patient vitals & run Digital Twin Pareto Ranker
        vitals_dict = {}
        if vitals:
            try:
                vitals_dict = json.loads(vitals)
            except Exception:
                pass

        twin = MetabolicDigitalTwin.from_vitals_dict(vitals_dict)
        candidate_pool = [{"itemName": primary_item["itemName"]}]
        for cand in primary_item.get("candidates", []):
            if cand.get("name") and cand["name"] != primary_item["itemName"]:
                candidate_pool.append({"itemName": cand["name"]})
        for other in inspection_result["items"][1:]:
            candidate_pool.append({"itemName": other["itemName"]})

        ranking_result = clinical_ranker.rank_candidates(candidate_pool, twin)

        primary_ranked = None
        if ranking_result.get("rankedItems"):
            for r in ranking_result["rankedItems"]:
                if (
                    r.get("canonicalKey") == primary_item.get("normalizedKey")
                    or r.get("displayName") == primary_item["itemName"]
                ):
                    primary_ranked = r
                    break
            if not primary_ranked:
                primary_ranked = ranking_result["rankedItems"][0]

        doctor_hacks = primary_ranked.get("doctorHacks", []) if primary_ranked else []
        personalized_insight = ranking_result.get(
            "clinicalRationale",
            "Normal metabolic response expected."
        )
        suggested_alternative = ranking_result.get(
            "bestSuggestableItem", {}
        ).get("displayName", "Consider pairing with fresh leafy greens.")

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
                "personalizedInsight": personalized_insight,
                "suggestedAlternative": suggested_alternative,
                "doctorHacks": doctor_hacks,
                "clinicalRanking": ranking_result,
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