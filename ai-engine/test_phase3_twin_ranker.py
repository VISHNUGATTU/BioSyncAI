"""
BioSync AI - Phase 3 Comprehensive Test Suite
Tests Confined Personal Metabolic Digital Twin, Multi-Objective Clinical Pareto Ranker,
Empathetic Doctor Hacks Generation, and API Endpoints.
"""

import unittest
import numpy as np
import cv2
import io
import json
from fastapi.testclient import TestClient

from metabolic_twin import MetabolicDigitalTwin
from clinical_ranker import ClinicalParetoRanker, clinical_ranker
from main import app


class TestPhase3DigitalTwinAndRanker(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.ranker = clinical_ranker

    def test_01_digital_twin_phenotyping(self):
        """Verifies digital twin properly stratifies metabolic phenotypes."""
        # Baseline normal patient
        twin_norm = MetabolicDigitalTwin(fasting_glucose=88, hba1c=5.1, systolic_bp=118, diastolic_bp=78)
        p_norm = twin_norm.get_clinical_phenotype()
        self.assertEqual(p_norm["overallRiskLevel"], "Optimal")
        self.assertFalse(p_norm["isInsulinResistant"])
        self.assertFalse(p_norm["isSaltSensitive"])

        # Insulin-resistant / pre-diabetic patient
        twin_prediab = MetabolicDigitalTwin(fasting_glucose=112, hba1c=5.9, systolic_bp=124)
        p_prediab = twin_prediab.get_clinical_phenotype()
        self.assertTrue(p_prediab["isInsulinResistant"])
        self.assertGreater(p_prediab["betaCarb"], p_norm["betaCarb"])

        # Hypertensive patient
        twin_htn = MetabolicDigitalTwin(systolic_bp=142, diastolic_bp=92)
        p_htn = twin_htn.get_clinical_phenotype()
        self.assertTrue(p_htn["isSaltSensitive"])
        self.assertGreater(p_htn["betaSodium"], p_norm["betaSodium"])

        print("PASSED: Digital twin phenotyping & sensitivity calibration verified.")

    def test_02_forward_surge_simulation(self):
        """Verifies forward vital projection scales with patient glycemic and salt sensitivity."""
        twin_diab = MetabolicDigitalTwin(fasting_glucose=135, hba1c=6.8)
        twin_norm = MetabolicDigitalTwin(fasting_glucose=85, hba1c=5.0)

        # 50g net carbs at GI 65
        surge_diab = twin_diab.predict_food_impact(net_carbs=50, sodium_mg=600, glycemic_index=65)
        surge_norm = twin_norm.predict_food_impact(net_carbs=50, sodium_mg=600, glycemic_index=65)

        self.assertGreater(surge_diab["predictedGlucoseSpike"], surge_norm["predictedGlucoseSpike"])
        print(f"PASSED: Forward vital projection verified (Normal spike: +{surge_norm['predictedGlucoseSpike']} vs Diabetic: +{surge_diab['predictedGlucoseSpike']} mg/dL).")

    def test_03_pareto_ranking_for_prediabetic(self):
        """Verifies Pareto ranker places low-GL, high-protein/fiber items above high-carb foods."""
        twin = MetabolicDigitalTwin(fasting_glucose=118, hba1c=6.0, systolic_bp=135)
        candidates = [
            {"itemName": "maggi"},
            {"itemName": "dal"},
            {"itemName": "curd"},
            {"itemName": "apple"}
        ]

        result = self.ranker.rank_candidates(candidates, twin)
        self.assertTrue(result["success"])
        self.assertEqual(result["totalCandidatesEvaluated"], 4)

        ranked = result["rankedItems"]
        # Dal and Curd should rank above Maggi for an insulin-resistant patient
        dal_rank = next(r["rank"] for r in ranked if r["canonicalKey"] == "dal")
        maggi_rank = next(r["rank"] for r in ranked if r["canonicalKey"] == "maggi")
        self.assertLess(dal_rank, maggi_rank, "Dal should outrank Maggi for a pre-diabetic patient")
        self.assertEqual(ranked[0]["rank"], 1)
        self.assertIn("Optimal Choice", ranked[0]["clinicalTier"])
        print(f"PASSED: Pareto ranking verified. Top item: {result['bestSuggestableItem']['displayName']} (Rank 1).")

    def test_04_doctor_hacks_generation(self):
        """Verifies realistic, non-preachy harm-reduction doctor hacks are provided."""
        twin = MetabolicDigitalTwin(fasting_glucose=120, hba1c=6.1, systolic_bp=138)
        candidates = [{"itemName": "maggi"}]

        result = self.ranker.rank_candidates(candidates, twin)
        maggi_res = result["rankedItems"][0]
        hacks = maggi_res["doctorHacks"]

        self.assertGreaterEqual(len(hacks), 3, "Should provide at least 3 actionable doctor hacks")
        hack_types = [h["type"] for h in hacks]
        self.assertIn("Sequencing Hack", hack_types)
        self.assertIn("Nutritional Pairing Hack", hack_types)
        self.assertIn("Biochemical Movement Hack", hack_types)

        # Check action content contains realistic guidance (e.g. 10 mins walk, GLUT4, or salad first)
        all_actions = " ".join(h["action"] for h in hacks)
        self.assertTrue("walk" in all_actions.lower() or "stroll" in all_actions.lower() or "glut4" in all_actions.lower())
        self.assertTrue("fiber" in all_actions.lower() or "salad" in all_actions.lower() or "curd" in all_actions.lower())
        print("PASSED: Actionable, empathetic doctor hacks verified for high-GL meal.")

    def test_05_clinical_rationale_explanation(self):
        """Verifies personalized clinical rationale matches the patient's active biomarkers."""
        twin = MetabolicDigitalTwin(fasting_glucose=125, hba1c=6.2, systolic_bp=136)
        candidates = [{"itemName": "curd"}, {"itemName": "chips"}]

        result = self.ranker.rank_candidates(candidates, twin)
        rationale = result["clinicalRationale"]
        self.assertIn("fasting glucose", rationale.lower())
        self.assertIn("blood pressure", rationale.lower())
        self.assertIn(result["bestSuggestableItem"]["displayName"], rationale)
        print("PASSED: Personalized clinical rationale verified.")

    def test_06_non_food_rejection_in_ranking(self):
        """Verifies non-food items are rejected and do not corrupt clinical rankings."""
        twin = MetabolicDigitalTwin()
        candidates = [{"itemName": "laptop"}, {"itemName": "smartphone"}]

        result = self.ranker.rank_candidates(candidates, twin)
        self.assertFalse(result["success"])
        self.assertEqual(len(result["rankedItems"]), 0)
        print("PASSED: Non-food items cleanly rejected by clinical ranker without hallucination.")

    def test_07_api_clinical_rank_endpoint(self):
        """Tests POST /api/v1/clinical-rank HTTP endpoint."""
        payload = {
            "items": [
                {"itemName": "Maggi 2-Minute Masala Noodles"},
                {"itemName": "Fresh Apple"},
                {"itemName": "Plain Fresh Curd"}
            ],
            "vitals": {
                "fastingGlucose": 115,
                "hba1c": 5.9,
                "systolicBP": 130
            },
            "mealContext": "Lunch"
        }
        res = self.client.post("/api/v1/clinical-rank", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["totalCandidatesEvaluated"], 3)
        self.assertIn("Pre-Diabetic", data["patientPhenotype"])
        self.assertIsNotNone(data["bestSuggestableItem"])
        self.assertGreaterEqual(len(data["rankedItems"]), 3)
        print("PASSED: POST /api/v1/clinical-rank endpoint verified.")

    def test_08_api_analyze_with_vitals_integration(self):
        """Tests POST /api/v1/analyze passes vitals and receives doctor hacks & ranking."""
        img = np.zeros((300, 300, 3), dtype=np.uint8)
        cv2.putText(img, "MAGGI NOODLES", (30, 150), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 2)
        _, buf = cv2.imencode(".jpg", img)

        vitals_json = json.dumps({"fastingGlucose": 120, "systolicBP": 135, "hba1c": 6.0})

        res = self.client.post(
            "/api/v1/analyze",
            files={"file": ("maggi.jpg", io.BytesIO(buf), "image/jpeg")},
            data={"vitals": vitals_json}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        analysis = data["data"]
        self.assertIn("doctorHacks", analysis)
        self.assertGreaterEqual(len(analysis["doctorHacks"]), 2)
        self.assertIn("clinicalRanking", analysis)
        self.assertIsNotNone(analysis["clinicalRanking"])
        self.assertIn("personalizedInsight", analysis)
        print("PASSED: POST /api/v1/analyze integrated with vitals, doctor hacks, and ranking.")


if __name__ == "__main__":
    unittest.main()
