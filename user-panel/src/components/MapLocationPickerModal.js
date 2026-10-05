import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  MapPin,
  Crosshair,
  Check,
  X,
  Navigation,
  Compass,
  Building,
  Home,
  AlertCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import locationService from '../services/locationService';

export const MapLocationPickerModal = ({
  visible,
  onClose,
  initialCoordinates = null,
  initialAddress = null,
  onLocationSelected,
  colors = {
    bgDark: '#030712',
    bgCard: '#111827',
    bgCardElevated: '#1f2937',
    textPrimary: '#f9fafb',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',
    cyan: '#06b6d4',
    cyanLight: '#22d3ee',
    emerald: '#10b981',
    emeraldLight: '#34d399',
    borderSubtle: '#374151',
  },
}) => {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef(null);

  // Default coordinate fallback: Hyderabad tech corridor / central hub
  const defaultLat = initialCoordinates?.lat || initialCoordinates?.latitude || 17.4486;
  const defaultLng = initialCoordinates?.lng || initialCoordinates?.longitude || 78.3742;

  const [currentCoords, setCurrentCoords] = useState({ lat: defaultLat, lng: defaultLng });
  const [houseNumber, setHouseNumber] = useState(initialAddress?.houseNumber || '');
  const [landmark, setLandmark] = useState(initialAddress?.landmark || '');
  const [resolvedAddress, setResolvedAddress] = useState({
    street: initialAddress?.street || 'Cyber Towers Area',
    city: initialAddress?.city || 'Hyderabad',
    state: initialAddress?.state || 'Telangana',
    pincode: initialAddress?.pincode || '500081',
  });

  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Sync initial coordinates when modal becomes visible
  useEffect(() => {
    if (visible) {
      const lat = initialCoordinates?.lat || initialCoordinates?.latitude;
      const lng = initialCoordinates?.lng || initialCoordinates?.longitude;
      if (lat && lng) {
        const nextCoords = { lat: Number(lat), lng: Number(lng) };
        setCurrentCoords(nextCoords);
        handleReverseGeocode(nextCoords.lat, nextCoords.lng);
      } else {
        // Attempt fast auto-locate on initial open
        handleLocateCurrentPosition(false);
      }
    }
  }, [visible]);

  const handleReverseGeocode = async (lat, lng) => {
    setIsReverseGeocoding(true);
    try {
      const geo = await locationService.reverseGeocode(lat, lng);
      if (geo) {
        setResolvedAddress({
          street: geo.street || resolvedAddress.street,
          landmark: geo.landmark || landmark,
          city: geo.city || resolvedAddress.city,
          state: geo.state || resolvedAddress.state,
          pincode: geo.pincode || resolvedAddress.pincode,
        });
        if (geo.landmark && !landmark) {
          setLandmark(geo.landmark);
        }
      }
    } catch (_) {
      // Keep existing address values
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handleLocateCurrentPosition = async (showErrorAlert = true) => {
    setIsLocating(true);
    try {
      const gps = await locationService.getCurrentCoordinates();
      if (gps?.lat && gps?.lng) {
        const nextCoords = { lat: Number(gps.lat.toFixed(6)), lng: Number(gps.lng.toFixed(6)) };
        setCurrentCoords(nextCoords);

        // Pan leaflet map to new coordinates
        if (webViewRef.current) {
          const js = `if (window.updatePin) { window.updatePin(${nextCoords.lat}, ${nextCoords.lng}, true); }`;
          webViewRef.current.injectJavaScript(js);
        }

        handleReverseGeocode(nextCoords.lat, nextCoords.lng);
      }
    } catch (err) {
      if (showErrorAlert) {
        Alert.alert(
          'GPS Location Unavailable',
          err.message || 'Unable to retrieve precise GPS coordinates. Please tap on the map to pin your location manually.'
        );
      }
    } finally {
      setIsLocating(false);
    }
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'PIN_MOVED') {
        const nextCoords = {
          lat: Number(Number(data.lat).toFixed(6)),
          lng: Number(Number(data.lng).toFixed(6)),
        };
        setCurrentCoords(nextCoords);
        handleReverseGeocode(nextCoords.lat, nextCoords.lng);
      } else if (data.type === 'MAP_READY') {
        setIsMapReady(true);
      }
    } catch (e) {
      console.warn('[MapModal] Message parse error:', e.message);
    }
  };

  const handleConfirm = () => {
    if (!currentCoords.lat || !currentCoords.lng) {
      Alert.alert('Location Required', 'Please tap on the map to place your collection pin.');
      return;
    }

    const payload = {
      coordinates: {
        lat: currentCoords.lat,
        lng: currentCoords.lng,
      },
      houseNumber: houseNumber.trim(),
      landmark: landmark.trim(),
      street: resolvedAddress.street,
      city: resolvedAddress.city,
      state: resolvedAddress.state,
      pincode: resolvedAddress.pincode,
      formattedAddress: [
        houseNumber.trim(),
        resolvedAddress.street,
        landmark.trim(),
        resolvedAddress.city,
        resolvedAddress.pincode,
      ]
        .filter(Boolean)
        .join(', '),
    };

    if (onLocationSelected) {
      onLocationSelected(payload);
    }
    onClose();
  };

  // HTML + Leaflet bundle loaded inside WebView
  const leafletHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background-color: #030712;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .custom-pin {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .pin-badge {
      background: #06b6d4;
      color: #030712;
      font-size: 10px;
      font-weight: 800;
      padding: 3px 7px;
      border-radius: 999px;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(6, 182, 212, 0.6);
      border: 1.5px solid #ffffff;
      margin-bottom: 2px;
      letter-spacing: 0.5px;
    }
    .pin-icon {
      width: 32px;
      height: 32px;
      background: radial-gradient(circle, #22d3ee 30%, #0891b2 100%);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #ffffff;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pin-icon::after {
      content: '';
      width: 10px;
      height: 10px;
      background: #ffffff;
      border-radius: 50%;
    }
    .pulse-ring {
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 10px;
      background: rgba(6, 182, 212, 0.4);
      border-radius: 50%;
      animation: pulse 1.8s infinite ease-out;
    }
    @keyframes pulse {
      0% { transform: translateX(-50%) scale(0.6); opacity: 1; }
      100% { transform: translateX(-50%) scale(2.4); opacity: 0; }
    }
    .leaflet-control-attribution {
      display: none !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var initialLat = ${currentCoords.lat};
    var initialLng = ${currentCoords.lng};

    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([initialLat, initialLng], 16);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var pinHtml = '<div class="custom-pin">' +
      '<div class="pin-badge">DOORSTEP</div>' +
      '<div class="pin-icon"></div>' +
      '<div class="pulse-ring"></div>' +
      '</div>';

    var customIcon = L.divIcon({
      html: pinHtml,
      className: '',
      iconSize: [40, 52],
      iconAnchor: [20, 48]
    });

    var marker = L.marker([initialLat, initialLng], {
      icon: customIcon,
      draggable: true
    }).addTo(map);

    function notifyPosition(lat, lng) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'PIN_MOVED',
          lat: lat,
          lng: lng
        }));
      }
    }

    marker.on('dragend', function(e) {
      var pos = marker.getLatLng();
      notifyPosition(pos.lat, pos.lng);
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      notifyPosition(e.latlng.lat, e.latlng.lng);
    });

    window.updatePin = function(lat, lng, pan) {
      var latlng = [lat, lng];
      marker.setLatLng(latlng);
      if (pan) {
        map.flyTo(latlng, 17, { duration: 1 });
      }
    };

    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
    }
  </script>
</body>
</html>
  `;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.bgDark }]}>
        {/* Top Header Bar */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Lock Exact Doorstep</Text>
            <Text style={styles.headerSubtitle}>Tap map or drag pin directly to your entrance</Text>
          </View>
          <TouchableOpacity
            style={[styles.locateHeaderBtn, isLocating && styles.locateHeaderBtnDisabled]}
            onPress={() => handleLocateCurrentPosition(true)}
            disabled={isLocating}
            activeOpacity={0.8}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color="#030712" />
            ) : (
              <>
                <Crosshair size={14} color="#030712" />
                <Text style={styles.locateHeaderBtnText}>GPS</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Map Container with Leaflet WebView */}
        <View style={styles.mapWrap}>
          <WebView
            ref={webViewRef}
            source={{ html: leafletHtml }}
            style={styles.webView}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.mapLoadingOverlay}>
                <ActivityIndicator size="large" color={colors.cyan} />
                <Text style={[styles.mapLoadingText, { color: colors.textSecondary }]}>
                  Loading satellite & street grid...
                </Text>
              </View>
            )}
          />

          {/* Floating Target Overlay Pill */}
          <View style={styles.floatingTargetPill}>
            <Compass size={13} color={colors.cyanLight} />
            <Text style={styles.floatingTargetText}>
              {currentCoords.lat.toFixed(5)}°, {currentCoords.lng.toFixed(5)}°
            </Text>
            {isReverseGeocoding ? (
              <ActivityIndicator size="small" color={colors.cyan} style={{ marginLeft: 6 }} />
            ) : null}
          </View>
        </View>

        {/* Bottom Control Sheet */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <View style={[styles.bottomSheet, { backgroundColor: colors.bgCard, paddingBottom: Math.max(insets.bottom, 16) }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Doorstep Precision Badge */}
              <View style={styles.accuracyBadge}>
                <View style={styles.accuracyDot} />
                <Text style={styles.accuracyText}>ACCURATE TO DOORSTEP (HIGH SATELLITE FIDELITY)</Text>
              </View>

              {/* Resolved Address Readout */}
              <View style={styles.addressReadoutRow}>
                <View style={styles.addressIconWrap}>
                  <MapPin size={18} color={colors.cyan} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addressStreet, { color: colors.textPrimary }]} numberOfLines={2}>
                    {resolvedAddress.street}
                  </Text>
                  <Text style={[styles.addressSub, { color: colors.textSecondary }]}>
                    {resolvedAddress.city}, {resolvedAddress.state} • {resolvedAddress.pincode}
                  </Text>
                </View>
              </View>

              {/* Detailed Flat & Landmark Inputs */}
              <View style={styles.inputsRow}>
                <View style={[styles.inputCol, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>HOUSE / FLAT / VILLA NO</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                    placeholder="e.g. Flat 402, Tower B"
                    placeholderTextColor={colors.textMuted}
                    value={houseNumber}
                    onChangeText={setHouseNumber}
                  />
                </View>
                <View style={[styles.inputCol, { flex: 1.2 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>LANDMARK / GATE</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                    placeholder="e.g. Near Metro Pillar 42"
                    placeholderTextColor={colors.textMuted}
                    value={landmark}
                    onChangeText={setLandmark}
                  />
                </View>
              </View>

              {/* Phlebotomist Assurance Note */}
              <View style={styles.assuranceStrip}>
                <Navigation size={12} color={colors.emeraldLight} />
                <Text style={styles.assuranceText}>
                  Our Lab Assistant will receive these exact coordinates on Google Maps to navigate straight to your doorstep.
                </Text>
              </View>

              {/* Confirm & Lock Button */}
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.cyan }]}
                onPress={handleConfirm}
                activeOpacity={0.85}
              >
                <Check size={18} color="#030712" style={{ marginRight: 8 }} />
                <Text style={styles.confirmBtnText}>CONFIRM & LOCK THIS LOCATION</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 10,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 1,
  },
  locateHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22d3ee',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
  },
  locateHeaderBtnDisabled: {
    opacity: 0.6,
  },
  locateHeaderBtnText: {
    color: '#030712',
    fontSize: 12,
    fontWeight: '800',
  },
  mapWrap: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#030712',
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#030712',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLoadingText: {
    fontSize: 12,
    marginTop: 8,
  },
  floatingTargetPill: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(3, 7, 18, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    gap: 6,
    zIndex: 20,
  },
  floatingTargetText: {
    color: '#22d3ee',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  accuracyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
    gap: 6,
  },
  accuracyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  accuracyText: {
    color: '#34d399',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  addressReadoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  addressIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  addressStreet: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  addressSub: {
    fontSize: 12,
    marginTop: 2,
  },
  inputsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  inputCol: {},
  inputLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  assuranceStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 14,
    gap: 8,
  },
  assuranceText: {
    flex: 1,
    color: '#9ca3af',
    fontSize: 10.5,
    lineHeight: 14,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  confirmBtnText: {
    color: '#030712',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});

export default MapLocationPickerModal;
