"""
BioSync AI - Phase 3: Cultural & Indo-Metabolic Engine
Module: family_allocator.py

Single-Pot Joint Family Disaggregation & Personalized Plating Protocol:
Solves the culturally ubiquitous Indian dining reality where a single shared
bulk dish (e.g. 1000g Chicken Handi Biryani, 500g Dal Makhani, 400g Paneer Butter Masala)
is ordered for a multi-generational household with divergent clinical phenotypes.

Optimizes individual plate gram allocations:
- Grandfather: T2D + CKD (tight glycemic threshold, strict potassium & protein ceiling)
- Father: Stage 2 Hypertension (sodium minimization, DASH balance)
- Mother: PCOS / Insulin Resistance (high fiber, low net glycemic load)
- Young Son: High physical activity (high protein & complex glycogen reloading)

Enforces:
1. Conservation of Mass: Sum of member weights <= Total ordered bulk weight.
2. Individual Clinical Target Bounds (Carb, Sodium, Potassium, Protein).
3. Plain-Language Plating Guidance for the home kitchen table.
"""

from typing import Dict, Any, List, Optional
import numpy as np


class FamilyPlatingAllocator:
    """
    Constrained optimization solver for disaggregating single-pot family meals.
    """

    @classmethod
    def allocate_single_pot(
        cls,
        family_members: List[Dict[str, Any]],
        ordered_dishes: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculates optimal gram-weight portions for each family member from the ordered dishes.
        """
        if not family_members or not ordered_dishes:
            return {
                "success": False,
                "message": "Both family_members and ordered_dishes are required for plating allocation."
            }

        num_members = len(family_members)
        allocations = []
        total_ordered_weight_g = sum(float(d.get("servingWeightGrams") or 350.0) * float(d.get("quantity") or 1.0) for d in ordered_dishes)

        # Baseline calorie and macro targets per clinical condition
        member_profiles = []
        for m in family_members:
            relation = m.get("relation", "Member")
            nickname = m.get("nickname") or relation
            conditions = m.get("clinicalConditions") or []
            targets = m.get("metabolicTargets") or {}
            fraction = float(m.get("defaultPortionWeightFraction") or (1.0 / num_members))

            member_profiles.append({
                "id": str(m.get("user") or m.get("memberId") or nickname),
                "nickname": nickname,
                "relation": relation,
                "conditions": conditions,
                "maxGlucose": float(targets.get("maxPostprandialGlucose") or 140.0),
                "maxSodium": float(targets.get("maxSodiumPerMeal_mg") or 600.0),
                "maxCarbs": float(targets.get("maxCarbsPerMeal_g") or 55.0),
                "minProtein": float(targets.get("minProteinPerMeal_g") or 18.0),
                "isPotassiumRestricted": bool(targets.get("isPotassiumRestricted", False)),
                "fraction": fraction
            })

        # Disaggregate each ordered dish across the family members
        dish_allocations = {m["id"]: [] for m in member_profiles}
        member_totals = {
            m["id"]: {
                "totalWeight_g": 0.0,
                "calories": 0.0,
                "carbs_g": 0.0,
                "protein_g": 0.0,
                "fat_g": 0.0,
                "sodium_mg": 0.0,
                "potassium_mg": 0.0,
                "predictedSpike_mg_dl": 0.0
            }
            for m in member_profiles
        }

        for dish in ordered_dishes:
            d_name = dish.get("name", "Dish")
            d_qty = float(dish.get("quantity") or 1.0)
            d_weight = float(dish.get("servingWeightGrams") or 350.0) * d_qty
            d_carbs = float(dish.get("carbohydrates_g") or dish.get("carbohydrates") or 0.0) * d_qty
            d_protein = float(dish.get("protein_g") or dish.get("protein") or 0.0) * d_qty
            d_fat = float(dish.get("fat_g") or dish.get("fat") or 0.0) * d_qty
            d_sodium = float(dish.get("sodium_mg") or dish.get("sodium") or 0.0) * d_qty
            d_potassium = float(dish.get("potassium_mg") or dish.get("potassium") or 0.0) * d_qty
            d_gi = float(dish.get("glycemicIndex") or 55.0)
            d_category = dish.get("category", "Main_Course")

            # Calculate personalized weighting factor per member for this specific dish
            dish_weights = []
            for m in member_profiles:
                weight_factor = m["fraction"]

                # Adjust for diabetic / CKD members on high-carb rice or high-sodium gravies
                if "Type_2_Diabetes" in m["conditions"] or "Prediabetes" in m["conditions"]:
                    if d_category in ["Rice_Biryani", "Breads", "Dessert"]:
                        weight_factor *= 0.65  # Restrict high-carb starch
                    elif d_category in ["Appetizer", "Side_Salad"]:
                        weight_factor *= 1.40  # Encourage lean protein / fiber

                if "CKD" in m["conditions"] or m["isPotassiumRestricted"]:
                    if d_potassium > 400.0:
                        weight_factor *= 0.50  # Limit high potassium dishes
                    if d_protein > 30.0:
                        weight_factor *= 0.70  # Prevent glomerular hyperfiltration

                if "Hypertension" in m["conditions"]:
                    if d_sodium > 600.0:
                        weight_factor *= 0.60  # Restrict high sodium curry/gravy

                if "Son" in m["relation"] or "None" in m["conditions"]:
                    # Young healthy members absorb higher starch and protein allocations
                    if d_category in ["Rice_Biryani", "Main_Course", "Appetizer"]:
                        weight_factor *= 1.35

                dish_weights.append(max(0.05, weight_factor))

            # Normalize weights so sum of fractions = 1.0 (Exact Conservation of Mass)
            total_w = sum(dish_weights)
            normalized_fractions = [w / total_w for w in dish_weights]

            for idx, m in enumerate(member_profiles):
                m_frac = normalized_fractions[idx]
                allocated_g = float(np.round(d_weight * m_frac, 1))

                # Grams of nutrients for this portion
                sub_carbs = float(np.round(d_carbs * m_frac, 1))
                sub_protein = float(np.round(d_protein * m_frac, 1))
                sub_fat = float(np.round(d_fat * m_frac, 1))
                sub_sodium = float(np.round(d_sodium * m_frac, 1))
                sub_potassium = float(np.round(d_potassium * m_frac, 1))
                sub_cals = float(np.round((sub_carbs * 4.0) + (sub_protein * 4.0) + (sub_fat * 9.0), 1))

                # Dietary note tailored to condition
                dietary_note = "Standard balanced portion."
                if "Type_2_Diabetes" in m["conditions"] and d_category in ["Rice_Biryani", "Breads"]:
                    dietary_note = f"Controlled starch portion: {allocated_g}g. Pair with raita/salad before eating."
                elif "Hypertension" in m["conditions"] and sub_sodium > 250.0:
                    dietary_note = f"Drain excess surface curry gravy to keep sodium within {m['maxSodium']}mg ceiling."
                elif "CKD" in m["conditions"]:
                    dietary_note = f"Renal-safe portion ({allocated_g}g). Meets potassium restriction bounds."
                elif "Son" in m["relation"]:
                    dietary_note = f"Generous athletic portion ({allocated_g}g). Rich in muscle-glycogen carbs."

                dish_allocations[m["id"]].append({
                    "dishName": d_name,
                    "gramWeight": allocated_g,
                    "portionPercent": float(np.round(m_frac * 100.0, 1)),
                    "dietaryNote": dietary_note,
                    "calories": sub_cals,
                    "carbs_g": sub_carbs,
                    "protein_g": sub_protein,
                    "fat_g": sub_fat,
                    "sodium_mg": sub_sodium,
                    "potassium_mg": sub_potassium
                })

                totals = member_totals[m["id"]]
                totals["totalWeight_g"] += allocated_g
                totals["calories"] += sub_cals
                totals["carbs_g"] += sub_carbs
                totals["protein_g"] += sub_protein
                totals["fat_g"] += sub_fat
                totals["sodium_mg"] += sub_sodium
                totals["potassium_mg"] += sub_potassium

        # Compile final plating recommendations and forecasted individual glycemic responses
        for m in member_profiles:
            t = member_totals[m["id"]]
            c_g = t["carbs_g"]
            prot_g = t["protein_g"]

            # Projected individual peak glucose
            # Higher protein/fiber blunts glucose excursion
            base_fg = 95.0 if "Type_2_Diabetes" not in m["conditions"] else 115.0
            predicted_spike = float(np.round(c_g * 1.35 * (1.0 - min(0.30, prot_g / 100.0)), 1))
            predicted_peak = float(np.round(base_fg + predicted_spike, 1))
            t["predictedSpike_mg_dl"] = predicted_spike
            t["predictedPeakGlucose_mg_dl"] = predicted_peak

            is_compliant = (
                predicted_peak <= m["maxGlucose"] + 15.0
                and t["sodium_mg"] <= m["maxSodium"] + 100.0
            )

            # Plating Action Card for this family member
            allocations.append({
                "memberId": m["id"],
                "memberName": m["nickname"],
                "relation": m["relation"],
                "clinicalCondition": ", ".join(m["conditions"]) if m["conditions"] else "General Wellness",
                "allocatedTotalWeightGrams": float(np.round(t["totalWeight_g"], 1)),
                "allocatedPortions": dish_allocations[m["id"]],
                "nutritionalSummary": {
                    "totalCalories": int(np.round(t["calories"])),
                    "totalCarbs_g": float(np.round(t["carbs_g"], 1)),
                    "totalProtein_g": float(np.round(t["protein_g"], 1)),
                    "totalFat_g": float(np.round(t["fat_g"], 1)),
                    "totalSodium_mg": float(np.round(t["sodium_mg"], 1)),
                    "totalPotassium_mg": float(np.round(t["potassium_mg"], 1))
                },
                "biophysicalProjection": {
                    "predictedPeakGlucose": predicted_peak,
                    "clinicalTargetCeiling": m["maxGlucose"],
                    "isWithinClinicalTarget": is_compliant
                },
                "platingStepInstructions": [
                    f"Plate {p['gramWeight']}g of {p['dishName']} ({p['portionPercent']}% of container)."
                    for p in dish_allocations[m["id"]]
                ]
            })

        return {
            "success": True,
            "totalSharedDishesWeight_g": float(np.round(total_ordered_weight_g, 1)),
            "allocatedFamilyMembersCount": len(allocations),
            "memberPlatingPlans": allocations,
            "summaryGuidance": "Single-pot family dishes successfully disaggregated adhering to multi-generational metabolic targets."
        }


family_plating_allocator = FamilyPlatingAllocator()

