import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import connectCloudinary from './config/cloudinary.js';

// ✅ Import the Error Handlers we just built
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Route Imports
import userRouter from './routes/userRoute.js'; 
import adminRouter from './routes/adminRoute.js';
import trackerRouter from './routes/trackerRoute.js';
import aiRouter from './routes/aiRoute.js';
import appointmentRouter from './routes/appointmentRoute.js'; // ✅ Import the new appointment routes
import { bookAppointment } from './controllers/appointmentController.js';
import { userProtect } from './middleware/userAuth.js';

connectDB();
connectCloudinary();

const app = express();

// --- GLOBAL MIDDLEWARE ---
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); // ✅ CRITICAL FOR MULTER/IMAGE UPLOADS

// --- MOUNT ROUTES ---
app.use('/api/user/', userRouter); 
app.use('/api/admin/', adminRouter); 
app.use('/api/tracker', trackerRouter);
app.use('/api/ai', aiRouter);
app.use('/api/appointment', appointmentRouter); // ✅ Mount the appointment booking route

// Base Route
app.get('/', (req, res) => {
  res.send('BioSync AI API is running...');
});

// --- CRITICAL: ERROR HANDLERS MUST BE THE LAST MOUNTED MIDDLEWARES ---
// 1. If the URL doesn't match anything above, it falls into notFound
app.use(notFound);
// 2. If ANY route throws an error, it gets caught and formatted as JSON here
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running smoothly on port ${PORT}`);
});