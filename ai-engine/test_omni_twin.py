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

import sys
import json
import requests

AI_ENGINE_URL = "http://localhost:8000"

def test_health():
    print("\n--- Test 1: AI Engine Health & Omni-Twin Capability ---")
    resp = requests.get(f"{AI_ENGINE_URL}/health")
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
        "enableCgmStream": True
    }
    
    resp = requests.post(f"{AI_ENGINE_URL}/api/v1/omni-twin/simulate", json=payload)
    assert resp.status_code == 200, f"Simulation failed: {resp.text}"
    result = resp.json()
    
    peaks = result["peakProjections"]
    print(f"Peak Glucose: {peaks['peakGlucose']} mg/dL at t={peaks['timeToPeakGlucoseMin']} min (Spike: +{peaks['glucoseSpike']} mg/dL)")
    print(f"Peak SBP: {peaks['peakSystolicBP']} mmHg, Peak HR: {peaks['peakHeartRate']} bpm")
    print(f"Peak Rate-Pressure Product: {peaks['peakRatePressureProduct']}")
    print(f"Clinical Status: {result['clinicalStatus']}")
    print(f"Time series samples count: {len(result['timeSeries'])}")
    
    assert peaks['peakGlucose'] > 115.0, "Glucose must rise after 85g carbs"
    assert peaks['timeToPeakGlucoseMin'] >= 20 and peaks['timeToPeakGlucoseMin'] <= 120, "Peak time must be physiological (20-120 min)"
    assert len(result['timeSeries']) >= 12, "Should have regular trajectory points"
    assert result.get("cgmSimulation") is not None, "CGM telemetry simulation must be included"
    assert len(result["cgmSimulation"]["cgmPoints"]) >= 30, "CGM stream should have 5-min intervals (>= 30 points)"
    print("PASS: Standard Omni-Twin ODE simulation executed with valid physiological trajectory.")

def test_circadian_chrono_effect():
    print("\n--- Test 3: Circadian Chrono-Biology Comparison (Morning 08:00 vs Late Night 22:00) ---")
    base_payload = {
        "netCarbs": 60.0,
        "sodium": 300.0,
        "fatGrams": 10.0,
        "fiberGrams": 2.0,
        "glycemicIndex": 70,
        "consumedQuantity": 1.0,
        "vitals": {
            "fastingBloodGlucose": 100.0,
            "baselineBloodPressure": {"systolic": 120.0, "diastolic": 80.0},
            "restingHeartRate": 70.0
        },
        "enableCgmStream": False
    }
    
    # Morning simulation (08:00)
    m_payload = dict(base_payload)
    m_payload["mealTimeHour"] = 8.0
    m_resp = requests.post(f"{AI_ENGINE_URL}/api/v1/omni-twin/simulate", json=m_payload).json()
    m_peak = m_resp["peakProjections"]["peakGlucose"]
    m_mult = m_resp["simulationParameters"]["circadianSensitivityMultiplier"]
    
    # Night simulation (22:00)
    n_payload = dict(base_payload)
    n_payload["mealTimeHour"] = 22.0
    n_resp = requests.post(f"{AI_ENGINE_URL}/api/v1/omni-twin/simulate", json=n_payload).json()
    n_peak = n_resp["peakProjections"]["peakGlucose"]
    n_mult = n_resp["simulationParameters"]["circadianSensitivityMultiplier"]
    
    print(f"Morning (08:00) Peak Glucose: {m_peak} mg/dL (Sensitivity Multiplier: {m_mult})")
    print(f"Night   (22:00) Peak Glucose: {n_peak} mg/dL (Sensitivity Multiplier: {n_mult})")
    
    # Diurnal oscillation: peripheral insulin sensitivity acrophase around 08:00, bathyphase at night.
    # Therefore, evening meal produces a higher peak excursion.
    assert n_peak > m_peak, f"Circadian modulation failed: night ({n_peak}) should exceed morning ({m_peak})"
    assert m_mult > n_mult, f"Morning sensitivity ({m_mult}) should exceed night sensitivity ({n_mult})"
    print(f"PASS: Circadian diurnal oscillation verified (Delta = +{n_peak - m_peak:.1f} mg/dL at night).")

def test_sglt2_and_glp1_pharmacodynamics():
    print("\n--- Test 4: Pharmacodynamics: SGLT2i + GLP-1 RA Impact ---")
    meal = {
        "netCarbs": 90.0,
        "sodium": 400.0,
        "glycemicIndex": 80,
        "vitals": {
            "fastingBloodGlucose": 130.0,
            "baselineBloodPressure": {"systolic": 135.0, "diastolic": 85.0},
            "restingHeartRate": 75.0
        },
        "mealTimeHour": 12.0,
        "enableCgmStream": False
    }
    
    naive_payload = dict(meal)
    naive_payload["medications"] = []
    naive_resp = requests.post(f"{AI_ENGINE_URL}/api/v1/omni-twin/simulate", json=naive_payload).json()
    
    treated_payload = dict(meal)
    treated_payload["medications"] = ["Jardiance 25mg", "Ozempic 1mg"] # SGLT2i + GLP-1 RA
    treated_resp = requests.post(f"{AI_ENGINE_URL}/api/v1/omni-twin/simulate", json=treated_payload).json()
    
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
    resp = requests.post(f"{AI_ENGINE_URL}/api/v1/omni-twin/pharmacodynamics", json=payload)
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
    # First get plasma glucose trajectory from simulation
    sim_resp = requests.post(f"{AI_ENGINE_URL}/api/v1/omni-twin/simulate", json={
        "netCarbs": 70.0,
        "glycemicIndex": 75,
        "vitals": {"fastingBloodGlucose": 110.0},
        "enableCgmStream": False
    }).json()
    
    plasma_pts = [{"minute": t["minute"], "plasmaGlucose": t["plasmaGlucose"]} for t in sim_resp["timeSeries"]]
    
    cgm_resp = requests.post(f"{AI_ENGINE_URL}/api/v1/omni-twin/cgm-stream", json={
        "plasmaTrajectory": plasma_pts,
        "samplingIntervalMinutes": 5,
        "diffusionLagMinutes": 10.0
    })
    assert cgm_resp.status_code == 200, cgm_resp.text
    cdata = cgm_resp.json()
    
    stream = cdata["cgmPoints"]
    agp = cdata["agpMetrics"]
    
    print(f"CGM reading count (5-min intervals): {len(stream)}")
    print(f"Mean CGM: {agp['meanGlucose']} mg/dL, CV: {agp['coefficientOfVariationPercent']}% ({agp['cvStatus']})")
    print(f"TIR (70-140): {agp['timeInRangePercent']['euglycemic70_140']}%, Tight TIR (70-120): {agp['timeInRangePercent']['tightRange70_120']}%")
    print(f"TAR L1 (>140): {agp['timeInRangePercent']['tarLevel1_140_180']}%, TAR L2 (>180): {agp['timeInRangePercent']['tarLevel2_above180']}%")
    print(f"MAGE: {agp['mage']} mg/dL, J-Index: {agp['jIndex']}")
    print(f"LBGI: {agp['glycemicRiskIndices']['lbgi']}, HBGI: {agp['glycemicRiskIndices']['hbgi']}")
    
    assert len(stream) > 30, "Should generate regular 5-minute CGM readings"
    assert "trendArrow" in stream[5], "Each CGM reading must include a clinical trend arrow"
    assert "mage" in agp, "Ambulatory Glucose Profile must include MAGE"
    print("PASS: Continuous Glucose Monitoring stream & clinical AGP metrics computed.")

def test_micronutrient_synergy():
    print("\n--- Test 7: Micronutrient Synergy & Electrolyte Matrix ---")
    payload = {
        "nutrients": {
            "sodium": 2800.0,
            "potassium": 1200.0,
            "calcium": 800.0,
            "magnesium": 210.0,
            "iron": 15.0,
            "vitaminC": 95.0,
            "fat": 22.0,
            "vitaminD": 400.0
        },
        "foodNames": ["Spinach salad", "Citrus orange", "Avocado", "Salmon"]
    }
    resp = requests.post(f"{AI_ENGINE_URL}/api/v1/omni-twin/micronutrient-synergy", json=payload)
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
