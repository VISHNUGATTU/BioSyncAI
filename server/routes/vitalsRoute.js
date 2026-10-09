import express from 'express';
import { 
  addManualVitals, 
  extractReportVitals,
  confirmExtractedVitals,
  uploadPdfVitals, 
  getLatestVitals,
  getVitalsHistory,
  getVitalsTrends,
  getAIFeatureVector,
  calibrateWeeklyVitals,
  getLiveIoTTelemetryStream,
  getLatestIoTReading,
  ingestIoTTelemetry
} from '../controllers/vitalsController.js';
import { authUser } from '../middlewares/authUser.js';
import { memoryUpload } from '../configs/multer.js'; 

const vitalsRouter = express.Router();

// Real-Time 1-Second Biometric IoT Watch / Wearable Telemetry
vitalsRouter.get('/iot-stream', authUser, getLiveIoTTelemetryStream);
vitalsRouter.get('/iot-latest', authUser, getLatestIoTReading);
vitalsRouter.post('/iot-telemetry', ingestIoTTelemetry);

// Weekly adaptive digital twin calibration via EKF
vitalsRouter.post('/calibrate-weekly', authUser, calibrateWeeklyVitals);

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

// Standardized AI Feature Vector & Physiological Risk Classification
vitalsRouter.get('/ai-features', authUser, getAIFeatureVector);
vitalsRouter.get('/ai-features/:userId', authUser, getAIFeatureVector);

export default vitalsRouter;