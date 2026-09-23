import express from 'express';
import { sendOTP, verifyOTP, getUserProfile, logoutUser, deleteAccount } from '../controllers/userController.js';
import { authUser } from '../middlewares/authUser.js';

const userRouter = express.Router();
userRouter.post('/request-otp', sendOTP);
userRouter.post('/verify-otp', verifyOTP);
userRouter.post('/logout', logoutUser);
userRouter.get('/profile', authUser, getUserProfile);

// Required for Google Play Store Policy compliance
userRouter.delete('/profile', authUser, deleteAccount);

export default userRouter;