import express from 'express';
import { 
  loginAdmin, getDashboardKPIs, getCriticalAlerts, getAIMonitoring, 
  getSamplePipeline, getDashboardAnalytics, getAdminStats, getSystemLogs, 
  getAllTickets, createLabAssistant, getLabAssistants, updateLabAssistant, 
  deleteLabAssistant, registerAdmin, getUsers, getUserDetails, updateUserStatus, 
  assignLabAssistantToSample, getTransactions, updateAdminProfile, getRevenueAnalytics,
  getAllReports, getAllDoctors, getAllAppointments, getRoles, getAuditLogs
} from '../controllers/adminController.js';
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
adminRouter.get('/dashboard/sample-pipeline', getSamplePipeline);
adminRouter.get('/dashboard/analytics', getDashboardAnalytics);
adminRouter.get('/dashboard/revenue-analytics', authorizeRoles('SuperAdmin', 'Data_Analyst'), getRevenueAnalytics);
adminRouter.get('/dashboard/stats', getAdminStats);
adminRouter.put('/profile', updateAdminProfile);

// Monitoring
adminRouter.get('/logs', authorizeRoles('SuperAdmin'), getSystemLogs);
adminRouter.get('/audit', authorizeRoles('SuperAdmin'), getAuditLogs);
adminRouter.get('/tickets', authorizeRoles('SuperAdmin', 'Support_Staff'), getAllTickets);
adminRouter.get('/dashboard/ai-telemetry', authorizeRoles('SuperAdmin', 'Data_Analyst'), getAIMonitoring);

// Entity Management
adminRouter.get('/users', authorizeRoles('SuperAdmin', 'Support_Staff', 'Data_Analyst'), getUsers);
adminRouter.get('/users/:id', authorizeRoles('SuperAdmin', 'Support_Staff'), getUserDetails);
adminRouter.put('/users/:id/status', authorizeRoles('SuperAdmin'), updateUserStatus);
adminRouter.get('/transactions', authorizeRoles('SuperAdmin', 'Data_Analyst'), getTransactions);
adminRouter.get('/reports', authorizeRoles('SuperAdmin', 'Support_Staff'), getAllReports);
adminRouter.get('/appointments', authorizeRoles('SuperAdmin', 'Support_Staff'), getAllAppointments);
adminRouter.get('/doctors', authorizeRoles('SuperAdmin'), getAllDoctors);
adminRouter.get('/roles', authorizeRoles('SuperAdmin'), getRoles);
adminRouter.put('/samples/:id/assign', authorizeRoles('SuperAdmin', 'Support_Staff'), auditLogger('Sample'), assignLabAssistantToSample);

// Staff Management (Strictly Audited)
adminRouter.post('/lab-assistants', authorizeRoles('SuperAdmin'), auditLogger('LabAssistant'), createLabAssistant);
adminRouter.get('/lab-assistants', authorizeRoles('SuperAdmin', 'Support_Staff'), getLabAssistants);
adminRouter.put('/lab-assistants/:id', authorizeRoles('SuperAdmin'), auditLogger('LabAssistant'), updateLabAssistant);
adminRouter.delete('/lab-assistants/:id', authorizeRoles('SuperAdmin'), auditLogger('LabAssistant'), deleteLabAssistant);

export default adminRouter;