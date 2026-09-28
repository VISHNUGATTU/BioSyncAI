import express from 'express';
import { 
  addManualVitals, 
  extractReportVitals,
  confirmExtractedVitals,
  uploadPdfVitals, 
  getLatestVitals,
  getVitalsHistory,
  getVitalsTrends
} from '../controllers/vitalsController.js';
import { authUser } from '../middlewares/authUser.js';
import { memoryUpload } from '../configs/multer.js'; 

const vitalsRouter = express.Router();

// Baseline and vitals submission
vitalsRouter.post('/manual', authUser, addManualVitals);

// Report upload, OCR extraction, and user review confirmation
vitalsRouter.post('/extract-report', authUser, memoryUpload.single('reportFile'), extractReportVitals);
vitalsRouter.post('/confirm-extracted', authUser, confirmExtractedVitals);

// Legacy direct upload fallback
vitalsRouter.post('/pdf', authUser, memoryUpload.single('vitalsPdf'), uploadPdfVitals);

// Vitals querying & analytics for mobile charts
vitalsRouter.get('/latest', authUser, getLatestVitals);
vitalsRouter.get('/history', authUser, getVitalsHistory);
vitalsRouter.get('/trends', authUser, getVitalsTrends);

export default vitalsRouter;