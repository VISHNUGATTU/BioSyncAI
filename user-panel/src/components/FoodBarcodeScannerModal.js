import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  X,
  Flashlight,
  FlashlightOff,
  SwitchCamera,
  Barcode,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Scan,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import nutritionLookupService from '../services/nutritionLookupService';

// Standard popular food barcodes for zero-friction testing & demo
const PRESET_PACKAGED_FOODS = [
  { name: 'Chobani Greek Yogurt', code: '089470001007' },
  { name: 'Quaker Rolled Oats', code: '030000010302' },
  { name: 'Kind Dark Choc Bar', code: '602652171857' },
  { name: 'Almond Breeze Milk', code: '041570054238' },
  { name: 'Heinz Tomato Ketchup', code: '013000006087' },
];

export const FoodBarcodeScannerModal = ({
  visible,
  onClose,
  onFoodFound,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [facing, setFacing] = useState('back');
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [scanned, setScanned] = useState(false);

  // Animated laser scan line
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setErrorMessage(null);
      setLoading(false);

      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 1700,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1700,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      laserAnim.stopAnimation();
    }
  }, [visible]);

  const processBarcode = async (barcode) => {
    if (loading || !barcode) return;
    const clean = barcode.trim();
    if (!clean) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      setScanned(true);

      const foodLog = await nutritionLookupService.lookupBarcode(clean);
      onFoodFound(foodLog);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Product barcode lookup failed.');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeRead = ({ type, data }) => {
    if (scanned || loading || !data) return;
    processBarcode(data);
  };

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 190],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={22} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Packaged Food Barcode Scanner</Text>
            <Text style={styles.headerSub}>Scan UPC/EAN for instant OpenFoodFacts nutritional assay</Text>
          </View>
          <TouchableOpacity
            style={[styles.torchBtn, torch && styles.torchBtnActive]}
            onPress={() => setTorch((prev) => !prev)}
            activeOpacity={0.7}
          >
            {torch ? (
              <Flashlight size={20} color="#000000" />
            ) : (
              <FlashlightOff size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Viewfinder Area */}
        <View style={styles.cameraContainer}>
          {!permission ? (
            <View style={styles.permissionBox}>
              <ActivityIndicator size="large" color={colors.cyan} />
              <Text style={styles.permissionText}>Initializing Camera Scanner...</Text>
            </View>
          ) : !permission.granted ? (
            <View style={styles.permissionBox}>
              <AlertCircle size={48} color={colors.amber} />
              <Text style={styles.permissionTitle}>Camera Permission Required</Text>
              <Text style={styles.permissionText}>
                BioSync requires camera access to scan food package barcodes.
              </Text>
              <TouchableOpacity
                style={styles.permissionBtn}
                onPress={requestPermission}
                activeOpacity={0.8}
              >
                <Text style={styles.permissionBtnText}>Enable Camera</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing={facing}
              enableTorch={torch}
              barcodeScannerSettings={{
                barcodeTypes: [
                  'ean13',
                  'ean8',
                  'upc_a',
                  'upc_e',
                  'code128',
                  'code39',
                  'qr',
                ],
              }}
              onBarcodeScanned={scanned || loading ? undefined : handleBarcodeRead}
            >
              <View style={styles.overlay}>
                <View style={styles.overlayTop} />
                <View style={styles.overlayCenter}>
                  <View style={styles.overlaySide} />
                  <View style={[styles.reticleBox, scanned && styles.reticleBoxSuccess]}>
                    {/* Corners */}
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />

                    {/* Laser line */}
                    {!scanned && !loading && (
                      <Animated.View
                        style={[
                          styles.laserLine,
                          { transform: [{ translateY: laserTranslateY }] },
                        ]}
                      />
                    )}

                    {loading && (
                      <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={colors.cyan} />
                        <Text style={styles.loadingText}>Fetching Nutrition Data...</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.overlaySide} />
                </View>
                <View style={styles.overlayBottom}>
                  {errorMessage ? (
                    <View style={styles.errorBox}>
                      <AlertCircle size={16} color="#ef4444" />
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                  ) : (
                    <Text style={styles.helperText}>
                      Point your camera at the UPC / EAN barcode on the product packaging.
                    </Text>
                  )}
                </View>
              </View>
            </CameraView>
          )}
        </View>

        {/* Footer Area with Manual Input & Presets */}
        <View style={styles.footer}>
          {/* Manual Input Search Row */}
          <View style={styles.manualInputRow}>
            <TextInput
              style={styles.manualTextInput}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="Or enter barcode numbers..."
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              returnKeyType="search"
              onSubmitEditing={() => processBarcode(manualCode)}
            />
            <TouchableOpacity
              style={[styles.manualSearchBtn, (!manualCode || loading) && { opacity: 0.5 }]}
              onPress={() => processBarcode(manualCode)}
              disabled={!manualCode || loading}
              activeOpacity={0.8}
            >
              <Search size={18} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Quick Presets for Demo & Simulator Testing */}
          <View style={styles.presetsContainer}>
            <View style={styles.presetsHeader}>
              <Sparkles size={13} color={colors.cyan} />
              <Text style={styles.presetsTitle}>Quick-Test Packaged Products (OpenFoodFacts):</Text>
            </View>
            <View style={styles.presetsRow}>
              {PRESET_PACKAGED_FOODS.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={styles.presetChip}
                  onPress={() => processBarcode(item.code)}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <Barcode size={12} color={colors.cyan} />
                  <Text style={styles.presetChipText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a0f1d',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  torchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  torchBtnActive: {
    backgroundColor: '#eab308',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#05070d',
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 16,
  },
  permissionText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  permissionBtn: {
    marginTop: 20,
    backgroundColor: colors.cyan,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  overlay: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  overlayCenter: {
    height: 220,
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  reticleBox: {
    width: 280,
    height: 220,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    borderRadius: 16,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  reticleBoxSuccess: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.cyan,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  laserLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 2.5,
    backgroundColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  helperText: {
    fontSize: 12,
    color: '#cbd5e1',
    textAlign: 'center',
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    backgroundColor: '#0a0f1d',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  manualTextInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
  },
  manualSearchBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetsContainer: {
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  presetsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  presetsTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.cyan,
  },
});

export default FoodBarcodeScannerModal;
