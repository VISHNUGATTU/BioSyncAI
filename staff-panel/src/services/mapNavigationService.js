import { Linking, Platform, Alert } from 'react-native';

export const mapNavigationService = {
  /**
   * Deep-link to native turn-by-turn navigation:
   * - iOS: Apple Maps native scheme (`maps:0,0?q=...`) with web fallback
   * - Android: Google Navigation intent (`google.navigation:q=...`), geo URI (`geo:...`), with web fallback
   * - Web / Fallback: Google Maps directions URL
   *
   * @param {string|object} address - Formatted address string or address object
   * @param {object} coordinates - { lat, lng } or { latitude, longitude }
   * @param {string} label - Optional place pin label
   */
  openNavigation: async (address, coordinates, label = 'Patient Location') => {
    const lat = coordinates?.lat || coordinates?.latitude;
    const lng = coordinates?.lng || coordinates?.longitude;

    const addressText = typeof address === 'string'
      ? address
      : [
          address?.houseNumber,
          address?.street,
          address?.landmark,
          address?.city,
          address?.state,
          address?.pincode || address?.postalCode,
        ].filter(Boolean).join(', ');

    const destinationQuery = encodeURIComponent(addressText || label || 'Patient Location');

    // 1. iOS: Apple Maps deep link
    if (Platform.OS === 'ios') {
      let appleUrl;
      if (lat != null && lng != null) {
        appleUrl = `maps:0,0?q=${destinationQuery}&ll=${lat},${lng}`;
      } else {
        appleUrl = `maps:0,0?q=${destinationQuery}`;
      }

      try {
        const canOpen = await Linking.canOpenURL(appleUrl);
        if (canOpen) {
          return await Linking.openURL(appleUrl);
        }
      } catch (e) {
        // Fall through to web
      }

      const fallbackUrl = lat != null && lng != null
        ? `https://maps.apple.com/?daddr=${lat},${lng}&q=${destinationQuery}`
        : `https://maps.apple.com/?daddr=${destinationQuery}`;
      return Linking.openURL(fallbackUrl).catch(() => {
        Alert.alert('Navigation Error', 'Could not open Apple Maps.');
      });
    }

    // 2. Android: Google Maps Turn-by-Turn Navigation deep link
    if (lat != null && lng != null) {
      const googleNavUrl = `google.navigation:q=${lat},${lng}&mode=d`;
      const geoUrl = `geo:${lat},${lng}?q=${lat},${lng}(${destinationQuery})`;
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      try {
        const canNav = await Linking.canOpenURL(googleNavUrl);
        if (canNav) {
          return await Linking.openURL(googleNavUrl);
        }
      } catch (e) {
        // Fall through
      }

      try {
        const canGeo = await Linking.canOpenURL(geoUrl);
        if (canGeo) {
          return await Linking.openURL(geoUrl);
        }
      } catch (e) {
        // Fall through
      }

      return Linking.openURL(webUrl).catch(() => {
        Alert.alert('Navigation Error', 'Could not open Google Maps.');
      });
    }

    // 3. Fallback when coordinates are missing (Address text search)
    const webSearchUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}`;
    return Linking.openURL(webSearchUrl).catch(() => {
      Alert.alert('Navigation Error', 'Could not open navigation application.');
    });
  },
};

export default mapNavigationService;
