import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import User from '../models/User.js';

const authUser = asyncHandler(async (req, res, next) => {
  let token;

  // Support both HTTP-only cookies and Authorization headers
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
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

    // Fetch the user but exclude sensitive fields like OTP
    req.user = await User.findById(decoded.id).select('-otp');

    if (!req.user) {
      res.status(401);
      throw new Error('User not found');
    }

    if (
      req.user.accountStatus === 'Suspended' ||
      req.user.accountStatus === 'Banned'
    ) {
      res.status(403);
      throw new Error('Account is suspended or banned');
    }

    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

export { authUser };