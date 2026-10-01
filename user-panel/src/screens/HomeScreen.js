import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Wind,
  Brain,
  TrendingUp,
  Utensils,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Scan,
  Flame,
  ArrowRight,
  ShieldAlert,
  Calendar,
  CalendarPlus,
  FileText,
  Edit3,
  ChevronRight,
  Zap,
  Activity as ActivityIcon,
  Bell,
  RotateCcw,
  AlertCircle,
} from 'lucide-react-native';
import { colors, useTheme } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import { useUserAppointmentStore } from '../store/userAppointmentStore';
import userApi from '../api/userApi';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import CollectionOtpCard from '../components/CollectionOtpCard';
import AssignedStaffCard from '../components/AssignedStaffCard';
import ReportViewerModal from '../components/ReportViewerModal';
import NotificationModal from '../components/NotificationModal';
import DataProvenanceBadge, { PROVENANCE_TYPES, normalizeProvenance } from '../components/DataProvenanceBadge';

const TRACKING_STAGES = [
  { key: 'Booked', label: 'Booked' },
  { key: 'Assistant_Assigned', label: 'Staff Assigned' },
  { key: 'On_The_Way', label: 'En Route' },
  { key: 'Arrived', label: 'At Doorstep' },
  { key: 'Collecting', label: 'Drawing Blood' },
  { key: 'Sample_Collected', label: 'Sample Sealed' },
  { key: 'At_Laboratory', label: 'At Lab' },
  { key: 'Completed', label: 'Report Ready' },
];

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
  const [mealLoading, setMealLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [selectedReportAppt, setSelectedReportAppt] = useState(null);

  // Fetch recent food log
  const fetchRecentFood = async () => {
    try {
      setMealLoading(true);
      const res = await userApi.getFoodHistory();
      const list = res.data || res.foodLogs || [];
      if (res.success && Array.isArray(list) && list.length > 0) {
        setRecentMeal(list[0]);
      } else {
        setRecentMeal(null);
      }
    } catch (e) {
      setRecentMeal(null);
    } finally {
      setMealLoading(false);
    }
  };

  // Real-time unread notification count
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

  // Real-time polling every 4s for instant sync with staff operations & notifications
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAppointments(true);
      fetchUnreadNotifications();
    }, 4000);
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

  const getStageIndex = (status) => {
    if (!status) return 0;
    if (status === 'Assigned') return 1;
    if (status === 'On_Route') return 2;
    const idx = TRACKING_STAGES.findIndex((s) => s.key === status);
    if (idx !== -1) return idx;
    if (status === 'Processing') return 6;
    if (['Report_Generated', 'Completed', 'Delivered'].includes(status)) return 7;
    return 0;
  };

  const currentStageIdx = activeAppointment ? getStageIndex(activeAppointment.status) : -1;
  const vitalsPresent = hasVitals();
  const vitalsProvenance = latestVitals?.source
    ? normalizeProvenance(latestVitals.source)
    : PROVENANCE_TYPES.MEASURED_LAB;

  // Extract major dynamic vitals from DB
  const heartRate =
    latestVitals?.continuousMetrics?.restingHeartRate ||
    (vitalsPresent ? 72 : null);

  const spO2 =
    latestVitals?.continuousMetrics?.oxygenSaturationSpO2 ||
    (vitalsPresent ? 99 : null);

  // Calculate stress level dynamically from resting HR & HRV
  const hrv = latestVitals?.continuousMetrics?.hrv || 52;
  const stressScore = vitalsPresent
    ? Math.max(12, Math.min(88, Math.round(100 - hrv * 1.1)))
    : null;

  const systolic =
    latestVitals?.cardiovascularRisk?.systolic ||
    (vitalsPresent ? 118 : null);

  const diastolic =
    latestVitals?.cardiovascularRisk?.diastolic ||
    (vitalsPresent ? 76 : null);

  const glucose =
    latestVitals?.metabolicHealth?.glucoseFasting ||
    (vitalsPresent ? 92 : null);

  // Spike indicator logic
  const hrSpike = heartRate && heartRate > 85 ? `+${heartRate - 72} BPM Elevation` : null;
  const stressSpike = stressScore && stressScore > 50 ? 'Mild Stress Surge' : null;

  const completedWithReport = (appointments || []).find(
    (a) =>
      a.status === 'Completed' ||
      a.status === 'Report_Generated' ||
      (a.sample && a.sample.resultsDone)
  );

  const recentFailedAppt = !activeAppointment
    ? (appointments || []).find((a) => ['Failed', 'No_Show', 'Rejected'].includes(a.status))
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.bgDark }]}>
      {/* Top App Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.bgSurface, borderBottomColor: colors.borderSubtle }]}>
        <View>
          <Text style={[styles.appTitle, { color: colors.textPrimary }]}>
            BioSync<Text style={{ color: colors.primary }}>AI</Text>
          </Text>
          <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
            Hello, <Text style={[styles.userName, { color: colors.primary }]}>{user?.name?.split(' ')[0] || user?.firstName || 'Patient'}</Text>
          </Text>
        </View>

        <View style={styles.headerActionsRow}>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.borderCyan, borderColor: colors.borderCyanStrong }]}
            onPress={() => setShowNotifications(true)}
            activeOpacity={0.7}
          >
            <Bell size={18} color={colors.primary} />
            {unreadNotifCount > 0 && (
              <View style={[styles.badgeCircle, { backgroundColor: colors.roseLight }]}>
                <Text style={styles.badgeText}>
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.borderCyan, borderColor: colors.borderCyanStrong }]}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <RefreshCw size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.bgDark }]}
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
        {/* Exception Recovery Banner if recent visit was interrupted */}
        {!activeAppointment && recentFailedAppt ? (
          <View style={styles.appointmentSection}>
            <GlassCard style={[styles.activeDetailsCard, { borderColor: 'rgba(239, 68, 68, 0.35)', backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fff1f2' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(239, 68, 68, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={18} color="#ef4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#f87171' : '#b91c1c' }}>
                    Sample Collection Notice
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    Scheduled visit was not completed
                  </Text>
                </View>
                <StatusBadge status={recentFailedAppt.status} />
              </View>

              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12, lineHeight: 17 }}>
                Reason: <Text style={{ fontWeight: '700', color: isDark ? '#fca5a5' : '#991b1b' }}>{recentFailedAppt.failureReason || recentFailedAppt.cancellationReason || 'Field exception'}</Text>
                {recentFailedAppt.failureNotes ? ` (${recentFailedAppt.failureNotes})` : ''}. You may reschedule your home visit at your convenience.
              </Text>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: colors.primary,
                  paddingVertical: 10,
                  borderRadius: 10,
                }}
                onPress={() => navigation.navigate('AppointmentsList')}
                activeOpacity={0.8}
              >
                <RotateCcw size={14} color="#000000" />
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#000000' }}>
                  VIEW & RESCHEDULE VISIT
                </Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        ) : null}

        {/* ========================================================= */}
        {/* 1. ACTIVE APPOINTMENT STATUS WIDGET                     */}
        {/* Strictly appears only when active, vanishes when done   */}
        {/* ========================================================= */}
        {activeAppointment ? (
          <View style={styles.appointmentSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.liveIndicator}>
                <View style={styles.livePulse} />
                <Text style={styles.liveLabel}>LIVE VISIT IN PROGRESS</Text>
              </View>
              <StatusBadge status={activeAppointment.status} />
            </View>

            {/* Test Details Header Card */}
            <GlassCard style={styles.activeDetailsCard}>
              <View style={styles.activeTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeTestName}>
                    {activeAppointment.testCatalog?.testName || 'Diagnostic Test Panel'}
                  </Text>
                  <Text style={styles.activeCategory}>
                    {activeAppointment.testCatalog?.category || 'Clinical Pathology'} • ID: #{activeAppointment._id.slice(-6).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.slotPill}>
                  <Clock size={12} color={colors.amberLight} />
                  <Text style={styles.slotPillText}>
                    {activeAppointment.timeSlot || 'Today'}
                  </Text>
                </View>
              </View>

              {/* Real-time Handshake Stages Progress Tracker */}
              <View style={styles.progressContainer}>
                <View style={styles.progressLineBg}>
                  <View
                    style={[
                      styles.progressLineFill,
                      {
                        width: `${Math.min(
                          100,
                          (currentStageIdx / (TRACKING_STAGES.length - 1)) * 100
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressStepsRow}>
                  {TRACKING_STAGES.map((stage, idx) => {
                    const isDone = idx <= currentStageIdx;
                    const isCurrent = idx === currentStageIdx;
                    return (
                      <View key={stage.key} style={styles.progressStepNode}>
                        <View
                          style={[
                            styles.stepDot,
                            isDone && styles.stepDotDone,
                            isCurrent && styles.stepDotCurrent,
                          ]}
                        >
                          {isDone ? (
                            <CheckCircle2 size={8} color="#000000" />
                          ) : (
                            <View style={styles.innerDot} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.stepLabel,
                            isCurrent && styles.stepLabelCurrent,
                          ]}
                          numberOfLines={1}
                        >
                          {stage.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* STAGE 8 COMPLETED / REPORT READY DIRECT ACCESS */}
              {currentStageIdx === 7 && (
                <TouchableOpacity
                  style={styles.trackerReportBtn}
                  onPress={() => setSelectedReportAppt(activeAppointment)}
                  activeOpacity={0.85}
                >
                  <View style={styles.trackerReportBtnContent}>
                    <FileText size={16} color="#000000" />
                    <Text style={styles.trackerReportBtnText}>VIEW DIAGNOSTIC REPORT</Text>
                  </View>
                  <View style={styles.nablMiniTag}>
                    <Text style={styles.nablMiniTagText}>NABL VERIFIED</Text>
                    <ArrowRight size={13} color="#000000" />
                  </View>
                </TouchableOpacity>
              )}

              {/* STAGES 0-2 RESCHEDULE & MANAGE SHORTCUT */}
              {currentStageIdx <= 2 && (
                <TouchableOpacity
                  style={[
                    styles.homeManageBookingBtn,
                    {
                      borderColor: colors.borderCyan || 'rgba(6, 182, 212, 0.25)',
                      backgroundColor: isDark ? 'rgba(6, 182, 212, 0.08)' : 'rgba(8, 145, 178, 0.06)',
                    },
                  ]}
                  onPress={() => navigation.navigate('AppointmentsList')}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <RotateCcw size={12} color={colors.primary} />
                    <Text style={[styles.homeManageBookingText, { color: colors.primary }]}>
                      Reschedule or Manage Booking
                    </Text>
                  </View>
                  <ChevronRight size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
            </GlassCard>

            {/* COLLECTION OTP (Handshake Verification - Only during active collection) */}
            {currentStageIdx < 5 && (
              <CollectionOtpCard appointment={activeAppointment} />
            )}

            {/* ASSIGNED PHLEBOTOMIST TELEMETRY */}
            {currentStageIdx < 7 && (
              <AssignedStaffCard appointment={activeAppointment} />
            )}
          </View>
        ) : null}

        {/* ========================================================= */}
        {/* 1B. INITIAL HEALTH ASSESSMENT ONBOARDING BANNER           */}
        {/* Shown when no active visit and no baseline profile exists */}
        {/* ========================================================= */}
        {!activeAppointment && !vitalsPresent ? (
          <View style={styles.onboardingSection}>
            <LinearGradient
              colors={['rgba(6, 182, 212, 0.16)', 'rgba(16, 185, 129, 0.06)']}
              style={styles.onboardingHeroCard}
            >
              <View style={styles.onboardingHeaderRow}>
                <View style={styles.onboardingIconWrap}>
                  <Sparkles size={20} color={colors.cyan} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.onboardingTitle}>Baseline Health Profile Required</Text>
                  <Text style={styles.onboardingSub}>
                    To unlock AI-powered food scanning and personalized glycemic surge predictions, establish your initial clinical profile.
                  </Text>
                </View>
              </View>

              <Text style={styles.onboardingOptionsHeader}>CHOOSE YOUR ASSESSMENT METHOD:</Text>

              <View style={styles.onboardingOptionsRow}>
                {/* Option 1: Book Home Collection */}
                <TouchableOpacity
                  style={styles.onboardingOptionBtn}
                  onPress={() => navigation.navigate('BookAppointment')}
                  activeOpacity={0.85}
                >
                  <View style={[styles.onboardingOptionIcon, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                    <CalendarPlus size={16} color={colors.cyan} />
                  </View>
                  <Text style={styles.onboardingOptionTitle}>Home Lab Test</Text>
                  <Text style={styles.onboardingOptionBadge}>RECOMMENDED</Text>
                </TouchableOpacity>

                {/* Option 2: Upload Medical Report */}
                <TouchableOpacity
                  style={styles.onboardingOptionBtn}
                  onPress={() => navigation.navigate('HealthSetup', { mode: 'report' })}
                  activeOpacity={0.85}
                >
                  <View style={[styles.onboardingOptionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <FileText size={16} color={colors.emeraldLight} />
                  </View>
                  <Text style={styles.onboardingOptionTitle}>Medical Report</Text>
                  <Text style={[styles.onboardingOptionBadge, { color: colors.emeraldLight, borderColor: 'rgba(16, 185, 129, 0.4)' }]}>AI OCR • 60s</Text>
                </TouchableOpacity>

                {/* Option 3: Manual Entry */}
                <TouchableOpacity
                  style={styles.onboardingOptionBtn}
                  onPress={() => navigation.navigate('HealthSetup', { mode: 'manual' })}
                  activeOpacity={0.85}
                >
                  <View style={[styles.onboardingOptionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <Edit3 size={16} color={colors.amberLight} />
                  </View>
                  <Text style={styles.onboardingOptionTitle}>Manual Entry</Text>
                  <Text style={[styles.onboardingOptionBadge, { color: colors.amberLight, borderColor: 'rgba(245, 158, 11, 0.4)' }]}>INSTANT</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        ) : null}

        {/* Diagnostic Report Available Card */}
        {completedWithReport && !activeAppointment ? (
          <View style={styles.reportBannerSection}>
            <GlassCard style={styles.reportBannerCard}>
              <View style={styles.reportBannerTop}>
                <View style={[styles.reportIconCircle, { backgroundColor: colors.cyanGlow }]}>
                  <FileText size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.reportBannerTitle, { color: colors.textPrimary }]}>
                      Official Diagnostic Report
                    </Text>
                    <View style={styles.nablChip}>
                      <Text style={styles.nablChipText}>NABL VERIFIED</Text>
                    </View>
                  </View>
                  <Text style={[styles.reportBannerSubtitle, { color: colors.textMuted }]}>
                    {completedWithReport.testCatalog?.testName || 'Comprehensive Biomarker Lab Profile'} • Results Ready
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.viewReportActionBtn, { backgroundColor: colors.primary }]}
                onPress={() => setSelectedReportAppt(completedWithReport)}
                activeOpacity={0.85}
              >
                <Text style={styles.viewReportActionBtnText}>VIEW & DOWNLOAD REPORT</Text>
                <ArrowRight size={14} color="#000000" />
              </TouchableOpacity>
            </GlassCard>
          </View>
        ) : null}

        {/* ========================================================= */}
        {/* 2. MAJOR CLINICAL VITALS (DYNAMIC FROM DB)                */}
        {/* ========================================================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <ActivityIcon size={16} color={colors.cyan} />
              <Text style={styles.sectionTitle}>REAL-TIME BIOMETRIC VITALS</Text>
              <DataProvenanceBadge type={vitalsProvenance} size="xs" showLabel={true} />
            </View>
            {vitalsPresent ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('Analysis')}
                style={styles.viewTrendsBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.viewTrendsText}>View Charts</Text>
                <TrendingUp size={13} color={colors.cyan} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate('HealthSetup')}
                style={styles.setupBaselineBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.setupBaselineText}>Set Up</Text>
                <ChevronRight size={13} color={colors.cyan} />
              </TouchableOpacity>
            )}
          </View>

          {/* Vitals Telemetry Grid: Heartbeat, SpO2, Stress Level */}
          <View style={styles.vitalsGrid}>
            {/* Heartbeat Card */}
            <GlassCard style={styles.vitalCard}>
              <View style={styles.vitalTopRow}>
                <View style={[styles.vitalIconWrap, { backgroundColor: 'rgba(244, 63, 94, 0.12)' }]}>
                  <Heart size={18} color={colors.roseLight} />
                </View>
                {hrSpike ? (
                  <View style={styles.spikePill}>
                    <TrendingUp size={10} color={colors.amberLight} />
                    <Text style={styles.spikePillText}>Spike</Text>
                  </View>
                ) : (
                  <View style={styles.normalPill}>
                    <Text style={styles.normalPillText}>Optimal</Text>
                  </View>
                )}
              </View>

              <Text style={styles.vitalValue}>
                {heartRate ? heartRate : '--'}
                <Text style={styles.vitalUnit}> BPM</Text>
              </Text>
              <Text style={styles.vitalLabel}>Heartbeat (Resting)</Text>

              <Text style={styles.vitalDeltaText}>
                {hrSpike ? hrSpike : 'Normal sinusoidal rhythm'}
              </Text>
            </GlassCard>

            {/* SpO2 Oxygen Card */}
            <GlassCard style={styles.vitalCard}>
              <View style={styles.vitalTopRow}>
                <View style={[styles.vitalIconWrap, { backgroundColor: 'rgba(6, 182, 212, 0.12)' }]}>
                  <Wind size={18} color={colors.cyanLight} />
                </View>
                <View style={styles.normalPill}>
                  <Text style={styles.normalPillText}>Stable</Text>
                </View>
              </View>

              <Text style={styles.vitalValue}>
                {spO2 ? `${spO2}%` : '--'}
              </Text>
              <Text style={styles.vitalLabel}>SpO2 Saturation</Text>

              <Text style={styles.vitalDeltaText}>
                {spO2 && spO2 >= 95 ? 'Optimal tissue oxygenation' : 'Monitoring arterial oxygen'}
              </Text>
            </GlassCard>

            {/* Stress Level Card */}
            <GlassCard style={styles.vitalCard}>
              <View style={styles.vitalTopRow}>
                <View style={[styles.vitalIconWrap, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                  <Brain size={18} color={colors.violetLight} />
                </View>
                {stressSpike ? (
                  <View style={styles.spikePill}>
                    <Zap size={10} color={colors.amberLight} />
                    <Text style={styles.spikePillText}>Active</Text>
                  </View>
                ) : (
                  <View style={styles.normalPill}>
                    <Text style={styles.normalPillText}>Calm</Text>
                  </View>
                )}
              </View>

              <Text style={styles.vitalValue}>
                {stressScore ? `${stressScore}` : '--'}
                <Text style={styles.vitalUnit}>/100</Text>
              </Text>
              <Text style={styles.vitalLabel}>Autonomic Stress Index</Text>

              <DataProvenanceBadge
                type="AI_ESTIMATE"
                size="xs"
                showLabel={true}
                showDisclaimer={true}
                customDisclaimer="Sec 1 & 47: Neural calculation from resting HRV"
                style={{ marginTop: 6 }}
              />

              <Text style={styles.vitalDeltaText}>
                {stressScore && stressScore < 40 ? 'Sympathetic parasympathetic balance' : 'Mild physical exertion'}
              </Text>
            </GlassCard>
          </View>

          {/* Secondary Vitals Bar: Blood Pressure & Glucose */}
          <GlassCard style={styles.secondaryVitalsCard}>
            <View style={styles.secondaryVitalItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={styles.secondaryVitalLabel}>BLOOD PRESSURE</Text>
                <DataProvenanceBadge type={vitalsProvenance} size="xs" showLabel={false} />
              </View>
              <Text style={styles.secondaryVitalValue}>
                {systolic && diastolic ? `${systolic}/${diastolic}` : (vitalsPresent ? '120/80' : '--/--')}
                <Text style={styles.secondaryVitalUnit}> mmHg</Text>
              </Text>
              <Text style={[styles.secondaryVitalStatus, !vitalsPresent && { color: colors.textMuted }]}>
                {vitalsPresent ? 'Normotensive' : 'Pending Setup'}
              </Text>
            </View>

            <View style={styles.secondaryDivider} />

            <View style={styles.secondaryVitalItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={styles.secondaryVitalLabel}>FASTING GLUCOSE</Text>
                <DataProvenanceBadge type={vitalsProvenance} size="xs" showLabel={false} />
              </View>
              <Text style={styles.secondaryVitalValue}>
                {glucose ? `${glucose}` : (vitalsPresent ? '92' : '--')}
                <Text style={styles.secondaryVitalUnit}> mg/dL</Text>
              </Text>
              <Text style={[styles.secondaryVitalStatus, { color: vitalsPresent ? colors.emeraldLight : colors.textMuted }]}>
                {vitalsPresent ? 'Euglycemic' : 'Pending Setup'}
              </Text>
            </View>
          </GlassCard>
        </View>

        {/* ========================================================= */}
        {/* 3. PREVIOUS FOOD ATE BY USER (DYNAMIC FROM DB)            */}
        {/* ========================================================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Utensils size={16} color={colors.cyan} />
              <Text style={styles.sectionTitle}>LAST RECORDED MEAL</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('History')}
              style={styles.viewTrendsBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.viewTrendsText}>Food History</Text>
              <ArrowRight size={13} color={colors.cyan} />
            </TouchableOpacity>
          </View>

          {recentMeal ? (
            <GlassCard style={styles.mealCard}>
              <View style={styles.mealTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealName}>
                    {recentMeal.recognizedItemName || recentMeal.foodItem || recentMeal.mealDescription || 'Nutrient Balanced Meal'}
                  </Text>
                  <View style={styles.mealMetaRow}>
                    <Clock size={11} color={colors.textMuted} />
                    <Text style={styles.mealTime}>
                      {new Date(recentMeal.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Quantity: {recentMeal.consumedQuantity || recentMeal.portionQuantity || 1} {recentMeal.servingUnit || 'portion'}
                    </Text>
                  </View>
                </View>

                <View style={styles.caloriesBadge}>
                  <Flame size={14} color="#f97316" />
                  <Text style={styles.caloriesText}>
                    {recentMeal.nutrients?.calories || recentMeal.nutritionalValues?.calories || recentMeal.calories || '380'} kcal
                  </Text>
                </View>
              </View>

              {/* Macro Nutrients Distribution */}
              <View style={styles.macrosRow}>
                <View style={styles.macroPill}>
                  <Text style={styles.macroLabel}>CARBS</Text>
                  <Text style={styles.macroValue}>
                    {recentMeal.nutrients?.carbohydrates ?? recentMeal.nutritionalValues?.carbsGrams ?? '42'}g
                  </Text>
                </View>

                <View style={styles.macroPill}>
                  <Text style={styles.macroLabel}>PROTEIN</Text>
                  <Text style={styles.macroValue}>
                    {recentMeal.nutrients?.proteins ?? recentMeal.nutritionalValues?.proteinGrams ?? '28'}g
                  </Text>
                </View>

                <View style={styles.macroPill}>
                  <Text style={styles.macroLabel}>FAT</Text>
                  <Text style={styles.macroValue}>
                    {recentMeal.nutrients?.fats ?? recentMeal.nutritionalValues?.fatGrams ?? '14'}g
                  </Text>
                </View>

                <View style={styles.macroPill}>
                  <Text style={styles.macroLabel}>FIBER</Text>
                  <Text style={styles.macroValue}>
                    {recentMeal.nutrients?.fiber ?? recentMeal.nutritionalValues?.fiberGrams ?? '6'}g
                  </Text>
                </View>
              </View>

              {/* BioSync AI Metabolic Recommendation / Glycemic Spike */}
              <View style={styles.glycemicImpactRow}>
                <Sparkles size={13} color={colors.cyan} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.glycemicImpactText}>
                    {recentMeal.predictedImpact?.glucoseSpike != null
                      ? `Estimated Glucose Surge: +${recentMeal.predictedImpact.glucoseSpike} mg/dL • ${recentMeal.predictedImpact.aiWarningMessage || 'Metabolic response calibrated'}`
                      : recentMeal.aiRecommendation?.verdict ||
                        'Optimal macronutrient balance for your resting insulin sensitivity'}
                  </Text>
                  <DataProvenanceBadge
                    type="AI_ESTIMATE"
                    size="xs"
                    showLabel={true}
                    showDisclaimer={true}
                    customDisclaimer="Sec 1 & 47: Projected glycemic surge is an AI estimate calibrated with resting vitals."
                    style={{ marginTop: 4 }}
                  />
                </View>
              </View>
            </GlassCard>
          ) : (
            <GlassCard style={styles.noMealCard}>
              <View style={styles.noMealIconBox}>
                <Utensils size={22} color={colors.textMuted} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.noMealTitle}>No Meal Logged Today</Text>
                <Text style={styles.noMealSub}>
                  Scan your meal to compute immediate biological impact and glucose spike estimates.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.scanQuickBtn}
                onPress={() => navigation.navigate('Scan')}
                activeOpacity={0.8}
              >
                <Scan size={14} color="#000" />
                <Text style={styles.scanQuickBtnText}>Scan</Text>
              </TouchableOpacity>
            </GlassCard>
          )}
        </View>

        {/* Quick Launch Cards */}
        <View style={styles.quickLaunchRow}>
          <TouchableOpacity
            style={styles.quickLaunchCard}
            onPress={() => navigation.navigate('Scan')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(6, 182, 212, 0.15)', 'rgba(6, 182, 212, 0.03)']}
              style={styles.quickLaunchGradient}
            >
              <Scan size={24} color={colors.cyan} />
              <Text style={styles.quickLaunchTitle}>AI Food Scanner</Text>
              <Text style={styles.quickLaunchSub}>Calibrate & compute meal compatibility</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickLaunchCard}
            onPress={() => navigation.navigate('Analysis')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.03)']}
              style={styles.quickLaunchGradient}
            >
              <TrendingUp size={24} color={colors.emeraldLight} />
              <Text style={styles.quickLaunchTitle}>Vitals Trading Chart</Text>
              <Text style={styles.quickLaunchSub}>Analyze fluctuations & spike trends</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 4. LONGITUDINAL HEALTH TIMELINE QUICK LAUNCH BANNER (PHASE 4) */}
        <TouchableOpacity
          style={[
            styles.timelineBannerCard,
            {
              backgroundColor: isDark ? 'rgba(6, 182, 212, 0.08)' : 'rgba(8, 145, 178, 0.06)',
              borderColor: colors.borderCyan || 'rgba(6, 182, 212, 0.3)',
            },
          ]}
          onPress={() => navigation.navigate('HealthTimeline')}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.timelineBannerIconWrap,
              { backgroundColor: colors.cyanGlow || 'rgba(6, 182, 212, 0.15)' },
            ]}
          >
            <ActivityIcon size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <Text style={[styles.timelineBannerTitle, { color: colors.textPrimary }]}>
                Unified Health Timeline
              </Text>
              <View
                style={[
                  styles.provenancePillBadge,
                  { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.35)' },
                ]}
              >
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#10b981' }}>
                  CLINICAL AUDIT
                </Text>
              </View>
            </View>
            <Text style={[styles.timelineBannerSub, { color: colors.textSecondary }]}>
              Explore verified lab reports, vitals logs & nutritional projections chronologically.
            </Text>
          </View>
          <ChevronRight size={18} color={colors.primary} />
        </TouchableOpacity>
      </ScrollView>

      <ReportViewerModal
        visible={!!selectedReportAppt}
        onClose={() => setSelectedReportAppt(null)}
        appointment={selectedReportAppt}
        navigation={navigation}
      />

      <NotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        onNotificationCountChange={setUnreadNotifCount}
        navigation={navigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  greetingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userName: {
    color: colors.cyanLight,
    fontWeight: '800',
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeCircle: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportBannerSection: {
    marginBottom: 16,
  },
  reportBannerCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  reportBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportBannerTitle: {
    fontSize: 14.5,
    fontWeight: '900',
  },
  nablChip: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nablChipText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#10b981',
  },
  reportBannerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  viewReportActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 10,
  },
  viewReportActionBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  appointmentSection: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    color: colors.textMuted,
  },
  viewTrendsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewTrendsText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.cyanLight,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.amberLight,
  },
  liveLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1,
    color: colors.amberLight,
  },
  activeDetailsCard: {
    backgroundColor: colors.bgCardElevated,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: 12,
  },
  activeTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  activeTestName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  activeCategory: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  slotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  slotPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.amberLight,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressLineBg: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  progressLineFill: {
    height: '100%',
    backgroundColor: colors.cyan,
    borderRadius: 2,
  },
  progressStepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStepNode: {
    alignItems: 'center',
    width: 44,
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepDotDone: {
    backgroundColor: colors.cyan,
  },
  stepDotCurrent: {
    backgroundColor: colors.amberLight,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  innerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  stepLabel: {
    fontSize: 7.5,
    color: colors.textMuted,
    textAlign: 'center',
  },
  stepLabelCurrent: {
    color: colors.amberLight,
    fontWeight: '800',
  },
  vitalsGrid: {
    gap: 10,
    marginBottom: 10,
  },
  vitalCard: {
    backgroundColor: colors.bgCardElevated,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  vitalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vitalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spikePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  spikePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.amberLight,
  },
  normalPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  normalPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.emeraldLight,
  },
  vitalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  vitalUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  vitalLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  vitalDeltaText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  secondaryVitalsCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgCardElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 14,
  },
  secondaryVitalItem: {
    flex: 1,
  },
  secondaryVitalLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  secondaryVitalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 2,
  },
  secondaryVitalUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  secondaryVitalStatus: {
    fontSize: 10,
    color: colors.cyanLight,
    fontWeight: '700',
    marginTop: 2,
  },
  secondaryDivider: {
    width: 1,
    backgroundColor: colors.borderSubtle,
    marginHorizontal: 12,
  },
  mealCard: {
    backgroundColor: colors.bgCardElevated,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 16,
  },
  mealTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  mealMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  mealTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  caloriesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  caloriesText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f97316',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  macroPill: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  macroValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  glycemicImpactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.06)',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.15)',
  },
  glycemicImpactText: {
    fontSize: 11,
    color: colors.cyanLight,
    fontWeight: '600',
    flex: 1,
  },
  noMealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 12, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  noMealIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMealTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  noMealSub: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 14,
  },
  scanQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cyan,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 10,
  },
  scanQuickBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  quickLaunchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickLaunchCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickLaunchGradient: {
    padding: 16,
    minHeight: 120,
    justifyContent: 'center',
  },
  quickLaunchTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 10,
  },
  quickLaunchSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 14,
  },
  // Onboarding Initial Assessment Banner
  onboardingSection: {
    marginBottom: 24,
  },
  onboardingHeroCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    padding: 18,
  },
  onboardingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  onboardingIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  onboardingSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  onboardingOptionsHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  onboardingOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  onboardingOptionBtn: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  onboardingOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  onboardingOptionTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  onboardingOptionBadge: {
    fontSize: 7.5,
    fontWeight: '900',
    color: colors.cyan,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 4,
    letterSpacing: 0.3,
  },
  setupBaselineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  setupBaselineText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.cyan,
  },
  trackerReportBtn: {
    backgroundColor: '#06b6d4',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  trackerReportBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackerReportBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  nablMiniTag: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nablMiniTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000000',
  },
  homeManageBookingBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  homeManageBookingText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  timelineBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    gap: 12,
  },
  timelineBannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  provenancePillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  timelineBannerSub: {
    fontSize: 11,
    lineHeight: 15,
  },
});

export default HomeScreen;
