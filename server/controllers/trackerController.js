import Scan from '../models/Scan.js';
import User from '../models/User.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import os from 'os'; // Needed for temp directories

export const logScan = async (req, res) => {
  let tempFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video stream provided.' });
    }

    const currentUser = await User.findById(req.user._id);
    const biometrics = currentUser.baselineHealth || {};

    // 1. Convert the RAM buffer into a temporary file so Python can read it
    tempFilePath = path.join(os.tmpdir(), `biosync-video-${Date.now()}.mp4`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    // 2. Prepare the file to send to Python
    const form = new FormData();
    form.append('file', fs.createReadStream(tempFilePath));
    
    const weight = biometrics.weight || 70;
    const activity = biometrics.activityLevel || 'Moderate';

    // 3. Call Python AI Engine
    const pythonResponse = await axios.post(
      `http://localhost:8000/analyze?weight=${weight}&activity_level=${activity}`, 
      form, 
      { headers: form.getHeaders() }
    );

    const aiPrediction = pythonResponse.data;

    // 4. Save to MongoDB
    const scan = await Scan.create({
      user: req.user._id,
      foodName: aiPrediction.itemsFound[0],
      imageUrl: "", 
      glucoseImpact: aiPrediction.glucoseImpact,
      verdict: aiPrediction.verdict === "TAKEN" ? "OPTIMAL" : "SPIKE",
      macros: aiPrediction.macros
    });

    // 5. Clean up the temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    res.status(201).json({ scan, aiData: aiPrediction });

  } catch (error) {
    console.error('Bridge Error:', error.message);
    // Cleanup if it crashes midway
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    res.status(500).json({ message: 'Failed to communicate with Python AI Engine.' });
  }
};
// @desc    Get user's scan history
// @route   GET /api/tracker/history
export const getHistory = async (req, res) => {
  try {
    // Check if the frontend asked for a specific limit (e.g., Dashboard only wants 5)
    const limit = req.query.limit ? parseInt(req.query.limit) : 0; // 0 means no limit (return all)

    // Find scans belonging ONLY to the logged-in user, sort by newest first
    const scans = await Scan.find({ user: req.user._id })
                            .sort({ createdAt: -1 }) // -1 sorts descending (newest at the top)
                            .limit(limit);

    res.json(scans);

  } catch (error) {
    console.error('History Fetch Error:', error);
    res.status(500).json({ message: 'Server error while fetching history.' });
  }
};

export const getScanHistory = async (req, res) => {
  try {
    // If the frontend asks for a limit (like the Dashboard asking for 5), use it. Otherwise, default to 50.
    const limit = parseInt(req.query.limit) || 50;
    
    const scans = await Scan.find({ user: req.user._id })
      .sort({ createdAt: -1 }) // -1 sorts by newest first
      .limit(limit);

    res.status(200).json(scans);
  } catch (error) {
    console.error("History Fetch Error:", error);
    res.status(500).json({ message: "Failed to retrieve neural logs." });
  }
};

// Add this below getScanHistory

export const getHealthSummary = async (req, res) => {
  try {
    // 1. Get midnight of the current day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. Fetch all scans from today only
    const dailyScans = await Scan.find({
      user: req.user._id,
      createdAt: { $gte: today }
    });

    let totalImpact = 0;
    let spikeCount = 0;
    let optimalCount = 0;
    let totalCarbs = 0;

    // 3. Tally up the damage/success
    dailyScans.forEach(scan => {
      totalImpact += (scan.glucoseImpact || 0);
      if (scan.macros && scan.macros.carbs) totalCarbs += scan.macros.carbs;
      
      if (scan.verdict === 'SPIKE') spikeCount++;
      if (scan.verdict === 'OPTIMAL') optimalCount++;
    });

    // 4. Calculate the Daily Stability Score (0 to 100)
    // You start at 100. Every point of glucose impact slowly chips away at your score.
    let stabilityScore = Math.max(0, 100 - (totalImpact * 0.4));

    res.status(200).json({
      stabilityScore: Math.round(stabilityScore),
      totalImpact,
      scansToday: dailyScans.length,
      spikeCount,
      optimalCount,
      totalCarbs: Math.round(totalCarbs)
    });

  } catch (error) {
    console.error("Health Summary Error:", error);
    res.status(500).json({ message: "Failed to calculate bio-metrics." });
  }
};