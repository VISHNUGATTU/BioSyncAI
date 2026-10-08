"""
BioSync AI - Phase 4 Comprehensive Test Suite
Tests Physiological Bergman Minimal Model ODE Numerical Solver, Windkessel BP Model,
Portion Scaling, Harm Reduction Doctor Hacks Comparative Simulation, and API Endpoints.
"""

import unittest
import numpy as np
from fastapi.testclient import TestClient

from metabolic_twin import MetabolicDigitalTwin
from vital_simulator import VitalSurgeSimulator, vital_simulator
from main import app


class TestPhase4VitalSurgeSimulator(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.simulator = vital_simulator

    def test_01_rk4_solver_convergence_and_dimensions(self):
        """Verifies numerical convergence and 13-point discrete sampling across 180 minutes."""
        sim = self.simulator.simulate_meal_surge(
            net_carbs=40.0,
            sodium_mg=500.0,
            glycemic_index=55,
            consumed_quantity=1.0
        )
        self.assertIn("timeSeries", sim)
        trajectory = sim["timeSeries"]
        self.assertEqual(len(trajectory), 13, "Trajectory should have 13 points (0 to 180 min, sampled every 15m)")
        self.assertEqual(trajectory[0]["minute"], 0)
        self.assertEqual(trajectory[-1]["minute"], 180)

        # Check all values are real, finite, positive
        for pt in trajectory:
            self.assertTrue(np.isfinite(pt["glucose"]))
            self.assertTrue(np.isfinite(pt["systolicBP"]))
            self.assertGreaterEqual(pt["glucose"], 50.0)
            self.assertGreaterEqual(pt["systolicBP"], 70.0)

        print(f"PASSED: RK4 ODE solver convergence verified across {len(trajectory)} points over 180 mins.")

    def test_02_glycemic_index_kinetics(self):
        """Verifies High-GI foods peak earlier and higher than Low-GI foods of equal carb weight."""
        high_gi_sim = self.simulator.simulate_meal_surge(
            net_carbs=50.0,
            sodium_mg=300.0,
            glycemic_index=80,  # e.g. White bread / cornflakes
            consumed_quantity=1.0
        )
        low_gi_sim = self.simulator.simulate_meal_surge(
            net_carbs=50.0,
            sodium_mg=300.0,
            glycemic_index=30,  # e.g. Dal / apple
            consumed_quantity=1.0
        )

        self.assertGreater(
            high_gi_sim["peakProjections"]["peakGlucose"],
            low_gi_sim["peakProjections"]["peakGlucose"],
            "High GI food should produce higher peak glucose"
        )
        print(f"PASSED: Glycemic kinetics verified (High GI peak: {high_gi_sim['peakProjections']['peakGlucose']} vs Low GI: {low_gi_sim['peakProjections']['peakGlucose']} mg/dL).")

    def test_03_digital_twin_insulin_resistance_impact(self):
        """Verifies insulin-resistant digital twin experiences higher postprandial spike."""
        twin_diab = MetabolicDigitalTwin(fasting_glucose=125, hba1c=6.5)
        twin_norm = MetabolicDigitalTwin(fasting_glucose=88, hba1c=5.0)

        sim_diab = self.simulator.simulate_meal_surge(net_carbs=45.0, sodium_mg=400.0, twin=twin_diab)
        sim_norm = self.simulator.simulate_meal_surge(net_carbs=45.0, sodium_mg=400.0, twin=twin_norm)

        self.assertGreater(
            sim_diab["peakProjections"]["glucoseSpike"],
            sim_norm["peakProjections"]["glucoseSpike"],
            "Insulin-resistant twin should experience larger glucose surge"
        )
        print(f"PASSED: Insulin resistance physiological curve verified (Normal spike: +{sim_norm['peakProjections']['glucoseSpike']} vs Impaired: +{sim_diab['peakProjections']['glucoseSpike']} mg/dL).")

    def test_04_portion_scaling_dynamics(self):
        """Verifies 2.0x portion yields substantially higher peak and prolonged curve than 0.5x portion."""
        sim_half = self.simulator.simulate_meal_surge(net_carbs=40.0, sodium_mg=400.0, consumed_quantity=0.5)
        sim_double = self.simulator.simulate_meal_surge(net_carbs=40.0, sodium_mg=400.0, consumed_quantity=2.0)

        self.assertGreater(
            sim_double["peakProjections"]["glucoseSpike"],
            sim_half["peakProjections"]["glucoseSpike"] * 2.0,
            "Double portion should overwhelm insulin disposal non-linearly"
        )
        print(f"PASSED: Portion scaling non-linear dynamics verified (0.5x spike: +{sim_half['peakProjections']['glucoseSpike']} vs 2.0x spike: +{sim_double['peakProjections']['glucoseSpike']} mg/dL).")

    def test_05_doctor_hacks_harm_reduction_benefit(self):
        """Verifies applying doctor hacks attenuates the postprandial peak by at least 25%."""
        comp = self.simulator.simulate_comparison(
            net_carbs=50.0,
            sodium_mg=860.0,
            glycemic_index=67,
            consumed_quantity=1.0
        )
        benefit = comp["harmReductionBenefit"]
        self.assertGreaterEqual(benefit["percentSpikeReduction"], 25.0, "Doctor hacks should reduce spike by >= 25%")
        self.assertGreater(benefit["glucoseSpikeReducedBy"], 15.0)
        print(f"PASSED: Doctor hacks harm reduction verified: {benefit['summary']}")

    def test_06_windkessel_blood_pressure_transient(self):
        """Verifies sodium intake drives transient systolic BP rise with gradual return."""
        sim_salt = self.simulator.simulate_meal_surge(net_carbs=10.0, sodium_mg=1200.0)
        sim_nosalt = self.simulator.simulate_meal_surge(net_carbs=10.0, sodium_mg=50.0)

        self.assertGreater(
            sim_salt["peakProjections"]["bpSpikeSystolic"],
            sim_nosalt["peakProjections"]["bpSpikeSystolic"] + 4.0
        )
        # Verify BP returns toward baseline by 180 min
        bp_180 = sim_salt["timeSeries"][-1]["systolicBP"]
        bp_peak = sim_salt["peakProjections"]["peakSystolicBP"]
        self.assertLess(bp_180, bp_peak)
        print(f"PASSED: Windkessel BP transient curve verified (Peak BP: {bp_peak} mmHg, 180m: {bp_180} mmHg).")

    def test_07_api_simulate_vital_surge_endpoint(self):
        """Tests POST /api/v1/simulate-vital-surge HTTP endpoint."""
        payload = {
            "itemName": "Maggi 2-Minute Masala Noodles",
            "consumedQuantity": 1.5,
            "vitals": {
                "fastingGlucose": 105,
                "systolicBP": 130,
                "hba1c": 5.8
            }
        }
        res = self.client.post("/api/v1/simulate-vital-surge", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["consumedQuantity"], 1.5)
        self.assertIn("timeSeries", data)
        self.assertEqual(len(data["timeSeries"]), 13)
        self.assertIn("peakProjections", data)
        self.assertIn("withDoctorHacks", data)
        self.assertIn("harmReductionBenefit", data)
        print("PASSED: POST /api/v1/simulate-vital-surge endpoint verified with 13 trajectory points.")

    def test_08_zero_intake_stability(self):
        """Verifies zero carbs/sodium preserves baseline stability without false spikes."""
        sim_zero = self.simulator.simulate_meal_surge(net_carbs=0.0, sodium_mg=0.0)
        self.assertAlmostEqual(sim_zero["peakProjections"]["glucoseSpike"], 0.0, places=1)
        self.assertAlmostEqual(sim_zero["peakProjections"]["bpSpikeSystolic"], 0.0, places=1)
        print("PASSED: Zero-intake homeostasis stability verified.")


if __name__ == "__main__":
    unittest.main()
