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
  ArrowUpRight,
} from 'lucide-react-native';

import { colors, useTheme } from '../theme/colors';
import useAppointmentStore from '../store/appointmentStore';
import GlassCard from '../components/GlassCard';

export const EarningsScreen = () => {
  const { isDark } = useTheme();
  const earnings = useAppointmentStore(
    (state) => state.earnings
  );

  const fetchEarnings = useAppointmentStore(
    (state) => state.fetchEarnings
  );

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    setLoading(true);

    try {
      await fetchEarnings();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await fetchEarnings();
    } finally {
      setRefreshing(false);
    }
  };

  const totalEarnings =
    Number(earnings?.totalEarnings) || 0;

  const todaysEarnings =
    Number(earnings?.todaysEarnings) || 0;

  const completedPickups =
    Number(earnings?.completedPickups) || 0;

  const history = Array.isArray(
    earnings?.history
  )
    ? earnings.history
    : [];

  const averagePerPickup =
    completedPickups > 0
      ? totalEarnings / completedPickups
      : 0;

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString(
      'en-IN'
    )}`;
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.bgDark }]}
      edges={['top']}
    >
      <View style={[styles.container, { backgroundColor: colors.bgDark }]}>
        {/* =====================================================
            HEADER
        ====================================================== */}

        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Wallet
              size={19}
              color={colors.emeraldLight}
              strokeWidth={2.2}
            />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.title}>
              Earnings
            </Text>

            <Text style={styles.subtitle}>
              Your collection earnings and settlement
              history
            </Text>
          </View>
        </View>

        {/* =====================================================
            INITIAL LOADING
        ====================================================== */}

        {loading && !earnings ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingIcon}>
              <ActivityIndicator
                size="small"
                color={colors.emeraldLight}
              />
            </View>

            <Text style={styles.loadingTitle}>
              Loading earnings
            </Text>

            <Text style={styles.loadingSubtitle}>
              Fetching your latest settlement data...
            </Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item, index) =>
              item?.id ||
              item?._id ||
              String(index)
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              styles.listContent
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.emeraldLight}
                colors={[colors.emeraldLight]}
                progressBackgroundColor={
                  colors.bgCardElevated
                }
              />
            }
            ListHeaderComponent={
              <>
                {/* =================================================
                    HERO EARNINGS CARD
                ================================================== */}

                <GlassCard
                  style={styles.heroCard}
                  gradient={
                    colors.cardGradientEmerald
                  }
                >
                  <View
                    style={styles.heroGlow}
                  />

                  <View
                    style={styles.heroTopRow}
                  >
                    <View
                      style={
                        styles.walletIconWrapper
                      }
                    >
                      <Wallet
                        size={22}
                        color={
                          colors.emeraldLight
                        }
                        strokeWidth={2}
                      />
                    </View>

                    <View
                      style={
                        styles.verifiedPill
                      }
                    >
                      <CircleCheck
                        size={12}
                        color={
                          colors.emeraldLight
                        }
                        strokeWidth={2.4}
                      />

                      <Text
                        style={
                          styles.verifiedText
                        }
                      >
                        Verified
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.heroLabel}>
                    TOTAL EARNINGS
                  </Text>

                  <View
                    style={styles.totalAmountRow}
                  >
                    <IndianRupee
                      size={25}
                      color={
                        colors.emeraldLight
                      }
                      strokeWidth={2.4}
                    />

                    <Text
                      style={styles.heroValue}
                    >
                      {Number(
                        totalEarnings
                      ).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View
                    style={styles.heroDivider}
                  />

                  <View
                    style={styles.heroSubRow}
                  >
                    <View
                      style={
                        styles.heroMetric
                      }
                    >
                      <View
                        style={
                          styles.heroMetricIcon
                        }
                      >
                        <TrendingUp
                          size={13}
                          color={
                            colors.emeraldLight
                          }
                        />
                      </View>

                      <Text
                        style={
                          styles.heroSubLabel
                        }
                      >
                        Earned Today
                      </Text>

                      <Text
                        style={
                          styles.heroSubValue
                        }
                      >
                        {formatCurrency(
                          todaysEarnings
                        )}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.heroMetric
                      }
                    >
                      <View
                        style={
                          styles.heroMetricIcon
                        }
                      >
                        <CircleCheck
                          size={13}
                          color={
                            colors.emeraldLight
                          }
                        />
                      </View>

                      <Text
                        style={
                          styles.heroSubLabel
                        }
                      >
                        Completed Visits
                      </Text>

                      <Text
                        style={
                          styles.heroSubValue
                        }
                      >
                        {completedPickups} trips
                      </Text>
                    </View>
                  </View>
                </GlassCard>

                {/* =================================================
                    EARNINGS SUMMARY
                ================================================== */}

                <View
                  style={styles.summaryGrid}
                >
                  <View
                    style={styles.summaryCard}
                  >
                    <View
                      style={[
                        styles.summaryIcon,
                        styles.summaryIconCyan,
                      ]}
                    >
                      <Calendar
                        size={16}
                        color={
                          colors.primaryLight
                        }
                        strokeWidth={2.1}
                      />
                    </View>

                    <Text
                      style={
                        styles.summaryLabel
                      }
                    >
                      TODAY
                    </Text>

                    <Text
                      style={
                        styles.summaryValue
                      }
                    >
                      {formatCurrency(
                        todaysEarnings
                      )}
                    </Text>
                  </View>

                  <View
                    style={styles.summaryCard}
                  >
                    <View
                      style={[
                        styles.summaryIcon,
                        styles.summaryIconGreen,
                      ]}
                    >
                      <Wallet
                        size={16}
                        color={
                          colors.emeraldLight
                        }
                        strokeWidth={2.1}
                      />
                    </View>

                    <Text
                      style={
                        styles.summaryLabel
                      }
                    >
                      AVG / VISIT
                    </Text>

                    <Text
                      style={
                        styles.summaryValue
                      }
                    >
                      {formatCurrency(
                        averagePerPickup
                      )}
                    </Text>
                  </View>

                  <View
                    style={styles.summaryCard}
                  >
                    <View
                      style={[
                        styles.summaryIcon,
                        styles.summaryIconAmber,
                      ]}
                    >
                      <Coins
                        size={16}
                        color={
                          colors.amberLight
                        }
                        strokeWidth={2.1}
                      />
                    </View>

                    <Text
                      style={
                        styles.summaryLabel
                      }
                    >
                      PICKUPS
                    </Text>

                    <Text
                      style={
                        styles.summaryValue
                      }
                    >
                      {completedPickups}
                    </Text>
                  </View>
                </View>

                {/* =================================================
                    SETTLEMENT INFO
                ================================================== */}

                <GlassCard
                  style={styles.infoCard}
                >
                  <View
                    style={styles.infoIcon}
                  >
                    <ShieldCheck
                      size={19}
                      color={
                        colors.primaryLight
                      }
                      strokeWidth={2.1}
                    />
                  </View>

                  <View
                    style={styles.infoContent}
                  >
                    <Text
                      style={styles.infoTitle}
                    >
                      Weekly Bank Transfer
                    </Text>

                    <Text
                      style={styles.infoSubtitle}
                    >
                      Verified pickup earnings are
                      settled through your registered
                      payment account.
                    </Text>
                  </View>

                  <ArrowUpRight
                    size={16}
                    color={colors.textMuted}
                  />
                </GlassCard>

                {/* =================================================
                    HISTORY HEADER
                ================================================== */}

                <View
                  style={styles.historyHeader}
                >
                  <View>
                    <Text
                      style={
                        styles.historyTitle
                      }
                    >
                      Earnings History
                    </Text>

                    <Text
                      style={
                        styles.historySubtitle
                      }
                    >
                      Completed pickup settlements
                    </Text>
                  </View>

                  <View
                    style={
                      styles.historyCount
                    }
                  >
                    <Text
                      style={
                        styles.historyCountText
                      }
                    >
                      {history.length}
                    </Text>
                  </View>
                </View>
              </>
            }
            renderItem={({ item }) => {
              const dateStr = item?.date
                ? new Date(
                    item.date
                  ).toLocaleDateString(
                    'en-IN',
                    {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )
                : 'Recent';

              const amount =
                Number(item?.amount) || 100;

              return (
                <View
                  style={styles.ledgerCard}
                >
                  <View
                    style={styles.ledgerLeft}
                  >
                    <View
                      style={
                        styles.checkCircle
                      }
                    >
                      <CircleCheck
                        size={16}
                        color={
                          colors.emeraldLight
                        }
                        strokeWidth={2.2}
                      />
                    </View>

                    <View
                      style={
                        styles.ledgerDetails
                      }
                    >
                      <Text
                        style={
                          styles.ledgerPatient
                        }
                        numberOfLines={1}
                      >
                        {item?.patientName ||
                          'Completed Sample Pickup'}
                      </Text>

                      <View
                        style={
                          styles.ledgerDateRow
                        }
                      >
                        <Clock
                          size={10}
                          color={
                            colors.textMuted
                          }
                        />

                        <Text
                          style={
                            styles.ledgerDate
                          }
                        >
                          {dateStr}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={
                      styles.creditBadge
                    }
                  >
                    <Text
                      style={
                        styles.creditBadgeText
                      }
                    >
                      +₹
                      {amount.toLocaleString(
                        'en-IN'
                      )}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View
                style={styles.emptyContainer}
              >
                <View
                  style={styles.emptyIcon}
                >
                  <Coins
                    size={28}
                    color={colors.textMuted}
                    strokeWidth={1.8}
                  />
                </View>

                <Text
                  style={styles.emptyTitle}
                >
                  No Earnings Yet
                </Text>

                <Text
                  style={styles.emptySubtitle}
                >
                  Completed and verified sample
                  pickups will appear here.
                </Text>
              </View>
            }
            ListFooterComponent={
              history.length > 0 ? (
                <View
                  style={styles.footerNote}
                >
                  <ShieldCheck
                    size={13}
                    color={colors.textMuted}
                  />

                  <Text
                    style={styles.footerNoteText}
                  >
                    Earnings shown are based on
                    completed pickup records.
                  </Text>
                </View>
              ) : null
            }
          />
        )}
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
    backgroundColor: colors.bgDark,
  },

  /* =========================================================
     HEADER
  ========================================================== */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.alphaEmerald10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.28)',
    marginRight: 11,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },

  subtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 3,
  },

  /* =========================================================
     LIST
  ========================================================== */

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  /* =========================================================
     HERO CARD
  ========================================================== */

  heroCard: {
    marginBottom: 12,
    overflow: 'hidden',
  },

  heroGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor:
      'rgba(16, 185, 129, 0.055)',
    right: -60,
    top: -70,
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
  },

  walletIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.alphaEmerald10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.alphaEmerald10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
  },

  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.emeraldLight,
    letterSpacing: 0.3,
  },

  heroLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.textMuted,
  },

  totalAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  heroValue: {
    fontSize: 35,
    fontWeight: '900',
    color: colors.emeraldLight,
    letterSpacing: -1.2,
    marginLeft: 2,
  },

  heroDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 16,
  },

  heroSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },

  heroMetric: {
    flex: 1,
  },

  heroMetricIcon: {
    width: 25,
    height: 25,
    borderRadius: 8,
    backgroundColor: colors.alphaEmerald10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  heroSubLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
  },

  heroSubValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 3,
  },

  /* =========================================================
     SUMMARY
  ========================================================== */

  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },

  summaryCard: {
    flex: 1,
    minHeight: 102,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 14,
    padding: 11,
  },

  summaryIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  summaryIconCyan: {
    backgroundColor: colors.alphaCyan10,
    borderWidth: 1,
    borderColor: colors.borderCyan,
  },

  summaryIconGreen: {
    backgroundColor: colors.alphaEmerald10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.22)',
  },

  summaryIconAmber: {
    backgroundColor: colors.alphaAmber10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.22)',
  },

  summaryLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.7,
  },

  summaryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 3,
  },

  /* =========================================================
     INFO CARD
  ========================================================== */

  infoCard: {
    marginBottom: 21,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.alphaCyan10,
    borderWidth: 1,
    borderColor: colors.borderCyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  infoSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: 3,
  },

  /* =========================================================
     HISTORY
  ========================================================== */

  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },

  historyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  historySubtitle: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 3,
  },

  historyCount: {
    minWidth: 28,
    height: 25,
    borderRadius: 9,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassStrong,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  historyCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
  },

  ledgerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
  },

  ledgerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },

  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.alphaEmerald10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  ledgerDetails: {
    flex: 1,
    minWidth: 0,
  },

  ledgerPatient: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  ledgerDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  ledgerDate: {
    fontSize: 9,
    color: colors.textMuted,
    marginLeft: 4,
  },

  creditBadge: {
    backgroundColor: colors.alphaEmerald10,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.24)',
    marginLeft: 8,
  },

  creditBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.emeraldLight,
  },

  /* =========================================================
     EMPTY
  ========================================================== */

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 13,
  },

  emptySubtitle: {
    fontSize: 10,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 5,
    maxWidth: 280,
  },

  /* =========================================================
     LOADING
  ========================================================== */

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  loadingIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.alphaEmerald10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: 14,
  },

  loadingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  loadingSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 5,
    textAlign: 'center',
  },

  /* =========================================================
     FOOTER
  ========================================================== */

  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 6,
  },

  footerNoteText: {
    fontSize: 9,
    color: colors.textMuted,
  },
});

export default EarningsScreen;