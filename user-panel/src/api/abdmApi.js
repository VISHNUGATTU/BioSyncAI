/**
 * BioSync AI - ABDM / ABHA Client API Service
 * 
 * Bridges the React Native mobile user application with the backend
 * Ayushman Bharat Digital Mission (ABDM) Gateway service.
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://127.0.0.1:5000/api/abdm';

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem('userToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const abdmApi = {
  // Milestone 1 (M1): Generate OTP for Aadhaar or Mobile
  generateOtp: async (identifier, type = 'AADHAAR') => {
    const headers = await getAuthHeaders();
    const res = await axios.post(`${API_BASE_URL}/m1/generate-otp`, { identifier, type }, { headers });
    return res.data;
  },

  // Milestone 1 (M1): Verify OTP and create ABHA number & address
  verifyOtp: async (txnId, otp, preferredAbhaAddress = '') => {
    const headers = await getAuthHeaders();
    const res = await axios.post(`${API_BASE_URL}/m1/verify-otp`, { txnId, otp, preferredAbhaAddress }, { headers });
    return res.data;
  },

  // Milestone 1 (M1): Get user's linked ABHA profile & card
  getProfile: async () => {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/m1/profile`, { headers });
    return res.data;
  },

  // Milestone 2 (M2): Discover Care Contexts (Diagnostic Reports, Vitals, Food Plans)
  discoverCareContexts: async (patientMobile, patientAbhaAddress) => {
    const headers = await getAuthHeaders();
    const res = await axios.post(`${API_BASE_URL}/m2/discover-contexts`, { patientMobile, patientAbhaAddress }, { headers });
    return res.data;
  },

  // Milestone 2 (M2): Link Care Contexts with OTP
  initiateCareContextLink: async (patientAbhaAddress, careContextReferences) => {
    const headers = await getAuthHeaders();
    const res = await axios.post(`${API_BASE_URL}/m2/link/init`, { patientAbhaAddress, careContextReferences }, { headers });
    return res.data;
  },

  confirmCareContextLink: async (linkTxnId, otp) => {
    const headers = await getAuthHeaders();
    const res = await axios.post(`${API_BASE_URL}/m2/link/confirm`, { linkTxnId, otp }, { headers });
    return res.data;
  },

  // Milestone 2 (M2): Transfer FHIR R4 Bundle
  transferFhirBundle: async (careContextReference, consentId) => {
    const headers = await getAuthHeaders();
    const res = await axios.post(`${API_BASE_URL}/m2/transfer-fhir`, { careContextReference, consentId }, { headers });
    return res.data;
  },

  // Milestone 3 (M3): Initiate External Consent Request
  initiateConsentRequest: async (targetAbhaAddress, hiTypes, dateRange, purpose) => {
    const headers = await getAuthHeaders();
    const res = await axios.post(`${API_BASE_URL}/m3/consent/init`, { targetAbhaAddress, hiTypes, dateRange, purpose }, { headers });
    return res.data;
  },

  // Milestone 3 (M3): Ingest External EHR Bundle
  ingestExternalFhir: async (fhirBundle) => {
    const headers = await getAuthHeaders();
    const res = await axios.post(`${API_BASE_URL}/m3/ingest-ehr`, { fhirBundle }, { headers });
    return res.data;
  }
};

