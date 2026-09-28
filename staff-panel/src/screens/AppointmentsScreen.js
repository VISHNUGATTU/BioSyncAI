import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, CalendarDays, Inbox } from 'lucide-react-native';
import { colors } from '../theme/colors';
import useAppointmentStore from '../store/appointmentStore';
import AppointmentCard from '../components/AppointmentCard';

export const AppointmentsScreen = ({ route, navigation }) => {
  const appointmentsList = useAppointmentStore((state) => state.appointmentsList);
  const fetchAppointmentsByCategory = useAppointmentStore((state) => state.fetchAppointmentsByCategory);
  const loading = useAppointmentStore((state) => state.loading);
  const initialCategory = route?.params?.filter || route?.params?.category || 'pending';
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (route?.params?.filter) {
      setActiveCategory(route.params.filter);
    } else if (route?.params?.category) {
      setActiveCategory(route.params.category);
    }
  }, [route?.params?.filter, route?.params?.category]);

  useEffect(() => {
    fetchAppointmentsByCategory(activeCategory);
  }, [activeCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointmentsByCategory(activeCategory);
    setRefreshing(false);
  };

  const categories = [
    { id: 'pending', label: 'Pending' },
    { id: 'processing', label: 'In Progress' },
    { id: 'completed', label: 'Done' },
    { id: 'total', label: 'All' },
  ];

  const filteredAppointments = useMemo(() => {
    if (!search.trim()) return appointmentsList;
    const q = search.toLowerCase();
    return appointmentsList.filter((appt) => {
      const patient = `${appt.user?.firstName || ''} ${appt.user?.lastName || ''}`.toLowerCase();
      const phone = (appt.user?.phoneNumber || appt.user?.phone || '').toLowerCase();
      const address = (typeof appt.address === 'string' ? appt.address : `${appt.address?.street || ''} ${appt.address?.city || ''}`).toLowerCase();
      const status = (appt.status || '').toLowerCase();
      return patient.includes(q) || phone.includes(q) || address.includes(q) || status.includes(q);
    });
  }, [appointmentsList, search]);

  const handleSelectAppointment = (appointment) => {
    navigation.navigate('AppointmentDetail', { appointment });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Appointments</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patient, address, phone..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Category Tabs */}
        <View style={styles.tabScroll}>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* List */}
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primaryLight} />
            <Text style={styles.loaderText}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAppointments}
            keyExtractor={(item, index) => item?._id || item?.id || String(index)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primaryLight}
              />
            }
            renderItem={({ item }) => (
              <AppointmentCard
                appointment={item}
                onPress={handleSelectAppointment}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Inbox size={40} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Appointments</Text>
                <Text style={styles.emptySubtitle}>Pull down to refresh</Text>
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
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 12, 0.7)',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
  },
  tabScroll: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  tabChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabChipActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});

export default AppointmentsScreen;
