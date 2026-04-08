import express from 'express';
import  {bookAppointment}  from '../controllers/appointmentController.js';
import { userProtect } from '../middleware/userAuth.js';
const appointmentRouter = express.Router();

appointmentRouter.post('/book', userProtect, bookAppointment);
export default appointmentRouter;