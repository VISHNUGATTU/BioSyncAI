import AsyncStorage from '@react-native-async-storage/async-storage';

const COLLECTION_DRAFT_PREFIX = '@biosync_active_collection_draft_';

// Debounce timer dictionary per appointmentId to prevent storage thrashing
const debounceTimers = {};

export const collectionDraftService = {
  /**
   * Save active collection progress locally to AsyncStorage.
   * Debounced to 500ms to guarantee zero UI lag while typing vitals or notes.
   */
  saveDraft: (appointmentId, data) => {
    if (!appointmentId) return;

    if (debounceTimers[appointmentId]) {
      clearTimeout(debounceTimers[appointmentId]);
    }

    debounceTimers[appointmentId] = setTimeout(async () => {
      try {
        const lastSaved = new Date().toISOString();
        const payload = {
          appointmentId,
          lastSaved,
          ...data,
        };
        const storageKey = `${COLLECTION_DRAFT_PREFIX}${appointmentId}`;
        await AsyncStorage.setItem(storageKey, JSON.stringify(payload));
      } catch (err) {
        console.warn('[CollectionDraft] Save error:', err.message);
      }
    }, 500);
  },

  /**
   * Immediately save draft without debouncing (e.g., when app backgrounding or step transition)
   */
  saveDraftSync: async (appointmentId, data) => {
    if (!appointmentId) return;
    try {
      if (debounceTimers[appointmentId]) {
        clearTimeout(debounceTimers[appointmentId]);
        delete debounceTimers[appointmentId];
      }
      const lastSaved = new Date().toISOString();
      const payload = {
        appointmentId,
        lastSaved,
        ...data,
      };
      const storageKey = `${COLLECTION_DRAFT_PREFIX}${appointmentId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(payload));
      return { success: true, lastSaved };
    } catch (err) {
      console.warn('[CollectionDraft] Sync save error:', err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Load active collection draft for a specific appointment
   */
  loadDraft: async (appointmentId) => {
    if (!appointmentId) return null;
    try {
      const storageKey = `${COLLECTION_DRAFT_PREFIX}${appointmentId}`;
      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[CollectionDraft] Load error:', err.message);
    }
    return null;
  },

  /**
   * Check if a valid draft exists for this appointment
   */
  hasDraft: async (appointmentId) => {
    if (!appointmentId) return false;
    try {
      const storageKey = `${COLLECTION_DRAFT_PREFIX}${appointmentId}`;
      const raw = await AsyncStorage.getItem(storageKey);
      return !!raw;
    } catch {
      return false;
    }
  },

  /**
   * Clear active collection draft upon completion, drop-off, or explicit reset
   */
  clearDraft: async (appointmentId) => {
    if (!appointmentId) return;
    try {
      if (debounceTimers[appointmentId]) {
        clearTimeout(debounceTimers[appointmentId]);
        delete debounceTimers[appointmentId];
      }
      const storageKey = `${COLLECTION_DRAFT_PREFIX}${appointmentId}`;
      await AsyncStorage.removeItem(storageKey);
    } catch (err) {
      console.warn('[CollectionDraft] Clear error:', err.message);
    }
  },
};

export default collectionDraftService;
