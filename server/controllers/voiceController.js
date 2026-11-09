import {
  parseVoiceTranscriptAndSimulate,
  getVernacularKitchenCoaching
} from '../services/voiceService.js';

/**
 * Controller: Parse spoken vernacular food speech and run in-silico simulation
 */
export async function handleVoiceFoodLog(req, res) {
  try {
    const userId = req.user?._id || req.body.userId;
    const { transcript, language } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ success: false, message: 'Spoken transcript is required.' });
    }

    const result = await parseVoiceTranscriptAndSimulate({
      userId,
      transcript,
      language: language || 'hi'
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Controller: Hands-free vernacular kitchen audio coaching for single-pot meal plating
 */
export async function handleKitchenAudioCoach(req, res) {
  try {
    const { potSizeGrams, dishName, familyMembers, language } = req.body;
    
    const result = await getVernacularKitchenCoaching({
      potSizeGrams: Number(potSizeGrams) || 1000.0,
      dishName: dishName || 'Hyderabadi Dum Biryani',
      familyMembers: familyMembers || [],
      language: language || 'hi'
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

