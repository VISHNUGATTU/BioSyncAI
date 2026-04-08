import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { v2 as cloudinary } from 'cloudinary'; 

// @desc    Register a new user
// @route   POST /api/user/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, baselineHealth, profilePicture } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      profilePicture: profilePicture || '', 
      baselineHealth: baselineHealth || {} 
      // Note: clinicalProfile will automatically be created as an empty object by the Mongoose schema default
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        baselineHealth: user.baselineHealth,
        clinicalProfile: user.clinicalProfile, // ✅ ADDED THIS
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data received.' });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// @desc    Authenticate a user & get token (Login)
// @route   POST /api/user/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        baselineHealth: user.baselineHealth,
        clinicalProfile: user.clinicalProfile, // ✅ ADDED THIS
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password.' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// @desc    Get user profile data
// @route   GET /api/users/profile;
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        name: user.name,
        email: user.email,
        baselineHealth: user.baselineHealth || { weight: 70, activityLevel: 'Moderate' },
        clinicalProfile: user.clinicalProfile // ✅ ADDED THIS
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update Profile (Handles the full Biometrics object from your custom UI)
// @route   PUT /api/users/profile
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // If the frontend sends a baselineHealth object, merge it with existing data
      if (req.body.baselineHealth) {
        user.baselineHealth = {
          ...user.baselineHealth, // Keep any old data
          ...req.body.baselineHealth // Overwrite with new data from the app
        };
      }

      // NOTE: We do NOT allow the user to update their own clinicalProfile here. 
      // That must be done securely by the Admin/Lab endpoint!

      const updatedUser = await user.save();

      // Send back the FULL updated user object so your AuthContext can update instantly!
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: 'Failed to sync biological data.' });
  }
};