"""
BioSync AI - Phase 10 / Grant-Level Verification Suite:
Cyber-Physical Smart Kitchen Station & Sensor Interfaces

Verifies:
1. Dual-Wavelength NIR Spectrophotometer Oil Quality Processing (absorbance 450nm/600nm, TPC %, FSSAI limits).
2. Physical Solenoid Lockout when TPC >= 25% (Acrolein / polar compound safety).
3. Multi-Plate Gravimetric Digital Load-Cell Array Verification (Thermodynamic Mass Conservation).
4. Direct FastAPI Endpoints: /api/v1/hardware/read-optical-oil-sensor, /api/v1/hardware/verify-gravimetric-plating.
"""

import unittest
from smart_kitchen_hardware_interface import smart_kitchen_hardware
from main import (
    read_optical_oil_sensor_endpoint,
    verify_gravimetric_plating_endpoint,
    OpticalOilSensorRequest,
    GravimetricPlatingRequest
)

class TestSmartKitchenHardware(unittest.TestCase):

    def setUp(self):
        self.hw = smart_kitchen_hardware

    def test_01_optical_oil_sensor_optimal(self):
        """Test virgin/fresh cooking oil with low optical absorbance."""
        res = self.hw.read_optical_oil_sensor(
            absorbance_450nm=0.45,
            absorbance_600nm=0.15,
            oil_temperature_c=170.0,
            oil_type="A2_Desi_Cow_Ghee"
        )
        self.assertTrue(res["success"])
        self.assertTrue(res["isFssaiCompliant"])
        self.assertFalse(res["physicalSolenoidLockout"])
        self.assertLess(res["totalPolarCompoundsPercent"], 12.0)
        self.assertEqual(res["classification"], "OPTIMAL_VIRGIN")
        self.assertGreaterEqual(res["oilQualityIndex"], 80)
        print(f"  ✅ PASS: Optimal virgin oil verified (TPC: {res['totalPolarCompoundsPercent']}%, OQI: {res['oilQualityIndex']})")

    def test_02_optical_oil_sensor_condemned_lockout(self):
        """Test highly degraded repeated-frying oil exceeding statutory 25% TPC."""
        res = self.hw.read_optical_oil_sensor(
            absorbance_450nm=2.65,
            absorbance_600nm=0.45,
            oil_temperature_c=185.0,
            oil_type="Commercial_Refined_Palm_Oil"
        )
        self.assertTrue(res["success"])
        self.assertFalse(res["isFssaiCompliant"])
        self.assertTrue(res["physicalSolenoidLockout"])
        self.assertGreaterEqual(res["totalPolarCompoundsPercent"], 25.0)
        self.assertEqual(res["classification"], "CONDEMNED_HAZARDOUS")
        print(f"  ✅ PASS: Condemned frying oil triggered physical solenoid lockout (TPC: {res['totalPolarCompoundsPercent']}%)")

    def test_03_gravimetric_load_cell_mass_conservation(self):
        """Test 4-plate digital load cell array satisfying single-pot conservation of mass."""
        pot_size = 1200.0  # 1200g Handi Biryani
        plate_readings = [
            {"plateId": "dadaji", "memberName": "Dadaji", "targetGrams": 250.0, "measuredGrams": 249.2, "loadCellId": "LC-01"},
            {"plateId": "papaji", "memberName": "Papaji", "targetGrams": 300.0, "measuredGrams": 301.1, "loadCellId": "LC-02"},
            {"plateId": "aman", "memberName": "Aman", "targetGrams": 400.0, "measuredGrams": 399.5, "loadCellId": "LC-03"},
            {"plateId": "mummyji", "memberName": "Mummyji", "targetGrams": 250.0, "measuredGrams": 250.0, "loadCellId": "LC-04"}
        ]
        res = self.hw.verify_gravimetric_plating(
            total_pot_grams=pot_size,
            plate_measurements=plate_readings,
            tolerance_grams=2.5
        )
        self.assertTrue(res["success"])
        self.assertTrue(res["massConservationSatisfied"])
        self.assertTrue(res["allIndividualPlatesWithinTolerance"])
        self.assertEqual(res["status"], "GRAVIMETRICALLY_VERIFIED")
        self.assertTrue(res["readyForPackagingActuator"])
        self.assertTrue(res["gravimetricCustodyHash"].startswith("GRAV-"))
        print(f"  ✅ PASS: Gravimetric multi-load-cell mass conservation verified (Total Plated: {res['totalPlatedGrams']}g / {pot_size}g)")

    def test_04_gravimetric_load_cell_mismatch_rejected(self):
        """Test load cell array rejecting plate that violates clinical portion tolerance."""
        pot_size = 1000.0
        plate_readings = [
            {"plateId": "dadaji", "memberName": "Dadaji", "targetGrams": 200.0, "measuredGrams": 280.0, "loadCellId": "LC-01"},  # Overloaded by 80g!
            {"plateId": "papaji", "memberName": "Papaji", "targetGrams": 800.0, "measuredGrams": 720.0, "loadCellId": "LC-02"}
        ]
        res = self.hw.verify_gravimetric_plating(
            total_pot_grams=pot_size,
            plate_measurements=plate_readings,
            tolerance_grams=3.0
        )
        self.assertTrue(res["success"])
        self.assertFalse(res["allIndividualPlatesWithinTolerance"])
        self.assertEqual(res["status"], "MASS_MISMATCH_REJECTED")
        self.assertFalse(res["readyForPackagingActuator"])
        print(f"  ✅ PASS: Gravimetric safety interlock rejected overloaded diabetic plate (Diff: +80g)")

    def test_05_fastapi_hardware_endpoints(self):
        """Test direct FastAPI endpoints for optical sensor and gravimetric array."""
        oil_req = OpticalOilSensorRequest(
            absorbance_450nm=0.55,
            absorbance_600nm=0.20,
            oil_temperature_c=172.0,
            oil_type="Cold_Pressed_Sesame_Oil"
        )
        oil_res = read_optical_oil_sensor_endpoint(oil_req)
        self.assertTrue(oil_res["success"])
        self.assertIn("oilQualityIndex", oil_res)

        grav_req = GravimetricPlatingRequest(
            total_pot_grams=500.0,
            plate_measurements=[
                {"plateId": "p1", "targetGrams": 250.0, "measuredGrams": 250.5},
                {"plateId": "p2", "targetGrams": 250.0, "measuredGrams": 249.8}
            ]
        )
        grav_res = verify_gravimetric_plating_endpoint(grav_req)
        self.assertTrue(grav_res["success"])
        self.assertTrue(grav_res["massConservationSatisfied"])
        print("  ✅ PASS: FastAPI Cyber-Physical Hardware endpoints validated.")

if __name__ == "__main__":
    unittest.main()

