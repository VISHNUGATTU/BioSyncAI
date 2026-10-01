import { create } from 'zustand';
import staffApi from '../api/staffApi';

export const useAppointmentStore = create((set, get) => ({
  // ─────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────
  kpis: null,

  pendingAppointments: [],
  appointmentsList: [],
  appointments: [],

  activeAppointment: null,

  collectedSamples: [],
  inTransitSamples: [],

  allAssistantSamples: [],
  recentSamples: [],

  labQueue: [],

  earnings: null,

  loading: false,
  error: null,

  // ─────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────
  fetchDashboardData: async () => {
    try {
      set({
        loading: true,
        error: null,
      });

      const [
        kpisRes,
        pendingRes,
        collectedRes,
        allSamplesRes,
      ] = await Promise.all([
        staffApi.getDashboardKPIs(),
        staffApi.getPendingAppointments(),
        staffApi.getCollectedSamples(),
        staffApi
          .getAllAssistantSamples()
          .catch(() => ({
            success: false,
            data: [],
          })),
      ]);

      const pendingAppointments =
        pendingRes?.success && Array.isArray(pendingRes.data)
          ? pendingRes.data
          : [];

      const collectedSamples =
        collectedRes?.success && Array.isArray(collectedRes.data)
          ? collectedRes.data
          : [];

      const allAssistantSamples =
        allSamplesRes?.success && Array.isArray(allSamplesRes.data)
          ? allSamplesRes.data
          : [];

      const recentSamples =
        kpisRes?.success &&
        Array.isArray(kpisRes.data?.recentSamples)
          ? kpisRes.data.recentSamples
          : allAssistantSamples.slice(0, 10);

      // Find the currently active appointment.
      const active =
        pendingAppointments.find(
          (appointment) =>
            appointment.status === 'On_The_Way' ||
            appointment.status === 'Arrived' ||
            appointment.status === 'Collecting'
        ) ||
        pendingAppointments[0] ||
        null;

      set({
        kpis: kpisRes?.success ? kpisRes.data : null,

        pendingAppointments,

        // Alias used by existing screens.
        appointments: pendingAppointments,

        activeAppointment: active,

        collectedSamples,

        // Alias used by existing screens.
        inTransitSamples: collectedSamples,

        allAssistantSamples,

        recentSamples,

        loading: false,
        error: null,
      });

      return {
        success: true,
        data: {
          kpis: kpisRes?.success ? kpisRes.data : null,
          pendingAppointments,
          collectedSamples,
          allAssistantSamples,
          recentSamples,
        },
      };
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch dashboard data';

      console.error(
        '[AppointmentStore] Dashboard fetch failed:',
        message
      );

      set({
        loading: false,
        error: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  // ─────────────────────────────────────────────
  // APPOINTMENTS
  // ─────────────────────────────────────────────
  fetchAppointmentsByCategory: async (
    category = 'pending'
  ) => {
    try {
      set({
        loading: true,
        error: null,
      });

      const res =
        await staffApi.getAppointmentsByCategory(category);

      if (res?.success) {
        const appointments = Array.isArray(res.data)
          ? res.data
          : [];

        set({
          appointmentsList: appointments,
          loading: false,
          error: null,
        });

        return appointments;
      }

      const message =
        res?.message ||
        'Failed to fetch appointments';

      set({
        appointmentsList: [],
        loading: false,
        error: message,
      });

      return [];
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch appointments';

      console.error(
        '[AppointmentStore] Appointment fetch failed:',
        message
      );

      set({
        loading: false,
        error: message,
      });

      return [];
    }
  },

  setActiveAppointment: (appointment) => {
    set({
      activeAppointment: appointment || null,
    });
  },

  // ─────────────────────────────────────────────
  // APPOINTMENT STATUS
  // ─────────────────────────────────────────────
  updateStatus: async (
    appointmentId,
    status,
    collectionOTP = null
  ) => {
    try {
      const res =
        await staffApi.updateAppointmentStatus(
          appointmentId,
          status,
          collectionOTP
        );

      if (res?.success) {
        // Refresh dashboard/list data after status change.
        await get().fetchDashboardData();

        return {
          success: true,
          data: res.data,
          message: res.message,
        };
      }

      return {
        success: false,
        message:
          res?.message ||
          'Status transition failed',
      };
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Error updating appointment status';

      console.error(
        '[AppointmentStore] Status update failed:',
        message
      );

      return {
        success: false,
        message,
      };
    }
  },

  // ─────────────────────────────────────────────
  // SAMPLE COLLECTION + COD
  // ─────────────────────────────────────────────
  collectSampleAndCOD: async (
    appointmentId,
    barcodeOrData,
    vitals = null,
    questionnaire = null,
    paymentDetails = null
  ) => {
    try {
      const res =
        await staffApi.collectSampleAndCOD(
          appointmentId,
          barcodeOrData,
          vitals,
          questionnaire,
          paymentDetails
        );

      if (res?.success) {
        await get().fetchDashboardData();

        return {
          success: true,
          sample: res.sample,
          data: res.data,
          message: res.message,
        };
      }

      return {
        success: false,
        message:
          res?.message ||
          'Sample collection failed',
      };
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Collection failed';

      console.error(
        '[AppointmentStore] Sample collection failed:',
        message
      );

      return {
        success: false,
        message,
      };
    }
  },

  // ─────────────────────────────────────────────
  // VITALS
  // ─────────────────────────────────────────────
  recordAppointmentVitals: async (
    appointmentId,
    vitals
  ) => {
    try {
      const res =
        await staffApi.recordAppointmentVitals(
          appointmentId,
          vitals
        );

      if (res?.success) {
        return {
          success: true,
          data: res.data,
          message: res.message,
        };
      }

      return {
        success: false,
        message:
          res?.message ||
          'Failed to record vitals',
      };
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to record vitals';

      console.error(
        '[AppointmentStore] Record vitals failed:',
        message
      );

      return {
        success: false,
        message,
      };
    }
  },

  // ─────────────────────────────────────────────
  // REJECT APPOINTMENT / SAMPLE
  // ─────────────────────────────────────────────
  rejectAppointment: async (
    appointmentId,
    reason,
    notes,
    exceptionType
  ) => {
    try {
      const res =
        await staffApi.rejectSample(
          appointmentId,
          reason,
          notes,
          exceptionType
        );

      if (res?.success) {
        await get().fetchDashboardData();

        return {
          success: true,
          data: res.data,
          message: res.message,
        };
      }

      return {
        success: false,
        message:
          res?.message ||
          'Rejection failed',
      };
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Error rejecting sample';

      console.error(
        '[AppointmentStore] Reject appointment failed:',
        message
      );

      return {
        success: false,
        message,
      };
    }
  },

  // ─────────────────────────────────────────────
  // COLLECTED SAMPLES
  // ─────────────────────────────────────────────
  fetchCollectedSamples: async () => {
    try {
      const res =
        await staffApi.getCollectedSamples();

      if (res?.success) {
        const samples = Array.isArray(res.data)
          ? res.data
          : [];

        set({
          collectedSamples: samples,
          inTransitSamples: samples,
        });

        return samples;
      }

      return [];
    } catch (err) {
      console.warn(
        '[AppointmentStore] Error fetching collected samples:',
        err?.response?.data?.message ||
          err?.message
      );

      return [];
    }
  },

  // ─────────────────────────────────────────────
  // ALL ASSISTANT SAMPLES
  // ─────────────────────────────────────────────
  fetchAllAssistantSamples: async () => {
    try {
      const res =
        await staffApi.getAllAssistantSamples();

      if (res?.success) {
        const samples = Array.isArray(res.data)
          ? res.data
          : [];

        set({
          allAssistantSamples: samples,
        });

        return samples;
      }

      return [];
    } catch (err) {
      console.warn(
        '[AppointmentStore] Error fetching assistant samples:',
        err?.response?.data?.message ||
          err?.message
      );

      return [];
    }
  },

  // ─────────────────────────────────────────────
  // LABORATORY DROPOFF
  // ─────────────────────────────────────────────
  dropoffSamplesToLab: async (sampleIds) => {
    try {
      const res =
        await staffApi.bulkLaboratoryDropoff(
          sampleIds
        );

      if (res?.success) {
        await get().fetchDashboardData();

        return {
          success: true,
          message:
            res.message ||
            'Samples dropped off successfully',
          data: res.data,
        };
      }

      return {
        success: false,
        message:
          res?.message ||
          'Dropoff failed',
      };
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Dropoff error';

      console.error(
        '[AppointmentStore] Laboratory dropoff failed:',
        message
      );

      return {
        success: false,
        message,
      };
    }
  },

  // ─────────────────────────────────────────────
  // SAMPLE RESULTS
  // ─────────────────────────────────────────────
  updateSampleResultsStatus: async (
    sampleId,
    resultsDone
  ) => {
    try {
      const res =
        await staffApi.updateSampleResultsStatus(
          sampleId,
          resultsDone
        );

      if (res?.success) {
        await Promise.all([
          get().fetchDashboardData(),
          get().fetchLabQueue(),
          get().fetchAllAssistantSamples(),
        ]);

        return {
          success: true,
          sample: res.sample,
          data: res.data,
          message: res.message,
        };
      }

      return {
        success: false,
        message:
          res?.message ||
          'Failed to update sample results status',
      };
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update sample results status';

      console.error(
        '[AppointmentStore] Sample results update failed:',
        message
      );

      return {
        success: false,
        message,
      };
    }
  },

  // ─────────────────────────────────────────────
  // LAB QUEUE
  // ─────────────────────────────────────────────
  fetchLabQueue: async () => {
    try {
      const res =
        await staffApi.getProcessingQueue();

      if (res?.success) {
        const queue = Array.isArray(res.data)
          ? res.data
          : [];

        set({
          labQueue: queue,
        });

        return queue;
      }

      return [];
    } catch (err) {
      console.warn(
        '[AppointmentStore] Error fetching lab queue:',
        err?.response?.data?.message ||
          err?.message
      );

      return [];
    }
  },

  // ─────────────────────────────────────────────
  // EARNINGS
  // ─────────────────────────────────────────────
  fetchEarnings: async () => {
    try {
      const res =
        await staffApi.getEarnings();

      if (res?.success) {
        set({
          earnings: res.data,
        });

        return res.data;
      }

      return null;
    } catch (err) {
      console.warn(
        '[AppointmentStore] Error fetching earnings:',
        err?.response?.data?.message ||
          err?.message
      );

      return null;
    }
  },

  // ─────────────────────────────────────────────
  // CLEAR STORE
  // ─────────────────────────────────────────────
  clearAppointmentData: () => {
    set({
      kpis: null,
      pendingAppointments: [],
      appointmentsList: [],
      appointments: [],
      activeAppointment: null,
      collectedSamples: [],
      inTransitSamples: [],
      allAssistantSamples: [],
      recentSamples: [],
      labQueue: [],
      earnings: null,
      loading: false,
      error: null,
    });
  },

  // ─────────────────────────────────────────────
  // CLEAR ONLY ERROR
  // ─────────────────────────────────────────────
  clearError: () => {
    set({
      error: null,
    });
  },
}));

export default useAppointmentStore;