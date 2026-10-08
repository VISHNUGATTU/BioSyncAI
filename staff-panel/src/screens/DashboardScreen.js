import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
  Alert,
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
  MapPin,
  Calendar,
  Layers,
  Wallet,
  Headset,
  Bell,
  Volume2,
} from 'lucide-react-native';

import { colors, gradients, useTheme } from '../theme/colors';
import useAuthStore from '../store/authStore';
import useAppointmentStore from '../store/appointmentStore';
import DutyStatusSwitch from '../components/DutyStatusSwitch';
import MetricCard from '../components/MetricCard';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import OpsHelplineModal from '../components/OpsHelplineModal';
import NotificationModal from '../components/NotificationModal';
import staffApi from '../api/staffApi';
import { OfflineSyncBanner } from '../components/OfflineSyncBanner';
import webPushService from '../services/webPushService';

export const DashboardScreen = ({ navigation }) => {
  const { isDark } = useTheme();
  const staff = useAuthStore((state) => state.staff);
  const dutyStatus = useAuthStore((state) => state.dutyStatus);
  const setDutyStatus = useAuthStore((state) => state.setDutyStatus);

  const kpis = useAppointmentStore((state) => state.kpis);
  const pendingAppointments = useAppointmentStore(
    (state) => state.pendingAppointments
  );
  const activeAppointment = useAppointmentStore(
    (state) => state.activeAppointment
  );
  const recentSamples = useAppointmentStore(
    (state) => state.recentSamples
  );
  const loading = useAppointmentStore((state) => state.loading);
  const fetchDashboardData = useAppointmentStore(
    (state) => state.fetchDashboardData
  );

  const [refreshing, setRefreshing] = useState(false);
  const [helplineVisible, setHelplineVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifUnreadCount, setNotifUnreadCount] = useState(0);
  const [webAlertGranted, setWebAlertGranted] = useState(
    Platform.OS === 'web' && typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );
  const prevPendingCountRef = useRef(pendingAppointments?.length || 0);

  const fetchUnreadNotifs = async () => {
    try {
      const res = await staffApi.getNotifications({ unreadOnly: true });
      if (res && typeof res.unreadCount === 'number') {
        setNotifUnreadCount(res.unreadCount);
      } else if (res && Array.isArray(res.data)) {
        setNotifUnreadCount(res.data.filter((n) => !n.isRead).length);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      webPushService.registerServiceWorker();
    }
    fetchDashboardData();
    fetchUnreadNotifs();

    // 6s real-time poll for route assignments & dispatch alerts
    const interval = setInterval(() => {
      fetchUnreadNotifs();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Monitor incoming urgent dispatches
  useEffect(() => {
    const currentPending = pendingAppointments?.length || 0;
    if (currentPending > prevPendingCountRef.current && prevPendingCountRef.current > 0) {
      webPushService.triggerUrgentDispatchAlert({
        title: '🚨 Urgent Phlebotomy Dispatch Assigned',
        body: `You have ${currentPending} pending patient sample collections.`,
      });
    }
    prevPendingCountRef.current = currentPending;
  }, [pendingAppointments]);

  const handleTestOrEnableWebAlerts = async () => {
    if (Platform.OS === 'web') {
      const perm = await webPushService.requestPermission();
      setWebAlertGranted(perm === 'granted');
      webPushService.playMedicalAlertChime('urgent');
      Alert.alert(
        'Dispatcher Audio Alerts Active',
        'Hospital-grade audio chime verified. Desktop notifications will alert you for incoming urgent patient dispatches.'
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchDashboardData(),
        fetchUnreadNotifs(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCallPatient = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch((error) => {
      console.warn('Unable to open phone dialer:', error?.message || error);
    });
  };

  const handleOpenMaps = (addressText) => {
    if (!addressText) return;
    const query = encodeURIComponent(addressText);
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${query}`
    ).catch((error) => {
      console.warn('Unable to open maps:', error?.message || error);
    });
  };

  const activeApptUser = activeAppointment?.user || {};
  const activeApptAddress =
    activeAppointment?.address || activeApptUser.address || {};

  const addressString =
    typeof activeApptAddress === 'string'
      ? activeApptAddress
      : [
          activeApptAddress.houseNumber,
          activeApptAddress.street,
          activeApptAddress.landmark,
          activeApptAddress.city,
          activeApptAddress.pincode || activeApptAddress.postalCode,
        ]
          .filter(Boolean)
          .join(', ') || 'Address on file';

  const staffFirstName =
    staff?.name?.split(' ')?.[0] || staff?.firstName || 'Phlebotomist';

  const pendingCount = pendingAppointments?.length || 0;

  const progress = Math.min(
    Math.max(Number(kpis?.progress) || 0, 0),
    100
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.bgDark }]}
      edges={['top']}
    >
      {/* Offline Mode & Network Reconnection Sync Status Banner */}
      <OfflineSyncBanner />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.bgDark }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryLight}
            colors={[colors.primaryLight]}
            progressBackgroundColor={colors.bgCardElevated}
          />
        }
      >
        {/* =====================================================
            1. HEADER ROW: BRAND, GREETING, SOS & DUTY STATUS
        ====================================================== */}
        <View style={styles.headerRow}>
          <View style={styles.headerIdentity}>
            <View style={styles.brandMark}>
              <Activity
                size={18}
                color={colors.primaryLight}
                strokeWidth={2.4}
              />
            </View>

            <View style={styles.headerTextContainer}>
              <Text style={styles.greetingText} numberOfLines={1}>
                Hello, {staffFirstName}
              </Text>

              <View style={styles.badgeRow}>
                <View style={styles.empBadge}>
                  <Text style={styles.empBadgeText}>
                    {staff?.employeeId || 'EMP001'}
                  </Text>
                </View>

                <View style={styles.zoneSeparator} />

                <MapPin size={10} color={colors.textMuted} />

                <Text style={styles.zoneText} numberOfLines={1}>
                  {staff?.assignedZones?.[0] || 'Hyderabad Central'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerActions}>
            {Platform.OS === 'web' && (
              <TouchableOpacity
                style={styles.webAlertHeaderBtn}
                onPress={handleTestOrEnableWebAlerts}
                activeOpacity={0.8}
              >
                <Volume2
                  size={17}
                  color={webAlertGranted ? colors.cyan : colors.textMuted}
                  strokeWidth={2.2}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.notifHeaderBtn}
              onPress={() => setNotifVisible(true)}
              activeOpacity={0.8}
            >
              <Bell
                size={17}
                color={colors.primaryLight}
                strokeWidth={2.2}
              />
              {notifUnreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {notifUnreadCount > 9 ? '9+' : notifUnreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sosHeaderBtn}
              onPress={() => setHelplineVisible(true)}
              activeOpacity={0.8}
            >
              <Headset
                size={17}
                color={colors.primaryLight}
                strokeWidth={2.2}
              />
            </TouchableOpacity>

            <DutyStatusSwitch
              compact
              status={dutyStatus}
              onStatusChange={setDutyStatus}
            />
          </View>
        </View>

        {/* =====================================================
            2. SHIFT PROGRESS CARD
        ====================================================== */}
        {kpis && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Appointments', { filter: 'pending' })
            }
            activeOpacity={0.88}
            style={styles.progressTouchWrapper}
          >
            <GlassCard
              style={styles.progressCard}
              gradient={gradients.cardGradientCyan}
            >
              <View style={styles.progressHeader}>
                <View>
                  <Text style={styles.progressLabel}>SHIFT PROGRESS</Text>
                  <Text style={styles.progressValue}>{progress}%</Text>
                </View>

                <View style={styles.progressIcon}>
                  <TrendingUp
                    size={20}
                    color={colors.primaryLight}
                    strokeWidth={2.2}
                  />
                </View>
              </View>

              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: colors.primaryLight,
                    },
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

        {/* =====================================================
            3. OPERATIONAL METRICS (2X2 SYMMETRICAL GRID)
        ====================================================== */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCardWrapper}>
            <MetricCard
              icon={TestTube}
              title="Samples"
              value={kpis?.todaySamples ?? '—'}
              subtitle="Today"
              accentColor={colors.primaryLight}
              onPress={() =>
                navigation.navigate('Appointments', { filter: 'total' })
              }
            />
          </View>

          <View style={styles.metricCardWrapper}>
            <MetricCard
              icon={Clock}
              title="Pending"
              value={kpis?.pendingCollection ?? '—'}
              subtitle="Awaiting"
              accentColor={colors.amberLight}
              onPress={() =>
                navigation.navigate('Appointments', { filter: 'pending' })
              }
            />
          </View>

          <View style={styles.metricCardWrapper}>
            <MetricCard
              icon={Activity}
              title="Processing"
              value={kpis?.inProcessing ?? '—'}
              subtitle="In lab"
              accentColor={colors.purpleLight}
              onPress={() =>
                navigation.navigate('MainTabs', {
                  screen: 'Samples',
                  params: { tab: 'queue' },
                })
              }
            />
          </View>

          <View style={styles.metricCardWrapper}>
            <MetricCard
              icon={CircleCheck}
              title="Done"
              value={kpis?.completed ?? '—'}
              subtitle="Completed"
              accentColor={colors.emeraldLight}
              onPress={() =>
                navigation.navigate('Appointments', { filter: 'completed' })
              }
            />
          </View>
        </View>

        {/* =====================================================
            4. NEXT COLLECTION SPOTLIGHT CARD
        ====================================================== */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Next Collection</Text>
            <Text style={styles.sectionSubtitle}>
              Your upcoming field visit
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Appointments', { filter: 'pending' })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.sectionLink}>View All ({pendingCount})</Text>
          </TouchableOpacity>
        </View>

        {activeAppointment ? (
          <View style={styles.spotlightContainer}>
            <GlassCard
              style={styles.spotlightCard}
              gradient={gradients.cardGradientCyan}
            >
              {/* Patient Profile Row & Address wrapped in body touchable */}
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('AppointmentDetail', {
                    appointment: activeAppointment,
                  })
                }
                activeOpacity={0.88}
                style={styles.spotlightTouchBody}
              >
                {/* Patient Profile Row */}
                <View style={styles.spotlightTopRow}>
                  <View style={styles.patientAvatar}>
                    <Text style={styles.avatarInitials}>
                      {(activeApptUser.firstName?.[0] || 'P').toUpperCase()}
                      {(activeApptUser.lastName?.[0] || '').toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.patientDetails}>
                    <Text style={styles.spotlightName} numberOfLines={1}>
                      {activeApptUser.firstName || 'Patient'}{' '}
                      {activeApptUser.lastName || ''}
                    </Text>

                    <View style={styles.slotRow}>
                      <Clock size={11} color={colors.textMuted} />
                      <Text style={styles.spotlightSlot} numberOfLines={1}>
                        {activeAppointment.timeSlot || '09:00 - 10:00 AM'}
                      </Text>
                    </View>
                  </View>

                  <StatusBadge
                    status={activeAppointment.status}
                    size="small"
                  />
                </View>

                {/* Address Row */}
                <View style={styles.spotlightAddress}>
                  <View style={styles.addressIcon}>
                    <MapPin
                      size={13}
                      color={colors.primaryLight}
                      strokeWidth={2.2}
                    />
                  </View>

                  <Text style={styles.addressText} numberOfLines={2}>
                    {addressString}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Action Buttons Row - clean sibling, ZERO nested touchables */}
              <View style={styles.spotlightActions}>
                <TouchableOpacity
                  style={styles.actionBtnCall}
                  onPress={() =>
                    handleCallPatient(
                      activeApptUser.phoneNumber || activeApptUser.phone
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Phone
                    size={14}
                    color={colors.emeraldLight}
                    strokeWidth={2.2}
                  />
                  <Text style={styles.actionBtnCallText}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnMap}
                  onPress={() => handleOpenMaps(addressString)}
                  activeOpacity={0.8}
                >
                  <Navigation
                    size={14}
                    color={colors.primaryLight}
                    strokeWidth={2.2}
                  />
                  <Text style={styles.actionBtnMapText}>Navigate</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnProceed}
                  onPress={() =>
                    navigation.navigate('AppointmentDetail', {
                      appointment: activeAppointment,
                    })
                  }
                  activeOpacity={0.82}
                >
                  <Text style={styles.actionBtnProceedText}>
                    Start Collection
                  </Text>
                  <ChevronRight
                    size={15}
                    color="#FFFFFF"
                    strokeWidth={2.5}
                  />
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        ) : (
          <GlassCard style={styles.emptySpotlight}>
            <View style={styles.completedIcon}>
              <CircleCheck
                size={28}
                color={colors.emeraldLight}
                strokeWidth={2}
              />
            </View>
            <Text style={styles.emptyTitle}>All Done</Text>
            <Text style={styles.emptyDesc}>
              No pending pickups for your current queue.
            </Text>
          </GlassCard>
        )}

        {/* =====================================================
            5. RECENT SAMPLES SECTION
        ====================================================== */}
        <View style={[styles.sectionHeader, styles.recentSectionHeader]}>
          <View>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionTitleIcon}>
                <Activity
                  size={14}
                  color={colors.primaryLight}
                  strokeWidth={2.2}
                />
              </View>
              <Text style={styles.sectionTitle}>Recent Samples</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Current specimen lifecycle
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('MainTabs', { screen: 'Samples' })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentSamples && recentSamples.length > 0 ? (
          <View style={styles.samplesList}>
            {recentSamples.slice(0, 4).map((sample, idx) => {
              const test = sample.testCatalog || {};
              const user = sample.appointment?.user || {};

              const isProcessing = sample.status === 'Processing';
              const isAtLab = sample.status === 'At_Laboratory';
              const isCompleted = [
                'Report_Generated',
                'Completed',
              ].includes(sample.status);

              const sampleTab =
                isAtLab || isProcessing ? 'queue' : 'transit';

              return (
                <TouchableOpacity
                  key={sample._id || sample.id || idx}
                  style={styles.sampleTrackCard}
                  onPress={() =>
                    navigation.navigate('MainTabs', {
                      screen: 'Samples',
                      params: { tab: sampleTab },
                    })
                  }
                  activeOpacity={0.82}
                >
                  <View style={styles.sampleTrackRow}>
                    <View
                      style={[
                        styles.sampleIconBox,
                        isProcessing && styles.sampleIconProcessing,
                        isAtLab && styles.sampleIconLab,
                        isCompleted && styles.sampleIconCompleted,
                      ]}
                    >
                      {isProcessing ? (
                        <Activity
                          size={18}
                          color={colors.purpleLight}
                          strokeWidth={2.1}
                        />
                      ) : isAtLab ? (
                        <Layers
                          size={18}
                          color={colors.blueLight}
                          strokeWidth={2.1}
                        />
                      ) : isCompleted ? (
                        <CircleCheck
                          size={18}
                          color={colors.emeraldLight}
                          strokeWidth={2.1}
                        />
                      ) : (
                        <TestTube
                          size={18}
                          color={colors.primaryLight}
                          strokeWidth={2.1}
                        />
                      )}
                    </View>

                    <View style={styles.sampleDetails}>
                      <Text
                        style={styles.sampleTrackBarcode}
                        numberOfLines={1}
                      >
                        {sample.barcode || sample._id?.slice(-8) || '—'}
                      </Text>
                      <Text
                        style={styles.sampleTrackTestName}
                        numberOfLines={1}
                      >
                        {test.testName || 'Laboratory Specimen'}
                      </Text>
                      <Text
                        style={styles.sampleTrackPatient}
                        numberOfLines={1}
                      >
                        {user.firstName || 'Patient'}{' '}
                        {user.lastName || ''}
                      </Text>
                    </View>

                    <View style={styles.sampleStatus}>
                      <StatusBadge
                        status={sample.status}
                        size="small"
                      />
                      <ChevronRight
                        size={14}
                        color={colors.textMuted}
                        strokeWidth={2.2}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <GlassCard style={styles.emptySampleCard}>
            <View style={styles.emptySampleIcon}>
              <TestTube
                size={24}
                color={colors.textMuted}
                strokeWidth={1.8}
              />
            </View>
            <Text style={styles.emptySampleText}>No Samples Yet</Text>
            <Text style={styles.emptySampleSub}>
              Your recently collected specimens will appear here.
            </Text>
          </GlassCard>
        )}

        {/* =====================================================
            6. QUICK ACTIONS ROW
        ====================================================== */}
        <View style={styles.quickActionsHeader}>
          <View>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionSubtitle}>
              Common field operations
            </Text>
          </View>
        </View>

        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('Appointments')}
            activeOpacity={0.75}
          >
            <View style={[styles.shortcutIcon, styles.shortcutIconCyan]}>
              <Calendar
                size={18}
                color={colors.primaryLight}
                strokeWidth={2.2}
              />
            </View>
            <Text style={styles.shortcutTitle}>Schedule</Text>
            <Text style={styles.shortcutSub}>Visits</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() =>
              navigation.navigate('MainTabs', { screen: 'Samples' })
            }
            activeOpacity={0.75}
          >
            <View style={[styles.shortcutIcon, styles.shortcutIconBlue]}>
              <Layers
                size={18}
                color={colors.blueLight}
                strokeWidth={2.2}
              />
            </View>
            <Text style={styles.shortcutTitle}>Lab Drop</Text>
            <Text style={styles.shortcutSub}>Specimens</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('Earnings')}
            activeOpacity={0.75}
          >
            <View style={[styles.shortcutIcon, styles.shortcutIconGreen]}>
              <Wallet
                size={18}
                color={colors.emeraldLight}
                strokeWidth={2.2}
              />
            </View>
            <Text style={styles.shortcutTitle}>Earnings</Text>
            <Text style={styles.shortcutSub}>Revenue</Text>
          </TouchableOpacity>
        </View>

        {/* Background loading spinner for initial fetch */}
        {loading && !refreshing && !kpis && !activeAppointment && (
          <View style={styles.backgroundLoading}>
            <ActivityIndicator size="small" color={colors.primaryLight} />
          </View>
        )}
      </ScrollView>

      {/* SUPPORT MODAL */}
      <OpsHelplineModal
        visible={helplineVisible}
        onClose={() => setHelplineVisible(false)}
      />

      {/* NOTIFICATION MODAL */}
      <NotificationModal
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
        onNotificationCountChange={setNotifUnreadCount}
        navigation={navigation}
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
    backgroundColor: colors.bgDark,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 36,
  },

  /* =========================================================
     1. HEADER ROW
  ========================================================== */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    minHeight: 44,
  },

  headerIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    marginRight: 10,
  },

  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.alphaCyan10,
    borderWidth: 1,
    borderColor: colors.borderCyan,
    marginRight: 10,
  },

  headerTextContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },

  greetingText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    minWidth: 0,
  },

  empBadge: {
    backgroundColor: colors.alphaCyan10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderCyan,
  },

  empBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryLight,
    letterSpacing: 0.3,
  },

  zoneSeparator: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.textDisabled,
    marginHorizontal: 6,
  },

  zoneText: {
    flex: 1,
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 3,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  webAlertHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.alphaCyan10,
    borderWidth: 1,
    borderColor: colors.borderCyan,
    justifyContent: 'center',
    alignItems: 'center',
  },

  notifHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.alphaCyan10,
    borderWidth: 1,
    borderColor: colors.borderCyan,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: colors.roseLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.bgDark,
  },

  notifBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#ffffff',
  },

  sosHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.alphaCyan10,
    borderWidth: 1,
    borderColor: colors.borderCyan,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* =========================================================
     2. SHIFT PROGRESS
  ========================================================== */
  progressTouchWrapper: {
    width: '100%',
    marginBottom: 14,
  },

  progressCard: {
    width: '100%',
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  progressLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.primaryLight,
  },

  progressValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 2,
  },

  progressIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.alphaCyan10,
    borderWidth: 1,
    borderColor: colors.borderCyan,
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressBarTrack: {
    height: 7,
    backgroundColor: colors.glassStrong,
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    minWidth: 0,
    borderRadius: 4,
  },

  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  progressFooterText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  progressRemainingText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.amberLight,
  },

  /* =========================================================
     3. METRICS 2X2 GRID
  ========================================================== */
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 16,
  },

  metricCardWrapper: {
    width: '48.5%',
  },

  /* =========================================================
     4. SECTION HEADERS
  ========================================================== */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  recentSectionHeader: {
    marginTop: 16,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionTitleIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.alphaCyan10,
    marginRight: 7,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },

  sectionSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },

  sectionLink: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryLight,
  },

  /* =========================================================
     5. SPOTLIGHT CARD
  ========================================================== */
  spotlightContainer: {
    width: '100%',
  },

  spotlightTouchBody: {
    width: '100%',
  },

  spotlightCard: {
    width: '100%',
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
    backgroundColor: colors.alphaCyan10,
    borderWidth: 1,
    borderColor: colors.borderCyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  avatarInitials: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.primaryLight,
    letterSpacing: 0.4,
  },

  patientDetails: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },

  spotlightName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  spotlightSlot: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
  },

  spotlightAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },

  addressIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.alphaCyan10,
    marginRight: 8,
    marginTop: 1,
  },

  addressText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 17,
  },

  spotlightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  actionBtnCall: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.alphaEmerald10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.28)',
    borderRadius: 12,
    paddingHorizontal: 8,
  },

  actionBtnCallText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.emeraldLight,
  },

  actionBtnMap: {
    flex: 1.1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.alphaCyan10,
    borderWidth: 1,
    borderColor: colors.borderCyan,
    borderRadius: 12,
    paddingHorizontal: 8,
  },

  actionBtnMapText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryLight,
  },

  actionBtnProceed: {
    flex: 1.6,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
  },

  actionBtnProceedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  emptySpotlight: {
    alignItems: 'center',
    padding: 24,
  },

  completedIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.alphaEmerald10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 10,
  },

  emptyDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },

  /* =========================================================
     6. SAMPLES SECTION
  ========================================================== */
  samplesList: {
    gap: 9,
  },

  sampleTrackCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 12,
  },

  sampleTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sampleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.alphaCyan10,
    borderWidth: 1,
    borderColor: colors.borderCyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  sampleIconProcessing: {
    backgroundColor: colors.alphaCyan10,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },

  sampleIconLab: {
    backgroundColor: 'rgba(59, 130, 246, 0.10)',
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },

  sampleIconCompleted: {
    backgroundColor: colors.alphaEmerald10,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },

  sampleDetails: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },

  sampleTrackBarcode: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryLight,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 0.6,
  },

  sampleTrackTestName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },

  sampleTrackPatient: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },

  sampleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },

  emptySampleCard: {
    alignItems: 'center',
    padding: 22,
    borderRadius: 15,
  },

  emptySampleIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  emptySampleText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 8,
  },

  emptySampleSub: {
    fontSize: 10,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },

  /* =========================================================
     7. QUICK ACTIONS
  ========================================================== */
  quickActionsHeader: {
    marginTop: 16,
    marginBottom: 10,
  },

  shortcutsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  shortcutCard: {
    flex: 1,
    minHeight: 96,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  shortcutIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  shortcutIconCyan: {
    backgroundColor: colors.alphaCyan10,
    borderWidth: 1,
    borderColor: colors.borderCyan,
  },

  shortcutIconBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },

  shortcutIconGreen: {
    backgroundColor: colors.alphaEmerald10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },

  shortcutTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  shortcutSub: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },

  /* =========================================================
     8. BACKGROUND LOADING
  ========================================================== */
  backgroundLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
});

export default DashboardScreen;