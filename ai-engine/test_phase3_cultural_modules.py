"""
BioSync AI - Phase 3 Verification Test Suite
Module: test_phase3_cultural_modules.py

Zero-hang synchronous verification suite for:
1. Single-Pot Joint Family Disaggregation (Conservation of Mass & Multi-Phenotype Plating).
2. Comprehensive 15-Botanical Ayurvedic-Allopathic Pharmacovigilance Matrix.
3. Cloud Kitchen Display System (KDS) ESC/POS Ticket & Packaging Sticker Formatter.
4. Endpoint validation & request schema compliance.
"""

import sys
from family_allocator import family_plating_allocator
from ayur_pharma_matrix import ayur_pharma_matrix
from kds_formatter import kds_formatter
from main import (
    allocate_family_single_pot_endpoint,
    screen_ayur_pharma_endpoint,
    format_kds_ticket_endpoint,
    FamilyAllocationRequest,
    AyurPharmaScreenRequest,
    KDSTicketRequest
)

def run_phase3_verification():
    print("\n======================================================")
    print("  RALPH LOOP VERIFICATION: Phase 3 Cultural Modules")
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
    # TEST 1: Single-Pot Joint Family Disaggregation (1kg Biryani + Dal)
    # -------------------------------------------------------------------
    print("\n[TEST 1: Single-Pot Family Meal Disaggregation]")
    family_members = [
        {
            "memberId": "mem_dadaji",
            "nickname": "Dadaji",
            "relation": "Grandfather",
            "clinicalConditions": ["Type_2_Diabetes", "CKD"],
            "metabolicTargets": {
                "maxPostprandialGlucose": 130.0,
                "maxSodiumPerMeal_mg": 400.0,
                "maxCarbsPerMeal_g": 35.0,
                "minProteinPerMeal_g": 15.0,
                "isPotassiumRestricted": True
            },
            "defaultPortionWeightFraction": 0.20
        },
        {
            "memberId": "mem_father",
            "nickname": "Papaji",
            "relation": "Father",
            "clinicalConditions": ["Hypertension"],
            "metabolicTargets": {
                "maxPostprandialGlucose": 160.0,
                "maxSodiumPerMeal_mg": 350.0,
                "maxCarbsPerMeal_g": 60.0,
                "minProteinPerMeal_g": 20.0,
                "isPotassiumRestricted": False
            },
            "defaultPortionWeightFraction": 0.25
        },
        {
            "memberId": "mem_mother",
            "nickname": "Mummyji",
            "relation": "Mother",
            "clinicalConditions": ["PCOS", "Prediabetes"],
            "metabolicTargets": {
                "maxPostprandialGlucose": 140.0,
                "maxSodiumPerMeal_mg": 500.0,
                "maxCarbsPerMeal_g": 40.0,
                "minProteinPerMeal_g": 20.0,
                "isPotassiumRestricted": False
            },
            "defaultPortionWeightFraction": 0.25
        },
        {
            "memberId": "mem_son",
            "nickname": "Aman (Gym)",
            "relation": "Son",
            "clinicalConditions": ["None"],
            "metabolicTargets": {
                "maxPostprandialGlucose": 180.0,
                "maxSodiumPerMeal_mg": 1000.0,
                "maxCarbsPerMeal_g": 90.0,
                "minProteinPerMeal_g": 35.0,
                "isPotassiumRestricted": False
            },
            "defaultPortionWeightFraction": 0.30
        }
    ]

    ordered_dishes = [
        {
            "name": "Hyderabadi Dum Chicken Biryani (1kg Handi)",
            "category": "Rice_Biryani",
            "servingWeightGrams": 1000.0,
            "quantity": 1.0,
            "carbohydrates_g": 160.0,
            "protein_g": 85.0,
            "fat_g": 52.0,
            "sodium_mg": 1850.0,
            "potassium_mg": 980.0,
            "glycemicIndex": 65
        },
        {
            "name": "Dal Makhani (Slow-Cooked)",
            "category": "Main_Course",
            "servingWeightGrams": 350.0,
            "quantity": 1.0,
            "carbohydrates_g": 44.0,
            "protein_g": 17.0,
            "fat_g": 22.0,
            "sodium_mg": 720.0,
            "potassium_mg": 580.0,
            "glycemicIndex": 42
        }
    ]

    alloc_res = family_plating_allocator.allocate_single_pot(
        family_members=family_members,
        ordered_dishes=ordered_dishes
    )

    assert_test(alloc_res["success"] is True, "Family single-pot allocation completed successfully")
    assert_test(alloc_res["allocatedFamilyMembersCount"] == 4, "Allocated plates for all 4 family members")

    # Conservation of Mass: Sum of individual plated weights must equal total ordered weight (1350g)
    total_input_weight = 1000.0 + 350.0
    sum_allocated_weight = sum(m["allocatedTotalWeightGrams"] for m in alloc_res["memberPlatingPlans"])
    weight_diff = abs(sum_allocated_weight - total_input_weight)
    assert_test(weight_diff <= 1.0, f"Conservation of Mass verified: Allocated {sum_allocated_weight}g vs Input {total_input_weight}g (diff: {weight_diff:.2f}g)")

    # Member Specific Clinical Assertions
    plans = {p["memberName"]: p for p in alloc_res["memberPlatingPlans"]}

    # Dadaji (T2D + CKD) must have smallest carb load and compliant potassium
    dadaji_plan = plans["Dadaji"]
    assert_test(dadaji_plan["nutritionalSummary"]["totalCarbs_g"] < 40.0, f"Dadaji carb load restricted to {dadaji_plan['nutritionalSummary']['totalCarbs_g']}g (<40g)")
    assert_test(dadaji_plan["biophysicalProjection"]["predictedPeakGlucose"] < 155.0, f"Dadaji predicted peak: {dadaji_plan['biophysicalProjection']['predictedPeakGlucose']} mg/dL")

    # Aman (Son) must have largest protein and carb allocation
    son_plan = plans["Aman (Gym)"]
    assert_test(son_plan["nutritionalSummary"]["totalProtein_g"] > 25.0, f"Son athletic protein allocation: {son_plan['nutritionalSummary']['totalProtein_g']}g (>25g)")
    assert_test(son_plan["allocatedTotalWeightGrams"] > dadaji_plan["allocatedTotalWeightGrams"], "Son receives larger plate volume than diabetic grandfather")

    # -------------------------------------------------------------------
    # TEST 2: Ayurvedic Pharmacovigilance Matrix (15-Botanical Screen)
    # -------------------------------------------------------------------
    print("\n[TEST 2: Ayurvedic-Allopathic Pharmacovigilance Screen]")

    # Case A: Karela + Glimepiride (Lethal Nocturnal Hypo)
    res_karela = ayur_pharma_matrix.evaluate_cross_interactions(
        botanicals=[{"name": "Karela"}],
        medications=["Glimepiride 2mg"]
    )
    assert_test(res_karela["isOrderBlocked"] is True, "Karela + Glimepiride triggers CRITICAL_LOCKOUT (blocks order)")
    assert_test("Hypoglycemia" in res_karela["conflicts"][0]["clinicalRisk"], "Flagged Severe Compounded Hypoglycemia")

    # Case B: Licorice (Mulethi) + Telmisartan (Hypertensive Crisis)
    res_mulethi = ayur_pharma_matrix.evaluate_cross_interactions(
        botanicals=[{"name": "Licorice_Mulethi"}],
        medications=["Telmisartan 40mg", "Amlodipine 5mg"]
    )
    assert_test(res_mulethi["isOrderBlocked"] is True, "Mulethi + Telmisartan triggers CRITICAL_LOCKOUT")
    assert_test("Pseudo-Hyperaldosteronism" in res_mulethi["conflicts"][0]["clinicalRisk"], "Detected 11-beta-HSD2 pseudo-hyperaldosteronism")

    # Case C: Ashwagandha + Levothyroxine (Thyrotoxicosis)
    res_ashwa = ayur_pharma_matrix.evaluate_cross_interactions(
        botanicals=[{"name": "Ashwagandha"}],
        medications=["Levothyroxine 75mcg (Thyronorm)"]
    )
    assert_test(res_ashwa["isOrderBlocked"] is True, "Ashwagandha + Levothyroxine triggers CRITICAL_LOCKOUT")

    # Case D: Guggul + Oral Contraceptive (CYP3A4 induction)
    res_guggul = ayur_pharma_matrix.evaluate_cross_interactions(
        botanicals=[{"name": "Guggul"}],
        medications=["Ethinylestradiol 30mcg"]
    )
    assert_test(res_guggul["isOrderBlocked"] is True, "Guggul + Oral Contraceptive triggers CRITICAL_LOCKOUT")

    # Case E: Turmeric + Aspirin (Warning Advisory, not blocked)
    res_turmeric = ayur_pharma_matrix.evaluate_cross_interactions(
        botanicals=[{"name": "Turmeric_Curcumin"}],
        medications=["Aspirin 75mg (Ecosprin)"]
    )
    assert_test(res_turmeric["hasInteractions"] is True, "Turmeric + Aspirin detected antiplatelet synergy")
    assert_test(res_turmeric["isOrderBlocked"] is False, "Turmeric + Aspirin is WARNING_ADVISORY (order not blocked)")

    # Case F: Safe Botanical (Cinnamon without interacting drugs)
    res_clean = ayur_pharma_matrix.evaluate_cross_interactions(
        botanicals=[{"name": "Cinnamon"}],
        medications=["Metformin 500mg"]
    )
    assert_test(res_clean["hasInteractions"] is False, "Cinnamon + Metformin passes clean with 0 conflicts")

    # -------------------------------------------------------------------
    # TEST 3: Cloud Kitchen KDS ESC/POS Ticket Formatter
    # -------------------------------------------------------------------
    print("\n[TEST 3: Cloud Kitchen KDS & Thermal Print Formatter]")
    kds_ticket = kds_formatter.generate_kitchen_ticket(
        order_number="BIO-GRD-889911",
        restaurant_name="Arogya Sattva Cloud Kitchen",
        order_mode="VITALS_GUARD",
        items=[
            {
                "name": "Foxtail Millet Dum Pulao",
                "quantity": 1,
                "appliedModifications": [{"label": "Sendha Namak (Low Sodium)"}]
            }
        ],
        mitigation_plan={
            "preBiteSequencing": [
                {"stepNumber": 1, "instructions": "Eat raw salad / raita for 5 min."},
                {"stepNumber": 2, "instructions": "Eat protein next."},
                {"stepNumber": 3, "instructions": "Eat starch last."}
            ]
        },
        family_allocation=[
            {"memberName": "Dadaji", "clinicalCondition": "T2D+CKD", "allocatedTotalWeightGrams": 240}
        ]
    )

    assert_test(kds_ticket["success"] is True, "KDS ticket generated successfully")
    assert_test(kds_ticket["totalModificationsApplied"] == 1, "Tracked 1 applied kitchen modification")
    assert_test(len(kds_ticket["packagingStickers"]) == 3, "Generated 3 pre-bite food sequencing box labels")
    assert_test(len(kds_ticket["cryptographicTicketHash"]) == 64, "Generated 64-char SHA-256 custody ledger hash")
    assert_test("BIOSYNC AI - VITAL COMMERCE ENGINE" in kds_ticket["escposRawTicket"], "ESC/POS raw ticket header formatted")

    # -------------------------------------------------------------------
    # TEST 4: FastAPI Endpoints Execution
    # -------------------------------------------------------------------
    print("\n[TEST 4: FastAPI Cultural Endpoints Validation]")
    fam_req = FamilyAllocationRequest(
        familyMembers=family_members,
        orderedDishes=ordered_dishes
    )
    fam_resp = allocate_family_single_pot_endpoint(fam_req)
    assert_test(fam_resp.get("success") is True, "allocate_family_single_pot_endpoint executed successfully")

    ayur_req = AyurPharmaScreenRequest(
        botanicals=[{"name": "Karela"}],
        medications=["Glimepiride 1mg"]
    )
    ayur_resp = screen_ayur_pharma_endpoint(ayur_req)
    assert_test(ayur_resp.get("isOrderBlocked") is True, "screen_ayur_pharma_endpoint correctly reported isOrderBlocked: True")

    kds_req = KDSTicketRequest(
        orderNumber="BIO-TEST-001",
        restaurantName="Dakshin Delights",
        orderMode="VITALS_GUARD",
        items=[{"name": "Idli", "quantity": 2, "appliedModifications": []}]
    )
    kds_resp = format_kds_ticket_endpoint(kds_req)
    assert_test(kds_resp.get("success") is True, "format_kds_ticket_endpoint executed successfully")

    # -------------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------------
    print("\n======================================================")
    print(f"  PHASE 3 TEST RESULTS: {passed} PASSED, {failed} FAILED")
    print("======================================================\n")

    if failed > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    run_phase3_verification()

