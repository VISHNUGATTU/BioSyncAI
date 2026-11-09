"""
BioSync AI - Phase 2: Food-Tech In-Silico Simulation & Bio-Hack Engine
Module: food_simulation_engine.py

Integrates:
1. Multi-Item Cart Digestive Aggregation (Amylose, Resistant Starch RS3, GI, Macros).
2. Whole-Body 7-Compartment ODE & Windkessel Hemodynamic Simulation via OmniTwinEngine.
3. Skeletal Muscle Glucose Uptake Model (Insulin-Independent GLUT-4 Translocation & Ambulation Quotas).
4. Three-Phase Pre-Bite Food Sequencing & Acetic Acid Pre-Load Engine.
5. Ayurvedic-Allopathic Cross-Interaction Screen.
"""

from typing import Dict, Any, List, Optional
import numpy as np

from metabolic_twin import MetabolicDigitalTwin
from omni_twin_engine import omni_twin_engine
from pharmacodynamics import pharmacodynamics_engine


class FoodSimulationEngine:
    """
    Biophysical simulation engine for vital-constrained food ordering & pre-order excursion forecasting.
    """

    @classmethod
    def simulate_meal_cart(
        cls,
        vitals: Optional[Dict[str, Any]] = None,
        items: Optional[List[Dict[str, Any]]] = None,
        order_mode: str = "VITALS_GUARD",
        meal_time_hour: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Executes whole-body in-silico simulation of the selected food items
        against the user's continuous digital twin.
        """
        vitals = vitals or {}
        items = items or []

        # 1. Initialize or Reconstruct Metabolic Digital Twin from Vitals
        twin_dict = {
            "fasting_glucose": vitals.get("glucoseFasting") or vitals.get("currentCGMGlucose") or 95.0,
            "systolic_bp": vitals.get("systolic") or 120.0,
            "diastolic_bp": vitals.get("diastolic") or 80.0,
            "resting_heart_rate": vitals.get("heartRate") or 72.0,
            "bmi": vitals.get("bmi") or 24.5,
            "weight_kg": vitals.get("weightKg") or 70.0,
            "egfr": vitals.get("egfr") or 90.0,
            "active_medications": vitals.get("activeMedications") or []
        }
        twin = MetabolicDigitalTwin.from_vitals_dict(twin_dict)

        # 2. Deconstruct and Aggregate Cart Items
        total_gross_carbs = 0.0
        total_net_carbs = 0.0
        total_protein = 0.0
        total_fat = 0.0
        total_fiber = 0.0
        total_sodium = 0.0
        total_potassium = 0.0

        weighted_gi_sum = 0.0
        weighted_amylose_sum = 0.0
        weighted_rs3_sum = 0.0
        carb_weight_sum = 0.0

        food_names: List[str] = []
        active_botanicals: List[Dict[str, Any]] = []
        contraindications_flagged: List[str] = []

        for cart_entry in items:
            food = cart_entry.get("foodItem") or cart_entry
            qty = float(cart_entry.get("quantity") or 1.0)
            name = food.get("name", "Unknown Dish")
            food_names.append(name)

            c_gross = float(food.get("carbohydrates_g") or food.get("carbohydrates") or 0.0) * qty
            c_net = float(food.get("netCarbohydrates_g") or max(0.0, c_gross - float(food.get("fiber_g") or 0.0) * qty))
            f_fiber = float(food.get("fiber_g") or food.get("fiber") or 0.0) * qty
            f_prot = float(food.get("protein_g") or food.get("protein") or 0.0) * qty
            f_fat = float(food.get("fat_g") or food.get("fat") or 0.0) * qty
            f_sod = float(food.get("sodium_mg") or food.get("sodium") or 0.0) * qty
            f_pot = float(food.get("potassium_mg") or food.get("potassium") or 0.0) * qty

            gi = float(food.get("glycemicIndex") or 55.0)
            amylose = float(food.get("amyloseRatio") or 0.20)
            rs3 = float(food.get("resistantStarchFactor") or 0.05)

            total_gross_carbs += c_gross
            total_net_carbs += c_net
            total_fiber += f_fiber
            total_protein += f_prot
            total_fat += f_fat
            total_sodium += f_sod
            total_potassium += f_pot

            if c_net > 0:
                weighted_gi_sum += gi * c_net
                weighted_amylose_sum += amylose * c_net
                weighted_rs3_sum += rs3 * c_net
                carb_weight_sum += c_net

            # Collect active botanicals
            botanicals = food.get("activeBotanicals") or []
            for b in botanicals:
                if isinstance(b, dict) and b.get("name") and b.get("name") != "None":
                    active_botanicals.append(b)

            # Check item-level contraindications
            ci_list = food.get("contraindications") or []
            for ci in ci_list:
                if ci not in contraindications_flagged:
                    contraindications_flagged.append(ci)

        avg_gi = int(np.round(weighted_gi_sum / carb_weight_sum)) if carb_weight_sum > 0 else 50
        avg_amylose = float(weighted_amylose_sum / carb_weight_sum) if carb_weight_sum > 0 else 0.20
        avg_rs3 = float(weighted_rs3_sum / carb_weight_sum) if carb_weight_sum > 0 else 0.05

        # 3. Apply Indo-Glycemic Starch Kinetics
        # Amylose retardation blunts alpha-amylase enzymatic cleavage rate
        amylose_retardation = max(0.65, 1.0 - 0.40 * (avg_amylose - 0.15))
        rs3_retardation = max(0.60, 1.0 - 0.55 * avg_rs3)
        effective_simulation_carbs = total_net_carbs * amylose_retardation * rs3_retardation

        # 4. Ayur-Allopathic Cross-Screening
        meds = list(vitals.get("activeMedications") or getattr(twin, "active_medications", []) or [])
        ayur_warnings = []
        is_contraindicated = False

        has_karela = any(b.get("name") == "Karela" for b in active_botanicals)
        has_methi = any(b.get("name") == "Methi" for b in active_botanicals)
        has_giloy = any(b.get("name") == "Giloy" for b in active_botanicals)

        has_sulfonylurea = any(
            any(su in m.lower() for su in ["glimepiride", "gliclazide", "glipizide", "glyburide"])
            for m in meds
        )
        has_insulin = any("insulin" in m.lower() for m in meds)
        has_metformin = any("metformin" in m.lower() for m in meds)
        has_statin = any("statin" in m.lower() or "atorvastatin" in m.lower() or "rosuvastatin" in m.lower() for m in meds)

        if has_karela and (has_sulfonylurea or has_insulin):
            ayur_warnings.append(
                "CRITICAL WARNING: Active Karela (Charantin / Polypeptide-p) compounded with Sulfonylurea / Insulin "
                "substantially accelerates glucose clearance, inducing severe nocturnal hypoglycemia (<50 mg/dL)."
            )
            if order_mode == "VITALS_GUARD":
                is_contraindicated = True

        if has_methi and has_metformin and total_net_carbs < 25:
            ayur_warnings.append(
                "ADVISORY: Fenugreek (Methi 4-hydroxyisoleucine) combined with Metformin may cause acute gastrointestinal "
                "cramping or unexpected rapid glucose drops."
            )

        if has_giloy and has_statin:
            ayur_warnings.append(
                "CLINICAL CAUTION: Concurrent high-dose Giloy (Tinospora cordifolia) and HMG-CoA reductase inhibitor (Statin) "
                "increases risk of subclinical transaminase elevation (Herb-Induced Liver Injury risk)."
            )

        # 5. Run Omni-Twin 7-Compartment ODE Simulation
        omni_result = omni_twin_engine.simulate_omni_dynamics(
            net_carbs=effective_simulation_carbs,
            sodium_mg=total_sodium,
            glycemic_index=avg_gi,
            twin=twin,
            consumed_quantity=1.0,
            fat_grams=total_fat,
            fiber_grams=total_fiber,
            potassium_mg=total_potassium,
            meal_time_hour=meal_time_hour,
            medications=meds,
            food_names=food_names,
            apply_doctor_hacks=False,
            enable_cgm_stream=True
        )

        time_series = omni_result.get("timeSeries", [])
        peak_proj = omni_result.get("peakProjections", {})

        simulated_peak_g = float(peak_proj.get("peakGlucose", 120.0))
        time_to_peak_min = int(peak_proj.get("timeToPeakGlucoseMin", 45))
        simulated_peak_sbp = float(peak_proj.get("peakSystolicBP", 125.0))
        simulated_peak_dbp = float(peak_proj.get("peakDiastolicBP", 82.0))
        delta_g = float(peak_proj.get("glucoseSpike", 25.0))

        # 6. Excursion Categorization
        if simulated_peak_g >= 180.0 or (simulated_peak_sbp - twin.systolic_bp) > 18.0:
            category = "DANGEROUS_SPIKE"
        elif simulated_peak_g >= 140.0 or (simulated_peak_sbp - twin.systolic_bp) > 10.0:
            category = "MILD_ELEVATION"
        else:
            category = "SAFE_STABLE"

        # Calculate Area Under the Curve (AUC) above fasting baseline
        auc = 0.0
        for i in range(1, len(time_series)):
            t_prev = time_series[i - 1]["minute"]
            t_curr = time_series[i]["minute"]
            g_prev = max(0.0, time_series[i - 1]["plasmaGlucose"] - twin.fasting_glucose)
            g_curr = max(0.0, time_series[i]["plasmaGlucose"] - twin.fasting_glucose)
            auc += 0.5 * (g_prev + g_curr) * (t_curr - t_prev)

        # 7. Format Clean Simulation Trajectory for Frontend / API
        clean_trajectory = []
        for pt in time_series:
            clean_trajectory.append({
                "timeMin": pt.get("minute", 0),
                "plasmaGlucose": pt.get("plasmaGlucose", 100.0),
                "interstitialGlucose": pt.get("glucoseLower95", pt.get("plasmaGlucose", 100.0)),
                "systolicBP": pt.get("systolicBP", 120.0),
                "diastolicBP": pt.get("diastolicBP", 80.0),
                "heartRate": pt.get("heartRate", 72.0)
            })

        # 8. SKELETAL MUSCLE GLUCOSE UPTAKE & AMBULATION PLAN (The Bio-Hack Shield)
        # Distribution volume V_d in dL (approx 120 dL for standard 70kg adult)
        v_d_dl = 120.0 * (twin.bmi / 23.0)
        excess_mg_dl = max(0.0, simulated_peak_g - 140.0)

        # Total excess glucose mass trapped in extracellular pool (grams):
        # excess_mg = excess_mg_dl * V_d_dL -> converted to grams (/1000)
        excess_glucose_pool_grams = (excess_mg_dl * v_d_dl) / 1000.0

        # Skeletal muscle GLUT4 glucose uptake rate at brisk walking pace (4.5 km/h)
        # is approximately 0.40 grams glucose per minute in insulin-independent state
        burn_rate_g_per_min = 0.38
        if excess_glucose_pool_grams > 0:
            required_walk_min = int(np.round((excess_glucose_pool_grams / burn_rate_g_per_min) * 1.35))
            required_walk_min = max(10, min(50, required_walk_min))
        else:
            required_walk_min = 0

        target_steps = int(required_walk_min * 110)  # ~110 steps/min at brisk pace
        walk_start_time_min = max(15, time_to_peak_min - 20)

        # Pre-Bite Food Sequencing
        pre_bite_sequencing = [
            {
                "stepNumber": 1,
                "phase": "Fiber_Salad_First",
                "instructions": "Eat raw salad / raita / fibrous greens for 5 minutes. Soluble fiber creates an intestinal gel matrix blunting amylase cleavage.",
                "durationMin": 5
            },
            {
                "stepNumber": 2,
                "phase": "Protein_Fat_Second",
                "instructions": "Consume dal / paneer / chicken next. Lipids stimulate duodenal cholecystokinin (CCK) and GLP-1, slowing gastric emptying.",
                "durationMin": 5
            },
            {
                "stepNumber": 3,
                "phase": "Starch_Carb_Last",
                "instructions": "Eat Biryani rice, rotis, or potatoes last. Digestion will occur at a suppressed, stable rate.",
                "durationMin": 15
            }
        ]

        # Acetic Acid (Vinegar) Preload
        vinegar_preload = bool(delta_g > 35.0 or simulated_peak_g > 155.0)

        # Insulin Split-Bolus Advice for T1D / Insulin Users
        split_bolus_advice = "Standard pre-meal dosing."
        if total_fat >= 28.0 and total_net_carbs >= 45.0:
            split_bolus_advice = (
                "Dual-Wave Bolus Recommended: High lipid content will induce a biphasic delayed glucose spike (T+120m). "
                "Consult physician for a 60% upfront / 40% extended 2.5-hour split bolus."
            )

        mitigation_plan = {
            "requiredAmbulationMinutes": required_walk_min,
            "targetStepsToBurnExcursion": target_steps,
            "recommendedWalkStartTimeMin": walk_start_time_min,
            "preBiteSequencing": pre_bite_sequencing,
            "vinegarPreloadRecommended": vinegar_preload,
            "insulinSplitBolusAdvice": split_bolus_advice
        }

        # Guard approval condition
        is_guard_approved = (
            simulated_peak_g <= 140.0
            and (simulated_peak_sbp - twin.systolic_bp) <= 12.0
            and not is_contraindicated
        )

        return {
            "success": True,
            "orderMode": order_mode,
            "isGuardApproved": is_guard_approved,
            "isContraindicated": is_contraindicated,
            "ayurPharmaWarnings": ayur_warnings,
            "macronutrientTotals": {
                "grossCarbohydrates_g": float(np.round(total_gross_carbs, 1)),
                "netCarbohydrates_g": float(np.round(total_net_carbs, 1)),
                "effectiveSimulationCarbs_g": float(np.round(effective_simulation_carbs, 1)),
                "protein_g": float(np.round(total_protein, 1)),
                "fat_g": float(np.round(total_fat, 1)),
                "fiber_g": float(np.round(total_fiber, 1)),
                "sodium_mg": float(np.round(total_sodium, 1)),
                "potassium_mg": float(np.round(total_potassium, 1)),
                "weightedGI": avg_gi,
                "weightedAmyloseRatio": float(np.round(avg_amylose, 3)),
                "weightedResistantStarchFactor": float(np.round(avg_rs3, 3))
            },
            "forecast": {
                "simulatedPeakGlucose": simulated_peak_g,
                "timeToPeakMin": time_to_peak_min,
                "projectedAUC": float(np.round(auc, 1)),
                "simulatedSystolicPeak": simulated_peak_sbp,
                "simulatedDiastolicPeak": simulated_peak_dbp,
                "glycemicExcursionCategory": category,
                "simulationTrajectory": clean_trajectory
            },
            "mitigationPlan": mitigation_plan
        }

    @classmethod
    def calculate_ambulation_plan(
        cls,
        simulated_peak_glucose: float,
        target_ceiling_glucose: float = 140.0,
        bmi: float = 24.5,
        time_to_peak_min: int = 45
    ) -> Dict[str, Any]:
        """
        Calculates exact ambulation duration and step quota to neutralize any arbitrary glycemic spike.
        """
        excess_mg_dl = max(0.0, simulated_peak_glucose - target_ceiling_glucose)
        v_d_dl = 120.0 * (bmi / 23.0)
        excess_grams = (excess_mg_dl * v_d_dl) / 1000.0

        burn_rate = 0.38  # grams/min
        if excess_grams > 0:
            minutes = int(np.round((excess_grams / burn_rate) * 1.35))
            minutes = max(10, min(60, minutes))
        else:
            minutes = 0

        target_steps = int(minutes * 110)
        start_min = max(15, time_to_peak_min - 20)

        return {
            "excessGlucoseGrams": float(np.round(excess_grams, 2)),
            "requiredAmbulationMinutes": minutes,
            "targetSteps": target_steps,
            "walkingSpeedKmh": 4.5,
            "recommendedStartTimeMin": start_min,
            "mechanism": "Insulin-Independent GLUT-4 Translocation via Skeletal Muscle AMPK Activation"
        }


food_simulation_engine = FoodSimulationEngine()

