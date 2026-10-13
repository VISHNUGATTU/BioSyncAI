"""
BioSync AI - Continuous Glucose Monitor (CGM) Signal Simulation & AGP Analytics
Module: cgm_analytics.py

Implements clinical Ambulatory Glucose Profile (AGP) and advanced glycemic
variability metrics compliant with the International Consensus on Time in Range (ATTD):
1. Subcutaneous Interstitial Glucose Diffusion Lag ODE:
   dG_cgm/dt = (G_plasma(t) - G_cgm(t)) / tau_lag  (tau_lag ~ 8-12 min)
2. Synthetic High-Resolution (1-min and 5-min) Sensor Waveform Generation
   with electrochemical sensor impedance noise & physiological AR(1) drift.
3. Consensus AGP Metrics:
   - TIR (Time in Range: 70 - 140 mg/dL for non-diabetic/optimal, 70-180 mg/dL standard)
   - Tight TIR (70 - 120 mg/dL for metabolic longevity)
   - TAR L1 (141 - 180 mg/dL) & TAR L2 (> 180 mg/dL)
   - TBR L1 (54 - 69 mg/dL) & TBR L2 (< 54 mg/dL)
   - MAGE (Mean Amplitude of Glycemic Excursions, Service et al.)
   - CV (Coefficient of Variation: SD / Mean * 100, target < 36%)
   - J-Index (Composite glycemic control index)
   - LBGI / HBGI (Low/High Blood Glucose Risk Indices, Kovatchev et al.)
"""

from typing import Dict, Any, List, Tuple
import numpy as np


class CGMAnalyticsEngine:
    """Computes high-precision CGM signal processing, diffusion modeling, and variability metrics."""

    @classmethod
    def generate_cgm_stream(
        cls,
        plasma_glucose_trajectory: List[Dict[str, float]],
        sampling_interval_min: int = 5,
        tau_lag_min: float = 10.0,
        sensor_noise_sd: float = 1.8,
        seed: int = 42
    ) -> Dict[str, Any]:
        """
        Transforms 15-minute plasma glucose points into continuous 5-minute CGM telemetry
        by applying 1st-order interstitial diffusion lag and electrochemical sensor noise.
        """
        if not plasma_glucose_trajectory:
            return {"cgmPoints": [], "metrics": {}}

        # Interpolate plasma glucose onto 1-minute grid
        orig_times = np.array([pt.get("minute", pt.get("time_min", pt.get("time", i * 15))) for i, pt in enumerate(plasma_glucose_trajectory)], dtype=float)
        orig_glucose = np.array([pt.get("glucose", pt.get("plasmaGlucose", pt.get("value", 100.0))) for pt in plasma_glucose_trajectory], dtype=float)

        t_max = int(orig_times[-1])
        t_dense = np.arange(0, t_max + 1, 1.0)
        plasma_dense = np.interp(t_dense, orig_times, orig_glucose)

        # 1st Order ODE: dG_cgm/dt = (G_plasma - G_cgm) / tau_lag
        dt = 1.0  # 1 min step
        cgm_dense = np.zeros_like(plasma_dense)
        cgm_dense[0] = plasma_dense[0]

        for i in range(1, len(t_dense)):
            dG = (plasma_dense[i] - cgm_dense[i - 1]) / tau_lag_min
            cgm_dense[i] = cgm_dense[i - 1] + dt * dG

        # Add AR(1) sensor noise
        rng = np.random.default_rng(seed)
        noise = np.zeros_like(cgm_dense)
        noise[0] = rng.normal(0, sensor_noise_sd)
        phi = 0.65  # Autoregressive persistence
        for i in range(1, len(t_dense)):
            noise[i] = phi * noise[i - 1] + rng.normal(0, sensor_noise_sd * np.sqrt(1 - phi ** 2))

        cgm_signal = np.clip(cgm_dense + noise, 40.0, 500.0)

        # Subsample to requested sampling interval (e.g. 5 minutes)
        cgm_points = []
        for i in range(0, len(t_dense), sampling_interval_min):
            m = int(t_dense[i])
            cgm_points.append({
                "minute": m,
                "plasmaGlucose": float(np.round(plasma_dense[i], 1)),
                "sensorGlucose": float(np.round(cgm_signal[i], 1)),
                "lagMinutes": float(np.round(tau_lag_min, 1)),
                "trendArrow": cls._compute_trend_arrow(cgm_signal, i, sampling_interval_min)
            })

        # Calculate Comprehensive AGP Metrics on the 5-min stream
        sensor_values = [pt["sensorGlucose"] for pt in cgm_points]
        agp_metrics = cls.compute_agp_metrics(sensor_values)

        return {
            "samplingIntervalMinutes": sampling_interval_min,
            "diffusionLagConstantMin": tau_lag_min,
            "totalReadings": len(cgm_points),
            "cgmPoints": cgm_points,
            "agpMetrics": agp_metrics
        }

    @classmethod
    def compute_agp_metrics(cls, values: List[float]) -> Dict[str, Any]:
        """Calculates standard consensus CGM Ambulatory Glucose Profile metrics."""
        if not values or len(values) < 2:
            return {}

        arr = np.array(values, dtype=float)
        n = len(arr)
        mean_g = float(np.mean(arr))
        sd_g = float(np.std(arr, ddof=1)) if n > 1 else 0.0
        cv_pct = float(np.round((sd_g / mean_g) * 100.0, 1)) if mean_g > 0 else 0.0

        # Time-in-Ranges (percentages)
        tir_euglycemic = float(np.round(np.sum((arr >= 70) & (arr <= 140)) / n * 100.0, 1))
        tight_tir = float(np.round(np.sum((arr >= 70) & (arr <= 120)) / n * 100.0, 1))
        tar_l1 = float(np.round(np.sum((arr > 140) & (arr <= 180)) / n * 100.0, 1))
        tar_l2 = float(np.round(np.sum(arr > 180) / n * 100.0, 1))
        tbr_l1 = float(np.round(np.sum((arr >= 54) & (arr < 70)) / n * 100.0, 1))
        tbr_l2 = float(np.round(np.sum(arr < 54) / n * 100.0, 1))

        # Mean Amplitude of Glycemic Excursions (MAGE)
        mage = cls._compute_mage(arr, sd_g)

        # J-Index: 0.001 * (Mean + SD)^2
        j_index = float(np.round(0.001 * ((mean_g + sd_g) ** 2), 1))

        # LBGI & HBGI (Low and High Blood Glucose Risk Indices, Kovatchev)
        lbgi, hbgi = cls._compute_lbgi_hbgi(arr)

        return {
            "meanGlucose": float(np.round(mean_g, 1)),
            "standardDeviation": float(np.round(sd_g, 1)),
            "coefficientOfVariationPercent": cv_pct,
            "cvStatus": "Stable (<36%)" if cv_pct < 36.0 else "Elevated Glycemic Variability (>=36%)",
            "timeInRangePercent": {
                "euglycemic70_140": tir_euglycemic,
                "tightRange70_120": tight_tir,
                "tarLevel1_140_180": tar_l1,
                "tarLevel2_above180": tar_l2,
                "tbrLevel1_54_69": tbr_l1,
                "tbrLevel2_below54": tbr_l2
            },
            "mage": float(np.round(mage, 1)),
            "jIndex": j_index,
            "glycemicRiskIndices": {
                "lbgi": float(np.round(lbgi, 2)),
                "hbgi": float(np.round(hbgi, 2)),
                "hypoglycemiaRisk": "Low" if lbgi < 2.5 else ("Moderate" if lbgi < 5.0 else "High"),
                "hyperglycemiaRisk": "Low" if hbgi < 5.0 else ("Moderate" if hbgi < 10.0 else "High")
            }
        }

    @classmethod
    def _compute_mage(cls, values: np.ndarray, sd: float) -> float:
        """Calculates Mean Amplitude of Glycemic Excursions (Service et al.)."""
        if len(values) < 3 or sd <= 0.001:
            return 0.0

        # Find turning points (local extrema)
        diffs = np.diff(values)
        sign_changes = np.where(np.diff(np.sign(diffs)))[0] + 1
        if len(sign_changes) == 0:
            return float(np.max(values) - np.min(values))

        extrema = values[sign_changes]
        excursions = []
        for i in range(1, len(extrema)):
            delta = abs(extrema[i] - extrema[i - 1])
            if delta > sd:
                excursions.append(delta)

        if excursions:
            return float(np.mean(excursions))
        return float(np.max(values) - np.min(values))

    @classmethod
    def _compute_lbgi_hbgi(cls, values: np.ndarray) -> Tuple[float, float]:
        """Calculates LBGI & HBGI using Kovatchev's log-transform symmetrized risk function."""
        # f(G) = 1.509 * ( (ln(G))^1.084 - 5.381 )
        # Risk: 10 * (f(G))^2
        safe_vals = np.clip(values, 20.0, 600.0)
        f_g = 1.509 * ((np.log(safe_vals) ** 1.084) - 5.381)
        risk = 10.0 * (f_g ** 2)

        rl = np.where(f_g < 0, risk, 0.0)
        rh = np.where(f_g > 0, risk, 0.0)

        lbgi = float(np.mean(rl))
        hbgi = float(np.mean(rh))
        return lbgi, hbgi

    @classmethod
    def _compute_trend_arrow(cls, cgm: np.ndarray, index: int, step_min: int) -> str:
        """Determines clinical rate-of-change trend arrow (Dexcom/Abbott standard)."""
        if index < 2:
            return "FLAT (->)"
        # Rate of change over past 10-15 minutes in mg/dL per min
        lookback = max(1, 10 // step_min)
        past_idx = max(0, index - lookback)
        delta = cgm[index] - cgm[past_idx]
        dt = (index - past_idx) * step_min
        if dt <= 0:
            return "FLAT (->)"
        roc = delta / dt  # mg/dL/min

        if roc > 2.0:
            return "RISING_RAPIDLY (^^)"
        elif roc > 1.0:
            return "RISING (^)"
        elif roc > 0.5:
            return "SLOWLY_RISING (/^)"
        elif roc < -2.0:
            return "FALLING_RAPIDLY (vv)"
        elif roc < -1.0:
            return "FALLING (v)"
        elif roc < -0.5:
            return "SLOWLY_FALLING (\\v)"
        else:
            return "FLAT (->)"


cgm_analytics_engine = CGMAnalyticsEngine()
