"""
BioSync AI - Personal Metabolic Digital Twin Engine
Module: metabolic_twin.py

Represents the patient-confined metabolic state vector:
M_user = [G_0, HbA1c, BP_sys, BP_dia, TC, HDL, LDL, TG, eGFR, S_I, BMI]

Features:
- Encapsulates baseline homeostasis and organ-specific risk stratification.
- Computes individualized metabolic surge susceptibilities (beta_carb, beta_sodium).
- Strictly patient-confined: zero shared cloud weights or external LLM APIs.
"""

from typing import Dict, Any, Optional
import numpy as np


class MetabolicDigitalTwin:
    """
    Confined mathematical model representing an individual user's
    biochemical phenotype, insulin sensitivity, and vascular reactivity.
    """

    def __init__(
        self,
        user_id: Optional[str] = None,
        fasting_glucose: float = 92.0,      # mg/dL
        hba1c: float = 5.4,                 # %
        systolic_bp: float = 120.0,         # mmHg
        diastolic_bp: float = 80.0,         # mmHg
        total_cholesterol: float = 180.0,   # mg/dL
        hdl: float = 50.0,                  # mg/dL
        ldl: float = 100.0,                 # mg/dL
        triglycerides: float = 120.0,       # mg/dL
        egfr: float = 95.0,                 # mL/min/1.73m2
        bmi: float = 23.5,                  # kg/m2
        age: int = 35,
        gender: str = "Unspecified",
    ):
        self.user_id = user_id or "anonymous_twin"
        self.fasting_glucose = max(50.0, float(fasting_glucose))
        self.hba1c = max(3.5, float(hba1c))
        self.systolic_bp = max(70.0, float(systolic_bp))
        self.diastolic_bp = max(40.0, float(diastolic_bp))
        self.total_cholesterol = max(80.0, float(total_cholesterol))
        self.hdl = max(15.0, float(hdl))
        self.ldl = max(30.0, float(ldl))
        self.triglycerides = max(30.0, float(triglycerides))
        self.egfr = max(15.0, float(egfr))
        self.bmi = max(14.0, float(bmi))
        self.age = int(age)
        self.gender = gender

        # Adaptive individual coefficients (calibrated by Kalman filter in Phase 5)
        self.insulin_sensitivity_index = self._compute_insulin_sensitivity()
        self.beta_carb = self._compute_base_carb_surge_multiplier()
        self.beta_sodium = self._compute_base_sodium_surge_multiplier()

    @classmethod
    def from_vitals_dict(cls, vitals: Dict[str, Any], user_id: Optional[str] = None) -> "MetabolicDigitalTwin":
        """Instantiates digital twin directly from MongoDB Vitals document or request payload."""
        if not vitals:
            return cls(user_id=user_id)

        metabolic = vitals.get("metabolicHealth", {})
        cardio = vitals.get("cardiovascularRisk", {})
        body = vitals.get("bodyMetrics", {})
        renal = vitals.get("renalFunction", {})

        # Support both nested MongoDB format and flat request dictionary
        fg = metabolic.get("glucoseFasting", vitals.get("fastingGlucose", vitals.get("glucoseFasting", 92.0)))
        a1c = metabolic.get("hba1c", vitals.get("hba1c", 5.4))
        sys_bp = cardio.get("systolic", vitals.get("systolicBP", vitals.get("systolic", 120.0)))
        dia_bp = cardio.get("diastolic", vitals.get("diastolicBP", vitals.get("diastolic", 80.0)))
        tc = cardio.get("totalCholesterol", vitals.get("totalCholesterol", 180.0))
        hdl = cardio.get("hdlCholesterol", vitals.get("hdl", 50.0))
        ldl = cardio.get("ldlCholesterol", vitals.get("ldl", 100.0))
        tg = cardio.get("triglycerides", vitals.get("triglycerides", 120.0))
        egfr = renal.get("egfr", vitals.get("egfr", 95.0))
        bmi = body.get("bmi", vitals.get("bmi", 23.5))

        return cls(
            user_id=user_id or vitals.get("user"),
            fasting_glucose=fg or 92.0,
            hba1c=a1c or 5.4,
            systolic_bp=sys_bp or 120.0,
            diastolic_bp=dia_bp or 80.0,
            total_cholesterol=tc or 180.0,
            hdl=hdl or 50.0,
            ldl=ldl or 100.0,
            triglycerides=tg or 120.0,
            egfr=egfr or 95.0,
            bmi=bmi or 23.5,
        )

    def _compute_insulin_sensitivity(self) -> float:
        """
        Estimates Quicki / Insulin Sensitivity Index S_I (0.0 to 1.0)
        derived from Fasting Glucose, HbA1c, and BMI.
        """
        # Lower index indicates higher insulin resistance
        glucose_norm = self.fasting_glucose / 90.0
        hba1c_norm = self.hba1c / 5.2
        bmi_penalty = max(1.0, self.bmi / 22.0)

        resistance_factor = (0.5 * glucose_norm) + (0.3 * hba1c_norm) + (0.2 * bmi_penalty)
        sensitivity = float(np.clip(1.0 / resistance_factor, 0.2, 1.2))
        return float(np.round(sensitivity, 3))

    def _compute_base_carb_surge_multiplier(self) -> float:
        """
        Calculates beta_carb (mg/dL glucose surge per gram of net carbs).
        Normal insulin sensitivity = ~0.22 mg/dL per g carb.
        Severe insulin resistance / diabetes = ~0.45 - 0.65 mg/dL per g carb.
        """
        if self.fasting_glucose >= 126 or self.hba1c >= 6.5:
            # Diabetic phenotype
            base_multiplier = 0.48
        elif self.fasting_glucose >= 100 or self.hba1c >= 5.7:
            # Pre-diabetic phenotype
            base_multiplier = 0.35
        else:
            # Optimal / normal phenotype
            base_multiplier = 0.22

        # Modulate by insulin sensitivity index
        adjusted_multiplier = base_multiplier / max(0.4, self.insulin_sensitivity_index)
        return float(np.round(np.clip(adjusted_multiplier, 0.15, 0.75), 3))

    def _compute_base_sodium_surge_multiplier(self) -> float:
        """
        Calculates beta_sodium (mmHg systolic BP surge per mg of sodium).
        Hypertensive and salt-sensitive profiles experience greater arterial stiffness.
        """
        if self.systolic_bp >= 140 or self.diastolic_bp >= 90:
            return 0.012  # High salt sensitivity
        elif self.systolic_bp >= 130 or self.diastolic_bp >= 85:
            return 0.009  # Pre-hypertensive
        else:
            return 0.006  # Normotensive

    def get_clinical_phenotype(self) -> Dict[str, Any]:
        """
        Classifies metabolic sub-phenotypes across endocrine, cardiovascular, and renal axes.
        """
        is_diabetic = self.fasting_glucose >= 126 or self.hba1c >= 6.5
        is_prediabetic = (100 <= self.fasting_glucose < 126) or (5.7 <= self.hba1c < 6.5)
        is_hypertensive = self.systolic_bp >= 130 or self.diastolic_bp >= 85
        is_dyslipidemic = self.ldl >= 130 or self.triglycerides >= 150 or self.hdl < 40

        # Phenotype determination
        phenotypes = []
        if is_diabetic:
            phenotypes.append("Diabetic Phenotype (Impaired Glucose Tolerance)")
        elif is_prediabetic:
            phenotypes.append("Pre-Diabetic Phenotype (Insulin Resistance)")
        else:
            phenotypes.append("Normoglycemic Baseline")

        if is_hypertensive:
            phenotypes.append("Vascular Sensitivity / Elevated Arterial Load")

        if is_dyslipidemic:
            phenotypes.append("Atherogenic Lipid Vulnerability")

        risk_level = "High" if (is_diabetic or (is_hypertensive and is_dyslipidemic)) else (
            "Moderate" if (is_prediabetic or is_hypertensive or is_dyslipidemic) else "Optimal"
        )

        return {
            "primaryPhenotype": phenotypes[0],
            "allPhenotypes": phenotypes,
            "overallRiskLevel": risk_level,
            "isInsulinResistant": is_diabetic or is_prediabetic,
            "isSaltSensitive": is_hypertensive,
            "isLipidVulnerable": is_dyslipidemic,
            "insulinSensitivityIndex": self.insulin_sensitivity_index,
            "betaCarb": self.beta_carb,
            "betaSodium": self.beta_sodium,
            "keyBiomarkers": {
                "fastingGlucose": self.fasting_glucose,
                "hba1c": self.hba1c,
                "bloodPressure": f"{int(self.systolic_bp)}/{int(self.diastolic_bp)} mmHg",
                "cholesterol": f"{int(self.total_cholesterol)} mg/dL",
                "triglycerides": f"{int(self.triglycerides)} mg/dL",
                "bmi": self.bmi,
            }
        }

    def predict_food_impact(self, net_carbs: float, sodium_mg: float, glycemic_index: int = 50) -> Dict[str, float]:
        """
        Fast forward simulation of postprandial vital surge before dynamic Bergman ODE.
        Accounts for glycemic index moderation.
        """
        # GI weighting factor: high GI foods accelerate surge
        gi_weight = max(0.5, glycemic_index / 55.0)
        predicted_glucose_spike = float(np.round(net_carbs * self.beta_carb * gi_weight, 1))
        predicted_bp_spike = float(np.round(sodium_mg * self.beta_sodium, 1))

        return {
            "predictedGlucoseSpike": predicted_glucose_spike,
            "predictedSystolicBPSpike": predicted_bp_spike,
        }
