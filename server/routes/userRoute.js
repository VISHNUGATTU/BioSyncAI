import express from 'express';
import { 
  sendOTP, 
  verifyOTP, 
  getFirebaseConfig,
  getUserProfile, 
  updateUserProfile,
  updateFCMToken,
  getUserReports,
  getDraft,
  saveDraft,
  deleteDraft,
  logoutUser, 
  deleteAccount,
  getHealthTimeline,
} from '../controllers/userController.js';
import { authUser } from '../middlewares/authUser.js';

const userRouter = express.Router();

userRouter.get('/firebase-config', getFirebaseConfig);
userRouter.post('/request-otp', sendOTP);
userRouter.post('/verify-otp', verifyOTP);
userRouter.post('/logout', logoutUser);

// Authenticated user profile routes
userRouter.get('/profile', authUser, getUserProfile);
userRouter.put('/profile', authUser, updateUserProfile);
userRouter.put('/fcm-token', authUser, updateFCMToken);
userRouter.put('/push-token', authUser, updateFCMToken);
userRouter.get('/reports', authUser, getUserReports);

// Unified Longitudinal Health Timeline (Phase 4)
userRouter.get('/health-timeline', authUser, getHealthTimeline);

// User workflow draft persistence routes
userRouter.get('/drafts/:draftType', authUser, getDraft);
userRouter.put('/drafts/:draftType', authUser, saveDraft);
userRouter.delete('/drafts/:draftType', authUser, deleteDraft);

// Required for Google Play Store Policy compliance
userRouter.delete('/profile', authUser, deleteAccount);

export default userRouter;