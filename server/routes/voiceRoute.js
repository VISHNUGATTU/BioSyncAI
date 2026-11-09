import express from 'express';
import {
  handleVoiceFoodLog,
  handleKitchenAudioCoach
} from '../controllers/voiceController.js';

const router = express.Router();

// Spoken food logging with in-silico simulation & vernacular audio feedback
router.post('/parse-and-simulate', handleVoiceFoodLog);

// Hands-free kitchen voice coaching for single-pot meal plating
router.post('/kitchen-coach', handleKitchenAudioCoach);

export default router;

