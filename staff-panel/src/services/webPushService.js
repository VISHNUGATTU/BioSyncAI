/**
 * BioSync AI Staff Panel - Desktop Browser Web Push & Medical Audio Alert Service
 * 
 * Provides:
 * 1. Web Service Worker registration (/sw.js) for desktop browsers.
 * 2. Web Audio API synthesized acoustic alert chimes (zero external audio file dependencies).
 * 3. Desktop native push notification popups for urgent phlebotomy dispatch arrivals.
 */

import { Platform } from 'react-native';

class WebPushService {
  constructor() {
    this.isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
    this.audioCtx = null;
    this.swRegistration = null;
    this.hasUserInteracted = false;
    this.listeners = new Set();

    if (this.isWeb) {
      this.initUserInteractionListener();
    }
  }

  /**
   * Tracks user interaction to unlock Web Audio API AudioContext playback restrictions.
   */
  initUserInteractionListener() {
    const unlock = () => {
      this.hasUserInteracted = true;
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }

  /**
   * Initializes Service Worker on Desktop Web browsers.
   */
  async registerServiceWorker() {
    if (!this.isWeb || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.swRegistration = reg;
      console.log('[WebPushService] Service worker registered successfully:', reg.scope);

      // Listen for background service worker broadcasts
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'BIOSYNC_URGENT_DISPATCH_ALERT') {
          this.playMedicalAlertChime('urgent');
          this.notifyListeners(event.data.payload);
        }
      });

      return reg;
    } catch (err) {
      console.warn('[WebPushService] Service Worker registration note:', err?.message || err);
      return null;
    }
  }

  /**
   * Requests desktop notification permission from user.
   */
  async requestPermission() {
    if (!this.isWeb || !('Notification' in window)) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission; // 'granted' | 'denied' | 'default'
    } catch (err) {
      console.warn('[WebPushService] Permission request warning:', err);
      return 'default';
    }
  }

  getPermissionStatus() {
    if (!this.isWeb || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Synthesizes a clinical hospital-grade dual-frequency acoustic chime.
   * Tone 1: 880.00 Hz (A5), Tone 2: 1174.66 Hz (D6) with exponential decay.
   */
  playMedicalAlertChime(urgency = 'urgent') {
    if (!this.isWeb) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Primary carrier tone (Sine wave)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();

      // Secondary harmonic tone
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();

      const baseFreq = urgency === 'urgent' ? 880.0 : 659.25; // A5 or E5
      const highFreq = urgency === 'urgent' ? 1174.66 : 880.0; // D6 or A5

      // Note 1: Immediate attack
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.35, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      // Note 2: Harmonic response at 120ms
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(highFreq, now + 0.12);
      gain2.gain.setValueAtTime(0.001, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.45, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);

      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);

      osc1.start(now);
      osc1.stop(now + 0.4);

      osc2.start(now + 0.12);
      osc2.stop(now + 0.7);

      // If urgent, schedule a double beep after 300ms
      if (urgency === 'urgent') {
        const osc3 = this.audioCtx.createOscillator();
        const gain3 = this.audioCtx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(1318.51, now + 0.35); // E6 high chime
        gain3.gain.setValueAtTime(0.001, now + 0.35);
        gain3.gain.exponentialRampToValueAtTime(0.4, now + 0.39);
        gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

        osc3.connect(gain3);
        gain3.connect(this.audioCtx.destination);
        osc3.start(now + 0.35);
        osc3.stop(now + 0.9);
      }
    } catch (err) {
      console.warn('[WebPushService] Web Audio synthesis note:', err);
    }
  }

  /**
   * Triggers both a native desktop notification and a clinical audio chime.
   */
  async triggerUrgentDispatchAlert({
    title = '🚨 Urgent Phlebotomy Dispatch Assigned',
    body = 'A new high-priority home blood draw appointment has been assigned.',
    appointmentId = null,
    patientName = null,
  } = {}) {
    // 1. Play audio chime immediately
    this.playMedicalAlertChime('urgent');

    if (!this.isWeb) return;

    // 2. Display desktop notification if permitted
    const fullBody = patientName ? `Patient: ${patientName} • ${body}` : body;

    if (Notification.permission === 'granted') {
      try {
        if (this.swRegistration && this.swRegistration.showNotification) {
          await this.swRegistration.showNotification(title, {
            body: fullBody,
            icon: '/assets/icon.png',
            tag: 'urgent-dispatch-' + (appointmentId || Date.now()),
            renotify: true,
            requireInteraction: true,
            data: { appointmentId, url: '/' },
          });
        } else {
          new Notification(title, {
            body: fullBody,
            icon: '/assets/icon.png',
          });
        }
      } catch (e) {
        console.warn('[WebPushService] Notification display note:', e);
      }
    }
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(data) {
    this.listeners.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {}
    });
  }
}

export const webPushService = new WebPushService();
export default webPushService;
