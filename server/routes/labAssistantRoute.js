import express from 'express';
import { 
  loginLabAssistant, getPendingAppointments, updateAppointmentStatus, 
  updateLiveLocation, collectSampleAndCOD, bulkLaboratoryDropoff, 
  updateProfile, uploadCollectionEvidence
} from '../controllers/labAssistantController.js';
import { authLabAssistant } from '../middlewares/authLabAssistant.js';
import { auditLogger } from '../middlewares/auditMiddleware.js';
import { memoryUpload } from '../configs/multer.js';

const labAssistantRouter = express.Router();
labAssistantRouter.post('/login', loginLabAssistant);
labAssistantRouter.use(authLabAssistant);
labAssistantRouter.get('/appointments/pending', getPendingAppointments);
labAssistantRouter.put('/location', updateLiveLocation);
labAssistantRouter.put('/appointments/:id/status', updateAppointmentStatus);
labAssistantRouter.put('/profile', updateProfile);
labAssistantRouter.put('/samples/:sampleId/collect', auditLogger('Sample'), collectSampleAndCOD);
labAssistantRouter.put('/samples/dropoff', auditLogger('Sample'), bulkLaboratoryDropoff);
labAssistantRouter.post('/samples/:sampleId/evidence', memoryUpload.single('evidenceImage'), auditLogger('Sample'), uploadCollectionEvidence);
export default labAssistantRouter;