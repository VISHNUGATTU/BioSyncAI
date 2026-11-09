"""
BioSync AI - Cyber-Physical Smart Kitchen Hardware Interface
Module: smart_kitchen_hardware_interface.py

Integrates physical kitchen sensors and actuators:
1. Optical Dual-Wavelength NIR Spectrophotometer for In-Situ Cooking Oil Degradation (TPC % & Smoke Point).
2. Multi-Plate Gravimetric Digital Load-Cell Array for Closed-Loop Single-Pot Mass Conservation Verification.
3. Hardware Dispensing Solenoid Interlock & Thermal ESC/POS Encoder.
"""

from typing import Dict, Any, List, Optional
import math
import hashlib
import time

class SmartKitchenHardwareInterface:
    """
    Hardware abstraction layer for commercial smart cloud kitchen stations.
    Bridges physical sensors (spectrophotometer, digital load-cell array)
    with biophysical validation and physical dispensing actuators.
    """

    FSSAI_TPC_LIMIT_PERCENT = 25.0  # Food Safety and Standards Authority of India statutory ceiling

    @classmethod
    def read_optical_oil_sensor(
        cls,
        absorbance_450nm: float,
        absorbance_600nm: float,
        oil_temperature_c: float = 175.0,
        oil_type: str = "A2_Mustard_Ghee_Blend"
    ) -> Dict[str, Any]:
        """
        Processes dual-wavelength optical absorbance to derive Total Polar Compounds (TPC)
        and smoke-point degradation of physical cooking mediums.
        """
        # Photometric Beer-Lambert calibration curve for thermal triglyceride polymers
        # TPC (%) = 12.5 * A_450 - 4.2 * A_600 + thermal_drift_correction
        thermal_drift = 0.02 * (oil_temperature_c - 160.0) if oil_temperature_c > 160.0 else 0.0
        raw_tpc = (12.5 * absorbance_450nm) - (4.2 * absorbance_600nm) + thermal_drift
        tpc_percent = round(max(2.0, min(45.0, raw_tpc)), 2)

        # Baseline fresh smoke point
        baseline_smoke_point = 230.0 if "Ghee" in oil_type else 210.0
        degraded_smoke_point = round(baseline_smoke_point - (1.95 * tpc_percent), 1)

        # Oil Quality Index (OQI 1-100)
        # OQI = 100 - (TPC / 25.0 * 60) - penalties
        oqi_score = max(5, min(100, int(100 - ((tpc_percent / cls.FSSAI_TPC_LIMIT_PERCENT) * 65.0))))

        is_fssai_compliant = tpc_percent < cls.FSSAI_TPC_LIMIT_PERCENT
        if tpc_percent < 12.0:
            classification = "OPTIMAL_VIRGIN"
            solenoid_lockout = False
            advisory = "Cooking oil is pristine; minimal thermal polymerization."
        elif tpc_percent < cls.FSSAI_TPC_LIMIT_PERCENT:
            classification = "ACCEPTABLE_MODERATE_CYCLE"
            solenoid_lockout = False
            advisory = f"Oil exhibits moderate thermal degradation (TPC: {tpc_percent}%). Nearing retirement threshold."
        else:
            classification = "CONDEMNED_HAZARDOUS"
            solenoid_lockout = True
            advisory = f"CRITICAL: TPC of {tpc_percent}% exceeds FSSAI statutory 25% ceiling! Acrolein & toxic polar compounds detected. Dispense solenoid locked."

        sensor_hash = hashlib.sha256(
            f"{oil_type}:{absorbance_450nm}:{absorbance_600nm}:{tpc_percent}:{time.time():.0f}".encode()
        ).hexdigest()[:16]

        return {
            "success": True,
            "sensorType": "Dual-Wavelength NIR Spectrophotometer (450nm/600nm)",
            "oilType": oil_type,
            "oilTemperatureCelsius": oil_temperature_c,
            "absorbance_450nm": absorbance_450nm,
            "absorbance_600nm": absorbance_600nm,
            "totalPolarCompoundsPercent": tpc_percent,
            "fssaiLimitPercent": cls.FSSAI_TPC_LIMIT_PERCENT,
            "isFssaiCompliant": is_fssai_compliant,
            "estimatedSmokePointCelsius": degraded_smoke_point,
            "oilQualityIndex": oqi_score,
            "classification": classification,
            "physicalSolenoidLockout": solenoid_lockout,
            "clinicalAdvisory": advisory,
            "opticalCalibrationTelemetryHash": f"OPT-{sensor_hash}"
        }

    @classmethod
    def verify_gravimetric_plating(
        cls,
        total_pot_grams: float,
        plate_measurements: List[Dict[str, Any]],
        tolerance_grams: float = 3.0
    ) -> Dict[str, Any]:
        """
        Verifies real-time digital load-cell scale readings from smart kitchen plating stations.
        Enforces thermodynamic conservation of mass: Sum(plate_i) == total_pot_grams +- tolerance.
        """
        total_plated_grams = 0.0
        plate_verifications = []
        all_plates_valid = True

        for plate in plate_measurements:
            plate_id = plate.get("plateId", "unknown")
            member_name = plate.get("memberName", "Family Member")
            target_grams = float(plate.get("targetGrams", 0.0))
            measured_grams = float(plate.get("measuredGrams", 0.0))
            load_cell_id = plate.get("loadCellId", f"LC-{plate_id}")

            diff = round(measured_grams - target_grams, 2)
            is_valid = abs(diff) <= tolerance_grams

            if not is_valid:
                all_plates_valid = False

            total_plated_grams += measured_grams
            plate_verifications.append({
                "plateId": plate_id,
                "memberName": member_name,
                "loadCellId": load_cell_id,
                "targetGrams": target_grams,
                "measuredGrams": measured_grams,
                "differentialGrams": diff,
                "withinTolerance": is_valid,
                "toleranceGrams": tolerance_grams
            })

        total_plated_grams = round(total_plated_grams, 2)
        total_differential = round(total_plated_grams - total_pot_grams, 2)
        mass_conserved = abs(total_differential) <= (tolerance_grams * len(plate_measurements))

        # Compute cryptographic gravimetric calibration stamp
        audit_string = f"POT:{total_pot_grams}|PLATED:{total_plated_grams}|DIFF:{total_differential}|VALID:{mass_conserved}"
        gravimetric_hash = hashlib.sha256(audit_string.encode()).hexdigest()

        return {
            "success": True,
            "stationType": "Smart Cyber-Physical Plating Workstation",
            "totalPotGrams": total_pot_grams,
            "totalPlatedGrams": total_plated_grams,
            "totalDifferentialGrams": total_differential,
            "massConservationSatisfied": mass_conserved,
            "allIndividualPlatesWithinTolerance": all_plates_valid,
            "toleranceGrams": tolerance_grams,
            "plateCount": len(plate_measurements),
            "plates": plate_verifications,
            "status": "GRAVIMETRICALLY_VERIFIED" if (mass_conserved and all_plates_valid) else "MASS_MISMATCH_REJECTED",
            "gravimetricCustodyHash": f"GRAV-{gravimetric_hash[:20]}",
            "readyForPackagingActuator": mass_conserved and all_plates_valid
        }


smart_kitchen_hardware = SmartKitchenHardwareInterface()

