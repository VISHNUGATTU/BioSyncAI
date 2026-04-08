import express from 'express';
import { analyzeFood } from '../controllers/aiController.js';
import { userProtect } from '../middleware/userAuth.js';

const router = express.Router();

// The user must be logged in to ask the AI for advice
router.post('/analyze', userProtect, analyzeFood);

export default router;