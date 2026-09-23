import express from 'express';
import { sendNotification, getMyNotifications, markAsRead } from '../controllers/notificationController.js';
import { authAdmin } from '../middlewares/authAdmin.js';
import { authGeneral } from '../middlewares/authGeneral.js';

const notificationRouter = express.Router();

notificationRouter.post('/', authAdmin, sendNotification);

// Accessible by both User and LabAssistant 
notificationRouter.get('/', authGeneral, getMyNotifications);
notificationRouter.put('/:id/read', authGeneral, markAsRead);

export default notificationRouter;
