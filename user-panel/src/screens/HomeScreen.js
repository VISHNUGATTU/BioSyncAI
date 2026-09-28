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
import {
  Activity,
  PlusCircle,
  Calendar,
  AlertCircle,
  ChevronRight,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import { useUserAppointmentStore } from '../store/userAppointmentStore';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import CollectionOtpCard from '../components/CollectionOtpCard';
import AssignedStaffCard from '../components/AssignedStaffCard';

const TRACKING_STAGES = [
  { key: 'Booked', label: 'Booked' },
  { key: 'Assistant_Assigned', label: 'Staff Assigned' },
  { key: 'On_The_Way', label: 'En Route' },
  { key: 'Arrived', label: 'At Doorstep' },
  { key: 'Collecting', label: 'Drawing Blood' },
  { key: 'Sample_Collected', label: 'Sample Sealed' },
  { key: 'At_Laboratory', label: 'At Lab' },
];

export const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const {
    activeAppointment,
    appointments,
    testCatalog,
    isLoading,
    isRefreshing,
    fetchAppointments,
    fetchTestCatalog,
  } = useUserAppointmentStore();

  const [refreshing, setRefreshing] = useState(false);

  // Initial load
  useEffect(() => {
    fetchAppointments();
    fetchTestCatalog();
  }, []);

  // Real-time polling every 4 seconds for instant state sync with staff-panel
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAppointments(true); // silent refresh
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchAppointments(false), fetchTestCatalog()]);
    setRefreshing(false);
  }, []);

  const getStageIndex = (status) => {
    if (!status) return 0;
    if (status === 'Assigned') return 1;
    if (status === 'On_Route') return 2;
    const idx = TRACKING_STAGES.findIndex((s) => s.key === status);
    if (idx !== -1) return idx;
    if (['Processing', 'Report_Generated', 'Completed'].includes(status)) return 6;
    return 0;
  };

  const currentStageIdx = activeAppointment ? getStageIndex(activeAppointment.status) : -1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.appTitle}>BioSync AI</Text>
          <Text style={styles.greetingText}>
            Hello, <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Patient'}</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <RefreshCw size={18} color={colors.cyan} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.cyan}
            colors={[colors.cyan]}
          />
        }
      >
        {/* ACTIVE APPOINTMENT SPOTLIGHT */}
        {activeAppointment ? (
          <View style={styles.section}>
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
            </GlassCard>

            {/* REAL-TIME COLLECTION OTP COMPONENT (Primary Handshake Mechanism) */}
            <CollectionOtpCard appointment={activeAppointment} />

            {/* ASSIGNED PHLEBOTOMIST TELEMETRY */}
            <AssignedStaffCard appointment={activeAppointment} />
          </View>
        ) : (
          /* NO ACTIVE APPOINTMENT EMPTY/PROMO STATE */
          <GlassCard style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Activity size={28} color={colors.cyan} />
            </View>
            <Text style={styles.emptyTitle}>No Active Home Collection</Text>
            <Text style={styles.emptySubtitle}>
              Schedule a certified phlebotomist to collect blood samples at your doorstep with real-time temperature tracking.
            </Text>
            <TouchableOpacity
              style={styles.bookNowBtn}
              onPress={() => navigation.navigate('BookAppointment')}
              activeOpacity={0.85}
            >
              <PlusCircle size={18} color="#000000" />
              <Text style={styles.bookNowBtnText}>SCHEDULE HOME VISIT</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* QUICK TEST CATALOG / BOOKING SHORTCUT */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Available Diagnostic Panels</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('BookAppointment')}
              style={styles.viewAllRow}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={14} color={colors.cyan} />
            </TouchableOpacity>
          </View>

          {testCatalog && testCatalog.length > 0 ? (
            testCatalog.slice(0, 3).map((test) => (
              <TouchableOpacity
                key={test._id}
                style={styles.catalogCard}
                onPress={() =>
                  navigation.navigate('BookAppointment', { preselectedTestId: test._id })
                }
                activeOpacity={0.8}
              >
                <View style={styles.catalogCardLeft}>
                  <Text style={styles.catalogTestName}>{test.testName}</Text>
                  <Text style={styles.catalogCategory}>
                    {test.category} • Fasting: {test.preparationInstructions?.requiresFasting ? 'Required' : 'None'}
                  </Text>
                </View>
                <View style={styles.catalogCardRight}>
                  <Text style={styles.catalogPrice}>
                    ₹{test.pricing?.basePrice || 499}
                  </Text>
                  <View style={styles.bookSmallPill}>
                    <Text style={styles.bookSmallText}>BOOK</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <GlassCard style={styles.catalogLoadingCard}>
              <Text style={styles.catalogLoadingText}>Loading diagnostic panels...</Text>
            </GlassCard>
          )}
        </View>

        {/* CLINICAL PROTOCOL ASSURANCE */}
        <View style={styles.assuranceBox}>
          <View style={styles.assuranceItem}>
            <ShieldCheck size={18} color={colors.emeraldLight} />
            <Text style={styles.assuranceText}>NABL & ISO-15189 Accredited</Text>
          </View>
          <View style={styles.assuranceItem}>
            <Sparkles size={18} color={colors.cyan} />
            <Text style={styles.assuranceText}>Continuous 4°C Cold Chain</Text>
          </View>
        </View>
      </ScrollView>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#000000',
  },
  appTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.cyan,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  userName: {
    color: colors.cyanLight,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.emerald,
  },
  liveLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.emeraldLight,
    letterSpacing: 1,
  },
  activeDetailsCard: {
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 12,
  },
  activeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  activeTestName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
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
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  slotPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.amberLight,
  },
  progressContainer: {
    marginTop: 6,
    position: 'relative',
  },
  progressLineBg: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
  },
  progressLineFill: {
    height: 3,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#181818',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepDotDone: {
    backgroundColor: colors.emerald,
    borderColor: colors.emeraldLight,
  },
  stepDotCurrent: {
    backgroundColor: colors.cyan,
    borderColor: '#ffffff',
  },
  innerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  stepLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
  stepLabelCurrent: {
    color: colors.cyanLight,
    fontWeight: '900',
  },
  emptyCard: {
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cyan,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookNowBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.cyan,
  },
  catalogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  catalogCardLeft: {
    flex: 1,
    paddingRight: 10,
  },
  catalogTestName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  catalogCategory: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },
  catalogCardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  catalogPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.cyanLight,
  },
  bookSmallPill: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.35)',
  },
  bookSmallText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.cyan,
    letterSpacing: 0.5,
  },
  catalogLoadingCard: {
    backgroundColor: '#0a0a0a',
    padding: 16,
    alignItems: 'center',
  },
  catalogLoadingText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  assuranceBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    backgroundColor: '#080808',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 8,
  },
  assuranceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assuranceText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});

export default HomeScreen;
