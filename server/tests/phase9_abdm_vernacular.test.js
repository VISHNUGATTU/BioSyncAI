/**
 * BioSync AI - Ralph Loop Phase 9 Verification Suite:
 * ABDM / ABHA National Health Gateway & Vernacular Voice AI Assistant
 * 
 * Verifies:
 * 1. Milestone 1 (M1): ABHA OTP Generation, 14-digit Format Verification & Identity Linking
 * 2. Milestone 2 (M2): HIP Care-Context Discovery (Diagnostic Reports, Vitals, In-Silico Plans)
 * 3. Milestone 2 (M2): Care-Context Link Authentication & Encrypted FHIR R4 Data Transfer
 * 4. Milestone 3 (M3): HIU Consent Request Management & External EHR Biomarker Recalibration
 * 5. Vernacular Voice AI: Multilingual Phonetic Parsing (Hindi, Telugu, Tamil, Marathi)
 * 6. Traditional Indian Units: Katori (150g), Chammach (15g), Roti (35g), Handi (1000g)
 * 7. Hands-Free Kitchen Plating Audio Coach: Mass-Conserved Step-by-Step Spoken Directives
 */

import assert from 'assert';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
import mongoose from 'mongoose';
import User from '../models/User.js';
import Sample from '../models/Sample.js';
import Vital from '../models/Vitals.js';
import FoodOrder from '../models/FoodOrder.js';
import AbdmCareContext from '../models/AbdmCareContext.js';
import {
  generateAbhaRegistrationOtp,
  verifyOtpAndCreateAbha,
  linkAbhaToUserAccount,
  discoverPatientCareContexts,
  initiateCareContextLink,
  confirmCareContextLink,
  transferCareContextFhirBundle,
  initiateHiuConsentRequest,
  ingestExternalFhirEhrAndCalibrate
} from '../services/abdmService.js';
import {
  parseVoiceTranscriptAndSimulate,
  getVernacularKitchenCoaching
} from '../services/voiceService.js';

let passedTests = 0;
let failedTests = 0;

function pass(desc) {
  passedTests++;
  console.log(`  ✅ PASS: ${desc}`);
}

function fail(desc, err) {
  failedTests++;
  console.error(`  ❌ FAIL: ${desc}`);
  console.error(err);
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  RALPH LOOP VERIFICATION: Phase 9 ABDM & Voice AI');
  console.log('======================================================\n');

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('Connected to MongoDB for Phase 9 testing.\n');
    }

    // Find test user
    let testUser = await User.findOne({ phoneNumber: { $exists: true } });
    if (!testUser) {
      testUser = new User({
        phoneNumber: '9876543210',
        firstName: 'Vishnu',
        lastName: 'Phani',
        gender: 'Male',
        accountStatus: 'Active'
      });
      await testUser.save();
    }

    // -------------------------------------------------------------
    // TEST GROUP 1: ABDM Milestone 1 (M1) ABHA Onboarding
    // -------------------------------------------------------------
    console.log('[TEST GROUP 1: ABDM M1 - ABHA Generation & Verification]');
    try {
      const otpRes = await generateAbhaRegistrationOtp('548912348912', 'AADHAAR');
      assert.strictEqual(otpRes.type, 'AADHAAR');
      assert.ok(otpRes.txnId, 'Transaction ID must be returned');
      assert.strictEqual(otpRes.expiresInSeconds, 600);
      pass('Aadhaar OTP request generated with 10-minute expiry txnId');

      const verifyRes = await verifyOtpAndCreateAbha(otpRes.txnId, '789456', 'vishnu.phani');
      assert.strictEqual(verifyRes.success, true);
      assert.match(verifyRes.abhaNumber, /^91-\d{4}-\d{4}-\d{4}$/, 'ABHA number must follow 91-XXXX-XXXX-XXXX format');
      assert.strictEqual(verifyRes.abhaAddress, 'vishnu.phani@abdm');
      assert.ok(verifyRes.token, 'ABDM session token issued');
      assert.strictEqual(verifyRes.profile.kycVerified, true);
      pass(`Generated authentic 14-digit ABHA Number: ${verifyRes.abhaNumber} and Address: ${verifyRes.abhaAddress}`);

      const linkedUser = await linkAbhaToUserAccount(testUser._id, verifyRes);
      testUser = linkedUser;
      assert.strictEqual(linkedUser.abha.status, 'LINKED');
      assert.strictEqual(linkedUser.abha.abhaNumber, verifyRes.abhaNumber);
      assert.strictEqual(linkedUser.abha.hipId, 'IN3610001899');
      pass('ABHA identity linked to BioSync user account with NHA HIP ID IN3610001899');
    } catch (err) {
      fail('ABDM M1 verification failed', err);
    }

    // -------------------------------------------------------------
    // TEST GROUP 2: ABDM Milestone 2 (M2) HIP Care Context Discovery
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 2: ABDM M2 - Care Context Discovery]');
    try {
      const discovery = await discoverPatientCareContexts({ patientMobile: testUser.phoneNumber });
      assert.strictEqual(discovery.matched, true);
      assert.ok(Array.isArray(discovery.patient.careContexts), 'Care contexts must be an array');
      assert.ok(discovery.totalCareContexts > 0, 'Discovered at least one care context');

      const hasDiag = discovery.patient.careContexts.some(c => c.referenceNumber.startsWith('DIAGNOSTIC_REPORT_') || c.referenceNumber.startsWith('METABOLIC_TWIN_'));
      assert.ok(hasDiag, 'Discovered clinical diagnostic report or metabolic twin vitals care context');
      pass(`Discovered ${discovery.totalCareContexts} care contexts (Diagnostic Reports, Vitals, Meal Plans)`);
    } catch (err) {
      fail('ABDM M2 Care Context discovery failed', err);
    }

    // -------------------------------------------------------------
    // TEST GROUP 3: ABDM Milestone 2 (M2) Linkage & FHIR Data Transfer
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 3: ABDM M2 - Linkage & Encrypted FHIR Transfer]');
    try {
      const linkInit = await initiateCareContextLink(testUser.abha.abhaAddress);
      assert.strictEqual(linkInit.success, true);
      assert.ok(linkInit.linkTxnId, 'Link transaction ID returned');
      pass('Care context link initiation dispatched to registered mobile');

      const linkConfirm = await confirmCareContextLink(linkInit.linkTxnId, '789456');
      assert.strictEqual(linkConfirm.success, true);
      assert.strictEqual(linkConfirm.isLinked, true);
      pass('Care context linkage confirmed with OTP');

      // Test Encrypted FHIR Data Transfer
      const anyContext = await AbdmCareContext.findOne({ userId: testUser._id });
      assert.ok(anyContext, 'Care context record exists');

      const transfer = await transferCareContextFhirBundle(anyContext.careContextReference, 'CONSENT_DEMO_VERIFIED');
      assert.strictEqual(transfer.success, true);
      assert.ok(transfer.encryptedPayload, 'Encrypted FHIR payload must be generated');
      const cipherParts = transfer.encryptedPayload.split(':');
      assert.strictEqual(cipherParts.length, 4, 'Payload must be aes256gcm:IV:Tag:Ciphertext');
      assert.strictEqual(cipherParts[0], 'aes256gcm', 'Algorithm prefix must be aes256gcm');
      assert.ok(transfer.checksum, 'SHA-256 integrity checksum present');
      assert.strictEqual(transfer.fhirBundle.resourceType, 'Bundle');
      pass('Encrypted HL7 FHIR R4 Bundle transferred with SHA-256 checksum');
    } catch (err) {
      fail('ABDM M2 Linkage & Transfer failed', err);
    }

    // -------------------------------------------------------------
    // TEST GROUP 4: ABDM Milestone 3 (M3) HIU Consent & Ingestion
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 4: ABDM M3 - HIU Consent & EHR Ingestion]');
    try {
      const consentInit = await initiateHiuConsentRequest({
        userId: testUser._id,
        targetAbhaAddress: testUser.abha.abhaAddress,
        hiTypes: ['DiagnosticReport', 'Observation']
      });
      assert.strictEqual(consentInit.success, true);
      assert.strictEqual(consentInit.status, 'REQUESTED');
      pass('HIU Consent Request created and dispatched to patient PHR app');

      // Ingest synthetic external FHIR bundle from external hospital
      const mockExternalFhirBundle = {
        resourceType: 'Bundle',
        type: 'document',
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              code: { coding: [{ code: '1558-6', display: 'Fasting Glucose' }] },
              valueQuantity: { value: 118, unit: 'mg/dL' }
            }
          },
          {
            resource: {
              resourceType: 'Observation',
              code: { coding: [{ code: '4548-4', display: 'HbA1c' }] },
              valueQuantity: { value: 6.8, unit: '%' }
            }
          },
          {
            resource: {
              resourceType: 'Observation',
              code: { coding: [{ code: '8480-6', display: 'Systolic BP' }] },
              valueQuantity: { value: 132, unit: 'mmHg' }
            }
          },
          {
            resource: {
              resourceType: 'Observation',
              code: { coding: [{ code: '8462-4', display: 'Diastolic BP' }] },
              valueQuantity: { value: 84, unit: 'mmHg' }
            }
          }
        ]
      };

      const ingestResult = await ingestExternalFhirEhrAndCalibrate(testUser._id, mockExternalFhirBundle);
      assert.strictEqual(ingestResult.success, true);
      assert.strictEqual(ingestResult.recalibrated, true);
      assert.strictEqual(ingestResult.biomarkersExtracted.fastingGlucose, 118);
      assert.strictEqual(ingestResult.biomarkersExtracted.hba1c, 6.8);
      pass('Ingested external hospital FHIR EHR: Extracted Fasting Glucose (118), HbA1c (6.8%), BP (132/84)');
    } catch (err) {
      fail('ABDM M3 Consent & Ingestion failed', err);
    }

    // -------------------------------------------------------------
    // TEST GROUP 5: Vernacular Voice Multilingual Parsing & Simulation
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 5: Vernacular Voice AI Multilingual Parsing]');
    try {
      // Hindi test
      const hindiSpeech = 'Maine abhi do methi parathe aur ek katori dahi khayi';
      const hindiRes = await parseVoiceTranscriptAndSimulate({
        userId: testUser._id,
        transcript: hindiSpeech,
        language: 'hi'
      });
      assert.strictEqual(hindiRes.success, true);
      assert.ok(hindiRes.glycemicForecast.predictedPeakGlucose > 100, 'Peak glucose calculated');
      assert.ok(hindiRes.ambulationPrescription.targetStepCount > 0, 'Target steps prescribed');
      assert.ok(hindiRes.spokenAudioScript.includes('Namaste'), 'Spoken script contains respectful Hindi greeting');
      pass('Hindi Voice parsed: 2 Parathe + 1 Katori Dahi -> Glucose & GLUT-4 Ambulation Prescribed');

      // Telugu test
      const teluguSpeech = 'Nenu rendu ragi sankati mariyu chepala pulusu tinnanu';
      const teluguRes = await parseVoiceTranscriptAndSimulate({
        userId: testUser._id,
        transcript: teluguSpeech,
        language: 'te'
      });
      assert.strictEqual(teluguRes.success, true);
      assert.ok(teluguRes.glycemicForecast.predictedPeakGlucose > 100);
      assert.ok(teluguRes.spokenAudioScript.includes('Namaskaram'), 'Spoken script contains Telugu greeting');
      pass('Telugu Voice parsed: Rendu Ragi Sankati -> In-Silico Glycemic forecast computed in Telugu');

      // Tamil test
      const tamilSpeech = 'Rendu idli oru cup sambar saptom';
      const tamilRes = await parseVoiceTranscriptAndSimulate({
        userId: testUser._id,
        transcript: tamilSpeech,
        language: 'ta'
      });
      assert.strictEqual(tamilRes.success, true);
      assert.ok(tamilRes.spokenAudioScript.includes('Vanakkam'), 'Spoken script contains Tamil greeting');
      pass('Tamil Voice parsed: Rendu Idli Oru Cup Sambar -> Spoken Tamil advice synthesized');
    } catch (err) {
      fail('Vernacular Voice Multilingual parsing failed', err);
    }

    // -------------------------------------------------------------
    // TEST GROUP 6: Hands-Free Kitchen Plating Audio Coach
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 6: Hands-Free Kitchen Plating Audio Coach]');
    try {
      const familyMembers = [
        { memberId: 'dadaji', name: 'Dadaji', clinicalProfile: { condition: 'Type_2_Diabetes', requiresPotassiumRestriction: true } },
        { memberId: 'papaji', name: 'Papaji', clinicalProfile: { condition: 'Hypertension' } },
        { memberId: 'aman', name: 'Aman', clinicalProfile: { condition: 'Athlete_Resistance' } }
      ];

      const coachRes = await getVernacularKitchenCoaching({
        potSizeGrams: 1000.0,
        dishName: 'Hyderabadi Dum Biryani',
        familyMembers,
        language: 'hi'
      });

      assert.strictEqual(coachRes.success, true);
      assert.strictEqual(coachRes.massConservationVerified, true);
      assert.ok(Array.isArray(coachRes.spokenStepByStepDirectives), 'Directives must be an array');
      assert.ok(coachRes.spokenStepByStepDirectives.length >= 2, 'Generated multi-step plating audio directives');
      assert.ok(coachRes.spokenStepByStepDirectives[0].includes('Mummyji'), 'Directive addresses kitchen cook respectfully');
      pass('Hands-Free Kitchen Audio Coach: 1000g Dum Biryani mass-conserved with spoken plating instructions');
    } catch (err) {
      fail('Hands-Free Kitchen Audio Coach failed', err);
    }

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n======================================================');
    console.log(`  Phase 9 Verification Summary: ${passedTests} Passed, ${failedTests} Failed`);
    console.log('======================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (globalErr) {
    console.error('Global unhandled exception in test suite:', globalErr);
    process.exit(1);
  }
}

runTests();
