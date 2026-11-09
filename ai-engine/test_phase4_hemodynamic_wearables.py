"""
BioSync AI - Phase 4 Verification Test Suite
Module: test_phase4_hemodynamic_wearables.py

Zero-hang synchronous verification suite for:
1. Moens-Korteweg Pulse Transit Time (PTT) to Cuffless Blood Pressure & PWV.
2. Autonomic Heart Rate Variability (HRV) Analysis (SDNN, RMSSD, Baevsky Index).
3. Acoustic & Inertial Mastication (Meal-Start) Classifier.
4. FastAPI Hemodynamic & Sensor Endpoints Validation.
"""

import sys
import numpy as np
from hemodynamic_estimator import hemodynamic_estimator
from main import (
    estimate_cuffless_bp_endpoint,
    analyze_hrv_endpoint,
    detect_meal_start_endpoint,
    CufflessBPEstimateRequest,
    HRVAnalysisRequest,
    MealInitiationDetectRequest
)

def run_phase4_verification():
    print("\n======================================================")
    print("  RALPH LOOP VERIFICATION: Phase 4 Wearables Engine")
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
    # TEST 1: Moens-Korteweg PTT-to-BP Estimation
    # -------------------------------------------------------------------
    print("\n[TEST 1: Cuffless Blood Pressure via Pulse Transit Time (PTT)]")

    # Baseline normal PTT (220 ms)
    res_norm = hemodynamic_estimator.estimate_cuffless_bp(
        ptt_ms=220.0,
        heart_rate_bpm=72.0,
        patient_height_cm=172.0,
        baseline_sbp=120.0,
        baseline_dbp=80.0
    )
    assert_test(res_norm["success"] is True, "Normal PTT estimation succeeded")
    sbp_norm = res_norm["estimatedSystolicBP"]
    assert_test(110.0 <= sbp_norm <= 130.0, f"Baseline SBP in expected euglycemic/normotensive window: {sbp_norm} mmHg")
    assert_test(res_norm["pulseWaveVelocity_m_s"] > 0, f"Calculated PWV: {res_norm['pulseWaveVelocity_m_s']} m/s")

    # Stiff / Hypertensive Rapid PTT (140 ms - wave travels faster through stiff vessels)
    res_stiff = hemodynamic_estimator.estimate_cuffless_bp(
        ptt_ms=140.0,
        heart_rate_bpm=88.0,
        patient_height_cm=172.0,
        baseline_sbp=120.0,
        baseline_dbp=80.0
    )
    sbp_stiff = res_stiff["estimatedSystolicBP"]
    pwv_stiff = res_stiff["pulseWaveVelocity_m_s"]
    assert_test(sbp_stiff > sbp_norm, f"Short PTT reflects higher systolic blood pressure: {sbp_stiff} mmHg vs {sbp_norm} mmHg")
    assert_test(pwv_stiff > res_norm["pulseWaveVelocity_m_s"], f"Stiff arterial PWV elevated: {pwv_stiff} m/s vs {res_norm['pulseWaveVelocity_m_s']} m/s")
    assert_test("Stiffness" in res_stiff["stiffnessCategory"], f"Category flagged arterial stiffness: {res_stiff['stiffnessCategory']}")

    # -------------------------------------------------------------------
    # TEST 2: Heart Rate Variability (HRV) Autonomic Stress Profiling
    # -------------------------------------------------------------------
    print("\n[TEST 2: Heart Rate Variability (HRV) Autonomic Analysis]")

    # Rest-and-Digest Parasympathetic Stream (healthy vagal tone, high variability)
    # Mean ~ 850ms (70 bpm), high variance
    np.random.seed(42)
    healthy_rr = list(850.0 + np.sin(np.linspace(0, 10, 50)) * 95.0 + np.random.normal(0, 30, 50))
    res_hrv_healthy = hemodynamic_estimator.analyze_hrv(healthy_rr)

    assert_test(res_hrv_healthy["success"] is True, "Healthy HRV analysis completed")
    assert_test(res_hrv_healthy["rmssd_ms"] > 25.0, f"Healthy RMSSD indicates robust vagal tone: {res_hrv_healthy['rmssd_ms']} ms")
    assert_test(res_hrv_healthy["baevskyStressIndex"] < 200.0, f"Stress Index low in resting state: {res_hrv_healthy['baevskyStressIndex']}")

    # Postprandial Sympathetic Stress Surge (acute sodium/glycemic spike, rigid low variability)
    # Mean ~ 650ms (92 bpm), rigid low variance
    stressed_rr = list(650.0 + np.random.normal(0, 4.0, 50))
    res_hrv_stressed = hemodynamic_estimator.analyze_hrv(stressed_rr)

    assert_test(res_hrv_stressed["rmssd_ms"] < res_hrv_healthy["rmssd_ms"], f"Stressed RMSSD significantly reduced: {res_hrv_stressed['rmssd_ms']} ms vs {res_hrv_healthy['rmssd_ms']} ms")
    assert_test(res_hrv_stressed["baevskyStressIndex"] > 200.0, f"Baevsky Stress Index reflects sympathetic surge: {res_hrv_stressed['baevskyStressIndex']}")
    assert_test("Sympathetic" in res_hrv_stressed["autonomicStatus"], "Autonomic status correctly categorized as Sympathetic Arousal")

    # -------------------------------------------------------------------
    # TEST 3: Acoustic & Inertial Meal Detection Classifier
    # -------------------------------------------------------------------
    print("\n[TEST 3: Smartwatch Acoustic & Inertial Meal-Start Detection]")

    # Case A: Active Eating Bout (High arm-to-mouth variance + 1.8 Hz chewing acoustic peak + HR bump)
    chewing_audio_spectrum = [20.0, 75.0, 85.0, 68.0, 25.0, 10.0]  # Energy concentrated in 1.2-2.5 Hz band
    res_eating = hemodynamic_estimator.detect_meal_initiation(
        accelerometer_variance=2.4,
        audio_frequency_spectrum=chewing_audio_spectrum,
        continuous_heart_rate=82.0,
        resting_baseline_hr=70.0
    )
    assert_test(res_eating["success"] is True, "Meal detection classifier ran successfully")
    assert_test(res_eating["mealDetected"] is True, f"Active eating successfully detected (Confidence: {res_eating['confidenceScore']})")
    assert_test("SURVEILLANCE ACTIVATED" in res_eating["clinicalAction"], "Triggered Autonomous Digital Twin Surveillance action")

    # Case B: Sedentary Desk Activity (Low variance, quiet audio, resting HR)
    res_desk = hemodynamic_estimator.detect_meal_initiation(
        accelerometer_variance=0.2,
        audio_frequency_spectrum=[5.0, 10.0, 8.0, 6.0, 4.0],
        continuous_heart_rate=71.0,
        resting_baseline_hr=70.0
    )
    assert_test(res_desk["mealDetected"] is False, f"Sedentary activity accurately rejected (Confidence: {res_desk['confidenceScore']})")

    # -------------------------------------------------------------------
    # TEST 4: FastAPI Hemodynamic Endpoints Validation
    # -------------------------------------------------------------------
    print("\n[TEST 4: FastAPI Hemodynamics & Sensor Endpoints Validation]")

    # Endpoint 1: Cuffless BP
    bp_req = CufflessBPEstimateRequest(
        ptt_ms=210.0,
        heart_rate_bpm=74.0,
        patient_height_cm=170.0,
        baseline_sbp=122.0,
        baseline_dbp=80.0
    )
    bp_resp = estimate_cuffless_bp_endpoint(bp_req)
    assert_test(bp_resp.get("success") is True, "estimate_cuffless_bp_endpoint returned success: True")
    assert_test("estimatedSystolicBP" in bp_resp, "Response contains estimatedSystolicBP")
    assert_test("pulseWaveVelocity_m_s" in bp_resp, "Response contains pulseWaveVelocity_m_s")

    # Endpoint 2: HRV Analysis
    hrv_req = HRVAnalysisRequest(rr_intervals_ms=healthy_rr)
    hrv_resp = analyze_hrv_endpoint(hrv_req)
    assert_test(hrv_resp.get("success") is True, "analyze_hrv_endpoint returned success: True")
    assert_test("rmssd_ms" in hrv_resp, "Response contains rmssd_ms")

    # Endpoint 3: Meal Detection
    meal_req = MealInitiationDetectRequest(
        accelerometer_variance=2.2,
        audio_frequency_spectrum=chewing_audio_spectrum,
        continuous_heart_rate=80.0,
        resting_baseline_hr=70.0
    )
    meal_resp = detect_meal_start_endpoint(meal_req)
    assert_test(meal_resp.get("success") is True, "detect_meal_start_endpoint returned success: True")
    assert_test(meal_resp.get("mealDetected") is True, "detect_meal_start_endpoint confirmed mealDetected: True")

    # -------------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------------
    print("\n======================================================")
    print(f"  PHASE 4 TEST RESULTS: {passed} PASSED, {failed} FAILED")
    print("======================================================\n")

    if failed > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    run_phase4_verification()
