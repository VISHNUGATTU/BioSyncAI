import User from '../models/User.js';

export const requireClinicalData = async (req, res, next) => {
  try {
    // req.user._id is already provided by your existing 'protect' auth middleware
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found in system.' });
    }

    // THE MASTER LOCK: Check if the clinical profile is complete
    if (!user.clinicalProfile || user.clinicalProfile.isComplete !== true) {
      // We return a 403 (Forbidden) with a highly specific "actionRequired" flag.
      // Your React Native app will look for this exact flag to trigger the booking screen.
      return res.status(403).json({
        actionRequired: 'BOOK_CONSULTANT',
        message: 'Neural prediction blocked. A verified clinical baseline is required to process this bio-matter.'
      });
    }

    // If they have the data, unlock the gate and let the AI process the image/video!
    next(); 

  } catch (error) {
    console.error('Clinical Gateway Error:', error);
    res.status(500).json({ message: 'Server error during clinical verification.' });
  }
};