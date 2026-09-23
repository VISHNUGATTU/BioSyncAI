import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Sample from '../models/Sample.js';
import Vitals from '../models/Vitals.js';
import FoodLog from '../models/FoodLog.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import jwt from 'jsonwebtoken';
import { sendIndianSMS } from '../configs/sendSMS.js';

const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, 
  });

  return token;
};

export const sendOTP = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    res.status(400);
    throw new Error('Phone number is required');
  }

  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
  const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  await User.findOneAndUpdate(
    { phoneNumber: cleanNumber },
    { 
      $set: { 
        'otp.code': generatedOTP, 
        'otp.expiresAt': expiresAt 
      } 
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`\n========================================`);
  console.log(`🔐 DEV MODE: OTP for +91 ${cleanNumber} is: ${generatedOTP}`);
  console.log(`========================================\n`);

  try {
    if (process.env.NODE_ENV === 'production') {
       await sendIndianSMS(cleanNumber, generatedOTP);
    }
  } catch (smsError) {
    console.log('⚠️ SMS Delivery Failed. Check gateway configuration.');
  }

  res.status(200).json({ success: true, message: `OTP generated successfully.` });
});

export const verifyOTP = asyncHandler(async (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp) {
    res.status(400);
    throw new Error('Please provide both phone number and OTP');
  }

  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
  
  const user = await User.findOne({ phoneNumber: cleanNumber }).select('+otp.code +otp.expiresAt');

  if (!user || !user.otp || !user.otp.code) {
    res.status(401);
    throw new Error('Please request an OTP first.');
  }

  if (user.otp.code !== otp) {
    res.status(401);
    throw new Error('Invalid OTP');
  }

  if (Date.now() > user.otp.expiresAt.getTime()) {
    user.otp = undefined;
    await user.save();
    res.status(401);
    throw new Error('OTP has expired. Please request a new one.');
  }

  user.otp = undefined;
  await user.save();

  const token = generateTokenAndSetCookie(res, user._id);

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      phoneNumber: user.phoneNumber,
      vitalsStatus: user.vitalsStatus,
      accountStatus: user.accountStatus,
    },
    token 
  });
});

export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).lean();

  if (user) {
    res.status(200).json({ success: true, user });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Prevent deletion if the user is attempting to escape a pending active order
  const activeAppointments = await Appointment.find({
    user: userId,
    status: { $in: ['Booked', 'Confirmed', 'Assistant_Assigned', 'On_The_Way', 'Arrived', 'In_Progress'] }
  });

  if (activeAppointments.length > 0) {
     res.status(400);
     throw new Error("Cannot delete account with active or pending appointments.");
  }

  // Comply with Google Play Data Safety by purging personal health records
  await Promise.all([
    Vitals.deleteMany({ user: userId }),
    FoodLog.deleteMany({ user: userId }),
    Sample.deleteMany({ user: userId }),
    Appointment.deleteMany({ user: userId }),
    User.findByIdAndDelete(userId)
  ]);

  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ success: true, message: 'Account and associated data successfully deleted.' });
});