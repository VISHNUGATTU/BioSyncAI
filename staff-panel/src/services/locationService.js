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

      // 1. Verify / Request Foreground Location Permission
      const permissionRes = await Location.getForegroundPermissionsAsync();
      let status = permissionRes.status;
      if (status !== 'granted') {
        const reqRes = await Location.requestForegroundPermissionsAsync();
        status = reqRes.status;
      }

      if (status !== 'granted') {
        console.log('[Location] Permission not granted by user.');
        return {
          success: false,
          message: 'Location permission was denied. Cannot broadcast GPS coordinates.',
        };
      }

      // 2. Check if Location Services (GPS) are enabled on the phone
      let isServicesEnabled = await Location.hasServicesEnabledAsync();
      if (!isServicesEnabled) {
        console.log('[Location] GPS services disabled on device. Prompting user to enable...');
        try {
          // On Android, prompt the user to enable high-accuracy GPS
          await Location.enableNetworkProviderAsync();
          // Poll for up to 4 seconds to wait for user to toggle the system prompt
          for (let i = 0; i < 8; i++) {
            await new Promise((r) => setTimeout(r, 500));
            isServicesEnabled = await Location.hasServicesEnabledAsync();
            if (isServicesEnabled) {
              console.log('[Location] Location services successfully turned on by user.');
              break;
            }
          }
        } catch (provErr) {
          console.log('[Location] Location provider enable skipped or dismissed:', provErr.message);
        }
      }

      // 3. Immediately fetch last known position first (fast, never blocks)
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown?.coords) {
          const { latitude, longitude, heading } = lastKnown.coords;
          await staffApi.updateLiveLocation(latitude, longitude, heading || 0);
          lastSentTimestamp = Date.now();
          console.log('[Location] Broadcasted last known coordinates:', latitude, longitude);
        }
      } catch (lastErr) {
        console.log('[Location] Last known position not ready:', lastErr.message);
      }

      // 4. Try current position if services are confirmed active
      if (isServicesEnabled) {
        try {
          const initialLoc = await Promise.race([
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Location acquisition timed out')), 6000)
            ),
          ]);
          if (initialLoc?.coords) {
            const { latitude, longitude, heading } = initialLoc.coords;
            await staffApi.updateLiveLocation(latitude, longitude, heading || 0);
            lastSentTimestamp = Date.now();
            console.log('[Location] Initial live coordinate fix established:', latitude, longitude);
          }
        } catch (initErr) {
          // Gracefully continue; watcher will broadcast as soon as satellite lock is established
          console.log('[Location] Initial fix pending satellite acquisition:', initErr.message);
        }
      }

      // 5. Start continuous watcher (fires automatically when location updates)
      if (!locationSubscription) {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 15000, // every 15 seconds
            distanceInterval: 15, // or every 15 meters
          },
          async (location) => {
            if (!location?.coords) return;
            const { latitude, longitude, heading } = location.coords;

            const now = Date.now();
            if (now - lastSentTimestamp < MIN_SEND_INTERVAL_MS) {
              return;
            }
            lastSentTimestamp = now;

            try {
              await staffApi.updateLiveLocation(latitude, longitude, heading || 0);
              useAuthStore.getState().setLocationTracking(true);
            } catch (err) {
              console.log('[Location] Background broadcast note:', err.message);
            }
          }
        );
      }

      useAuthStore.getState().setLocationTracking(true);
      return { success: true, message: 'GPS Broadcaster connected.' };
    } catch (err) {
      console.log('[Location] Tracking initiation caught:', err.message || err);
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
      console.log('[Location] Stop tracking caught:', err.message || err);
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
