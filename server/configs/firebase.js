import admin from 'firebase-admin';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

let isFirebaseInitialized = false;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    isFirebaseInitialized = true;
    console.log('[FCM] Firebase Admin Initialized Successfully');
  } catch (err) {
    console.error('[FCM] Service Account parsing failed. Push notifications disabled:', err.message);
  }
} else {
  console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT is missing. Standard FCM disabled (Expo Push API remains active).');
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
  if (!isFirebaseInitialized) {
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

    const fcmRes = await admin.messaging().send(payload);
    console.log(`[FCM] Native push delivered to ${targetToken.substring(0, 16)}...: "${title}"`);
    return fcmRes;
  } catch (error) {
    console.warn('[FCM] Dispatch warning:', error.message);
    return null;
  }
};

export default admin;