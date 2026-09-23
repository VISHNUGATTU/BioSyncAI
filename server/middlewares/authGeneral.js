import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import User from '../models/User.js';
import LabAssistant from '../models/LabAssistant.js';

export const authGeneral = asyncHandler(async (req, res, next) => {
  const token = (req.cookies && (req.cookies.token || req.cookies.la_token)) || 
                (req.headers.authorization?.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null);

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role === 'lab_assistant') {
      const labAssistant = await LabAssistant.findById(decoded.id).select('-password').lean();
      if (!labAssistant) throw new Error('Identity not found');
      req.labAssistant = labAssistant;
      return next();
    } 
    
    const user = await User.findById(decoded.id).select('-otp').lean();
    if (!user) throw new Error('Identity not found');
    if (user.accountStatus === 'Suspended' || user.accountStatus === 'Banned') {
      res.status(403);
      throw new Error('Account is suspended or banned');
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error(error.message || 'Not authorized, token failed');
  }
});