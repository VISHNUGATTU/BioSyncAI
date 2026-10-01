import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../api/userApi';

const DRAFT_PREFIX = '@biosync_draft_';

// Debounce timer dictionary per draftType to avoid network spamming
const debounceTimers = {};

export const draftService = {
  /**
   * Save draft both locally (immediate for zero latency / offline safety)
   * and to remote backend server (debounced).
   */
  saveDraft: async (draftType, { step = 1, totalSteps = 1, data = {} }) => {
    const lastSaved = new Date().toISOString();
    const draftPayload = {
      draftType,
      step,
      totalSteps,
      data,
      lastSaved,
    };

    // 1. Immediate local save
    try {
      const storageKey = `${DRAFT_PREFIX}${draftType}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(draftPayload));
    } catch (err) {
      console.warn('[DraftService] Local save error:', err.message);
    }

    // 2. Debounced remote backend sync (800ms)
    if (debounceTimers[draftType]) {
      clearTimeout(debounceTimers[draftType]);
    }

    debounceTimers[draftType] = setTimeout(async () => {
      try {
        await userApi.saveDraft(draftType, { step, totalSteps, data });
      } catch (err) {
        // Silently tolerate server sync failures when offline
        console.log('[DraftService] Remote sync deferred:', err.message);
      }
    }, 800);

    return { success: true, lastSaved };
  },

  /**
   * Load draft: Check local AsyncStorage first, then fallback/reconcile with backend.
   */
  loadDraft: async (draftType) => {
    const storageKey = `${DRAFT_PREFIX}${draftType}`;
    let localDraft = null;

    try {
      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) {
        localDraft = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[DraftService] Local read error:', err.message);
    }

    // Try background server check
    try {
      const res = await userApi.getDraft(draftType);
      if (res?.success && res.draft) {
        const serverDraft = res.draft;
        const serverTime = new Date(serverDraft.lastSaved || serverDraft.updatedAt || 0).getTime();
        const localTime = new Date(localDraft?.lastSaved || 0).getTime();

        // If server is newer (e.g., edited on another device), update local and use server
        if (serverTime > localTime) {
          const reconciled = {
            draftType,
            step: serverDraft.step || 1,
            totalSteps: serverDraft.totalSteps || 1,
            data: serverDraft.data || {},
            lastSaved: new Date(serverTime).toISOString(),
          };
          await AsyncStorage.setItem(storageKey, JSON.stringify(reconciled));
          return reconciled;
        }
      }
    } catch (e) {
      // Offline fallback: continue with local
    }

    return localDraft;
  },

  /**
   * Delete draft upon successful submission or explicit user discard.
   */
  clearDraft: async (draftType) => {
    if (debounceTimers[draftType]) {
      clearTimeout(debounceTimers[draftType]);
      delete debounceTimers[draftType];
    }

    const storageKey = `${DRAFT_PREFIX}${draftType}`;
    try {
      await AsyncStorage.removeItem(storageKey);
    } catch (err) {
      console.warn('[DraftService] Local clear error:', err.message);
    }

    try {
      await userApi.deleteDraft(draftType);
    } catch (err) {
      console.log('[DraftService] Remote delete note:', err.message);
    }

    return { success: true };
  },

  /**
   * Quickly check if draft exists.
   */
  hasDraft: async (draftType) => {
    const storageKey = `${DRAFT_PREFIX}${draftType}`;
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      return !!raw;
    } catch {
      return false;
    }
  },
};

export default draftService;
