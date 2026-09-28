import api from './axios';

export const staffApi = {
  // Authentication
  login: async (phone, password) => {
    const res = await api.post('/lab-assistant/login', { phone, password });
    return res.data;
  },

  // Telemetry & Dashboard
  getDashboardKPIs: async () => {
    const res = await api.get('/lab-assistant/kpis');
    return res.data;
  },

  getEarnings: async () => {
    const res = await api.get('/lab-assistant/earnings');
    return res.data;
  },

  // Appointments Workflow
  getPendingAppointments: async () => {
    const res = await api.get('/lab-assistant/appointments/pending');
    return res.data;
  },

  getAppointmentsByCategory: async (category) => {
    const res = await api.get(`/lab-assistant/appointments/category/${category}`);
    return res.data;
  },

  updateAppointmentStatus: async (appointmentId, status, collectionOTP = null) => {
    const payload = { status };
    if (collectionOTP) {
      payload.collectionOTP = collectionOTP;
    }
    const res = await api.put(`/lab-assistant/appointments/${appointmentId}/status`, payload);
    return res.data;
  },

  collectSampleAndCOD: async (appointmentId, barcodeOrData, vitals = null, questionnaire = null, paymentDetails = null) => {
    let payload;
    if (typeof barcodeOrData === 'object' && barcodeOrData !== null) {
      payload = barcodeOrData;
    } else {
      payload = { barcode: barcodeOrData };
      if (vitals) payload.vitals = vitals;
      if (questionnaire) payload.questionnaire = questionnaire;
      if (paymentDetails) payload.paymentDetails = paymentDetails;
    }
    const res = await api.put(`/lab-assistant/appointments/${appointmentId}/sample/collect`, payload);
    return res.data;
  },

  // Doctor Specific Endpoints
  getDoctorSamplesOverview: async () => {
    const res = await api.get('/doctor/samples/overview');
    return res.data;
  },

  doctorStartProcessing: async (sampleId) => {
    const res = await api.post(`/doctor/samples/${sampleId}/start-processing`);
    return res.data;
  },

  doctorUpdateResultsStatus: async (sampleId, resultsDone) => {
    const res = await api.put(`/doctor/samples/${sampleId}/results-status`, {
      resultsDone,
    });
    return res.data;
  },

  doctorVerifyReport: async (sampleId, remarks, testResults = null, isApproved = true, vitals = null) => {
    const payload = { remarks, testResults, isApproved };
    if (vitals) payload.vitals = vitals;
    const res = await api.post(`/doctor/samples/${sampleId}/verify`, payload);
    return res.data;
  },

  recordAppointmentVitals: async (appointmentId, vitals) => {
    const res = await api.post(`/lab-assistant/appointments/${appointmentId}/vitals`, { vitals });
    return res.data;
  },

  getAppointmentVitals: async (appointmentId) => {
    const res = await api.get(`/lab-assistant/appointments/${appointmentId}/vitals`);
    return res.data;
  },

  rejectSample: async (appointmentId, reason, notes = '') => {
    const res = await api.post(`/lab-assistant/appointments/${appointmentId}/sample/reject`, {
      reason,
      notes,
    });
    return res.data;
  },

  // Barcode Verification & Duplicate Checking
  checkBarcodeAvailability: async (barcode) => {
    const res = await api.get(`/lab-assistant/barcode/check/${encodeURIComponent(barcode)}`);
    return res.data;
  },

  generateUniqueBarcode: async () => {
    const res = await api.get('/lab-assistant/barcode/generate');
    return res.data;
  },

  // Samples Management
  getCollectedSamples: async () => {
    const res = await api.get('/lab-assistant/samples/collected');
    return res.data;
  },

  getAllAssistantSamples: async () => {
    const res = await api.get('/lab-assistant/samples/all');
    return res.data;
  },

  bulkLaboratoryDropoff: async (sampleIds) => {
    const res = await api.put('/lab-assistant/samples/dropoff', {
      sampleIds,
    });
    return res.data;
  },

  updateSampleResultsStatus: async (sampleId, resultsDone) => {
    try {
      const res = await api.put(`/doctor/samples/${sampleId}/results-status`, {
        resultsDone,
      });
      return res.data;
    } catch (e) {
      const res = await api.put(`/lab-assistant/samples/${sampleId}/results-status`, {
        resultsDone,
      });
      return res.data;
    }
  },

  uploadCollectionEvidence: async (sampleId, imageUri) => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'evidence.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('evidenceImage', {
      uri: imageUri,
      name: filename,
      type,
    });

    const res = await api.post(`/lab-assistant/samples/${sampleId}/evidence`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  getProcessingQueue: async () => {
    const res = await api.get('/lab-assistant/samples/queue');
    return res.data;
  },

  startSampleProcessing: async (sampleId) => {
    const res = await api.post(`/lab-assistant/samples/${sampleId}/process`);
    return res.data;
  },

  submitTestResults: async (sampleId, results, vitals = null) => {
    const payload = { results };
    if (vitals) payload.vitals = vitals;
    const res = await api.post(`/lab-assistant/samples/${sampleId}/results`, payload);
    return res.data;
  },

  // Staff Geolocation & Profile
  updateLiveLocation: async (lat, lng, heading = 0) => {
    const res = await api.put('/lab-assistant/location', {
      lat,
      lng,
      heading,
    });
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get('/lab-assistant/profile');
    return res.data;
  },

  updateProfile: async (profileData) => {
    const res = await api.put('/lab-assistant/profile', profileData);
    return res.data;
  },
};

export default staffApi;
