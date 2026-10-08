"""
BioSync AI - Multi-Objective Clinical Pareto Ranker & Doctor Hacks Engine
Module: clinical_ranker.py

Ranks detected or prospective meal items relative to the user's confined
Metabolic Digital Twin (M_user).

Core Philosophy:
- "Don't focus on healthy diet only" - Non-preachy, real-doctor & nutritionist hybrid.
- Provides actionable harm-reduction "Doctor Hacks" (sequencing, pairing, portioning, movement).
- Multi-objective Pareto optimization across:
  1. Glycemic Stress Penalty (J_glyc)
  2. Cardiovascular / Vascular Load Penalty (J_cardio)
  3. Micronutrient Vitality & Satiety Reward (J_vitality)
- Fully offline, deterministic, zero generic cloud LLMs.
"""

from typing import List, Dict, Any, Optional
import numpy as np

from metabolic_twin import MetabolicDigitalTwin
from nutrition_db import nutrition_db


class ClinicalParetoRanker:
    """
    Ranks meal items against the user's active blood biomarkers and produces
    empathetic, clinically-sound harm reduction guidance.
    """

    @classmethod
    def rank_candidates(
        cls,
        candidate_items: List[Dict[str, Any]],
        twin: MetabolicDigitalTwin,
        meal_context: Optional[str] = "Meal"
    ) -> Dict[str, Any]:
        """
        Takes candidate meal items (already decomposed or by name), evaluates
        vital impact against twin M_user, ranks candidates, and generates doctor hacks.
        """
        if not candidate_items:
            return {
                "success": False,
                "message": "No candidates provided for clinical ranking.",
                "rankedItems": []
            }

        phenotype = twin.get_clinical_phenotype()
        scored_candidates = []

        # Weights configured dynamically based on patient's specific metabolic phenotype
        if phenotype["isInsulinResistant"]:
            w_glyc, w_cardio, w_vital = 0.50, 0.25, 0.25
        elif phenotype["isSaltSensitive"]:
            w_glyc, w_cardio, w_vital = 0.25, 0.50, 0.25
        elif phenotype["isLipidVulnerable"]:
            w_glyc, w_cardio, w_vital = 0.30, 0.45, 0.25
        else:
            w_glyc, w_cardio, w_vital = 0.35, 0.30, 0.35

        for cand in candidate_items:
            # 1. Ensure decomposed nutrition profile is available
            nutrition = cand.get("nutritionProfile")
            if not nutrition:
                # Try lookup via itemName or canonicalKey
                item_name = cand.get("itemName", cand.get("name", cand.get("canonicalKey", "")))
                quantity = float(cand.get("quantity", cand.get("portionQuantity", 1.0)))
                nutrition = nutrition_db.decompose(item_name, quantity=quantity)

            if not nutrition:
                # Skip uncataloged / non-food items
                continue

            nutrients = nutrition["nutrients"]
            net_carbs = nutrients.get("netCarbohydrates", nutrients.get("carbohydrates", 0.0))
            sodium = nutrients.get("sodium", 0.0)
            fiber = nutrients.get("fiber", 0.0)
            protein = nutrients.get("proteins", 0.0)
            potassium = nutrients.get("potassium", 0.0)
            sat_fat = nutrients.get("saturatedFat", 0.0)
            sugar = nutrients.get("sugar", 0.0)
            gi = nutrition.get("glycemicIndex", 50)
            gl = nutrition.get("glycemicLoad", 0.0)

            # 2. Forward Vital Projections
            impact = twin.predict_food_impact(net_carbs, sodium, glycemic_index=gi)
            pred_glucose_spike = impact["predictedGlucoseSpike"]
            pred_bp_spike = impact["predictedSystolicBPSpike"]

            # 3. Glycemic Strain Penalty J_glyc in [0, 100]
            # Penalizes high GL, high free sugars, and large predicted glucose spikes
            raw_glyc = (gl * 2.2) + (pred_glucose_spike * 1.4) + (sugar * 0.8) - (fiber * 2.0)
            j_glyc = float(np.clip(raw_glyc, 0.0, 100.0))

            # 4. Vascular / Cardiovascular Strain Penalty J_cardio in [0, 100]
            # High sodium and saturated fat increase strain; potassium provides protective vasodilation
            raw_cardio = (sodium / 22.0) + (pred_bp_spike * 4.0) + (sat_fat * 3.5) - (potassium / 35.0)
            j_cardio = float(np.clip(raw_cardio, 0.0, 100.0))

            # 5. Nutritional Vitality & Satiety Reward J_vitality in [0, 100]
            # Rewards bioavailable protein, prebiotic fiber, and essential minerals
            micronutrient_density = (
                (min(500.0, potassium) / 500.0) * 20.0 +
                (min(300.0, nutrients.get("calcium", 0.0)) / 300.0) * 15.0 +
                (min(50.0, nutrients.get("vitaminC", 0.0)) / 50.0) * 15.0
            )
            raw_vitality = (fiber * 7.0) + (protein * 3.0) + micronutrient_density
            j_vitality = float(np.clip(raw_vitality, 0.0, 100.0))

            # 6. Composite Score S_composite in [0, 100]
            s_composite = float(np.clip(
                100.0 - (w_glyc * j_glyc + w_cardio * j_cardio) + (w_vital * (j_vitality - 20.0)),
                5.0,
                99.0
            ))
            s_composite = float(np.round(s_composite, 1))

            # 7. Generate Non-Preachy, Practical "Doctor Hacks"
            doctor_hacks = cls._generate_doctor_hacks(
                item_name=nutrition["displayName"],
                category=nutrition["category"],
                gl=gl,
                gi=gi,
                net_carbs=net_carbs,
                sodium=sodium,
                fiber=fiber,
                protein=protein,
                pred_glucose_spike=pred_glucose_spike,
                pred_bp_spike=pred_bp_spike,
                twin=twin,
                phenotype=phenotype
            )

            scored_candidates.append({
                "canonicalKey": nutrition["canonicalKey"],
                "displayName": nutrition["displayName"],
                "category": nutrition["category"],
                "standardServing": nutrition["standardServing"],
                "portionQuantity": nutrition["portionQuantity"],
                "servingWeightGrams": nutrition["servingWeightGrams"],
                "brand": nutrition.get("brand"),
                "compositeScore": s_composite,
                "glycemicStrain": float(np.round(j_glyc, 1)),
                "vascularStrain": float(np.round(j_cardio, 1)),
                "vitalityScore": float(np.round(j_vitality, 1)),
                "predictedGlucoseSpike": pred_glucose_spike,
                "predictedSystolicBPSpike": pred_bp_spike,
                "glycemicLoad": gl,
                "glycemicIndex": gi,
                "glycemicLoadCategory": nutrition["glycemicLoadCategory"],
                "doctorHacks": doctor_hacks,
                "nutrients": nutrients
            })

        if not scored_candidates:
            return {
                "success": False,
                "message": "None of the candidate items could be matched to verified foods.",
                "rankedItems": []
            }

        # 8. Pareto Rank Ordering (Highest composite score first)
        scored_candidates.sort(key=lambda x: x["compositeScore"], reverse=True)

        for i, item in enumerate(scored_candidates, 1):
            item["rank"] = i
            if i == 1:
                item["clinicalTier"] = "Optimal Choice (Metabolic Greenlight)"
                item["tierBadge"] = "RANK 1 - BEST MATCH"
            elif item["compositeScore"] >= 65:
                item["clinicalTier"] = "Favorable with Minor Adjustments"
                item["tierBadge"] = f"RANK {i} - ENJOYABLE"
            elif item["compositeScore"] >= 45:
                item["clinicalTier"] = "Moderate Vital Load (Use Doctor Hacks)"
                item["tierBadge"] = f"RANK {i} - USE HACKS"
            else:
                item["clinicalTier"] = "Elevated Vital Impact (Portion Control Recommended)"
                item["tierBadge"] = f"RANK {i} - PORTION GUARD"

        best_item = scored_candidates[0]

        # Clinical rationale comparing best item to the user's specific biomarkers
        rationale = cls._generate_clinical_rationale(best_item, twin, phenotype)

        return {
            "success": True,
            "patientPhenotype": phenotype["primaryPhenotype"],
            "overallRiskLevel": phenotype["overallRiskLevel"],
            "totalCandidatesEvaluated": len(scored_candidates),
            "bestSuggestableItem": {
                "rank": 1,
                "displayName": best_item["displayName"],
                "compositeScore": best_item["compositeScore"],
                "clinicalTier": best_item["clinicalTier"],
                "summary": f"{best_item['displayName']} best preserves your metabolic equilibrium with a modest projected glucose rise of +{best_item['predictedGlucoseSpike']} mg/dL.",
            },
            "clinicalRationale": rationale,
            "rankedItems": scored_candidates
        }

    @classmethod
    def _generate_doctor_hacks(
        cls,
        item_name: str,
        category: str,
        gl: float,
        gi: int,
        net_carbs: float,
        sodium: float,
        fiber: float,
        protein: float,
        pred_glucose_spike: float,
        pred_bp_spike: float,
        twin: MetabolicDigitalTwin,
        phenotype: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """
        Generates realistic, empathetic, practical harm-reduction doctor hacks.
        Focuses on sequencing, pairing, portioning, and post-meal movement.
        """
        hacks = []

        # 1. MEAL SEQUENCING HACK (If carbohydrates are high / medium)
        if net_carbs >= 25 or gl >= 15:
            hacks.append({
                "type": "Sequencing Hack",
                "title": "Eat Fibers / Veggies 10 Mins Prior",
                "action": "If enjoying this meal, eat a small bowl of salad, cucumber, or curd 5-10 minutes beforehand. Soluble fiber lines the duodenum mucosa and delays gastric emptying, flattening your postprandial glucose spike by up to 35%!"
            })

        # 2. PROTEIN / HEALTHY FAT PAIRING HACK (If item is carb-dominant or low protein)
        if protein < 10 and net_carbs > 20:
            hacks.append({
                "type": "Nutritional Pairing Hack",
                "title": "Add a Quick Protein Anchor",
                "action": "Pair with 1 boiled egg, 40g paneer, or 3 tablespoons of Greek yogurt/curd. Protein stimulates GLP-1 and amylin release, moderating insulin demand and keeping you fuller for 3+ hours."
            })

        # 3. POST-MEAL MOVEMENT HACK (GLUT4 Activation)
        if pred_glucose_spike >= 18:
            hacks.append({
                "type": "Biochemical Movement Hack",
                "title": "10-Minute Post-Meal Stroll",
                "action": "Take a casual 10-15 minute walk after eating. Skeletal muscle contraction activates GLUT4 glucose transporters independent of insulin, directly soaking up circulating glucose and lowering your spike by ~15-25 mg/dL."
            })
        else:
            hacks.append({
                "type": "Metabolic Optimization Hack",
                "title": "Stay Active & Upright",
                "action": "Avoid immediate reclining after eating. Sitting upright or light pacing supports normal digestive motility and stable glycemic curves."
            })

        # 4. SODIUM & VASCULAR COUNTER-MEASURE (If sodium is elevated)
        if sodium >= 500:
            hacks.append({
                "type": "Vascular Flush Hack",
                "title": "Hydrate with Potassium Balance",
                "action": f"This item contains ~{int(sodium)}mg sodium. Drink 300-400ml of water with a squeeze of fresh lemon or coconut water to boost potassium; this prompts renal natriuresis to flush excess sodium without elevating blood pressure."
            })

        # 5. PORTION MINDFULNESS (For high-calorie or packaged treats)
        if gl >= 25 or sodium >= 700:
            hacks.append({
                "type": "Portion Freedom Hack",
                "title": "The 80% Rule (Hara Hachi Bu)",
                "action": "Enjoy the full flavor without guilt! Stopping at 80% fullness satisfies dopamine cravings while slashing the vital load on your pancreas and blood vessels."
            })

        return hacks[:4]  # Return top 3-4 concise, high-impact doctor hacks

    @classmethod
    def _generate_clinical_rationale(
        cls,
        best_item: Dict[str, Any],
        twin: MetabolicDigitalTwin,
        phenotype: Dict[str, Any]
    ) -> str:
        """Generates clear, personalized rationale explaining why the top item was chosen."""
        patient_notes = []
        if phenotype["isInsulinResistant"]:
            patient_notes.append(f"fasting glucose ({int(twin.fasting_glucose)} mg/dL)")
        if phenotype["isSaltSensitive"]:
            patient_notes.append(f"blood pressure ({int(twin.systolic_bp)}/{int(twin.diastolic_bp)} mmHg)")

        context_str = " and ".join(patient_notes) if patient_notes else "balanced metabolic baseline"

        return (
            f"Based on your current {context_str}, {best_item['displayName']} is ranked #1 because it delivers "
            f"the most balanced nutrient density with minimal hemodynamic stress (projected glucose surge: +{best_item['predictedGlucoseSpike']} mg/dL, "
            f"systolic BP shift: +{best_item['predictedSystolicBPSpike']} mmHg). If choosing other options, apply our practical doctor hacks to protect your vitals."
        )


# Global singleton instance
clinical_ranker = ClinicalParetoRanker()
