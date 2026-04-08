// We can use the native fetch API available in modern Node.js
import User from '../models/User.js';

// @desc    Analyze a food item against user's health profile via Python AI
// @route   POST /api/ai/analyze
export const analyzeFood = async (req, res) => {
  try {
    const { foodItem } = req.body;

    if (!foodItem) {
      return res.status(400).json({ message: 'Please provide a food item to analyze.' });
    }

    // 1. We already have the user ID from the protect middleware, 
    // but let's grab their full baseline health data to send to the AI
    const user = await User.findById(req.user._id);

    // 2. Prepare the payload for the Python AI Engine
    const payload = {
      foodItem: foodItem,
      healthProfile: user.baselineHealth
    };

    // 3. Send the data to the Python Microservice (which we will build next)
    // We assume the Python server will run on port 5001
    const pythonResponse = await fetch('http://localhost:5001/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!pythonResponse.ok) {
      throw new Error('Python AI Engine failed to respond');
    }

    const aiVerdict = await pythonResponse.json();

    // 4. Send the AI's calculation back to the React Native app
    res.status(200).json(aiVerdict);

  } catch (error) {
    res.status(500).json({ 
      message: 'AI Engine Error', 
      error: error.message 
    });
  }
};