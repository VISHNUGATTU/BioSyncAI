"""
BioSync AI - Multi-Item Perception & Plate Reconstruction Test Suite
Tests:
1. Multi-item dining plate segmentation (identifies multiple distinct items without collapsing).
2. Aggregated composite meal nutrition calculation in /api/v1/analyze.
3. Strict non-hallucination rejection on non-food scenes.
4. Single-item backward compatibility.
"""

import unittest
import numpy as np
import cv2
import io
import json
from fastapi.testclient import TestClient

from main import app
from vision_pipeline import vision_pipeline
from nutrition_db import nutrition_db


class TestMultiItemPerceptionEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.pipeline = vision_pipeline

    def _create_synthetic_multi_item_plate(self) -> bytes:
        """
        Creates a synthetic meal plate containing:
        - White granular mound (Steamed White Rice) on left
        - Golden yellow liquid region (Yellow Dal Tadka) on top right
        - Green leafy vegetable region (Spinach / Salad) on bottom right
        """
        img = np.full((400, 400, 3), 40, dtype=np.uint8) # Dark table background

        # Plate circle (light grey ceramic rim)
        cv2.circle(img, (200, 200), 180, (210, 210, 210), -1)
        cv2.circle(img, (200, 200), 170, (235, 235, 235), -1)

        # Region 1: Steamed White Rice (left side, white granular texture)
        # BGR (240, 240, 240) + random noise for grain texture
        noise = np.random.randint(-15, 15, (120, 100, 3), dtype=np.int16)
        rice_patch = np.clip(235 + noise, 0, 255).astype(np.uint8)
        img[140:260, 60:160] = rice_patch

        # Region 2: Yellow Dal Tadka (top right, golden-yellow amber hue)
        # HSV around H=28, S=180, V=200 -> BGR approx (30, 180, 220)
        img[60:160, 220:320] = (30, 185, 220)

        # Region 3: Green Salad / Spinach (bottom right, emerald green)
        # HSV around H=55, S=160, V=120 -> BGR approx (30, 150, 40)
        img[220:320, 220:320] = (30, 150, 40)

        _, buf = cv2.imencode(".jpg", img)
        return buf.tobytes()

    def test_01_multi_item_plate_detection(self):
        """Verifies perception pipeline detects multiple distinct items on a plate."""
        img_bytes = self._create_synthetic_multi_item_plate()
        result = self.pipeline.inspect_frame(img_bytes)

        self.assertTrue(result["identified"], "Plate with foods must be identified")
        self.assertGreaterEqual(result["detectedCount"], 2, "Must detect at least 2 distinct items on the plate")
        
        detected_names = [it["itemName"].lower() for it in result["items"]]
        print(f"PASSED: Multi-item plate detected {len(result['items'])} items: {detected_names}")

        # Verify distinct bounding boxes
        bboxes = [it["bbox"] for it in result["items"]]
        for i in range(len(bboxes)):
            for j in range(i + 1, len(bboxes)):
                # Ensure they are not overlapping identical boxes
                self.assertNotEqual(bboxes[i], bboxes[j], "Detected items must have distinct spatial bounding boxes")

    def test_02_api_analyze_composite_plate(self):
        """Verifies POST /api/v1/analyze aggregates nutrients and returns composite meal title."""
        img_bytes = self._create_synthetic_multi_item_plate()
        vitals = json.dumps({"fastingGlucose": 110, "systolicBP": 125, "hba1c": 5.7})

        res = self.client.post(
            "/api/v1/analyze",
            files={"file": ("plate.jpg", io.BytesIO(img_bytes), "image/jpeg")},
            data={"vitals": vitals}
        )

        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertTrue(data["identified"])

        res_data = data["data"]
        # Must have composite meal name or multiple items listed
        rec_name = res_data["recognizedItemName"]
        self.assertTrue("&" in rec_name or "Meal Plate" in rec_name or len(res_data["allDetectedItems"]) >= 2)
        
        # Must include allDetectedItems array
        self.assertIn("allDetectedItems", res_data)
        self.assertGreaterEqual(len(res_data["allDetectedItems"]), 2)

        # Must aggregate calories across the items
        total_calories = res_data["nutrients"]["calories"]
        self.assertGreater(total_calories, 150, "Aggregated meal calories must reflect multi-item plate")

        # Must include doctor hacks with sequencing
        doctor_hacks = res_data["doctorHacks"]
        self.assertGreaterEqual(len(doctor_hacks), 1)

        print(f"PASSED: /api/v1/analyze composite meal verified: '{rec_name}' ({total_calories} kcal, {len(res_data['allDetectedItems'])} items).")

    def test_03_strict_non_food_rejection(self):
        """Verifies clean non-hallucination refusal on metallic or monochrome non-food scenes."""
        # Flat metallic grey image with random dark lines (e.g. keyboard / laptop desk)
        img = np.full((300, 300, 3), 85, dtype=np.uint8)
        cv2.line(img, (20, 50), (280, 50), (50, 50, 50), 2)
        cv2.line(img, (20, 100), (280, 100), (50, 50, 50), 2)
        cv2.line(img, (20, 150), (280, 150), (50, 50, 50), 2)
        _, buf = cv2.imencode(".jpg", img)

        result = self.pipeline.inspect_frame(buf.tobytes())
        self.assertFalse(result["identified"], "Non-food metallic image must be rejected")
        self.assertEqual(result["detectedCount"], 0)
        self.assertIn("cannot identify any eatable food", result["message"].lower())
        print("PASSED: Strict non-hallucination refusal verified on non-food surface.")

    def test_04_single_item_backward_compatibility(self):
        """Verifies single item images continue to resolve accurately."""
        img = np.zeros((300, 300, 3), dtype=np.uint8)
        cv2.putText(img, "APPLE", (40, 160), cv2.FONT_HERSHEY_SIMPLEX, 1.4, (255, 255, 255), 2)
        _, buf = cv2.imencode(".jpg", img)

        res = self.client.post(
            "/api/v1/analyze",
            files={"file": ("apple.jpg", io.BytesIO(buf), "image/jpeg")}
        )

        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertTrue(data["identified"])
        self.assertEqual(data["data"]["recognizedItemName"], "Fresh Apple")
        print("PASSED: Single item backward compatibility verified (Apple).")


if __name__ == "__main__":
    unittest.main()
