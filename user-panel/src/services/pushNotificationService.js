import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import api from '../api/axios';

const PUSH_TOKEN_STORAGE_KEY = 'biosync_registered_push_token';

// In Expo SDK 53+, remote push notifications were removed from Expo Go on Android.
// To prevent fatal startup crashes in Expo Go, we guard the notifications module.
const isExpoGoOnAndroid =
  Platform.OS === 'android' &&
  (Constants?.executionEnvironment === ExecutionEnvironment.StoreClient ||
   Constants?.appOwnership === 'expo');

let Notifications = null;
if (!isExpoGoOnAndroid) {
  try {
    Notifications = require('expo-notifications');
    if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    }
  } catch (err) {
    console.warn('[PushService] expo-notifications initialization note:', err?.message || err);
  }
}

/**
 * Configure Android notification channels for critical healthcare alerts
 */
export const setupNotificationChannels = async () => {
  if (isExpoGoOnAndroid || !Notifications?.setNotificationChannelAsync) return;

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('biosync-critical', {
        name: 'Critical Diagnostic Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#06b6d4',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
      });

      await Notifications.setNotificationChannelAsync('biosync-updates', {
        name: 'Appointment & Sample Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 150, 150, 150],
        sound: 'default',
      });
    } catch (err) {
      console.warn('[PushService] Channel setup warning:', err.message);
    }
  }
};

/**
 * Register device for Expo Push Notifications and sync token with BioSync backend
 */
export const registerForPushNotifications = async () => {
  if (isExpoGoOnAndroid || !Notifications?.getExpoPushTokenAsync) {
    console.log('[PushService] Remote push notifications disabled in Expo Go Android (SDK 53+). Standalone & dev builds support FCM.');
    return null;
  }

  try {
    await setupNotificationChannels();

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[PushService] Notification permission not granted by user.');
      return null;
    }

    // Retrieve Expo Push Token
    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
    } catch (tokenErr) {
      // Fallback for local development/unconfigured project IDs
      console.warn('[PushService] Standard Expo token retrieval note:', tokenErr.message);
      try {
        tokenData = await Notifications.getExpoPushTokenAsync();
      } catch (fallbackErr) {
        console.warn('[PushService] Could not retrieve Expo push token:', fallbackErr.message);
        return null;
      }
    }

    const token = tokenData?.data;
    if (!token) return null;

    console.log('[PushService] Hardware Push Token registered:', token.substring(0, 30) + '...');

    // Sync token with BioSync user backend if changed
    const lastSavedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (lastSavedToken !== token) {
      try {
        await api.put('/user/push-token', { pushToken: token, fcmToken: token });
        await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
        console.log('[PushService] Push token successfully synchronized with server.');
      } catch (syncErr) {
        console.warn('[PushService] Backend push token sync warning:', syncErr.message);
      }
    }

    return token;
  } catch (error) {
    console.warn('[PushService] Push registration warning:', error.message);
    return null;
  }
};

/**
 * Attach notification response and received listeners
 */
export const attachNotificationListeners = (navigationRef) => {
  if (isExpoGoOnAndroid || !Notifications?.addNotificationReceivedListener) {
    return () => {};
  }

  // Listener for incoming notification while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[PushService] Foreground notification received:', notification.request.content.title);
  });

  // Listener for user tapping background notification banner
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data || {};
    console.log('[PushService] Notification tapped by user:', data);

    if (navigationRef?.current) {
      if (data.screen === 'AppointmentsList' || data.appointmentId) {
        navigationRef.current.navigate('AppointmentsList', {
          highlightId: data.appointmentId,
        });
      } else if (data.screen === 'HealthTimeline') {
        navigationRef.current.navigate('HealthTimeline');
      } else if (data.action === 'RECALIBRATE_BASELINE' || data.screen === 'BookAppointment') {
        navigationRef.current.navigate('BookAppointment', {
          packageId: data.packageId,
          isRecalibration: true,
        });
      }
    }
  });

  return () => {
    if (foregroundSubscription?.remove) foregroundSubscription.remove();
    if (responseSubscription?.remove) responseSubscription.remove();
  };
};

export default {
  setupNotificationChannels,
  registerForPushNotifications,
  attachNotificationListeners,
};
