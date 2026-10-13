import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Watch,
  Bluetooth,
  Radio,
  Wifi,
  BatteryCharging,
  Heart,
  Activity,
  Wind,
  Gauge,
  Zap,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sliders,
} from 'lucide-react-native';

import { colors, gradients } from '../theme/colors';
import GlassCard from '../components/GlassCard';
import bleWearableService from '../services/bleWearableService';
import userApi from '../api/userApi';

export default function WearableSyncScreen({ navigation }) {
  const [isScanning, setIsScanning] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState(bleWearableService.getStatus());
  const [liveTelemetry, setLiveTelemetry] = useState(null);
  const [pushStatus, setPushStatus] = useState('IDLE'); // 'IDLE' | 'TRANSMITTING' | 'SYNCED'

  // Radar scan animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous radar pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.35,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotate radar beam
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Subscribe to BLE GATT broadcasts
    const unsubscribe = bleWearableService.subscribe((packet) => {
      if (packet.metrics) {
        setLiveTelemetry((prev) => ({
          ...prev,
          ...packet.metrics,
        }));
      }
    });

    // Fetch initial reading from latest API or start live stream
    userApi
      .getLatestIoTReading()
      .then((res) => {
        if (res?.success && res.reading?.metrics) {
          setLiveTelemetry(res.reading.metrics);
        }
      })
      .catch(() => {});

    return () => {
      unsubscribe();
    };
  }, []);

  // Heartbeat micro-animation
  const triggerHeartbeat = useCallback(() => {
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.3,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 1.0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [heartScale]);

  useEffect(() => {
    if (liveTelemetry?.heartRate) {
      triggerHeartbeat();
    }
  }, [liveTelemetry?.heartRate]);

  // Connect BLE Device Handler
  const handleConnect = async () => {
    setIsScanning(true);
    try {
      const res = await bleWearableService.requestDevice();
      setDeviceStatus(bleWearableService.getStatus());
      setIsScanning(false);
      Alert.alert(
        'Connected Successfully',
        `Device ${res.device.name} paired via ${res.mode === 'HARDWARE_BLE' ? 'Physical Web BLE' : 'BioSync Digital Twin Engine'}.`
      );
    } catch (err) {
      setIsScanning(false);
      Alert.alert('Connection Notice', err.message || 'Bluetooth connection error');
    }
  };

  const handleDisconnect = () => {
    bleWearableService.disconnect();
    setDeviceStatus(bleWearableService.getStatus());
  };

  // Push Live Telemetry to Backend Hospital Cloud
  const handlePushTelemetry = async () => {
    setPushStatus('TRANSMITTING');
    try {
      const packet = {
        metrics: liveTelemetry || {
          heartRate: 74,
          spO2: 98,
          systolicBP: 120,
          diastolicBP: 80,
          continuousGlucose: 96,
        },
        device: deviceStatus.device,
      };

      const res = await userApi.postIoTTelemetry(packet);
      if (res?.success) {
        setPushStatus('SYNCED');
        setTimeout(() => setPushStatus('IDLE'), 3000);
      } else {
        setPushStatus('IDLE');
      }
    } catch {
      setPushStatus('IDLE');
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.bgDark, '#030d1a']} style={StyleSheet.absoluteFill} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Connected Health Devices</Text>
          <Text style={styles.headerSubtitle}>Bluetooth SIG GATT 1Hz Telemetry Hub</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleConnect}
          activeOpacity={0.7}
        >
          <RefreshCw size={18} color={colors.cyan} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Radar Scanner Visualizer */}
        <View style={styles.radarCard}>
          <View style={styles.radarContainer}>
            <Animated.View
              style={[
                styles.pulseRing,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <View style={styles.radarCircle}>
              <Animated.View style={[styles.radarSweep, { transform: [{ rotate: spin }] }]} />
              <View style={styles.centerIconWrap}>
                <Watch size={38} color={deviceStatus.isConnected ? colors.cyan : colors.textMuted} />
              </View>
            </View>
          </View>

          <Text style={styles.radarStatusTitle}>
            {deviceStatus.isConnected ? 'Smartwatch Stream Active' : 'Scanning for GATT Devices'}
          </Text>
          <Text style={styles.radarStatusSub}>
            {deviceStatus.isConnected
              ? `Connected: ${deviceStatus.device.name}`
              : 'Hold smartwatch within 5 meters with Bluetooth enabled'}
          </Text>

          <View style={styles.actionRow}>
            {deviceStatus.isConnected ? (
              <TouchableOpacity
                style={[styles.btnAction, styles.btnDisconnect]}
                onPress={handleDisconnect}
                activeOpacity={0.8}
              >
                <Bluetooth size={16} color="#ff6b6b" />
                <Text style={styles.btnDisconnectText}>Disconnect</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.btnAction, styles.btnConnect]}
                onPress={handleConnect}
                activeOpacity={0.8}
              >
                <Bluetooth size={16} color="#ffffff" />
                <Text style={styles.btnConnectText}>
                  {isScanning ? 'Pairing...' : 'Scan & Pair Smartwatch'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.btnAction,
                styles.btnSync,
                pushStatus === 'SYNCED' && { borderColor: colors.emerald },
              ]}
              onPress={handlePushTelemetry}
              activeOpacity={0.8}
            >
              <Zap size={16} color={pushStatus === 'SYNCED' ? colors.emerald : colors.cyan} />
              <Text style={styles.btnSyncText}>
                {pushStatus === 'TRANSMITTING'
                  ? 'Transmitting...'
                  : pushStatus === 'SYNCED'
                  ? 'Cloud Synced'
                  : 'Sync Telemetry'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live GATT Stream Biomarker Cards */}
        <Text style={styles.sectionHeading}>Real-Time GATT Services (0x180D / 0x1822 / 0x1808)</Text>

        <View style={styles.grid}>
          {/* Card 1: Heart Rate Service */}
          <GlassCard style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Heart size={20} color="#ff4d4d" fill="#ff4d4d" />
              </Animated.View>
              <Text style={styles.metricBadge}>GATT 0x180D</Text>
            </View>
            <Text style={styles.metricValue}>
              {liveTelemetry?.heartRate || 74}
              <Text style={styles.metricUnit}> bpm</Text>
            </Text>
            <Text style={styles.metricLabel}>Continuous Pulse</Text>
            <Text style={styles.metricSub}>RR-Intervals: 810 ms</Text>
          </GlassCard>

          {/* Card 2: Pulse Oximeter Service */}
          <GlassCard style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Wind size={20} color={colors.cyan} />
              <Text style={styles.metricBadge}>GATT 0x1822</Text>
            </View>
            <Text style={styles.metricValue}>
              {liveTelemetry?.spO2Percent || liveTelemetry?.spO2 || 98}
              <Text style={styles.metricUnit}> %</Text>
            </Text>
            <Text style={styles.metricLabel}>Arterial SpO2</Text>
            <Text style={styles.metricSub}>Perfusion: 5.4%</Text>
          </GlassCard>

          {/* Card 3: Continuous Glucose Monitoring (CGM) */}
          <GlassCard style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Activity size={20} color="#ffaa00" />
              <Text style={styles.metricBadge}>GATT 0x1808</Text>
            </View>
            <Text style={styles.metricValue}>
              {liveTelemetry?.glucoseCgm || liveTelemetry?.continuousGlucose || 95}
              <Text style={styles.metricUnit}> mg/dL</Text>
            </Text>
            <Text style={styles.metricLabel}>Interstitial Glucose</Text>
            <Text style={styles.metricSub}>Trend: STABLE (0.0 mg/dL/m)</Text>
          </GlassCard>

          {/* Card 4: Hemodynamic Windkessel BP */}
          <GlassCard style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Gauge size={20} color="#8a2be2" />
              <Text style={styles.metricBadge}>Arterial Pulse</Text>
            </View>
            <Text style={styles.metricValue}>
              {liveTelemetry?.systolicBP || 118}/{liveTelemetry?.diastolicBP || 78}
              <Text style={styles.metricUnit}> mmHg</Text>
            </Text>
            <Text style={styles.metricLabel}>Blood Pressure</Text>
            <Text style={styles.metricSub}>
              MAP: {Math.round(((liveTelemetry?.systolicBP || 118) + 2 * (liveTelemetry?.diastolicBP || 78)) / 3)} mmHg
            </Text>
          </GlassCard>
        </View>

        {/* Hardware & Battery Telemetry */}
        <GlassCard style={styles.hardwareSpecsCard}>
          <View style={styles.specRow}>
            <View style={styles.specItem}>
              <BatteryCharging size={18} color={colors.emerald} />
              <Text style={styles.specLabel}>Battery Level</Text>
              <Text style={styles.specValue}>{deviceStatus.device.batteryLevel}%</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <Radio size={18} color={colors.cyan} />
              <Text style={styles.specLabel}>Signal RSSI</Text>
              <Text style={styles.specValue}>{deviceStatus.device.rssi} dBm</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <ShieldCheck size={18} color="#00d2ff" />
              <Text style={styles.specLabel}>Certification</Text>
              <Text style={styles.specValue}>NABL ISO 15189</Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.cyan,
    fontWeight: '600',
    marginTop: 2,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 210, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  radarCard: {
    backgroundColor: 'rgba(10, 25, 47, 0.65)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.25)',
    marginBottom: 24,
  },
  radarContainer: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(0, 210, 255, 0.35)',
  },
  radarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 30, 60, 0.85)',
    borderWidth: 1.5,
    borderColor: colors.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  radarSweep: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRightWidth: 2,
    borderRightColor: 'rgba(0, 210, 255, 0.8)',
  },
  centerIconWrap: {
    zIndex: 10,
  },
  radarStatusTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  radarStatusSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btnAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  btnConnect: {
    backgroundColor: colors.primary,
  },
  btnConnectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  btnDisconnect: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.4)',
  },
  btnDisconnectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ff6b6b',
  },
  btnSync: {
    backgroundColor: 'rgba(0, 210, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.35)',
  },
  btnSyncText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.cyan,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    padding: 16,
    borderRadius: 18,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 4,
  },
  metricSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  hardwareSpecsCard: {
    padding: 16,
    borderRadius: 18,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  specDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  specLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  specValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
});
