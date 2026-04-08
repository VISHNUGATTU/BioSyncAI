import express from 'express';
import { logScan, getScanHistory, getHealthSummary } from '../controllers/trackerController.js';
import { userProtect } from '../middleware/userAuth.js';
import { requireClinicalData } from '../middleware/clinicalMiddleware.js'; // ✅ Import the Gateway
import {upload} from '../config/multer.js'; 

const trackerRouter = express.Router();

// ✅ LOCK APPLIED: The route now goes Auth -> Clinical Check -> File Upload -> Python AI
trackerRouter.post('/scan', userProtect, requireClinicalData, upload.single('image'), logScan);

// We leave History and Summary unprotected by the clinical check 
// so users can still see their past data while waiting for lab results.
trackerRouter.get('/history', userProtect, getScanHistory);
trackerRouter.get('/summary', userProtect, getHealthSummary); 

export default trackerRouter;