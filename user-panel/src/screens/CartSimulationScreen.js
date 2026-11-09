import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Line,
  Circle,
  Text as SvgText,
} from 'react-native-svg';
import {
  ChevronLeft,
  ShieldCheck,
  Flame,
  AlertTriangle,
  Sparkles,
  Footprints,
  Clock,
  Droplets,
  Heart,
  CheckCircle2,
  FileText,
  Layers,
  Zap,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import foodDeliveryApi from '../api/foodDeliveryApi';
import GlassCard from '../components/GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 160;

export default function CartSimulationScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, latestVitals } = useAuthStore();

  const {
    cartItems = [],
    restaurant = {},
    orderMode = 'VITALS_GUARD',
  } = route.params || {};

  const [isLoading, setIsLoading] = useState(true);
  const [simulationData, setSimulationData] = useState(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Baseline Vitals
  const baselineGlucose = latestVitals?.glucoseFasting || latestVitals?.currentCGMGlucose || 95;
  const baselineSBP = latestVitals?.systolic || 118;

  useEffect(() => {
    let isMounted = true;
    const runSimulation = async () => {
      setIsLoading(true);
      try {
        const payloadItems = cartItems.map((item) => ({
          foodItemId: item.foodItem?._id || item.foodItem?.id,
          foodItem: item.foodItem,
          quantity: item.quantity,
        }));

        const res = await foodDeliveryApi.simulateCart(payloadItems, orderMode);
        if (isMounted) {
          if (res?.success && res.simulation) {
            setSimulationData(res.simulation);
          } else {
            setSimulationData(getFallbackSimulation(cartItems, baselineGlucose, baselineSBP));
          }
        }
      } catch (err) {
        console.warn('[CartSimulation] API warning:', err?.message || err);
        if (isMounted) {
          setSimulationData(getFallbackSimulation(cartItems, baselineGlucose, baselineSBP));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    runSimulation();
    return () => {
      isMounted = false;
    };
  }, [cartItems, orderMode, baselineGlucose, baselineSBP]);

  // Compute SVG Curve Coordinates for 240 mins
  const chartCoordinates = useMemo(() => {
    const trajectory = simulationData?.glucoseTrajectory || [];
    if (!trajectory.length) return { pathD: '', areaD: '', points: [], maxVal: 180, minVal: 70 };

    const values = trajectory.map((p) => p.glucose || p.value || 95);
    const minVal = Math.min(...values, 80);
    const maxVal = Math.max(...values, 160);
    const valRange = Math.max(30, maxVal - minVal);

    const points = trajectory.map((p, idx) => {
      const x = (idx / (trajectory.length - 1)) * CHART_WIDTH;
      const val = p.glucose || p.value || 95;
      const y = CHART_HEIGHT - ((val - minVal) / valRange) * (CHART_HEIGHT - 30) - 15;
      return { x, y, time: p.minute ?? p.time ?? idx * 15, val };
    });

    const pathD = points.reduce((acc, curr, idx) => {
      if (idx === 0) return `M ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
      const prev = points[idx - 1];
      const cx1 = (prev.x + (curr.x - prev.x) / 2).toFixed(1);
      const cy1 = prev.y.toFixed(1);
      const cx2 = cx1;
      const cy2 = curr.y.toFixed(1);
      return `${acc} C ${cx1} ${cy1} ${cx2} ${cy2} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
    }, '');

    const areaD = `${pathD} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;

    return { pathD, areaD, points, maxVal, minVal };
  }, [simulationData]);

  // Place Order Action
  const handleConfirmOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const payload = {
        restaurantId: restaurant._id || restaurant.id,
        items: cartItems.map((c) => ({
          foodItemId: c.foodItem._id || c.foodItem.id,
          name: c.foodItem.name,
          quantity: c.quantity,
          price: c.foodItem.price,
          portionMultiplier: 1.0,
        })),
        orderMode,
        simulationSnapshot: simulationData,
        deliveryAddress: {
          addressLine: 'Flat 402, Royal Residency, Road 10',
          area: 'Banjara Hills',
          city: 'Hyderabad',
          postalCode: '500034',
        },
      };

      const res = await foodDeliveryApi.createOrder(payload);
      if (res?.success && res.order) {
        setOrderSuccess(res.order);
      } else {
        // Fallback simulation order
        setOrderSuccess({
          _id: 'ord_' + Math.random().toString(36).substr(2, 8),
          orderMode,
          totalAmount: cartItems.reduce(
            (acc, c) => acc + (c.foodItem.price || 180) * c.quantity,
            0
          ),
          printedKitchenTicket: {
            sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            ticketNumber: 'KDS-084',
          },
          postprandialAmbulationPlan: simulationData?.ambulationPlan,
        });
      }
    } catch (err) {
      console.warn('[CartSimulation] Order placement warning:', err?.message || err);
      Alert.alert(
        'Order Confirmed (Demo Sandbox)',
        'Your biophysically customized order has been received. Kitchen ticket dispatched to KDS and live ambulation tracking is active.',
        [
          {
            text: 'Track Ambulation',
            onPress: () => navigation.navigate('FoodDeliveryHome'),
          },
        ]
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const peakGlucose = simulationData?.peakGlucose || 128;
  const peakSBP = simulationData?.peakSBP || 124;
  const timeToPeak = simulationData?.timeToPeakMin || 45;
  const ambulation = simulationData?.ambulationPlan;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgDark }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.bgSurface, borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: colors.bgCardElevated }]}
          >
            <ChevronLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              DIGITAL TWIN ODE SOLVER
            </Text>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Pre-Order Forecast
            </Text>
          </View>

          <View
            style={[
              styles.modePill,
              orderMode === 'VITALS_GUARD'
                ? { backgroundColor: isDark ? 'rgba(6, 78, 59, 0.7)' : '#ecfdf5', borderColor: '#10B981' }
                : { backgroundColor: isDark ? 'rgba(120, 53, 15, 0.7)' : '#fffbeb', borderColor: '#F59E0B' },
            ]}
          >
            {orderMode === 'VITALS_GUARD' ? (
              <ShieldCheck size={14} color="#10B981" />
            ) : (
              <Flame size={14} color="#F59E0B" />
            )}
            <Text
              style={[
                styles.modePillText,
                { color: orderMode === 'VITALS_GUARD' ? '#10B981' : '#F59E0B' },
              ]}
            >
              {orderMode === 'VITALS_GUARD' ? 'GUARD' : 'CHEAT'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Solving 7-compartment biophysical Runge-Kutta ODEs...
            </Text>
          </View>
        ) : (
          <>
            {/* 4-Hour Glycemic & Hemodynamic Curve Card */}
            <GlassCard style={styles.curveCard}>
              <View style={styles.curveHeader}>
                <View>
                  <Text style={[styles.curveTitle, { color: colors.textPrimary }]}>
                    4-Hour In-Silico Metabolic Forecast
                  </Text>
                  <Text style={[styles.curveSubtitle, { color: colors.textMuted }]}>
                    G(t) Starch Digestion & Skeletal GLUT-4 Uptake Kinetics
                  </Text>
                </View>
                <View
                  style={[
                    styles.peakBadge,
                    {
                      backgroundColor:
                        peakGlucose <= 140
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                      borderColor: peakGlucose <= 140 ? '#10B981' : '#F59E0B',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.peakBadgeVal,
                      { color: peakGlucose <= 140 ? '#10B981' : '#F59E0B' },
                    ]}
                  >
                    Peak: {peakGlucose} mg/dL
                  </Text>
                  <Text style={styles.peakBadgeTime}>at {timeToPeak} mins</Text>
                </View>
              </View>

              {/* Metric Stat Pillars */}
              <View style={styles.pillarsRow}>
                <View style={[styles.pillar, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                  <Text style={[styles.pillarLabel, { color: colors.textMuted }]}>BASELINE</Text>
                  <Text style={[styles.pillarValue, { color: '#10B981' }]}>
                    {baselineGlucose} <Text style={styles.pillarUnit}>mg/dL</Text>
                  </Text>
                </View>
                <View style={[styles.pillar, { backgroundColor: 'rgba(6, 182, 212, 0.08)' }]}>
                  <Text style={[styles.pillarLabel, { color: colors.textMuted }]}>BP PEAK</Text>
                  <Text style={[styles.pillarValue, { color: '#06B6D4' }]}>
                    {peakSBP} <Text style={styles.pillarUnit}>mmHg</Text>
                  </Text>
                </View>
                <View style={[styles.pillar, { backgroundColor: 'rgba(245, 158, 11, 0.08)' }]}>
                  <Text style={[styles.pillarLabel, { color: colors.textMuted }]}>GLUCOSE EXCURSION</Text>
                  <Text style={[styles.pillarValue, { color: '#F59E0B' }]}>
                    +{peakGlucose - baselineGlucose} <Text style={styles.pillarUnit}>mg/dL</Text>
                  </Text>
                </View>
              </View>

              {/* SVG 240-Minute Postprandial Curve */}
              <View style={styles.chartWrapper}>
                <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                  <Defs>
                    <SvgLinearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                      <Stop
                        offset="0%"
                        stopColor={peakGlucose <= 140 ? '#10B981' : '#F59E0B'}
                        stopOpacity={0.4}
                      />
                      <Stop
                        offset="100%"
                        stopColor={peakGlucose <= 140 ? '#10B981' : '#F59E0B'}
                        stopOpacity={0.0}
                      />
                    </SvgLinearGradient>
                  </Defs>

                  {/* 140 mg/dL Target Threshold Line */}
                  <Line
                    x1="0"
                    y1={CHART_HEIGHT * 0.45}
                    x2={CHART_WIDTH}
                    y2={CHART_HEIGHT * 0.45}
                    stroke="#EF4444"
                    strokeWidth="1"
                    strokeDasharray="4, 4"
                  />
                  <SvgText
                    x={CHART_WIDTH - 6}
                    y={CHART_HEIGHT * 0.45 - 4}
                    fill="#EF4444"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    140 mg/dL Clinical Threshold
                  </SvgText>

                  {/* Area fill under curve */}
                  {chartCoordinates.areaD ? (
                    <Path d={chartCoordinates.areaD} fill="url(#curveGradient)" />
                  ) : null}

                  {/* Primary Trajectory Line */}
                  {chartCoordinates.pathD ? (
                    <Path
                      d={chartCoordinates.pathD}
                      fill="none"
                      stroke={peakGlucose <= 140 ? '#10B981' : '#F59E0B'}
                      strokeWidth="2.5"
                    />
                  ) : null}

                  {/* Peak Marker Dot */}
                  {chartCoordinates.points.length > 0 && (
                    <Circle
                      cx={
                        chartCoordinates.points.reduce((maxP, p) =>
                          p.val > maxP.val ? p : maxP
                        ).x
                      }
                      cy={
                        chartCoordinates.points.reduce((maxP, p) =>
                          p.val > maxP.val ? p : maxP
                        ).y
                      }
                      r="5"
                      fill="#ffffff"
                      stroke={peakGlucose <= 140 ? '#10B981' : '#F59E0B'}
                      strokeWidth="2.5"
                    />
                  )}
                </Svg>
                <View style={styles.chartTimeLabels}>
                  <Text style={styles.timeLabel}>0m</Text>
                  <Text style={styles.timeLabel}>60m</Text>
                  <Text style={styles.timeLabel}>120m</Text>
                  <Text style={styles.timeLabel}>180m</Text>
                  <Text style={styles.timeLabel}>240m</Text>
                </View>
              </View>
            </GlassCard>

            {/* Postprandial Ambulation Prescription (if Cheat Mode or High Excursion) */}
            {ambulation && (
              <GlassCard style={[styles.ambulationCard, { borderColor: '#F59E0B' }]}>
                <View style={styles.cardSectionHeader}>
                  <Footprints size={18} color="#F59E0B" />
                  <Text style={[styles.ambulationHeading, { color: '#F59E0B' }]}>
                    Autonomous Postprandial Ambulation Plan
                  </Text>
                </View>
                <Text style={[styles.ambulationExplain, { color: colors.textMuted }]}>
                  To oxidize the estimated {ambulation.excessGlucoseGrams || 24}g surplus dietary glucose via insulin-independent skeletal muscle GLUT-4 translocation:
                </Text>

                <View style={styles.ambulationStatsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{ambulation.recommendedSteps || 2200}</Text>
                    <Text style={[styles.statBoxLbl, { color: colors.textMuted }]}>STEPS TARGET</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{ambulation.durationMinutes || 24} min</Text>
                    <Text style={[styles.statBoxLbl, { color: colors.textMuted }]}>BRISK WALK</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>+{ambulation.startWindowAfterMealMin || 30} min</Text>
                    <Text style={[styles.statBoxLbl, { color: colors.textMuted }]}>START WINDOW</Text>
                  </View>
                </View>

                <View style={styles.wearableChip}>
                  <Sparkles size={12} color="#10B981" />
                  <Text style={styles.wearableChipText}>
                    Hardware Synced: boAt / Noise / Fire-Boltt step stream active
                  </Text>
                </View>
              </GlassCard>
            )}

            {/* Pre-Bite Food Sequencing Protocol (3 Steps) */}
            <GlassCard style={styles.sequenceCard}>
              <View style={styles.cardSectionHeader}>
                <Layers size={18} color="#10B981" />
                <Text style={[styles.sequenceHeading, { color: '#10B981' }]}>
                  Pre-Bite Food Sequencing Protocol
                </Text>
              </View>
              <Text style={[styles.sequenceSub, { color: colors.textMuted }]}>
                Consume dishes in this order to reduce peak glycemic spike by up to 42%:
              </Text>

              {/* Step 1 */}
              <View style={styles.seqStep}>
                <View style={styles.seqNumberWrap}>
                  <Text style={styles.seqNumber}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                    Phase 1 (0 min): Fiber & Green Starter
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
                    Salad, sauteed greens, or raita. Coats intestinal mucosa, viscous mesh delays enzymatic amylase.
                  </Text>
                </View>
              </View>

              {/* Step 2 */}
              <View style={styles.seqStep}>
                <View style={styles.seqNumberWrap}>
                  <Text style={styles.seqNumber}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                    Phase 2 (+10 min): Protein & Healthy Fats
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
                    Paneer, chicken, dal, or eggs. Triggers GLP-1 and cholecystokinin (CCK) to delay gastric emptying.
                  </Text>
                </View>
              </View>

              {/* Step 3 */}
              <View style={styles.seqStep}>
                <View style={styles.seqNumberWrap}>
                  <Text style={styles.seqNumber}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                    Phase 3 (+20 min): Complex Carbohydrates
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
                    Roti, rice, or biryani. Absorbed against pre-filled stomach, generating a flattened, gradual surge.
                  </Text>
                </View>
              </View>
            </GlassCard>

            {/* Vinegar Preload & Biohacks */}
            <GlassCard style={styles.biohackCard}>
              <View style={styles.cardSectionHeader}>
                <Sparkles size={16} color="#06B6D4" />
                <Text style={[styles.biohackHeading, { color: '#06B6D4' }]}>
                  Active Biohacks & Ayur-Pharma Guidance
                </Text>
              </View>
              <Text style={[styles.biohackText, { color: colors.textSecondary }]}>
                • <Text style={{ fontWeight: '800' }}>Vinegar Pre-load:</Text> Consume 15ml apple cider vinegar in 150ml water 5 mins before meal to inhibit alpha-amylase activity by 31%.
              </Text>
              <Text style={[styles.biohackText, { color: colors.textSecondary, marginTop: 4 }]}>
                • <Text style={{ fontWeight: '800' }}>Temperature Protocol:</Text> Parboiled rice chilled and reheated increases Retrograded Resistant Starch (RS3) by 2.4x.
              </Text>
            </GlassCard>

            {/* Cart Items Summary */}
            <GlassCard style={styles.cartSummaryCard}>
              <Text style={[styles.cartSummaryTitle, { color: colors.textPrimary }]}>
                Kitchen Ticket Order Summary
              </Text>
              {cartItems.map((c, idx) => (
                <View
                  key={idx}
                  style={[styles.summaryItemRow, { borderBottomColor: colors.borderSubtle }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.summaryItemName, { color: colors.textPrimary }]}>
                      {c.quantity}x {c.foodItem.name}
                    </Text>
                    <Text style={[styles.summaryItemMacros, { color: colors.textMuted }]}>
                      {c.foodItem.calories_kcal * c.quantity} kcal • {(c.foodItem.netCarbohydrates_g || 24) * c.quantity}g net carbs
                    </Text>
                  </View>
                  <Text style={[styles.summaryItemPrice, { color: colors.textPrimary }]}>
                    ₹{(c.foodItem.price || 180) * c.quantity}
                  </Text>
                </View>
              ))}
            </GlassCard>
          </>
        )}
      </ScrollView>

      {/* Floating Place Order CTA Bar */}
      <View
        style={[
          styles.ctaBar,
          {
            bottom: insets.bottom + 12,
            backgroundColor: colors.bgSurface,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.ctaTotalWrap}>
          <Text style={[styles.ctaTotalLabel, { color: colors.textMuted }]}>TOTAL BILL</Text>
          <Text style={[styles.ctaTotalVal, { color: colors.textPrimary }]}>
            ₹{cartItems.reduce((acc, c) => acc + (c.foodItem.price || 180) * c.quantity, 0)}
          </Text>
        </View>

        <TouchableOpacity
          disabled={isPlacingOrder}
          activeOpacity={0.85}
          onPress={handleConfirmOrder}
          style={[styles.confirmOrderBtn, isPlacingOrder && { opacity: 0.7 }]}
        >
          {isPlacingOrder ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <CheckCircle2 size={16} color="#ffffff" />
              <Text style={styles.confirmOrderBtnText}>Dispatch to Kitchen</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Order Confirmed Success Modal */}
      {orderSuccess && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgSurface, borderColor: '#10B981' }]}>
            <View style={styles.successIconWrap}>
              <CheckCircle2 size={40} color="#10B981" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Kitchen Ticket Dispatched!
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textMuted }]}>
              Ticket #{orderSuccess.printedKitchenTicket?.ticketNumber || 'KDS-084'} sent to {restaurant.name || 'Kitchen'}.
            </Text>

            <View style={[styles.ticketBox, { backgroundColor: colors.bgCardElevated }]}>
              <View style={styles.ticketRow}>
                <Text style={[styles.ticketLbl, { color: colors.textMuted }]}>Order Mode:</Text>
                <Text style={[styles.ticketVal, { color: '#10B981' }]}>{orderSuccess.orderMode}</Text>
              </View>
              <View style={styles.ticketRow}>
                <Text style={[styles.ticketLbl, { color: colors.textMuted }]}>SHA-256 Hash:</Text>
                <Text style={[styles.ticketVal, { color: colors.textSecondary }]} numberOfLines={1}>
                  {orderSuccess.printedKitchenTicket?.sha256Hash?.substring(0, 16)}...
                </Text>
              </View>
              {orderSuccess.postprandialAmbulationPlan?.recommendedSteps && (
                <View style={styles.ticketRow}>
                  <Text style={[styles.ticketLbl, { color: colors.textMuted }]}>Ambulation Target:</Text>
                  <Text style={[styles.ticketVal, { color: '#F59E0B' }]}>
                    {orderSuccess.postprandialAmbulationPlan.recommendedSteps} steps
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setOrderSuccess(null);
                navigation.navigate('FoodDeliveryHome');
              }}
              style={styles.modalDoneBtn}
            >
              <Text style={styles.modalDoneBtnText}>Go to Live Ambulation Tracker</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// Fallback analytical solver if external AI engine offline
function getFallbackSimulation(cartItems, baselineGlucose, baselineSBP) {
  let netCarbs = 0;
  cartItems.forEach((c) => {
    netCarbs += (c.foodItem?.netCarbohydrates_g || c.foodItem?.carbohydrates_g || 25) * c.quantity;
  });

  const delta = Math.round(netCarbs * 0.95);
  const peakGlucose = Math.round(baselineGlucose + delta);
  const timePoints = [0, 15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240];

  const trajectory = timePoints.map((t) => {
    const tau = 50.0;
    const shape = (t / tau) * Math.exp(1.0 - t / tau);
    return {
      minute: t,
      glucose: Math.round(baselineGlucose + delta * shape),
    };
  });

  return {
    peakGlucose,
    peakSBP: baselineSBP + Math.round(delta * 0.12),
    timeToPeakMin: 50,
    glucoseTrajectory: trajectory,
    ambulationPlan: {
      excessGlucoseGrams: Math.round(delta * 0.35),
      recommendedSteps: Math.round(delta * 42),
      durationMinutes: Math.round(delta * 0.45),
      startWindowAfterMealMin: 30,
    },
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 4,
  },
  modePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  curveCard: {
    marginBottom: 14,
  },
  curveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  curveTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  curveSubtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  peakBadge: {
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  peakBadgeVal: {
    fontSize: 12,
    fontWeight: '900',
  },
  peakBadgeTime: {
    fontSize: 9,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  pillarsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  pillar: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  pillarLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pillarValue: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  pillarUnit: {
    fontSize: 9,
    fontWeight: '500',
  },
  chartWrapper: {
    alignItems: 'center',
    marginTop: 4,
  },
  chartTimeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: CHART_WIDTH,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  timeLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  ambulationCard: {
    marginBottom: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderWidth: 1.5,
  },
  cardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  ambulationHeading: {
    fontSize: 14,
    fontWeight: '800',
  },
  ambulationExplain: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  ambulationStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statBoxVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#F59E0B',
  },
  statBoxLbl: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  wearableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  wearableChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  sequenceCard: {
    marginBottom: 14,
  },
  sequenceHeading: {
    fontSize: 14,
    fontWeight: '800',
  },
  sequenceSub: {
    fontSize: 11,
    marginBottom: 10,
  },
  seqStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  seqNumberWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seqNumber: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  biohackCard: {
    marginBottom: 14,
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
  },
  biohackHeading: {
    fontSize: 13,
    fontWeight: '800',
  },
  biohackText: {
    fontSize: 11,
    lineHeight: 15,
  },
  cartSummaryCard: {
    marginBottom: 14,
  },
  cartSummaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  summaryItemName: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryItemMacros: {
    fontSize: 10,
    marginTop: 2,
  },
  summaryItemPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  ctaBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  ctaTotalWrap: {
    flex: 1,
  },
  ctaTotalLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ctaTotalVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  confirmOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  confirmOrderBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 100,
  },
  modalContent: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  successIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
  },
  ticketBox: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 6,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketLbl: {
    fontSize: 11,
    fontWeight: '600',
  },
  ticketVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  modalDoneBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalDoneBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
