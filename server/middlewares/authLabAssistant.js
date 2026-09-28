import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import LabAssistant from '../models/LabAssistant.js';
import Doctor from '../models/Doctor.js';

const authLabAssistant = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.la_token) {
    token = req.cookies.la_token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.role = decoded.role || 'lab_assistant';

    if (decoded.role === 'doctor') {
      req.doctor = await Doctor.findById(decoded.id).select('-password');
      req.user = req.doctor;
      if (!req.doctor) {
        res.status(401);
        throw new Error('Doctor not found');
      }
    } else {
      req.labAssistant = await LabAssistant.findById(decoded.id).select('-password');
      req.user = req.labAssistant;
      if (!req.labAssistant) {
        res.status(401);
        throw new Error('Lab Assistant not found');
      }
    }

    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

const authDoctor = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.la_token) {
    token = req.cookies.la_token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Allow either explicitly role doctor or look up in Doctor model
    const doctor = await Doctor.findById(decoded.id).select('-password');
    if (!doctor) {
      res.status(403);
      throw new Error('Access denied. Doctor / Pathologist privileges required.');
    }

    req.doctor = doctor;
    req.user = doctor;
    req.role = 'doctor';
    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized as Doctor');
  }
});

export { authLabAssistant, authDoctor };