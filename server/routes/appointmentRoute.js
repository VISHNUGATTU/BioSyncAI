import express from 'express';
import { 
  bookAppointment, 
  rescheduleAppointment, 
  attemptCancellation, 
  getUserAppointments,
  getAppointmentReportDetails,
  getShareableReportHtml,
  getAppointmentReportShareData,
  downloadAppointmentReportPdf
} from '../controllers/appointmentController.js';
import { authUser } from '../middlewares/authUser.js';
import { auditLogger } from '../middlewares/auditMiddleware.js';

const appointmentRouter = express.Router();

// Phase 5 & Hardening: Public Shareable Clinical Report Views & PDF Binary Download
appointmentRouter.get('/:id/report/view', getShareableReportHtml);
appointmentRouter.get('/:id/report/pdf', downloadAppointmentReportPdf);
appointmentRouter.get('/:id/report/share-data', getAppointmentReportShareData);

// Authenticated Patient Routes
appointmentRouter.use(authUser);

appointmentRouter.get('/', getUserAppointments);
appointmentRouter.get('/:id/report', getAppointmentReportDetails);

appointmentRouter.post('/book', auditLogger('Appointment'), bookAppointment);

appointmentRouter.put('/:id/reschedule', auditLogger('Appointment'), rescheduleAppointment);

appointmentRouter.delete('/:id/cancel', auditLogger('Appointment'), attemptCancellation);

export default appointmentRouter;