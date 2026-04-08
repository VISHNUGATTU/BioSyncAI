import Admin from '../models/Admin.js'; // Make sure the filename matches exactly
import generateToken from '../utils/generateToken.js';

// @desc    Register a new admin 
// @route   POST /api/admins/auth/register
// @access  Public (⚠️ IMPORTANT: In production, you must lock this route down with a secret key)
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // Force lowercase for exact matching
    const adminExists = await Admin.findOne({ email: email.toLowerCase() });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists.' });
    }

    const admin = await Admin.create({ 
      name, 
      email, 
      password 
    });

    if (admin) {
      res.status(201).json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        accessLevel: admin.accessLevel,
        isActive: admin.isActive,
        token: generateToken(admin._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid admin data received.' });
    }
  } catch (error) {
    console.error('Admin Registration Error:', error);
    res.status(500).json({ message: 'Server error during admin registration.' });
  }
};

// @desc    Authenticate an admin & get token
// @route   POST /api/admins/auth/login
// @access  Public
export const authAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });

    // --- SECURITY KILLSWITCH CHECK ---
    // If the admin exists but isActive is false, completely block them.
    if (admin && !admin.isActive) {
      return res.status(403).json({ message: 'Access denied. This admin account has been deactivated.' });
    }

    if (admin && (await admin.matchPassword(password))) {
      res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        accessLevel: admin.accessLevel,
        isActive: admin.isActive,
        token: generateToken(admin._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password.' });
    }
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ message: 'Server error during admin login.' });
  }
};

// @desc    Get admin profile data
// @route   GET /api/admins/profile
// @access  Private (Requires Admin Token)
export const getAdminProfile = async (req, res) => {
  try {
    // req.admin will be set by your upcoming Admin Auth Middleware
    const admin = await Admin.findById(req.admin._id).select('-password');

    if (admin) {
      res.json(admin);
    } else {
      res.status(404).json({ message: 'Admin not found.' });
    }
  } catch (error) {
    console.error('Admin Profile Error:', error);
    res.status(500).json({ message: 'Server error fetching admin profile.' });
  }
};
// server/controllers/adminController.js
export const uploadLabResults = async (req, res) => {
  try {
    const { userId, appointmentId, labData } = req.body;

    // 1. Find the User
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found in system.' });
    }

    // 2. Inject the clinical data and UNLOCK the AI
    user.clinicalProfile = {
      ...labData,
      isComplete: true // 🔓 THE MASTER KEY
    };
    
    await user.save();

    // 3. Mark the appointment as Completed
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (appointment) {
        appointment.status = 'COMPLETED';
        appointment.labResultsRaw = labData; // Keep a record of the raw drop
        await appointment.save();
      }
    }

    res.status(200).json({ 
      message: 'Clinical profile synced successfully. Neural engine is now unlocked for this user.' 
    });

  } catch (error) {
    console.error("Lab Upload Error:", error);
    res.status(500).json({ message: 'Failed to process clinical data payload.' });
  }
};