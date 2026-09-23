import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import LabAssistant from '../models/LabAssistant.js';

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

    req.labAssistant = await LabAssistant.findById(decoded.id).select('-password');

    if (!req.labAssistant) {
      res.status(401);
      throw new Error('Lab Assistant not found');
    }

    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

export { authLabAssistant };