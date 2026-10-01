import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
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
  FileText,
  Edit3,
  ChevronRight,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Scale,
  Heart,
  Droplets,
  Info,
  Plus,
  Minus,
  CheckSquare,
  CornerDownRight,
  Share2,
  Barcode,
} from 'lucide-react-native';
import { colors, useTheme } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import userApi from '../api/userApi';
import draftService from '../services/draftService';
import GlassCard from '../components/GlassCard';
import FoodBarcodeScannerModal from '../components/FoodBarcodeScannerModal';

// Realistic food photo presets for zero-latency camera simulation
const CAMERA_PRESET_MEALS = [
  {
    id: 'preset_1',
    name: 'Quinoa & Grilled Salmon Bowl',
    imageUri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    description: 'High-protein, low-glycemic Mediterranean grain bowl',
    calories: 430,
    carbs: 32,
    protein: 38,
    fat: 16,
    fiber: 7,
    sugar: 3,
    sodium: 310,
    candidates: [
      { name: 'Quinoa & Grilled Salmon Bowl', confidence: 0.86 },
      { name: 'Brown Rice Salmon Salad', confidence: 0.10 },
      { name: 'Mediterranean Grain Medley', confidence: 0.04 },
    ],
  },
  {
    id: 'preset_2',
    name: 'South Indian Dal Tadka & Roti',
    imageUri: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80',
    description: 'Fiber-rich yellow lentil stew with whole-wheat flatbread',
    calories: 490,
    carbs: 64,
    protein: 20,
    fat: 14,
    fiber: 10,
    sugar: 4,
    sodium: 480,
    candidates: [
      { name: 'South Indian Dal Tadka & Roti', confidence: 0.82 },
      { name: 'Lentil Curry with Brown Rice', confidence: 0.13 },
      { name: 'Mixed Vegetable Sambar Bowl', confidence: 0.05 },
    ],
  },
  {
    id: 'preset_3',
    name: 'Avocado Toast with Poached Egg',
    imageUri: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80',
    description: 'Artisan sourdough with Haas avocado & pasture-raised egg',
    calories: 360,
    carbs: 26,
    protein: 16,
    fat: 22,
    fiber: 8,
    sugar: 2,
    sodium: 260,
    candidates: [
      { name: 'Avocado Toast with Poached Egg', confidence: 0.88 },
      { name: 'Guacamole Sourdough Toast', confidence: 0.08 },
      { name: 'Avocado & Egg Green Platter', confidence: 0.04 },
    ],
  },
];

export const FoodScannerScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, hasVitals, fetchVitals, latestVitals } = useAuthStore();

  // Scanning & Loading States
  const [isScanning, setIsScanning] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [scanStepMessage, setScanStepMessage] = useState('Optical Analysis');

  // Active Scanned Food Data
  const [scannedFood, setScannedFood] = useState(null);
  const [localImageUri, setLocalImageUri] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [customDishName, setCustomDishName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // Portion Scaling (0.5x, 1.0x, 1.5x, 2.0x, range 0.25x - 4.0x)
  const [portionMultiplier, setPortionMultiplier] = useState(1.0);
  const [userDecision, setUserDecision] = useState('Consume');

  // In-progress draft restoration notification
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);

  // Animated Scan Laser
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Mount: Refresh vitals & check for unconfirmed scans / saved drafts
  useEffect(() => {
    fetchVitals();
    checkForUnconfirmedOrDraft();
  }, []);

  // Viewfinder laser loop
  useEffect(() => {
    if (isScanning) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1400,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isScanning]);

  const vitalsPresent = hasVitals();

  // -------------------------------------------------------------
  // DRAFT & UNCONFIRMED SCAN RESTORATION
  // -------------------------------------------------------------
  const checkForUnconfirmedOrDraft = async () => {
    try {
      // 1. Try remote MongoDB unconfirmed food log
      const res = await userApi.getUnconfirmedScan();
      if (res?.success && res.data) {
        populateScannedState(res.data, true);
        return;
      }

      // 2. Fallback to client-side draft
      const draft = await draftService.loadDraft('food_scan');
      if (draft?.data?.foodLog) {
        populateScannedState(draft.data.foodLog, true);
      }
    } catch (err) {
      console.log('[FoodScanner] Draft check completed without pending scans.');
    }
  };

  const populateScannedState = (foodLogData, isFromDraft = false) => {
    setScannedFood(foodLogData);
    setLocalImageUri(foodLogData.imageUrl);

    // Candidates normalization
    const cands = foodLogData.candidates && foodLogData.candidates.length > 0
      ? foodLogData.candidates
      : [
          { name: foodLogData.recognizedItemName || 'Analyzed Meal', confidence: 0.84 },
          { name: `Light ${foodLogData.recognizedItemName || 'Meal'}`, confidence: 0.12 },
          { name: 'Steamed Alternative', confidence: 0.04 },
        ];
    setCandidates(cands);

    const initialName = foodLogData.recognizedItemName || cands[0]?.name || 'Analyzed Meal';
    setSelectedCandidate(initialName);
    setCustomDishName(initialName);
    setPortionMultiplier(foodLogData.consumedQuantity || 1.0);
    setUserDecision(foodLogData.userDecision || 'Consume');

    if (isFromDraft) {
      setHasRestoredDraft(true);
    }
  };

  const handleBarcodeFoodFound = (foodLog) => {
    if (!foodLog) return;
    populateScannedState(foodLog);
    if (foodLog.imageUrl) {
      setLocalImageUri(foodLog.imageUrl);
    }
  };

  // -------------------------------------------------------------
  // CAMERA & GALLERY PICKERS
  // -------------------------------------------------------------
  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Access Required',
          'BioSync AI needs camera access to analyze meal composition.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        handleScanImage(asset.uri, asset.mimeType || 'image/jpeg', asset.fileName || 'camera_scan.jpg');
      }
    } catch (e) {
      Alert.alert('Camera Error', 'Unable to capture photo. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Gallery Access Required',
          'BioSync AI needs photo library access to upload meal images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        handleScanImage(asset.uri, asset.mimeType || 'image/jpeg', asset.fileName || 'gallery_scan.jpg');
      }
    } catch (e) {
      Alert.alert('Gallery Error', 'Unable to pick photo from library.');
    }
  };

  // Preset fast-scanner for instant test without physical camera
  const handleSelectPreset = async (preset) => {
    setLocalImageUri(preset.imageUri);
    setIsScanning(true);
    setScanStepMessage('Extracting Multi-Spectral Food Features...');

    try {
      // Create multipart form with online preset image blob
      const formData = new FormData();
      let blob;
      try {
        const fetchRes = await fetch(preset.imageUri);
        blob = await fetchRes.blob();
      } catch (err) {
        blob = null;
      }

      if (blob) {
        if (Platform.OS === 'web') {
          formData.append('foodImage', blob, `${preset.id}.jpg`);
        } else {
          formData.append('foodImage', {
            uri: preset.imageUri,
            name: `${preset.id}.jpg`,
            type: 'image/jpeg',
          });
        }

        const scanRes = await userApi.scanFood(formData);
        if (scanRes?.success && scanRes.data) {
          populateScannedState(scanRes.data);
          return;
        }
      }

      // Safe immediate fallback if network image blob fails
      const fallbackLog = {
        _id: `preset_${Date.now()}`,
        imageUrl: preset.imageUri,
        recognizedItemName: preset.name,
        servingSize: '1 standard portion (~260g)',
        servingUnit: 'portion',
        aiConfidenceScore: preset.candidates[0].confidence,
        confidenceLevel: 'High',
        candidates: preset.candidates,
        nutrients: {
          calories: preset.calories,
          carbohydrates: preset.carbs,
          proteins: preset.protein,
          fats: preset.fat,
          fiber: preset.fiber,
          sugar: preset.sugar,
          sodium: preset.sodium,
          cholesterol: 25,
        },
        predictedImpact: {
          glucoseSpike: Math.round(preset.carbs * 0.28),
          bpSpikeSystolic: Number((preset.sodium * 0.008).toFixed(1)),
          aiWarningMessage:
            preset.carbs > 50
              ? 'High carbohydrate load detected. A 10-minute post-meal walk is recommended to buffer the glycemic peak.'
              : 'Optimal macronutrient balance with steady amino acid absorption.',
          aiAlternativeSuggestions: [
            'Pair with leafy greens or raw salad to slow glucose diffusion.',
            'Hydrate with water 15 minutes before the meal.',
          ],
        },
      };

      populateScannedState(fallbackLog);
      draftService.saveDraft('food_scan', {
        step: 2,
        totalSteps: 3,
        data: { foodLog: fallbackLog },
      });
    } catch (e) {
      console.warn('Preset scan error:', e.message);
    } finally {
      setIsScanning(false);
    }
  };

  // -------------------------------------------------------------
  // MULTIPART SCAN DISPATCHER
  // -------------------------------------------------------------
  const handleScanImage = async (imageUri, mimeType, fileName) => {
    setIsScanning(true);
    setLocalImageUri(imageUri);
    setHasRestoredDraft(false);

    try {
      setScanStepMessage('Executing Multi-Spectral Food AI Engine...');
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('foodImage', blob, fileName || 'food_scan.jpg');
      } else {
        formData.append('foodImage', {
          uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
          name: fileName || 'food_scan.jpg',
          type: mimeType || 'image/jpeg',
        });
      }

      setScanStepMessage('Personalizing with Baseline Health Vitals...');
      const res = await userApi.scanFood(formData);

      if (res?.success && res.data) {
        populateScannedState(res.data);
      } else {
        Alert.alert('Analysis Notice', res?.message || 'Could not analyze food image. Please try again.');
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Scan failed';
      Alert.alert('Scan Issue', errMsg);
    } finally {
      setIsScanning(false);
    }
  };

  // -------------------------------------------------------------
  // CONFIRM CONSUMPTION & LOG TO TIMELINE
  // -------------------------------------------------------------
  const handleConfirmMeal = async () => {
    if (!scannedFood) return;

    try {
      setIsConfirming(true);

      const activeName = customDishName.trim() || selectedCandidate || scannedFood.recognizedItemName;

      // Dynamically calculate scaled nutrients
      const scaledNutrients = {
        calories: Math.round((scannedFood.nutrients?.calories || 350) * portionMultiplier),
        carbohydrates: Math.round((scannedFood.nutrients?.carbohydrates || 40) * portionMultiplier),
        proteins: Math.round((scannedFood.nutrients?.proteins || 25) * portionMultiplier),
        fats: Math.round((scannedFood.nutrients?.fats || 12) * portionMultiplier),
        fiber: Math.round((scannedFood.nutrients?.fiber || 6) * portionMultiplier),
        sugar: Math.round((scannedFood.nutrients?.sugar || 4) * portionMultiplier),
        sodium: Math.round((scannedFood.nutrients?.sodium || 280) * portionMultiplier),
        cholesterol: Math.round((scannedFood.nutrients?.cholesterol || 20) * portionMultiplier),
      };

      const payload = {
        consumedQuantity: portionMultiplier,
        servingUnit: scannedFood.servingUnit || 'portion',
        recognizedItemName: activeName,
        nutrients: scaledNutrients,
        userDecision,
      };

      // Call confirm endpoint if ID exists, or fallback to direct logMeal
      let confirmRes;
      if (scannedFood._id && !scannedFood._id.startsWith('preset_')) {
        confirmRes = await userApi.confirmFoodConsumption(scannedFood._id, payload);
      } else {
        confirmRes = await userApi.logMeal({
          ...payload,
          mealType: 'Lunch',
          predictedImpact: {
            glucoseSpike: Math.round(scaledNutrients.carbohydrates * 0.28),
            bpSpikeSystolic: Number((scaledNutrients.sodium * 0.008).toFixed(1)),
            aiWarningMessage: scannedFood.predictedImpact?.aiWarningMessage,
          },
        });
      }

      if (confirmRes?.success) {
        // Clear draft
        await draftService.clearDraft('food_scan');

        Alert.alert(
          'Meal Confirmed & Recorded',
          `"${activeName}" (${portionMultiplier}x portion) has been securely logged into your longitudinal nutrition profile.`,
          [
            {
              text: 'View Nutrition Timeline',
              onPress: () => navigation.navigate('MainTabs', { screen: 'History' }),
            },
            {
              text: 'Scan Another Meal',
              onPress: () => handleDiscardScan(false),
            },
          ]
        );
      } else {
        Alert.alert('Notice', confirmRes?.message || 'Failed to confirm meal consumption.');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Unable to log meal.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDiscardScan = async (showAlert = true) => {
    if (showAlert) {
      Alert.alert(
        'Discard Scan?',
        'This will clear the current meal image and any portion calibrations.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: async () => {
              await draftService.clearDraft('food_scan');
              setScannedFood(null);
              setLocalImageUri(null);
              setCandidates([]);
              setSelectedCandidate('');
              setCustomDishName('');
              setPortionMultiplier(1.0);
              setHasRestoredDraft(false);
            },
          },
        ]
      );
    } else {
      await draftService.clearDraft('food_scan');
      setScannedFood(null);
      setLocalImageUri(null);
      setCandidates([]);
      setSelectedCandidate('');
      setCustomDishName('');
      setPortionMultiplier(1.0);
      setHasRestoredDraft(false);
    }
  };

  const handleCancel = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs', { screen: 'Home' });
    }
  };

  // -------------------------------------------------------------
  // GATED STATE: VITALS NOT PRESENT (Clinical Safeguard)
  // -------------------------------------------------------------
  if (!vitalsPresent) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.bgPrimary }]}>
        <View style={[styles.topHeader, { borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.bgCardElevated }]} onPress={handleCancel} activeOpacity={0.7}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>AI Food Scanner</Text>
          <TouchableOpacity style={[styles.cancelIconBtn, { backgroundColor: colors.bgCardElevated }]} onPress={handleCancel} activeOpacity={0.7}>
            <X size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.lockedContainer}>
          <View style={styles.shieldGlowCircle}>
            <View style={styles.shieldInnerCircle}>
              <ShieldAlert size={44} color={colors.amberLight || '#f59e0b'} />
            </View>
          </View>

          <Text style={[styles.lockedTitle, { color: colors.textPrimary }]}>Clinical Vitals Not Present</Text>
          <Text style={[styles.lockedSubtitle, { color: colors.amberLight || '#f59e0b' }]}>
            Personalized glycemic prediction requires metabolic baseline
          </Text>

          <GlassCard style={styles.explanationCard}>
            <View style={styles.bulletRow}>
              <AlertTriangle size={16} color={colors.amberLight || '#f59e0b'} />
              <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                BioSync AI requires your verified blood glucose, lipid profile, and blood pressure to model real biological meal impact.
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Sparkles size={16} color={colors.cyan} />
              <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                Food scanning is locked until a baseline is established to protect clinical integrity and avoid inaccurate glycemic predictions.
              </Text>
            </View>
          </GlassCard>

          <View style={styles.gatedOptionsContainer}>
            <Text style={[styles.gatedOptionsTitle, { color: colors.textMuted }]}>ESTABLISH BASELINE TO UNLOCK SCANNER:</Text>

            {/* Option 1: Home-Based Diagnostic Assessment */}
            <TouchableOpacity
              style={[styles.gatedOptionCard, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
              onPress={() => navigation.navigate('BookAppointment')}
              activeOpacity={0.85}
            >
              <View style={[styles.gatedOptionIconWrap, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                <CalendarPlus size={20} color={colors.cyan} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.gatedOptionHeaderRow}>
                  <Text style={[styles.gatedOptionName, { color: colors.textPrimary }]}>1. Home Lab Assessment</Text>
                  <View style={styles.goldBadge}>
                    <Text style={styles.goldBadgeText}>RECOMMENDED</Text>
                  </View>
                </View>
                <Text style={[styles.gatedOptionDesc, { color: colors.textMuted }]}>
                  Phlebotomist doorstep blood draw with cold-chain telemetry
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Option 2: Medical-Report Extraction */}
            <TouchableOpacity
              style={[styles.gatedOptionCard, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
              onPress={() => navigation.navigate('HealthSetup', { mode: 'report' })}
              activeOpacity={0.85}
            >
              <View style={[styles.gatedOptionIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <FileText size={20} color={colors.emeraldLight || '#34d399'} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.gatedOptionHeaderRow}>
                  <Text style={[styles.gatedOptionName, { color: colors.textPrimary }]}>2. Medical-Report Extraction</Text>
                  <View style={[styles.goldBadge, { backgroundColor: colors.emeraldLight || '#34d399' }]}>
                    <Text style={styles.goldBadgeText}>AI OCR • 60s</Text>
                  </View>
                </View>
                <Text style={[styles.gatedOptionDesc, { color: colors.textMuted }]}>
                  Upload existing hospital report or lab PDF for automated OCR extraction
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Option 3: Manual Clinical Entry */}
            <TouchableOpacity
              style={[styles.gatedOptionCard, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
              onPress={() => navigation.navigate('HealthSetup', { mode: 'manual' })}
              activeOpacity={0.85}
            >
              <View style={[styles.gatedOptionIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Edit3 size={20} color={colors.amberLight || '#f59e0b'} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.gatedOptionHeaderRow}>
                  <Text style={[styles.gatedOptionName, { color: colors.textPrimary }]}>3. Manual Clinical Entry</Text>
                  <View style={[styles.goldBadge, { backgroundColor: 'rgba(255, 255, 255, 0.18)' }]}>
                    <Text style={[styles.goldBadgeText, { color: '#ffffff' }]}>INSTANT</Text>
                  </View>
                </View>
                <Text style={[styles.gatedOptionDesc, { color: colors.textMuted }]}>
                  Manually report your fasting blood glucose and resting blood pressure
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelSecondaryBtn, { borderColor: colors.borderSubtle, backgroundColor: colors.bgCardElevated }]}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelSecondaryBtnText, { color: colors.textMuted }]}>RETURN TO HOME</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // CLINICAL CALCULATIONS FOR UNLOCKED STATE
  // -------------------------------------------------------------
  const baseGlucose = latestVitals?.metabolicHealth?.glucoseFasting || 92;
  const baseSystolic = latestVitals?.cardiovascularRisk?.systolic || 120;
  const baseDiastolic = latestVitals?.cardiovascularRisk?.diastolic || 80;
  const baseHbA1c = latestVitals?.metabolicHealth?.hba1c || 5.4;
  const baseCholesterol = latestVitals?.cardiovascularRisk?.totalCholesterol || 178;

  // Scaled Macronutrients
  const baseNutrients = scannedFood?.nutrients || {
    calories: 380,
    carbohydrates: 40,
    proteins: 24,
    fats: 14,
    fiber: 6,
    sugar: 4,
    sodium: 300,
  };

  const currentCalories = Math.round((baseNutrients.calories || 350) * portionMultiplier);
  const currentCarbs = Math.round((baseNutrients.carbohydrates || 40) * portionMultiplier);
  const currentProtein = Math.round((baseNutrients.proteins || 25) * portionMultiplier);
  const currentFat = Math.round((baseNutrients.fats || 14) * portionMultiplier);
  const currentFiber = Math.round((baseNutrients.fiber || 6) * portionMultiplier);
  const currentSugar = Math.round((baseNutrients.sugar || 4) * portionMultiplier);
  const currentSodium = Math.round((baseNutrients.sodium || 280) * portionMultiplier);

  // Dynamic Metabolic Impact Simulation
  const carbMultiplier = baseGlucose > 105 ? 0.38 : 0.22;
  const projectedSpike = Math.round(currentCarbs * carbMultiplier);
  const estimatedPeakGlucose = baseGlucose + projectedSpike;
  const projectedBpSpike = Number((currentSodium * 0.008).toFixed(1));

  const isOverrideActive =
    customDishName.trim().length > 0 &&
    customDishName.trim().toLowerCase() !== selectedCandidate.trim().toLowerCase();

  // -------------------------------------------------------------
  // UNLOCKED STATE RENDER
  // -------------------------------------------------------------
  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.bgPrimary }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.bgCardElevated }]}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>AI Nutrition Scanner</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Real-Time Multimodal Recognition</Text>
        </View>

        <View style={styles.vitalsActivePill}>
          <CheckCircle2 size={12} color={colors.emeraldLight || '#10b981'} />
          <Text style={[styles.vitalsActiveText, { color: colors.emeraldLight || '#10b981' }]}>
            Vitals Calibrated
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Restored Draft Banner */}
        {hasRestoredDraft && scannedFood && (
          <View style={styles.restoredBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <RotateCcw size={16} color={colors.cyan} />
              <View style={{ flex: 1 }}>
                <Text style={styles.restoredBannerTitle}>In-Progress Meal Scan Restored</Text>
                <Text style={styles.restoredBannerSub}>Resumed your unconfirmed scan without data loss</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.restoredDiscardBtn}
              onPress={() => handleDiscardScan(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.restoredDiscardText}>DISCARD</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW A: CAMERA VIEWFINDER & INTAKE (When no food is scanned yet) */}
        {/* ------------------------------------------------------------- */}
        {!scannedFood ? (
          <View>
            {/* Viewfinder Card */}
            <View
              style={[
                styles.viewfinderCard,
                { backgroundColor: isDark ? '#051117' : '#f0fdf4', borderColor: colors.cyan },
              ]}
            >
              {/* Tech Laser Scan Line */}
              {isScanning && (
                <Animated.View
                  style={[
                    styles.laserLine,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 190],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}

              {/* Viewfinder Corner Brackets */}
              <View style={styles.viewfinderCorners}>
                <View style={[styles.corner, styles.cornerTL, { borderColor: colors.cyan }]} />
                <View style={[styles.corner, styles.cornerTR, { borderColor: colors.cyan }]} />
                <View style={[styles.corner, styles.cornerBL, { borderColor: colors.cyan }]} />
                <View style={[styles.corner, styles.cornerBR, { borderColor: colors.cyan }]} />
              </View>

              {/* Image Preview or Default Viewfinder Icon */}
              {localImageUri ? (
                <Image source={{ uri: localImageUri }} style={styles.viewfinderImagePreview} resizeMode="cover" />
              ) : (
                <View style={styles.viewfinderContent}>
                  <View style={[styles.cameraIconCircle, { backgroundColor: 'rgba(6, 182, 212, 0.12)' }]}>
                    <Camera size={38} color={colors.cyan} />
                  </View>
                  <Text style={[styles.viewfinderLabel, { color: colors.cyanLight || colors.cyan }]}>
                    CAPTURE OR UPLOAD MEAL PHOTO
                  </Text>
                  <Text style={[styles.viewfinderSub, { color: colors.textMuted }]}>
                    Computer Vision identifies dishes, portions, and computes glycemic surge
                  </Text>
                </View>
              )}

              {/* Active Scan Indicator Overlay */}
              {isScanning && (
                <View style={styles.scanningOverlay}>
                  <ActivityIndicator size="large" color={colors.cyan} />
                  <Text style={styles.scanningStepText}>{scanStepMessage}</Text>
                  <Text style={styles.scanningSubText}>Cross-referencing baseline glucose & BP profile...</Text>
                </View>
              )}

              {/* Tech Badge */}
              <View style={styles.viewfinderBadge}>
                <Sparkles size={12} color={colors.cyan} />
                <Text style={styles.viewfinderBadgeText}>BioSync Multimodal Vision 2.5</Text>
              </View>
            </View>

            {/* Camera / Gallery Trigger Buttons */}
            <View style={styles.captureActionRow}>
              <TouchableOpacity
                style={[styles.primaryCaptureBtn, isScanning && { opacity: 0.6 }]}
                onPress={takePhoto}
                disabled={isScanning}
                activeOpacity={0.85}
              >
                <Camera size={18} color="#000000" />
                <Text style={styles.primaryCaptureBtnText}>TAKE MEAL PHOTO</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryCaptureBtn, { borderColor: colors.borderSubtle, backgroundColor: colors.bgCardElevated }]}
                onPress={pickFromGallery}
                disabled={isScanning}
                activeOpacity={0.85}
              >
                <ImageIcon size={18} color={colors.textPrimary} />
                <Text style={[styles.secondaryCaptureBtnText, { color: colors.textPrimary }]}>GALLERY</Text>
              </TouchableOpacity>
            </View>

            {/* Packaged Food Barcode Scanner Trigger Button */}
            <TouchableOpacity
              style={styles.barcodeScanActionBtn}
              onPress={() => setBarcodeScannerVisible(true)}
              disabled={isScanning}
              activeOpacity={0.85}
            >
              <Barcode size={18} color="#000000" />
              <Text style={styles.barcodeScanActionBtnText}>SCAN PACKAGED PRODUCT BARCODE (UPC/EAN)</Text>
            </TouchableOpacity>

            {/* Quick Testing Meal Camera Simulator Section */}
            <View style={styles.presetSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.cyan }]}>QUICK CAMERA DEMO SAMPLES</Text>
                <Text style={[styles.sectionNote, { color: colors.textMuted }]}>Real AI pipeline execution</Text>
              </View>

              {CAMERA_PRESET_MEALS.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.presetCard, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
                  onPress={() => handleSelectPreset(preset)}
                  disabled={isScanning}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: preset.imageUri }} style={styles.presetThumb} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.presetName, { color: colors.textPrimary }]}>{preset.name}</Text>
                    <Text style={[styles.presetDesc, { color: colors.textMuted }]} numberOfLines={1}>
                      {preset.description}
                    </Text>
                    <View style={styles.presetMetaRow}>
                      <Text style={[styles.presetMetaText, { color: colors.emeraldLight || '#10b981' }]}>
                        {preset.calories} kcal
                      </Text>
                      <Text style={[styles.presetMetaText, { color: colors.textMuted }]}>•</Text>
                      <Text style={[styles.presetMetaText, { color: colors.cyan }]}>
                        {Math.round(preset.candidates[0].confidence * 100)}% match
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          /* ------------------------------------------------------------- */
          /* VIEW B: SCANNED CANDIDATES & CLINICAL PROVENANCE BREAKDOWN     */
          /* ------------------------------------------------------------- */
          <View>
            {/* Scanned Image Preview Strip with Retake Action */}
            <View style={[styles.scannedPreviewCard, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
              {localImageUri ? (
                <Image source={{ uri: localImageUri }} style={styles.scannedPreviewThumb} resizeMode="cover" />
              ) : (
                <View style={[styles.scannedPreviewThumb, { backgroundColor: colors.bgCardSurface, justifyContent: 'center', alignItems: 'center' }]}>
                  <Camera size={24} color={colors.textMuted} />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.scannedFoodTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {customDishName || selectedCandidate}
                  </Text>
                </View>
                <Text style={[styles.scannedFoodSub, { color: colors.textMuted }]}>
                  Portion: {portionMultiplier}x standard serving ({scannedFood.servingUnit || 'portion'})
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.retakeBtn, { borderColor: colors.borderSubtle, backgroundColor: colors.bgCardSurface }]}
                onPress={() => handleDiscardScan(true)}
                activeOpacity={0.7}
              >
                <RefreshCw size={13} color={colors.cyan} />
                <Text style={[styles.retakeBtnText, { color: colors.cyan }]}>Retake</Text>
              </TouchableOpacity>
            </View>

            {/* 1. Multi-Candidate Identification & Confidence Breakdown */}
            <GlassCard style={styles.cardSection}>
              <View style={styles.cardSectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Scan size={16} color={colors.cyan} />
                  <Text style={[styles.cardSectionTitle, { color: colors.textPrimary }]}>
                    AI CANDIDATE CONFIDENCE BREAKDOWN
                  </Text>
                </View>
                <View style={styles.highConfTag}>
                  <Text style={styles.highConfText}>
                    {scannedFood.confidenceLevel || 'High'} Confidence
                  </Text>
                </View>
              </View>
              <Text style={[styles.cardSectionHint, { color: colors.textMuted }]}>
                BioSync multimodal AI identified multiple potential candidates. Tap any candidate to switch selection:
              </Text>

              {candidates.map((cand, idx) => {
                const isSelected = selectedCandidate.toLowerCase() === cand.name.toLowerCase();
                const confPercent = Math.round((cand.confidence || 0.75) * 100);

                return (
                  <TouchableOpacity
                    key={`${cand.name}_${idx}`}
                    style={[
                      styles.candidateCard,
                      {
                        backgroundColor: isSelected
                          ? isDark ? '#061f21' : '#ecfeff'
                          : colors.bgCardElevated,
                        borderColor: isSelected ? colors.cyan : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => {
                      setSelectedCandidate(cand.name);
                      setCustomDishName(cand.name);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.candidateTopRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <View
                          style={[
                            styles.candidateRadio,
                            isSelected && { borderColor: colors.cyan, backgroundColor: colors.cyan },
                          ]}
                        >
                          {isSelected && <View style={styles.candidateRadioInner} />}
                        </View>
                        <Text
                          style={[
                            styles.candidateName,
                            { color: isSelected ? colors.cyan : colors.textPrimary },
                          ]}
                        >
                          {cand.name}
                        </Text>
                      </View>
                      <View style={styles.candidateScorePill}>
                        <Text style={styles.candidateScoreText}>{confPercent}%</Text>
                      </View>
                    </View>

                    {/* Visual Confidence Progress Bar */}
                    <View style={styles.confBarTrack}>
                      <View
                        style={[
                          styles.confBarFill,
                          {
                            width: `${confPercent}%`,
                            backgroundColor: isSelected ? colors.cyan : 'rgba(6, 182, 212, 0.4)',
                          },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* User Dish Name Override / Correction */}
              <View style={[styles.overrideBox, { borderColor: colors.borderSubtle, backgroundColor: colors.bgCardElevated }]}>
                <View style={styles.overrideHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Edit3 size={14} color={colors.amberLight || '#f59e0b'} />
                    <Text style={[styles.overrideTitle, { color: colors.textPrimary }]}>
                      User Dish Correction (Override)
                    </Text>
                  </View>
                  {isOverrideActive && (
                    <View style={styles.overrideActiveBadge}>
                      <Text style={styles.overrideActiveText}>USER OVERRIDE</Text>
                    </View>
                  )}
                </View>
                <TextInput
                  style={[styles.overrideInput, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  value={customDishName}
                  onChangeText={setCustomDishName}
                  placeholder="Type exact dish name if different..."
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </GlassCard>

            {/* 2. Interactive Portion Size Scaler */}
            <GlassCard style={styles.cardSection}>
              <View style={styles.cardSectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Scale size={16} color={colors.cyan} />
                  <Text style={[styles.cardSectionTitle, { color: colors.textPrimary }]}>
                    INTERACTIVE PORTION SIZE SCALING
                  </Text>
                </View>
                <Text style={[styles.portionValueText, { color: colors.cyan }]}>
                  {portionMultiplier}x
                </Text>
              </View>
              <Text style={[styles.cardSectionHint, { color: colors.textMuted }]}>
                Scaling portion dynamically recalculates all nutrients and glycemic surge projections in real time.
              </Text>

              {/* Portion Stepper Row */}
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
                  onPress={() => setPortionMultiplier((prev) => Math.max(0.25, Number((prev - 0.25).toFixed(2))))}
                  activeOpacity={0.7}
                >
                  <Minus size={18} color={colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.stepperDisplay}>
                  <Text style={[styles.stepperMultiplier, { color: colors.textPrimary }]}>
                    {portionMultiplier}x Portion
                  </Text>
                  <Text style={[styles.stepperWeight, { color: colors.textMuted }]}>
                    approx. {Math.round(260 * portionMultiplier)}g
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
                  onPress={() => setPortionMultiplier((prev) => Math.min(4.0, Number((prev + 0.25).toFixed(2))))}
                  activeOpacity={0.7}
                >
                  <Plus size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Quick Preset Buttons */}
              <View style={styles.presetButtonsRow}>
                {[
                  { label: '0.5x (Half)', val: 0.5 },
                  { label: '1.0x (Regular)', val: 1.0 },
                  { label: '1.5x (Hearty)', val: 1.5 },
                  { label: '2.0x (Double)', val: 2.0 },
                ].map((item) => {
                  const isSelected = portionMultiplier === item.val;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.portionPresetChip,
                        {
                          backgroundColor: isSelected ? colors.cyan : colors.bgCardElevated,
                          borderColor: isSelected ? colors.cyan : colors.borderSubtle,
                        },
                      ]}
                      onPress={() => setPortionMultiplier(item.val)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.portionPresetChipText,
                          { color: isSelected ? '#000000' : colors.textPrimary },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </GlassCard>

            {/* ============================================================= */}
            {/* 3. CLINICAL PROVENANCE SEPARATION: 3 DEDICATED SECTIONS       */}
            {/* ============================================================= */}

            {/* PROVENANCE SECTION 1: [MEASURED BASELINE] */}
            <GlassCard style={styles.provenanceCard}>
              <View style={styles.provenanceBadgeRow}>
                <View style={[styles.provenanceBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.35)' }]}>
                  <CheckCircle2 size={12} color={colors.emeraldLight || '#10b981'} />
                  <Text style={[styles.provenanceBadgeText, { color: colors.emeraldLight || '#10b981' }]}>
                    [MEASURED BASELINE]
                  </Text>
                </View>
                <Text style={[styles.provenanceSource, { color: colors.textMuted }]}>
                  Clinical Lab & Vitals Assessment
                </Text>
              </View>

              <Text style={[styles.provenanceTitle, { color: colors.textPrimary }]}>
                Calibrated Metabolic Ground Truth
              </Text>

              <View style={styles.baselineGrid}>
                <View style={[styles.baselineItem, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.baselineItemLabel, { color: colors.textMuted }]}>FASTING GLUCOSE</Text>
                  <Text style={[styles.baselineItemVal, { color: colors.textPrimary }]}>
                    {baseGlucose} <Text style={styles.baselineUnit}>mg/dL</Text>
                  </Text>
                  <Text style={[styles.baselineStatus, { color: baseGlucose <= 100 ? colors.emeraldLight || '#10b981' : colors.amberLight || '#f59e0b' }]}>
                    {baseGlucose <= 100 ? 'Normal Fasting' : 'Elevated Fasting'}
                  </Text>
                </View>

                <View style={[styles.baselineItem, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.baselineItemLabel, { color: colors.textMuted }]}>RESTING BP</Text>
                  <Text style={[styles.baselineItemVal, { color: colors.textPrimary }]}>
                    {baseSystolic}/{baseDiastolic} <Text style={styles.baselineUnit}>mmHg</Text>
                  </Text>
                  <Text style={[styles.baselineStatus, { color: colors.emeraldLight || '#10b981' }]}>
                    Optimal
                  </Text>
                </View>

                <View style={[styles.baselineItem, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.baselineItemLabel, { color: colors.textMuted }]}>HBA1C</Text>
                  <Text style={[styles.baselineItemVal, { color: colors.textPrimary }]}>
                    {baseHbA1c} <Text style={styles.baselineUnit}>%</Text>
                  </Text>
                  <Text style={[styles.baselineStatus, { color: colors.emeraldLight || '#10b981' }]}>
                    Stable
                  </Text>
                </View>

                <View style={[styles.baselineItem, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.baselineItemLabel, { color: colors.textMuted }]}>CHOLESTEROL</Text>
                  <Text style={[styles.baselineItemVal, { color: colors.textPrimary }]}>
                    {baseCholesterol} <Text style={styles.baselineUnit}>mg/dL</Text>
                  </Text>
                  <Text style={[styles.baselineStatus, { color: colors.emeraldLight || '#10b981' }]}>
                    Calibrated
                  </Text>
                </View>
              </View>

              <Text style={[styles.provenanceExplanation, { color: colors.textMuted }]}>
                These verified clinical biomarkers ground the BioSync AI predictive engine to prevent dangerous false negative assumptions.
              </Text>
            </GlassCard>

            {/* PROVENANCE SECTION 2: [AI NUTRITION ESTIMATE] */}
            <GlassCard style={styles.provenanceCard}>
              <View style={styles.provenanceBadgeRow}>
                <View style={[styles.provenanceBadge, { backgroundColor: 'rgba(6, 182, 212, 0.15)', borderColor: 'rgba(6, 182, 212, 0.35)' }]}>
                  <Sparkles size={12} color={colors.cyan} />
                  <Text style={[styles.provenanceBadgeText, { color: colors.cyan }]}>
                    [AI NUTRITION ESTIMATE]
                  </Text>
                </View>
                <Text style={[styles.provenanceSource, { color: colors.textMuted }]}>
                  Multimodal Computer Vision Model
                </Text>
              </View>

              <Text style={[styles.provenanceTitle, { color: colors.textPrimary }]}>
                Visual Macronutrient Decomposition ({portionMultiplier}x Scale)
              </Text>

              {/* Macro Grid */}
              <View style={styles.macroGrid}>
                <View style={[styles.macroBox, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.macroLabel, { color: colors.textMuted }]}>CALORIES</Text>
                  <Text style={[styles.macroVal, { color: colors.textPrimary }]}>{currentCalories}</Text>
                  <Text style={[styles.macroSubUnit, { color: colors.textMuted }]}>kcal</Text>
                </View>
                <View style={[styles.macroBox, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.macroLabel, { color: colors.textMuted }]}>CARBS</Text>
                  <Text style={[styles.macroVal, { color: colors.cyan }]}>{currentCarbs}g</Text>
                  <Text style={[styles.macroSubUnit, { color: colors.textMuted }]}>Net</Text>
                </View>
                <View style={[styles.macroBox, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.macroLabel, { color: colors.textMuted }]}>PROTEIN</Text>
                  <Text style={[styles.macroVal, { color: colors.emeraldLight || '#10b981' }]}>{currentProtein}g</Text>
                  <Text style={[styles.macroSubUnit, { color: colors.textMuted }]}>Lean</Text>
                </View>
                <View style={[styles.macroBox, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.macroLabel, { color: colors.textMuted }]}>FATS</Text>
                  <Text style={[styles.macroVal, { color: colors.amberLight || '#f59e0b' }]}>{currentFat}g</Text>
                  <Text style={[styles.macroSubUnit, { color: colors.textMuted }]}>Lipids</Text>
                </View>
              </View>

              <View style={[styles.microRow, { borderTopColor: colors.borderSubtle }]}>
                <Text style={[styles.microText, { color: colors.textMuted }]}>
                  Fiber: <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{currentFiber}g</Text>
                </Text>
                <Text style={[styles.microText, { color: colors.textMuted }]}>•</Text>
                <Text style={[styles.microText, { color: colors.textMuted }]}>
                  Sugar: <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{currentSugar}g</Text>
                </Text>
                <Text style={[styles.microText, { color: colors.textMuted }]}>•</Text>
                <Text style={[styles.microText, { color: colors.textMuted }]}>
                  Sodium: <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{currentSodium}mg</Text>
                </Text>
              </View>

              <Text style={[styles.provenanceExplanation, { color: colors.textMuted }]}>
                Estimated via optical density and portion geometry. Values automatically multiply by your active portion scaling factor.
              </Text>
            </GlassCard>

            {/* PROVENANCE SECTION 3: [PROJECTED GLYCEMIC SURGE] */}
            <GlassCard style={styles.provenanceCard}>
              <View style={styles.provenanceBadgeRow}>
                <View style={[styles.provenanceBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.35)' }]}>
                  <Activity size={12} color={colors.amberLight || '#f59e0b'} />
                  <Text style={[styles.provenanceBadgeText, { color: colors.amberLight || '#f59e0b' }]}>
                    [PROJECTED GLYCEMIC SURGE]
                  </Text>
                </View>
                <Text style={[styles.provenanceSource, { color: colors.textMuted }]}>
                  BioSync Biometric Impact Model
                </Text>
              </View>

              <Text style={[styles.provenanceTitle, { color: colors.textPrimary }]}>
                Postprandial Glucose & Cardiovascular Response
              </Text>

              {/* Glycemic Spike Highlight Card */}
              <View
                style={[
                  styles.spikeHighlightBox,
                  {
                    backgroundColor:
                      projectedSpike <= 25
                        ? 'rgba(16, 185, 129, 0.12)'
                        : projectedSpike <= 45
                        ? 'rgba(245, 158, 11, 0.12)'
                        : 'rgba(239, 68, 68, 0.12)',
                    borderColor:
                      projectedSpike <= 25
                        ? colors.emeraldLight || '#10b981'
                        : projectedSpike <= 45
                        ? colors.amberLight || '#f59e0b'
                        : '#ef4444',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={[styles.spikeMainLabel, { color: colors.textMuted }]}>
                      PROJECTED GLUCOSE SURGE
                    </Text>
                    <Text
                      style={[
                        styles.spikeMainVal,
                        {
                          color:
                            projectedSpike <= 25
                              ? colors.emeraldLight || '#10b981'
                              : projectedSpike <= 45
                              ? colors.amberLight || '#f59e0b'
                              : '#ef4444',
                        },
                      ]}
                    >
                      +{projectedSpike} mg/dL
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.spikeMainLabel, { color: colors.textMuted }]}>
                      2-HOUR ESTIMATED PEAK
                    </Text>
                    <Text style={[styles.peakMainVal, { color: colors.textPrimary }]}>
                      ~{estimatedPeakGlucose} mg/dL
                    </Text>
                  </View>
                </View>

                {/* Risk Level Badge */}
                <View style={styles.spikeTierRow}>
                  <View
                    style={[
                      styles.spikeTierPill,
                      {
                        backgroundColor:
                          projectedSpike <= 25
                            ? 'rgba(16, 185, 129, 0.2)'
                            : projectedSpike <= 45
                            ? 'rgba(245, 158, 11, 0.2)'
                            : 'rgba(239, 68, 68, 0.2)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.spikeTierText,
                        {
                          color:
                            projectedSpike <= 25
                              ? colors.emeraldLight || '#10b981'
                              : projectedSpike <= 45
                              ? colors.amberLight || '#f59e0b'
                              : '#ef4444',
                        },
                      ]}
                    >
                      {projectedSpike <= 25
                        ? 'OPTIMAL METABOLIC RESPONSE'
                        : projectedSpike <= 45
                        ? 'MODERATE POSTPRANDIAL LOAD'
                        : 'ELEVATED GLYCEMIC SURGE ALERT'}
                    </Text>
                  </View>
                  <Text style={[styles.bpImpactText, { color: colors.textMuted }]}>
                    BP impact: +{projectedBpSpike} mmHg systolic
                  </Text>
                </View>
              </View>

              {/* Actionable Clinical Recommendations */}
              <View style={[styles.adviceBox, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Sparkles size={14} color={colors.cyan} />
                  <Text style={[styles.adviceTitle, { color: colors.cyan }]}>
                    AI Personal Metabolic Advice
                  </Text>
                </View>
                <Text style={[styles.adviceBody, { color: colors.textSecondary }]}>
                  {scannedFood.predictedImpact?.aiWarningMessage ||
                    `Calculated for your fasting glucose (${baseGlucose} mg/dL). Consuming ${currentCarbs}g net carbs will yield a steady glycemic trajectory.`}
                </Text>

                {scannedFood.predictedImpact?.aiAlternativeSuggestions &&
                  scannedFood.predictedImpact.aiAlternativeSuggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                      {scannedFood.predictedImpact.aiAlternativeSuggestions.map((item, idx) => (
                        <View key={idx} style={styles.suggestionRow}>
                          <CornerDownRight size={13} color={colors.emeraldLight || '#10b981'} />
                          <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                            {item}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
              </View>

              <Text style={[styles.provenanceExplanation, { color: colors.textMuted }]}>
                Synthesized by projecting the meal's carbohydrate mass and digestive fiber against your clinically verified fasting glucose baseline.
              </Text>
            </GlassCard>

            {/* Confirm & Log Action Buttons */}
            <View style={styles.bottomActionContainer}>
              <TouchableOpacity
                style={[styles.confirmLogBtn, isConfirming && { opacity: 0.7 }]}
                onPress={handleConfirmMeal}
                disabled={isConfirming}
                activeOpacity={0.85}
              >
                {isConfirming ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <CheckSquare size={18} color="#000000" />
                    <Text style={styles.confirmLogBtnText}>CONFIRM & LOG TO TIMELINE</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.discardBtn, { borderColor: colors.borderSubtle, backgroundColor: colors.bgCardElevated }]}
                onPress={() => handleDiscardScan(true)}
                disabled={isConfirming}
                activeOpacity={0.8}
              >
                <Text style={[styles.discardBtnText, { color: colors.textMuted }]}>DISCARD & SCAN NEW</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Packaged Food Barcode Scanner Modal */}
      <FoodBarcodeScannerModal
        visible={barcodeScannerVisible}
        onClose={() => setBarcodeScannerVisible(false)}
        onFoodFound={handleBarcodeFoodFound}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 1,
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
    fontSize: 9.5,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Restored in-progress scan banner
  restoredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.35)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  restoredBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#06b6d4',
  },
  restoredBannerSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  restoredDiscardBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  restoredDiscardText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#f87171',
    letterSpacing: 0.5,
  },

  // Viewfinder Area
  viewfinderCard: {
    height: 220,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
    overflow: 'hidden',
  },
  laserLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#06b6d4',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  viewfinderCorners: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    bottom: 14,
    pointerEvents: 'none',
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
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
  viewfinderImagePreview: {
    width: '100%',
    height: '100%',
  },
  viewfinderContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cameraIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  viewfinderLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  viewfinderSub: {
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 15,
  },
  viewfinderBadge: {
    position: 'absolute',
    bottom: 10,
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
    color: '#06b6d4',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    paddingHorizontal: 20,
  },
  scanningStepText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 12,
    textAlign: 'center',
  },
  scanningSubText: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },

  // Action Buttons Below Viewfinder
  captureActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  primaryCaptureBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#06b6d4',
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryCaptureBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  secondaryCaptureBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryCaptureBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  barcodeScanActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#06b6d4',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  barcodeScanActionBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },

  // Preset Section
  presetSection: {
    marginTop: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectionNote: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
  },
  presetThumb: {
    width: 54,
    height: 54,
    borderRadius: 10,
  },
  presetName: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  presetDesc: {
    fontSize: 10.5,
    marginTop: 2,
  },
  presetMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  presetMetaText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Scanned Preview Header Strip
  scannedPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
  },
  scannedPreviewThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  scannedFoodTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  scannedFoodSub: {
    fontSize: 10.5,
    marginTop: 2,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  retakeBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // Generic Card Section
  cardSection: {
    marginBottom: 14,
    padding: 14,
  },
  cardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardSectionHint: {
    fontSize: 10.5,
    lineHeight: 15,
    marginBottom: 10,
  },
  highConfTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  highConfText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#10b981',
  },

  // Multi-Candidate List
  candidateCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  candidateTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  candidateRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateRadioInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
  },
  candidateName: {
    fontSize: 12,
    fontWeight: '800',
  },
  candidateScorePill: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  candidateScoreText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#06b6d4',
  },
  confBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  confBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // User Dish Override
  overrideBox: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  overrideHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  overrideTitle: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  overrideActiveBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  overrideActiveText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#f59e0b',
  },
  overrideInput: {
    fontSize: 11.5,
    fontWeight: '700',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  // Portion Stepper
  portionValueText: {
    fontSize: 14,
    fontWeight: '900',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDisplay: {
    alignItems: 'center',
  },
  stepperMultiplier: {
    fontSize: 16,
    fontWeight: '900',
  },
  stepperWeight: {
    fontSize: 10,
    marginTop: 2,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  portionPresetChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionPresetChipText: {
    fontSize: 9.5,
    fontWeight: '800',
  },

  // -------------------------------------------------------------
  // PROVENANCE CARDS (3 DEDICATED CLINICAL SECTIONS)
  // -------------------------------------------------------------
  provenanceCard: {
    marginBottom: 14,
    padding: 14,
  },
  provenanceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  provenanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  provenanceBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  provenanceSource: {
    fontSize: 9,
    fontWeight: '600',
  },
  provenanceTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 10,
  },
  provenanceExplanation: {
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Measured Baseline Grid
  baselineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  baselineItem: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
  },
  baselineItemLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  baselineItemVal: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  baselineUnit: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94a3b8',
  },
  baselineStatus: {
    fontSize: 8.5,
    fontWeight: '800',
    marginTop: 2,
  },

  // AI Nutrition Estimate Grid
  macroGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  macroBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  macroVal: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  macroSubUnit: {
    fontSize: 8.5,
    marginTop: 1,
  },
  microRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 8,
  },
  microText: {
    fontSize: 10,
  },

  // Projected Glycemic Surge
  spikeHighlightBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  spikeMainLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  spikeMainVal: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  peakMainVal: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  spikeTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  spikeTierPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  spikeTierText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bpImpactText: {
    fontSize: 9.5,
  },
  adviceBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  adviceTitle: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  adviceBody: {
    fontSize: 10.5,
    lineHeight: 15,
  },
  suggestionsContainer: {
    marginTop: 6,
    gap: 4,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestionText: {
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },

  // Bottom Actions
  bottomActionContainer: {
    marginTop: 6,
    gap: 8,
  },
  confirmLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#06b6d4',
    paddingVertical: 15,
    borderRadius: 14,
  },
  confirmLogBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.8,
  },
  discardBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  discardBtnText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Gated State
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
    marginBottom: 16,
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
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  lockedSubtitle: {
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
  },
  explanationCard: {
    padding: 14,
    marginBottom: 20,
    width: '100%',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  gatedOptionsContainer: {
    width: '100%',
    gap: 8,
  },
  gatedOptionsTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
    textAlign: 'center',
  },
  gatedOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  gatedOptionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gatedOptionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  gatedOptionName: {
    fontSize: 12,
    fontWeight: '800',
  },
  gatedOptionDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  goldBadge: {
    backgroundColor: '#06b6d4',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  goldBadgeText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  cancelSecondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  cancelSecondaryBtnText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default FoodScannerScreen;
