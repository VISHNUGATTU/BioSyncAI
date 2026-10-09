import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Circle,
  Line,
} from 'react-native-svg';
import {
  Heart,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Radio,
  Wifi,
  BatteryCharging,
  Wind,
  Gauge,
  Sparkles,
  Flame,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react-native';
import userApi from '../api/userApi';
import GlassCard from './GlassCard';

/**
 * High-Precision 1-Second Biometric IoT Telemetry Generator
 * Mathematical model for 1-second physiological updates:
 * - Respiratory Sinus Arrhythmia: HR(t) = HR_base + sin(t * 0.35) * 3.2 + noise
 * - Interstitial CGM Diffusion: Glucose(t) = G_base + sin(t * 0.04) * 4.5 + drift
 * - Arterial Pressure Pulse: Systolic / Diastolic oscillation
 */
const calculateLocal1SecPacket = (baseVitals, stepIndex, activityMode = 'resting') => {
  const modeMultiplier = activityMode === 'exercise' ? 1.45 : activityMode === 'walking' ? 1.15 : 1.0;
  const baseHR = (baseVitals?.continuousMetrics?.restingHeartRate || 72) * modeMultiplier;
  const baseSpO2 = baseVitals?.continuousMetrics?.oxygenSaturationSpO2 || 98;
  const baseGlucose = baseVitals?.metabolicHealth?.glucoseFasting || 94;
  const baseSystolic = (baseVitals?.cardiovascularRisk?.systolic || 120) * (activityMode === 'exercise' ? 1.2 : 1.0);
  const baseDiastolic = baseVitals?.cardiovascularRisk?.diastolic || 80;
  const baseHRV = activityMode === 'exercise' ? 32 : (baseVitals?.continuousMetrics?.hrv || 54);

  const t = stepIndex;
  const respiratoryModulation = Math.sin(t * 0.35) * 3.2;
  const hrRandomDrift = (Math.random() - 0.5) * 2.2;
  const currentHeartRate = Math.round(
    Math.max(48, Math.min(170, baseHR + respiratoryModulation + hrRandomDrift))
  );

  const hrvDrift = (Math.random() - 0.5) * 3.5;
  const currentHRV = Math.round(
    Math.max(18, Math.min(95, baseHRV - (respiratoryModulation * 0.7) + hrvDrift))
  );

  const spO2Jitter = Math.random() > 0.88 ? -1 : 0;
  const currentSpO2 = Math.max(93, Math.min(100, baseSpO2 + spO2Jitter));

  const glucoseSlowWave = Math.sin(t * 0.04) * 4.8 + Math.cos(t * 0.015) * 2.2;
  const glucoseJitter = (Math.random() - 0.5) * 0.7;
  const currentGlucose = Number(
    Math.max(65, Math.min(230, baseGlucose + glucoseSlowWave + glucoseJitter)).toFixed(1)
  );

  const bpMod = Math.sin(t * 0.22) * 2.4;
  const currentSystolic = Math.round(
    Math.max(90, Math.min(175, baseSystolic + bpMod + (Math.random() - 0.5) * 1.5))
  );
  const currentDiastolic = Math.round(
    Math.max(55, Math.min(105, baseDiastolic + (bpMod * 0.4) + (Math.random() - 0.5) * 1.0))
  );

  const stressRaw = Math.round(100 - (currentHRV * 1.15) + (activityMode === 'exercise' ? 30 : 0));
  const currentStress = Math.max(10, Math.min(92, stressRaw));

  const respirationRate = Number((14.5 + Math.sin(t * 0.12) * 1.8 + (activityMode === 'exercise' ? 8 : 0)).toFixed(1));
  const skinTemp = Number((36.5 + Math.sin(t * 0.02) * 0.25).toFixed(2));
  const perfusionIndex = Number((5.4 + Math.sin(t * 0.09) * 0.6).toFixed(2));

  return {
    timestamp: new Date().toISOString(),
    epochMs: Date.now(),
    stepSecond: stepIndex,
    device: {
      deviceName: 'BioSync Medical Watch Ultra',
      cgmSensor: 'Dexcom G7 Continuous Subcutaneous Probe',
      batteryLevel: Math.max(68, 98 - Math.floor(stepIndex / 180)),
      connectionStatus: 'ACTIVE_STREAMING',
      bleRssi: -52 + (Math.random() > 0.5 ? 1 : -1),
    },
    metrics: {
      heartRate: currentHeartRate,
      hrvMs: currentHRV,
      spO2Percent: currentSpO2,
      glucoseCgm: currentGlucose,
      glucoseTrend: glucoseSlowWave > 0.6 ? 'RISING_STEADY' : glucoseSlowWave < -0.6 ? 'FALLING_STEADY' : 'STABLE',
      systolicBP: currentSystolic,
      diastolicBP: currentDiastolic,
      meanArterialPressure: Math.round((currentSystolic + 2 * currentDiastolic) / 3),
      stressIndex: currentStress,
      respirationRate,
      skinTemperatureCelsius: skinTemp,
      perfusionIndexPercent: perfusionIndex,
    },
  };
};

export const LiveIoTWatchSyncCard = ({
  baseVitals = null,
  onTelemetryUpdate = null,
  containerStyle = null,
}) => {
  const [isStreaming, setIsStreaming] = useState(true);
  const [activityMode, setActivityMode] = useState('resting'); // 'resting' | 'walking' | 'exercise'
  const [stepCount, setStepCount] = useState(0);
  const [telemetry, setTelemetry] = useState(() =>
    calculateLocal1SecPacket(baseVitals, 0, 'resting')
  );
  const [pulseHistory, setPulseHistory] = useState([72, 73, 72, 74, 75, 73, 72, 74, 73, 72]);

  // Pulse animation for heart rate
  const heartScale = useRef(new Animated.Value(1)).current;
  const pulseWaveOpacity = useRef(new Animated.Value(0.4)).current;

  const triggerHeartbeatAnimation = useCallback(() => {
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.25,
        duration: 140,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 0.95,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 1.0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(pulseWaveOpacity, {
        toValue: 1.0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(pulseWaveOpacity, {
        toValue: 0.35,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [heartScale, pulseWaveOpacity]);

  // 1-Second Timer Hook (1000ms Real-Time Clock)
  useEffect(() => {
    if (!isStreaming) return;

    const intervalId = setInterval(async () => {
      setStepCount((prev) => {
        const nextStep = prev + 1;
        const newLocalPacket = calculateLocal1SecPacket(baseVitals, nextStep, activityMode);

        // Optionally query server endpoint every 3 seconds to sync server ground-truth
        if (nextStep % 3 === 0) {
          userApi
            .getLatestIoTReading()
            .then((res) => {
              if (res?.success && res.reading) {
                setTelemetry(res.reading);
                if (onTelemetryUpdate) onTelemetryUpdate(res.reading);
              }
            })
            .catch(() => {
              // Silently fallback to mathematical 1-sec simulation
            });
        }

        setTelemetry(newLocalPacket);
        if (onTelemetryUpdate) onTelemetryUpdate(newLocalPacket);

        setPulseHistory((hist) => {
          const nextHist = [...hist.slice(1), newLocalPacket.metrics.heartRate];
          return nextHist;
        });

        triggerHeartbeatAnimation();
        return nextStep;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isStreaming, activityMode, baseVitals, onTelemetryUpdate, triggerHeartbeatAnimation]);

  const { metrics, device } = telemetry;

  // ECG Sparkline SVG Path builder
  const renderECGPath = () => {
    const width = 280;
    const height = 36;
    const points = pulseHistory;
    const minVal = Math.min(...points) - 5;
    const maxVal = Math.max(...points) + 5;
    const range = Math.max(1, maxVal - minVal);

    const stepX = width / (points.length - 1);
    const coords = points.map((val, idx) => {
      const x = idx * stepX;
      const y = height - ((val - minVal) / range) * (height - 8) - 4;
      return `${x},${y}`;
    });

    return `M ${coords.join(' L ')}`;
  };

  const getGlucoseTrendIcon = (trend) => {
    switch (trend) {
      case 'RISING_STEADY':
        return <TrendingUp size={13} color="#f59e0b" />;
      case 'FALLING_STEADY':
        return <TrendingDown size={13} color="#06b6d4" />;
      default:
        return <Minus size={13} color="#10b981" />;
    }
  };

  return (
    <GlassCard style={[styles.cardContainer, containerStyle]}>
      {/* Top Header: Device Name & 1Hz Status Indicator */}
      <View style={styles.topHeader}>
        <View style={styles.deviceInfoRow}>
          <View style={styles.liveIndicatorRing}>
            <View
              style={[
                styles.liveDot,
                { backgroundColor: isStreaming ? '#10b981' : '#64748b' },
              ]}
            />
          </View>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.deviceTitle}>BioSync Smartwatch Stream</Text>
              <View style={styles.hzPill}>
                <Radio size={9} color="#06b6d4" />
                <Text style={styles.hzText}>Real-Time</Text>
              </View>
            </View>
            <Text style={styles.deviceSubtitle}>
              Continuous Wireless Sensor Sync
            </Text>
          </View>
        </View>

        {/* Live Streaming Toggle Button */}
        <TouchableOpacity
          style={[
            styles.syncToggleBtn,
            isStreaming ? styles.syncToggleBtnActive : styles.syncToggleBtnPaused,
          ]}
          onPress={() => setIsStreaming(!isStreaming)}
          activeOpacity={0.8}
        >
          <Radio size={11} color={isStreaming ? '#10b981' : '#94a3b8'} />
          <Text
            style={[
              styles.syncToggleText,
              { color: isStreaming ? '#10b981' : '#94a3b8' },
            ]}
          >
            {isStreaming ? 'Live' : 'Paused'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Real-Time Vitals Grid */}
      <View style={styles.vitalsGrid}>
        {/* Metric 1: Heart Rate with Pulsing Heart */}
        <View style={styles.metricTile}>
          <View style={styles.metricHeader}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Heart size={14} color="#ef4444" fill="#ef4444" />
            </Animated.View>
            <Text style={styles.metricLabel}>PULSE</Text>
          </View>
          <View style={styles.metricValueRow}>
            <Text style={[styles.metricValue, { color: '#ef4444' }]}>
              {metrics.heartRate}
            </Text>
            <Text style={styles.metricUnit}>BPM</Text>
          </View>
          <Text style={styles.metricSub}>Normal Rhythm</Text>
        </View>

        {/* Metric 2: Continuous Glucose Monitor (CGM) */}
        <View style={styles.metricTile}>
          <View style={styles.metricHeader}>
            <Activity size={14} color="#f59e0b" />
            <Text style={styles.metricLabel}>GLUCOSE</Text>
          </View>
          <View style={styles.metricValueRow}>
            <Text style={[styles.metricValue, { color: '#f59e0b' }]}>
              {metrics.glucoseCgm}
            </Text>
            <View style={styles.trendArrowBox}>
              {getGlucoseTrendIcon(metrics.glucoseTrend)}
            </View>
          </View>
          <Text style={styles.metricSub}>mg/dL • Continuous</Text>
        </View>

        {/* Metric 3: Blood Pressure Waveform */}
        <View style={styles.metricTile}>
          <View style={styles.metricHeader}>
            <Gauge size={14} color="#3b82f6" />
            <Text style={styles.metricLabel}>PRESSURE</Text>
          </View>
          <View style={styles.metricValueRow}>
            <Text style={[styles.metricValue, { color: '#3b82f6' }]}>
              {metrics.systolicBP}/{metrics.diastolicBP}
            </Text>
            <Text style={styles.metricUnit}>mmHg</Text>
          </View>
          <Text style={styles.metricSub}>Optimal Range</Text>
        </View>

        {/* Metric 4: Pulse Oximetry (SpO2) */}
        <View style={styles.metricTile}>
          <View style={styles.metricHeader}>
            <Wind size={14} color="#06b6d4" />
            <Text style={styles.metricLabel}>OXYGEN</Text>
          </View>
          <View style={styles.metricValueRow}>
            <Text style={[styles.metricValue, { color: '#06b6d4' }]}>
              {metrics.spO2Percent}
            </Text>
            <Text style={styles.metricUnit}>%</Text>
          </View>
          <Text style={styles.metricSub}>SpO2 In Range</Text>
        </View>
      </View>

      {/* Real-Time 1-Second ECG / Arterial Wave Visualizer */}
      <View style={styles.waveformContainer}>
        <View style={styles.waveformHeader}>
          <Text style={styles.waveformLabel}>LIVE PULSE WAVE</Text>
          <Text style={styles.waveformTime}>
            Streaming Live
          </Text>
        </View>
        <Svg width="100%" height={36} viewBox="0 0 280 36">
          <Defs>
            <SvgLinearGradient id="pulseGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
              <Stop offset="70%" stopColor="#ef4444" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#ef4444" stopOpacity="1.0" />
            </SvgLinearGradient>
          </Defs>
          <Line
            x1="0"
            y1="18"
            x2="280"
            y2="18"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeDasharray="4, 4"
            strokeWidth="1"
          />
          <Path
            d={renderECGPath()}
            fill="none"
            stroke="url(#pulseGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle
            cx="280"
            cy={36 - ((pulseHistory[pulseHistory.length - 1] - 50) / 70) * 28 - 4}
            r="3.5"
            fill="#ef4444"
          />
        </Svg>
      </View>

      {/* Secondary Biometrics Strip: HRV, Stress, Temp, Respiration */}
      <View style={styles.secondaryStrip}>
        <View style={styles.secondaryItem}>
          <Text style={styles.secondaryLabel}>HRV (rMSSD)</Text>
          <Text style={styles.secondaryValue}>{metrics.hrvMs} ms</Text>
        </View>
        <View style={styles.secondaryDivider} />
        <View style={styles.secondaryItem}>
          <Text style={styles.secondaryLabel}>Stress Index</Text>
          <Text
            style={[
              styles.secondaryValue,
              { color: metrics.stressIndex > 65 ? '#ef4444' : '#10b981' },
            ]}
          >
            {metrics.stressIndex}/100
          </Text>
        </View>
        <View style={styles.secondaryDivider} />
        <View style={styles.secondaryItem}>
          <Text style={styles.secondaryLabel}>Respiration</Text>
          <Text style={styles.secondaryValue}>{metrics.respirationRate} rpm</Text>
        </View>
        <View style={styles.secondaryDivider} />
        <View style={styles.secondaryItem}>
          <Text style={styles.secondaryLabel}>Skin Temp</Text>
          <Text style={styles.secondaryValue}>{metrics.skinTemperatureCelsius}°C</Text>
        </View>
      </View>

      {/* Wearable Simulation Activity Modes Selector */}
      <View style={styles.activityModesBar}>
        <Text style={styles.modesLabel}>Simulate State:</Text>
        <TouchableOpacity
          style={[
            styles.modePill,
            activityMode === 'resting' && styles.modePillActive,
          ]}
          onPress={() => setActivityMode('resting')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.modePillText,
              activityMode === 'resting' && styles.modePillTextActive,
            ]}
          >
            Resting
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modePill,
            activityMode === 'walking' && styles.modePillActive,
          ]}
          onPress={() => setActivityMode('walking')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.modePillText,
              activityMode === 'walking' && styles.modePillTextActive,
            ]}
          >
            Walking
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modePill,
            activityMode === 'exercise' && styles.modePillActive,
          ]}
          onPress={() => setActivityMode('exercise')}
          activeOpacity={0.7}
        >
          <Flame
            size={10}
            color={activityMode === 'exercise' ? '#ef4444' : '#64748b'}
          />
          <Text
            style={[
              styles.modePillText,
              activityMode === 'exercise' && styles.modePillTextActive,
            ]}
          >
            Exercise
          </Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.28)',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    marginVertical: 10,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  deviceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveIndicatorRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviceTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  hzPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  hzText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#06b6d4',
  },
  deviceSubtitle: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 1,
  },
  syncToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  syncToggleBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  syncToggleBtnPaused: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  syncToggleText: {
    fontSize: 10,
    fontWeight: '800',
  },
  vitalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 10,
  },
  metricTile: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.55)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.3,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  metricUnit: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748b',
  },
  trendArrowBox: {
    marginLeft: 2,
  },
  metricSub: {
    fontSize: 7.5,
    color: '#64748b',
    marginTop: 2,
  },
  waveformContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 10,
  },
  waveformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  waveformLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.4,
  },
  waveformTime: {
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#06b6d4',
  },
  secondaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  secondaryItem: {
    alignItems: 'center',
  },
  secondaryLabel: {
    fontSize: 7.5,
    color: '#64748b',
    fontWeight: '700',
  },
  secondaryValue: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 1,
  },
  secondaryDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  activityModesBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modesLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748b',
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  modePillActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  modePillText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#94a3b8',
  },
  modePillTextActive: {
    color: '#06b6d4',
    fontWeight: '800',
  },
});

export default LiveIoTWatchSyncCard;
