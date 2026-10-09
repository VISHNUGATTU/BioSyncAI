import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Wind,
  Activity,
  Flame,
  Camera,
  Calendar,
  Clock,
  ChevronRight,
  ChevronDown,
  Bell,
  RefreshCw,
  FileText,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  Droplets,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Sliders,
} from 'lucide-react-native';
import { useTheme } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import { useUserAppointmentStore } from '../store/userAppointmentStore';
import userApi from '../api/userApi';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import CollectionOtpCard from '../components/CollectionOtpCard';
import AssignedStaffCard from '../components/AssignedStaffCard';
import ReportViewerModal from '../components/ReportViewerModal';
import NotificationModal from '../components/NotificationModal';
import WeeklyKalmanCalibrationModal from '../components/WeeklyKalmanCalibrationModal';
import LiveIoTWatchSyncCard from '../components/LiveIoTWatchSyncCard';

export const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, latestVitals, hasVitals, fetchVitals } = useAuthStore();
  const {
    appointments,
    activeAppointment,
    fetchAppointments,
    fetchTestCatalog,
  } = useUserAppointmentStore();

  const [refreshing, setRefreshing] = useState(false);
  const [recentMeal, setRecentMeal] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [selectedReportAppt, setSelectedReportAppt] = useState(null);
  const [showKalmanModal, setShowKalmanModal] = useState(false);
  const [showAdvancedData, setShowAdvancedData] = useState(false);

  // Smooth UI animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 550,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for live status dot
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.35,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, []);

  // Fetch recent food log
  const fetchRecentFood = async () => {
    try {
      const res = await userApi.getFoodHistory();
      const list = res.data || res.foodLogs || [];
      if (res.success && Array.isArray(list) && list.length > 0) {
        setRecentMeal(list[0]);
      } else {
        setRecentMeal(null);
      }
    } catch (e) {
      setRecentMeal(null);
    }
  };

  // Real-time notifications count
  const fetchUnreadNotifications = async () => {
    try {
      const res = await userApi.getNotifications({ unreadOnly: true });
      if (res && typeof res.unreadCount === 'number') {
        setUnreadNotifCount(res.unreadCount);
      } else if (res && Array.isArray(res.data)) {
        setUnreadNotifCount(res.data.filter((n) => !n.isRead).length);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchAppointments();
    fetchTestCatalog();
    fetchVitals();
    fetchRecentFood();
    fetchUnreadNotifications();
  }, []);

  // Sync background polling every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAppointments(true);
      fetchUnreadNotifications();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchAppointments(false),
      fetchTestCatalog(),
      fetchVitals(),
      fetchRecentFood(),
      fetchUnreadNotifications(),
    ]);
    setRefreshing(false);
  }, []);

  const vitalsPresent = hasVitals();

  // Core metrics
  const heartRate =
    latestVitals?.continuousMetrics?.restingHeartRate || (vitalsPresent ? 72 : 72);
  const systolic =
    latestVitals?.cardiovascularRisk?.systolic || (vitalsPresent ? 118 : 120);
  const diastolic =
    latestVitals?.cardiovascularRisk?.diastolic || (vitalsPresent ? 76 : 80);
  const glucose =
    latestVitals?.metabolicHealth?.glucoseFasting || (vitalsPresent ? 92 : 95);
  const spO2 =
    latestVitals?.continuousMetrics?.oxygenSaturationSpO2 || (vitalsPresent ? 99 : 98);

  // Digital twin calibrations
  const betaCarb = latestVitals?.kalmanCalibration?.betaCarb || 0.28;
  const betaSodium = latestVitals?.kalmanCalibration?.betaSodium || 0.007;
  const insulinSensitivity = latestVitals?.kalmanCalibration?.insulinSensitivity || 0.72;

  // Completed appointment with ready report
  const completedWithReport = (appointments || []).find(
    (a) =>
      a.status === 'Completed' ||
      a.status === 'Report_Generated' ||
      (a.sample && a.sample.resultsDone)
  );

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userName =
    user?.name?.split(' ')[0] || user?.firstName || 'Patient';

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.bgDark }]}>
      {/* Sleek Top Navigation Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.bgDark, borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <View style={styles.liveBadgeRow}>
              <Animated.View
                style={[
                  styles.liveDot,
                  {
                    transform: [{ scale: pulseAnim }],
                    backgroundColor: colors.emeraldLight,
                  },
                ]}
              />
              <Text style={styles.liveBadgeText}>BIO-SYNC LIVE</Text>
            </View>
            <Text style={[styles.greetingTitle, { color: colors.textPrimary }]}>
              {getGreeting()}, <Text style={{ color: colors.primary }}>{userName}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
            onPress={() => setShowNotifications(true)}
            activeOpacity={0.7}
          >
            <Bell size={18} color={colors.textPrimary} />
            {unreadNotifCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <RefreshCw size={17} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* ========================================================= */}
          {/* 1. HERO CARD (Clean Context-Aware Presentation)          */}
          {/* ========================================================= */}

          {activeAppointment ? (
            /* Active Home Visit Card */
            <GlassCard style={styles.heroCard}>
              <LinearGradient
                colors={['rgba(6, 182, 212, 0.16)', 'rgba(6, 182, 212, 0.03)']}
                style={styles.heroGradient}
              >
                <View style={styles.heroTopRow}>
                  <View style={styles.heroTag}>
                    <Clock size={12} color={colors.cyan} />
                    <Text style={styles.heroTagText}>ACTIVE HOME VISIT</Text>
                  </View>
                  <StatusBadge status={activeAppointment.status} />
                </View>

                <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
                  {activeAppointment.testCatalog?.testName || 'Diagnostic Blood Panel'}
                </Text>
                <Text style={styles.heroSub}>
                  Scheduled for {activeAppointment.timeSlot || 'Today'} • Sample Collection
                </Text>

                {/* Clean 4-Stage Progress Line */}
                <View style={styles.simpleTracker}>
                  <View style={styles.simpleTrackerTrack}>
                    <View
                      style={[
                        styles.simpleTrackerFill,
                        {
                          width:
                            ['Completed', 'Report_Generated'].includes(activeAppointment.status)
                              ? '100%'
                              : ['Sample_Collected', 'At_Laboratory', 'Processing'].includes(activeAppointment.status)
                              ? '75%'
                              : ['Arrived', 'Collecting'].includes(activeAppointment.status)
                              ? '50%'
                              : ['On_The_Way', 'On_Route', 'Assistant_Assigned', 'Assigned'].includes(activeAppointment.status)
                              ? '25%'
                              : '10%',
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.trackerLabelsRow}>
                    <Text style={styles.trackerLabel}>Booked</Text>
                    <Text style={styles.trackerLabel}>En Route</Text>
                    <Text style={styles.trackerLabel}>Collected</Text>
                    <Text style={styles.trackerLabel}>Report</Text>
                  </View>
                </View>

                {/* Action button */}
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate('AppointmentsList')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryActionBtnText}>MANAGE VISIT & DETAILS</Text>
                  <ChevronRight size={16} color="#000000" />
                </TouchableOpacity>

                {/* Handshake OTP if arrived */}
                {['Arrived', 'Collecting'].includes(activeAppointment.status) && (
                  <View style={{ marginTop: 12 }}>
                    <CollectionOtpCard appointment={activeAppointment} />
                  </View>
                )}
              </LinearGradient>
            </GlassCard>
          ) : completedWithReport ? (
            /* Diagnostic Report Available Card */
            <GlassCard style={styles.heroCard}>
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.16)', 'rgba(16, 185, 129, 0.03)']}
                style={styles.heroGradient}
              >
                <View style={styles.heroTopRow}>
                  <View style={[styles.heroTag, { backgroundColor: 'rgba(16, 185, 129, 0.18)' }]}>
                    <CheckCircle2 size={12} color={colors.emeraldLight} />
                    <Text style={[styles.heroTagText, { color: colors.emeraldLight }]}>RESULTS VERIFIED</Text>
                  </View>
                  <View style={styles.reportBadgePill}>
                    <Text style={styles.reportBadgePillText}>NABL CERTIFIED</Text>
                  </View>
                </View>

                <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
                  {completedWithReport.testCatalog?.testName || 'Comprehensive Health Report'}
                </Text>
                <Text style={styles.heroSub}>
                  Your lab results are ready with AI biomarker insights.
                </Text>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: colors.emeraldLight }]}
                  onPress={() => setSelectedReportAppt(completedWithReport)}
                  activeOpacity={0.85}
                >
                  <FileText size={16} color="#000000" />
                  <Text style={styles.primaryActionBtnText}>VIEW DIAGNOSTIC REPORT</Text>
                </TouchableOpacity>
              </LinearGradient>
            </GlassCard>
          ) : (
            /* Standard Day: Clean Metabolic Health Score Card */
            <GlassCard style={styles.heroCard}>
              <LinearGradient
                colors={['rgba(6, 182, 212, 0.14)', 'rgba(16, 185, 129, 0.06)']}
                style={styles.heroGradient}
              >
                <View style={styles.scoreHeroRow}>
                  <View style={styles.scoreTextCol}>
                    <View style={styles.heroTag}>
                      <Sparkles size={12} color={colors.cyan} />
                      <Text style={styles.heroTagText}>METABOLIC BALANCE</Text>
                    </View>
                    <Text style={[styles.heroScoreHeading, { color: colors.textPrimary }]}>
                      Optimal Stability
                    </Text>
                    <Text style={styles.heroScoreSub}>
                      All core biomarkers are aligned with resting physiological baseline.
                    </Text>
                  </View>

                  <View style={styles.scoreBadgeBox}>
                    <Text style={styles.scoreNumber}>94</Text>
                    <Text style={styles.scoreUnit}>/100</Text>
                    <Text style={styles.scoreLabel}>Health Score</Text>
                  </View>
                </View>

                <View style={styles.scorePillsRow}>
                  <View style={styles.statusPill}>
                    <View style={[styles.miniDot, { backgroundColor: colors.emeraldLight }]} />
                    <Text style={styles.statusPillText}>Heart Optimal</Text>
                  </View>
                  <View style={styles.statusPill}>
                    <View style={[styles.miniDot, { backgroundColor: colors.emeraldLight }]} />
                    <Text style={styles.statusPillText}>Glucose Stable</Text>
                  </View>
                  <View style={styles.statusPill}>
                    <View style={[styles.miniDot, { backgroundColor: colors.emeraldLight }]} />
                    <Text style={styles.statusPillText}>BP In Range</Text>
                  </View>
                </View>
              </LinearGradient>
            </GlassCard>
          )}

          {/* ========================================================= */}
          {/* 2. CORE VITALS AT A GLANCE (Airy 2x2 Clean Grid)         */}
          {/* ========================================================= */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Vitals Overview</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Analysis')}
              style={styles.sectionAction}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionActionText}>View Charts</Text>
              <ChevronRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.vitalsGrid}>
            {/* Heart Rate */}
            <TouchableOpacity
              style={[styles.vitalCard, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
              onPress={() => navigation.navigate('Analysis')}
              activeOpacity={0.8}
            >
              <View style={styles.vitalCardHeader}>
                <View style={[styles.vitalIconWrap, { backgroundColor: 'rgba(244, 63, 94, 0.14)' }]}>
                  <Heart size={18} color="#f43f5e" />
                </View>
                <View style={[styles.vitalBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Text style={[styles.vitalBadgeText, { color: colors.emeraldLight }]}>Normal</Text>
                </View>
              </View>
              <Text style={[styles.vitalValue, { color: colors.textPrimary }]}>
                {heartRate} <Text style={styles.vitalUnit}>BPM</Text>
              </Text>
              <Text style={styles.vitalLabel}>Resting Heartbeat</Text>
            </TouchableOpacity>

            {/* Blood Pressure */}
            <TouchableOpacity
              style={[styles.vitalCard, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
              onPress={() => navigation.navigate('Analysis')}
              activeOpacity={0.8}
            >
              <View style={styles.vitalCardHeader}>
                <View style={[styles.vitalIconWrap, { backgroundColor: 'rgba(6, 182, 212, 0.14)' }]}>
                  <Activity size={18} color={colors.cyan} />
                </View>
                <View style={[styles.vitalBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Text style={[styles.vitalBadgeText, { color: colors.emeraldLight }]}>Optimal</Text>
                </View>
              </View>
              <Text style={[styles.vitalValue, { color: colors.textPrimary }]}>
                {systolic}/{diastolic} <Text style={styles.vitalUnit}>mmHg</Text>
              </Text>
              <Text style={styles.vitalLabel}>Blood Pressure</Text>
            </TouchableOpacity>

            {/* Glucose */}
            <TouchableOpacity
              style={[styles.vitalCard, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
              onPress={() => navigation.navigate('Analysis')}
              activeOpacity={0.8}
            >
              <View style={styles.vitalCardHeader}>
                <View style={[styles.vitalIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.14)' }]}>
                  <Droplets size={18} color="#fbbf24" />
                </View>
                <View style={[styles.vitalBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Text style={[styles.vitalBadgeText, { color: colors.emeraldLight }]}>In Range</Text>
                </View>
              </View>
              <Text style={[styles.vitalValue, { color: colors.textPrimary }]}>
                {glucose} <Text style={styles.vitalUnit}>mg/dL</Text>
              </Text>
              <Text style={styles.vitalLabel}>Fasting Glucose</Text>
            </TouchableOpacity>

            {/* Oxygen SpO2 */}
            <TouchableOpacity
              style={[styles.vitalCard, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
              onPress={() => navigation.navigate('Analysis')}
              activeOpacity={0.8}
            >
              <View style={styles.vitalCardHeader}>
                <View style={[styles.vitalIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.14)' }]}>
                  <Wind size={18} color={colors.emeraldLight} />
                </View>
                <View style={[styles.vitalBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Text style={[styles.vitalBadgeText, { color: colors.emeraldLight }]}>Stable</Text>
                </View>
              </View>
              <Text style={[styles.vitalValue, { color: colors.textPrimary }]}>
                {spO2} <Text style={styles.vitalUnit}>%</Text>
              </Text>
              <Text style={styles.vitalLabel}>Blood Oxygen</Text>
            </TouchableOpacity>
          </View>

          {/* ========================================================= */}
          {/* 3. QUICK ACTION BAR (4 Sleek Pill Buttons)                */}
          {/* ========================================================= */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
              onPress={() => navigation.navigate('Scan')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(6, 182, 212, 0.16)' }]}>
                <Camera size={20} color={colors.cyan} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Scan Meal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
              onPress={() => navigation.navigate('BookAppointment')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.16)' }]}>
                <Calendar size={20} color={colors.emeraldLight} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Book Test</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
              onPress={() => navigation.navigate('AppointmentsList')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.16)' }]}>
                <Clock size={20} color="#fbbf24" />
              </View>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>My Visits</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
              onPress={() => navigation.navigate('Analysis')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(139, 92, 246, 0.16)' }]}>
                <TrendingUp size={20} color="#a78bfa" />
              </View>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Analytics</Text>
            </TouchableOpacity>
          </View>

          {/* ========================================================= */}
          {/* 4. RECENT NUTRITION LOG (Minimal Clean Card)             */}
          {/* ========================================================= */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Latest Meal</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('History')}
              style={styles.sectionAction}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionActionText}>Food Log</Text>
              <ChevronRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {recentMeal ? (
            <GlassCard style={styles.mealCard}>
              <View style={styles.mealTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.mealTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {recentMeal.recognizedItemName || recentMeal.foodItem || recentMeal.mealDescription || 'Healthy Meal'}
                  </Text>
                  <Text style={styles.mealTime}>
                    {new Date(recentMeal.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                <View style={styles.calorieBadge}>
                  <Flame size={14} color="#f97316" />
                  <Text style={styles.calorieText}>
                    {recentMeal.nutrients?.calories || recentMeal.nutritionalValues?.calories || '380'} kcal
                  </Text>
                </View>
              </View>

              <View style={styles.macrosRow}>
                <View style={styles.macroPill}>
                  <Text style={styles.macroPillLabel}>Carbs</Text>
                  <Text style={[styles.macroPillValue, { color: colors.textPrimary }]}>
                    {recentMeal.nutrients?.carbohydrates ?? recentMeal.nutritionalValues?.carbsGrams ?? '42'}g
                  </Text>
                </View>
                <View style={styles.macroPill}>
                  <Text style={styles.macroPillLabel}>Protein</Text>
                  <Text style={[styles.macroPillValue, { color: colors.textPrimary }]}>
                    {recentMeal.nutrients?.proteins ?? recentMeal.nutritionalValues?.proteinGrams ?? '28'}g
                  </Text>
                </View>
                <View style={styles.macroPill}>
                  <Text style={styles.macroPillLabel}>Fat</Text>
                  <Text style={[styles.macroPillValue, { color: colors.textPrimary }]}>
                    {recentMeal.nutrients?.fats ?? recentMeal.nutritionalValues?.fatGrams ?? '14'}g
                  </Text>
                </View>
              </View>

              <View style={styles.mealVerdictRow}>
                <View style={[styles.miniDot, { backgroundColor: colors.emeraldLight }]} />
                <Text style={styles.mealVerdictText}>
                  {recentMeal.predictedImpact?.glucoseSpike != null
                    ? `Estimated Glucose Surge: +${recentMeal.predictedImpact.glucoseSpike} mg/dL`
                    : 'Optimal nutrient balance for resting metabolism'}
                </Text>
              </View>
            </GlassCard>
          ) : (
            <GlassCard style={styles.emptyMealCard}>
              <View style={styles.emptyMealRow}>
                <View style={styles.emptyMealIconWrap}>
                  <Camera size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.emptyMealTitle, { color: colors.textPrimary }]}>No Meal Logged Today</Text>
                  <Text style={styles.emptyMealSub}>Scan food to predict your glucose response.</Text>
                </View>
                <TouchableOpacity
                  style={[styles.emptyScanBtn, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate('Scan')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyScanBtnText}>Scan</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          )}

          {/* ========================================================= */}
          {/* 5. LIVE BIOMETRIC IOT TELEMETRY (Clean Minimal Watch)    */}
          {/* ========================================================= */}
          <View style={{ marginTop: 6, marginBottom: 8 }}>
            <LiveIoTWatchSyncCard baseVitals={latestVitals} />
          </View>

          {/* ========================================================= */}
          {/* 6. ADVANCED CLINICAL INSIGHTS (Collapsible Accordion)    */}
          {/* ========================================================= */}
          <TouchableOpacity
            style={[styles.advancedToggle, { borderColor: colors.borderSubtle }]}
            onPress={() => setShowAdvancedData(!showAdvancedData)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Sliders size={15} color={colors.textSecondary} />
              <Text style={[styles.advancedToggleText, { color: colors.textSecondary }]}>
                Advanced Metabolic Parameters
              </Text>
            </View>
            <ChevronDown
              size={16}
              color={colors.textSecondary}
              style={{ transform: [{ rotate: showAdvancedData ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {showAdvancedData && (
            <GlassCard style={styles.advancedCard}>
              <View style={styles.advancedGrid}>
                <View style={styles.advancedMetric}>
                  <Text style={styles.advancedMetricLabel}>Carb Factor (β_carb)</Text>
                  <Text style={[styles.advancedMetricVal, { color: colors.textPrimary }]}>
                    {betaCarb.toFixed(3)}
                  </Text>
                  <Text style={styles.advancedMetricUnit}>mg/dL per g carb</Text>
                </View>

                <View style={styles.advancedMetric}>
                  <Text style={styles.advancedMetricLabel}>Sodium Factor (β_na)</Text>
                  <Text style={[styles.advancedMetricVal, { color: colors.textPrimary }]}>
                    {betaSodium.toFixed(4)}
                  </Text>
                  <Text style={styles.advancedMetricUnit}>mmHg per mg Na</Text>
                </View>

                <View style={styles.advancedMetric}>
                  <Text style={styles.advancedMetricLabel}>Insulin Sensitivity</Text>
                  <Text style={[styles.advancedMetricVal, { color: colors.textPrimary }]}>
                    {insulinSensitivity.toFixed(3)}
                  </Text>
                  <Text style={styles.advancedMetricUnit}>Adaptive Quicki</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.recalibrateBtn, { borderColor: colors.primary }]}
                onPress={() => setShowKalmanModal(true)}
                activeOpacity={0.75}
              >
                <RotateCcw size={14} color={colors.primary} />
                <Text style={[styles.recalibrateBtnText, { color: colors.primary }]}>
                  Weekly Lab Calibration
                </Text>
              </TouchableOpacity>
            </GlassCard>
          )}

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>

      {/* Modals */}
      <NotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <ReportViewerModal
        visible={!!selectedReportAppt}
        appointment={selectedReportAppt}
        onClose={() => setSelectedReportAppt(null)}
      />

      <WeeklyKalmanCalibrationModal
        visible={showKalmanModal}
        onClose={() => setShowKalmanModal(false)}
        latestVitals={latestVitals}
        onCalibrationComplete={() => {
          fetchVitals();
          setShowKalmanModal(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#06b6d4',
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.6,
  },
  greetingTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#f43f5e',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 30,
  },

  /* Hero Card Styles */
  heroCard: {
    borderRadius: 22,
    marginBottom: 20,
    padding: 0,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 18,
    borderRadius: 22,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(6, 182, 212, 0.16)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#06b6d4',
    letterSpacing: 0.5,
  },
  reportBadgePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reportBadgePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 14,
    lineHeight: 17,
  },
  simpleTracker: {
    marginBottom: 16,
  },
  simpleTrackerTrack: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  simpleTrackerFill: {
    height: '100%',
    backgroundColor: '#06b6d4',
    borderRadius: 3,
  },
  trackerLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.3,
  },

  /* Metabolic Balance Hero */
  scoreHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scoreTextCol: {
    flex: 1,
    paddingRight: 14,
  },
  heroScoreHeading: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 4,
  },
  heroScoreSub: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  scoreBadgeBox: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#06b6d4',
    lineHeight: 28,
  },
  scoreUnit: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  scorePillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  miniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cbd5e1',
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 6,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sectionActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#06b6d4',
  },

  /* 2x2 Vitals Grid */
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  vitalCard: {
    width: '48.5%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  vitalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  vitalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vitalBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  vitalValue: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 2,
  },
  vitalUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  vitalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },

  /* Quick Actions Bar */
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  quickActionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  /* Meal Card */
  mealCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  mealTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mealTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  mealTime: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  calorieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  calorieText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f97316',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  macroPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  macroPillLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  macroPillValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  mealVerdictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  mealVerdictText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },

  /* Empty Meal Card */
  emptyMealCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  emptyMealRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyMealIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMealTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyMealSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  emptyScanBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  emptyScanBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },

  /* Advanced Toggle */
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  advancedToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  advancedCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  advancedGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  advancedMetric: {
    alignItems: 'center',
  },
  advancedMetricLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '700',
  },
  advancedMetricVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 3,
  },
  advancedMetricUnit: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 1,
  },
  recalibrateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  recalibrateBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
});

export default HomeScreen;
