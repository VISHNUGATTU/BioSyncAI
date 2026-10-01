import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  CalendarDays,
  Inbox,
  SlidersHorizontal,
  X,
  RefreshCw,
  AlertCircle,
} from 'lucide-react-native';

import { colors, useTheme } from '../theme/colors';
import useAppointmentStore from '../store/appointmentStore';
import AppointmentCard from '../components/AppointmentCard';
import mapNavigationService from '../services/mapNavigationService';

export const AppointmentsScreen = ({ route, navigation }) => {
  const { isDark } = useTheme();
  const appointmentsList = useAppointmentStore(
    (state) => state.appointmentsList
  );

  const fetchAppointmentsByCategory = useAppointmentStore(
    (state) => state.fetchAppointmentsByCategory
  );

  const loading = useAppointmentStore(
    (state) => state.loading
  );

  const error = useAppointmentStore(
    (state) => state.error
  );

  const initialCategory =
    route?.params?.filter ||
    route?.params?.category ||
    'pending';

  const [activeCategory, setActiveCategory] =
    useState(initialCategory);

  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (route?.params?.filter) {
      setActiveCategory(route.params.filter);
    } else if (route?.params?.category) {
      setActiveCategory(route.params.category);
    }
  }, [
    route?.params?.filter,
    route?.params?.category,
  ]);

  useEffect(() => {
    fetchAppointmentsByCategory(activeCategory);
  }, [activeCategory]);

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await fetchAppointmentsByCategory(activeCategory);
    } finally {
      setRefreshing(false);
    }
  };

  const categories = [
    {
      id: 'pending',
      label: 'Pending',
      icon: CalendarDays,
    },
    {
      id: 'processing',
      label: 'In Progress',
      icon: RefreshCw,
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: Inbox,
    },
    {
      id: 'total',
      label: 'All',
      icon: SlidersHorizontal,
    },
  ];

  const filteredAppointments = useMemo(() => {
    if (!Array.isArray(appointmentsList)) {
      return [];
    }

    if (!search.trim()) {
      return appointmentsList;
    }

    const q = search.trim().toLowerCase();

    return appointmentsList.filter((appt) => {
      const patient = `${appt?.user?.firstName || ''} ${
        appt?.user?.lastName || ''
      }`.toLowerCase();

      const phone = (
        appt?.user?.phoneNumber ||
        appt?.user?.phone ||
        ''
      ).toLowerCase();

      const address =
        typeof appt?.address === 'string'
          ? appt.address.toLowerCase()
          : `${appt?.address?.street || ''} ${
              appt?.address?.city || ''
            } ${appt?.address?.pincode || ''}`.toLowerCase();

      const status = (
        appt?.status || ''
      ).toLowerCase();

      const appointmentId = (
        appt?._id ||
        appt?.id ||
        ''
      ).toLowerCase();

      return (
        patient.includes(q) ||
        phone.includes(q) ||
        address.includes(q) ||
        status.includes(q) ||
        appointmentId.includes(q)
      );
    });
  }, [appointmentsList, search]);

  const handleSelectAppointment = (appointment) => {
    navigation.navigate('AppointmentDetail', {
      appointment,
    });
  };

  const handleCallPatient = (phoneOrAppt, appt) => {
    const rawPhone =
      typeof phoneOrAppt === 'string'
        ? phoneOrAppt
        : appt?.patient?.phone ||
          appt?.user?.phoneNumber ||
          appt?.user?.phone ||
          appt?.address?.phone ||
          appt?.phone;
    if (!rawPhone) {
      Alert.alert(
        'Phone Unavailable',
        'No phone number is registered for this patient.'
      );
      return;
    }
    Linking.openURL(`tel:${rawPhone}`).catch(() => {
      Alert.alert('Call Error', 'Could not open phone dialer.');
    });
  };

  const handleMapPatient = (appt) => {
    const address =
      appt?.address ||
      appt?.patient?.address ||
      appt?.location;
    const coords =
      address?.coordinates ||
      appt?.location?.coordinates ||
      (appt?.latitude && appt?.longitude
        ? { latitude: appt.latitude, longitude: appt.longitude }
        : null);
    const patientName =
      appt?.patient?.name ||
      appt?.user?.name ||
      'Patient';
    mapNavigationService.openNavigation(address, coords, patientName);
  };

  const clearSearch = () => {
    setSearch('');
  };

  const getCategoryCount = (categoryId) => {
    if (!Array.isArray(appointmentsList)) {
      return 0;
    }

    if (categoryId === activeCategory) {
      return appointmentsList.length;
    }

    return 0;
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
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <CalendarDays
                size={19}
                color={colors.primaryLight}
                strokeWidth={2.2}
              />
            </View>

            <View>
              <Text style={styles.title}>
                Appointments
              </Text>

              <Text style={styles.subtitle}>
                Manage today&apos;s collection visits
              </Text>
            </View>
          </View>

          <View style={styles.totalPill}>
            <Text style={styles.totalPillValue}>
              {Array.isArray(appointmentsList)
                ? appointmentsList.length
                : 0}
            </Text>

            <Text style={styles.totalPillLabel}>
              VISITS
            </Text>
          </View>
        </View>

        {/* =====================================================
            SEARCH
        ====================================================== */}
        <View style={[styles.searchWrapper, { backgroundColor: colors.bgCard, borderColor: colors.borderDefault }]}>
          <Search
            size={17}
            color={colors.textMuted}
            strokeWidth={2}
          />

          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search patient, phone, address..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />

          {search.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={clearSearch}
              activeOpacity={0.7}
            >
              <X
                size={15}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* =====================================================
            CATEGORY FILTERS
        ====================================================== */}
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>
            Appointment Queue
          </Text>

          <View style={styles.filterIndicator}>
            <View style={styles.filterIndicatorDot} />
            <Text style={styles.filterIndicatorText}>
              {activeCategory === 'total'
                ? 'All visits'
                : categories.find(
                    (item) =>
                      item.id === activeCategory
                  )?.label || 'Pending'}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScrollView}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => {
            const isActive =
              activeCategory === cat.id;

            const Icon = cat.icon;

            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  isActive &&
                    styles.categoryChipActive,
                ]}
                onPress={() =>
                  setActiveCategory(cat.id)
                }
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    isActive &&
                      styles.categoryIconActive,
                  ]}
                >
                  <Icon
                    size={14}
                    color={
                      isActive
                        ? colors.primaryLight
                        : colors.textMuted
                    }
                    strokeWidth={2.2}
                  />
                </View>

                <Text
                  style={[
                    styles.categoryText,
                    isActive &&
                      styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* =====================================================
            SEARCH RESULT / LIST HEADER
        ====================================================== */}
        <View style={styles.listHeader}>
          <View>
            <Text style={styles.listTitle}>
              {search.trim()
                ? 'Search Results'
                : 'Scheduled Visits'}
            </Text>

            <Text style={styles.listSubtitle}>
              {filteredAppointments.length}{' '}
              {filteredAppointments.length === 1
                ? 'appointment'
                : 'appointments'}
              {search.trim()
                ? ' matching your search'
                : ''}
            </Text>
          </View>

          {search.trim() && (
            <TouchableOpacity
              onPress={clearSearch}
              style={styles.clearFilterButton}
              activeOpacity={0.7}
            >
              <X
                size={13}
                color={colors.textSecondary}
              />
              <Text
                style={styles.clearFilterText}
              >
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* =====================================================
            ERROR STATE
        ====================================================== */}
        {error && !loading && !refreshing ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorIcon}>
              <AlertCircle
                size={26}
                color={colors.roseLight}
              />
            </View>

            <Text style={styles.errorTitle}>
              Unable to load appointments
            </Text>

            <Text style={styles.errorMessage}>
              {error}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRefresh}
              activeOpacity={0.8}
            >
              <RefreshCw
                size={15}
                color="#fff"
              />

              <Text style={styles.retryButtonText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : loading && !refreshing && (!filteredAppointments || filteredAppointments.length === 0) ? (
          /* =====================================================
              LOADING STATE
          ====================================================== */
          <View style={styles.loaderContainer}>
            <View style={styles.loaderIcon}>
              <ActivityIndicator
                size="small"
                color={colors.primaryLight}
              />
            </View>

            <Text style={styles.loaderTitle}>
              Loading appointments
            </Text>

            <Text style={styles.loaderText}>
              Syncing your collection queue...
            </Text>
          </View>
        ) : (
          /* =====================================================
              APPOINTMENT LIST
          ====================================================== */
          <FlatList
            data={filteredAppointments}
            keyExtractor={(item, index) =>
              item?._id ||
              item?.id ||
              `appointment-${index}`
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              filteredAppointments.length === 0 &&
                styles.listContentEmpty,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primaryLight}
                colors={[colors.primaryLight]}
                progressBackgroundColor={
                  colors.bgCardElevated
                }
              />
            }
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.appointmentWrapper,
                  index ===
                    filteredAppointments.length -
                      1 &&
                    styles.lastAppointment,
                ]}
              >
                <AppointmentCard
                  appointment={item}
                  onPress={handleSelectAppointment}
                  onCall={handleCallPatient}
                  onMap={handleMapPatient}
                />
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconOuter}>
                  <View style={styles.emptyIconInner}>
                    {search.trim() ? (
                      <Search
                        size={27}
                        color={colors.primaryLight}
                        strokeWidth={1.8}
                      />
                    ) : (
                      <Inbox
                        size={27}
                        color={colors.primaryLight}
                        strokeWidth={1.8}
                      />
                    )}
                  </View>
                </View>

                <Text style={styles.emptyTitle}>
                  {search.trim()
                    ? 'No matching appointments'
                    : 'No appointments found'}
                </Text>

                <Text
                  style={styles.emptySubtitle}
                >
                  {search.trim()
                    ? 'Try searching with another patient name, phone number, address, or appointment ID.'
                    : 'There are no appointments in this category right now. Pull down to refresh the queue.'}
                </Text>

                {search.trim() ? (
                  <TouchableOpacity
                    style={styles.emptyAction}
                    onPress={clearSearch}
                    activeOpacity={0.8}
                  >
                    <X
                      size={15}
                      color="#fff"
                    />

                    <Text
                      style={styles.emptyActionText}
                    >
                      Clear Search
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.emptyAction}
                    onPress={onRefresh}
                    activeOpacity={0.8}
                  >
                    <RefreshCw
                      size={15}
                      color="#fff"
                    />

                    <Text
                      style={styles.emptyActionText}
                    >
                      Refresh Queue
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.alphaCyan10,
    borderWidth: 1,
    borderColor: colors.borderCyan,
    marginRight: 12,
  },

  title: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
    fontWeight: '500',
  },

  totalPill: {
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: colors.bgCardElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  totalPillValue: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '800',
    color: colors.primaryLight,
  },

  totalPillLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 2,
  },

  /* =========================================================
     SEARCH
  ========================================================== */

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },

  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    marginLeft: 10,
    paddingVertical: 0,
  },

  clearSearchButton: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassStrong,
  },

  /* =========================================================
     FILTER HEADER
  ========================================================== */

  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 6,
  },

  filterTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },

  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  filterIndicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primaryLight,
  },

  filterIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },

  /* =========================================================
     CATEGORY CHIPS
  ========================================================== */

  categoryScrollView: {
    flexGrow: 0,
    height: 42,
    marginBottom: 2,
  },

  categoryScroll: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },

  categoryChip: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  categoryChipActive: {
    backgroundColor: colors.alphaCyan10,
    borderColor: colors.borderCyanStrong,
  },

  categoryIcon: {
    width: 25,
    height: 25,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    marginRight: 7,
  },

  categoryIconActive: {
    backgroundColor: colors.alphaCyan15,
  },

  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  categoryTextActive: {
    color: colors.primaryLight,
    fontWeight: '800',
  },

  /* =========================================================
     LIST HEADER
  ========================================================== */

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },

  listTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  listSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 3,
  },

  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  clearFilterText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  /* =========================================================
     LIST
  ========================================================== */

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  listContentEmpty: {
    flexGrow: 1,
  },

  appointmentWrapper: {
    width: '100%',
    marginBottom: 12,
  },

  lastAppointment: {
    marginBottom: 4,
  },

  /* =========================================================
     LOADING
  ========================================================== */

  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  loaderIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.alphaCyan10,
    borderWidth: 1,
    borderColor: colors.borderCyan,
    marginBottom: 14,
  },

  loaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  loaderText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 5,
  },

  /* =========================================================
     ERROR
  ========================================================== */

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  errorIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.alphaRose10,
    borderWidth: 1,
    borderColor: colors.rose + '35',
    marginBottom: 15,
  },

  errorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },

  errorMessage: {
    fontSize: 11,
    lineHeight: 17,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 300,
  },

  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },

  retryButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  /* =========================================================
     EMPTY
  ========================================================== */

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 55,
  },

  emptyIconOuter: {
    width: 76,
    height: 76,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.alphaCyan05,
    borderWidth: 1,
    borderColor: colors.borderCyan,
  },

  emptyIconInner: {
    width: 54,
    height: 54,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.alphaCyan10,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },

  emptySubtitle: {
    fontSize: 11,
    lineHeight: 17,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 320,
  },

  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 18,
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },

  emptyActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
});

export default AppointmentsScreen;