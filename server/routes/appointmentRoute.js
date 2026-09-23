import express from 'express';
import { 
  bookAppointment, 
  rescheduleAppointment, 
  attemptCancellation, 
  getUserAppointments 
} from '../controllers/appointmentController.js';
import { authUser } from '../middlewares/authUser.js';
import { auditLogger } from '../middlewares/auditMiddleware.js';

const appointmentRouter = express.Router();

appointmentRouter.use(authUser);

appointmentRouter.get('/', getUserAppointments);

appointmentRouter.post('/book', auditLogger('Appointment'), bookAppointment);

appointmentRouter.put('/:id/reschedule', auditLogger('Appointment'), rescheduleAppointment);

appointmentRouter.delete('/:id/cancel', auditLogger('Appointment'), attemptCancellation);

export default appointmentRouter;