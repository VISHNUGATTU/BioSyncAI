"""
BioSync AI - Phase 9 Ralph Loop Verification Suite:
Vernacular Voice AI & Hands-Free Kitchen Audio Coach

Tests:
1. Multilingual language detection (hi, te, ta, mr, en)
2. Traditional Indian volumetric quantifiers (katori, chammach, roti, handi, glass)
3. Phonetic and vernacular dish mapping to the 130-item biophysical catalog
4. 7-compartment ODE in-silico glycemic forecasting & GLUT-4 ambulation calculation
5. Localized vernacular audio feedback script synthesis
6. Single-pot joint family plating audio directives with strict mass conservation
7. Direct FastAPI endpoint testing (/api/v1/voice/parse-and-simulate, /api/v1/voice/kitchen-coach)
"""

import sys
import unittest

from vernacular_voice_coach import vernacular_voice_coach
from main import (
    vernacular_voice_parse_endpoint,
    vernacular_kitchen_coach_endpoint,
    VernacularVoiceParseRequest,
    VernacularKitchenCoachRequest
)

class TestVernacularVoice(unittest.TestCase):

    def setUp(self):
        self.coach = vernacular_voice_coach

    def test_01_language_detection(self):
        """Test language detection across Indian regional languages."""
        self.assertEqual(self.coach.detect_language("Maine do roti khayi hai"), "hi")
        self.assertEqual(self.coach.detect_language("Nenu rendu ragi mudde tinnanu"), "te")
        self.assertEqual(self.coach.detect_language("Rendu idli saapten"), "ta")
        self.assertEqual(self.coach.detect_language("Me don bhakri khalli ahe"), "mr")
        self.assertEqual(self.coach.detect_language("I had two brown rice plates"), "en")
        print("  ✅ PASS: Regional language detection verified across Hindi, Telugu, Tamil, Marathi, English.")

    def test_02_traditional_volumetric_parsing(self):
        """Test parsing of traditional Indian volume units."""
        # 2 katori dal
        items = self.coach.parse_spoken_food_items("maine do katori dal tadka khayi")
        self.assertTrue(len(items) >= 1)
        dal_item = [it for it in items if "dal" in it["spokenPhrase"]][0]
        self.assertEqual(dal_item["quantity"], 2.0)
        self.assertEqual(dal_item["unit"], "katori")
        self.assertEqual(dal_item["weightGrams"], 300.0) # 2 * 150g = 300g
        print("  ✅ PASS: Traditional volume unit parsing verified (2 katori dal = 300g).")

    def test_03_telugu_phonetic_parsing(self):
        """Test parsing of Telugu dishes and numerals."""
        items = self.coach.parse_spoken_food_items("rendu ragi sankati mariyu chepala pulusu")
        self.assertTrue(len(items) >= 1)
        ragi_item = [it for it in items if "sankati" in it["spokenPhrase"] or "ragi" in it["spokenPhrase"]][0]
        self.assertEqual(ragi_item["quantity"], 2.0)
        print("  ✅ PASS: Telugu vernacular phonetic parsing verified (Rendu Ragi Sankati).")

    def test_04_tamil_phonetic_parsing(self):
        """Test parsing of Tamil breakfast items."""
        items = self.coach.parse_spoken_food_items("rendu idli oru cup sambar")
        self.assertTrue(len(items) >= 1)
        idli_item = [it for it in items if "idli" in it["spokenPhrase"]][0]
        self.assertEqual(idli_item["quantity"], 2.0)
        print("  ✅ PASS: Tamil breakfast parsing verified (2 Idli + Sambar).")

    def test_05_in_silico_simulation_and_audio_synthesis(self):
        """Test end-to-end voice food speech to biophysical simulation and spoken audio."""
        result = self.coach.process_vernacular_food_speech(
            transcript="Maine abhi do methi parathe aur ek katori dahi khayi",
            language="hi"
        )
        self.assertTrue(result["success"])
        self.assertEqual(result["detectedLanguage"], "hi")
        self.assertGreater(result["glycemicForecast"]["predictedPeakGlucose"], 120.0)
        self.assertGreater(result["ambulationPrescription"]["targetStepCount"], 0)
        self.assertTrue("Namaste" in result["spokenAudioScript"])
        self.assertTrue("GLUT-4" in result["spokenAudioScript"])
        print(f"  ✅ PASS: End-to-end Hindi simulation & audio advice generated (Peak: {result['glycemicForecast']['predictedPeakGlucose']:.1f} mg/dL, Walk: {result['ambulationPrescription']['recommendedWalkMinutes']} min).")

    def test_06_hands_free_kitchen_audio_coach(self):
        """Test single-pot family plating voice directives with strict mass conservation."""
        members = [
            {"memberId": "dadaji", "name": "Dadaji", "clinicalProfile": {"condition": "Type_2_Diabetes", "requiresPotassiumRestriction": True}},
            {"memberId": "papaji", "name": "Papaji", "clinicalProfile": {"condition": "Hypertension"}},
            {"memberId": "aman", "name": "Aman", "clinicalProfile": {"condition": "Athlete_Resistance"}}
        ]

        res = self.coach.generate_vernacular_kitchen_coaching(
            pot_size_grams=1200.0,
            dish_name="Hyderabadi Dum Biryani",
            family_members=members,
            language="hi"
        )

        self.assertTrue(res["success"])
        self.assertTrue(res["massConservationVerified"])
        self.assertEqual(res["totalPotGrams"], 1200.0)
        self.assertTrue(len(res["spokenStepByStepDirectives"]) >= 3)
        self.assertTrue("Mummyji" in res["spokenStepByStepDirectives"][0])
        print("  ✅ PASS: Hands-Free Kitchen Voice Coaching verified for 1200g Handi with mass conservation.")

    def test_07_fastapi_voice_parse_endpoint(self):
        """Test POST /api/v1/voice/parse-and-simulate endpoint."""
        req = VernacularVoiceParseRequest(
            transcript="Maine 2 roti aur 1 katori dal khayi",
            language="hi",
            userPhenotype={"fastingGlucose": 100.0, "insulinResistanceFactor": 1.2, "isDiabetic": False}
        )
        data = vernacular_voice_parse_endpoint(req)
        self.assertTrue(data["success"])
        self.assertIn("glycemicForecast", data)
        self.assertIn("spokenAudioScript", data)
        print("  ✅ PASS: POST /api/v1/voice/parse-and-simulate endpoint verified.")

    def test_08_fastapi_kitchen_coach_endpoint(self):
        """Test POST /api/v1/voice/kitchen-coach endpoint."""
        req = VernacularKitchenCoachRequest(
            potSizeGrams=1000.0,
            dishName="Dal Makhani",
            familyMembers=[
                {"memberId": "dadaji", "name": "Dadaji", "clinicalProfile": {"condition": "Type_2_Diabetes"}},
                {"memberId": "papaji", "name": "Papaji", "clinicalProfile": {"condition": "Hypertension"}}
            ],
            language="hi"
        )
        data = vernacular_kitchen_coach_endpoint(req)
        self.assertTrue(data["success"])
        self.assertTrue(data["massConservationVerified"])
        print("  ✅ PASS: POST /api/v1/voice/kitchen-coach endpoint verified.")

if __name__ == "__main__":
    unittest.main()

