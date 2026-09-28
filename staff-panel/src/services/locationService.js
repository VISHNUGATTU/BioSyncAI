import * as Location from 'expo-location';
import { staffApi } from '../api/staffApi';
import { useAuthStore } from '../store/authStore';

let locationSubscription = null;
let lastSentTimestamp = 0;
const MIN_SEND_INTERVAL_MS = 10000; // Throttle API calls to at most once per 10s

export const locationService = {
  /**
   * Start live GPS telemetry broadcasting.
   */
  startTracking: async () => {
    try {
      if (locationSubscription) {
        return { success: true, message: 'Tracking already active' };
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return {
          success: false,
          message: 'Location permission was denied. Cannot broadcast GPS coordinates.',
        };
      }

      // Immediately fetch current position for instantaneous coordinate refresh
      try {
        const initialLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (initialLoc?.coords) {
          const { latitude, longitude, heading } = initialLoc.coords;
          await staffApi.updateLiveLocation(latitude, longitude, heading || 0);
          lastSentTimestamp = Date.now();
        }
      } catch (initErr) {
        console.warn('Initial location ping error:', initErr.message);
      }

      // Start continuous watcher
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 15000, // every 15 seconds
          distanceInterval: 15, // or every 15 meters
        },
        async (location) => {
          if (!location?.coords) return;
          const { latitude, longitude, heading, accuracy } = location.coords;
          
          const now = Date.now();
          if (now - lastSentTimestamp < MIN_SEND_INTERVAL_MS) {
            return;
          }
          lastSentTimestamp = now;

          try {
            await staffApi.updateLiveLocation(latitude, longitude, heading || 0);
            useAuthStore.getState().setLocationTracking(true);
          } catch (err) {
            console.warn('Live location broadcast error:', err.message);
          }
        }
      );

      useAuthStore.getState().setLocationTracking(true);
      return { success: true, message: 'GPS Broadcaster connected.' };
    } catch (err) {
      console.warn('Failed to start location tracking:', err);
      useAuthStore.getState().setLocationTracking(false);
      return { success: false, message: err.message };
    }
  },

  /**
   * Stop live GPS telemetry broadcasting.
   */
  stopTracking: () => {
    try {
      if (locationSubscription) {
        locationSubscription.remove();
        locationSubscription = null;
      }
      useAuthStore.getState().setLocationTracking(false);
      return { success: true, message: 'GPS Broadcaster paused.' };
    } catch (err) {
      console.warn('Failed to stop location tracking:', err);
      return { success: false, message: err.message };
    }
  },

  /**
   * Check if tracking is currently active.
   */
  isTracking: () => {
    return locationSubscription !== null;
  },
};

export default locationService;
