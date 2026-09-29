import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  MapPin,
  Shield,
  ShieldAlert,
  LogOut,
  AlertTriangle,
  FileCheck2,
  CalendarPlus,
  Activity,
  Heart,
  Wind,
  Brain,
  Droplets,
  Clock,
  Sparkles,
  Lock,
  ArrowRight,
  CheckCircle2,
  Zap,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import { useUserAppointmentStore } from '../store/userAppointmentStore';
import GlassCard from '../components/GlassCard';

export const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout, latestVitals, hasVitals, fetchVitals } = useAuthStore();
  const { appointments, activeAppointment, fetchAppointments } =
    useUserAppointmentStore();

  const [loadingRefresh, setLoadingRefresh] = useState(false);

  useEffect(() => {
    fetchVitals();
    fetchAppointments();
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of BioSync AI?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const vitalsUploaded = hasVitals();
  const isSuspended = user?.accountStatus === 'Suspended';
  const strikes = user?.strikeCount || 0;

  // --------------------------------------------------------------------------
  // 30-DAY CALIBRATION LOGIC
  // --------------------------------------------------------------------------
  // Find the most recent appointment (completed or scheduled)
  const recentAppointment = Array.isArray(appointments) && appointments.length > 0
    ? [...appointments].sort(
        (a, b) => new Date(b.scheduledDate || b.createdAt) - new Date(a.scheduledDate || a.createdAt)
      )[0]
    : null;

  let canBook = true;
  let daysSince = 0;
  let daysRemaining = 0;
  let calibrationPercent = 100;

  if (activeAppointment) {
    canBook = false;
  } else if (recentAppointment && recentAppointment.status !== 'Cancelled') {
    const apptDate = new Date(recentAppointment.scheduledDate || recentAppointment.createdAt);
    const diffMs = Date.now() - apptDate.getTime();
    daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (daysSince < 30) {
      canBook = false;
      daysRemaining = Math.max(1, 30 - daysSince);
      calibrationPercent = Math.min(100, Math.round((daysSince / 30) * 100));
    }
  }

  // Biomarkers counts
  const totalBiomarkersCount = vitalsUploaded ? 18 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Patient Health Profile</Text>
          <Text style={styles.headerSubtitle}>
            Verified telemetry, biomarkers & AI calibration cycle
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Identity Card */}
        <GlassCard style={styles.userCard}>
          <View style={styles.userAvatarCircle}>
            <User size={30} color={colors.cyan} />
          </View>
          <Text style={styles.userName}>{user?.name || user?.firstName || 'BioSync Patient'}</Text>
          <Text style={styles.userPhone}>+91 {user?.phoneNumber || user?.phone || '9876543210'}</Text>
          {user?.bloodGroup ? (
            <View style={styles.bloodGroupPill}>
              <Droplets size={12} color={colors.roseLight} />
              <Text style={styles.bloodGroupText}>Blood Group: {user.bloodGroup}</Text>
            </View>
          ) : null}
        </GlassCard>

        {/* ========================================================= */}
        {/* 1. VITALS TOTAL & DETAILED BREAKDOWN SECTION              */}
        {/* ========================================================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Activity size={16} color={colors.cyan} />
              <Text style={styles.sectionTitle}>CLINICAL VITALS TOTAL</Text>
            </View>
            {vitalsUploaded ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('Analysis')}
                style={styles.analysisLinkBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.analysisLinkText}>View Trends</Text>
                <ArrowRight size={12} color={colors.cyan} />
              </TouchableOpacity>
            ) : null}
          </View>

          {!vitalsUploaded ? (
            /* NOT UPLOADED PROMPT & CALL TO ACTION */
            <GlassCard style={styles.notUploadedCard}>
              <View style={styles.notUploadedTop}>
                <View style={styles.notUploadedIconWrap}>
                  <AlertTriangle size={22} color={colors.amberLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notUploadedTitle}>Vitals Not Uploaded</Text>
                  <Text style={styles.notUploadedSubtitle}>
                    In-detail clinical biomarkers & metabolic vitals have not been recorded yet.
                  </Text>
                </View>
              </View>

              <Text style={styles.notUploadedExplanation}>
                BioSync AI requires verified laboratory vitals to calibrate our predictive neural model and unlock personalized meal nutrition scanning.
              </Text>

              <TouchableOpacity
                style={styles.bookAppointmentBtn}
                onPress={() => navigation.navigate('BookAppointment')}
                activeOpacity={0.85}
              >
                <CalendarPlus size={16} color="#000000" />
                <Text style={styles.bookAppointmentBtnText}>BOOK AN APPOINTMENT</Text>
              </TouchableOpacity>
            </GlassCard>
          ) : (
            /* VITALS TOTAL RECORD CARDS */
            <View style={styles.vitalsRecordContainer}>
              {/* Vitals Summary Banner */}
              <GlassCard style={styles.vitalsSummaryBanner}>
                <View style={styles.summaryBannerRow}>
                  <View>
                    <Text style={styles.summaryBannerTitle}>
                      {totalBiomarkersCount} Biomarkers Calibrated
                    </Text>
                    <Text style={styles.summaryBannerSub}>
                      Status: {user?.vitalsStatus || 'Lab_Verified'} • Diagnostic Grade
                    </Text>
                  </View>
                  <View style={styles.verifiedBadge}>
                    <CheckCircle2 size={13} color={colors.emeraldLight} />
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                </View>
              </GlassCard>

              {/* Categorized Vitals Panels */}
              <View style={styles.vitalsCategoryGrid}>
                {/* 1. Cardiovascular Risk Panel */}
                <GlassCard style={styles.categoryCard}>
                  <View style={styles.categoryHeader}>
                    <Heart size={16} color={colors.roseLight} />
                    <Text style={styles.categoryTitle}>Cardiovascular & Hemodynamic</Text>
                  </View>
                  <View style={styles.biomarkersRow}>
                    <View style={styles.biomarkerItem}>
                      <Text style={styles.bioLabel}>Blood Pressure</Text>
                      <Text style={styles.bioVal}>
                        {latestVitals?.cardiovascularRisk?.systolic && latestVitals?.cardiovascularRisk?.diastolic
                          ? `${latestVitals.cardiovascularRisk.systolic}/${latestVitals.cardiovascularRisk.diastolic}`
                          : '118/76'}
                        <Text style={styles.bioUnit}> mmHg</Text>
                      </Text>
                    </View>
                    <View style={styles.biomarkerItem}>
                      <Text style={styles.bioLabel}>Resting Pulse</Text>
                      <Text style={styles.bioVal}>
                        {latestVitals?.continuousMetrics?.restingHeartRate || 72}
                        <Text style={styles.bioUnit}> BPM</Text>
                      </Text>
                    </View>
                  </View>
                  <View style={styles.biomarkersRow}>
                    <View style={styles.biomarkerItem}>
                      <Text style={styles.bioLabel}>Total Cholesterol</Text>
                      <Text style={styles.bioVal}>
                        {latestVitals?.cardiovascularRisk?.totalCholesterol || 174}
                        <Text style={styles.bioUnit}> mg/dL</Text>
                      </Text>
                    </View>
                    <View style={styles.biomarkerItem}>
                      <Text style={styles.bioLabel}>Triglycerides</Text>
                      <Text style={styles.bioVal}>
                        {latestVitals?.cardiovascularRisk?.triglycerides || 132}
                        <Text style={styles.bioUnit}> mg/dL</Text>
                      </Text>
                    </View>
                  </View>
                </GlassCard>

                {/* 2. Metabolic & Glycemic Panel */}
                <GlassCard style={styles.categoryCard}>
                  <View style={styles.categoryHeader}>
                    <Zap size={16} color={colors.amberLight} />
                    <Text style={styles.categoryTitle}>Metabolic & Glycemic Profile</Text>
                  </View>
                  <View style={styles.biomarkersRow}>
                    <View style={styles.biomarkerItem}>
                      <Text style={styles.bioLabel}>Fasting Glucose</Text>
                      <Text style={styles.bioVal}>
                        {latestVitals?.metabolicHealth?.glucoseFasting || 92}
                        <Text style={styles.bioUnit}> mg/dL</Text>
                      </Text>
                    </View>
                    <View style={styles.biomarkerItem}>
                      <Text style={styles.bioLabel}>HbA1c</Text>
                      <Text style={styles.bioVal}>
                        {latestVitals?.metabolicHealth?.hba1c || 5.4}
                        <Text style={styles.bioUnit}> %</Text>
                      </Text>
                    </View>
                  </View>
                  <View style={styles.biomarkersRow}>
                    <View style={styles.biomarkerItem}>
                      <Text style={styles.bioLabel}>Post-Prandial</Text>
                      <Text style={styles.bioVal}>
                        {latestVitals?.metabolicHealth?.glucosePostPrandial || 124}
                        <Text style={styles.bioUnit}> mg/dL</Text>
                      </Text>
                    </View>
                    <View style={styles.biomarkerItem}>
                      <Text style={styles.bioLabel}>Fasting Insulin</Text>
                      <Text style={styles.bioVal}>
                        {latestVitals?.metabolicHealth?.insulin || 8.6}
                        <Text style={styles.bioUnit}> μIU/mL</Text>
                      </Text>
                    </View>
                  </View>
                </GlassCard>

                {/* 3. Continuous Telemetry Panel */}
                <GlassCard style={styles.categoryCard}>
                  <View style={styles.categoryHeader}>
                    <Wind size={16} color={colors.cyanLight} />
                    <Text style={styles.categoryTitle}>Continuous Telemetry & SpO2</Text>
                  </View>
                  <View style={styles.biomarkersRow}>
                    <View style={styles.biomarkerItem}>
                      <Text style={styles.bioLabel}>Arterial SpO2</Text>
                      <Text style={styles.bioVal}>
                        {latestVitals?.continuousMetrics?.oxygenSaturationSpO2 || 99}
                        <Text style={styles.bioUnit}> %</Text>
                      </Text>
                    </View>
                    <View style={styles.biomarkerItem}>
                      <Text style={styles.bioLabel}>Heart Rate Var (HRV)</Text>
                      <Text style={styles.bioVal}>
                        {latestVitals?.continuousMetrics?.hrv || 52}
                        <Text style={styles.bioUnit}> ms</Text>
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </View>
            </View>
          )}
        </View>

        {/* ========================================================= */}
        {/* 2. APPOINTMENT BOOKING & 30-DAY CALIBRATION SECTION       */}
        {/* ========================================================= */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DIAGNOSTIC CALIBRATION CYCLE</Text>

          <GlassCard style={styles.calibrationCard}>
            <View style={styles.calibrationHeader}>
              <View style={styles.calibrationIconCircle}>
                <Sparkles size={20} color={colors.cyan} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.calibrationTitle}>
                  {canBook ? 'Recalibration Window Open' : 'AI Calibration Cycle Active'}
                </Text>
                <Text style={styles.calibrationSubtitle}>
                  {canBook
                    ? '30-day calibration cycle matured. Book home diagnostics to update your biomarkers.'
                    : `Recalibration appointment locked for ${daysRemaining} more days for AI cross-calibration.`}
                </Text>
              </View>
            </View>

            {/* Calibration explanation note */}
            <Text style={styles.calibrationExplainerText}>
              🧬 BioSync AI requires laboratory vitals and predicted telemetry to synchronize every 30 days so the neural network can adapt to your evolving metabolism.
            </Text>

            {/* Calibration Progress Bar if locked */}
            {!canBook && !activeAppointment && (
              <View style={styles.calibrationProgressWrap}>
                <View style={styles.progressHeaderRow}>
                  <Text style={styles.progressLabelText}>30-Day Calibration Adaptation</Text>
                  <Text style={styles.progressValueText}>{daysSince}/30 Days ({calibrationPercent}%)</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${calibrationPercent}%` }]} />
                </View>
              </View>
            )}

            {/* Active Appointment Notice */}
            {activeAppointment ? (
              <View style={styles.activeApptBox}>
                <View style={styles.activeApptRow}>
                  <Zap size={14} color={colors.cyan} />
                  <Text style={styles.activeApptText}>
                    Active Visit in Progress: {activeAppointment.status}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.viewHomeBtn}
                  onPress={() => navigation.navigate('Home')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewHomeBtnText}>TRACK ON HOME SCREEN</Text>
                </TouchableOpacity>
              </View>
            ) : canBook ? (
              /* ALLOWED TO BOOK */
              <TouchableOpacity
                style={styles.bookCalibrationBtn}
                onPress={() => navigation.navigate('BookAppointment')}
                activeOpacity={0.85}
              >
                <CalendarPlus size={16} color="#000000" />
                <Text style={styles.bookCalibrationBtnText}>SCHEDULE DIAGNOSTIC VISIT</Text>
              </TouchableOpacity>
            ) : (
              /* 30-DAY RESTRICTION LOCKED BUTTON */
              <View style={styles.lockedBtnWrap}>
                <Lock size={15} color={colors.textMuted} />
                <Text style={styles.lockedBtnText}>
                  NEXT APPOINTMENT IN {daysRemaining} DAYS
                </Text>
              </View>
            )}
          </GlassCard>
        </View>

        {/* ========================================================= */}
        {/* 3. NABL ACCOUNT STANDING & COMPLIANCE                     */}
        {/* ========================================================= */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT COMPLIANCE & VERIFICATION</Text>
          <GlassCard
            style={[
              styles.complianceCard,
              isSuspended && styles.complianceCardSuspended,
            ]}
          >
            <View style={styles.complianceRow}>
              {isSuspended ? (
                <ShieldAlert size={20} color={colors.roseLight} />
              ) : (
                <Shield size={20} color={colors.emeraldLight} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.complianceTitle}>
                  Status: {user?.accountStatus || 'Active'}
                </Text>
                <Text style={styles.complianceSubtitle}>
                  {isSuspended
                    ? 'Account suspended due to repeated cancellation breaches.'
                    : 'NABL & ISO-15189 Verified Patient Identity'}
                </Text>
              </View>
            </View>

            <View style={styles.strikeRow}>
              <Text style={styles.strikeLabel}>Cancellation Strikes:</Text>
              <View style={styles.strikeDots}>
                <View
                  style={[
                    styles.strikeDot,
                    strikes >= 1 && styles.strikeDotActive,
                  ]}
                />
                <View
                  style={[
                    styles.strikeDot,
                    strikes >= 2 && styles.strikeDotActive,
                  ]}
                />
              </View>
              <Text style={styles.strikeLimitText}>({strikes}/2 Maximum)</Text>
            </View>
          </GlassCard>
        </View>

        {/* ========================================================= */}
        {/* 4. REGISTERED HOME COLLECTION ADDRESS                     */}
        {/* ========================================================= */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REGISTERED HOME COLLECTION ADDRESS</Text>
          <GlassCard style={styles.addressCard}>
            <View style={styles.addressRow}>
              <MapPin size={20} color={colors.cyan} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressMain}>
                  {user?.address?.street || 'Flat 402, Highline Residency'}
                </Text>
                <Text style={styles.addressSub}>
                  {user?.address?.city || 'Hyderabad'}, {user?.address?.pincode || '500081'}
                </Text>
                <Text style={styles.coordsText}>
                  GPS: {user?.address?.coordinates?.lat || '17.4435'}° N,{' '}
                  {user?.address?.coordinates?.lng || '78.3842'}° E
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Clinical Disclaimer */}
        <View style={styles.disclaimerBox}>
          <FileCheck2 size={16} color={colors.textMuted} />
          <Text style={styles.disclaimerText}>
            All specimens are handled in strict adherence to CLSI H3-A6 standards with full cold chain audit logs.
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={16} color={colors.roseLight} />
          <Text style={styles.logoutBtnText}>SIGN OUT</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    paddingVertical: 22,
    marginBottom: 20,
  },
  userAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  userPhone: {
    fontSize: 12,
    color: colors.cyanLight,
    fontWeight: '700',
    marginTop: 4,
  },
  bloodGroupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  bloodGroupText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.roseLight,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.cyan,
    letterSpacing: 1.5,
  },
  analysisLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  analysisLinkText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.cyan,
  },
  notUploadedCard: {
    backgroundColor: '#120d06',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    padding: 16,
  },
  notUploadedTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  notUploadedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notUploadedTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.amberLight,
  },
  notUploadedSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  notUploadedExplanation: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 14,
  },
  bookAppointmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.cyan,
    paddingVertical: 12,
    borderRadius: 10,
  },
  bookAppointmentBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  vitalsRecordContainer: {
    gap: 12,
  },
  vitalsSummaryBanner: {
    backgroundColor: '#07181f',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    padding: 14,
  },
  summaryBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryBannerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  summaryBannerSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.emeraldLight,
  },
  vitalsCategoryGrid: {
    gap: 10,
  },
  categoryCard: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  biomarkersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  biomarkerItem: {
    flex: 1,
  },
  bioLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
  },
  bioVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  bioUnit: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },
  calibrationCard: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
  },
  calibrationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  calibrationIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calibrationTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  calibrationSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  calibrationExplainerText: {
    fontSize: 10.5,
    color: colors.textSecondary,
    lineHeight: 15,
    backgroundColor: '#050d11',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.15)',
    marginBottom: 12,
  },
  calibrationProgressWrap: {
    marginBottom: 14,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabelText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
  },
  progressValueText: {
    fontSize: 10,
    color: colors.cyanLight,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1f1f1f',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.cyan,
  },
  activeApptBox: {
    backgroundColor: '#07181f',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  activeApptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeApptText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.cyanLight,
  },
  viewHomeBtn: {
    backgroundColor: colors.cyan,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewHomeBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  bookCalibrationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.cyan,
    paddingVertical: 12,
    borderRadius: 10,
  },
  bookCalibrationBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  lockedBtnWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    borderRadius: 10,
  },
  lockedBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  complianceCard: {
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  complianceCardSuspended: {
    borderColor: colors.rose,
    backgroundColor: '#160808',
  },
  complianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  complianceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  complianceSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  strikeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  strikeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  strikeDots: {
    flexDirection: 'row',
    gap: 6,
  },
  strikeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  strikeDotActive: {
    backgroundColor: colors.rose,
    borderColor: colors.roseLight,
  },
  strikeLimitText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  addressCard: {
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  addressMain: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  addressSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  coordsText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#080808',
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#18080a',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    paddingVertical: 14,
    borderRadius: 14,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.roseLight,
    letterSpacing: 1,
  },
});

export default ProfileScreen;
