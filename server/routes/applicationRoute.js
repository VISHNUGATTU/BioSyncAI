import express from 'express';
import { submitApplication } from '../controllers/applicationController.js';
import { diskUpload } from '../configs/multer.js'; // Use the secure, centralized config

const applicationRouter = express.Router();

// Route is now protected against malicious file execution attacks
applicationRouter.post('/apply', diskUpload.single('resume'), submitApplication);

export default applicationRouter;