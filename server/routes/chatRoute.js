import express from 'express';
import {
  sendChatMessage,
  getChatHistory,
  clearChatHistory,
  getChatSuggestions,
} from '../controllers/chatController.js';
import { authUser } from '../middlewares/authUser.js';

const chatRouter = express.Router();

chatRouter.post('/message', authUser, sendChatMessage);
chatRouter.get('/history', authUser, getChatHistory);
chatRouter.delete('/history', authUser, clearChatHistory);
chatRouter.get('/suggestions', authUser, getChatSuggestions);

export default chatRouter;
