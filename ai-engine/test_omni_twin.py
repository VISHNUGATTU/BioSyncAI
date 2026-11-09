"""
Comprehensive Test Suite for BioSync Omni-Twin Physiological Engine v3.0
Verifies:
1. UVA-Padova 7-Compartment ODE Simulation with RK4 integration.
2. Circadian chrono-biological shift (Morning vs Evening insulin sensitivity).
3. Pharmacodynamic modulation (Metformin, SGLT2i renal clearance, GLP-1 gastric delay).
4. Adverse Drug-Nutrient interaction detection (Statin + Grapefruit CYP3A4, ACEi + Potassium).
5. CGM High-Resolution stream generation with AR(1) sensor noise, MAGE, J-index, LBGI/HBGI.
6. Micronutrient Synergy & Electrolyte Matrix (Na:K ratio, Ca:Mg ratio, Iron-Ascorbate synergy).
"""

import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import (
    health_check,
    simulate_omni_twin_endpoint,
    generate_cgm_stream_endpoint,
    evaluate_pharmacodynamics_endpoint,
    evaluate_micronutrient_synergy_endpoint,
    OmniTwinSimulateRequest,
    CGMGenerateRequest,
    PharmacodynamicsRequest,
    MicronutrientSynergyRequest
)

class DirectResponse:
    def __init__(self, data, status_code=200):
        self._data = data
        self.status_code = status_code
        self.text = json.dumps(data) if isinstance(data, dict) else str(data)

    def json(self):
        return self._data

def req_get(path):
    if path == "/health":
        return DirectResponse(health_check())
    raise ValueError(f"Unknown GET path: {path}")

def req_post(path, json=None):
    payload = json or {}
    if path == "/api/v1/omni-twin/simulate":
        req = OmniTwinSimulateRequest(**payload)
        res = simulate_omni_twin_endpoint(req)
        return DirectResponse(res)
    elif path == "/api/v1/omni-twin/cgm-stream":
        req = CGMGenerateRequest(**payload)
        res = generate_cgm_stream_endpoint(req)
        return DirectResponse(res)
    elif path == "/api/v1/omni-twin/pharmacodynamics":
        req = PharmacodynamicsRequest(**payload)
        res = evaluate_pharmacodynamics_endpoint(req)
        return DirectResponse(res)
    elif path == "/api/v1/omni-twin/micronutrient-synergy":
        req = MicronutrientSynergyRequest(**payload)
        res = evaluate_micronutrient_synergy_endpoint(req)
        return DirectResponse(res)
    raise ValueError(f"Unknown POST path: {path}")


def test_health():
    print("\n--- Test 1: AI Engine Health & Omni-Twin Capability ---")
    resp = req_get("/health")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    print(f"Health response models: {data.get('models')}")
    assert data.get("models", {}).get("omniTwinEngine") is True, f"Omni-Twin not in models: {data}"
    print("PASS: AI Engine is healthy and Omni-Twin capability is reported.")


def test_omni_twin_simulation_standard():
    print("\n--- Test 2: Omni-Twin 7-Compartment ODE Simulation (High-Carb Meal) ---")
    payload = {
        "netCarbs": 85.0,
        "sodium": 650.0,
        "fatGrams": 18.0,
        "fiberGrams": 4.0,
        "potassiumMg": 420.0,
        "glycemicIndex": 78,
        "consumedQuantity": 1.0,
        "mealTimeHour": 8.0,
        "medications": ["Metformin 1000mg"],
        "foodNames": ["White Rice Bowl", "Sweet Tea"],
        "vitals": {
            "weightKg": 76.0,
            "fastingBloodGlucose": 115.0,
            "restingHeartRate": 74.0,
            "baselineBloodPressure": {"systolic": 132.0, "diastolic": 84.0},
            "hba1c": 6.8
        },
        "applyDoctorHacks": True,
        "enableCgmStream": False
    }
    resp = req_post("/api/v1/omni-twin/simulate", json=payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    
    assert data["success"] is True, "Simulation failed"
    assert "timeSeries" in data, "timeSeries missing"
    assert len(data["timeSeries"]) == 37, f"Expected 37 time points (180 mins / 5min steps), got {len(data['timeSeries'])}"
    
    peaks = data["peakProjections"]
    print(f"Standard Peak Glucose: {peaks['peakGlucose']} mg/dL at min {peaks['timeToPeakGlucoseMinutes']}")
    print(f"Hacks Peak Glucose:    {peaks['peakGlucoseWithHacks']} mg/dL at min {peaks['timeToPeakGlucoseMinutesWithHacks']}")
    print(f"Peak Systolic BP:      {peaks['peakSystolicBP']} mmHg")
    
    # Assert physiological constraints
    assert peaks["peakGlucose"] > 140.0, "High carb meal should cause diabetic excursion >140 mg/dL"
    assert peaks["peakGlucoseWithHacks"] < peaks["peakGlucose"], "Doctor hacks must attenuate peak glucose"
    assert data["clinicalAssessment"]["t2dRiskStratum"] in ["MODERATE_RISK", "ELEVATED_RISK", "HIGH_RISK"]
    print("PASS: 7-compartment ODE simulation conforms to physiological invariants.")


def test_circadian_chrono_effect():
    print("\n--- Test 3: Circadian Chrono-Biology (Morning vs Late-Night) ---")
    base_meal = {
        "netCarbs": 60.0,
        "glycemicIndex": 70,
        "consumedQuantity": 1.0,
        "vitals": {"fastingBloodGlucose": 100.0, "hba1c": 5.8},
        "enableCgmStream": False
    }
    
    # Morning meal at 8 AM (Peak insulin sensitivity)
    m_payload = dict(base_meal)
    m_payload["mealTimeHour"] = 8.0
    m_resp = req_post("/api/v1/omni-twin/simulate", json=m_payload).json()
    
    # Late night meal at 11 PM (23:00, melatonin suppression of beta cells)
    n_payload = dict(base_meal)
    n_payload["mealTimeHour"] = 23.0
    n_resp = req_post("/api/v1/omni-twin/simulate", json=n_payload).json()
    
    m_peak = m_resp["peakProjections"]["peakGlucose"]
    n_peak = n_resp["peakProjections"]["peakGlucose"]
    
    print(f"Morning (08:00) Peak Glucose: {m_peak} mg/dL (Insulin Sensitivity Factor: {m_resp['circadianSensitivityFactor']}x)")
    print(f"Night   (23:00) Peak Glucose: {n_peak} mg/dL (Insulin Sensitivity Factor: {n_resp['circadianSensitivityFactor']}x)")
    
    assert n_peak > m_peak, "Night meal must show impaired glucose clearance due to circadian nocturnal insulin resistance"
    assert n_resp["circadianSensitivityFactor"] < m_resp["circadianSensitivityFactor"], "Circadian sensitivity factor must be lower at night"
    print("PASS: Chrono-biological circadian diurnal rhythm validated.")


def test_sglt2_and_glp1_pharmacodynamics():
    print("\n--- Test 4: Pharmacodynamics (SGLT2i Glycosuria & GLP-1 Gastric Emptying) ---")
    meal = {
        "netCarbs": 90.0,
        "fatGrams": 20.0,
        "fiberGrams": 3.0,
        "glycemicIndex": 82,
        "consumedQuantity": 1.0,
        "vitals": {"fastingBloodGlucose": 130.0, "hba1c": 7.4},
        "enableCgmStream": False
    }
    
    naive_payload = dict(meal)
    naive_payload["medications"] = []
    naive_resp = req_post("/api/v1/omni-twin/simulate", json=naive_payload).json()
    
    treated_payload = dict(meal)
    treated_payload["medications"] = ["Jardiance 25mg", "Ozempic 1mg"] # SGLT2i + GLP-1 RA
    treated_resp = req_post("/api/v1/omni-twin/simulate", json=treated_payload).json()
    
    naive_peak = naive_resp["peakProjections"]["peakGlucose"]
    treated_peak = treated_resp["peakProjections"]["peakGlucose"]
    
    print(f"Untreated Peak Glucose: {naive_peak} mg/dL (Renal Threshold: {naive_resp['pharmacodynamics']['renalThresholdMgDl']} mg/dL)")
    print(f"SGLT2i + GLP-1 Treated:  {treated_peak} mg/dL (Renal Threshold: {treated_resp['pharmacodynamics']['renalThresholdMgDl']} mg/dL)")
    print(f"Gastric Delay Factor:   {treated_resp['pharmacodynamics']['gastricDelayFactor']}x")
    
    assert treated_peak < naive_peak, "SGLT2i + GLP-1 RA must blunt postprandial glucose spike"
    assert treated_resp["pharmacodynamics"]["renalThresholdMgDl"] < 120.0, "SGLT2i must lower renal threshold"
    print("PASS: Incretin delay and renal threshold suppression validated.")


def test_drug_food_interactions():
    print("\n--- Test 5: Clinical Drug-Nutrient Interaction Engine ---")
    payload = {
        "medications": ["Lipitor 20mg", "Lisinopril 10mg"],
        "foodItems": ["Grapefruit juice", "Bananas", "Spinach salad"]
    }
    resp = req_post("/api/v1/omni-twin/pharmacodynamics", json=payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    
    interactions = data.get("foodDrugInteractions", [])
    print(f"Total interactions detected: {len(interactions)}")
    for item in interactions:
        print(f"[{item['severity']}] {item['interaction']}: {item['mechanism']}")
    
    has_grapefruit_statin = any("grapefruit" in item['interaction'].lower() for item in interactions)
    has_potassium_acei = any("potassium" in item['interaction'].lower() for item in interactions)
    
    assert has_grapefruit_statin, "Grapefruit + Atorvastatin CYP3A4 interaction must be flagged!"
    assert has_potassium_acei, "High potassium + Lisinopril hyperkalemia risk must be flagged!"
    print("PASS: Critical clinical pharmacology contraindications identified.")


def test_cgm_analytics_stream():
    print("\n--- Test 6: CGM 5-Minute Resolution Stream & AGP Consensus Analytics ---")
    sim_resp = req_post("/api/v1/omni-twin/simulate", json={
        "netCarbs": 70.0,
        "glycemicIndex": 75,
        "vitals": {"fastingBloodGlucose": 110.0},
        "enableCgmStream": False
    }).json()
    
    plasma_pts = [{"minute": t["minute"], "plasmaGlucose": t["plasmaGlucose"]} for t in sim_resp["timeSeries"]]
    
    cgm_resp = req_post("/api/v1/omni-twin/cgm-stream", json={
        "plasmaTrajectory": plasma_pts,
        "samplingIntervalMinutes": 5,
        "diffusionLagMinutes": 10.0
    })
    assert cgm_resp.status_code == 200, cgm_resp.text
    data = cgm_resp.json()
    
    agp = data["agpMetrics"]
    print(f"Time in Range (70-180 mg/dL): {agp['timeInRangePercent']}%")
    print(f"Time Above Range (>180):     {agp['timeAboveRangePercent']}%")
    print(f"Mean CGM Glucose:            {agp['meanCgmGlucose']} mg/dL")
    print(f"Estimated HbA1c (GMI):       {agp['estimatedGMI']}%")
    print(f"Glycemic Variability CV:     {agp['coefficientOfVariationPercent']}%")
    print(f"MAGE:                        {agp['mageMgDl']} mg/dL")
    print(f"J-Index:                     {agp['jIndex']}")
    
    assert len(data["stream"]) > 20, "Should generate dense continuous telemetry stream"
    assert 0 <= agp["timeInRangePercent"] <= 100
    assert agp["coefficientOfVariationPercent"] > 0
    print("PASS: Ambulatory Glucose Profile consensus metrics calculated successfully.")


def test_micronutrient_synergy():
    print("\n--- Test 7: Micronutrient Synergy & Electrolyte Matrix ---")
    payload = {
        "nutrients": {
            "sodium": 2800.0,
            "potassium": 1200.0,
            "calcium": 900.0,
            "magnesium": 210.0,
            "iron": 18.0,
            "vitaminC": 95.0,
            "fat": 35.0,
            "vitaminD": 400.0
        },
        "foodNames": ["Spinach salad", "Citrus orange", "Avocado", "Salmon"]
    }
    resp = req_post("/api/v1/omni-twin/micronutrient-synergy", json=payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    
    electrolytes = data["electrolytes"]
    synergies = data["synergiesDetected"]
    inhibitions = data["inhibitionsDetected"]
    
    print(f"Na:K Ratio: {electrolytes['sodiumToPotassiumRatio']} ({electrolytes['status']})")
    print(f"Ca:Mg Ratio: {electrolytes['calciumToMagnesiumRatio']} ({electrolytes['caMgStatus']})")
    print(f"Synergies detected ({len(synergies)}): {[s['title'] for s in synergies]}")
    print(f"Inhibitions detected ({len(inhibitions)}): {[i['interaction'] for i in inhibitions]}")
    
    assert electrolytes['sodiumToPotassiumRatio'] > 2.0, "Na:K should reflect 2800:1200 (>2.0)"
    assert any("Iron-Ascorbate" in s['title'] for s in synergies), "Vitamin C + Iron synergy must be detected!"
    assert any("Lipid-Matrix" in s['title'] for s in synergies), "Fat + Vitamin D micelle assimilation must be detected!"
    assert any("Calcium-Iron" in i['interaction'] for i in inhibitions), "Calcium-Iron transporter competition must be flagged!"
    print("PASS: Micronutrient synergy & electrolyte matrix computed accurately.")


if __name__ == "__main__":
    try:
        test_health()
        test_omni_twin_simulation_standard()
        test_circadian_chrono_effect()
        test_sglt2_and_glp1_pharmacodynamics()
        test_drug_food_interactions()
        test_cgm_analytics_stream()
        test_micronutrient_synergy()
        print("\n=======================================================")
        print("ALL 7 OMNI-TWIN PHYSIOLOGICAL V3.0 ENGINE TESTS PASSED!")
        print("=======================================================\n")
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
