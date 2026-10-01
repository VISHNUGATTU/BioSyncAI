import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import staffApi from '../api/staffApi';

const STAFF_PUSH_TOKEN_STORAGE_KEY = 'biosync_staff_push_token';

// Configure foreground notification presentation handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Configure Android notification channels for phlebotomist dispatch and critical alerts
 */
export const setupStaffNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('biosync-staff-dispatch', {
        name: 'Urgent Patient Dispatch',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 300, 200, 300],
        lightColor: '#10b981',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
      });

      await Notifications.setNotificationChannelAsync('biosync-critical', {
        name: 'Critical Ops Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#06b6d4',
        sound: 'default',
      });
    } catch (err) {
      console.warn('[StaffPushService] Channel setup warning:', err.message);
    }
  }
};

/**
 * Register staff device for Expo Push Notifications and sync token with BioSync backend
 */
export const registerStaffPushNotifications = async () => {
  try {
    await setupStaffNotificationChannels();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[StaffPushService] Staff push notification permission not granted.');
      return null;
    }

    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
    } catch (tokenErr) {
      console.warn('[StaffPushService] Standard Expo token note:', tokenErr.message);
      try {
        tokenData = await Notifications.getExpoPushTokenAsync();
      } catch (fallbackErr) {
        console.warn('[StaffPushService] Could not retrieve Expo push token:', fallbackErr.message);
        return null;
      }
    }

    const token = tokenData?.data;
    if (!token) return null;

    console.log('[StaffPushService] Staff Push Token registered:', token.substring(0, 30) + '...');

    const lastSavedToken = await AsyncStorage.getItem(STAFF_PUSH_TOKEN_STORAGE_KEY);
    if (lastSavedToken !== token) {
      try {
        await staffApi.updatePushToken(token);
        await AsyncStorage.setItem(STAFF_PUSH_TOKEN_STORAGE_KEY, token);
        console.log('[StaffPushService] Staff push token synchronized with server.');
      } catch (syncErr) {
        console.warn('[StaffPushService] Backend push token sync warning:', syncErr.message);
      }
    }

    return token;
  } catch (error) {
    console.warn('[StaffPushService] Push registration warning:', error.message);
    return null;
  }
};

/**
 * Attach notification response and received listeners
 */
export const attachStaffNotificationListeners = (navigationRef) => {
  const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[StaffPushService] Foreground staff notification:', notification.request.content.title);
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data || {};
    console.log('[StaffPushService] Staff notification tapped:', data);

    if (navigationRef?.current) {
      if (data.appointmentId || data.screen === 'AppointmentDetail') {
        navigationRef.current.navigate('AppointmentDetail', {
          appointmentId: data.appointmentId,
        });
      } else if (data.screen === 'ActiveCollection') {
        navigationRef.current.navigate('ActiveCollection', {
          appointment: { _id: data.appointmentId },
        });
      }
    }
  });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
};

export default {
  setupStaffNotificationChannels,
  registerStaffPushNotifications,
  attachStaffNotificationListeners,
};
