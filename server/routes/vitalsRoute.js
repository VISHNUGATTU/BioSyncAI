import express from 'express';
import { addManualVitals, uploadPdfVitals, getLatestVitals } from '../controllers/vitalsController.js';
import { authUser } from '../middlewares/authUser.js';
import { memoryUpload } from '../configs/multer.js'; 

const vitalsRouter = express.Router();

vitalsRouter.post('/manual', authUser, addManualVitals);
vitalsRouter.post('/pdf', authUser, memoryUpload.single('vitalsPdf'), uploadPdfVitals);
vitalsRouter.get('/latest', authUser, getLatestVitals);

export default vitalsRouter;