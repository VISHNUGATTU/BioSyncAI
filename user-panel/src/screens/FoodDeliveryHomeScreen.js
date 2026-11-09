import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ShieldCheck,
  AlertTriangle,
  Activity,
  Flame,
  Search,
  ChevronRight,
  Clock,
  Sparkles,
  Users,
  Footprints,
  Info,
  CheckCircle2,
  Lock,
  Unlock,
  Heart,
  Droplets,
  RotateCcw,
  UtensilsCrossed,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import foodDeliveryApi from '../api/foodDeliveryApi';
import GlassCard from '../components/GlassCard';

const CUISINE_FILTERS = [
  'All Kitchens',
  'Diabetic Safe',
  'Heart Care',
  'High Protein',
  'Low Glycemic',
  'A2 Ghee & Wood Pressed',
];

export default function FoodDeliveryHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, latestVitals } = useAuthStore();

  // Mode: 'VITALS_GUARD' | 'CHEAT_MODE_OVERRIDE'
  const [orderMode, setOrderMode] = useState('VITALS_GUARD');
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All Kitchens');
  const [activeAmbulation, setActiveAmbulation] = useState(null);
  const [modeModalVisible, setModeModalVisible] = useState(false);

  // Live Vitals Baseline
  const currentGlucose = latestVitals?.glucoseFasting || latestVitals?.currentCGMGlucose || 96;
  const currentSBP = latestVitals?.systolic || 118;
  const currentDBP = latestVitals?.diastolic || 76;

  const loadData = useCallback(async () => {
    try {
      const res = await foodDeliveryApi.getRestaurants();
      if (res?.success && Array.isArray(res.restaurants)) {
        setRestaurants(res.restaurants);
      } else {
        // Fallback seed kitchens if server is cold
        setRestaurants(getFallbackRestaurants());
      }

      // Check active ambulation burn status
      try {
        const ambRes = await foodDeliveryApi.getActiveAmbulation();
        if (ambRes?.success && ambRes?.progress?.active) {
          setActiveAmbulation(ambRes.progress);
        } else {
          setActiveAmbulation(null);
        }
      } catch (e) {
        setActiveAmbulation(null);
      }
    } catch (err) {
      console.warn('[FoodDeliveryHome] Load warning:', err?.message || err);
      setRestaurants(getFallbackRestaurants());
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const toggleMode = () => {
    if (orderMode === 'VITALS_GUARD') {
      Alert.alert(
        '⚠️ Activate Cheat Mode Override?',
        'Cheat Mode unlocks high-glycemic dishes at your discretion. BioSync AI will generate a mandatory 4-hour in-silico forecast, pre-bite sequencing, and postprandial ambulation burn target.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'I Accept & Unlock',
            style: 'destructive',
            onPress: () => setOrderMode('CHEAT_MODE_OVERRIDE'),
          },
        ]
      );
    } else {
      setOrderMode('VITALS_GUARD');
    }
  };

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch =
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisines?.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedFilter === 'All Kitchens') return true;
    if (selectedFilter === 'Diabetic Safe') return r.cuisines?.includes('Diabetic-Safe') || r.oilQualityIndex >= 90;
    if (selectedFilter === 'Heart Care') return r.cookingMediums?.some((m) => m.toLowerCase().includes('mustard') || m.toLowerCase().includes('olive'));
    if (selectedFilter === 'High Protein') return r.cuisines?.includes('High Protein') || r.cuisines?.includes('Biryani');
    if (selectedFilter === 'Low Glycemic') return r.oilQualityIndex >= 85;
    if (selectedFilter === 'A2 Ghee & Wood Pressed') return r.cookingMediums?.some((m) => m.toLowerCase().includes('ghee') || m.toLowerCase().includes('wood'));
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.bgDark }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.bgSurface, borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              METABOLIC NUTRITION OS
            </Text>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              BioSync <Text style={{ color: '#10B981' }}>Eats</Text>
            </Text>
          </View>

          {/* Dual-Mode Toggle Button */}
          <TouchableOpacity
            onPress={toggleMode}
            activeOpacity={0.8}
            style={[
              styles.modePill,
              orderMode === 'VITALS_GUARD'
                ? { backgroundColor: isDark ? 'rgba(6, 78, 59, 0.7)' : '#ecfdf5', borderColor: '#10B981' }
                : { backgroundColor: isDark ? 'rgba(120, 53, 15, 0.7)' : '#fffbeb', borderColor: '#F59E0B' },
            ]}
          >
            {orderMode === 'VITALS_GUARD' ? (
              <>
                <ShieldCheck size={16} color="#10B981" strokeWidth={2.5} />
                <Text style={[styles.modePillText, { color: '#10B981' }]}>VITALS GUARD</Text>
                <Lock size={12} color="#10B981" />
              </>
            ) : (
              <>
                <Flame size={16} color="#F59E0B" strokeWidth={2.5} />
                <Text style={[styles.modePillText, { color: '#F59E0B' }]}>CHEAT OVERRIDE</Text>
                <Unlock size={12} color="#F59E0B" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Live Patient Vitals Banner */}
        <View style={[styles.vitalsBanner, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
          <View style={styles.vitalItem}>
            <View style={styles.vitalIconWrap}>
              <Droplets size={14} color="#10B981" />
            </View>
            <View>
              <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>GLUCOSE</Text>
              <Text style={[styles.vitalValue, { color: colors.textPrimary }]}>
                {currentGlucose} <Text style={styles.vitalUnit}>mg/dL</Text>
              </Text>
            </View>
          </View>

          <View style={[styles.vitalDivider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.vitalItem}>
            <View style={styles.vitalIconWrap}>
              <Heart size={14} color="#EC4899" />
            </View>
            <View>
              <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>BLOOD PRESSURE</Text>
              <Text style={[styles.vitalValue, { color: colors.textPrimary }]}>
                {currentSBP}/{currentDBP} <Text style={styles.vitalUnit}>mmHg</Text>
              </Text>
            </View>
          </View>

          <View style={[styles.vitalDivider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.vitalItem}>
            <View style={styles.vitalIconWrap}>
              <Activity size={14} color="#06B6D4" />
            </View>
            <View>
              <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>STATUS</Text>
              <Text style={[styles.vitalStatusText, { color: '#10B981' }]}>
                {orderMode === 'VITALS_GUARD' ? 'Gated Safe' : 'Simulation On'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
      >
        {/* Active Ambulation Widget (If active Cheat Mode order has pending steps) */}
        {activeAmbulation && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              Alert.alert(
                'Live Postprandial Ambulation',
                `Target: ${activeAmbulation.targetSteps} steps\nCompleted: ${activeAmbulation.stepsCompleted} steps\nRemaining: ${activeAmbulation.remainingSteps} steps\nEstimated Glucose Cleared: ${activeAmbulation.glucoseBurnedGrams}g`,
                [
                  {
                    text: '+500 Test Steps',
                    onPress: async () => {
                      await foodDeliveryApi.streamAmbulationSteps(500);
                      loadData();
                    },
                  },
                  { text: 'OK' },
                ]
              )
            }
          >
            <GlassCard style={[styles.ambulationCard, { borderColor: '#F59E0B' }]}>
              <View style={styles.ambulationHeader}>
                <View style={styles.ambulationTitleRow}>
                  <Footprints size={18} color="#F59E0B" />
                  <Text style={[styles.ambulationTitle, { color: '#F59E0B' }]}>
                    Active Postprandial Ambulation Target
                  </Text>
                </View>
                <Text style={[styles.ambulationPercent, { color: '#F59E0B' }]}>
                  {activeAmbulation.percentCompleted || 0}%
                </Text>
              </View>
              <Text style={[styles.ambulationDesc, { color: colors.textMuted }]}>
                {activeAmbulation.stepsCompleted} of {activeAmbulation.targetSteps} steps completed. Skeletal muscle GLUT-4 glucose clearance in progress.
              </Text>
              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, activeAmbulation.percentCompleted || 0)}%` },
                  ]}
                />
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}

        {/* Joint Family Plating Banner */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('FamilyPlatingGuide')}
        >
          <GlassCard style={styles.familyBanner}>
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.15)', 'rgba(6, 78, 59, 0.05)']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.familyBannerContent}>
              <View style={styles.familyIconWrap}>
                <Users size={24} color="#10B981" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.tagRow}>
                  <Text style={styles.familyTag}>PATENTED OPTIMIZER</Text>
                </View>
                <Text style={[styles.familyTitle, { color: colors.textPrimary }]}>
                  Joint Family Handi Plating Guide
                </Text>
                <Text style={[styles.familyDesc, { color: colors.textMuted }]}>
                  Order 1kg common Biryani or Dal. BioSync plates individual gram portions for Dadaji (T2D+CKD), Papaji (BP) & Aman (Athlete).
                </Text>
              </View>
              <ChevronRight size={20} color="#10B981" />
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
          <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search kitchens, low-GI meals, cooking oils..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginRight: 8 }}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {CUISINE_FILTERS.map((filter) => {
            const isSelected = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? '#10B981' : colors.bgCardElevated,
                    borderColor: isSelected ? '#10B981' : colors.borderSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? '#ffffff' : colors.textMuted, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Certified Kitchens Header */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Certified Cloud Kitchens
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              FSSAI Verified • Oil Quality Index (OQI) Audited
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredRestaurants.length} Verified</Text>
          </View>
        </View>

        {/* Kitchen List */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 40 }} />
        ) : filteredRestaurants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <UtensilsCrossed size={40} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Kitchens Found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Try adjusting your search or cuisine filter.
            </Text>
          </View>
        ) : (
          filteredRestaurants.map((kitchen) => (
            <TouchableOpacity
              key={kitchen._id || kitchen.id}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate('RestaurantMenu', {
                  restaurantId: kitchen._id || kitchen.id,
                  restaurant: kitchen,
                  orderMode,
                })
              }
            >
              <GlassCard style={styles.kitchenCard}>
                <View style={styles.kitchenHeaderRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.kitchenName, { color: colors.textPrimary }]}>
                      {kitchen.name}
                    </Text>
                    <Text style={[styles.kitchenAddress, { color: colors.textMuted }]} numberOfLines={1}>
                      {kitchen.address?.area || kitchen.location?.address || 'Banjara Hills, Hyderabad'}
                    </Text>
                  </View>

                  {/* Oil Quality Index (OQI) Badge */}
                  <View
                    style={[
                      styles.oqiBadge,
                      {
                        backgroundColor:
                          kitchen.oilQualityIndex >= 90
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        borderColor:
                          kitchen.oilQualityIndex >= 90 ? '#10B981' : '#F59E0B',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.oqiScore,
                        { color: kitchen.oilQualityIndex >= 90 ? '#10B981' : '#F59E0B' },
                      ]}
                    >
                      OQI {kitchen.oilQualityIndex || 88}
                    </Text>
                    <Text style={styles.oqiLabel}>OIL AUDITED</Text>
                  </View>
                </View>

                {/* Cooking Mediums & Cuisines Chips */}
                <View style={styles.mediumsRow}>
                  {kitchen.cookingMediums?.slice(0, 2).map((medium, idx) => (
                    <View key={idx} style={[styles.mediumChip, { borderColor: colors.borderSubtle }]}>
                      <Text style={[styles.mediumChipText, { color: colors.textSecondary }]}>
                        {medium}
                      </Text>
                    </View>
                  ))}
                  <View style={[styles.fssaiChip, { borderColor: '#10B981' }]}>
                    <ShieldCheck size={11} color="#10B981" />
                    <Text style={styles.fssaiChipText}>FSSAI 5★</Text>
                  </View>
                </View>

                {/* Card Footer Info */}
                <View style={[styles.cardFooter, { borderTopColor: colors.borderSubtle }]}>
                  <View style={styles.footerItem}>
                    <Clock size={13} color={colors.textMuted} />
                    <Text style={[styles.footerText, { color: colors.textMuted }]}>
                      {kitchen.avgPreparationTimeMin || 25} mins
                    </Text>
                  </View>
                  <Text style={[styles.footerDot, { color: colors.textMuted }]}>•</Text>
                  <View style={styles.footerItem}>
                    <Text style={[styles.footerText, { color: colors.textMuted }]}>
                      ₹{kitchen.costForTwo || 450} for two
                    </Text>
                  </View>
                  <Text style={[styles.footerDot, { color: colors.textMuted }]}>•</Text>
                  <View style={styles.footerItem}>
                    <Text
                      style={[
                        styles.modeBadgeText,
                        { color: orderMode === 'VITALS_GUARD' ? '#10B981' : '#F59E0B' },
                      ]}
                    >
                      {orderMode === 'VITALS_GUARD' ? 'Safe Dishes Gated' : 'Cheat Permitted'}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// Fallback seed restaurants in case of network unavailability
function getFallbackRestaurants() {
  return [
    {
      _id: 'rest_001',
      name: 'Vedic Glycemic Kitchen',
      cuisines: ['Ayurvedic Therapeutic', 'Diabetic-Safe', 'South Indian'],
      oilQualityIndex: 96,
      cookingMediums: ['Wood-Pressed Mustard Oil', 'Pure A2 Desi Cow Ghee'],
      avgPreparationTimeMin: 20,
      costForTwo: 420,
      address: { area: 'Banjara Hills, Road No. 12, Hyderabad' },
      fssaiLicenseNumber: '13624014000101',
    },
    {
      _id: 'rest_002',
      name: 'Nizami Royal Metabolic Cloud',
      cuisines: ['Hyderabadi', 'High Protein', 'Multi-Generational'],
      oilQualityIndex: 91,
      cookingMediums: ['Wood-Pressed Sesame Oil', 'A2 Ghee'],
      avgPreparationTimeMin: 30,
      costForTwo: 650,
      address: { area: 'Jubilee Hills, Hyderabad' },
      fssaiLicenseNumber: '13624014000202',
    },
    {
      _id: 'rest_003',
      name: 'Amritsari Low-Glycemic Dhaba',
      cuisines: ['North Indian', 'Diabetic-Safe', 'High Fiber'],
      oilQualityIndex: 88,
      cookingMediums: ['Cold-Pressed Mustard Oil'],
      avgPreparationTimeMin: 22,
      costForTwo: 380,
      address: { area: 'Madhapur, Hitech City, Hyderabad' },
      fssaiLicenseNumber: '13624014000303',
    },
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  vitalsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  vitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vitalIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  vitalValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  vitalUnit: {
    fontSize: 10,
    fontWeight: '500',
  },
  vitalStatusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  vitalDivider: {
    width: 1,
    height: 24,
  },
  scrollContent: {
    padding: 16,
  },
  ambulationCard: {
    marginBottom: 14,
    borderWidth: 1.5,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  ambulationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ambulationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ambulationTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  ambulationPercent: {
    fontSize: 14,
    fontWeight: '900',
  },
  ambulationDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  familyBanner: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    overflow: 'hidden',
  },
  familyBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  familyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagRow: {
    marginBottom: 2,
  },
  familyTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.8,
  },
  familyTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  familyDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  filterScroll: {
    paddingBottom: 14,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  countBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  kitchenCard: {
    marginBottom: 12,
  },
  kitchenHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kitchenName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  kitchenAddress: {
    fontSize: 11,
  },
  oqiBadge: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  oqiScore: {
    fontSize: 12,
    fontWeight: '900',
  },
  oqiLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  mediumsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  mediumChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  mediumChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  fssaiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    gap: 4,
  },
  fssaiChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 6,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerDot: {
    fontSize: 10,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
});
