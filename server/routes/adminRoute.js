import express from 'express';
import { 
  loginAdmin, getDashboardKPIs, getCriticalAlerts, getAIMonitoring, 
  getSamplePipeline, getDashboardAnalytics, getAdminStats, getSystemLogs, 
  getAllTickets, createLabAssistant, getLabAssistants, updateLabAssistant, 
  deleteLabAssistant, registerAdmin, getUsers, getUserDetails, updateUserStatus, 
  assignLabAssistantToSample, getTransactions, updateAdminProfile, getRevenueAnalytics,
  getAllReports, getAllDoctors, createDoctor, updateDoctor, getAllAppointments, 
  updateAdminAppointment, getRoles, createRole, updateRole, deleteRole, getAuditLogs,
  getSystemHealth, getDashboardLocations, updateAlertStatus, autoAssignStaff, getNearbyStaff,
  getErrorMonitoringData, retryFailedJob, acknowledgeIncident, verifyAndApproveReport
} from '../controllers/adminController.js';
import { updateTicketStatus, replyToTicket } from '../controllers/ticketController.js';
import { authAdmin } from '../middlewares/authAdmin.js'; 
import { authorizeRoles } from '../middlewares/rbacMiddleware.js';
import { auditLogger } from '../middlewares/auditMiddleware.js';

const adminRouter = express.Router();

// Public Authentication
adminRouter.post('/login', loginAdmin);
adminRouter.post('/register', registerAdmin);

// ==========================================
// PROTECTED DASHBOARD ROUTES
// ==========================================
adminRouter.use(authAdmin); 

adminRouter.get('/dashboard/kpis', getDashboardKPIs);
adminRouter.get('/dashboard/alerts', getCriticalAlerts);
adminRouter.put('/dashboard/alerts/:vitalsId', updateAlertStatus);
adminRouter.get('/dashboard/sample-pipeline', getSamplePipeline);
adminRouter.get('/dashboard/analytics', getDashboardAnalytics);
adminRouter.get('/dashboard/revenue-analytics', authorizeRoles('SuperAdmin', 'Data_Analyst'), getRevenueAnalytics);
adminRouter.get('/dashboard/stats', getAdminStats);
adminRouter.get('/dashboard/system-health', getSystemHealth);
adminRouter.get('/dashboard/locations', getDashboardLocations);
adminRouter.put('/profile', updateAdminProfile);

// Monitoring
adminRouter.get('/logs', authorizeRoles('SuperAdmin', 'Operations_Manager'), getSystemLogs);
adminRouter.get('/error-monitoring', authorizeRoles('SuperAdmin', 'Operations_Manager', 'Data_Analyst'), getErrorMonitoringData);
adminRouter.post('/error-monitoring/:id/retry', authorizeRoles('SuperAdmin', 'Operations_Manager'), retryFailedJob);
adminRouter.put('/error-monitoring/:id/acknowledge', authorizeRoles('SuperAdmin', 'Operations_Manager', 'Support_Staff'), acknowledgeIncident);
adminRouter.get('/audit', authorizeRoles('SuperAdmin', 'Operations_Manager'), getAuditLogs);
adminRouter.get('/tickets', authorizeRoles('SuperAdmin', 'Operations_Manager', 'Support_Staff'), getAllTickets);
adminRouter.put('/tickets/:id/status', authorizeRoles('SuperAdmin', 'Operations_Manager', 'Support_Staff'), updateTicketStatus);
adminRouter.post('/tickets/:id/reply', authorizeRoles('SuperAdmin', 'Operations_Manager', 'Support_Staff'), replyToTicket);
adminRouter.get('/dashboard/ai-telemetry', authorizeRoles('SuperAdmin', 'Operations_Manager', 'Data_Analyst'), getAIMonitoring);

// Entity Management
adminRouter.get('/users', authorizeRoles('SuperAdmin', 'Operations_Manager', 'Support_Staff', 'Data_Analyst'), getUsers);
adminRouter.get('/users/:id', authorizeRoles('SuperAdmin', 'Operations_Manager', 'Support_Staff'), getUserDetails);
adminRouter.put('/users/:id/status', authorizeRoles('SuperAdmin', 'Operations_Manager'), updateUserStatus);
adminRouter.get('/transactions', authorizeRoles('SuperAdmin', 'Operations_Manager', 'Data_Analyst'), getTransactions);
adminRouter.get('/reports', authorizeRoles('SuperAdmin', 'Operations_Manager', 'Support_Staff', 'Doctor'), getAllReports);
adminRouter.post('/reports/:id/verify', authorizeRoles('SuperAdmin', 'Operations_Manager', 'Support_Staff', 'Doctor'), verifyAndApproveReport);
adminRouter.get('/appointments', authorizeRoles('SuperAdmin', 'Operations_Manager', 'Support_Staff'), getAllAppointments);
adminRouter.put('/appointments/:id', authorizeRoles('SuperAdmin', 'Operations_Manager', 'Support_Staff'), auditLogger('Appointment'), updateAdminAppointment);

adminRouter.get('/doctors', authorizeRoles('SuperAdmin', 'Operations_Manager', 'Support_Staff'), getAllDoctors);
adminRouter.post('/doctors', authorizeRoles('SuperAdmin', 'Operations_Manager'), auditLogger('Doctor'), createDoctor);
adminRouter.put('/doctors/:id', authorizeRoles('SuperAdmin', 'Operations_Manager'), auditLogger('Doctor'), updateDoctor);

adminRouter.get('/roles', authorizeRoles('SuperAdmin', 'Operations_Manager'), getRoles);
adminRouter.post('/roles', authorizeRoles('SuperAdmin'), auditLogger('Role'), createRole);
adminRouter.put('/roles/:id', authorizeRoles('SuperAdmin'), auditLogger('Role'), updateRole);
adminRouter.delete('/roles/:id', authorizeRoles('SuperAdmin'), auditLogger('Role'), deleteRole);

adminRouter.put('/samples/:id/assign', authorizeRoles('SuperAdmin', 'Operations_Manager', 'Support_Staff'), auditLogger('Sample'), assignLabAssistantToSample);
adminRouter.post('/samples/:id/auto-assign', authorizeRoles('SuperAdmin', 'Operations_Manager', 'Support_Staff'), auditLogger('Sample'), autoAssignStaff);
adminRouter.post('/appointments/:id/auto-assign', authorizeRoles('SuperAdmin', 'Operations_Manager', 'Support_Staff'), auditLogger('Appointment'), autoAssignStaff);
adminRouter.get('/appointments/:id/nearby-staff', authorizeRoles('SuperAdmin', 'Operations_Manager', 'Support_Staff'), getNearbyStaff);

// Baseline Calibration Cron Trigger
adminRouter.post('/trigger-recalibration-cron', authorizeRoles('SuperAdmin', 'Operations_Manager'), async (req, res, next) => {
  try {
    const { runBaselineCalibrationCheck } = await import('../services/recalibrationCron.js');
    const stats = await runBaselineCalibrationCheck();
    res.status(200).json({
      success: true,
      message: 'Automated 30-day baseline recalibration cron executed successfully',
      stats,
    });
  } catch (err) {
    next(err);
  }
});

// Staff Management (Strictly Audited)
adminRouter.post('/lab-assistants', authorizeRoles('SuperAdmin', 'Operations_Manager'), auditLogger('LabAssistant'), createLabAssistant);
adminRouter.get('/lab-assistants', authorizeRoles('SuperAdmin', 'Operations_Manager', 'Support_Staff'), getLabAssistants);
adminRouter.put('/lab-assistants/:id', authorizeRoles('SuperAdmin', 'Operations_Manager'), auditLogger('LabAssistant'), updateLabAssistant);
adminRouter.delete('/lab-assistants/:id', authorizeRoles('SuperAdmin'), auditLogger('LabAssistant'), deleteLabAssistant);

export default adminRouter;