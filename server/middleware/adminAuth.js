import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js'; 

// ==========================================
// 1. ADMIN ONLY MIDDLEWARE (CRITICAL FOR SECURITY)
// ==========================================
export const adminProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Only searches the ADMIN database
      req.admin = await Admin.findById(decoded.id).select('-password');

      if (!req.admin) {
        return res.status(401).json({ message: 'Not authorized, admin record not found.' });
      }

      // The Security Killswitch Check
      if (!req.admin.isActive) {
        return res.status(403).json({ message: 'Access denied. Admin account deactivated.' });
      }

      next(); 
    } catch (error) {
      console.error('Admin Token Error:', error);
      res.status(401).json({ message: 'Not authorized, admin token failed or expired.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no admin token provided.' });
  }
};