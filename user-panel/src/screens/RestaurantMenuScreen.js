import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  Flame,
  AlertTriangle,
  ChevronLeft,
  Plus,
  Minus,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  Info,
  ShoppingBag,
  Zap,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import foodDeliveryApi from '../api/foodDeliveryApi';
import GlassCard from '../components/GlassCard';

export default function RestaurantMenuScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const {
    restaurantId,
    restaurant: initialRestaurant,
    orderMode: initialOrderMode = 'VITALS_GUARD',
  } = route.params || {};

  const [restaurant, setRestaurant] = useState(initialRestaurant || null);
  const [menuItems, setMenuItems] = useState([]);
  const [orderMode, setOrderMode] = useState(initialOrderMode);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  // Cart: { [foodId]: { foodItem, quantity } }
  const [cart, setCart] = useState({});

  const loadMenu = useCallback(async (mode) => {
    setIsLoading(true);
    try {
      const res = await foodDeliveryApi.getRestaurantMenu(restaurantId, mode);
      if (res?.success && Array.isArray(res.items)) {
        setMenuItems(res.items);
        if (res.restaurant) setRestaurant(res.restaurant);
      } else {
        setMenuItems(getFallbackMenu(mode));
      }
    } catch (err) {
      console.warn('[RestaurantMenu] Fetch warning:', err?.message || err);
      setMenuItems(getFallbackMenu(mode));
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadMenu(orderMode);
  }, [loadMenu, orderMode]);

  const toggleMode = () => {
    if (orderMode === 'VITALS_GUARD') {
      Alert.alert(
        '⚠️ Activate Cheat Mode Override?',
        'Switching to Cheat Mode permits ordering high-glycemic dishes. BioSync AI will generate a mandatory 4-hour in-silico simulation and postprandial ambulation step-burn target.',
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

  const updateQuantity = (item, delta) => {
    const id = item._id || item.id;
    setCart((prev) => {
      const current = prev[id]?.quantity || 0;
      const nextQty = Math.max(0, current + delta);
      if (nextQty === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return {
        ...prev,
        [id]: { foodItem: item, quantity: nextQty },
      };
    });
  };

  const cartList = Object.values(cart);
  const totalCartCount = cartList.reduce((acc, c) => acc + c.quantity, 0);
  const totalCartPrice = cartList.reduce(
    (acc, c) => acc + (c.foodItem.price || 180) * c.quantity,
    0
  );
  const totalNetCarbs = cartList.reduce(
    (acc, c) =>
      acc + (c.foodItem.netCarbohydrates_g || c.foodItem.carbohydrates_g || 25) * c.quantity,
    0
  );

  const categories = ['All', ...new Set(menuItems.map((item) => item.category || 'Mains'))];

  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory === 'All') return true;
    return item.category === selectedCategory;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.bgDark }]}>
      {/* Restaurant Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.bgSurface, borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: colors.bgCardElevated }]}
          >
            <ChevronLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Mode Switcher */}
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
                <ShieldCheck size={14} color="#10B981" strokeWidth={2.5} />
                <Text style={[styles.modePillText, { color: '#10B981' }]}>VITALS GUARD</Text>
                <Lock size={12} color="#10B981" />
              </>
            ) : (
              <>
                <Flame size={14} color="#F59E0B" strokeWidth={2.5} />
                <Text style={[styles.modePillText, { color: '#F59E0B' }]}>CHEAT OVERRIDE</Text>
                <Unlock size={12} color="#F59E0B" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.restaurantInfo}>
          <Text style={[styles.restaurantName, { color: colors.textPrimary }]}>
            {restaurant?.name || 'Vedic Glycemic Kitchen'}
          </Text>
          <Text style={[styles.restaurantArea, { color: colors.textMuted }]}>
            {restaurant?.address?.area || 'Banjara Hills, Hyderabad'}
          </Text>

          <View style={styles.metricsRow}>
            <View style={[styles.metricChip, { borderColor: '#10B981' }]}>
              <ShieldCheck size={12} color="#10B981" />
              <Text style={styles.metricText}>
                OQI {restaurant?.oilQualityIndex || 94} (Oil Audited)
              </Text>
            </View>
            <View style={[styles.metricChip, { borderColor: colors.borderSubtle }]}>
              <Clock size={12} color={colors.textMuted} />
              <Text style={[styles.metricText, { color: colors.textMuted }]}>
                {restaurant?.avgPreparationTimeMin || 25}m prep
              </Text>
            </View>
            <View style={[styles.metricChip, { borderColor: colors.borderSubtle }]}>
              <Text style={[styles.metricText, { color: colors.textMuted }]}>
                FSSAI 5★
              </Text>
            </View>
          </View>
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected ? '#10B981' : colors.bgCardElevated,
                    borderColor: isSelected ? '#10B981' : colors.borderSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    {
                      color: isSelected ? '#ffffff' : colors.textMuted,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Menu List */}
      <ScrollView
        contentContainerStyle={[
          styles.menuList,
          { paddingBottom: totalCartCount > 0 ? insets.bottom + 120 : insets.bottom + 30 },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 40 }} />
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No items in this category.
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => {
            const id = item._id || item.id;
            const currentQty = cart[id]?.quantity || 0;
            const isSafe = item.isSafe !== false;
            const isGated = !isSafe && orderMode === 'VITALS_GUARD';

            return (
              <GlassCard
                key={id}
                style={[
                  styles.itemCard,
                  isGated && styles.gatedCard,
                  { borderColor: isGated ? 'rgba(239, 68, 68, 0.4)' : colors.borderSubtle },
                ]}
              >
                <View style={styles.itemMainRow}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    {/* Safe / Warning Status Badges */}
                    <View style={styles.badgeRow}>
                      {isSafe ? (
                        <View style={styles.safeBadge}>
                          <CheckCircle2 size={11} color="#10B981" />
                          <Text style={styles.safeBadgeText}>
                            SAFE • +{item.predictedGlucoseSpike || 18} mg/dL PEAK
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.warnBadge,
                            {
                              backgroundColor:
                                orderMode === 'VITALS_GUARD'
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(245, 158, 11, 0.15)',
                              borderColor:
                                orderMode === 'VITALS_GUARD' ? '#EF4444' : '#F59E0B',
                            },
                          ]}
                        >
                          <AlertTriangle
                            size={11}
                            color={orderMode === 'VITALS_GUARD' ? '#EF4444' : '#F59E0B'}
                          />
                          <Text
                            style={[
                              styles.warnBadgeText,
                              { color: orderMode === 'VITALS_GUARD' ? '#EF4444' : '#F59E0B' },
                            ]}
                          >
                            {orderMode === 'VITALS_GUARD'
                              ? `GATED: EXCEEDS LIMIT (+${item.predictedGlucoseSpike || 54} mg/dL)`
                              : `CHEAT: +${item.predictedGlucoseSpike || 54} mg/dL SURGE`}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Dish Title & Description */}
                    <Text
                      style={[
                        styles.itemTitle,
                        { color: isGated ? colors.textMuted : colors.textPrimary },
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[styles.itemDesc, { color: colors.textMuted }]}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>

                    {/* Nutritional & Biophysical Annotations */}
                    <View style={styles.biomarkersRow}>
                      <Text style={[styles.biomarkerText, { color: colors.textSecondary }]}>
                        {item.calories_kcal || 260} kcal
                      </Text>
                      <Text style={styles.bioDot}>•</Text>
                      <Text style={[styles.biomarkerText, { color: colors.textSecondary }]}>
                        {item.netCarbohydrates_g || item.carbohydrates_g || 24}g Carbs
                      </Text>
                      <Text style={styles.bioDot}>•</Text>
                      <Text style={[styles.biomarkerText, { color: colors.textSecondary }]}>
                        {item.protein_g || 12}g Prot
                      </Text>
                      <Text style={styles.bioDot}>•</Text>
                      <Text style={[styles.biomarkerText, { color: colors.textSecondary }]}>
                        GI {item.glycemicIndex || 42}
                      </Text>
                    </View>

                    {/* Active Botanicals Tag */}
                    {item.activeBotanicals?.length > 0 && (
                      <View style={styles.botanicalChip}>
                        <Sparkles size={10} color="#10B981" />
                        <Text style={styles.botanicalText}>
                          {item.activeBotanicals.map((b) => b.botanicalName).join(', ')}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Price & Quantity Controls */}
                  <View style={styles.actionColumn}>
                    <Text style={[styles.priceText, { color: colors.textPrimary }]}>
                      ₹{item.price || 180}
                    </Text>

                    {isGated ? (
                      <TouchableOpacity
                        onPress={toggleMode}
                        style={[styles.gatedBtn, { borderColor: '#EF4444' }]}
                      >
                        <Lock size={12} color="#EF4444" />
                        <Text style={styles.gatedBtnText}>Locked</Text>
                      </TouchableOpacity>
                    ) : currentQty === 0 ? (
                      <TouchableOpacity
                        onPress={() => updateQuantity(item, 1)}
                        style={styles.addBtn}
                      >
                        <Text style={styles.addBtnText}>ADD +</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.qtyStepper}>
                        <TouchableOpacity
                          onPress={() => updateQuantity(item, -1)}
                          style={styles.stepBtn}
                        >
                          <Minus size={14} color="#ffffff" />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{currentQty}</Text>
                        <TouchableOpacity
                          onPress={() => updateQuantity(item, 1)}
                          style={styles.stepBtn}
                        >
                          <Plus size={14} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>

                {/* If item is contraindicated in Vitals Guard, explain reason */}
                {isGated && item.safetyReason && (
                  <View style={styles.reasonBox}>
                    <Info size={12} color="#EF4444" />
                    <Text style={styles.reasonText}>{item.safetyReason}</Text>
                  </View>
                )}
              </GlassCard>
            );
          })
        )}
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      {totalCartCount > 0 && (
        <View
          style={[
            styles.floatingCart,
            {
              bottom: insets.bottom + 12,
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <View style={styles.cartInfo}>
            <View style={styles.cartCountRow}>
              <ShoppingBag size={18} color="#10B981" />
              <Text style={[styles.cartCountText, { color: colors.textPrimary }]}>
                {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'} • ₹{totalCartPrice}
              </Text>
            </View>
            <Text style={[styles.cartSubtext, { color: colors.textMuted }]}>
              Est. Net Carbs: {totalNetCarbs}g • {orderMode === 'VITALS_GUARD' ? 'Safe Zone' : 'Simulation Required'}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('CartSimulation', {
                cartItems: cartList,
                restaurant,
                orderMode,
              })
            }
            style={styles.simulateBtn}
          >
            <Zap size={16} color="#ffffff" fill="#ffffff" />
            <Text style={styles.simulateBtnText}>Review Forecast</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Fallback menu data
function getFallbackMenu(mode) {
  return [
    {
      _id: 'item_001',
      name: 'Methi-Infused Whole Moong Khichdi',
      category: 'Mains',
      description: 'Slow-cooked whole green gram with A2 desi cow ghee and fenugreek seeds (4-hydroxyisoleucine).',
      price: 240,
      calories_kcal: 310,
      netCarbohydrates_g: 28,
      protein_g: 16,
      fat_g: 7,
      glycemicIndex: 38,
      isSafe: true,
      predictedGlucoseSpike: 16,
      activeBotanicals: [{ botanicalName: 'Methi (Fenugreek)', mechanism: 'Slows glucose absorption' }],
    },
    {
      _id: 'item_002',
      name: 'High-Amylose Desi Handi Biryani',
      category: 'Biryani',
      description: 'Parboiled aged Basmati with high amylose ratio (28%) and lean tender chicken.',
      price: 360,
      calories_kcal: 440,
      netCarbohydrates_g: 42,
      protein_g: 28,
      fat_g: 12,
      glycemicIndex: 48,
      isSafe: true,
      predictedGlucoseSpike: 26,
    },
    {
      _id: 'item_003',
      name: 'Crispy Butter Naan & Shahi Paneer Gravy',
      category: 'Breads & Curries',
      description: 'Refined flour tandoori naan brushed with butter and sweet cashew-tomato cream gravy.',
      price: 290,
      calories_kcal: 620,
      netCarbohydrates_g: 68,
      protein_g: 14,
      fat_g: 26,
      glycemicIndex: 78,
      isSafe: mode === 'CHEAT_MODE_OVERRIDE',
      predictedGlucoseSpike: 62,
      safetyReason: 'Exceeds postprandial glucose ceiling (+62 mg/dL delta exceeds 140 mg/dL target).',
    },
    {
      _id: 'item_004',
      name: 'Karela Crisp & Jamun Seed Kadhi',
      category: 'Low-GI Specials',
      description: 'Charred bitter gourd chips with cold-pressed mustard oil and probiotic buttermilk.',
      price: 210,
      calories_kcal: 180,
      netCarbohydrates_g: 12,
      protein_g: 8,
      fat_g: 5,
      glycemicIndex: 26,
      isSafe: true,
      predictedGlucoseSpike: 10,
      activeBotanicals: [{ botanicalName: 'Karela (Momordica charantia)', mechanism: 'SGLT-1 inhibition' }],
    },
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
  restaurantInfo: {
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 2,
  },
  restaurantArea: {
    fontSize: 12,
    marginBottom: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 4,
  },
  metricText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  categoryScroll: {
    paddingTop: 8,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
  },
  menuList: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
  },
  itemCard: {
    marginBottom: 12,
  },
  gatedCard: {
    opacity: 0.72,
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
  },
  itemMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgeRow: {
    marginBottom: 4,
  },
  safeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  safeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  warnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    gap: 4,
  },
  warnBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 6,
  },
  biomarkersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  biomarkerText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bioDot: {
    color: '#6B7280',
    fontSize: 10,
  },
  botanicalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  botanicalText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981',
  },
  actionColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 80,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  addBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
    overflow: 'hidden',
  },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    paddingHorizontal: 6,
  },
  gatedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  gatedBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  reasonText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '600',
    flex: 1,
  },
  floatingCart: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  cartInfo: {
    flex: 1,
  },
  cartCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  cartCountText: {
    fontSize: 14,
    fontWeight: '900',
  },
  cartSubtext: {
    fontSize: 11,
    fontWeight: '500',
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  simulateBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});

