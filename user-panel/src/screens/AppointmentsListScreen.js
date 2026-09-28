import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  Clock,
  UserCheck,
  KeyRound,
  FileText,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useUserAppointmentStore } from '../store/userAppointmentStore';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';

const TABS = ['All', 'Active', 'Completed'];

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

export const AppointmentsListScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { appointments, isLoading, fetchAppointments } = useUserAppointmentStore();
  const [activeTab, setActiveTab] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments(false);
    setRefreshing(false);
  }, []);

  const filteredAppointments = (appointments || []).filter((item) => {
    if (activeTab === 'Active') return ACTIVE_STATUSES.includes(item.status);
    if (activeTab === 'Completed') return ['Completed', 'Report_Generated'].includes(item.status);
    return true;
  });

  const renderAppointmentItem = ({ item }) => {
    const isActive = ACTIVE_STATUSES.includes(item.status);
    const dateFormatted = item.scheduledDate
      ? new Date(item.scheduledDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Scheduled';

    return (
      <GlassCard style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.testName}>
              {item.testCatalog?.testName || 'Diagnostic Panel'}
            </Text>
            <Text style={styles.orderId}>
              ID: #{item._id.slice(-6).toUpperCase()} • {dateFormatted}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        {/* Middle Details */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={12} color={colors.amberLight} />
            <Text style={styles.metaText}>{item.timeSlot || '08:00 AM'}</Text>
          </View>
          {item.labAssistant ? (
            <View style={styles.metaItem}>
              <UserCheck size={12} color={colors.cyan} />
              <Text style={styles.metaText}>{item.labAssistant.name}</Text>
            </View>
          ) : null}
        </View>

        {/* Active OTP & Track Action */}
        {isActive ? (
          <View style={styles.otpActionRow}>
            {item.collectionOTP ? (
              <View style={styles.otpPill}>
                <KeyRound size={12} color={colors.emeraldLight} />
                <Text style={styles.otpPillText}>OTP: {item.collectionOTP}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.8}
            >
              <Text style={styles.trackBtnText}>TRACK VISIT</Text>
              <ChevronRight size={14} color={colors.cyan} />
            </TouchableOpacity>
          </View>
        ) : null}
      </GlassCard>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Appointments</Text>
        <Text style={styles.headerSubtitle}>
          Complete diagnostic records & real-time dispatch tracking
        </Text>

        {/* Tab Filters */}
        <View style={styles.tabsRow}>
          {TABS.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabChip, isSelected && styles.tabChipSelected]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.tabChipText, isSelected && styles.tabChipTextSelected]}
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
            tintColor={colors.cyan}
            colors={[colors.cyan]}
          />
        }
        ListEmptyComponent={
          <GlassCard style={styles.emptyCard}>
            <Calendar size={32} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Appointments Found</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'Active'
                ? 'You do not have any ongoing home collections.'
                : 'Your booked diagnostic records will appear here.'}
            </Text>
            <TouchableOpacity
              style={styles.bookShortcutBtn}
              onPress={() => navigation.navigate('BookAppointment')}
              activeOpacity={0.8}
            >
              <Text style={styles.bookShortcutText}>SCHEDULE VISIT</Text>
            </TouchableOpacity>
          </GlassCard>
        }
      />
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
    paddingTop: 14,
    paddingBottom: 12,
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
    marginBottom: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabChipSelected: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyanLight,
  },
  tabChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  tabChipTextSelected: {
    color: '#000000',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
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
    color: '#ffffff',
  },
  orderId: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  otpActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  otpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  otpPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.emeraldLight,
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
    color: colors.cyan,
    letterSpacing: 0.5,
  },
  emptyCard: {
    backgroundColor: '#0a0a0a',
    padding: 30,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 16,
  },
  bookShortcutBtn: {
    backgroundColor: colors.cyan,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookShortcutText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
});

export default AppointmentsListScreen;
