import express from 'express';
import { 
  registerAdmin, 
  authAdmin, 
  getAdminProfile,
  uploadLabResults
} from '../controllers/adminController.js';
import { adminProtect } from '../middleware/adminAuth.js';

const adminRouter = express.Router();

// --- PUBLIC ROUTES ---
adminRouter.post('/register', registerAdmin);
adminRouter.post('/login', authAdmin);

// --- PROTECTED ROUTES (Requires valid Admin JWT token) ---
adminRouter.get('/profile', adminProtect, getAdminProfile);
adminRouter.post('/upload-labs', uploadLabResults);

export default adminRouter;