import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import staffApi from '../api/staffApi';
import collectionDraftService from './collectionDraftService';

const QUEUE_STORAGE_KEY = '@biosync_offline_sync_queue';

class OfflineSyncQueueService {
  constructor() {
    this.queue = [];
    this.isSyncing = false;
    this.isConnected = true;
    this.isInternetReachable = true;
    this.subscribers = new Set();
    this.initialized = false;
    this.netInfoUnsubscribe = null;
  }

  /**
   * Initialize queue and start background network listener
   */
  async init() {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Load persisted offline queue from AsyncStorage
    await this.loadQueue();

    // 2. Setup real-time NetInfo connectivity listener
    this.netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = !this.isConnected || this.isInternetReachable === false;
      this.isConnected = !!state.isConnected;
      this.isInternetReachable = state.isInternetReachable !== false;

      const isNowOnline = this.isConnected && this.isInternetReachable;

      console.log(
        `[OfflineSync] Network State Changed: Connected=${this.isConnected}, Reachable=${this.isInternetReachable}`
      );

      this.notifySubscribers({
        event: 'NETWORK_CHANGE',
        isConnected: this.isConnected,
        isOnline: isNowOnline,
      });

      // If reconnected from dead-zone, automatically flush queued submissions!
      if (wasOffline && isNowOnline && this.queue.length > 0) {
        console.log(`[OfflineSync] Connection re-established! Flushing ${this.queue.length} pending items...`);
        this.processQueue();
      }
    });

    // Check initial network state
    const currentNet = await NetInfo.fetch();
    this.isConnected = !!currentNet.isConnected;
    this.isInternetReachable = currentNet.isInternetReachable !== false;

    if (this.isConnected && this.isInternetReachable && this.queue.length > 0) {
      this.processQueue();
    }
  }

  /**
   * Load queue from AsyncStorage
   */
  async loadQueue() {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (raw) {
        this.queue = JSON.parse(raw);
        console.log(`[OfflineSync] Loaded ${this.queue.length} pending items from storage.`);
      } else {
        this.queue = [];
      }
    } catch (err) {
      console.warn('[OfflineSync] Failed to load offline queue:', err.message);
      this.queue = [];
    }
  }

  /**
   * Persist current queue to AsyncStorage
   */
  async persistQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (err) {
      console.warn('[OfflineSync] Failed to persist offline queue:', err.message);
    }
  }

  /**
   * Enqueue a new action (Sample collection, Dropoff, Vitals, etc.)
   */
  async enqueueAction({
    type = 'SAMPLE_COLLECTION',
    appointmentId,
    payload,
    patientName = 'Patient',
  }) {
    await this.init();

    const queueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      appointmentId,
      payload,
      patientName,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      lastAttempt: null,
      status: 'PENDING',
    };

    this.queue.push(queueItem);
    await this.persistQueue();

    console.log(`[OfflineSync] Action enqueued: ${type} for appointment ${appointmentId}`);

    this.notifySubscribers({
      event: 'ITEM_ENQUEUED',
      item: queueItem,
      pendingCount: this.getPendingCount(),
    });

    // If online right now, attempt immediate background flush
    if (this.isOnline()) {
      this.processQueue();
    }

    return queueItem;
  }

  /**
   * Sequential background sync processor
   */
  async processQueue() {
    if (this.isSyncing) return;
    if (this.queue.length === 0) return;
    if (!this.isOnline()) {
      console.log('[OfflineSync] Device is offline. Sync postponed until LTE/Wi-Fi restores.');
      return;
    }

    this.isSyncing = true;
    this.notifySubscribers({ event: 'SYNC_STARTED', pendingCount: this.getPendingCount() });

    console.log(`[OfflineSync] Processing sync queue (${this.queue.length} items)...`);

    const remainingQueue = [];

    for (const item of this.queue) {
      item.status = 'SYNCING';
      item.lastAttempt = new Date().toISOString();
      item.retryCount = (item.retryCount || 0) + 1;

      try {
        let res;
        if (item.type === 'SAMPLE_COLLECTION') {
          res = await staffApi.collectSampleAndCOD(item.appointmentId, item.payload);
        } else if (item.type === 'LAB_DROPOFF') {
          res = await staffApi.bulkLaboratoryDropoff(item.payload.sampleIds);
        } else if (item.type === 'POST_VITALS') {
          res = await staffApi.recordAppointmentVitals(item.appointmentId, item.payload);
        }

        console.log(`[OfflineSync] Successfully synced queued item ${item.id} (${item.type})`);

        // Clear local draft if collection synced successfully
        if (item.appointmentId) {
          await collectionDraftService.clearDraft(item.appointmentId);
        }

        this.notifySubscribers({
          event: 'ITEM_SYNCED',
          item,
          remainingCount: remainingQueue.length,
        });
      } catch (err) {
        console.warn(`[OfflineSync] Failed to sync item ${item.id}:`, err.message);

        // Check if error is network/offline (keep in queue to retry)
        const isNetError =
          !err.response ||
          err.code === 'ECONNABORTED' ||
          err.message?.includes('Network Error') ||
          err.message?.includes('network');

        if (isNetError) {
          item.status = 'PENDING';
          remainingQueue.push(item);
          // If network failed mid-sync, stop loop to save battery
          console.log('[OfflineSync] Network dropped during queue processing. Halting batch.');
          break;
        } else {
          // If server returned 400 (e.g., sample already marked collected), don't loop forever
          if (err.response?.status === 400 || err.response?.status === 409) {
            console.log(`[OfflineSync] Server resolved or duplicate item. Removing from queue: ${item.id}`);
            if (item.appointmentId) {
              await collectionDraftService.clearDraft(item.appointmentId);
            }
          } else {
            item.status = 'FAILED';
            item.errorMessage = err.response?.data?.message || err.message;
            remainingQueue.push(item);
          }
        }
      }
    }

    this.queue = remainingQueue;
    await this.persistQueue();
    this.isSyncing = false;

    this.notifySubscribers({
      event: 'SYNC_FINISHED',
      pendingCount: this.getPendingCount(),
    });

    console.log(`[OfflineSync] Queue processing complete. Remaining items: ${this.queue.length}`);
  }

  /**
   * Helper: Check if device is connected to the internet
   */
  isOnline() {
    return this.isConnected && this.isInternetReachable;
  }

  /**
   * Helper: Get total pending items
   */
  getPendingCount() {
    return this.queue.filter((q) => q.status === 'PENDING' || q.status === 'SYNCING').length;
  }

  /**
   * Helper: Get all queue items
   */
  getQueue() {
    return [...this.queue];
  }

  /**
   * Manual trigger from UI button
   */
  async syncNow() {
    await this.init();
    return this.processQueue();
  }

  /**
   * Clear queue (for testing / reset)
   */
  async clearQueue() {
    this.queue = [];
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
    this.notifySubscribers({ event: 'QUEUE_CLEARED', pendingCount: 0 });
  }

  /**
   * UI Subscription listener
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    // Send immediate initial state
    callback({
      event: 'INIT',
      isConnected: this.isConnected,
      isOnline: this.isOnline(),
      pendingCount: this.getPendingCount(),
      isSyncing: this.isSyncing,
      queue: this.getQueue(),
    });

    return () => {
      this.subscribers.delete(callback);
    };
  }

  notifySubscribers(data) {
    for (const callback of this.subscribers) {
      try {
        callback({
          ...data,
          isConnected: this.isConnected,
          isOnline: this.isOnline(),
          pendingCount: this.getPendingCount(),
          isSyncing: this.isSyncing,
        });
      } catch (e) {
        console.warn('[OfflineSync] Subscriber callback error:', e.message);
      }
    }
  }

  destroy() {
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }
    this.subscribers.clear();
    this.initialized = false;
  }
}

export const offlineSyncQueueService = new OfflineSyncQueueService();
export default offlineSyncQueueService;
