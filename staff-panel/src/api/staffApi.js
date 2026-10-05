import api from './axios';

export const staffApi = {
  // ============================================================
  // AUTHENTICATION
  // ============================================================

  login: async (phone, password) => {
    const res = await api.post(
      '/lab-assistant/login',
      {
        phone,
        password,
      }
    );

    return res.data;
  },

  logout: async () => {
    try {
      const res = await api.post('/lab-assistant/logout');
      return res.data;
    } catch (_) {
      return { success: true };
    }
  },

  updatePushToken: async (pushToken) => {
    const res = await api.put('/lab-assistant/push-token', {
      pushToken,
      fcmToken: pushToken,
    });
    return res.data;
  },

  // ============================================================
  // TELEMETRY & DASHBOARD
  // ============================================================

  getDashboardKPIs: async () => {
    const res = await api.get(
      '/lab-assistant/kpis'
    );

    return res.data;
  },

  getEarnings: async () => {
    const res = await api.get(
      '/lab-assistant/earnings'
    );

    return res.data;
  },

  // ============================================================
  // APPOINTMENTS WORKFLOW
  // ============================================================

  getPendingAppointments: async () => {
    const res = await api.get(
      '/lab-assistant/appointments/pending'
    );

    return res.data;
  },

  getAppointmentsByCategory: async (
    category
  ) => {
    const res = await api.get(
      `/lab-assistant/appointments/category/${category}`
    );

    return res.data;
  },

  updateAppointmentStatus: async (
    appointmentId,
    status,
    collectionOTP = null
  ) => {
    const payload = {
      status,
    };

    if (collectionOTP) {
      payload.collectionOTP = collectionOTP;
    }

    const res = await api.put(
      `/lab-assistant/appointments/${appointmentId}/status`,
      payload
    );

    return res.data;
  },

  collectSampleAndCOD: async (
    appointmentId,
    barcodeOrData,
    vitals = null,
    questionnaire = null,
    paymentDetails = null
  ) => {
    let payload;

    if (
      typeof barcodeOrData === 'object' &&
      barcodeOrData !== null
    ) {
      payload = barcodeOrData;
    } else {
      payload = {
        barcode: barcodeOrData,
      };

      if (vitals) {
        payload.vitals = vitals;
      }

      if (questionnaire) {
        payload.questionnaire = questionnaire;
      }

      if (paymentDetails) {
        payload.paymentDetails =
          paymentDetails;
      }
    }

    const res = await api.put(
      `/lab-assistant/appointments/${appointmentId}/sample/collect`,
      payload
    );

    return res.data;
  },

  // ============================================================
  // DOCTOR ENDPOINTS
  // ============================================================

  getDoctorSamplesOverview: async () => {
    const res = await api.get(
      '/doctor/samples/overview'
    );

    return res.data;
  },

  doctorStartProcessing: async (
    sampleId
  ) => {
    const res = await api.post(
      `/doctor/samples/${sampleId}/start-processing`
    );

    return res.data;
  },

  doctorUpdateResultsStatus: async (
    sampleId,
    resultsDone
  ) => {
    const res = await api.put(
      `/doctor/samples/${sampleId}/results-status`,
      {
        resultsDone,
      }
    );

    return res.data;
  },

  doctorVerifyReport: async (
    sampleId,
    remarks,
    testResults = null,
    isApproved = true,
    vitals = null
  ) => {
    const payload = {
      remarks,
      testResults,
      isApproved,
    };

    if (vitals) {
      payload.vitals = vitals;
    }

    const res = await api.post(
      `/doctor/samples/${sampleId}/verify`,
      payload
    );

    return res.data;
  },

  // ============================================================
  // APPOINTMENT VITALS
  // ============================================================

  recordAppointmentVitals: async (
    appointmentId,
    vitals
  ) => {
    const res = await api.post(
      `/lab-assistant/appointments/${appointmentId}/vitals`,
      {
        vitals,
      }
    );

    return res.data;
  },

  getAppointmentVitals: async (
    appointmentId
  ) => {
    const res = await api.get(
      `/lab-assistant/appointments/${appointmentId}/vitals`
    );

    return res.data;
  },

  // ============================================================
  // SAMPLE REJECTION
  // ============================================================

  rejectSample: async (
    appointmentId,
    reason,
    notes = '',
    exceptionType = ''
  ) => {
    const res = await api.post(
      `/lab-assistant/appointments/${appointmentId}/sample/reject`,
      {
        reason,
        notes,
        exceptionType,
      }
    );

    return res.data;
  },

  // ============================================================
  // BARCODE
  // ============================================================

  checkBarcodeAvailability: async (
    barcode
  ) => {
    const encodedBarcode =
      encodeURIComponent(barcode);

    const res = await api.get(
      `/lab-assistant/barcode/check/${encodedBarcode}`
    );

    return res.data;
  },

  generateUniqueBarcode: async () => {
    const res = await api.get(
      '/lab-assistant/barcode/generate'
    );

    return res.data;
  },

  // ============================================================
  // SAMPLE MANAGEMENT
  // ============================================================

  getCollectedSamples: async () => {
    const res = await api.get(
      '/lab-assistant/samples/collected'
    );

    return res.data;
  },

  getAllAssistantSamples: async () => {
    const res = await api.get(
      '/lab-assistant/samples/all'
    );

    return res.data;
  },

  bulkLaboratoryDropoff: async (
    sampleIds
  ) => {
    const res = await api.put(
      '/lab-assistant/samples/dropoff',
      {
        sampleIds,
      }
    );

    return res.data;
  },

  updateSampleResultsStatus: async (
    sampleId,
    resultsDone
  ) => {
    try {
      // Doctor endpoint first.
      const res = await api.put(
        `/doctor/samples/${sampleId}/results-status`,
        {
          resultsDone,
        }
      );

      return res.data;
    } catch (error) {
      // Preserve your existing fallback.
      if (
        error?.response?.status !== 404
      ) {
        throw error;
      }

      const res = await api.put(
        `/lab-assistant/samples/${sampleId}/results-status`,
        {
          resultsDone,
        }
      );

      return res.data;
    }
  },

  // ============================================================
  // COLLECTION EVIDENCE
  // ============================================================

  uploadCollectionEvidence: async (
    sampleId,
    imageUri
  ) => {
    const formData = new FormData();

    const filename =
      imageUri?.split('/').pop() ||
      'evidence.jpg';

    const match =
      /\.(\w+)$/.exec(filename);

    const extension = match
      ? match[1].toLowerCase()
      : 'jpg';

    const type =
      extension === 'png'
        ? 'image/png'
        : extension === 'webp'
          ? 'image/webp'
          : 'image/jpeg';

    formData.append(
      'evidenceImage',
      {
        uri: imageUri,
        name: filename,
        type,
      }
    );

    const res = await api.post(
      `/lab-assistant/samples/${sampleId}/evidence`,
      formData
    );

    return res.data;
  },

  // ============================================================
  // PROCESSING QUEUE
  // ============================================================

  getProcessingQueue: async () => {
    const res = await api.get(
      '/lab-assistant/samples/queue'
    );

    return res.data;
  },

  startSampleProcessing: async (
    sampleId
  ) => {
    const res = await api.post(
      `/lab-assistant/samples/${sampleId}/process`
    );

    return res.data;
  },

  submitTestResults: async (
    sampleId,
    results,
    vitals = null
  ) => {
    const payload = {
      results,
    };

    if (vitals) {
      payload.vitals = vitals;
    }

    const res = await api.post(
      `/lab-assistant/samples/${sampleId}/results`,
      payload
    );

    return res.data;
  },

  // ============================================================
  // LOCATION
  // ============================================================

  updateLiveLocation: async (
    lat,
    lng,
    heading = 0
  ) => {
    const res = await api.put(
      '/lab-assistant/location',
      {
        lat,
        lng,
        heading,
      }
    );

    return res.data;
  },

  // ============================================================
  // PROFILE
  // ============================================================

  getProfile: async () => {
    const res = await api.get(
      '/lab-assistant/profile'
    );

    return res.data;
  },

  updateProfile: async (
    profileData
  ) => {
    const res = await api.put(
      '/lab-assistant/profile',
      profileData
    );

    return res.data;
  },

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  getNotifications: async (params = {}) => {
    const res = await api.get('/notifications', { params });
    return res.data;
  },

  markNotificationRead: async (id) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },

  markAllNotificationsRead: async () => {
    const res = await api.put('/notifications/read-all');
    return res.data;
  },
};

export default staffApi;