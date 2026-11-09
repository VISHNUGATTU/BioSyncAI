import express from 'express';
import {
  handleGenerateOtp,
  handleVerifyOtp,
  handleLinkAbha,
  handleGetAbhaProfile,
  handleDiscoverCareContexts,
  handleInitiateCareContextLink,
  handleConfirmCareContextLink,
  handleTransferFhirBundle,
  handleInitiateConsentRequest,
  handleIngestExternalFhir
} from '../controllers/abdmController.js';

const router = express.Router();

// Milestone 1 (M1): ABHA Onboarding & Identity Linking
router.post('/m1/generate-otp', handleGenerateOtp);
router.post('/m1/verify-otp', handleVerifyOtp);
router.post('/m1/link-user', handleLinkAbha);
router.get('/m1/profile', handleGetAbhaProfile);

// Milestone 2 (M2): Health Information Provider (HIP)
router.post('/m2/discover-contexts', handleDiscoverCareContexts);
router.post('/m2/link/init', handleInitiateCareContextLink);
router.post('/m2/link/confirm', handleConfirmCareContextLink);
router.post('/m2/transfer-fhir', handleTransferFhirBundle);

// Milestone 3 (M3): Health Information User (HIU)
router.post('/m3/consent/init', handleInitiateConsentRequest);
router.post('/m3/ingest-ehr', handleIngestExternalFhir);

export default router;

