import express from 'express';
import { 
  getDoctorSamplesOverview, 
  doctorStartProcessing, 
  doctorVerifyReport,
  doctorUpdateResultsStatus,
  secondaryDoctorVerifyReport,
  verifySampleCustody
} from '../controllers/doctorController.js';
import { authDoctor } from '../middlewares/authLabAssistant.js';

const doctorRouter = express.Router();

doctorRouter.use(authDoctor);

// 1. Doctor's Primary Task: Tri-state samples overview
doctorRouter.get('/samples/overview', getDoctorSamplesOverview);

// 2. Doctor starts analyzer run
doctorRouter.post('/samples/:sampleId/start-processing', doctorStartProcessing);

// 3. Doctor reviews & authorizes report (with automated panic scan)
doctorRouter.post('/samples/:sampleId/verify', doctorVerifyReport);

// 4. Secondary Pathologist STAT Sign-off for Critical Panic Breaches
doctorRouter.post('/samples/:sampleId/secondary-verify', secondaryDoctorVerifyReport);

// 5. Verify Cryptographic Chain-of-Custody (SHA-256 Non-Repudiation)
doctorRouter.get('/samples/:sampleId/custody-verification', verifySampleCustody);

// 6. Doctor updates results status (Results Done vs Res yet to be obtained)
doctorRouter.put('/samples/:sampleId/results-status', doctorUpdateResultsStatus);

export default doctorRouter;
