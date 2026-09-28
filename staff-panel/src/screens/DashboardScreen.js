import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TestTube,
  Clock,
  Activity,
  CircleCheck,
  Navigation,
  Phone,
  ChevronRight,
  TrendingUp,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  Wallet,
  Headset,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import useAuthStore from '../store/authStore';
import useAppointmentStore from '../store/appointmentStore';
import DutyStatusSwitch from '../components/DutyStatusSwitch';
import MetricCard from '../components/MetricCard';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import OpsHelplineModal from '../components/OpsHelplineModal';

export const DashboardScreen = ({ navigation }) => {
  const staff = useAuthStore((state) => state.staff);
  const kpis = useAppointmentStore((state) => state.kpis);
  const pendingAppointments = useAppointmentStore((state) => state.pendingAppointments);
  const activeAppointment = useAppointmentStore((state) => state.activeAppointment);
  const recentSamples = useAppointmentStore((state) => state.recentSamples);
  const fetchDashboardData = useAppointmentStore((state) => state.fetchDashboardData);

  const [refreshing, setRefreshing] = useState(false);
  const [helplineVisible, setHelplineVisible] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleCallPatient = (phone) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleOpenMaps = (addressText) => {
    const query = encodeURIComponent(addressText);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const activeApptUser = activeAppointment?.user || {};
  const activeApptAddress = activeAppointment?.address || activeApptUser.address || {};
  const addressString = typeof activeApptAddress === 'string'
    ? activeApptAddress
    : [
        activeApptAddress.houseNumber,
        activeApptAddress.street,
        activeApptAddress.landmark,
        activeApptAddress.city,
        activeApptAddress.pincode || activeApptAddress.postalCode,
      ].filter(Boolean).join(', ') || 'Address on file';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryLight}
          />
        }
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingText}>Hello, {staff?.name?.split(' ')[0] || 'Phlebotomist'}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.empBadge}>
                <Text style={styles.empBadgeText}>{staff?.employeeId || 'EMP001'}</Text>
              </View>
              <Text style={styles.zoneText}>• Zone: {staff?.assignedZones?.[0] || 'Hyderabad Central'}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={styles.sosHeaderBtn}
              onPress={() => setHelplineVisible(true)}
              activeOpacity={0.8}
            >
              <Headset size={16} color={colors.cyan} />
            </TouchableOpacity>
            <DutyStatusSwitch />
          </View>
        </View>

        {/* Shift Completion Progress */}
        {kpis && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Appointments', { filter: 'pending' })}
            activeOpacity={0.85}
          >
            <GlassCard style={styles.progressCard} gradient={colors.cardGradientCyan}>
              <View style={styles.progressHeader}>
                <View>
                  <Text style={styles.progressLabel}>SHIFT PROGRESS</Text>
                  <Text style={styles.progressValue}>{kpis.progress || 0}%</Text>
                </View>
                <View style={styles.progressIcon}>
                  <TrendingUp size={20} color={colors.primaryLight} />
                </View>
              </View>

              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(Math.max(kpis.progress || 0, 4), 100)}%` },
                  ]}
                />
              </View>

              <View style={styles.progressFooter}>
                <Text style={styles.progressFooterText}>
                  {kpis.completed || 0}/{kpis.todaySamples || 0} done
                </Text>
                <Text style={styles.progressRemainingText}>
                  {kpis.testsDue || 0} left
                </Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}

        {/* Operational Metrics Grid - Interactive & Clickable */}
        <View style={styles.metricsGrid}>
          <MetricCard
            icon={TestTube}
            title="Samples"
            value={kpis?.todaySamples ?? '—'}
            subtitle="Today"
            accentColor={colors.primaryLight}
            onPress={() => navigation.navigate('Appointments', { filter: 'total' })}
          />
          <MetricCard
            icon={Clock}
            title="Pending"
            value={kpis?.pendingCollection ?? '—'}
            subtitle="Awaiting"
            accentColor={colors.amberLight}
            onPress={() => navigation.navigate('Appointments', { filter: 'pending' })}
          />
          <MetricCard
            icon={Activity}
            title="Processing"
            value={kpis?.inProcessing ?? '—'}
            subtitle="In lab"
            accentColor={colors.violetLight}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Samples', params: { tab: 'queue' } })}
          />
          <MetricCard
            icon={CircleCheck}
            title="Done"
            value={kpis?.completed ?? '—'}
            subtitle="Completed"
            accentColor={colors.emeraldLight}
            onPress={() => navigation.navigate('Appointments', { filter: 'completed' })}
          />
        </View>

        {/* Spotlight: Active / Next Collection Trip */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Next Collection</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Appointments', { filter: 'pending' })}>
            <Text style={styles.sectionLink}>View All ({pendingAppointments.length})</Text>
          </TouchableOpacity>
        </View>

        {activeAppointment ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('AppointmentDetail', { appointment: activeAppointment })}
            activeOpacity={0.9}
          >
            <GlassCard style={styles.spotlightCard}>
              <View style={styles.spotlightTopRow}>
                <View style={styles.patientAvatar}>
                  <Text style={styles.avatarInitials}>
                    {(activeApptUser.firstName?.[0] || 'P').toUpperCase()}
                  </Text>
                </View>

                <View style={styles.patientDetails}>
                  <Text style={styles.spotlightName}>
                    {activeApptUser.firstName} {activeApptUser.lastName || ''}
                  </Text>
                  <Text style={styles.spotlightSlot}>
                    {activeAppointment.timeSlot || '09:00 - 10:00 AM'}
                  </Text>
                </View>

                <StatusBadge status={activeAppointment.status} size="small" />
              </View>

              {/* Address */}
              <View style={styles.spotlightAddress}>
                <MapPin size={14} color={colors.primaryLight} style={{ marginTop: 2, marginRight: 6 }} />
                <Text style={styles.addressText} numberOfLines={2}>
                  {addressString}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.spotlightActions}>
                <TouchableOpacity
                  style={styles.actionBtnCall}
                  onPress={() => handleCallPatient(activeApptUser.phoneNumber || activeApptUser.phone)}
                  activeOpacity={0.8}
                >
                  <Phone size={15} color={colors.emeraldLight} />
                  <Text style={styles.actionBtnCallText}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnMap}
                  onPress={() => handleOpenMaps(addressString)}
                  activeOpacity={0.8}
                >
                  <Navigation size={15} color={colors.primaryLight} />
                  <Text style={styles.actionBtnMapText}>Navigate</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnProceed}
                  onPress={() => navigation.navigate('AppointmentDetail', { appointment: activeAppointment })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnProceedText}>Start</Text>
                  <ChevronRight size={15} color="#fff" />
                </TouchableOpacity>
              </View>
            </GlassCard>
          </TouchableOpacity>
        ) : (
          <GlassCard style={styles.emptySpotlight}>
            <CircleCheck size={32} color={colors.emeraldLight} />
            <Text style={styles.emptyTitle}>All Done</Text>
            <Text style={styles.emptyDesc}>No pending pickups</Text>
          </GlassCard>
        )}

        {/* Real-Time Processing & Tested Samples Lifecycle */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Activity size={16} color={colors.primaryLight} />
            <Text style={styles.sectionTitle}>Recent Samples</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Samples' })}>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentSamples && recentSamples.length > 0 ? (
          <View style={{ gap: 10 }}>
            {recentSamples.slice(0, 4).map((sample, idx) => {
              const test = sample.testCatalog || {};
              const user = sample.appointment?.user || {};
              const isProcessing = sample.status === 'Processing';
              const isAtLab = sample.status === 'At_Laboratory';
              const isCompleted = ['Report_Generated', 'Completed'].includes(sample.status);

              return (
                <TouchableOpacity
                  key={sample._id || idx}
                  style={styles.sampleTrackCard}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Samples', params: { tab: (isAtLab || isProcessing) ? 'queue' : 'transit' } })}
                  activeOpacity={0.8}
                >
                  <View style={styles.sampleTrackRow}>
                    <View style={[styles.sampleIconBox, isProcessing && { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                      {isProcessing ? (
                        <Activity size={18} color={colors.violetLight} />
                      ) : isAtLab ? (
                        <Layers size={18} color="#60a5fa" />
                      ) : isCompleted ? (
                        <CircleCheck size={18} color={colors.emeraldLight} />
                      ) : (
                        <TestTube size={18} color={colors.primaryLight} />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.sampleTrackBarcode}>{sample.barcode || sample._id?.slice(-8) || '—'}</Text>
                      <Text style={styles.sampleTrackTestName} numberOfLines={1}>
                        {test.testName || 'Test'}
                      </Text>
                      <Text style={styles.sampleTrackPatient}>
                        {user.firstName || 'Patient'} {user.lastName || ''}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <StatusBadge status={sample.status} size="small" />

                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <GlassCard style={styles.emptySampleCard}>
            <TestTube size={26} color={colors.textMuted} />
            <Text style={styles.emptySampleText}>No Samples Yet</Text>
          </GlassCard>
        )}

        {/* Quick Launchpad Shortcuts */}
        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Quick Actions</Text>
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('Appointments')}
            activeOpacity={0.7}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <Calendar size={18} color={colors.primaryLight} />
            </View>
            <Text style={styles.shortcutTitle}>Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Samples' })}
            activeOpacity={0.7}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
              <Layers size={18} color="#60a5fa" />
            </View>
            <Text style={styles.shortcutTitle}>Lab Drop</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('Earnings')}
            activeOpacity={0.7}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Wallet size={18} color={colors.emeraldLight} />
            </View>
            <Text style={styles.shortcutTitle}>Earnings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Ops Dispatch Hotline & Emergency Support Modal */}
      <OpsHelplineModal
        visible={helplineVisible}
        onClose={() => setHelplineVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 4,
  },
  sosHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  empBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  empBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  zoneText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  progressCard: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textCyan,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  progressIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressFooterText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  progressRemainingText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.amberLight,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryLight,
  },
  spotlightCard: {
    marginBottom: 8,
  },
  spotlightTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  patientDetails: {
    flex: 1,
  },
  spotlightName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  spotlightSlot: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  spotlightAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  addressText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    flex: 1,
  },
  spotlightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnCall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  actionBtnCallText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.emeraldLight,
  },
  actionBtnMap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  actionBtnMapText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryLight,
  },
  actionBtnProceed: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  actionBtnProceedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  emptySpotlight: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: 'rgba(12, 12, 12, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  shortcutIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shortcutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  shortcutSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  sampleTrackCard: {
    backgroundColor: 'rgba(12, 12, 12, 0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  sampleTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sampleIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleTrackBarcode: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryLight,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 0.5,
  },
  sampleTrackTestName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  sampleTrackPatient: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  sampleTrackHint: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  emptySampleCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  emptySampleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptySampleSub: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 3,
    lineHeight: 16,
  },
});

export default DashboardScreen;
