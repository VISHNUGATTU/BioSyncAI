import * as Location from 'expo-location';
import { Alert } from 'react-native';
import staffApi from '../api/staffApi';
import { useAuthStore } from '../store/authStore';

// ============================================================
// CONFIGURATION
// ============================================================

const LOCATION_UPDATE_INTERVAL = 15000;
const LOCATION_DISTANCE_INTERVAL = 15;

let locationWatcher = null;
let isStarting = false;
let lastSentTimestamp = 0;

// ============================================================
// REQUEST LOCATION PERMISSIONS
// ============================================================

const requestLocationPermissions = async () => {
  try {
    const {
      status: foregroundStatus,
    } = await Location.requestForegroundPermissionsAsync();

    if (foregroundStatus !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'BioSyncAI needs your location to update your live field location and appointment status.'
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      '[LocationService] Permission request failed:',
      error?.message || error
    );

    return false;
  }
};

// ============================================================
// SEND LOCATION TO SERVER
// ============================================================

const sendLocationToServer = async (
  location
) => {
  try {
    if (!location?.coords) {
      return {
        success: false,
        message: 'Invalid location data',
      };
    }

    const {
      latitude,
      longitude,
      accuracy,
      heading,
    } = location.coords;

    if (
      latitude === undefined ||
      longitude === undefined ||
      latitude === null ||
      longitude === null
    ) {
      return {
        success: false,
        message: 'Invalid location coordinates',
      };
    }

    const now = Date.now();

    // Prevent duplicate requests from being sent too quickly.
    if (
      lastSentTimestamp > 0 &&
      now - lastSentTimestamp <
        LOCATION_UPDATE_INTERVAL - 1000
    ) {
      return {
        success: true,
        skipped: true,
      };
    }

    const response =
      await staffApi.updateLiveLocation(
        latitude,
        longitude,
        heading || 0
      );

    if (response?.success === false) {
      return {
        success: false,
        message:
          response?.message ||
          'Server rejected location update',
      };
    }

    lastSentTimestamp = now;

    useAuthStore
      .getState()
      .setLocationTracking(true);

    return {
      success: true,
      data: response?.data,
      accuracy,
    };
  } catch (error) {
    const status =
      error?.response?.status;

    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to update location';

    console.warn(
      '[LocationService] Location update failed:',
      status || '',
      message
    );

    // A 401 means the authentication token was
    // rejected by the backend.
    if (status === 401) {
      console.warn(
        '[LocationService] Location request returned 401. Check the stored staff token and JWT middleware.'
      );
    }

    return {
      success: false,
      message,
      status,
    };
  }
};

// ============================================================
// START LOCATION TRACKING
// ============================================================

const startTracking = async () => {
  // Prevent two watchers from being created.
  if (locationWatcher || isStarting) {
    return true;
  }

  try {
    isStarting = true;

    const hasPermission =
      await requestLocationPermissions();

    if (!hasPermission) {
      isStarting = false;

      useAuthStore
        .getState()
        .setLocationTracking(false);

      return false;
    }

    const currentLocation =
      await Location.getCurrentPositionAsync({
        accuracy:
          Location.Accuracy.High,
      });

    await sendLocationToServer(
      currentLocation
    );

    locationWatcher =
      await Location.watchPositionAsync(
        {
          accuracy:
            Location.Accuracy.High,

          timeInterval:
            LOCATION_UPDATE_INTERVAL,

          distanceInterval:
            LOCATION_DISTANCE_INTERVAL,

          mayShowUserSettingsDialog: true,
        },

        async (location) => {
          await sendLocationToServer(
            location
          );
        }
      );

    useAuthStore
      .getState()
      .setLocationTracking(true);

    console.log(
      '[LocationService] Location tracking started'
    );

    return true;
  } catch (error) {
    console.error(
      '[LocationService] Failed to start tracking:',
      error?.message || error
    );

    locationWatcher = null;

    useAuthStore
      .getState()
      .setLocationTracking(false);

    return false;
  } finally {
    isStarting = false;
  }
};

// ============================================================
// STOP LOCATION TRACKING
// ============================================================

const stopTracking = () => {
  try {
    if (locationWatcher) {
      locationWatcher.remove();
      locationWatcher = null;
    }

    lastSentTimestamp = 0;

    useAuthStore
      .getState()
      .setLocationTracking(false);

    console.log(
      '[LocationService] Location tracking stopped'
    );
  } catch (error) {
    console.warn(
      '[LocationService] Failed to stop tracking:',
      error?.message || error
    );

    locationWatcher = null;

    useAuthStore
      .getState()
      .setLocationTracking(false);
  }
};

// ============================================================
// GET CURRENT LOCATION
// ============================================================

const getCurrentLocation = async () => {
  try {
    const hasPermission =
      await requestLocationPermissions();

    if (!hasPermission) {
      return null;
    }

    const location =
      await Location.getCurrentPositionAsync({
        accuracy:
          Location.Accuracy.High,
      });

    return location;
  } catch (error) {
    console.error(
      '[LocationService] Failed to get current location:',
      error?.message || error
    );

    return null;
  }
};

// ============================================================
// SEND CURRENT LOCATION ONCE
// ============================================================

const updateCurrentLocation = async () => {
  try {
    const location =
      await getCurrentLocation();

    if (!location) {
      return {
        success: false,
        message:
          'Unable to obtain current location',
      };
    }

    return await sendLocationToServer(
      location
    );
  } catch (error) {
    return {
      success: false,
      message:
        error?.message ||
        'Location update failed',
    };
  }
};

// ============================================================
// TRACKING STATUS
// ============================================================

const isTracking = () => {
  return locationWatcher !== null;
};

// ============================================================
// CLEANUP
// ============================================================

const cleanup = () => {
  stopTracking();
};

// ============================================================
// EXPORT
// ============================================================

export const locationService = {
  startTracking,
  stopTracking,
  getCurrentLocation,
  updateCurrentLocation,
  isTracking,
  cleanup,
};

export default locationService;