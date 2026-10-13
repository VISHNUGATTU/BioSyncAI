import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet'; 
import compression from 'compression'; 
import rateLimit from 'express-rate-limit'; 
import mongoose from 'mongoose';
import connectDB from './configs/db.js';
import { errorHandler } from './middlewares/errorMiddleware.js';
import { sanitizeInput } from './middlewares/sanitizeMiddleware.js';

// Import All Routers
import userRouter from './routes/userRoute.js';
import vitalsRouter from './routes/vitalsRoute.js';
import foodRouter from './routes/foodRoute.js';
import appointmentRouter from './routes/appointmentRoute.js';
import labAssistantRouter from './routes/labAssistantRoute.js';
import adminRouter from './routes/adminRoute.js';
import applicationRouter from './routes/applicationRoute.js';
import testCatalogRouter from './routes/testCatalogRoute.js';
import ticketRouter from './routes/ticketRoute.js';
import notificationRouter from './routes/notificationRoute.js';
import doctorRouter from './routes/doctorRoute.js';
import fhirRouter from './routes/fhirRoute.js';
import chatRouter from './routes/chatRoute.js';
import { initRecalibrationCron } from './services/recalibrationCron.js';

// Load environment secrets
dotenv.config();

// Connect to MongoDB
connectDB();

// Ensure uploads directory exists on cold starts / new containers
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

// ==========================================
// PRODUCTION SECURITY & HARDENING
// ==========================================
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Defense-in-depth HTTP Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  frameguard: { action: "deny" },
  noSniff: true,
  xssFilter: true,
}));

app.use(compression());

// Global API rate limiter against scraping, volumetric DDoS, and resource exhaustion
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // 500 requests per 15 minutes per IP
  message: { success: false, message: 'Too many requests from this IP address, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Strict rate limiter for authentication endpoints against credential stuffing and brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 50, // Limit auth attempts specifically to prevent brute force
  message: { success: false, message: 'Too many authentication attempts from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/users/request-otp', authLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/lab-assistant/login', authLimiter);
app.use('/api/doctor/login', authLimiter);

// ==========================================
// GLOBAL MIDDLEWARES
// ==========================================
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL || 'http://localhost:5173',
  process.env.PUBLIC_URL,
  'https://biosyncadmin.vercel.app'
].filter(Boolean);

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow mobile apps (which send undefined origins), allowed web clients, or local dev
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '2mb' })); 
app.use(express.urlencoded({ extended: true, limit: '2mb' })); 

// Defense against NoSQL injection, prototype pollution, and null-byte poisoning
app.use(sanitizeInput);

app.use(cookieParser()); 

// Serve static uploads with strict execution protection and hidden dotfiles
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  dotfiles: 'ignore',
  index: false,
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
  }
}));

// ==========================================
// API ROUTES MOUNTING
// ==========================================
app.use('/api/users', userRouter);
app.use('/api/vitals', vitalsRouter);
app.use('/api/food', foodRouter);
app.use('/api/applications', applicationRouter);
app.use('/api/appointments', appointmentRouter);
app.use('/api/lab-assistant', labAssistantRouter);
app.use('/api/tests', testCatalogRouter);
app.use('/api/admin', adminRouter);
app.use('/api/tickets', ticketRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/fhir', fhirRouter);
app.use('/api/chat', chatRouter);

app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'BioSync AI Backend API is running optimally.' });
});

// Comprehensive production health check probe for load balancers & orchestrators
app.get('/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'healthy' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    database: isDbConnected ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// ERROR HANDLING (Must be the very last middleware)
// ==========================================
app.use(errorHandler);

// ==========================================
// SERVER INITIALIZATION & GRACEFUL SHUTDOWN
// ==========================================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  initRecalibrationCron();
});

const gracefulShutdown = (signal) => {
  console.log(`[BioSync] ${signal} signal received: closing HTTP server.`);
  server.close(() => {
    console.log('[BioSync] HTTP server closed gracefully.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error(`[FATAL] Unhandled Rejection: ${err?.message || err}`);
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(1);
  });
});

export default app;
