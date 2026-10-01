import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
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
  Scan,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { colors, gradients } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

export const BarcodeScannerModal = ({
  visible,
  onClose,
  onBarcodeScanned,
  title = 'Scan Vacutainer Barcode',
  subtitle = 'Align the 1D/2D barcode label inside the reticle',
  sampleType = 'Blood (EDTA/SST)',
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [facing, setFacing] = useState('back');
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState(null);

  // Animated laser scan line
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setScannedData(null);

      // Start continuous scanning laser animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      laserAnim.stopAnimation();
    }
  }, [visible]);

  const handleBarcodeRead = ({ type, data }) => {
    if (scanned || !data) return;
    setScanned(true);
    setScannedData(data);

    // Provide visual feedback before closing
    setTimeout(() => {
      onBarcodeScanned(data.trim());
      onClose();
    }, 600);
  };

  const handleSimulateScan = (presetCode) => {
    if (scanned) return;
    setScanned(true);
    setScannedData(presetCode);

    setTimeout(() => {
      onBarcodeScanned(presetCode);
      onClose();
    }, 400);
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
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={22} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSub}>{sampleType} • {subtitle}</Text>
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

        {/* Viewfinder Camera Area */}
        <View style={styles.cameraContainer}>
          {!permission ? (
            <View style={styles.permissionBox}>
              <ActivityIndicator size="large" color={colors.cyan} />
              <Text style={styles.permissionText}>Initializing Camera Viewfinder...</Text>
            </View>
          ) : !permission.granted ? (
            <View style={styles.permissionBox}>
              <AlertCircle size={48} color={colors.amberLight} />
              <Text style={styles.permissionTitle}>Camera Access Required</Text>
              <Text style={styles.permissionText}>
                BioSync requires camera permission to scan physical Vacutainer tube barcodes.
              </Text>
              <TouchableOpacity
                style={styles.permissionBtn}
                onPress={requestPermission}
                activeOpacity={0.8}
              >
                <Text style={styles.permissionBtnText}>Grant Camera Permission</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing={facing}
              enableTorch={torch}
              barcodeScannerSettings={{
                barcodeTypes: [
                  'qr',
                  'code128',
                  'code39',
                  'ean13',
                  'ean8',
                  'upc_a',
                  'upc_e',
                  'codabar',
                  'itf14',
                  'datamatrix',
                ],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeRead}
            >
              {/* Overlay with cutout and target box */}
              <View style={styles.overlay}>
                <View style={styles.overlayTop} />
                <View style={styles.overlayCenter}>
                  <View style={styles.overlaySide} />
                  <View style={[styles.reticleBox, scanned && styles.reticleBoxSuccess]}>
                    {/* Reticle Corner Highlights */}
                    <View style={[styles.corner, styles.cornerTL, scanned && styles.cornerSuccess]} />
                    <View style={[styles.corner, styles.cornerTR, scanned && styles.cornerSuccess]} />
                    <View style={[styles.corner, styles.cornerBL, scanned && styles.cornerSuccess]} />
                    <View style={[styles.corner, styles.cornerBR, scanned && styles.cornerSuccess]} />

                    {/* Animated Scanning Laser Line */}
                    {!scanned && (
                      <Animated.View
                        style={[
                          styles.laserLine,
                          { transform: [{ translateY: laserTranslateY }] },
                        ]}
                      />
                    )}

                    {/* Scanned Badge */}
                    {scanned && (
                      <View style={styles.scannedSuccessBadge}>
                        <CheckCircle2 size={32} color={colors.emeraldLight} />
                        <Text style={styles.scannedSuccessText}>Captured</Text>
                        <Text style={styles.scannedSuccessCode}>{scannedData}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.overlaySide} />
                </View>
                <View style={styles.overlayBottom}>
                  <Text style={styles.helperText}>
                    Place the 1D/2D tube barcode inside the frame. Scanning is instant.
                  </Text>
                </View>
              </View>
            </CameraView>
          )}
        </View>

        {/* Footer Controls & Quick Test Barcodes */}
        <View style={styles.footer}>
          <View style={styles.footerControlsRow}>
            <TouchableOpacity
              style={styles.switchCamBtn}
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
              activeOpacity={0.7}
            >
              <SwitchCamera size={18} color="#ffffff" />
              <Text style={styles.switchCamText}>Flip Camera</Text>
            </TouchableOpacity>

            {scanned && (
              <TouchableOpacity
                style={styles.rescanBtn}
                onPress={() => {
                  setScanned(false);
                  setScannedData(null);
                }}
                activeOpacity={0.7}
              >
                <Scan size={18} color="#000000" />
                <Text style={styles.rescanBtnText}>Rescan</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick-Test Physical Vacutainer Barcode Emulators */}
          <View style={styles.presetsArea}>
            <View style={styles.presetsHeader}>
              <Sparkles size={14} color={colors.cyan} />
              <Text style={styles.presetsTitle}>Quick-Scan Test Tubes (Simulator Support):</Text>
            </View>
            <View style={styles.presetsRow}>
              {[
                { label: 'EDTA Blood', code: `BIO-VACU-${Math.floor(100000 + Math.random() * 900000)}-BLD` },
                { label: 'SST Serum', code: `BIO-VACU-${Math.floor(100000 + Math.random() * 900000)}-SRM` },
                { label: 'Urine Sterile', code: `BIO-KIT-${Math.floor(100000 + Math.random() * 900000)}-URN` },
              ].map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  style={styles.presetChip}
                  onPress={() => handleSimulateScan(preset.code)}
                  activeOpacity={0.8}
                >
                  <Barcode size={13} color={colors.cyan} />
                  <Text style={styles.presetChipText}>{preset.label}</Text>
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
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 11,
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
    position: 'relative',
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
    textAlign: 'center',
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
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderRadius: 16,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  reticleBoxSuccess: {
    borderColor: colors.emeraldLight,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.cyan,
  },
  cornerSuccess: {
    borderColor: colors.emeraldLight,
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
    borderRadius: 2,
  },
  scannedSuccessBadge: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  scannedSuccessText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.emeraldLight,
    marginTop: 8,
    letterSpacing: 1,
  },
  scannedSuccessCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  helperText: {
    fontSize: 12,
    color: '#cbd5e1',
    textAlign: 'center',
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#0a0f1d',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  footerControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchCamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  switchCamText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cyan,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rescanBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  presetsArea: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.cyan,
  },
});

export default BarcodeScannerModal;
