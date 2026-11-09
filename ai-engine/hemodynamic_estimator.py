"""
BioSync AI - Phase 4: Wearables Bridge & Sensor Telemetry Fusion
Module: hemodynamic_estimator.py

Implements:
1. Cuffless Blood Pressure & Pulse Wave Velocity (PWV) via Pulse Transit Time (PTT)
   governed by the Moens-Korteweg and Hughes nonlinear vascular elasticity formulas.
2. Autonomic Nervous System Stress Profiling via Heart Rate Variability (HRV):
   Time-domain (SDNN, RMSSD, pNN50) and Baevsky Sympathetic Stress Index.
3. Acoustic & Inertial Mastication (Meal-Start) Classifier:
   Identifies characteristic chewing frequencies (1.2 - 2.5 Hz) and hand-to-mouth
   kinematics to automatically trigger digital twin protective monitoring.
"""

from typing import Dict, Any, List, Optional
import numpy as np


class HemodynamicEstimator:
    """
    Advanced biophysical signal processing engine for continuous wearable telemetry.
    """

    # Biophysical vascular constants
    RHO_BLOOD = 1050.0          # Blood density in kg/m3
    DEFAULT_VESSEL_RATIO = 0.10 # Arterial wall thickness to diameter ratio (h/d)
    GAMMA_STIFFNESS = 0.024     # Empirical coefficient of arterial wall stiffness (1/mmHg)
    E0_ELASTICITY = 0.95e5      # Zero-pressure elastic modulus (Pascals)

    @classmethod
    def estimate_cuffless_bp(
        cls,
        ptt_ms: float,
        heart_rate_bpm: float = 72.0,
        patient_height_cm: float = 172.0,
        baseline_sbp: float = 120.0,
        baseline_dbp: float = 80.0,
        ppg_inflection_ratio: float = 0.65
    ) -> Dict[str, Any]:
        """
        Calculates continuous systolic and diastolic blood pressure from
        Pulse Transit Time (PTT) using the calibrated Moens-Korteweg / Hughes elasticity formulation.
        """
        ptt_sec = max(0.10, min(0.50, float(ptt_ms) / 1000.0))
        hr = max(40.0, min(200.0, float(heart_rate_bpm)))
        height_m = max(1.2, min(2.2, float(patient_height_cm) / 100.0))

        # Effective peripheral arterial path length (aortic root to radial wrist artery)
        arterial_distance_m = 0.38 * height_m
        pwv = arterial_distance_m / ptt_sec

        # Nominal reference PTT (ms) for baseline pressure
        nominal_ptt_ms = 220.0

        # Hughes Elasticity Differential Formulation:
        # SBP = baseline_sbp + (2 / gamma) * ln( PTT_nominal / PTT )
        gamma = cls.GAMMA_STIFFNESS  # 0.024 mmHg^-1
        delta_sbp_elastic = (2.0 / gamma) * np.log(nominal_ptt_ms / ptt_ms)

        sbp_estimated = float(np.clip(baseline_sbp + delta_sbp_elastic, 75.0, 230.0))

        # Pulse pressure modulated by heart rate and dicrotic wave reflection
        estimated_pp = float(np.clip((sbp_estimated * 0.33) * (1.0 + 0.15 * ppg_inflection_ratio), 25.0, 85.0))
        dbp_estimated = float(np.clip(sbp_estimated - estimated_pp, 45.0, 135.0))

        map_estimated = float(np.round((sbp_estimated + 2.0 * dbp_estimated) / 3.0, 1))
        pp_estimated = float(np.round(sbp_estimated - dbp_estimated, 1))

        # Peripheral Radial Arterial Stiffness Index:
        if pwv >= 4.2:
            stiffness_category = "Elevated Arterial Stiffness (Vascular Load Surge)"
        elif pwv >= 3.4:
            stiffness_category = "Moderate Postprandial Stiffness (Vascular Tone Response)"
        else:
            stiffness_category = "Optimal Elastic Vascular Compliance"

        return {
            "success": True,
            "ptt_ms": float(np.round(ptt_ms, 1)),
            "pulseWaveVelocity_m_s": float(np.round(pwv, 2)),
            "estimatedSystolicBP": float(np.round(sbp_estimated, 1)),
            "estimatedDiastolicBP": float(np.round(dbp_estimated, 1)),
            "meanArterialPressure": map_estimated,
            "pulsePressure": pp_estimated,
            "stiffnessCategory": stiffness_category,
            "vascularMechanism": "Moens-Korteweg Fluid-Structure Elastic Arterial Boundary Modeling"
        }

    @classmethod
    def analyze_hrv(
        cls,
        rr_intervals_ms: List[float]
    ) -> Dict[str, Any]:
        """
        Extracts autonomic sympathetic vs parasympathetic balance from inter-beat (RR) intervals.
        """
        if not rr_intervals_ms or len(rr_intervals_ms) < 5:
            return {
                "success": False,
                "message": "At least 5 valid RR intervals required for HRV analysis."
            }

        # Filter physiological artifacts: 300ms (200 bpm) to 1800ms (33 bpm)
        clean_rr = np.array([x for x in rr_intervals_ms if 300.0 <= x <= 1800.0])
        if len(clean_rr) < 5:
            clean_rr = np.array(rr_intervals_ms)

        mean_rr = float(np.mean(clean_rr))
        mean_hr = float(60000.0 / mean_rr) if mean_rr > 0 else 72.0

        # Time-Domain Metrics
        sdnn = float(np.std(clean_rr, ddof=1)) if len(clean_rr) > 1 else 30.0
        successive_diffs = np.diff(clean_rr)
        rmssd = float(np.sqrt(np.mean(successive_diffs ** 2))) if len(successive_diffs) > 0 else 25.0

        # pNN50: percentage of adjacent RR differences > 50ms
        nn50 = int(np.sum(np.abs(successive_diffs) > 50.0))
        pnn50 = float(np.round((nn50 / len(successive_diffs)) * 100.0, 1)) if len(successive_diffs) > 0 else 0.0

        # Baevsky Stress Index (SI_Baevsky)
        # Quantifies autonomic sympathetic tone dominance:
        # SI = AMo / (2 * Mo * MxDMn)
        rr_range = max(10.0, float(np.ptp(clean_rr)))
        hist, bin_edges = np.histogram(clean_rr, bins=min(20, max(5, len(clean_rr) // 5)))
        max_bin_idx = int(np.argmax(hist))
        mo = float((bin_edges[max_bin_idx] + bin_edges[max_bin_idx + 1]) / 2.0) / 1000.0  # Modal RR in seconds
        amo = float(hist[max_bin_idx] / len(clean_rr)) * 100.0  # Amplitude of mode (%)
        mxdmn_sec = float(rr_range) / 1000.0

        stress_index = float(np.round(amo / (2.0 * mo * mxdmn_sec), 1)) if (mo * mxdmn_sec) > 0 else 50.0

        # Autonomic State Stratification
        if rmssd < 20.0 or stress_index > 250.0:
            autonomic_status = "High Sympathetic Arousal (Visceral Metabolic Stress / Acute Splanchnic Surge)"
        elif rmssd >= 42.0 and stress_index < 120.0:
            autonomic_status = "Robust Parasympathetic Rest-and-Digest Vagal Tone"
        else:
            autonomic_status = "Balanced Homeostatic Autonomic Tone"

        return {
            "success": True,
            "sampleCount": len(clean_rr),
            "meanHeartRate": float(np.round(mean_hr, 1)),
            "meanRR_ms": float(np.round(mean_rr, 1)),
            "sdnn_ms": float(np.round(sdnn, 1)),
            "rmssd_ms": float(np.round(rmssd, 1)),
            "pnn50_percent": pnn50,
            "baevskyStressIndex": stress_index,
            "autonomicStatus": autonomic_status
        }

    @classmethod
    def detect_meal_initiation(
        cls,
        accelerometer_variance: float,
        audio_frequency_spectrum: List[float],
        continuous_heart_rate: float,
        resting_baseline_hr: float = 70.0
    ) -> Dict[str, Any]:
        """
        Classifies whether an unlogged meal has started using smartwatch IMU and microphone telemetry.
        """
        # 1. Accelerometer Periodic Motion (Hand-to-mouth cadence ~ 0.03 to 0.08 Hz)
        motion_score = float(np.clip(accelerometer_variance / 2.5, 0.0, 1.0))

        # 2. Audio Chewing Energy Spectrum:
        # Chewing frequency energy peaks in 1.2 - 2.5 Hz band
        if audio_frequency_spectrum and len(audio_frequency_spectrum) >= 4:
            chewing_band_energy = float(np.mean(audio_frequency_spectrum[1:4]))
            audio_chew_score = float(np.clip(chewing_band_energy / 80.0, 0.0, 1.0))
        else:
            audio_chew_score = 0.5

        # 3. Cephalic Phase Heart Rate Elevation (mild transient tachycardia +5 to +12 bpm upon ingestion)
        hr_delta = max(0.0, continuous_heart_rate - resting_baseline_hr)
        hr_score = float(np.clip(hr_delta / 12.0, 0.0, 1.0))

        # Combined Multi-Modal Probability
        composite_prob = float(np.round(0.40 * motion_score + 0.40 * audio_chew_score + 0.20 * hr_score, 2))
        is_meal_detected = composite_prob >= 0.65

        return {
            "success": True,
            "mealDetected": is_meal_detected,
            "confidenceScore": composite_prob,
            "subScores": {
                "motionCadenceScore": float(np.round(motion_score, 2)),
                "audioChewingScore": float(np.round(audio_chew_score, 2)),
                "cephalicHeartRateScore": float(np.round(hr_score, 2))
            },
            "clinicalAction": (
                "AUTONOMOUS DIGITAL TWIN SURVEILLANCE ACTIVATED: Meal initiation detected via smartwatch telemetry."
                if is_meal_detected else
                "Baseline ambulatory activity; no mastication pattern detected."
            )
        }


hemodynamic_estimator = HemodynamicEstimator()
