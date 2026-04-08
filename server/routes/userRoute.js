import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile 
} from '../controllers/userController.js';
import { userProtect } from '../middleware/userAuth.js';
import { upload } from '../config/multer.js'; // ✅ Import your Cloudinary uploader

const userRouter = express.Router();

// --- PUBLIC ROUTES (No token required) ---
userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);

// --- PROTECTED ROUTES (Requires valid User JWT token) ---
userRouter.get('/profile', userProtect, getUserProfile);

// ✅ ADDED MULTER: 'profilePicture' must exactly match the name of the field sent from React Native
userRouter.put('/profile', userProtect, upload.single('profilePicture'), updateUserProfile);

export default userRouter;