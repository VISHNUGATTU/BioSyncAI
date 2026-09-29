import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldAlert,
  CalendarPlus,
  ArrowLeft,
  X,
  Camera,
  Scan,
  Sparkles,
  Flame,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import userApi from '../api/userApi';
import GlassCard from '../components/GlassCard';

export const FoodScannerScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, hasVitals, fetchVitals } = useAuthStore();
  const [selectedSample, setSelectedSample] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => {
    fetchVitals();
  }, []);

  const vitalsPresent = hasVitals();

  const handleLogMeal = async (meal) => {
    try {
      setIsLogging(true);
      const payload = {
        recognizedItemName: meal.name,
        consumedQuantity: 1,
        servingUnit: 'Serving',
        mealType: 'Lunch',
        nutrients: {
          calories: parseInt(meal.cals) || 380,
          carbohydrates: parseInt(meal.breakdown.carbs) || 34,
          proteins: parseInt(meal.breakdown.protein) || 28,
          fats: parseInt(meal.breakdown.fat) || 14,
          fiber: parseInt(meal.breakdown.fiber) || 6,
        },
        predictedImpact: {
          glucoseSpike: parseInt(meal.glucoseImpact.replace(/[^0-9]/g, '')) || 18,
          aiWarningMessage:
            meal.score >= 80
              ? 'Optimal metabolic response with minimal postprandial glucose spike.'
              : 'Elevated carbohydrate load. Moderate glycemic spike expected.',
        },
      };

      const res = await userApi.logMeal(payload);
      if (res.success) {
        Alert.alert(
          'Meal Recorded in Database',
          `${meal.name} has been added to your longitudinal nutrition timeline!`,
          [
            { text: 'View History', onPress: () => navigation.navigate('History') },
            { text: 'Go to Home', onPress: () => navigation.navigate('Home') },
          ]
        );
      } else {
        Alert.alert('Notice', res.message || 'Unable to log meal');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to record meal');
    } finally {
      setIsLogging(false);
    }
  };

  const handleCancel = () => {
    // If user cancels, return to desired back page and do NOT allow scanning
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  const handleGoToBookings = () => {
    navigation.navigate('BookAppointment');
  };

  // -------------------------------------------------------------
  // GATED STATE: VITALS NOT PRESENT
  // -------------------------------------------------------------
  if (!vitalsPresent) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Top Header with Back / Cancel */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Food Scanner</Text>
          <TouchableOpacity
            style={styles.cancelIconBtn}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <X size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.lockedContainer}>
          {/* Glowing Warning Shield */}
          <View style={styles.shieldGlowCircle}>
            <View style={styles.shieldInnerCircle}>
              <ShieldAlert size={44} color={colors.amberLight} />
            </View>
          </View>

          <Text style={styles.lockedTitle}>Your Vitals Are Not Present</Text>
          <Text style={styles.lockedSubtitle}>
            Clinical metabolic baseline required for food scanning
          </Text>

          {/* Explanation Box */}
          <GlassCard style={styles.explanationCard}>
            <View style={styles.bulletRow}>
              <AlertTriangle size={16} color={colors.amberLight} />
              <Text style={styles.bulletText}>
                BioSync AI requires your verified blood glucose, lipid profile, and HbA1c to calculate biological meal impact.
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Sparkles size={16} color={colors.cyan} />
              <Text style={styles.bulletText}>
                Scanning food without clinical vitals is locked to prevent inaccurate or unsafe metabolic recommendations.
              </Text>
            </View>
          </GlassCard>

          {/* Action Buttons: Go to Bookings OR Cancel */}
          <View style={styles.actionButtonGroup}>
            <TouchableOpacity
              style={styles.bookingPrimaryBtn}
              onPress={handleGoToBookings}
              activeOpacity={0.85}
            >
              <CalendarPlus size={18} color="#000000" />
              <Text style={styles.bookingPrimaryBtnText}>GO TO BOOKINGS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelSecondaryBtn}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelSecondaryBtnText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // UNLOCKED STATE: VITALS PRESENT (Clinical Calibration Active)
  // -------------------------------------------------------------
  const SAMPLE_MEALS = [
    {
      id: '1',
      name: 'Avocado Toast with Poached Egg',
      cals: '380 kcal',
      score: 94,
      glucoseImpact: '+18 mg/dL (Low)',
      status: 'Optimal',
      breakdown: { carbs: '28g', protein: '16g', fat: '22g', fiber: '9g' },
    },
    {
      id: '2',
      name: 'Paneer Butter Masala with 2 Naan',
      cals: '720 kcal',
      score: 58,
      glucoseImpact: '+62 mg/dL (Elevated)',
      status: 'High Glycemic',
      breakdown: { carbs: '74g', protein: '22g', fat: '38g', fiber: '3g' },
    },
    {
      id: '3',
      name: 'Quinoa & Grilled Chicken Bowl',
      cals: '440 kcal',
      score: 98,
      glucoseImpact: '+12 mg/dL (Ideal)',
      status: 'Peak Synergy',
      breakdown: { carbs: '34g', protein: '42g', fat: '12g', fiber: '7g' },
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Nutrition Scanner</Text>
        <View style={styles.vitalsActivePill}>
          <CheckCircle2 size={12} color={colors.emeraldLight} />
          <Text style={styles.vitalsActiveText}>Vitals Calibrated</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Scanner Viewfinder Area */}
        <View style={styles.viewfinderCard}>
          <View style={styles.viewfinderCorners}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>

          <View style={styles.viewfinderContent}>
            <Camera size={44} color={colors.cyan} />
            <Text style={styles.viewfinderLabel}>POINT CAMERA AT MEAL</Text>
            <Text style={styles.viewfinderSub}>
              BioSync AI will estimate glycemic spike & nutrient absorption
            </Text>
          </View>

          <View style={styles.viewfinderBadge}>
            <Sparkles size={12} color={colors.cyan} />
            <Text style={styles.viewfinderBadgeText}>Multi-Spectral AI 2.0</Text>
          </View>
        </View>

        {/* AI Engine Calculation Banner: What to eat - Best choice */}
        <GlassCard style={styles.aiBestChoiceBanner}>
          <View style={styles.aiBestChoiceHeader}>
            <View style={styles.aiBestBadge}>
              <Sparkles size={12} color="#000000" />
              <Text style={styles.aiBestBadgeText}>AI-ENGINE CALCULATION: OPTIMAL MEAL</Text>
            </View>
            <View style={styles.synergyScore}>
              <Text style={styles.synergyScoreText}>98% SYNERGY</Text>
            </View>
          </View>
          <Text style={styles.aiBestTitle}>Quinoa & Grilled Chicken Bowl</Text>
          <Text style={styles.aiBestExplanation}>
            Calculated as the best choice for your metabolic profile: Lowest predicted glucose surge (+12 mg/dL) with high sustained lean amino absorption.
          </Text>
        </GlassCard>

        {/* Quick Test Samples */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>SCANNED CANDIDATES & SAMPLES</Text>
        </View>

        {SAMPLE_MEALS.map((meal) => {
          const isSelected = selectedSample?.id === meal.id;
          const isBest = meal.id === '3';
          return (
            <TouchableOpacity
              key={meal.id}
              style={[styles.sampleCard, isSelected && styles.sampleCardSelected]}
              onPress={() => setSelectedSample(meal)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.sampleName, isSelected && styles.sampleNameSelected]}>
                    {meal.name}
                  </Text>
                  {isBest ? (
                    <View style={styles.bestPillSmall}>
                      <Text style={styles.bestPillSmallText}>BEST</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.sampleMeta}>
                  {meal.cals} • Glucose: {meal.glucoseImpact}
                </Text>
              </View>
              <View style={styles.scorePill}>
                <Text style={styles.scoreVal}>{meal.score}</Text>
                <Text style={styles.scoreLabel}>SCORE</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Selected Meal Analysis Breakdown */}
        {selectedSample ? (
          <GlassCard style={styles.analysisCard}>
            <View style={styles.analysisHeader}>
              <View>
                <Text style={styles.analysisTitle}>{selectedSample.name}</Text>
                <Text style={styles.analysisSub}>Metabolic Profile Calibration</Text>
              </View>
              <View
                style={[
                  styles.statusTag,
                  selectedSample.score >= 80 ? styles.statusGood : styles.statusWarn,
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    selectedSample.score >= 80 ? styles.statusGoodText : styles.statusWarnText,
                  ]}
                >
                  {selectedSample.status}
                </Text>
              </View>
            </View>

            <View style={styles.macroGrid}>
              <View style={styles.macroBox}>
                <Text style={styles.macroLabel}>CARBS</Text>
                <Text style={styles.macroVal}>{selectedSample.breakdown.carbs}</Text>
              </View>
              <View style={styles.macroBox}>
                <Text style={styles.macroLabel}>PROTEIN</Text>
                <Text style={styles.macroVal}>{selectedSample.breakdown.protein}</Text>
              </View>
              <View style={styles.macroBox}>
                <Text style={styles.macroLabel}>FAT</Text>
                <Text style={styles.macroVal}>{selectedSample.breakdown.fat}</Text>
              </View>
              <View style={styles.macroBox}>
                <Text style={styles.macroLabel}>FIBER</Text>
                <Text style={styles.macroVal}>{selectedSample.breakdown.fiber}</Text>
              </View>
            </View>

            {/* Confirm & Log Button */}
            <TouchableOpacity
              style={[styles.logMealBtn, isLogging && { opacity: 0.7 }]}
              onPress={() => handleLogMeal(selectedSample)}
              disabled={isLogging}
              activeOpacity={0.85}
            >
              {isLogging ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <CheckCircle2 size={16} color="#000000" />
                  <Text style={styles.logMealBtnText}>LOG THIS MEAL TO TIMELINE</Text>
                </>
              )}
            </TouchableOpacity>
          </GlassCard>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  vitalsActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vitalsActiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.emeraldLight,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  shieldGlowCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  shieldInnerCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  lockedSubtitle: {
    fontSize: 12,
    color: colors.amberLight,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  explanationCard: {
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    marginBottom: 26,
    width: '100%',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionButtonGroup: {
    width: '100%',
    gap: 10,
  },
  bookingPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.cyan,
    paddingVertical: 15,
    borderRadius: 14,
  },
  bookingPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1,
  },
  cancelSecondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cancelSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  viewfinderCard: {
    height: 220,
    backgroundColor: '#07151a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  viewfinderCorners: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    bottom: 16,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.cyan,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  viewfinderContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  viewfinderLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.cyanLight,
    letterSpacing: 1,
    marginTop: 10,
  },
  viewfinderSub: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  viewfinderBadge: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  viewfinderBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.cyan,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.cyan,
    letterSpacing: 1.5,
  },
  sampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  sampleCardSelected: {
    backgroundColor: '#061a15',
    borderColor: colors.emerald,
  },
  sampleName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  sampleNameSelected: {
    color: colors.emeraldLight,
  },
  sampleMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  scorePill: {
    alignItems: 'center',
    backgroundColor: '#141414',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scoreVal: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.emeraldLight,
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textMuted,
  },
  analysisCard: {
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 10,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  analysisSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusGood: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusGoodText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.emeraldLight,
  },
  statusWarn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  statusWarnText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.amberLight,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 10,
  },
  macroBox: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
  },
  macroVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  aiBestChoiceBanner: {
    backgroundColor: '#07181f',
    borderWidth: 1,
    borderColor: colors.cyan,
    padding: 14,
    marginBottom: 16,
  },
  aiBestChoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  aiBestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cyan,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aiBestBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  synergyScore: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  synergyScoreText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: colors.emeraldLight,
  },
  aiBestTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  aiBestExplanation: {
    fontSize: 10.5,
    color: colors.textSecondary,
    lineHeight: 15,
    marginTop: 4,
  },
  bestPillSmall: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  bestPillSmallText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: colors.emeraldLight,
  },
  logMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.cyan,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  logMealBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
});

export default FoodScannerScreen;
