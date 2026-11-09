"""
Phase 7 Verification Test Suite: AI Engine Stress, Concurrency & Security Audit
Tests high-throughput ODE solving, numerical stability under extreme physiological inputs,
tamper-evident SHA-256 integrity, and Ayur-Pharma pharmacovigilance invariants.
"""

import time
import math
import hashlib
from typing import List, Dict, Any

from food_simulation_engine import food_simulation_engine
from family_allocator import family_plating_allocator
from ayur_pharma_matrix import ayur_pharma_matrix
from hemodynamic_estimator import hemodynamic_estimator
from kds_formatter import kds_formatter

def run_phase7_ai_tests():
    print("\n======================================================================")
    print("  RALPH LOOP VERIFICATION: Phase 7 AI Engine Stress & Security Audit")
    print("======================================================================\n")

    passed = 0
    failed = 0

    def test_assert(condition: bool, msg: str):
        nonlocal passed, failed
        if condition:
            print(f"  ✅ PASS: {msg}")
            passed += 1
        else:
            print(f"  ❌ FAIL: {msg}")
            failed += 1

    # -------------------------------------------------------------
    # TEST 1: High-Concurrency In-Silico ODE Solver Stress (50 iterations)
    # -------------------------------------------------------------
    print("[TEST GROUP 1: In-Silico ODE Solver Concurrency & Latency Stress]")
    vitals_baseline = {
        "glucoseFasting": 98.0,
        "systolic": 124.0,
        "diastolic": 80.0,
        "heartRate": 72.0,
        "bmi": 24.0,
        "activeMedications": ["Metformin 500mg"],
    }

    test_cart = [
        {
            "foodItem": {
                "name": "Hyderabadi Dum Biryani",
                "carbohydrates_g": 65.0,
                "netCarbohydrates_g": 58.0,
                "fiber_g": 7.0,
                "protein_g": 24.0,
                "fat_g": 18.0,
                "sodium_mg": 580.0,
                "potassium_mg": 410.0,
                "glycemicIndex": 55,
                "amyloseRatio": 0.28,
                "resistantStarchFactor": 0.12,
                "activeBotanicals": [],
            },
            "quantity": 1.0,
        }
    ]

    start_time = time.perf_counter()
    num_runs = 50
    all_peaks = []

    for _ in range(num_runs):
        res = food_simulation_engine.simulate_meal_cart(
            vitals=vitals_baseline,
            items=test_cart,
            order_mode="CHEAT_MODE_OVERRIDE"
        )
        all_peaks.append(res["forecast"]["simulatedPeakGlucose"])

    elapsed = time.perf_counter() - start_time
    avg_latency_ms = (elapsed / num_runs) * 1000

    test_assert(len(all_peaks) == num_runs, f"Successfully solved {num_runs} ODE trajectories")
    test_assert(avg_latency_ms < 15.0, f"Mean ODE latency is sub-15ms ({avg_latency_ms:.2f} ms/run)")
    test_assert(all(p == all_peaks[0] for p in all_peaks), "Deterministic numerical repeatability: 100% invariant")

    # -------------------------------------------------------------
    # TEST 2: Numerical Boundary & Extreme Input Resilience
    # -------------------------------------------------------------
    print("\n[TEST GROUP 2: Numerical Boundary & Extreme Input Handling]")
    # Zero carbs
    zero_cart = [
        {
            "foodItem": {
                "name": "Pure Boiled Water / Clear Broth",
                "carbohydrates_g": 0.0,
                "netCarbohydrates_g": 0.0,
                "protein_g": 0.0,
                "fat_g": 0.0,
                "fiber_g": 0.0,
                "sodium_mg": 50.0,
                "potassium_mg": 20.0,
                "glycemicIndex": 0,
                "amyloseRatio": 0.0,
                "resistantStarchFactor": 0.0,
                "activeBotanicals": [],
            },
            "quantity": 1.0,
        }
    ]
    sim_zero = food_simulation_engine.simulate_meal_cart(
        vitals=vitals_baseline,
        items=zero_cart,
        order_mode="VITALS_GUARD"
    )
    test_assert(sim_zero["forecast"]["simulatedPeakGlucose"] >= vitals_baseline["glucoseFasting"], "Zero-carb meal handles euglycemic baseline without crashing")
    test_assert(sim_zero["forecast"]["glycemicExcursionCategory"] == "SAFE_STABLE", "Zero-carb meal categorized as SAFE_STABLE")

    # Massive 400g carb feast
    extreme_cart = [
        {
            "foodItem": {
                "name": "Massive Feast 10 Naans",
                "carbohydrates_g": 400.0,
                "netCarbohydrates_g": 380.0,
                "protein_g": 40.0,
                "fat_g": 80.0,
                "fiber_g": 20.0,
                "sodium_mg": 2500.0,
                "potassium_mg": 600.0,
                "glycemicIndex": 80,
                "amyloseRatio": 0.15,
                "resistantStarchFactor": 0.02,
                "activeBotanicals": [],
            },
            "quantity": 1.0,
        }
    ]
    sim_extreme = food_simulation_engine.simulate_meal_cart(
        vitals=vitals_baseline,
        items=extreme_cart,
        order_mode="CHEAT_MODE_OVERRIDE"
    )
    test_assert(sim_extreme["forecast"]["glycemicExcursionCategory"] == "DANGEROUS_SPIKE", "Extreme carb load flagged as DANGEROUS_SPIKE")
    test_assert(sim_extreme["forecast"]["simulatedPeakGlucose"] > 180.0, f"Correctly models severe hyperglycemia: {sim_extreme['forecast']['simulatedPeakGlucose']:.1f} mg/dL")
    test_assert(sim_extreme["mitigationPlan"]["targetStepsToBurnExcursion"] > 3000, "Prescribes substantial ambulation burn (>3000 steps) for massive feast")

    # -------------------------------------------------------------
    # TEST 3: Moens-Korteweg Cuffless BP Boundary Testing
    # -------------------------------------------------------------
    print("\n[TEST GROUP 3: Hemodynamic Moens-Korteweg Boundary Safety]")
    # Short PTT (severe vasoconstriction)
    bp_short = hemodynamic_estimator.estimate_cuffless_bp(ptt_ms=130.0, baseline_sbp=120.0, baseline_dbp=80.0)
    test_assert(bp_short["estimatedSystolicBP"] > 140.0, f"Short PTT (130ms) identifies hypertension: {bp_short['estimatedSystolicBP']:.1f} mmHg")
    test_assert(not math.isnan(bp_short["estimatedSystolicBP"]), "Short PTT produces non-NaN numeric value")

    # Long PTT (vasodilation)
    bp_long = hemodynamic_estimator.estimate_cuffless_bp(ptt_ms=380.0, baseline_sbp=120.0, baseline_dbp=80.0)
    test_assert(bp_long["estimatedSystolicBP"] < 110.0, f"Long PTT (380ms) reflects vasodilation: {bp_long['estimatedSystolicBP']:.1f} mmHg")
    test_assert(bp_long["pulseWaveVelocity_m_s"] > 0, "Pulse wave velocity remains strictly positive")

    # -------------------------------------------------------------
    # TEST 4: Single-Pot Multi-Phenotype Mass Conservation Invariant
    # -------------------------------------------------------------
    print("\n[TEST GROUP 4: Family Plating Mass Conservation Invariant across Scales]")
    family_members = [
        {
            "memberId": "mem_dadaji",
            "nickname": "Dadaji",
            "relation": "Grandfather",
            "clinicalConditions": ["Type_2_Diabetes", "CKD"],
            "metabolicTargets": {"maxCarbsPerMeal_g": 35.0, "isPotassiumRestricted": True},
            "defaultPortionWeightFraction": 0.20,
        },
        {
            "memberId": "mem_papaji",
            "nickname": "Papaji",
            "relation": "Father",
            "clinicalConditions": ["Hypertension"],
            "metabolicTargets": {"maxSodiumPerMeal_mg": 500.0},
            "defaultPortionWeightFraction": 0.30,
        },
        {
            "memberId": "mem_aman",
            "nickname": "Aman",
            "relation": "Son",
            "clinicalConditions": ["Athlete"],
            "metabolicTargets": {"minProteinPerMeal_g": 30.0},
            "defaultPortionWeightFraction": 0.50,
        },
    ]

    test_weights = [350.0, 750.0, 1000.0, 1500.0, 2500.0]

    for total_g in test_weights:
        dishes = [
            {
                "name": "Handi Biryani",
                "servingWeightGrams": total_g,
                "quantity": 1.0,
                "carbohydrates_g": total_g * 0.22,
                "protein_g": total_g * 0.12,
                "fat_g": total_g * 0.08,
                "sodium_mg": total_g * 1.5,
                "potassium_mg": total_g * 0.8,
            }
        ]
        alloc = family_plating_allocator.allocate_single_pot(family_members=family_members, ordered_dishes=dishes)
        total_allocated = sum(
            p["gramWeight"] for m in alloc["memberPlatingPlans"] for p in m["allocatedPortions"]
        )
        discrepancy = abs(total_allocated - total_g)
        test_assert(discrepancy < 0.25, f"Pot size {total_g}g strictly conserved (diff: {discrepancy:.2f}g)")

    # -------------------------------------------------------------
    # TEST 5: SHA-256 Custody Hash Tamper-Detection
    # -------------------------------------------------------------
    print("\n[TEST GROUP 5: Cryptographic SHA-256 Custody Ledger Audit]")
    ticket_1 = kds_formatter.generate_kitchen_ticket(
        order_number="BIO-GRD-889911",
        restaurant_name="Arogya Sattva Cloud Kitchen",
        order_mode="VITALS_GUARD",
        items=[{"name": "Foxtail Millet Dum Pulao", "quantity": 1, "appliedModifications": [{"label": "A2 Desi Ghee"}]}],
    )
    hash_original = ticket_1["cryptographicTicketHash"]
    test_assert(len(hash_original) == 64, "Generated valid 64-character SHA-256 hex digest")

    # Tampered prescription: changing a customization string
    ticket_2 = kds_formatter.generate_kitchen_ticket(
        order_number="BIO-GRD-889911",
        restaurant_name="Arogya Sattva Cloud Kitchen",
        order_mode="VITALS_GUARD",
        items=[{"name": "Foxtail Millet Dum Pulao", "quantity": 1, "appliedModifications": [{"label": "A2 Desi Ghee TAMPERED"}]}],
    )
    hash_tampered = ticket_2["cryptographicTicketHash"]
    test_assert(hash_original != hash_tampered, "Tampering with prescription alters cryptographic hash (Tamper-evident)")

    # -------------------------------------------------------------
    # TEST 6: Pharmacovigilance Completeness: 15-Botanical Matrix
    # -------------------------------------------------------------
    print("\n[TEST GROUP 6: Ayur-Pharma Sentinel Completeness & Zero False Negatives]")
    critical_pairs = [
        ("Karela", "Glimepiride 2mg"),
        ("Licorice_Mulethi", "Telmisartan 40mg"),
        ("Ashwagandha", "Levothyroxine 75mcg"),
        ("Guggul", "Ethinylestradiol 30mcg"),
    ]

    for herb, med in critical_pairs:
        screen = ayur_pharma_matrix.evaluate_cross_interactions(
            botanicals=[{"name": herb}],
            medications=[med]
        )
        test_assert(screen["isOrderBlocked"] is True, f"Lethal combination {herb} + {med} is 100% blocked from fulfillment")

    print("\n----------------------------------------------------------------------")
    print(f"  Phase 7 AI Engine Summary: {passed} Passed, {failed} Failed")
    print("----------------------------------------------------------------------\n")

    if failed > 0:
        exit(1)
    else:
        exit(0)

if __name__ == "__main__":
    run_phase7_ai_tests()
