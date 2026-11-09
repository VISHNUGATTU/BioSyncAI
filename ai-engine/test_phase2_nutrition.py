"""
BioSync AI - Phase 2 Comprehensive Test Suite
Tests Bio-Nutritional Decomposition Engine, Portion Scaling, Multi-Item Aggregation,
Strict Non-Hallucination Guardrails, and API Endpoints.
"""

import sys
import unittest
import numpy as np
import cv2
import io
import json
from nutrition_db import BioNutritionalDatabase, nutrition_db
from vision_pipeline import vision_pipeline
from main import get_nutrition_catalog, decompose_nutrition, NutritionDecomposeRequest, DecomposeItemInput, detect_items_in_frame
from starlette.datastructures import UploadFile


class TestBioNutritionalEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = nutrition_db

    def test_01_catalog_completeness(self):
        """Verifies catalog size and essential food categories exist."""
        catalog = self.db.list_catalog()
        self.assertGreaterEqual(len(catalog), 45, "Catalog should have at least 45 verified foods")
        categories = {item["category"] for item in catalog}
        self.assertIn("Raw_Produce", categories)
        self.assertIn("Cooked_Meals", categories)
        self.assertIn("Packaged_Groceries", categories)
        self.assertIn("Beverage_Dairy", categories)
        print(f"PASSED: Catalog completeness verified with {len(catalog)} items across {len(categories)} categories.")

    def test_02_decompose_raw_produce(self):
        """Tests decomposition of raw fruit with macros, minerals, vitamins, and GL."""
        apple = self.db.decompose("apple", quantity=1.0)
        self.assertIsNotNone(apple)
        self.assertEqual(apple["canonicalKey"], "apple")
        self.assertEqual(apple["displayName"], "Fresh Apple")
        self.assertEqual(apple["glycemicLoadCategory"], "Low")
        self.assertAlmostEqual(apple["nutrients"]["calories"], 78.0, places=1)
        self.assertAlmostEqual(apple["nutrients"]["fiber"], 3.6, places=1)
        self.assertAlmostEqual(apple["nutrients"]["potassium"], 160.5, places=1)
        self.assertAlmostEqual(apple["nutrients"]["vitaminC"], 6.9, places=1)
        print("PASSED: Raw produce decomposition verified (Apple: 78 kcal, Low GL).")

    def test_03_decompose_packaged_grocery(self):
        """Tests decomposition of packaged goods like Maggi noodles with brand and high GL."""
        maggi = self.db.decompose("maggi", quantity=1.0)
        self.assertIsNotNone(maggi)
        self.assertEqual(maggi["canonicalKey"], "maggi")
        self.assertEqual(maggi["brand"], "Nestle")
        self.assertEqual(maggi["glycemicLoadCategory"], "High")
        self.assertGreaterEqual(maggi["nutrients"]["sodium"], 800.0)
        self.assertAlmostEqual(maggi["nutrients"]["calories"], 380.0, places=1)
        print("PASSED: Packaged item decomposition verified (Maggi: 380 kcal, 860mg Sodium, High GL).")

    def test_04_portion_scaling_linearity(self):
        """Verifies mathematical linearity across fractional and multiple portions."""
        banana_1 = self.db.decompose("banana", quantity=1.0)
        banana_2 = self.db.decompose("banana", quantity=2.0)
        banana_half = self.db.decompose("banana", quantity=0.5)

        self.assertIsNotNone(banana_1)
        self.assertIsNotNone(banana_2)
        self.assertIsNotNone(banana_half)

        self.assertAlmostEqual(banana_2["nutrients"]["calories"], banana_1["nutrients"]["calories"] * 2.0, places=1)
        self.assertAlmostEqual(banana_half["nutrients"]["calories"], banana_1["nutrients"]["calories"] * 0.5, places=1)
        self.assertAlmostEqual(banana_2["servingWeightGrams"], banana_1["servingWeightGrams"] * 2)
        print("PASSED: Linear portion scaling verified across fractional and multi-portions.")

    def test_05_multi_item_meal_aggregation(self):
        """Tests multi-item composite meal aggregation (roti + dal + curd + salad)."""
        meal_keys = ["roti", "dal", "curd", "salad"]
        quantities = [2.0, 1.0, 1.0, 1.0]

        decomposed = []
        for key, q in zip(meal_keys, quantities):
            item = self.db.decompose(key, q)
            self.assertIsNotNone(item, f"Failed to decompose {key}")
            decomposed.append(item)

        aggregated = self.db.aggregate_nutrients(decomposed)
        self.assertEqual(aggregated["itemCount"], 4)
        self.assertGreater(aggregated["totalWeightGrams"], 400)
        self.assertGreater(aggregated["nutrients"]["calories"], 450)
        self.assertGreater(aggregated["nutrients"]["proteins"], 20)
        self.assertIn(aggregated["glycemicLoadCategory"], ["Low", "Medium", "High"])
        print(f"PASSED: Multi-item meal aggregation verified: {aggregated['nutrients']['calories']} kcal, {aggregated['nutrients']['proteins']}g protein, Total GL: {aggregated['totalGlycemicLoad']}.")

    def test_06_strict_non_hallucination_guardrails(self):
        """Verifies honest rejection when encountering non-food items."""
        non_foods = ["laptop", "smartphone", "plastic_bottle", "car_engine", "table_wood"]
        for non_food in non_foods:
            result = self.db.decompose(non_food)
            self.assertIsNone(result, f"Engine hallucinated nutrients for non-food: {non_food}")

        print("PASSED: Strict non-hallucination guardrail verified on 5 non-food items.")

    def test_07_api_decompose_endpoint(self):
        """Tests POST /api/v1/nutrition-decompose endpoint."""
        items = [
            DecomposeItemInput(itemName="Nestle Maggi Noodles", quantity=1.0),
            DecomposeItemInput(itemName="Amul Curd", quantity=1.0),
            DecomposeItemInput(itemName="Unknown Gadget", quantity=1.0)
        ]
        req = NutritionDecomposeRequest(items=items)
        data = decompose_nutrition(req)
        self.assertTrue(data["success"])
        self.assertEqual(data["resolvedCount"], 2)
        self.assertEqual(data["unresolvedCount"], 1)
        self.assertEqual(data["unrecognizedItems"][0]["itemName"], "Unknown Gadget")
        self.assertIsNotNone(data["aggregatedMealNutrition"])
        print("PASSED: POST /api/v1/nutrition-decompose endpoint verified with mixed items and explicit refusal.")

    def test_08_api_catalog_endpoint(self):
        """Tests GET /api/v1/nutrition-catalog endpoint."""
        data = get_nutrition_catalog()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(data["totalItems"], 45)
        self.assertGreaterEqual(len(data["categories"]), 4)
        print("PASSED: GET /api/v1/nutrition-catalog endpoint verified.")

    def test_09_vision_to_nutrition_integration(self):
        """Tests auto-enrichment of detected visual items with Phase 2 nutrition profile."""
        img = np.full((400, 400, 3), 40, dtype=np.uint8)
        cv2.circle(img, (200, 200), 180, (210, 210, 210), -1)
        # Golden Yellow Dal region (recognized by native OpenCV spectral classifier)
        img[80:200, 150:280] = (30, 185, 220)
        _, buf = cv2.imencode(".jpg", img)
        upload_file = UploadFile(filename="frame.jpg", file=io.BytesIO(buf.tobytes()))
        data = detect_items_in_frame(file=upload_file)
        if hasattr(data, 'body'):
            data = json.loads(data.body.decode())
        self.assertTrue(data.get("identified"))
        item0 = data["items"][0]
        self.assertIsNotNone(item0.get("nutritionProfile"))
        self.assertIn("calories", item0["nutritionProfile"]["nutrients"])
        print(f"PASSED: Visual detection automatically enriched with nutrition profile (Item: {item0['itemName']}, Calories: {item0['nutritionProfile']['nutrients']['calories']}).")


if __name__ == "__main__":
    unittest.main()
