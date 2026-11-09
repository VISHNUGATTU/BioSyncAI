/**
 * BioSync AI - Vernacular Voice Client API Service
 * 
 * Interacts with backend Vernacular Voice AI endpoints for multilingual food logging
 * and hands-free single-pot kitchen audio coaching.
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://127.0.0.1:5000/api/voice';

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem('userToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const voiceApi = {
  // Parse spoken transcript in Hindi, Telugu, Tamil, Marathi, or English
  parseVoiceTranscript: async (transcript, language = 'hi') => {
    const headers = await getAuthHeaders();
    const res = await axios.post(`${API_BASE_URL}/parse-and-simulate`, { transcript, language }, { headers });
    return res.data;
  },

  // Get hands-free spoken single-pot kitchen directives
  getKitchenAudioCoach: async (potSizeGrams, dishName, familyMembers, language = 'hi') => {
    const headers = await getAuthHeaders();
    const res = await axios.post(`${API_BASE_URL}/kitchen-coach`, {
      potSizeGrams,
      dishName,
      familyMembers,
      language
    }, { headers });
    return res.data;
  }
};

