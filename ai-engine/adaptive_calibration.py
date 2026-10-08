"""
BioSync AI - Weekly Adaptive Extended Kalman Filter (EKF) Calibration Engine
Module: adaptive_calibration.py

Recursively calibrates the confined Personal Metabolic Digital Twin (M_user)
upon ingestion of new weekly blood lab tests or clinical assessment results.

Mathematical Formulation:
State Vector: theta = [beta_carb, beta_sodium, S_I]^T
Measurement Vector: z_k = [G_0, HbA1c, BP_sys]^T

Updates:
- Project prior: theta_k^- = theta_{k-1}, P_k^- = P_{k-1} + Q
- Innovation: y_k = z_k - h(theta_k^-)
- Kalman Gain: K_k = P_k^- * H_k^T * (H_k * P_k^- * H_k^T + R)^-1
- State Posterior: theta_k = theta_k^- + K_k * y_k
- Covariance Posterior: P_k = (I - K_k * H_k) * P_k^-

Features:
- Completely offline and patient-confined: zero generic cloud LLMs.
- Generates transparent, human-readable clinical adaptation reports.
"""

from typing import Dict, Any, List, Optional, Tuple
import numpy as np

from metabolic_twin import MetabolicDigitalTwin


class ExtendedKalmanCalibrationEngine:
    """
    Recursive Bayesian / Extended Kalman Filter engine that updates
    individual metabolic sensitivities whenever new lab test results arrive.
    """

    def __init__(self):
        # Process noise covariance Q (represents 1-2 week biological metabolic drift)
        self.Q = np.diag([
            (0.008) ** 2,    # var(beta_carb drift)
            (0.0008) ** 2,   # var(beta_sodium drift)
            (0.015) ** 2     # var(S_I drift)
        ])

        # Measurement noise covariance R (clinical lab analyzer variances)
        self.R = np.diag([
            (4.0) ** 2,      # Fasting glucose lab variance (mg/dL)^2
            (0.12) ** 2,     # HbA1c lab variance (%)^2
            (3.5) ** 2       # Systolic BP clinical variance (mmHg)^2
        ])

        # Default prior uncertainty P_0
        self.P_default = np.diag([
            (0.03) ** 2,
            (0.002) ** 2,
            (0.06) ** 2
        ])

    def calibrate(
        self,
        current_twin: MetabolicDigitalTwin,
        new_vitals: Dict[str, Any],
        weekly_meal_stats: Optional[Dict[str, float]] = None,
        prior_covariance: Optional[List[List[float]]] = None
    ) -> Dict[str, Any]:
        """
        Executes EKF recursive update using new lab test biomarkers.
        """
        # 1. Extract Prior State: theta = [beta_carb, beta_sodium, S_I]^T
        theta_prior = np.array([
            current_twin.beta_carb,
            current_twin.beta_sodium,
            current_twin.insulin_sensitivity_index
        ], dtype=float)

        P_prior = (
            np.array(prior_covariance, dtype=float)
            if prior_covariance and len(prior_covariance) == 3
            else self.P_default.copy()
        )

        # Time update (Predict step)
        P_pred = P_prior + self.Q
        theta_pred = theta_prior.copy()

        # 2. Extract New Measurement Vector: z = [G_0, HbA1c, BP_sys]^T
        new_g0 = float(new_vitals.get("fastingGlucose", new_vitals.get("glucoseFasting", current_twin.fasting_glucose)))
        new_a1c = float(new_vitals.get("hba1c", current_twin.hba1c))
        new_bp = float(new_vitals.get("systolicBP", new_vitals.get("systolic", current_twin.systolic_bp)))
        z_k = np.array([new_g0, new_a1c, new_bp], dtype=float)

        # 3. Weekly Meal Context (Averages from FoodLog)
        stats = weekly_meal_stats or {}
        avg_daily_carbs = float(stats.get("avgDailyCarbs", 160.0))    # grams
        avg_daily_sodium = float(stats.get("avgDailySodium", 2100.0))  # mg

        # 4. Observation Model h(theta_pred)
        # Expected G_0 based on current sensitivity S_I
        h_g0 = 80.0 + (18.0 / max(0.2, theta_pred[2]))
        # Expected HbA1c based on daily carbs and beta_carb
        est_avg_glucose = h_g0 + (theta_pred[0] * (avg_daily_carbs / 3.0))
        h_a1c = (est_avg_glucose + 46.7) / 28.7
        # Expected Systolic BP based on daily sodium and beta_sodium
        h_bp = 112.0 + (theta_pred[1] * (avg_daily_sodium / 2.0))

        h_pred = np.array([h_g0, h_a1c, h_bp], dtype=float)

        # 5. Jacobian Matrix H = dh / dtheta evaluated at theta_pred
        # H is 3x3:
        # Row 1: [d(G0)/d(b_carb), d(G0)/d(b_sod), d(G0)/d(S_I)]
        # Row 2: [d(A1c)/d(b_carb), d(A1c)/d(b_sod), d(A1c)/d(S_I)]
        # Row 3: [d(BP)/d(b_carb), d(BP)/d(b_sod), d(BP)/d(S_I)]
        H = np.zeros((3, 3), dtype=float)

        # Row 1 (G0)
        H[0, 0] = 0.0
        H[0, 1] = 0.0
        H[0, 2] = -18.0 / (max(0.2, theta_pred[2]) ** 2)

        # Row 2 (HbA1c)
        H[1, 0] = (avg_daily_carbs / 3.0) / 28.7
        H[1, 1] = 0.0
        H[1, 2] = H[0, 2] / 28.7

        # Row 3 (Systolic BP)
        H[2, 0] = 0.0
        H[2, 1] = avg_daily_sodium / 2.0
        H[2, 2] = 0.0

        # 6. Kalman Measurement Update
        # Innovation residual
        y_k = z_k - h_pred

        # Innovation covariance
        S_k = H @ P_pred @ H.T + self.R

        # Optimal Kalman Gain K_k = P_pred * H^T * inv(S_k)
        K_k = P_pred @ H.T @ np.linalg.inv(S_k)

        # Posterior state estimate
        theta_post = theta_pred + (K_k @ y_k)

        # Posterior error covariance (Joseph form for numerical stability)
        I_mat = np.eye(3)
        I_KH = I_mat - (K_k @ H)
        P_post = (I_KH @ P_pred @ I_KH.T) + (K_k @ self.R @ K_k.T)

        # 7. Physiological Guardrails & Clipping
        calibrated_beta_carb = float(np.clip(theta_post[0], 0.15, 0.75))
        calibrated_beta_sodium = float(np.clip(theta_post[1], 0.004, 0.020))
        calibrated_si = float(np.clip(theta_post[2], 0.20, 1.20))

        # 8. Shift Statistics
        delta_beta_carb = float(np.round(((calibrated_beta_carb - theta_prior[0]) / theta_prior[0]) * 100.0, 1))
        delta_beta_sodium = float(np.round(((calibrated_beta_sodium - theta_prior[1]) / theta_prior[1]) * 100.0, 1))
        delta_si = float(np.round(((calibrated_si - theta_prior[2]) / theta_prior[2]) * 100.0, 1))

        # 9. Instantiate Calibrated Digital Twin
        calibrated_twin = MetabolicDigitalTwin(
            user_id=current_twin.user_id,
            fasting_glucose=new_g0,
            hba1c=new_a1c,
            systolic_bp=new_bp,
            diastolic_bp=float(new_vitals.get("diastolicBP", new_vitals.get("diastolic", current_twin.diastolic_bp))),
            total_cholesterol=float(new_vitals.get("totalCholesterol", current_twin.total_cholesterol)),
            hdl=float(new_vitals.get("hdl", current_twin.hdl)),
            ldl=float(new_vitals.get("ldl", current_twin.ldl)),
            triglycerides=float(new_vitals.get("triglycerides", current_twin.triglycerides)),
            bmi=float(new_vitals.get("bmi", current_twin.bmi))
        )
        # Apply EKF posterior values directly
        calibrated_twin.beta_carb = float(np.round(calibrated_beta_carb, 3))
        calibrated_twin.beta_sodium = float(np.round(calibrated_beta_sodium, 4))
        calibrated_twin.insulin_sensitivity_index = float(np.round(calibrated_si, 3))

        # 10. Generate Clinical Adaptation Report
        report = self._generate_adaptation_report(
            delta_si=delta_si,
            delta_carb=delta_beta_carb,
            delta_sodium=delta_beta_sodium,
            old_g0=current_twin.fasting_glucose,
            new_g0=new_g0,
            old_a1c=current_twin.hba1c,
            new_a1c=new_a1c,
            old_bp=current_twin.systolic_bp,
            new_bp=new_bp
        )

        return {
            "success": True,
            "calibrationTimestamp": "weekly_test_sync",
            "previousParameters": {
                "betaCarb": float(np.round(theta_prior[0], 3)),
                "betaSodium": float(np.round(theta_prior[1], 4)),
                "insulinSensitivity": float(np.round(theta_prior[2], 3)),
            },
            "calibratedParameters": {
                "betaCarb": calibrated_twin.beta_carb,
                "betaSodium": calibrated_twin.beta_sodium,
                "insulinSensitivity": calibrated_twin.insulin_sensitivity_index,
            },
            "parameterShiftsPercent": {
                "betaCarbShift": delta_beta_carb,
                "betaSodiumShift": delta_beta_sodium,
                "insulinSensitivityShift": delta_si,
            },
            "updatedPhenotype": calibrated_twin.get_clinical_phenotype(),
            "covarianceMatrix": P_post.tolist(),
            "clinicalAdaptationReport": report
        }

    def _generate_adaptation_report(
        self,
        delta_si: float,
        delta_carb: float,
        delta_sodium: float,
        old_g0: float,
        new_g0: float,
        old_a1c: float,
        new_a1c: float,
        old_bp: float,
        new_bp: float
    ) -> Dict[str, Any]:
        """Generates clear, motivating clinical insights on how the AI adapted."""
        insights = []

        # Insulin sensitivity trend
        if delta_si > 2.0:
            insights.append(
                f"Insulin sensitivity improved by +{delta_si}%! Your cells are utilizing glucose more efficiently, "
                f"so your digital twin has softened expected postprandial glycemic spikes."
            )
        elif delta_si < -2.0:
            insights.append(
                f"Subtle insulin resistance increase ({delta_si}%). Your digital twin has heightened its glycemic guardrails "
                f"and will prioritize prebiotic fiber sequencing hacks to protect your glucose stability."
            )
        else:
            insights.append("Insulin sensitivity remained remarkably steady week-over-week.")

        # Blood pressure / sodium trend
        if delta_sodium < -2.0:
            insights.append(
                f"Vascular salt reactivity decreased by {abs(delta_sodium)}%! Your arteries demonstrate improved elasticity."
            )
        elif delta_sodium > 2.0:
            insights.append(
                f"Vascular salt sensitivity registered an upward shift (+{delta_sodium}%). Your digital twin will emphasize potassium counter-measures."
            )

        summary = (
            f"Weekly test calibration complete. Fasting Glucose: {int(old_g0)} -> {int(new_g0)} mg/dL; "
            f"HbA1c: {old_a1c:.1f}% -> {new_a1c:.1f}%; Systolic BP: {int(old_bp)} -> {int(new_bp)} mmHg. "
            f"Your personal AI metabolic vector has been recalibrated for precision tracking."
        )

        return {
            "summary": summary,
            "insights": insights,
            "status": "CALIBRATED_ACTIVE"
        }


# Global singleton instance
kalman_engine = ExtendedKalmanCalibrationEngine()
