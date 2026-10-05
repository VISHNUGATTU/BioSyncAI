import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

let isFirebaseInitialized = false;
let messagingService = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const rawVal = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    if (rawVal.startsWith('{') && rawVal.includes('-----BEGIN PRIVATE KEY-----')) {
      const serviceAccount = JSON.parse(rawVal);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      const app = getApps().length === 0
        ? initializeApp({ credential: cert(serviceAccount) })
        : getApps()[0];
      messagingService = getMessaging(app);
      isFirebaseInitialized = true;
      console.log('[FCM] Firebase Admin Initialized Successfully');
    } else {
      console.log('[FCM] Placeholder FIREBASE_SERVICE_ACCOUNT detected. Standard FCM disabled (Expo Push API active).');
    }
  } catch (err) {
    console.warn('[FCM] Service Account initialization warning (Expo Push API active):', err.message);
  }
} else {
  console.log('[FCM] FIREBASE_SERVICE_ACCOUNT not configured. Standard FCM disabled (Expo Push API active).');
}

/**
 * Universal Push Notification Dispatcher
 * Supports Expo Push Tokens (ExponentPushToken[...] / ExpoPushToken[...]) and Native FCM Tokens
 */
export const sendPushNotification = async (targetToken, title, body, data = {}) => {
  if (!targetToken) return null;

  // 1. Expo Push Notification Dispatch (Expo Go / Production Expo Apps)
  if (
    typeof targetToken === 'string' &&
    (targetToken.startsWith('ExponentPushToken[') || targetToken.startsWith('ExpoPushToken['))
  ) {
    try {
      const response = await axios.post(
        'https://exp.host/--/api/v2/push/send',
        {
          to: targetToken,
          sound: 'default',
          title,
          body,
          data,
          priority: 'high',
          channelId: 'biosync-critical',
          badge: 1,
        },
        {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        }
      );
      console.log(`[ExpoPush] Push notification delivered to ${targetToken.substring(0, 24)}...: "${title}"`);
      return response.data;
    } catch (err) {
      console.warn('[ExpoPush] Push delivery warning:', err?.response?.data || err.message);
      return null;
    }
  }

  // 2. Native FCM Dispatch via Firebase Admin (Standalone Builds)
  if (!isFirebaseInitialized || !messagingService) {
    return null;
  }

  // FCM v1 requires all custom data payload values to be strings
  const stringifiedData = Object.entries(data).reduce((acc, [key, val]) => {
    acc[key] = typeof val === 'string' ? val : JSON.stringify(val);
    return acc;
  }, {});

  try {
    const payload = {
      notification: { title, body },
      data: stringifiedData,
      token: targetToken,
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'biosync-critical' },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const fcmRes = await messagingService.send(payload);
    console.log(`[FCM] Native push delivered to ${targetToken.substring(0, 16)}...: "${title}"`);
    return fcmRes;
  } catch (error) {
    console.warn('[FCM] Dispatch warning:', error.message);
    return null;
  }
};

export default { isInitialized: () => isFirebaseInitialized };