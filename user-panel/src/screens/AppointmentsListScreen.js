import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  Clock,
  UserCheck,
  KeyRound,
  FileText,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  AlertCircle,
  ArrowLeft,
  Share2,
} from 'lucide-react-native';
import { useTheme } from '../theme/colors';
import { useUserAppointmentStore } from '../store/userAppointmentStore';
import { useAuthStore } from '../store/authStore';
import userApi from '../api/userApi';
import { getReportViewUrl } from '../api/axios';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import ReportViewerModal from '../components/ReportViewerModal';
import RescheduleModal from '../components/RescheduleModal';

const TABS = ['All', 'Active', 'Completed', 'Cancelled'];

const ACTIVE_STATUSES = [
  'Booked',
  'Pending',
  'Confirmed',
  'Assistant_Assigned',
  'Assigned',
  'On_The_Way',
  'On_Route',
  'Arrived',
  'Collecting',
  'Sample_Collected',
  'At_Laboratory',
  'Processing',
];

const CAN_MODIFY_STATUSES = [
  'Booked',
  'Pending',
  'Confirmed',
  'Assistant_Assigned',
  'Assigned',
  'On_The_Way',
  'On_Route',
];

export const AppointmentsListScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, fetchProfile } = useAuthStore();
  const { appointments, isLoading, fetchAppointments } = useUserAppointmentStore();

  const [activeTab, setActiveTab] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReportAppt, setSelectedReportAppt] = useState(null);
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchAppointments();
    if (fetchProfile) fetchProfile();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchAppointments(false),
      fetchProfile ? fetchProfile() : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [fetchAppointments, fetchProfile]);

  const filteredAppointments = (appointments || []).filter((item) => {
    if (activeTab === 'Active') return ACTIVE_STATUSES.includes(item.status);
    if (activeTab === 'Completed') return ['Completed', 'Report_Generated', 'Delivered'].includes(item.status);
    if (activeTab === 'Cancelled') return ['Cancelled', 'Failed', 'No_Show', 'Rejected'].includes(item.status);
    return true;
  });

  const handleOpenReschedule = (appt) => {
    const isPastException = ['Failed', 'No_Show', 'Rejected'].includes(appt.status);
    // Validate 8 hour clinical cutoff (Section 33 Policy) only for upcoming bookings
    if (!isPastException && appt.scheduledDate) {
      let scheduledTime = new Date(appt.scheduledDate).getTime();
      if (appt.timeSlot) {
        const match = appt.timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          let hours = parseInt(match[1], 10);
          const mins = parseInt(match[2], 10);
          const ampm = match[3].toUpperCase();
          if (ampm === 'PM' && hours < 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;
          const d = new Date(appt.scheduledDate);
          d.setHours(hours, mins, 0, 0);
          scheduledTime = d.getTime();
        }
      }
      const hoursUntil = (scheduledTime - Date.now()) / (1000 * 60 * 60);
      if (hoursUntil < 8 && hoursUntil > -1) {
        Alert.alert(
          'Reschedule Locked (Section 33)',
          'Home visit appointments cannot be modified within 8 hours of scheduled collection. This ensures allocated phlebotomist routes and cold chain sample integrity are maintained.',
          [{ text: 'Understood' }]
        );
        return;
      }
    }
    setRescheduleAppt(appt);
  };

  const handlePromptCancel = (appt) => {
    const currentStrikes = user?.strikeCount || 0;
    const strikesAfter = currentStrikes + 1;
    const willSuspend = strikesAfter >= 2;

    Alert.alert(
      'Cancel Diagnostic Visit?',
      `Section 33 Cancellation Policy & Strike Warning:\n\n• Current strikes: ${currentStrikes}/2\n• Cancelling this confirmed booking will issue Strike #${strikesAfter}.\n\n${
        willSuspend
          ? '⚠️ CRITICAL: Reaching 2 strikes will immediately SUSPEND your account from scheduling new home visits.'
          : 'Note: Accounts reaching 2 strikes are automatically suspended from home visit bookings.'
      }\n\nDo you wish to proceed with cancellation?`,
      [
        { text: 'Keep Visit', style: 'cancel' },
        {
          text: 'Confirm Cancellation',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancellingId(appt._id);
              const res = await userApi.cancelAppointment(appt._id);
              await fetchAppointments(false);
              if (fetchProfile) await fetchProfile();

              if (res.warning) {
                Alert.alert(
                  'Visit Cancelled with Strike',
                  `Your appointment has been cancelled.\n\nStrike count: ${res.strikeCount}/2.\nAccount status: ${res.accountStatus}.\n${
                    res.accountStatus === 'Suspended'
                      ? 'Your account has been suspended from scheduling new home visits.'
                      : 'Please note future cancellations may lead to account suspension.'
                  }`
                );
              } else {
                Alert.alert('Visit Cancelled', res.message || 'Appointment cancelled successfully.');
              }
            } catch (err) {
              const msg = err.response?.data?.message || err.message || 'Failed to cancel appointment.';
              Alert.alert('Cancellation Blocked', msg);
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const handleShareAppointmentReport = async (item) => {
    try {
      const testNames = Array.isArray(item.tests) && item.tests.length > 0
        ? item.tests.map((t) => (typeof t === 'string' ? t : t?.name || t?.title)).filter(Boolean).join(', ')
        : (item.testName || 'Comprehensive Diagnostic Panel');
      const barcode = item.sample?.barcode || item.barcode || 'BIO-SAMPLE';
      const verifiedBy = item.sample?.verifiedBy || 'Dr. Arvind Sharma, MD';
      const shareUrl = item.reportPdfUrl || getReportViewUrl(item._id);

      const shareMessage = `🏥 BIOSYNC AI — OFFICIAL DIAGNOSTIC REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Diagnostic Panel: ${testNames}
NABL Accreditation: ISO 15189:2022 Certified
Specimen Barcode: #${barcode}
Verification: Verified & Digitally Signed by ${verifiedBy}

🔗 Access Certified Diagnostic Web Report / PDF:
${shareUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sec. 1 & 47 Notice: This report represents certified wet-lab medical measurements issued by BioSync Diagnostics Central Lab.`;

      await Share.share(
        Platform.OS === 'ios'
          ? { message: shareMessage, url: shareUrl }
          : { title: `BioSync Lab Report - ${testNames}`, message: shareMessage },
        { dialogTitle: `Share Lab Report: ${testNames}` }
      );
    } catch (err) {
      console.warn('[Appointments] Share report error:', err.message);
    }
  };

  const renderAppointmentItem = ({ item }) => {
    const isActive = ACTIVE_STATUSES.includes(item.status);
    const canModify = CAN_MODIFY_STATUSES.includes(item.status);
    const isCancelling = cancellingId === item._id;

    const dateFormatted = item.scheduledDate
      ? new Date(item.scheduledDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Scheduled';

    return (
      <GlassCard
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#0c0e12' : '#ffffff',
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.testName, { color: colors.textPrimary }]}>
              {item.testCatalog?.testName || 'Diagnostic Panel'}
            </Text>
            <Text style={[styles.orderId, { color: colors.textMuted }]}>
              ID: #{item._id.slice(-6).toUpperCase()} • {dateFormatted}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        {/* Middle Details */}
        <View style={[styles.metaRow, { borderTopColor: colors.borderSubtle }]}>
          <View style={styles.metaItem}>
            <Clock size={12} color={colors.amberLight || '#f59e0b'} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {item.timeSlot || '08:00 AM'}
            </Text>
          </View>
          {item.labAssistant ? (
            <View style={styles.metaItem}>
              <UserCheck size={12} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {item.labAssistant.name}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Cancellation Notice if Cancelled */}
        {item.status === 'Cancelled' && item.cancellationReason && (
          <View
            style={[
              styles.cancellationNoticeBox,
              {
                backgroundColor: isDark ? 'rgba(244, 63, 94, 0.08)' : '#fff1f2',
                borderColor: isDark ? 'rgba(244, 63, 94, 0.25)' : '#fecdd3',
              },
            ]}
          >
            <AlertCircle size={12} color={colors.roseLight || '#f43f5e'} />
            <Text
              style={[
                styles.cancellationNoticeText,
                { color: colors.roseLight || '#f43f5e' },
              ]}
              numberOfLines={2}
            >
              {item.cancellationReason}
            </Text>
          </View>
        )}

        {/* Collection Exception Notice if Failed / No_Show / Rejected */}
        {['Failed', 'No_Show', 'Rejected'].includes(item.status) && (
          <View
            style={[
              styles.cancellationNoticeBox,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fff1f2',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecdd3',
              },
            ]}
          >
            <AlertCircle size={14} color="#ef4444" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#ef4444', marginBottom: 2 }}>
                Collection Non-Performance Notice
              </Text>
              <Text
                style={[
                  styles.cancellationNoticeText,
                  { color: isDark ? '#fca5a5' : '#b91c1c' },
                ]}
                numberOfLines={2}
              >
                {item.failureReason || item.cancellationReason || 'Field collection could not be completed.'}
                {item.failureNotes ? ` • ${item.failureNotes}` : ''}
              </Text>
            </View>
          </View>
        )}

        {/* Immediate Reschedule Recovery for Failed / Exception Visits */}
        {['Failed', 'No_Show', 'Rejected'].includes(item.status) && (
          <View style={[styles.modifyActionsRow, { borderTopColor: colors.borderSubtle }]}>
            <TouchableOpacity
              style={[
                styles.rescheduleBtn,
                {
                  flex: 1,
                  backgroundColor: isDark ? 'rgba(6, 182, 212, 0.12)' : 'rgba(8, 145, 178, 0.1)',
                  borderColor: isDark ? 'rgba(6, 182, 212, 0.4)' : 'rgba(8, 145, 178, 0.3)',
                },
              ]}
              onPress={() => handleOpenReschedule(item)}
              activeOpacity={0.8}
            >
              <RotateCcw size={13} color={colors.primary} />
              <Text style={[styles.rescheduleBtnText, { color: colors.primary, fontWeight: '800' }]}>
                RESCHEDULE VISIT NOW
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Active OTP & Track Action */}
        {isActive ? (
          <View style={[styles.otpActionRow, { borderTopColor: colors.borderSubtle }]}>
            {item.collectionOTP ? (
              <View
                style={[
                  styles.otpPill,
                  {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                  },
                ]}
              >
                <KeyRound size={12} color={colors.emeraldLight || '#10b981'} />
                <Text
                  style={[
                    styles.otpPillText,
                    { color: colors.emeraldLight || '#10b981' },
                  ]}
                >
                  OTP: {item.collectionOTP}
                </Text>
              </View>
            ) : (
              <View />
            )}

            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
              activeOpacity={0.8}
            >
              <Text style={[styles.trackBtnText, { color: colors.primary }]}>
                TRACK VISIT
              </Text>
              <ChevronRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Phase 1: Interactive Reschedule & Cancellation Action Row */}
        {canModify && (
          <View style={[styles.modifyActionsRow, { borderTopColor: colors.borderSubtle }]}>
            <TouchableOpacity
              style={[
                styles.rescheduleBtn,
                {
                  backgroundColor: isDark ? 'rgba(6, 182, 212, 0.08)' : 'rgba(8, 145, 178, 0.06)',
                  borderColor: isDark ? 'rgba(6, 182, 212, 0.25)' : 'rgba(8, 145, 178, 0.2)',
                },
              ]}
              onPress={() => handleOpenReschedule(item)}
              activeOpacity={0.8}
            >
              <RotateCcw size={12} color={colors.primary} />
              <Text style={[styles.rescheduleBtnText, { color: colors.primary }]}>
                RESCHEDULE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? 'rgba(244, 63, 94, 0.06)' : '#fff1f2',
                  borderColor: isDark ? 'rgba(244, 63, 94, 0.2)' : '#fecdd3',
                },
              ]}
              onPress={() => handlePromptCancel(item)}
              disabled={isCancelling}
              activeOpacity={0.8}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color={colors.roseLight || '#f43f5e'} />
              ) : (
                <>
                  <AlertTriangle size={12} color={colors.roseLight || '#f43f5e'} />
                  <Text
                    style={[
                      styles.cancelBtnText,
                      { color: colors.roseLight || '#f43f5e' },
                    ]}
                  >
                    CANCEL VISIT
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Completed Report Action */}
        {!isActive &&
        (['Completed', 'Report_Generated', 'Delivered'].includes(item.status) || !!item.sample) ? (
          <View style={[styles.completedActionRow, { borderTopColor: colors.borderSubtle, flexDirection: 'row', gap: 8 }]}>
            <TouchableOpacity
              style={[styles.viewReportBtn, { flex: 1, backgroundColor: colors.primary }]}
              onPress={() => setSelectedReportAppt(item)}
              activeOpacity={0.8}
            >
              <FileText size={13} color="#000000" />
              <Text style={styles.viewReportBtnText}>VIEW DIAGNOSTIC REPORT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.shareReportIconBtn,
                {
                  borderColor: 'rgba(16, 185, 129, 0.35)',
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                },
              ]}
              onPress={() => handleShareAppointmentReport(item)}
              activeOpacity={0.7}
            >
              <Share2 size={14} color="#10b981" />
            </TouchableOpacity>
          </View>
        ) : null}
      </GlassCard>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.headerTitleRow}>
          {navigation.canGoBack() && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              My Appointments
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Diagnostic tracking, rescheduling & cancellation management
            </Text>
          </View>
        </View>

        {/* Account Strike Status Indicator if user has strikes */}
        {user && user.strikeCount > 0 && (
          <View
            style={[
              styles.strikeStatusBar,
              {
                backgroundColor:
                  user.strikeCount >= 2
                    ? 'rgba(239, 68, 68, 0.12)'
                    : 'rgba(245, 158, 11, 0.12)',
                borderColor:
                  user.strikeCount >= 2
                    ? 'rgba(239, 68, 68, 0.3)'
                    : 'rgba(245, 158, 11, 0.3)',
              },
            ]}
          >
            <AlertTriangle
              size={13}
              color={user.strikeCount >= 2 ? '#ef4444' : '#f59e0b'}
            />
            <Text
              style={[
                styles.strikeStatusText,
                { color: user.strikeCount >= 2 ? '#ef4444' : '#f59e0b' },
              ]}
            >
              Cancellation Strikes: {user.strikeCount}/2 •{' '}
              {user.accountStatus === 'Suspended'
                ? 'Account Suspended (Sec 33)'
                : '1 more strike triggers suspension'}
            </Text>
          </View>
        )}

        {/* Tab Filters */}
        <View style={styles.tabsRow}>
          {TABS.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: isDark ? '#0d0d0d' : colors.cardSecondary || '#f1f5f9',
                    borderColor: colors.borderSubtle,
                  },
                  isSelected && [
                    styles.tabChipSelected,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ],
                ]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    { color: colors.textSecondary },
                    isSelected && styles.tabChipTextSelected,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item._id}
        renderItem={renderAppointmentItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <GlassCard
            style={[
              styles.emptyCard,
              {
                backgroundColor: isDark ? '#0c0e12' : '#ffffff',
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <Calendar size={32} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No Appointments Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {activeTab === 'Active'
                ? 'You do not have any ongoing home collections.'
                : activeTab === 'Cancelled'
                ? 'No cancelled appointments on record.'
                : 'Your booked diagnostic records will appear here.'}
            </Text>
            <TouchableOpacity
              style={[styles.bookShortcutBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('BookAppointment')}
              activeOpacity={0.8}
            >
              <Text style={styles.bookShortcutText}>SCHEDULE VISIT</Text>
            </TouchableOpacity>
          </GlassCard>
        }
      />

      <ReportViewerModal
        visible={!!selectedReportAppt}
        onClose={() => setSelectedReportAppt(null)}
        appointment={selectedReportAppt}
        navigation={navigation}
      />

      <RescheduleModal
        visible={!!rescheduleAppt}
        appointment={rescheduleAppt}
        onClose={() => setRescheduleAppt(null)}
        onSuccess={() => fetchAppointments()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
  },
  strikeStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  strikeStatusText: {
    fontSize: 10.5,
    fontWeight: '800',
    flex: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  tabChipSelected: {},
  tabChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  tabChipTextSelected: {
    color: '#000000',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  testName: {
    fontSize: 14,
    fontWeight: '800',
  },
  orderId: {
    fontSize: 11,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cancellationNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
  },
  cancellationNoticeText: {
    fontSize: 10.5,
    fontWeight: '700',
    flex: 1,
  },
  otpActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  otpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  otpPillText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modifyActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  rescheduleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  rescheduleBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    marginTop: 40,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 16,
  },
  bookShortcutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookShortcutText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
  completedActionRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  viewReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  viewReportBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  shareReportIconBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
});

export default AppointmentsListScreen;
