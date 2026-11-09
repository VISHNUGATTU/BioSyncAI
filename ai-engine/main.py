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
from adaptive_calibration import kalman_engine
from pharmacodynamics import pharmacodynamics_engine
from cgm_analytics import cgm_analytics_engine
from micronutrient_synergy import micronutrient_synergy_engine
from omni_twin_engine import omni_twin_engine
from food_simulation_engine import food_simulation_engine
from family_allocator import family_plating_allocator
from ayur_pharma_matrix import ayur_pharma_matrix
from kds_formatter import kds_formatter
from hemodynamic_estimator import hemodynamic_estimator
from vernacular_voice_coach import vernacular_voice_coach
from smart_kitchen_hardware_interface import smart_kitchen_hardware

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


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "BioSync AI Engine - Omni-Twin Physiology Suite v3.0",
        "version": "3.0.0",
        "description": "Multi-Compartment Metabolic Digital Twin, Clinical Incretin Dynamics & Continuous Telemetry Microservice",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "omniTwinSimulate": "/api/v1/omni-twin/simulate",
            "cgmStream": "/api/v1/omni-twin/cgm-stream",
            "pharmacodynamics": "/api/v1/omni-twin/pharmacodynamics",
            "micronutrientSynergy": "/api/v1/omni-twin/micronutrient-synergy",
            "decompose": "/api/v1/nutrition/decompose",
            "foodCatalog": "/api/v1/nutrition/catalog",
            "clinicalRank": "/api/v1/twin/clinical-rank",
            "simulateVitalSurge": "/api/v1/twin/simulate-vital-surge",
            "calibrateTwin": "/api/v1/twin/calibrate",
            "simulateMealForecast": "/api/v1/simulate-meal-forecast",
            "ambulationPlan": "/api/v1/biohacks/ambulation-plan",
            "familyAllocate": "/api/v1/family/allocate-single-pot",
            "ayurPharmaScreen": "/api/v1/ayur-pharma/screen",
            "kdsFormatTicket": "/api/v1/kds/format-ticket",
            "cufflessBP": "/api/v1/hemodynamics/estimate-cuffless-bp",
            "analyzeHRV": "/api/v1/hemodynamics/analyze-hrv",
            "detectMealStart": "/api/v1/sensors/detect-meal-start",
            "vernacularVoiceParse": "/api/v1/voice/parse-and-simulate",
            "vernacularKitchenCoach": "/api/v1/voice/kitchen-coach",
            "readOpticalOilSensor": "/api/v1/hardware/read-optical-oil-sensor",
            "verifyGravimetricPlating": "/api/v1/hardware/verify-gravimetric-plating"
        }
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "BioSync AI Engine",
        "version": "3.0.0",
        "models": {
            "yolo": vision_pipeline.yolo_model is not None,
            "ocr": vision_pipeline.ocr_reader is not None,
            "nutritionCatalogItems": len(nutrition_db.NUTRITION_CATALOG),
            "kalmanEngine": True,
            "omniTwinEngine": True,
            "cgmAnalyticsEngine": True,
            "pharmacodynamicsEngine": True,
            "micronutrientSynergyEngine": True,
            "foodSimulationEngine": True,
            "familyPlatingAllocator": True,
            "ayurPharmaMatrix": True,
            "kdsFormatter": True,
            "hemodynamicEstimator": True,
            "vernacularVoiceCoach": True,
            "smartKitchenHardware": True
        }
    }


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return JSONResponse(status_code=204, content={})


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
    fatGrams: Optional[float] = Field(None, description="Dietary fat content in grams (slows gastric emptying)")
    fiberGrams: Optional[float] = Field(None, description="Dietary soluble fiber in grams (blunts peak glucose absorption)")
    glycemicIndex: Optional[int] = Field(None, description="Glycemic Index (0-100)")
    consumedQuantity: Optional[float] = Field(1.0, ge=0.05, le=50.0, description="Portion quantity multiplier")
    vitals: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Patient's active metabolic vitals")
    applyDoctorHacks: Optional[bool] = Field(False, description="Whether to simulate with doctor hacks applied")


class OmniTwinSimulateRequest(BaseModel):
    itemName: Optional[str] = Field(None, max_length=200, description="Food item name or canonical key")
    netCarbs: Optional[float] = Field(None, ge=0.0, le=1000.0, description="Net digestible carbohydrates in grams")
    sodium: Optional[float] = Field(None, ge=0.0, le=25000.0, description="Sodium content in milligrams")
    fatGrams: Optional[float] = Field(None, ge=0.0, le=500.0, description="Dietary fat content in grams")
    fiberGrams: Optional[float] = Field(None, ge=0.0, le=200.0, description="Dietary soluble fiber in grams")
    potassiumMg: Optional[float] = Field(0.0, ge=0.0, le=15000.0, description="Dietary potassium in milligrams")
    glycemicIndex: Optional[int] = Field(None, ge=0, le=120, description="Glycemic Index (0-100)")
    consumedQuantity: Optional[float] = Field(1.0, ge=0.05, le=50.0, description="Portion multiplier")
    mealTimeHour: Optional[float] = Field(None, ge=0.0, le=24.0, description="Hour of day (0.0 - 24.0) for circadian chrono-biology")
    medications: Optional[List[str]] = Field(default_factory=list, max_items=25, description="Patient's active medications")
    foodNames: Optional[List[str]] = Field(default_factory=list, max_items=50, description="List of food items")
    vitals: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Patient's baseline metabolic vitals")
    applyDoctorHacks: Optional[bool] = Field(False, description="Whether to simulate with clinical bio-hacks applied")
    enableCgmStream: Optional[bool] = Field(True, description="Whether to synthesize 5-min CGM stream and AGP metrics")


class PharmacodynamicsRequest(BaseModel):
    medications: List[str] = Field(..., max_items=25, description="List of medications to evaluate")
    foodItems: Optional[List[str]] = Field(default_factory=list, max_items=50, description="Optional meal foods to check for food-drug interactions")


class MicronutrientSynergyRequest(BaseModel):
    nutrients: Dict[str, Any] = Field(..., description="Nutrient map (sodium, potassium, calcium, magnesium, iron, vitaminC, etc.)")
    foodNames: Optional[List[str]] = Field(default_factory=list, max_items=50, description="Meal components")


class CGMGenerateRequest(BaseModel):
    plasmaTrajectory: List[Dict[str, float]] = Field(..., max_items=1000, description="Discrete plasma glucose trajectory points")
    samplingIntervalMinutes: Optional[int] = Field(5, ge=1, le=60, description="CGM sampling interval in minutes")
    diffusionLagMinutes: Optional[float] = Field(10.0, ge=1.0, le=60.0, description="Interstitial subcutaneous diffusion lag constant")


class WeeklyCalibrationRequest(BaseModel):
    userId: Optional[str] = Field(None, description="Patient User ID")
    previousVitals: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Previous baseline vitals / twin state")
    newTestVitals: Dict[str, Any] = Field(..., description="Newly submitted weekly lab test biomarkers")
    weeklyMealStats: Optional[Dict[str, float]] = Field(None, description="Aggregated weekly meal stats (avgDailyCarbs, avgDailySodium)")
    covarianceMatrix: Optional[List[List[float]]] = Field(None, description="Previous error covariance matrix P")
    adaptiveNoise: Optional[bool] = Field(False, description="Whether to use Sage-Husa adaptive innovation noise covariance")


class MealForecastRequest(BaseModel):
    vitals: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Patient's current or baseline vitals")
    items: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Cart items to simulate")
    orderMode: Optional[str] = Field("VITALS_GUARD", description="Commerce mode: VITALS_GUARD or CHEAT_MODE_OVERRIDE")
    mealTimeHour: Optional[float] = Field(None, ge=0.0, le=24.0, description="Hour of meal for circadian curve")


class AmbulationPlanRequest(BaseModel):
    simulatedPeakGlucose: float = Field(..., ge=40.0, le=600.0, description="Projected peak glucose in mg/dL")
    targetCeilingGlucose: Optional[float] = Field(140.0, ge=70.0, le=250.0, description="Desired safe ceiling (default 140 mg/dL)")
    bmi: Optional[float] = Field(24.5, ge=10.0, le=60.0, description="Patient BMI for volume of distribution calculation")
    timeToPeakMin: Optional[int] = Field(45, ge=5, le=180, description="Projected time to peak excursion")


class FamilyAllocationRequest(BaseModel):
    familyMembers: List[Dict[str, Any]] = Field(..., description="Array of family member profiles with clinical targets")
    orderedDishes: List[Dict[str, Any]] = Field(..., description="Array of shared bulk dishes ordered for the household")


class AyurPharmaScreenRequest(BaseModel):
    botanicals: List[Dict[str, Any]] = Field(..., description="Active botanicals in the food items (Karela, Methi, Giloy, etc.)")
    medications: List[str] = Field(default_factory=list, description="Patient's current active allopathic prescriptions")
    clinicalConditions: Optional[List[str]] = Field(default_factory=list, description="Patient's clinical diagnoses (CKD, T2D, etc.)")


class KDSTicketRequest(BaseModel):
    orderNumber: str = Field(..., description="Unique order tracking identifier")
    restaurantName: str = Field(..., description="Restaurant / Cloud Kitchen name")
    orderMode: Optional[str] = Field("VITALS_GUARD", description="Commerce mode: VITALS_GUARD or CHEAT_MODE_OVERRIDE")
    items: List[Dict[str, Any]] = Field(..., description="Ordered items with applied health modifications")
    mitigationPlan: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Pre-bite sequencing and ambulation instructions")
    familyAllocation: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Multi-member plate allocation guide")


class CufflessBPEstimateRequest(BaseModel):
    ptt_ms: float = Field(..., ge=80.0, le=600.0, description="Pulse Transit Time in milliseconds")
    heart_rate_bpm: Optional[float] = Field(72.0, ge=30.0, le=240.0, description="Simultaneous heart rate in bpm")
    patient_height_cm: Optional[float] = Field(172.0, ge=100.0, le=250.0, description="Patient height for aortic length scaling")
    baseline_sbp: Optional[float] = Field(120.0, ge=70.0, le=240.0, description="Baseline calibrated systolic blood pressure")
    baseline_dbp: Optional[float] = Field(80.0, ge=40.0, le=140.0, description="Baseline calibrated diastolic blood pressure")
    ppg_inflection_ratio: Optional[float] = Field(0.65, ge=0.1, le=1.5, description="Photoplethysmography dicrotic notch inflection ratio")


class HRVAnalysisRequest(BaseModel):
    rr_intervals_ms: List[float] = Field(..., description="Array of inter-beat intervals (RR) in milliseconds")


class MealInitiationDetectRequest(BaseModel):
    accelerometer_variance: float = Field(..., description="IMU 3-axis motion variance from smartwatch")
    audio_frequency_spectrum: Optional[List[float]] = Field(default_factory=list, description="Acoustic energy spectrum in 1.2-2.5 Hz band")
    continuous_heart_rate: Optional[float] = Field(72.0, description="Real-time optical heart rate")
    resting_baseline_hr: Optional[float] = Field(70.0, description="Patient resting heart rate baseline")


@app.post("/api/v1/omni-twin/simulate")
def simulate_omni_twin_endpoint(payload: OmniTwinSimulateRequest = Body(...)):
    """
    Omni-Twin v3.0 Core Endpoint:
    Executes UVA-Padova / Dalla-Man 7-compartment metabolic integration,
    Windkessel baroreflex hemodynamics, circadian chrono-biology,
    pharmacodynamic medication modulation, Bayesian credible intervals,
    and continuous CGM telemetry stream synthesis.
    """
    carbs = payload.netCarbs
    sodium = payload.sodium
    fat = payload.fatGrams
    fiber = payload.fiberGrams
    potassium = payload.potassiumMg or 0.0
    gi = payload.glycemicIndex
    food_names = list(payload.foodNames or [])

    if payload.itemName:
        if payload.itemName not in food_names:
            food_names.append(payload.itemName)
        if carbs is None or sodium is None or gi is None:
            data = nutrition_db.decompose(payload.itemName, quantity=1.0)
            if data:
                if carbs is None:
                    carbs = data["nutrients"].get("netCarbohydrates", data["nutrients"].get("carbohydrates", 25.0))
                if sodium is None:
                    sodium = data["nutrients"].get("sodium", 150.0)
                if fat is None:
                    fat = data["nutrients"].get("fat", 0.0)
                if fiber is None:
                    fiber = data["nutrients"].get("fiber", 0.0)
                if potassium <= 0.0:
                    potassium = data["nutrients"].get("potassium", 200.0)
                if gi is None:
                    gi = data.get("glycemicIndex", 50)

    carbs = max(0.0, float(carbs if carbs is not None else 25.0))
    sodium = max(0.0, float(sodium if sodium is not None else 200.0))
    fat = max(0.0, float(fat if fat is not None else 0.0))
    fiber = max(0.0, float(fiber if fiber is not None else 0.0))
    potassium = max(0.0, float(potassium))
    gi = int(gi if gi is not None else 50)
    q = float(payload.consumedQuantity if payload.consumedQuantity is not None else 1.0)

    twin = MetabolicDigitalTwin.from_vitals_dict(payload.vitals or {})

    res = omni_twin_engine.simulate_omni_dynamics(
        net_carbs=carbs,
        sodium_mg=sodium,
        glycemic_index=gi,
        twin=twin,
        consumed_quantity=q,
        fat_grams=fat,
        fiber_grams=fiber,
        potassium_mg=potassium,
        meal_time_hour=payload.mealTimeHour,
        medications=payload.medications,
        food_names=food_names,
        apply_doctor_hacks=bool(payload.applyDoctorHacks),
        enable_cgm_stream=bool(payload.enableCgmStream)
    )
    return res


@app.post("/api/v1/omni-twin/cgm-stream")
def generate_cgm_stream_endpoint(payload: CGMGenerateRequest = Body(...)):
    """
    Transforms arbitrary plasma glucose trajectories into continuous subcutaneous
    CGM sensor streams with interstitial lag and clinical AGP metrics.
    """
    return cgm_analytics_engine.generate_cgm_stream(
        plasma_glucose_trajectory=payload.plasmaTrajectory,
        sampling_interval_min=payload.samplingIntervalMinutes or 5,
        tau_lag_min=payload.diffusionLagMinutes or 10.0
    )


@app.post("/api/v1/omni-twin/pharmacodynamics")
def evaluate_pharmacodynamics_endpoint(payload: PharmacodynamicsRequest = Body(...)):
    """
    Evaluates multi-drug cardiometabolic pharmacodynamic modulation and food-drug interactions.
    """
    profile = pharmacodynamics_engine.resolve_profile(
        medications=payload.medications,
        food_items=payload.foodItems
    )
    return {
        "success": True,
        "activeMedications": profile.active_medications,
        "egpSuppressionFactor": float(np.round(profile.egp_suppression_factor, 3)),
        "renalThresholdMgDl": profile.renal_threshold_mg_dl,
        "gastricDelayFactor": float(np.round(profile.gastric_delay_factor, 2)),
        "incretinInsulinBoost": float(np.round(profile.incretin_insulin_boost, 2)),
        "peripheralSensitivityBoost": float(np.round(profile.peripheral_sensitivity_boost, 3)),
        "vascularSodiumBluntFactor": float(np.round(profile.vascular_sodium_blunt_factor, 2)),
        "baroreflexHrAttenuation": float(np.round(profile.baroreflex_hr_attenuation, 2)),
        "clinicalAlerts": profile.clinical_alerts,
        "foodDrugInteractions": profile.food_drug_interactions
    }


@app.post("/api/v1/omni-twin/micronutrient-synergy")
def evaluate_micronutrient_synergy_endpoint(payload: MicronutrientSynergyRequest = Body(...)):
    """
    Evaluates dietary electrolyte ratios (Na:K, Ca:Mg) and biochemical absorption synergies.
    """
    synergy = micronutrient_synergy_engine.evaluate_meal_synergies(
        nutrients=payload.nutrients,
        detected_food_names=payload.foodNames
    )
    return {
        "success": True,
        "data": synergy
    }


@app.post("/api/v1/simulate-meal-forecast")
def simulate_meal_forecast_endpoint(payload: MealForecastRequest = Body(...)):
    """
    Phase 2 Core In-Silico Pre-Order Endpoint:
    Simulates multi-item restaurant carts against the user's 7-compartment digital twin,
    factoring in amylose retardation, resistant starch, gastric emptying delays,
    and returns 4-hour trajectories, peak projections, and autonomous bio-hack plans.
    """
    try:
        result = food_simulation_engine.simulate_meal_cart(
            vitals=payload.vitals,
            items=payload.items,
            order_mode=payload.orderMode or "VITALS_GUARD",
            meal_time_hour=payload.mealTimeHour
        )
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"In-Silico meal forecast failed: {str(e)}"
            }
        )


@app.post("/api/v1/biohacks/ambulation-plan")
def calculate_ambulation_plan_endpoint(payload: AmbulationPlanRequest = Body(...)):
    """
    Computes exact walking minutes and step quotas to clear excess glycemic pool
    via non-insulin-mediated GLUT4 translocation.
    """
    try:
        plan = food_simulation_engine.calculate_ambulation_plan(
            simulated_peak_glucose=payload.simulatedPeakGlucose,
            target_ceiling_glucose=payload.targetCeilingGlucose or 140.0,
            bmi=payload.bmi or 24.5,
            time_to_peak_min=payload.timeToPeakMin or 45
        )
        return {
            "success": True,
            "data": plan
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Ambulation plan calculation failed: {str(e)}"
            }
        )


@app.post("/api/v1/family/allocate-single-pot")
def allocate_family_single_pot_endpoint(payload: FamilyAllocationRequest = Body(...)):
    """
    Phase 3 Core Endpoint:
    Disaggregates shared family bulk dishes (1kg Biryani handi, dals, curries)
    into individualized plate gram weights conforming to multi-generational metabolic targets.
    """
    try:
        allocation = family_plating_allocator.allocate_single_pot(
            family_members=payload.familyMembers,
            ordered_dishes=payload.orderedDishes
        )
        return allocation
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Family single-pot allocation failed: {str(e)}"
            }
        )


@app.post("/api/v1/ayur-pharma/screen")
def screen_ayur_pharma_endpoint(payload: AyurPharmaScreenRequest = Body(...)):
    """
    Phase 3 Core Endpoint:
    Screens active Indian botanicals against patient's prescription allopathic drugs
    for severe adverse interactions (e.g. Karela + Glimepiride hypoglycemia, Giloy + Statin HILI).
    """
    try:
        report = ayur_pharma_matrix.evaluate_cross_interactions(
            botanicals=payload.botanicals,
            medications=payload.medications,
            clinical_conditions=payload.clinicalConditions
        )
        return report
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Ayur-Pharma screening failed: {str(e)}"
            }
        )


@app.post("/api/v1/kds/format-ticket")
def format_kds_ticket_endpoint(payload: KDSTicketRequest = Body(...)):
    """
    Phase 3 Core Endpoint:
    Generates standardized Cloud Kitchen Display System (KDS) and ESC/POS thermal printer tickets
    annotated with recipe modifications, food sequencing box labels, and cryptographic order hashes.
    """
    try:
        ticket = kds_formatter.generate_kitchen_ticket(
            order_number=payload.orderNumber,
            restaurant_name=payload.restaurantName,
            order_mode=payload.orderMode or "VITALS_GUARD",
            items=payload.items,
            mitigation_plan=payload.mitigationPlan,
            family_allocation=payload.familyAllocation
        )
        return ticket
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"KDS ticket formatting failed: {str(e)}"
            }
        )


@app.post("/api/v1/hemodynamics/estimate-cuffless-bp")
def estimate_cuffless_bp_endpoint(payload: CufflessBPEstimateRequest = Body(...)):
    """
    Phase 4 Core Endpoint:
    Estimates continuous Systolic & Diastolic Blood Pressure from Pulse Transit Time (PTT)
    using the Moens-Korteweg vascular elasticity equations.
    """
    try:
        result = hemodynamic_estimator.estimate_cuffless_bp(
            ptt_ms=payload.ptt_ms,
            heart_rate_bpm=payload.heart_rate_bpm or 72.0,
            patient_height_cm=payload.patient_height_cm or 172.0,
            baseline_sbp=payload.baseline_sbp or 120.0,
            baseline_dbp=payload.baseline_dbp or 80.0,
            ppg_inflection_ratio=payload.ppg_inflection_ratio or 0.65
        )
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Cuffless BP estimation failed: {str(e)}"
            }
        )


@app.post("/api/v1/hemodynamics/analyze-hrv")
def analyze_hrv_endpoint(payload: HRVAnalysisRequest = Body(...)):
    """
    Phase 4 Core Endpoint:
    Extracts time-domain (SDNN, RMSSD, pNN50) and Baevsky Sympathetic Stress Index
    from continuous RR intervals to detect acute postprandial visceral stress.
    """
    try:
        report = hemodynamic_estimator.analyze_hrv(
            rr_intervals_ms=payload.rr_intervals_ms
        )
        return report
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"HRV analysis failed: {str(e)}"
            }
        )


@app.post("/api/v1/sensors/detect-meal-start")
def detect_meal_start_endpoint(payload: MealInitiationDetectRequest = Body(...)):
    """
    Phase 4 Core Endpoint:
    Classifies unlogged meal initiation from smartwatch accelerometer variance,
    audio mastication frequency band (1.2-2.5 Hz), and cephalic heart rate surge.
    """
    try:
        detection = hemodynamic_estimator.detect_meal_initiation(
            accelerometer_variance=payload.accelerometer_variance,
            audio_frequency_spectrum=payload.audio_frequency_spectrum or [],
            continuous_heart_rate=payload.continuous_heart_rate or 72.0,
            resting_baseline_hr=payload.resting_baseline_hr or 70.0
        )
        return detection
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Meal initiation detection failed: {str(e)}"
            }
        )





@app.post("/api/v1/calibrate-twin")
@app.post("/api/v1/twin/calibrate")
def calibrate_twin_endpoint(payload: WeeklyCalibrationRequest = Body(...)):
    """
    Phase 5 Core Endpoint:
    Recursively updates personal metabolic sensitivities (beta_carb, beta_sodium, S_I)
    using the Extended Kalman Filter when new weekly test biomarkers arrive.
    """
    twin = MetabolicDigitalTwin.from_vitals_dict(payload.previousVitals or {}, user_id=payload.userId)
    calibration_result = kalman_engine.calibrate(
        current_twin=twin,
        new_vitals=payload.newTestVitals,
        weekly_meal_stats=payload.weeklyMealStats,
        prior_covariance=payload.covarianceMatrix,
        adaptive_noise=bool(payload.adaptiveNoise)
    )
    return calibration_result


@app.post("/api/v1/simulate-vital-surge")
@app.post("/api/v1/twin/simulate-vital-surge")
def simulate_vital_surge_endpoint(payload: VitalSurgeSimulateRequest = Body(...)):
    """
    Phase 4 Core Endpoint:
    Simulates continuous 180-minute postprandial vital dynamics using
    Runge-Kutta 4th Order integration of the Bergman Minimal Model and
    Windkessel Hemodynamic BP model, providing side-by-side standard vs.
    doctor-hacks projections.
    """
    carbs = payload.netCarbs
    sodium = payload.sodium
    fat = payload.fatGrams
    fiber = payload.fiberGrams
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
            if fat is None:
                fat = data["nutrients"].get("fat", 0.0)
            if fiber is None:
                fiber = data["nutrients"].get("fiber", 0.0)
            if gi is None:
                gi = data.get("glycemicIndex", 50)

    carbs = max(0.0, float(carbs if carbs is not None else 25.0))
    sodium = max(0.0, float(sodium if sodium is not None else 200.0))
    fat = max(0.0, float(fat if fat is not None else 0.0))
    fiber = max(0.0, float(fiber if fiber is not None else 0.0))
    gi = int(gi if gi is not None else 50)
    q = float(payload.consumedQuantity if payload.consumedQuantity is not None else 1.0)

    twin = MetabolicDigitalTwin.from_vitals_dict(payload.vitals or {})

    comparison = vital_simulator.simulate_comparison(
        net_carbs=carbs,
        sodium_mg=sodium,
        glycemic_index=gi,
        twin=twin,
        consumed_quantity=q,
        fat_grams=fat,
        fiber_grams=fiber
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
@app.post("/api/v1/twin/clinical-rank")
def rank_candidates_endpoint(payload: ClinicalRankRequest = Body(...)):
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
@app.get("/api/v1/nutrition/catalog")
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
@app.post("/api/v1/nutrition/decompose")
def decompose_nutrition(payload: NutritionDecomposeRequest = Body(...)):
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
def detect_items_in_frame(
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
        image_bytes = file.file.read()
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
            q_vol = item_copy.get("volumetricProfile", {}).get("portionScaleFactor", 1.0)
            # Try normalizedKey first, then itemName
            nutr = nutrition_db.decompose(item_copy.get("normalizedKey", ""), q_vol)
            if not nutr:
                nutr = nutrition_db.decompose(item_copy.get("itemName", ""), q_vol)

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
def analyze_frame_legacy(
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
        image_bytes = file.file.read()
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

        # Process all detected items
        items = inspection_result["items"]
        enriched_all_items = []
        decomposed_for_aggregation = []

        for it in items:
            it_copy = dict(it)
            q_vol = it_copy.get("volumetricProfile", {}).get("portionScaleFactor", 1.0)
            n = nutrition_db.decompose(it_copy.get("normalizedKey", ""), q_vol)
            if not n:
                n = nutrition_db.decompose(it_copy.get("itemName", ""), q_vol)
            it_copy["nutritionProfile"] = n
            enriched_all_items.append(it_copy)
            if n:
                decomposed_for_aggregation.append(n)

        # Primary recognized candidate
        primary_item = items[0]
        primary_nutrition = primary_item.get("nutritionProfile")
        if not primary_nutrition:
            q_prim = primary_item.get("volumetricProfile", {}).get("portionScaleFactor", 1.0)
            primary_nutrition = nutrition_db.decompose(primary_item.get("normalizedKey", ""), q_prim)
            if not primary_nutrition:
                primary_nutrition = nutrition_db.decompose(primary_item.get("itemName", ""), q_prim)

        # Multi-Item Aggregated Meal vs Single Item Resolution
        if len(items) > 1 and decomposed_for_aggregation:
            aggregated_meal = nutrition_db.aggregate_nutrients(decomposed_for_aggregation)
            item_names = [it["itemName"] for it in items]
            if len(item_names) == 2:
                composite_meal_name = f"{item_names[0]} & {item_names[1]}"
            else:
                composite_meal_name = f"Meal Plate: {', '.join(item_names[:-1])} & {item_names[-1]}"

            nutrients = aggregated_meal.get("nutrients", {})
            gi = aggregated_meal.get("weightedGlycemicIndex", 50)
            gl = aggregated_meal.get("totalGlycemicLoad", 0.0)
            gl_category = aggregated_meal.get("glycemicLoadCategory", "Medium")
            serving_size = f"Composite Meal Plate ({len(items)} items, approx {aggregated_meal.get('totalWeightGrams', 400)}g)"
            serving_unit = "plate"
            serving_weight = aggregated_meal.get("totalWeightGrams", 400)
            category = "Cooked_Dish"
            primary_name = composite_meal_name
        else:
            nutrients = primary_nutrition.get("nutrients", {}) if primary_nutrition else {}
            gi = primary_nutrition.get("glycemicIndex", 50) if primary_nutrition else 50
            gl = primary_nutrition.get("glycemicLoad", 0.0) if primary_nutrition else 0.0
            gl_category = primary_nutrition.get("glycemicLoadCategory", "Low") if primary_nutrition else "Low"
            serving_size = primary_nutrition.get("standardServing", "1 standard portion") if primary_nutrition else "1 standard portion"
            serving_unit = primary_nutrition.get("servingUnit", "portion") if primary_nutrition else "portion"
            serving_weight = primary_nutrition.get("servingWeightGrams", 100) if primary_nutrition else 100
            category = primary_item["category"]
            primary_name = primary_item["itemName"]

        # Parse patient vitals & run Digital Twin Pareto Ranker
        vitals_dict = {}
        if vitals:
            try:
                vitals_dict = json.loads(vitals)
            except Exception:
                pass

        twin = MetabolicDigitalTwin.from_vitals_dict(vitals_dict)
        candidate_pool = [{"itemName": primary_name}]
        for cand in primary_item.get("candidates", []):
            if cand.get("name") and cand["name"] != primary_name:
                candidate_pool.append({"itemName": cand["name"]})
        for other in items[1:]:
            candidate_pool.append({"itemName": other["itemName"]})

        ranking_result = clinical_ranker.rank_candidates(candidate_pool, twin)

        primary_ranked = None
        if ranking_result.get("rankedItems"):
            for r in ranking_result["rankedItems"]:
                if (
                    r.get("canonicalKey") == primary_item.get("normalizedKey")
                    or r.get("displayName") == primary_item["itemName"]
                    or r.get("displayName") == primary_name
                ):
                    primary_ranked = r
                    break
            if not primary_ranked:
                primary_ranked = ranking_result["rankedItems"][0]

        doctor_hacks = list(primary_ranked.get("doctorHacks", [])) if primary_ranked else []

        # Add food sequencing harm-reduction hack for multi-item plates
        if len(items) > 1:
            has_fiber = any("salad" in it["itemName"].lower() or "broccoli" in it["itemName"].lower() or "spinach" in it["itemName"].lower() for it in items)
            if has_fiber:
                seq_hack = {
                    "type": "Food Sequencing Hack",
                    "title": "Consume Greens / Fiber First",
                    "action": "Consume the fresh greens/salad portion first to stimulate GLP-1 and blunt postprandial glucose spike from starches."
                }
                doctor_hacks.insert(0, seq_hack)

            walk_hack = {
                "type": "Biochemical Movement Hack",
                "title": "15-Minute Post-Meal Stroll",
                "action": "A brisk 10-15 minute walk after this meal activates GLUT4 transporters to clear blood glucose without insulin demand."
            }
            has_walk = any("walk" in (h.get("action", "") if isinstance(h, dict) else str(h)).lower() for h in doctor_hacks)
            if not has_walk:
                doctor_hacks.append(walk_hack)

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
                "recognizedItemName": primary_name,
                "category": category,
                "confidenceScore": primary_item["confidenceScore"],
                "confidenceLevel": primary_item["confidenceLevel"],
                "brand": primary_item.get("brand"),
                "candidates": primary_item.get("candidates", []),
                "servingSize": serving_size,
                "servingUnit": serving_unit,
                "servingWeightGrams": serving_weight,
                "glycemicIndex": gi,
                "glycemicLoad": gl,
                "glycemicLoadCategory": gl_category,
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


class VernacularVoiceParseRequest(BaseModel):
    transcript: str = Field(..., description="Raw spoken transcript in Hindi, Telugu, Tamil, Marathi, Hinglish, or English")
    language: Optional[str] = Field(None, description="Language code: hi, te, ta, mr, en")
    userPhenotype: Optional[Dict[str, Any]] = None


class VernacularKitchenCoachRequest(BaseModel):
    potSizeGrams: float = Field(..., description="Total weight of single-pot vessel (grams)")
    dishName: str = Field(..., description="Name of dish e.g. Hyderabadi Dum Biryani")
    familyMembers: List[Dict[str, Any]] = Field(..., description="List of family members and phenotypes")
    language: str = Field("hi", description="Language code for audio directives")


@app.post("/api/v1/voice/parse-and-simulate")
def vernacular_voice_parse_endpoint(req: VernacularVoiceParseRequest):
    try:
        result = vernacular_voice_coach.process_vernacular_food_speech(
            transcript=req.transcript,
            user_phenotype=req.userPhenotype,
            language=req.language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/voice/kitchen-coach")
def vernacular_kitchen_coach_endpoint(req: VernacularKitchenCoachRequest):
    try:
        result = vernacular_voice_coach.generate_vernacular_kitchen_coaching(
            pot_size_grams=req.potSizeGrams,
            dish_name=req.dishName,
            family_members=req.familyMembers,
            language=req.language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class OpticalOilSensorRequest(BaseModel):
    absorbance_450nm: float = Field(..., description="Optical absorbance at 450nm (blue-violet)")
    absorbance_600nm: float = Field(..., description="Optical absorbance at 600nm (orange-red reference)")
    oil_temperature_c: Optional[float] = Field(175.0, description="Temperature of frying medium in Celsius")
    oil_type: Optional[str] = Field("A2_Mustard_Ghee_Blend", description="Type of cooking medium")


class GravimetricPlatingRequest(BaseModel):
    total_pot_grams: float = Field(..., description="Total unsegregated single-pot vessel weight in grams")
    plate_measurements: List[Dict[str, Any]] = Field(..., description="Array of load-cell scale readings per plate")
    tolerance_grams: Optional[float] = Field(3.0, description="Permissible mass conservation error in grams")


@app.post("/api/v1/hardware/read-optical-oil-sensor")
def read_optical_oil_sensor_endpoint(req: OpticalOilSensorRequest):
    """
    Phase 10 / Grant-Level Cyber-Physical Endpoint:
    Processes physical dual-wavelength NIR spectrophotometer signals to audit
    cooking medium degradation, Total Polar Compounds (TPC), and FSSAI statutory compliance.
    """
    try:
        result = smart_kitchen_hardware.read_optical_oil_sensor(
            absorbance_450nm=req.absorbance_450nm,
            absorbance_600nm=req.absorbance_600nm,
            oil_temperature_c=req.oil_temperature_c,
            oil_type=req.oil_type
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/hardware/verify-gravimetric-plating")
def verify_gravimetric_plating_endpoint(req: GravimetricPlatingRequest):
    """
    Phase 10 / Grant-Level Cyber-Physical Endpoint:
    Receives digital load-cell scale telemetry from the smart plating workstation
    and validates real-time mass conservation across family plates.
    """
    try:
        result = smart_kitchen_hardware.verify_gravimetric_plating(
            total_pot_grams=req.total_pot_grams,
            plate_measurements=req.plate_measurements,
            tolerance_grams=req.tolerance_grams or 3.0
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    host = os.getenv("AI_ENGINE_HOST", "0.0.0.0")
    port = int(os.getenv("AI_ENGINE_PORT", 8000))
    uvicorn.run(app, host=host, port=port)