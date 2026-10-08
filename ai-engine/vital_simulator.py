"""
BioSync AI - Dynamic Postprandial Vital Surge Simulator
Module: vital_simulator.py

Simulates continuous 180-minute postprandial vital dynamics using:
1. Bergman Minimal Model ODE System (Runge-Kutta 4th Order numerical solver)
   - dG/dt = -p1*(G(t) - Gb) - X(t)*G(t) + Ra(t)/Vg
   - dX/dt = -p2*X(t) + p3*(I(t) - Ib)
   - dI/dt = -n*(I(t) - Ib) + gamma*max(0, G(t) - h)
2. Windkessel Hemodynamic BP Transient Model
   - BP_sys(t) = BP0 + Delta_BP_max * (t/tau_bp) * exp(1 - t/tau_bp)
3. "With Doctor Hacks" vs "Standard" Comparative Trajectory Simulation

Outputs:
- Discrete 15-minute resolution trajectory vectors over 180 minutes.
- Peak vital surge values (G_peak, BP_peak, t_peak).
- Clinical postprandial safety advisories.
"""

from typing import Dict, Any, List, Optional
import numpy as np

from metabolic_twin import MetabolicDigitalTwin


class VitalSurgeSimulator:
    """
    Physiological ODE simulator executing personalized numerical integrations
    of postprandial glucose and blood pressure curves.
    """

    @classmethod
    def simulate_meal_surge(
        cls,
        net_carbs: float,
        sodium_mg: float,
        glycemic_index: int = 50,
        twin: Optional[MetabolicDigitalTwin] = None,
        consumed_quantity: float = 1.0,
        apply_doctor_hacks: bool = False
    ) -> Dict[str, Any]:
        """
        Executes RK4 integration of the Bergman Minimal Model and Windkessel BP dynamics.
        """
        if twin is None:
            twin = MetabolicDigitalTwin()

        # Scale inputs by portion quantity
        q = max(0.05, float(consumed_quantity))
        effective_carbs = max(0.0, float(net_carbs) * q)
        effective_sodium = max(0.0, float(sodium_mg) * q)
        gi = max(10, min(100, int(glycemic_index)))

        # Patient baseline parameters
        G_b = twin.fasting_glucose
        BP_b = twin.systolic_bp
        S_I = twin.insulin_sensitivity_index  # 0.2 (severe resistance) to 1.2 (high sensitivity)

        # -------------------------------------------------------------------
        # 1. PARAMETER CALIBRATION (BERGMAN MINIMAL MODEL)
        # -------------------------------------------------------------------
        p1 = 0.028                        # Glucose effectiveness (1/min)
        p2 = 0.025                        # Insulin action disappearance rate (1/min)
        p3 = 0.000013 * S_I               # Insulin action sensitivity factor
        I_b = 10.0                        # Basal plasma insulin (uU/mL)
        n = 0.22                          # Insulin clearance rate (1/min)
        gamma = 0.008                     # Pancreatic responsiveness ((uU/mL)/(mg/dL*min))
        h = max(80.0, G_b - 5.0)          # Threshold glucose for pancreatic insulin release
        V_g = 125.0 * (twin.bmi / 23.0)   # Distribution volume (dL)

        # Gastric absorption rate R_a(t) parameters:
        # High GI -> fast sharp absorption (tau ~ 32 min)
        # Low GI -> delayed smooth absorption (tau ~ 55 min)
        base_tau = float(np.interp(gi, [15, 85], [55.0, 32.0]))

        if apply_doctor_hacks:
            # Doctor hacks (fibers first, protein pairing, 10 min stroll)
            # Increase gastric half-life by 20 mins and reduce net glucose bio-accessibility
            tau_abs = base_tau + 18.0
            bioavailability = 0.68  # 32% spike attenuation
        else:
            tau_abs = base_tau
            bioavailability = 0.88

        total_glucose_mg = effective_carbs * 1000.0 * bioavailability

        def R_a(t_min: float) -> float:
            """Rate of appearance of glucose in plasma (mg/min)."""
            if total_glucose_mg <= 0:
                return 0.0
            return (total_glucose_mg / (tau_abs ** 2)) * t_min * np.exp(-t_min / tau_abs)

        # -------------------------------------------------------------------
        # 2. RUNGE-KUTTA 4TH ORDER (RK4) NUMERICAL INTEGRATION
        # -------------------------------------------------------------------
        dt = 0.5           # Step size: 0.5 minutes
        t_max = 180.0      # Total duration: 3 hours
        steps = int(t_max / dt)

        # Initial state vector: [G, X, I]
        G = G_b
        X = 0.0
        I = I_b

        def derivatives(g_val: float, x_val: float, i_val: float, t_val: float):
            ra = R_a(t_val)
            dG = -p1 * (g_val - G_b) - (x_val * g_val) + (ra / V_g)
            dX = -p2 * x_val + p3 * (i_val - I_b)
            dI = -n * (i_val - I_b) + gamma * max(0.0, g_val - h)
            return dG, dX, dI

        # Sample at 15-minute intervals
        sample_interval = 15.0
        trajectory = []

        # Record t = 0
        trajectory.append({
            "minute": 0,
            "glucose": float(np.round(G, 1)),
            "systolicBP": float(np.round(BP_b, 1)),
            "insulinAction": float(np.round(X * 1000, 2))
        })

        next_sample = sample_interval

        # Windkessel BP parameters
        tau_bp = 50.0  # BP surge peak around 50 mins
        delta_bp_max = effective_sodium * twin.beta_sodium
        if apply_doctor_hacks:
            delta_bp_max *= 0.70  # Hydration & potassium counter-balance blunts peak BP

        for step in range(1, steps + 1):
            t = step * dt

            # RK4 Integration steps
            k1_g, k1_x, k1_i = derivatives(G, X, I, t)
            k2_g, k2_x, k2_i = derivatives(G + 0.5 * dt * k1_g, X + 0.5 * dt * k1_x, I + 0.5 * dt * k1_i, t + 0.5 * dt)
            k3_g, k3_x, k3_i = derivatives(G + 0.5 * dt * k2_g, X + 0.5 * dt * k2_x, I + 0.5 * dt * k2_i, t + 0.5 * dt)
            k4_g, k4_x, k4_i = derivatives(G + dt * k3_g, X + dt * k3_x, I + dt * k3_i, t + dt)

            G += (dt / 6.0) * (k1_g + 2 * k2_g + 2 * k3_g + k4_g)
            X += (dt / 6.0) * (k1_x + 2 * k2_x + 2 * k3_x + k4_x)
            I += (dt / 6.0) * (k1_i + 2 * k2_i + 2 * k3_i + k4_i)

            # Prevent unphysiological negative values
            G = max(45.0, G)
            X = max(0.0, X)
            I = max(2.0, I)

            # Sample trajectory
            if abs(t - next_sample) < (dt / 2.0) or t >= t_max:
                # Calculate instantaneous blood pressure
                bp_surge = (
                    delta_bp_max * (t / tau_bp) * np.exp(1.0 - (t / tau_bp))
                    if delta_bp_max > 0 else 0.0
                )
                cur_bp = float(np.round(BP_b + bp_surge, 1))

                trajectory.append({
                    "minute": int(np.round(t)),
                    "glucose": float(np.round(G, 1)),
                    "systolicBP": cur_bp,
                    "insulinAction": float(np.round(X * 1000, 2))
                })
                next_sample += sample_interval

        # -------------------------------------------------------------------
        # 3. PEAK & CLINICAL METRICS RESOLUTION
        # -------------------------------------------------------------------
        glucose_values = [pt["glucose"] for pt in trajectory]
        bp_values = [pt["systolicBP"] for pt in trajectory]

        peak_glucose = float(np.round(max(glucose_values), 1))
        peak_idx = glucose_values.index(peak_glucose)
        time_to_peak_min = trajectory[peak_idx]["minute"]
        glucose_spike = float(np.round(peak_glucose - G_b, 1))

        peak_bp = float(np.round(max(bp_values), 1))
        bp_spike = float(np.round(peak_bp - BP_b, 1))

        # Clinical status assessment
        if peak_glucose >= 180:
            clinical_status = "Diabetic Hyperglycemic Range (>=180 mg/dL)"
            advisory = "Caution: Substantial postprandial glucose surge. Take a 15-minute walk and stay hydrated to accelerate clearance."
        elif peak_glucose >= 140:
            clinical_status = "Pre-Diabetic Impaired Tolerance (140 - 179 mg/dL)"
            advisory = "Moderate glycemic surge. Fiber sequencing and post-meal pacing are clinically proven to flatten this peak."
        else:
            clinical_status = "Optimal Euglycemic Recovery (<140 mg/dL)"
            advisory = "Excellent postprandial curve. Your insulin sensitivity and meal composition maintain metabolic harmony."

        return {
            "baselineVitals": {
                "fastingGlucose": float(np.round(G_b, 1)),
                "systolicBP": float(np.round(BP_b, 1)),
            },
            "peakProjections": {
                "peakGlucose": peak_glucose,
                "timeToPeakGlucoseMin": time_to_peak_min,
                "glucoseSpike": glucose_spike,
                "peakSystolicBP": peak_bp,
                "bpSpikeSystolic": bp_spike,
            },
            "clinicalStatus": clinical_status,
            "clinicalAdvisory": advisory,
            "timeSeries": trajectory
        }

    @classmethod
    def simulate_comparison(
        cls,
        net_carbs: float,
        sodium_mg: float,
        glycemic_index: int = 50,
        twin: Optional[MetabolicDigitalTwin] = None,
        consumed_quantity: float = 1.0
    ) -> Dict[str, Any]:
        """
        Produces side-by-side simulation: Standard Intake vs. With Doctor Hacks.
        Demonstrates tangible harm reduction benefits to the patient.
        """
        standard = cls.simulate_meal_surge(
            net_carbs=net_carbs,
            sodium_mg=sodium_mg,
            glycemic_index=glycemic_index,
            twin=twin,
            consumed_quantity=consumed_quantity,
            apply_doctor_hacks=False
        )

        with_hacks = cls.simulate_meal_surge(
            net_carbs=net_carbs,
            sodium_mg=sodium_mg,
            glycemic_index=glycemic_index,
            twin=twin,
            consumed_quantity=consumed_quantity,
            apply_doctor_hacks=True
        )

        glucose_reduction = float(np.round(
            standard["peakProjections"]["glucoseSpike"] - with_hacks["peakProjections"]["glucoseSpike"], 1
        ))
        percent_reduction = float(np.round(
            (glucose_reduction / max(1.0, standard["peakProjections"]["glucoseSpike"])) * 100.0, 1
        ))

        return {
            "standardIntake": standard,
            "withDoctorHacks": with_hacks,
            "harmReductionBenefit": {
                "glucoseSpikeReducedBy": glucose_reduction,
                "percentSpikeReduction": percent_reduction,
                "summary": f"Applying doctor hacks reduces your peak glucose surge by {percent_reduction}% (-{glucose_reduction} mg/dL)!"
            }
        }


# Global singleton instance
vital_simulator = VitalSurgeSimulator()
