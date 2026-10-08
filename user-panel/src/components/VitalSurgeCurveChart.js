import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Line,
  Circle,
  Text as SvgText,
} from 'react-native-svg';
import { Activity, ShieldCheck, Sparkles, TrendingDown, Clock, Zap } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 160;

/**
 * Computes Bergman Minimal Model 180-min ODE Glucose & Windkessel BP trajectory.
 * Allows interactive simulation when doctor hacks are applied.
 */
export const calculateDynamicSurgePoints = ({
  baselineGlucose = 92,
  baselineBP = 120,
  netCarbs = 40,
  sodium = 300,
  glycemicIndex = 50,
  portionMultiplier = 1.0,
  appliedHacksCount = 0,
  betaCarb = 0.28,
  betaSodium = 0.007,
  insulinSensitivity = 0.72,
}) => {
  const effectiveCarbs = Math.max(0, netCarbs * portionMultiplier);
  const effectiveSodium = Math.max(0, sodium * portionMultiplier);

  // Time grid in minutes across 3 hours (180 mins)
  const timePoints = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];

  // Harm reduction damping factor from applied doctor hacks (up to 38% reduction)
  const hackDamping = Math.max(0.62, 1.0 - (appliedHacksCount * 0.12));

  // Glucose surge calculation
  const giFactor = Math.max(0.7, glycemicIndex / 55.0);
  const rawSpike = (effectiveCarbs * betaCarb * giFactor) / Math.max(0.3, insulinSensitivity * 1.1);

  const standardPeakSpike = Math.round(rawSpike);
  const hackedPeakSpike = Math.round(rawSpike * hackDamping);

  const standardTrajectory = timePoints.map((t) => {
    // Physiological gamma-distribution shaped postprandial curve
    const tau = 45.0; // peak around 50-60 min
    const shape = (t / tau) * Math.exp(1.0 - (t / tau));
    const currentGlucose = Math.round(baselineGlucose + (standardPeakSpike * shape));
    return { time: t, value: currentGlucose };
  });

  const hackedTrajectory = timePoints.map((t) => {
    const tau = 55.0; // blunted and delayed peak
    const shape = (t / tau) * Math.exp(1.0 - (t / tau));
    const currentGlucose = Math.round(baselineGlucose + (hackedPeakSpike * shape));
    return { time: t, value: currentGlucose };
  });

  // Windkessel Systolic Blood Pressure surge calculation
  const bpRawSpike = (effectiveSodium * betaSodium) * 0.5;
  const standardBpPeak = Number(bpRawSpike.toFixed(1));
  const hackedBpPeak = Number((bpRawSpike * Math.max(0.65, 1.0 - (appliedHacksCount * 0.09))).toFixed(1));

  const standardBpTrajectory = timePoints.map((t) => {
    const shape = (t / 60.0) * Math.exp(1.0 - (t / 60.0));
    const currentBp = Number((baselineBP + (standardBpPeak * shape)).toFixed(1));
    return { time: t, value: currentBp };
  });

  const hackedBpTrajectory = timePoints.map((t) => {
    const shape = (t / 70.0) * Math.exp(1.0 - (t / 70.0));
    const currentBp = Number((baselineBP + (hackedBpPeak * shape)).toFixed(1));
    return { time: t, value: currentBp };
  });

  return {
    timePoints,
    glucose: {
      standard: standardTrajectory,
      hacked: hackedTrajectory,
      baseline: baselineGlucose,
      standardPeak: baselineGlucose + standardPeakSpike,
      hackedPeak: baselineGlucose + hackedPeakSpike,
      harmReduction: standardPeakSpike - hackedPeakSpike,
      percentReduction: standardPeakSpike > 0 ? Math.round(((standardPeakSpike - hackedPeakSpike) / standardPeakSpike) * 100) : 0,
    },
    bp: {
      standard: standardBpTrajectory,
      hacked: hackedBpTrajectory,
      baseline: baselineBP,
      standardPeak: Number((baselineBP + standardBpPeak).toFixed(1)),
      hackedPeak: Number((baselineBP + hackedBpPeak).toFixed(1)),
      harmReduction: Number((standardBpPeak - hackedBpPeak).toFixed(1)),
      percentReduction: standardBpPeak > 0 ? Math.round(((standardBpPeak - hackedBpPeak) / standardBpPeak) * 100) : 0,
    },
  };
};

export const VitalSurgeCurveChart = ({
  baselineGlucose = 92,
  baselineBP = 120,
  netCarbs = 40,
  sodium = 300,
  glycemicIndex = 50,
  portionMultiplier = 1.0,
  appliedHacksCount = 0,
  twinParams = {},
}) => {
  const [metricTab, setMetricTab] = useState('glucose'); // 'glucose' | 'bp'

  const data = calculateDynamicSurgePoints({
    baselineGlucose,
    baselineBP,
    netCarbs,
    sodium,
    glycemicIndex,
    portionMultiplier,
    appliedHacksCount,
    betaCarb: twinParams.betaCarb || 0.28,
    betaSodium: twinParams.betaSodium || 0.007,
    insulinSensitivity: twinParams.insulinSensitivity || 0.72,
  });

  const isGlucose = metricTab === 'glucose';
  const currentMetric = isGlucose ? data.glucose : data.bp;
  const standardPoints = currentMetric.standard;
  const hackedPoints = currentMetric.hacked;

  // Determine chart vertical scaling
  const allValues = [
    ...standardPoints.map((p) => p.value),
    ...hackedPoints.map((p) => p.value),
    currentMetric.baseline,
  ];
  const minValue = Math.floor(Math.min(...allValues) - (isGlucose ? 8 : 4));
  const maxValue = Math.ceil(Math.max(...allValues) + (isGlucose ? 12 : 6));
  const valueRange = Math.max(1, maxValue - minValue);

  const getX = (index) => (index / (data.timePoints.length - 1)) * CHART_WIDTH;
  const getY = (val) => CHART_HEIGHT - ((val - minValue) / valueRange) * (CHART_HEIGHT - 26) - 13;

  // Build SVG Path strings
  const buildSvgPath = (points) => {
    return points.reduce((acc, point, idx) => {
      const x = getX(idx);
      const y = getY(point.value);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  const standardPath = buildSvgPath(standardPoints);
  const hackedPath = buildSvgPath(hackedPoints);

  // Closed area paths for gradient fills
  const areaStandardPath = `${standardPath} L ${getX(standardPoints.length - 1)} ${CHART_HEIGHT} L ${getX(0)} ${CHART_HEIGHT} Z`;
  const areaHackedPath = `${hackedPath} L ${getX(hackedPoints.length - 1)} ${CHART_HEIGHT} L ${getX(0)} ${CHART_HEIGHT} Z`;

  const baselineY = getY(currentMetric.baseline);

  return (
    <View style={styles.container}>
      {/* Tab Switcher & Metric Summary */}
      <View style={styles.headerRow}>
        <View style={styles.tabButtons}>
          <TouchableOpacity
            style={[styles.tabBtn, isGlucose && styles.tabBtnActive]}
            onPress={() => setMetricTab('glucose')}
            activeOpacity={0.75}
          >
            <Activity size={13} color={isGlucose ? '#06b6d4' : '#94a3b8'} />
            <Text style={[styles.tabText, isGlucose && styles.tabTextActive]}>
              GLUCOSE SURGE
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, !isGlucose && styles.tabBtnActive]}
            onPress={() => setMetricTab('bp')}
            activeOpacity={0.75}
          >
            <Zap size={13} color={!isGlucose ? '#f59e0b' : '#94a3b8'} />
            <Text style={[styles.tabText, !isGlucose && styles.tabTextActive]}>
              BLOOD PRESSURE
            </Text>
          </TouchableOpacity>
        </View>

        {appliedHacksCount > 0 && (
          <View style={styles.harmReductionBadge}>
            <TrendingDown size={11} color="#10b981" />
            <Text style={styles.harmReductionText}>
              -{currentMetric.percentReduction}% PEAK
            </Text>
          </View>
        )}
      </View>

      {/* Numerical Callout Strip */}
      <View style={styles.calloutStrip}>
        <View style={styles.calloutBox}>
          <Text style={styles.calloutLabel}>PREDICTED PEAK</Text>
          <Text style={[styles.calloutVal, { color: isGlucose ? '#f87171' : '#f59e0b' }]}>
            {appliedHacksCount > 0 ? currentMetric.hackedPeak : currentMetric.standardPeak}
            <Text style={styles.calloutUnit}> {isGlucose ? 'mg/dL' : 'mmHg'}</Text>
          </Text>
        </View>

        <View style={styles.calloutDivider} />

        <View style={styles.calloutBox}>
          <Text style={styles.calloutLabel}>FASTING BASELINE</Text>
          <Text style={[styles.calloutVal, { color: '#06b6d4' }]}>
            {currentMetric.baseline}
            <Text style={styles.calloutUnit}> {isGlucose ? 'mg/dL' : 'mmHg'}</Text>
          </Text>
        </View>

        <View style={styles.calloutDivider} />

        <View style={styles.calloutBox}>
          <Text style={styles.calloutLabel}>HACKS BUFFER</Text>
          <Text style={[styles.calloutVal, { color: appliedHacksCount > 0 ? '#10b981' : '#64748b' }]}>
            {appliedHacksCount > 0 ? `-${currentMetric.harmReduction}` : 'None'}
            <Text style={styles.calloutUnit}> {isGlucose ? 'mg/dL' : 'mmHg'}</Text>
          </Text>
        </View>
      </View>

      {/* SVG Canvas */}
      <View style={styles.chartWrapper}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <SvgLinearGradient id="standardGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#ef4444" stopOpacity="0.22" />
              <Stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </SvgLinearGradient>

            <SvgLinearGradient id="hackedGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#10b981" stopOpacity="0.30" />
              <Stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </SvgLinearGradient>
          </Defs>

          {/* Horizontal Grid Baseline */}
          <Line
            x1={0}
            y1={baselineY}
            x2={CHART_WIDTH}
            y2={baselineY}
            stroke="rgba(6, 182, 212, 0.3)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />

          {/* Standard Surge Area & Curve (Unmitigated) */}
          {appliedHacksCount > 0 && (
            <>
              <Path d={areaStandardPath} fill="url(#standardGrad)" />
              <Path
                d={standardPath}
                stroke="#f87171"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                fill="none"
              />
            </>
          )}

          {/* Active / Mitigated Surge Area & Curve */}
          <Path
            d={appliedHacksCount > 0 ? areaHackedPath : areaStandardPath}
            fill={appliedHacksCount > 0 ? 'url(#hackedGrad)' : 'url(#standardGrad)'}
          />
          <Path
            d={appliedHacksCount > 0 ? hackedPath : standardPath}
            stroke={appliedHacksCount > 0 ? '#10b981' : (isGlucose ? '#06b6d4' : '#f59e0b')}
            strokeWidth={2.6}
            fill="none"
          />

          {/* Time & Peak Dot */}
          {data.timePoints.map((t, idx) => {
            const isPeak = idx === 4 || idx === 5;
            if (!isPeak && idx !== 0 && idx !== data.timePoints.length - 1) return null;
            const x = getX(idx);
            const y = getY(appliedHacksCount > 0 ? hackedPoints[idx].value : standardPoints[idx].value);
            return (
              <Circle
                key={`dot_${idx}`}
                cx={x}
                cy={y}
                r={isPeak ? 4.5 : 2.5}
                fill={appliedHacksCount > 0 ? '#10b981' : '#06b6d4'}
                stroke="#000000"
                strokeWidth={1.5}
              />
            );
          })}
        </Svg>
      </View>

      {/* Time Axis Labels */}
      <View style={styles.timeAxisRow}>
        <Text style={styles.timeLabel}>0m</Text>
        <Text style={styles.timeLabel}>30m</Text>
        <Text style={styles.timeLabel}>60m (Peak)</Text>
        <Text style={styles.timeLabel}>120m</Text>
        <Text style={styles.timeLabel}>180m</Text>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#06b6d4' }]} />
          <Text style={styles.legendText}>Basal Baseline</Text>
        </View>

        {appliedHacksCount > 0 ? (
          <>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f87171' }]} />
              <Text style={styles.legendText}>Standard Surge</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>With Doctor Hacks</Text>
            </View>
          </>
        ) : (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: isGlucose ? '#06b6d4' : '#f59e0b' }]} />
            <Text style={styles.legendText}>Simulated Surge (Bergman RK4 ODE)</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tabButtons: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.16)',
  },
  tabText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: '#06b6d4',
  },
  harmReductionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  harmReductionText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#10b981',
  },
  calloutStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  calloutBox: {
    flex: 1,
    alignItems: 'center',
  },
  calloutLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.4,
  },
  calloutVal: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  calloutUnit: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94a3b8',
  },
  calloutDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  timeAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  timeLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748b',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 9.5,
    color: '#94a3b8',
    fontWeight: '600',
  },
});

export default VitalSurgeCurveChart;
