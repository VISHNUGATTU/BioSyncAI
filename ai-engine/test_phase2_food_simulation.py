"""
BioSync AI - Phase 2 Verification Test Suite
Module: test_phase2_food_simulation.py

Synchronous, zero-hang verification suite for:
1. In-Silico meal cart multi-compartment simulation.
2. Starch kinetics & peak projections.
3. Vitals Guard boundary enforcement.
4. Skeletal muscle glucose uptake & autonomous postprandial ambulation calculation.
5. Ayurvedic botanical cross-interaction sentinel.
6. Endpoint validation.
"""

import sys
from food_simulation_engine import food_simulation_engine
from main import (
    simulate_meal_forecast_endpoint,
    calculate_ambulation_plan_endpoint,
    MealForecastRequest,
    AmbulationPlanRequest
)

def run_phase2_verification():
    print("\n======================================================")
    print("  RALPH LOOP VERIFICATION: Phase 2 In-Silico Engine")
    print("======================================================")

    passed = 0
    failed = 0

    def assert_test(condition: bool, message: str):
        nonlocal passed, failed
        if condition:
            print(f"  ✅ PASS: {message}")
            passed += 1
        else:
            print(f"  ❌ FAIL: {message}")
            failed += 1

    # -------------------------------------------------------------------
    # TEST 1: Low-GI / High-Amylose Meal (Foxtail Millet Pulao)
    # -------------------------------------------------------------------
    print("\n[TEST 1: Starch Digestion & Glycemic Forecasting]")
    vitals_baseline = {
        "glucoseFasting": 95.0,
        "systolic": 118.0,
        "diastolic": 78.0,
        "heartRate": 70.0,
        "bmi": 23.5,
        "activeMedications": ["Metformin 500mg"]
    }
    millet_cart = [
        {
            "foodItem": {
                "name": "Foxtail Millet Vegetable Dum Pulao",
                "carbohydrates_g": 48.0,
                "netCarbohydrates_g": 38.0,
                "protein_g": 11.0,
                "fat_g": 12.0,
                "fiber_g": 10.0,
                "sodium_mg": 380.0,
                "potassium_mg": 420.0,
                "glycemicIndex": 44,
                "amyloseRatio": 0.32,
                "resistantStarchFactor": 0.28,
                "activeBotanicals": []
            },
            "quantity": 1.0
        }
    ]

    res_safe = food_simulation_engine.simulate_meal_cart(
        vitals=vitals_baseline,
        items=millet_cart,
        order_mode="VITALS_GUARD"
    )

    assert_test(res_safe["success"] is True, "Simulation completed successfully")
    peak_g = res_safe["forecast"]["simulatedPeakGlucose"]
    assert_test(peak_g < 170.0, f"Simulated peak glucose is controlled: {peak_g} mg/dL (< 170 mg/dL)")
    assert_test(len(res_safe["forecast"]["simulationTrajectory"]) > 10, f"Trajectory has {len(res_safe['forecast']['simulationTrajectory'])} time samples")
    assert_test("macronutrientTotals" in res_safe, "Macronutrient totals calculated correctly")

    # -------------------------------------------------------------------
    # TEST 2: High-GI Cheat Meal (1kg Basmati Biryani + High Fat)
    # -------------------------------------------------------------------
    print("\n[TEST 2: High-GI Excursion & Autonomous Ambulation Plan]")
    biryani_cart = [
        {
            "foodItem": {
                "name": "Hyderabadi Dum Chicken Biryani",
                "carbohydrates_g": 160.0,
                "netCarbohydrates_g": 148.0,
                "protein_g": 85.0,
                "fat_g": 52.0,
                "fiber_g": 12.0,
                "sodium_mg": 1850.0,
                "potassium_mg": 980.0,
                "glycemicIndex": 68,
                "amyloseRatio": 0.22,
                "resistantStarchFactor": 0.10,
                "activeBotanicals": []
            },
            "quantity": 1.0
        }
    ]

    res_cheat = food_simulation_engine.simulate_meal_cart(
        vitals=vitals_baseline,
        items=biryani_cart,
        order_mode="CHEAT_MODE_OVERRIDE"
    )

    peak_cheat_g = res_cheat["forecast"]["simulatedPeakGlucose"]
    assert_test(peak_cheat_g > 180.0, f"Basmati Biryani generates massive surge: {peak_cheat_g} mg/dL (> 180)")
    assert_test(res_cheat["forecast"]["glycemicExcursionCategory"] == "DANGEROUS_SPIKE", "Categorized as DANGEROUS_SPIKE")
    assert_test(res_cheat["isGuardApproved"] is False, "Biryani safely flagged by Vitals Guard boundary")
    
    # Ambulation Plan Checks
    mitigation = res_cheat["mitigationPlan"]
    assert_test(mitigation["requiredAmbulationMinutes"] >= 15, f"Required walk time: {mitigation['requiredAmbulationMinutes']} min")
    assert_test(mitigation["targetStepsToBurnExcursion"] >= 1650, f"Target steps: {mitigation['targetStepsToBurnExcursion']} steps")
    assert_test(mitigation["vinegarPreloadRecommended"] is True, "Vinegar preload recommended for major spike")
    assert_test("Dual-Wave Bolus" in mitigation["insulinSplitBolusAdvice"], "Dual-wave insulin bolus recommended for high fat+carb handi")
    assert_test(len(mitigation["preBiteSequencing"]) == 3, "Three-phase food sequencing guidance provided")

    # -------------------------------------------------------------------
    # TEST 3: Ayurvedic Botanical Interaction (Karela + Sulfonylurea)
    # -------------------------------------------------------------------
    print("\n[TEST 3: Ayur-Allopathic Cross-Interaction Sentinel]")
    diabetic_vitals = {
        "glucoseFasting": 110.0,
        "systolic": 130.0,
        "diastolic": 85.0,
        "activeMedications": ["Glimepiride 2mg", "Metformin 1000mg"]
    }
    karela_cart = [
        {
            "foodItem": {
                "name": "Karela Jamun Glucose Stabilizer Bowl",
                "carbohydrates_g": 18.0,
                "netCarbohydrates_g": 10.0,
                "protein_g": 8.0,
                "fat_g": 6.0,
                "fiber_g": 8.0,
                "sodium_mg": 210.0,
                "potassium_mg": 490.0,
                "glycemicIndex": 24,
                "activeBotanicals": [
                    {"name": "Karela", "concentration_mg": 500, "activeMarker": "Charantin"},
                    {"name": "Jamun", "concentration_mg": 350, "activeMarker": "Jamboline"}
                ]
            },
            "quantity": 1.0
        }
    ]

    res_ayur = food_simulation_engine.simulate_meal_cart(
        vitals=diabetic_vitals,
        items=karela_cart,
        order_mode="VITALS_GUARD"
    )

    assert_test(res_ayur["isContraindicated"] is True, "Karela with Sulfonylurea marked as contraindicated")
    assert_test(res_ayur["isGuardApproved"] is False, "Order blocked in Vitals Guard mode due to lethal nocturnal hypo risk")
    assert_test(len(res_ayur["ayurPharmaWarnings"]) > 0, f"Warning generated: {res_ayur['ayurPharmaWarnings'][0][:50]}...")

    # -------------------------------------------------------------------
    # TEST 4: Standalone Ambulation Plan Calculator
    # -------------------------------------------------------------------
    print("\n[TEST 4: Mathematical Ambulation Model]")
    plan = food_simulation_engine.calculate_ambulation_plan(
        simulated_peak_glucose=210.0,
        target_ceiling_glucose=140.0,
        bmi=25.0,
        time_to_peak_min=50
    )
    assert_test(plan["excessGlucoseGrams"] > 5.0, f"Calculated excess glucose: {plan['excessGlucoseGrams']} g")
    assert_test(plan["requiredAmbulationMinutes"] >= 20, f"Walking time: {plan['requiredAmbulationMinutes']} min")
    assert_test(plan["targetSteps"] >= 2200, f"Target steps: {plan['targetSteps']} steps")
    assert_test(plan["recommendedStartTimeMin"] == 30, f"Start time: T+{plan['recommendedStartTimeMin']} min (T_peak - 20)")

    # -------------------------------------------------------------------
    # TEST 5: Direct Endpoint Execution
    # -------------------------------------------------------------------
    print("\n[TEST 5: Direct Endpoint Execution & Validation]")
    req_payload = MealForecastRequest(
        vitals=vitals_baseline,
        items=millet_cart,
        orderMode="VITALS_GUARD"
    )
    endpoint_res = simulate_meal_forecast_endpoint(req_payload)
    assert_test(endpoint_res.get("success") is True, "simulate_meal_forecast_endpoint returned success: True")
    assert_test("forecast" in endpoint_res, "Response contains forecast object")
    assert_test("mitigationPlan" in endpoint_res, "Response contains mitigationPlan object")

    amb_req = AmbulationPlanRequest(
        simulatedPeakGlucose=195.0,
        targetCeilingGlucose=140.0,
        bmi=24.0,
        timeToPeakMin=45
    )
    amb_res = calculate_ambulation_plan_endpoint(amb_req)
    assert_test(amb_res.get("success") is True, "calculate_ambulation_plan_endpoint returned success: True")
    assert_test(amb_res.get("data", {}).get("requiredAmbulationMinutes", 0) > 0, "Ambulation plan minutes returned correctly")

    # -------------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------------
    print("\n======================================================")
    print(f"  PHASE 2 TEST RESULTS: {passed} PASSED, {failed} FAILED")
    print("======================================================\n")

    if failed > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    run_phase2_verification()
