import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import Admin from '../models/Admin.js'; // Placeholder for Admin model - we will create this if you want a dedicated Admin collection
// Placeholder for Admin model - we will create this if you want a dedicated Admin collection

const authAdmin = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.admin = await Admin.findById(decoded.id).select('-password');
    
    // ADD THIS LINE RIGHT HERE:
    req.user = req.admin; 

    if (!req.admin) {
      res.status(401);
      throw new Error('Admin not found');
    }

    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

export { authAdmin };