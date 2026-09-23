import admin from 'firebase-admin';
import dotenv from 'dotenv';

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
  console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT is missing. Push notifications disabled.');
}

export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!isFirebaseInitialized || !fcmToken) return null;

  // FCM v1 requires all custom data payload values to be strings
  const stringifiedData = Object.entries(data).reduce((acc, [key, val]) => {
    acc[key] = typeof val === 'string' ? val : JSON.stringify(val);
    return acc;
  }, {});

  try {
    const payload = {
      notification: { title, body },
      data: stringifiedData,
      token: fcmToken,
      android: {
        priority: 'high',
        notification: { sound: 'default' }
      }
    };

    return await admin.messaging().send(payload);
  } catch (error) {
    console.error('[FCM] Dispatch Error:', error.message);
    // Do not crash client calls for background notification errors
    return null;
  }
};

export default admin;