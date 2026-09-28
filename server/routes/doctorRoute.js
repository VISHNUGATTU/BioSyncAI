import express from 'express';
import { 
  getDoctorSamplesOverview, 
  doctorStartProcessing, 
  doctorVerifyReport,
  doctorUpdateResultsStatus
} from '../controllers/doctorController.js';
import { authDoctor } from '../middlewares/authLabAssistant.js';

const doctorRouter = express.Router();

doctorRouter.use(authDoctor);

// 1. Doctor's Primary Task: Tri-state samples overview
doctorRouter.get('/samples/overview', getDoctorSamplesOverview);

// 2. Doctor starts analyzer run
doctorRouter.post('/samples/:sampleId/start-processing', doctorStartProcessing);

// 3. Doctor reviews & authorizes report
doctorRouter.post('/samples/:sampleId/verify', doctorVerifyReport);

// 4. Doctor updates results status (Results Done vs Res yet to be obtained)
doctorRouter.put('/samples/:sampleId/results-status', doctorUpdateResultsStatus);

export default doctorRouter;
