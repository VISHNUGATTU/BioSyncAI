import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Utensils,
  Clock,
  Flame,
  Sparkles,
  TrendingUp,
  Scan,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Calendar,
  Activity,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import userApi from '../api/userApi';
import GlassCard from '../components/GlassCard';
import DataProvenanceBadge from '../components/DataProvenanceBadge';
import HealthTimelineScreen from './HealthTimelineScreen';

const MEAL_FILTERS = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'];

export const FoodHistoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [activeSegment, setActiveSegment] = useState('timeline');
  const [foodLogs, setFoodLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');

  const fetchHistory = async () => {
    try {
      const res = await userApi.getFoodHistory();
      const list = res.data || res.foodLogs || [];
      if (res.success && Array.isArray(list)) {
        setFoodLogs(list);
      } else {
        setFoodLogs([]);
      }
    } catch (e) {
      console.log('[FoodHistory] Fetch error:', e.message);
      setFoodLogs([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, []);

  const filteredLogs = foodLogs.filter((log) => {
    if (selectedFilter === 'All') return true;
    return (log.mealType || 'Lunch').toLowerCase() === selectedFilter.toLowerCase();
  });

  // Aggregate stats
  const totalCalories = filteredLogs.reduce(
    (acc, curr) => acc + (curr.nutrients?.calories || 0) * (curr.consumedQuantity || 1),
    0
  );
  const totalMeals = filteredLogs.length;
  const avgSpike = totalMeals > 0
    ? Math.round(
        filteredLogs.reduce((acc, curr) => acc + (curr.predictedImpact?.glucoseSpike || 18), 0) /
          totalMeals
      )
    : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.bgDark }]}>
      {/* Top App Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {activeSegment === 'timeline' ? 'Longitudinal Health Records' : 'Food Intelligence History'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {activeSegment === 'timeline'
              ? 'Unified clinical timeline across vitals, labs & nutrition'
              : 'Longitudinal food intake, portion telemetry & glycemic impact'}
          </Text>
        </View>

        {activeSegment === 'food' && (
          <TouchableOpacity
            style={styles.scanHeaderBtn}
            onPress={() => navigation.navigate('Scan')}
            activeOpacity={0.8}
          >
            <Scan size={14} color="#000000" />
            <Text style={styles.scanHeaderBtnText}>SCAN MEAL</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Segment Switcher */}
      <View
        style={[
          styles.segmentContainer,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeSegment === 'timeline' && [
              styles.segmentBtnActive,
              { backgroundColor: colors.primary },
            ],
          ]}
          onPress={() => setActiveSegment('timeline')}
          activeOpacity={0.8}
        >
          <Activity
            size={14}
            color={activeSegment === 'timeline' ? '#000000' : colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentBtnText,
              {
                color: activeSegment === 'timeline' ? '#000000' : colors.textSecondary,
                fontWeight: activeSegment === 'timeline' ? '800' : '600',
              },
            ]}
          >
            Unified Health Timeline
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeSegment === 'food' && [
              styles.segmentBtnActive,
              { backgroundColor: colors.primary },
            ],
          ]}
          onPress={() => setActiveSegment('food')}
          activeOpacity={0.8}
        >
          <Utensils
            size={14}
            color={activeSegment === 'food' ? '#000000' : colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentBtnText,
              {
                color: activeSegment === 'food' ? '#000000' : colors.textSecondary,
                fontWeight: activeSegment === 'food' ? '800' : '600',
              },
            ]}
          >
            Food Intelligence
          </Text>
        </TouchableOpacity>
      </View>

      {activeSegment === 'timeline' ? (
        <HealthTimelineScreen navigation={navigation} embedded={true} />
      ) : (
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
        {/* Metric Summary Strip */}
        <View style={styles.statsStrip}>
          <GlassCard style={styles.statCard}>
            <View style={styles.statHeader}>
              <Flame size={14} color="#f97316" />
              <Text style={styles.statLabel}>CALORIES</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {Math.round(totalCalories)}
              <Text style={styles.statUnit}> kcal</Text>
            </Text>
            <Text style={styles.statSub}>Logged intake</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={styles.statHeader}>
              <Utensils size={14} color={colors.cyan} />
              <Text style={styles.statLabel}>MEALS LOGGED</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalMeals}</Text>
            <Text style={styles.statSub}>Confirmed items</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={styles.statHeader}>
              <TrendingUp size={14} color={colors.amberLight} />
              <Text style={styles.statLabel}>AVG GLUCOSE SURGE</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              +{avgSpike}
              <Text style={styles.statUnit}> mg/dL</Text>
            </Text>
            <Text style={styles.statSub}>Glycemic index</Text>
          </GlassCard>
        </View>

        {/* Meal Type Filter Chips */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {MEAL_FILTERS.map((filter) => {
              const isSelected = selectedFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isDark ? '#0d0d0d' : '#f1f5f9',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                    },
                    isSelected && styles.filterChipSelected,
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isSelected ? '#000000' : colors.textSecondary },
                      isSelected && styles.filterChipTextSelected,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* History List */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.cyan} />
            <Text style={styles.loadingText}>Fetching nutritional history from DB...</Text>
          </View>
        ) : filteredLogs.length > 0 ? (
          <View style={styles.historyList}>
            {filteredLogs.map((item) => {
              const formattedDate = new Date(item.createdAt || Date.now()).toLocaleDateString(
                'en-US',
                { month: 'short', day: 'numeric' }
              );
              const formattedTime = new Date(item.createdAt || Date.now()).toLocaleTimeString(
                [],
                { hour: '2-digit', minute: '2-digit' }
              );
              const quantityStr = `${item.consumedQuantity || 1} ${item.servingUnit || 'portion'}`;
              const cals = (item.nutrients?.calories || 0) * (item.consumedQuantity || 1);
              const carbs = (item.nutrients?.carbohydrates || 0) * (item.consumedQuantity || 1);
              const protein = (item.nutrients?.proteins || 0) * (item.consumedQuantity || 1);
              const fat = (item.nutrients?.fats || 0) * (item.consumedQuantity || 1);
              const fiber = (item.nutrients?.fiber || 0) * (item.consumedQuantity || 1);
              const spike = item.predictedImpact?.glucoseSpike || 18;

              return (
                <GlassCard key={item._id} style={styles.mealCard}>
                  {/* Top: Name & Timestamp */}
                  <View style={styles.mealCardTop}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={styles.mealBadgeRow}>
                        <View style={styles.mealTypeBadge}>
                          <Text style={styles.mealTypeBadgeText}>
                            {item.mealType || 'Meal'}
                          </Text>
                        </View>
                        <DataProvenanceBadge type="USER_REPORTED" size="xs" showLabel={true} />
                        <Text style={styles.mealTimestamp}>
                          {formattedDate} • {formattedTime}
                        </Text>
                      </View>
                      <Text style={[styles.mealTitle, { color: colors.textPrimary }]}>
                        {item.recognizedItemName || item.foodItem || 'Recorded Nutrition Item'}
                      </Text>
                      <Text style={styles.mealQuantity}>
                        Portion Quantity: <Text style={styles.mealQuantityVal}>{quantityStr}</Text>
                      </Text>
                    </View>

                    {/* Calories Bubble */}
                    <View style={styles.calsBubble}>
                      <Flame size={12} color="#f97316" />
                      <Text style={styles.calsBubbleVal}>{Math.round(cals)}</Text>
                      <Text style={styles.calsBubbleUnit}>kcal</Text>
                    </View>
                  </View>

                  {/* Macronutrient Distribution Bar */}
                  <View style={[styles.macrosContainer, { backgroundColor: isDark ? '#121212' : '#f8fafc' }]}>
                    <View style={styles.macroCol}>
                      <Text style={styles.macroColLabel}>CARBS</Text>
                      <Text style={[styles.macroColVal, { color: colors.textPrimary }]}>{carbs.toFixed(1)}g</Text>
                    </View>
                    <View style={styles.macroCol}>
                      <Text style={styles.macroColLabel}>PROTEIN</Text>
                      <Text style={[styles.macroColVal, { color: colors.textPrimary }]}>{protein.toFixed(1)}g</Text>
                    </View>
                    <View style={styles.macroCol}>
                      <Text style={styles.macroColLabel}>FAT</Text>
                      <Text style={[styles.macroColVal, { color: colors.textPrimary }]}>{fat.toFixed(1)}g</Text>
                    </View>
                    <View style={styles.macroCol}>
                      <Text style={styles.macroColLabel}>FIBER</Text>
                      <Text style={[styles.macroColVal, { color: colors.textPrimary }]}>{fiber.toFixed(1)}g</Text>
                    </View>
                  </View>

                  {/* Glycemic Spike Telemetry */}
                  <View style={[styles.glycemicFootprintRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 6 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <View style={styles.spikePill}>
                        <TrendingUp size={11} color={colors.amberLight} />
                        <Text style={styles.spikePillText}>
                          Spike: +{spike} mg/dL
                        </Text>
                      </View>
                      <DataProvenanceBadge
                        type="AI_ESTIMATE"
                        size="xs"
                        showLabel={true}
                        showDisclaimer={true}
                        customDisclaimer="Sec 1 & 47: Neural network projection calibrated from baseline vitals"
                      />
                    </View>
                    <Text style={styles.glycemicNote}>
                      {item.predictedImpact?.aiWarningMessage ||
                        'Metabolic response calibrated with resting baseline'}
                    </Text>
                  </View>
                </GlassCard>
              );
            })}
          </View>
        ) : (
          <GlassCard style={styles.emptyStateCard}>
            <View style={styles.emptyIconCircle}>
              <Utensils size={32} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Meal History Found</Text>
            <Text style={styles.emptySubtitle}>
              You haven't recorded any food scans under this filter. Point the camera at your meal to calculate glycemic impact and calibrate your nutrition.
            </Text>

            <TouchableOpacity
              style={styles.emptyScanBtn}
              onPress={() => navigation.navigate('Scan')}
              activeOpacity={0.85}
            >
              <Scan size={16} color="#000000" />
              <Text style={styles.emptyScanBtnText}>SCAN FIRST MEAL</Text>
            </TouchableOpacity>
          </GlassCard>
        )}
      </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
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
  },
  scanHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cyan,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanHeaderBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  segmentBtnActive: {
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentBtnText: {
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  statsStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
  },
  statUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  statSub: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterRow: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChipSelected: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyanLight,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  filterChipTextSelected: {
    color: '#000000',
  },
  historyList: {
    gap: 12,
  },
  mealCard: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  mealCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  mealTypeBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mealTypeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.cyan,
    textTransform: 'uppercase',
  },
  mealTimestamp: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  mealQuantity: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  mealQuantityVal: {
    color: colors.cyanLight,
    fontWeight: '800',
  },
  calsBubble: {
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  calsBubbleVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#f97316',
  },
  calsBubbleUnit: {
    fontSize: 8,
    fontWeight: '800',
    color: '#f97316',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#121212',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  macroCol: {
    alignItems: 'center',
  },
  macroColLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  macroColVal: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  glycemicFootprintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spikePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  spikePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.amberLight,
  },
  glycemicNote: {
    flex: 1,
    fontSize: 10,
    color: colors.textMuted,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyStateCard: {
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    padding: 28,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  emptySubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 6,
    marginBottom: 18,
  },
  emptyScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cyan,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyScanBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
});

export default FoodHistoryScreen;
