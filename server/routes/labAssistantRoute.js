import express from 'express';
import { 
  loginLabAssistant, getPendingAppointments, updateAppointmentStatus, 
  updateLiveLocation, collectSampleAndCOD, rejectSample, bulkLaboratoryDropoff, 
  getProfile, updateProfile, uploadCollectionEvidence, getCollectedSamples, getDashboardKPIs,
  getAppointmentsByCategory, getProcessingQueue, startSampleProcessing, submitTestResults, getEarnings,
  getAllAssistantSamples, recordAppointmentVitals, getAppointmentVitals,
  updateSampleResultsStatus, checkBarcodeAvailability, generateUniqueBarcode
} from '../controllers/labAssistantController.js';
import { authLabAssistant } from '../middlewares/authLabAssistant.js';
import { auditLogger } from '../middlewares/auditMiddleware.js';
import { memoryUpload } from '../configs/multer.js';

const labAssistantRouter = express.Router();
labAssistantRouter.post('/login', loginLabAssistant);
labAssistantRouter.use(authLabAssistant);

// Barcode Verification & Generation Endpoints
labAssistantRouter.get('/barcode/check/:barcode', checkBarcodeAvailability);
labAssistantRouter.get('/barcode/generate', generateUniqueBarcode);

labAssistantRouter.get('/kpis', getDashboardKPIs);
labAssistantRouter.get('/earnings', getEarnings);
labAssistantRouter.get('/appointments/category/:category', getAppointmentsByCategory);
labAssistantRouter.get('/appointments/pending', getPendingAppointments);
labAssistantRouter.put('/location', updateLiveLocation);
labAssistantRouter.put('/appointments/:id/status', updateAppointmentStatus);
labAssistantRouter.get('/profile', getProfile);
labAssistantRouter.put('/profile', updateProfile);
labAssistantRouter.put('/appointments/:appointmentId/sample/collect', auditLogger('Sample'), collectSampleAndCOD);
labAssistantRouter.post('/appointments/:appointmentId/sample/reject', auditLogger('Sample'), rejectSample);
labAssistantRouter.post('/appointments/:appointmentId/vitals', auditLogger('Vitals'), recordAppointmentVitals);
labAssistantRouter.get('/appointments/:appointmentId/vitals', getAppointmentVitals);
labAssistantRouter.get('/samples/collected', getCollectedSamples);
labAssistantRouter.get('/samples/all', getAllAssistantSamples);
labAssistantRouter.put('/samples/dropoff', auditLogger('Sample'), bulkLaboratoryDropoff);
labAssistantRouter.post('/samples/:sampleId/evidence', memoryUpload.single('evidenceImage'), auditLogger('Sample'), uploadCollectionEvidence);
labAssistantRouter.get('/samples/queue', getProcessingQueue);
labAssistantRouter.post('/samples/:sampleId/process', auditLogger('Sample'), startSampleProcessing);
labAssistantRouter.post('/samples/:sampleId/results', auditLogger('Sample'), submitTestResults);
labAssistantRouter.put('/samples/:sampleId/results-status', auditLogger('Sample'), updateSampleResultsStatus);
export default labAssistantRouter;