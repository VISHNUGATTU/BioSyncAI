import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ==========================================
// 1. STANDARD USER MIDDLEWARE (Renamed per your request)
// ==========================================
export const userProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Only searches the USER database
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user no longer exists.' });
      }

      next(); 
    } catch (error) {
      console.error('Token Error:', error);
      res.status(401).json({ message: 'Not authorized, token failed or expired.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided.' });
  }
};

