import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import User from '../models/User.js';
import LabAssistant from '../models/LabAssistant.js';
import Doctor from '../models/Doctor.js';
import Admin from '../models/Admin.js';

export const authGeneral = asyncHandler(async (req, res, next) => {
  const token =
    (req.cookies && (req.cookies.token || req.cookies.la_token || req.cookies.admin_token)) ||
    (req.headers.authorization?.startsWith('Bearer')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'doctor') {
      const doctor = await Doctor.findById(decoded.id).select('-password').lean();
      if (!doctor) throw new Error('Identity not found');
      req.doctor = doctor;
      req.user = doctor;
      return next();
    }

    if (decoded.role === 'lab_assistant') {
      const labAssistant = await LabAssistant.findById(decoded.id).select('-password').lean();
      if (!labAssistant) throw new Error('Identity not found');
      req.labAssistant = labAssistant;
      req.user = labAssistant;
      return next();
    }

    // Check User first
    const user = await User.findById(decoded.id).select('-otp').lean();
    if (user) {
      if (user.accountStatus === 'Suspended' || user.accountStatus === 'Banned') {
        res.status(403);
        throw new Error('Account is suspended or banned');
      }
      req.user = user;
      return next();
    }

    // Check Admin if not User
    const admin = await Admin.findById(decoded.id).select('-password').lean();
    if (admin) {
      req.admin = admin;
      req.user = admin;
      return next();
    }

    // Check LabAssistant or Doctor fallback in case decoded.role was omitted in older tokens
    const laFallback = await LabAssistant.findById(decoded.id).select('-password').lean();
    if (laFallback) {
      req.labAssistant = laFallback;
      req.user = laFallback;
      return next();
    }

    const docFallback = await Doctor.findById(decoded.id).select('-password').lean();
    if (docFallback) {
      req.doctor = docFallback;
      req.user = docFallback;
      return next();
    }

    throw new Error('Identity not found');
  } catch (error) {
    res.status(401);
    throw new Error(error.message || 'Not authorized, token failed');
  }
});

export default authGeneral;