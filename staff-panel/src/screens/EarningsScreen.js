import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Wallet,
  TrendingUp,
  Clock,
  CircleCheck,
  Calendar,
  IndianRupee,
  Coins,
  ShieldCheck,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import useAppointmentStore from '../store/appointmentStore';
import GlassCard from '../components/GlassCard';

export const EarningsScreen = () => {
  const earnings = useAppointmentStore((state) => state.earnings);
  const fetchEarnings = useAppointmentStore((state) => state.fetchEarnings);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    setLoading(true);
    await fetchEarnings();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEarnings();
    setRefreshing(false);
  };

  const totalEarnings = earnings?.totalEarnings || 0;
  const todaysEarnings = earnings?.todaysEarnings || 0;
  const completedPickups = earnings?.completedPickups || 0;
  const history = earnings?.history || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Earnings</Text>
        </View>

        <FlatList
          data={history}
          keyExtractor={(item, index) => item.id || String(index)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primaryLight}
            />
          }
          ListHeaderComponent={
            <>
              {/* Main Total Card */}
              <GlassCard style={styles.heroCard} gradient={colors.cardGradientEmerald}>
                <View style={styles.heroTopRow}>
                  <View style={styles.walletIconWrapper}>
                    <Wallet size={22} color={colors.emeraldLight} />
                  </View>
                  <View style={styles.incentivePill}>
                    <Coins size={12} color={colors.emeraldLight} />
                    <Text style={styles.incentiveText}>₹100 / verified pickup</Text>
                  </View>
                </View>

                <Text style={styles.heroLabel}>TOTAL EARNINGS</Text>
                <Text style={styles.heroValue}>₹{totalEarnings.toLocaleString('en-IN')}</Text>

                <View style={styles.heroDivider} />

                <View style={styles.heroSubRow}>
                  <View>
                    <Text style={styles.heroSubLabel}>Earned Today</Text>
                    <Text style={styles.heroSubValue}>₹{todaysEarnings.toLocaleString('en-IN')}</Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.heroSubLabel}>Completed Visits</Text>
                    <Text style={styles.heroSubValue}>{completedPickups} trips</Text>
                  </View>
                </View>
              </GlassCard>

              {/* Settlement Info — minimal */}
              <GlassCard style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <ShieldCheck size={18} color={colors.primaryLight} />
                  <Text style={styles.infoTitle}>Weekly Bank Transfer</Text>
                </View>
              </GlassCard>

              <Text style={styles.historyHeaderTitle}>HISTORY</Text>
            </>
          }
          renderItem={({ item }) => {
            const dateStr = item.date
              ? new Date(item.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent';

            return (
              <View style={styles.ledgerCard}>
                <View style={styles.ledgerLeft}>
                  <View style={styles.checkCircle}>
                    <CircleCheck size={16} color={colors.emeraldLight} />
                  </View>
                  <View>
                    <Text style={styles.ledgerPatient}>{item.patientName || 'Completed Sample Pickup'}</Text>
                    <Text style={styles.ledgerDate}>{dateStr}</Text>
                  </View>
                </View>

                <View style={styles.creditBadge}>
                  <Text style={styles.creditBadgeText}>+₹{item.amount || 100}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Coins size={36} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Pickups Yet</Text>
              </View>
            )
          }
        />
      </View>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  heroCard: {
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  walletIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  incentivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  incentiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.emeraldLight,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.textMuted,
  },
  heroValue: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.emeraldLight,
    letterSpacing: -1,
    marginTop: 4,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 14,
  },
  heroSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroSubLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  heroSubValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  historyHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginBottom: 10,
  },
  ledgerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(12, 12, 12, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  ledgerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerPatient: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ledgerDate: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  creditBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  creditBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.emeraldLight,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: '80%',
  },
});

export default EarningsScreen;
