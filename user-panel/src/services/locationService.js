import * as Location from 'expo-location';

export const locationService = {
  /**
   * Request foreground location permission
   */
  requestPermissions: async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      console.warn('[LocationService] Permission request failed:', e.message);
      return false;
    }
  },

  /**
   * Get device's current GPS location with high accuracy
   */
  getCurrentCoordinates: async () => {
    try {
      const hasPermission = await locationService.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied. Please allow location access in settings.');
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
    } catch (e) {
      console.warn('[LocationService] GPS fetch failed:', e.message);
      // Fallback: Last known position
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown?.coords) {
          return {
            lat: lastKnown.coords.latitude,
            lng: lastKnown.coords.longitude,
            accuracy: lastKnown.coords.accuracy,
          };
        }
      } catch (_) {}
      throw e;
    }
  },

  /**
   * Reverse geocode coordinates to street, area, city, pincode
   */
  reverseGeocode: async (lat, lng) => {
    try {
      if (!lat || !lng) return null;

      const results = await Location.reverseGeocodeAsync({
        latitude: Number(lat),
        longitude: Number(lng),
      });

      if (results && results.length > 0) {
        const r = results[0];
        const streetNumber = r.streetNumber || '';
        const streetName = r.street || r.name || '';
        const subregion = r.subregion || r.district || '';
        const city = r.city || subregion || 'Hyderabad';
        const state = r.region || 'Telangana';
        const pincode = r.postalCode || '500081';

        const streetCombined = [streetNumber, streetName, subregion]
          .filter(Boolean)
          .join(', ');

        return {
          street: streetCombined || streetName || 'Selected Location',
          landmark: r.name && r.name !== streetName ? r.name : '',
          city,
          state,
          pincode,
          country: r.country || 'India',
          formattedAddress: [streetCombined, city, state, pincode].filter(Boolean).join(', '),
        };
      }
      return null;
    } catch (e) {
      console.warn('[LocationService] Reverse geocode failed:', e.message);
      return null;
    }
  },
};

export default locationService;
