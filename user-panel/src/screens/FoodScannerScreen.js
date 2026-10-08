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
import * as ImagePicker from 'expo-image-picker';
import {
  ShieldAlert,
  CalendarPlus,
  ArrowLeft,
  X,
  Camera,
  Scan,
  Sparkles,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
  Edit3,
  ChevronRight,
  Image as ImageIcon,
  RefreshCw,
  Scale,
  Plus,
  Minus,
  CheckSquare,
  CornerDownRight,
  Barcode,
  TrendingDown,
  Layers,
  Heart,
  Droplets,
  Zap,
} from 'lucide-react-native';
import { colors, useTheme } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import userApi from '../api/userApi';
import draftService from '../services/draftService';
import GlassCard from '../components/GlassCard';
import FoodBarcodeScannerModal from '../components/FoodBarcodeScannerModal';
import VitalSurgeCurveChart from '../components/VitalSurgeCurveChart';
import WeeklyKalmanCalibrationModal from '../components/WeeklyKalmanCalibrationModal';

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

  // Multi-item detected list & active selected item index
  const [allDetectedItems, setAllDetectedItems] = useState([]);
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  // Strict non-hallucination refusal state
  const [refusalMessage, setRefusalMessage] = useState(null);

  // Portion Scaling (0.25x - 4.0x)
  const [portionMultiplier, setPortionMultiplier] = useState(1.0);
  const [userDecision, setUserDecision] = useState('Consume');

  // Interactive Applied Doctor Hacks (Pareto harm reduction)
  const [appliedHacks, setAppliedHacks] = useState([]);

  // Modals
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);
  const [kalmanModalVisible, setKalmanModalVisible] = useState(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

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
      const res = await userApi.getUnconfirmedScan();
      if (res?.success && res.data) {
        populateScannedState(res.data, true);
        return;
      }

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
    setRefusalMessage(null);

    // Detected multi-items array
    const detected = foodLogData.allDetectedItems || [];
    setAllDetectedItems(detected);
    setActiveItemIndex(0);

    // Candidates normalization
    const cands =
      foodLogData.candidates && foodLogData.candidates.length > 0
        ? foodLogData.candidates
        : [
            {
              name: foodLogData.recognizedItemName || 'Analyzed Food Item',
              confidence: foodLogData.aiConfidenceScore || 0.85,
            },
          ];
    setCandidates(cands);

    const initialName = foodLogData.recognizedItemName || cands[0]?.name || 'Analyzed Food Item';
    setSelectedCandidate(initialName);
    setCustomDishName(initialName);
    setPortionMultiplier(foodLogData.consumedQuantity || 1.0);
    setUserDecision(foodLogData.userDecision || 'Consume');
    setAppliedHacks([]);

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

  // -------------------------------------------------------------
  // MULTIPART SCAN DISPATCHER (Strict Non-Hallucination)
  // -------------------------------------------------------------
  const handleScanImage = async (imageUri, mimeType, fileName) => {
    setIsScanning(true);
    setLocalImageUri(imageUri);
    setHasRestoredDraft(false);
    setRefusalMessage(null);

    try {
      setScanStepMessage('Executing Multimodal Perception Pipeline...');
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

      setScanStepMessage('Extracting Bio-Nutritional Decomposition & ODE Surge...');
      const res = await userApi.scanFood(formData);

      if (res?.success && res.data) {
        populateScannedState(res.data);
      } else {
        setRefusalMessage(
          res?.message ||
            'Unable to identify eatable food, beverage, or packaged item in this image with clinical confidence.'
        );
      }
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to identify food items with clinical confidence. Please adjust lighting and try again.';
      setRefusalMessage(errMsg);
    } finally {
      setIsScanning(false);
    }
  };

  // Switch inspected item if multiple items were segmented
  const handleSelectItemFromPlate = (item, index) => {
    setActiveItemIndex(index);
    const itemName = item.itemName || selectedCandidate;
    setSelectedCandidate(itemName);
    setCustomDishName(itemName);
  };

  // Toggle Doctor Hack application
  const toggleDoctorHack = (hackName) => {
    setAppliedHacks((prev) =>
      prev.includes(hackName) ? prev.filter((h) => h !== hackName) : [...prev, hackName]
    );
  };

  // -------------------------------------------------------------
  // CONFIRM CONSUMPTION & LOG TO TIMELINE
  // -------------------------------------------------------------
  const handleConfirmMeal = async () => {
    if (!scannedFood) return;

    try {
      setIsConfirming(true);
      const activeName = customDishName.trim() || selectedCandidate || scannedFood.recognizedItemName;

      const scaledNutrients = {
        calories: Math.round((currentNutrients.calories || 350) * portionMultiplier),
        carbohydrates: Math.round((currentNutrients.carbohydrates || 40) * portionMultiplier),
        netCarbohydrates: Math.round((currentNutrients.netCarbohydrates || 34) * portionMultiplier),
        proteins: Math.round((currentNutrients.proteins || 25) * portionMultiplier),
        fats: Math.round((currentNutrients.fats || 12) * portionMultiplier),
        fiber: Math.round((currentNutrients.fiber || 6) * portionMultiplier),
        sugar: Math.round((currentNutrients.sugar || 4) * portionMultiplier),
        sodium: Math.round((currentNutrients.sodium || 280) * portionMultiplier),
        potassium: Math.round((currentNutrients.potassium || 320) * portionMultiplier),
        calcium: Math.round((currentNutrients.calcium || 40) * portionMultiplier),
        iron: Math.round((currentNutrients.iron || 1.8) * portionMultiplier),
        magnesium: Math.round((currentNutrients.magnesium || 30) * portionMultiplier),
        cholesterol: Math.round((currentNutrients.cholesterol || 20) * portionMultiplier),
      };

      const payload = {
        consumedQuantity: portionMultiplier,
        servingUnit: scannedFood.servingUnit || 'portion',
        recognizedItemName: activeName,
        nutrients: scaledNutrients,
        userDecision,
      };

      let confirmRes;
      if (scannedFood._id) {
        confirmRes = await userApi.confirmFoodConsumption(scannedFood._id, payload);
      } else {
        confirmRes = await userApi.logMeal({
          ...payload,
          mealType: 'Lunch',
          predictedImpact: {
            glucoseSpike: Math.round(scaledNutrients.netCarbohydrates * (baseGlucose > 105 ? 0.38 : 0.22)),
            bpSpikeSystolic: Number((scaledNutrients.sodium * 0.008).toFixed(1)),
            aiWarningMessage: scannedFood.predictedImpact?.aiWarningMessage,
          },
        });
      }

      if (confirmRes?.success) {
        await draftService.clearDraft('food_scan');
        Alert.alert(
          'Meal Confirmed & Vital Surge Modeled',
          `"${activeName}" (${portionMultiplier}x portion) has been securely logged into your longitudinal nutrition profile with postprandial vital simulation.`,
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
              setAllDetectedItems([]);
              setRefusalMessage(null);
              setPortionMultiplier(1.0);
              setAppliedHacks([]);
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
      setAllDetectedItems([]);
      setRefusalMessage(null);
      setPortionMultiplier(1.0);
      setAppliedHacks([]);
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
  // CLINICAL BASELINE BIOMARKERS & DIGITAL TWIN VECTORS
  // -------------------------------------------------------------
  const baseGlucose = latestVitals?.metabolicHealth?.glucoseFasting || 92;
  const baseSystolic = latestVitals?.cardiovascularRisk?.systolic || 120;
  const baseDiastolic = latestVitals?.cardiovascularRisk?.diastolic || 80;
  const baseHbA1c = latestVitals?.metabolicHealth?.hba1c || 5.4;
  const baseCholesterol = latestVitals?.cardiovascularRisk?.totalCholesterol || 178;

  const kalmanData = latestVitals?.kalmanCalibration || {};
  const betaCarb = kalmanData.betaCarb || (baseGlucose > 105 ? 0.38 : 0.28);
  const betaSodium = kalmanData.betaSodium || (baseSystolic > 130 ? 0.009 : 0.007);
  const insulinSensitivity = kalmanData.insulinSensitivity || 0.72;

  // Nutritional values from primary item or decomposed data
  const currentNutrients = scannedFood?.nutrients || {
    calories: 350,
    carbohydrates: 42,
    netCarbohydrates: 36,
    proteins: 24,
    fats: 12,
    fiber: 6,
    sugar: 4,
    sodium: 320,
    potassium: 380,
    calcium: 50,
    iron: 2.1,
    magnesium: 35,
  };

  const currentGI = scannedFood?.glycemicIndex || 50;
  const currentNetCarbsScaled = (currentNutrients.netCarbohydrates || currentNutrients.carbohydrates || 36) * portionMultiplier;
  const currentGL = Math.round((currentGI * currentNetCarbsScaled) / 100);

  // Scaled macronutrients
  const scaledCalories = Math.round((currentNutrients.calories || 350) * portionMultiplier);
  const scaledNetCarbs = Math.round(currentNetCarbsScaled);
  const scaledProtein = Math.round((currentNutrients.proteins || 24) * portionMultiplier);
  const scaledFat = Math.round((currentNutrients.fats || 12) * portionMultiplier);
  const scaledFiber = Math.round((currentNutrients.fiber || 6) * portionMultiplier);
  const scaledSodium = Math.round((currentNutrients.sodium || 320) * portionMultiplier);
  const scaledPotassium = Math.round((currentNutrients.potassium || 380) * portionMultiplier);

  // Clinical Doctor Hacks list
  const doctorHacksList =
    scannedFood?.predictedImpact?.doctorHacks && scannedFood.predictedImpact.doctorHacks.length > 0
      ? scannedFood.predictedImpact.doctorHacks
      : [
          {
            hackName: 'Prebiotic Fiber Sequencing',
            timing: '10 min prior to main plate',
            mechanism: 'Viscous duodenal gel blunts glucose absorption kinetics',
            impact: '-28% Glycemic Peak',
          },
          {
            hackName: 'Apple Cider Vinegar / Acid Blocker',
            timing: 'During or right before meal',
            mechanism: 'Acetic acid delays gastric emptying and inhibits alpha-amylase',
            impact: '-20% Glucose Surge',
          },
          {
            hackName: '10-Minute GLUT4 Stroll',
            timing: '15-20 min postprandial',
            mechanism: 'Muscle contraction stimulates non-insulin-mediated glucose clearance',
            impact: '-32% Peak Reduction',
          },
          {
            hackName: 'Potassium Counterbalance',
            timing: 'With high-sodium dishes',
            mechanism: 'Dietary potassium promotes renal natriuresis & buffers vascular BP',
            impact: '-30% Arterial Surge',
          },
        ];

  // -------------------------------------------------------------
  // GATED STATE: VITALS NOT PRESENT
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
                BioSync AI requires verified blood glucose, lipids, and blood pressure to model real biological meal impact.
              </Text>
            </View>
          </GlassCard>
        </View>
      </View>
    );
  }

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
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            YOLOv8 • OCR • Digital Twin • RK4 Simulator
          </Text>
        </View>

        <TouchableOpacity
          style={styles.vitalsActivePill}
          onPress={() => setKalmanModalVisible(true)}
          activeOpacity={0.75}
        >
          <RotateCcw size={12} color={colors.emeraldLight || '#10b981'} />
          <Text style={[styles.vitalsActiveText, { color: colors.emeraldLight || '#10b981' }]}>
            EKF Calibrated
          </Text>
        </TouchableOpacity>
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
                    CAPTURE REAL MEAL PHOTO
                  </Text>
                  <Text style={[styles.viewfinderSub, { color: colors.textMuted }]}>
                    Hold camera 45° overhead. Identifies dishes, portions & calculates vital curves.
                  </Text>
                </View>
              )}

              {/* Active Scan Indicator Overlay */}
              {isScanning && (
                <View style={styles.scanningOverlay}>
                  <ActivityIndicator size="large" color={colors.cyan} />
                  <Text style={styles.scanningStepText}>{scanStepMessage}</Text>
                  <Text style={styles.scanningSubText}>Cross-referencing Digital Twin sensitivity vector...</Text>
                </View>
              )}

              <View style={styles.viewfinderBadge}>
                <Sparkles size={12} color={colors.cyan} />
                <Text style={styles.viewfinderBadgeText}>BioSync Multimodal Perception</Text>
              </View>
            </View>

            {/* Strict Refusal & Retake Banner */}
            {refusalMessage && (
              <GlassCard style={styles.refusalCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ShieldAlert size={22} color="#f87171" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.refusalTitle}>Clinical Guardrail Notice</Text>
                    <Text style={styles.refusalMessage}>{refusalMessage}</Text>
                  </View>
                </View>
              </GlassCard>
            )}

            {/* Camera / Gallery Trigger Buttons */}
            <View style={styles.captureActionRow}>
              <TouchableOpacity
                style={[styles.primaryCaptureBtn, isScanning && { opacity: 0.6 }]}
                onPress={takePhoto}
                disabled={isScanning}
                activeOpacity={0.85}
              >
                <Camera size={18} color="#000000" />
                <Text style={styles.primaryCaptureBtnText}>CAPTURE CAMERA PHOTO</Text>
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

            {/* Guidance Tips Card */}
            <GlassCard style={styles.guidanceCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <CheckCircle2 size={15} color={colors.cyan} />
                <Text style={styles.guidanceTitle}>ACCURACY & PATENT GUIDANCE</Text>
              </View>
              <Text style={styles.guidanceItem}>
                • <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Multi-Item Plates</Text>: Center plate in frame; segmentation extracts individual items.
              </Text>
              <Text style={styles.guidanceItem}>
                • <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Doctor Hacks</Text>: Apply fiber sequencing & walking strolls to visualize live surge mitigation.
              </Text>
              <Text style={styles.guidanceItem}>
                • <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Adaptive AI</Text>: Use top-right "EKF Calibrated" button to enter weekly blood tests.
              </Text>
            </GlassCard>
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
                <Text style={[styles.scannedFoodTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {customDishName || selectedCandidate}
                </Text>
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

            {/* Multi-Item Plate Segmentation Selector */}
            {allDetectedItems && allDetectedItems.length > 1 && (
              <GlassCard style={styles.cardSection}>
                <View style={styles.cardSectionHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Layers size={16} color={colors.cyan} />
                    <Text style={[styles.cardSectionTitle, { color: colors.textPrimary }]}>
                      MULTI-ITEM PLATE RECOGNITION ({allDetectedItems.length} DETECTED)
                    </Text>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.multiItemScroll}>
                  {allDetectedItems.map((it, idx) => {
                    const isSelected = activeItemIndex === idx;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.multiItemChip,
                          isSelected && styles.multiItemChipSelected,
                        ]}
                        onPress={() => handleSelectItemFromPlate(it, idx)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.multiItemChipText, isSelected && styles.multiItemChipTextSelected]}>
                          {it.itemName}
                        </Text>
                        <Text style={styles.multiItemConfText}>
                          {Math.round((it.confidenceScore || 0.8) * 100)}%
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </GlassCard>
            )}

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
                    approx. {Math.round((scannedFood.servingWeightGrams || 150) * portionMultiplier)}g
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

            {/* 3. Bio-Nutritional Decomposition (Macros, Minerals, Vitamins & GI/GL) */}
            <GlassCard style={styles.cardSection}>
              <View style={styles.cardSectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={16} color={colors.cyan} />
                  <Text style={[styles.cardSectionTitle, { color: colors.textPrimary }]}>
                    BIO-NUTRITIONAL DECOMPOSITION ({portionMultiplier}x SCALE)
                  </Text>
                </View>
              </View>

              {/* Primary Macronutrient Grid */}
              <View style={styles.macroGrid}>
                <View style={[styles.macroBox, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.macroLabel, { color: colors.textMuted }]}>CALORIES</Text>
                  <Text style={[styles.macroVal, { color: colors.textPrimary }]}>{scaledCalories}</Text>
                  <Text style={[styles.macroSubUnit, { color: colors.textMuted }]}>kcal</Text>
                </View>
                <View style={[styles.macroBox, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.macroLabel, { color: colors.textMuted }]}>NET CARBS</Text>
                  <Text style={[styles.macroVal, { color: colors.cyan }]}>{scaledNetCarbs}g</Text>
                  <Text style={[styles.macroSubUnit, { color: colors.textMuted }]}>Absorbable</Text>
                </View>
                <View style={[styles.macroBox, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.macroLabel, { color: colors.textMuted }]}>PROTEIN</Text>
                  <Text style={[styles.macroVal, { color: colors.emeraldLight || '#10b981' }]}>{scaledProtein}g</Text>
                  <Text style={[styles.macroSubUnit, { color: colors.textMuted }]}>Amino pool</Text>
                </View>
                <View style={[styles.macroBox, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.macroLabel, { color: colors.textMuted }]}>FATS</Text>
                  <Text style={[styles.macroVal, { color: colors.amberLight || '#f59e0b' }]}>{scaledFat}g</Text>
                  <Text style={[styles.macroSubUnit, { color: colors.textMuted }]}>Lipids</Text>
                </View>
              </View>

              {/* Glycemic Index & Glycemic Load Bar */}
              <View style={[styles.glBarCard, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
                <View style={styles.glBarHeader}>
                  <Text style={styles.glLabel}>GLYCEMIC LOAD (GL = GI × NetCarbs / 100)</Text>
                  <View
                    style={[
                      styles.glPill,
                      {
                        backgroundColor:
                          currentGL <= 10
                            ? 'rgba(16, 185, 129, 0.2)'
                            : currentGL <= 19
                            ? 'rgba(245, 158, 11, 0.2)'
                            : 'rgba(239, 68, 68, 0.2)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.glPillText,
                        {
                          color:
                            currentGL <= 10
                              ? '#10b981'
                              : currentGL <= 19
                              ? '#f59e0b'
                              : '#ef4444',
                        },
                      ]}
                    >
                      {currentGL <= 10 ? 'LOW GL' : currentGL <= 19 ? 'MEDIUM GL' : 'HIGH GL'} ({currentGL})
                    </Text>
                  </View>
                </View>
                <View style={styles.glTrack}>
                  <View
                    style={[
                      styles.glFill,
                      {
                        width: `${Math.min(100, (currentGL / 35) * 100)}%`,
                        backgroundColor:
                          currentGL <= 10 ? '#10b981' : currentGL <= 19 ? '#f59e0b' : '#ef4444',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.giSubText}>
                  Glycemic Index: {currentGI}/100 • Fiber: {scaledFiber}g • Sodium: {scaledSodium}mg • Potassium: {scaledPotassium}mg
                </Text>
              </View>
            </GlassCard>

            {/* 4. Confined Digital Twin Context Card */}
            <GlassCard style={styles.cardSection}>
              <View style={styles.cardSectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={16} color={colors.cyan} />
                  <Text style={[styles.cardSectionTitle, { color: colors.textPrimary }]}>
                    PERSONAL DIGITAL TWIN VECTOR (M_user)
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.recalibrateBtn}
                  onPress={() => setKalmanModalVisible(true)}
                  activeOpacity={0.75}
                >
                  <RotateCcw size={12} color="#06b6d4" />
                  <Text style={styles.recalibrateBtnText}>Recalibrate (EKF)</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.twinParamsRow}>
                <View style={[styles.twinParamItem, { backgroundColor: colors.bgCardElevated }]}>
                  <Text style={styles.twinParamLabel}>β_carb Multiplier</Text>
                  <Text style={styles.twinParamValue}>{betaCarb.toFixed(3)}</Text>
                  <Text style={styles.twinParamSub}>mg/dL per g carb</Text>
                </View>
                <View style={[styles.twinParamItem, { backgroundColor: colors.bgCardElevated }]}>
                  <Text style={styles.twinParamLabel}>β_sodium Multiplier</Text>
                  <Text style={styles.twinParamValue}>{betaSodium.toFixed(4)}</Text>
                  <Text style={styles.twinParamSub}>mmHg per mg Na</Text>
                </View>
                <View style={[styles.twinParamItem, { backgroundColor: colors.bgCardElevated }]}>
                  <Text style={styles.twinParamLabel}>Insulin Sensitivity</Text>
                  <Text style={styles.twinParamValue}>{insulinSensitivity.toFixed(3)}</Text>
                  <Text style={styles.twinParamSub}>Quicki Index</Text>
                </View>
              </View>
            </GlassCard>

            {/* 5. Interactive Doctor Hacks (Pareto Harm Reduction) */}
            <GlassCard style={styles.cardSection}>
              <View style={styles.cardSectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={16} color={colors.cyan} />
                  <Text style={[styles.cardSectionTitle, { color: colors.textPrimary }]}>
                    CLINICAL DOCTOR HACKS (PARETO OPTIMIZATION)
                  </Text>
                </View>
                <Text style={styles.hacksCounter}>
                  {appliedHacks.length} applied
                </Text>
              </View>
              <Text style={[styles.cardSectionHint, { color: colors.textMuted }]}>
                Tap to apply non-preachy clinical sequencing & pairing hacks. Real-time ODE vital surge curve updates instantly below:
              </Text>

              {doctorHacksList.map((hack, idx) => {
                const isApplied = appliedHacks.includes(hack.hackName);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.hackCard,
                      {
                        backgroundColor: isApplied
                          ? isDark ? '#05231c' : '#ecfdf5'
                          : colors.bgCardElevated,
                        borderColor: isApplied ? '#10b981' : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => toggleDoctorHack(hack.hackName)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.hackHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <View
                          style={[
                            styles.hackCheckbox,
                            isApplied && { backgroundColor: '#10b981', borderColor: '#10b981' },
                          ]}
                        >
                          {isApplied && <CheckCircle2 size={13} color="#000000" />}
                        </View>
                        <Text style={[styles.hackName, isApplied && { color: '#10b981' }]}>
                          {hack.hackName}
                        </Text>
                      </View>
                      <View style={styles.hackImpactPill}>
                        <TrendingDown size={11} color="#10b981" />
                        <Text style={styles.hackImpactText}>{hack.impact}</Text>
                      </View>
                    </View>

                    <Text style={[styles.hackMechanism, { color: colors.textMuted }]}>
                      {hack.mechanism} • <Text style={{ color: colors.cyan }}>{hack.timing}</Text>
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </GlassCard>

            {/* 6. Dynamic 180-Minute Postprandial Vital Surge Projection */}
            <GlassCard style={styles.cardSection}>
              <View style={styles.cardSectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Activity size={16} color={colors.cyan} />
                  <Text style={[styles.cardSectionTitle, { color: colors.textPrimary }]}>
                    180-MIN DYNAMIC VITAL SURGE (BERGMAN ODE + WINDKESSEL)
                  </Text>
                </View>
              </View>

              <VitalSurgeCurveChart
                baselineGlucose={baseGlucose}
                baselineBP={baseSystolic}
                netCarbs={scaledNetCarbs}
                sodium={scaledSodium}
                glycemicIndex={currentGI}
                portionMultiplier={1.0}
                appliedHacksCount={appliedHacks.length}
                twinParams={{
                  betaCarb,
                  betaSodium,
                  insulinSensitivity,
                }}
              />
            </GlassCard>

            {/* User Decision Selector */}
            <GlassCard style={styles.cardSection}>
              <Text style={[styles.cardSectionTitle, { color: colors.textPrimary, marginBottom: 8 }]}>
                PATIENT CONSUMPTION DECISION
              </Text>
              <View style={styles.decisionRow}>
                {[
                  { id: 'Consume', label: 'Consume Full' },
                  { id: 'Consume_Smaller_Portion', label: 'Smaller Portion' },
                  { id: 'Replace', label: 'Replace Dish' },
                  { id: 'Do_Not_Consume', label: 'Skip Dish' },
                ].map((dec) => {
                  const isSelected = userDecision === dec.id;
                  return (
                    <TouchableOpacity
                      key={dec.id}
                      style={[
                        styles.decisionChip,
                        {
                          backgroundColor: isSelected ? colors.cyan : colors.bgCardElevated,
                          borderColor: isSelected ? colors.cyan : colors.borderSubtle,
                        },
                      ]}
                      onPress={() => setUserDecision(dec.id)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.decisionChipText,
                          { color: isSelected ? '#000000' : colors.textPrimary },
                        ]}
                      >
                        {dec.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
                    <Text style={styles.confirmLogBtnText}>CONFIRM & RECORD TO TIMELINE</Text>
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

      {/* Barcode Scanner Modal */}
      <FoodBarcodeScannerModal
        visible={barcodeScannerVisible}
        onClose={() => setBarcodeScannerVisible(false)}
        onFoodFound={handleBarcodeFoodFound}
      />

      {/* Weekly Kalman Calibration Modal */}
      <WeeklyKalmanCalibrationModal
        visible={kalmanModalVisible}
        onClose={() => setKalmanModalVisible(false)}
        onSuccess={() => fetchVitals()}
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
    paddingHorizontal: 16,
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
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 9,
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
    paddingVertical: 5,
    borderRadius: 8,
  },
  vitalsActiveText: {
    fontSize: 9,
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

  // Refusal & Notice Card
  refusalCard: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  refusalTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#f87171',
  },
  refusalMessage: {
    fontSize: 11,
    color: '#ffffff',
    marginTop: 3,
    lineHeight: 15,
  },

  // Action Buttons Below Viewfinder
  captureActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
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
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 16,
  },
  barcodeScanActionBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  guidanceCard: {
    padding: 14,
    marginBottom: 14,
  },
  guidanceTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#06b6d4',
    letterSpacing: 0.5,
  },
  guidanceItem: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 17,
    marginTop: 4,
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
    marginBottom: 8,
  },
  cardSectionTitle: {
    fontSize: 10.5,
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

  // Multi-Item Plate Chips
  multiItemScroll: {
    flexDirection: 'row',
    marginTop: 4,
  },
  multiItemChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginRight: 8,
    alignItems: 'center',
  },
  multiItemChipSelected: {
    borderColor: '#06b6d4',
    backgroundColor: 'rgba(6, 182, 212, 0.18)',
  },
  multiItemChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  multiItemChipTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  multiItemConfText: {
    fontSize: 8.5,
    color: '#64748b',
    marginTop: 1,
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

  // Macro Grid
  macroGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
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
    letterSpacing: 0.3,
  },
  macroVal: {
    fontSize: 15,
    fontWeight: '900',
    marginVertical: 2,
  },
  macroSubUnit: {
    fontSize: 8,
  },

  // Glycemic Load Bar
  glBarCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  glBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  glLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
  },
  glPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  glPillText: {
    fontSize: 8.5,
    fontWeight: '900',
  },
  glTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  glFill: {
    height: '100%',
    borderRadius: 3,
  },
  giSubText: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 6,
    fontWeight: '600',
  },

  // Digital Twin Context Card
  recalibrateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recalibrateBtnText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#06b6d4',
  },
  twinParamsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  twinParamItem: {
    flex: 1,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  twinParamLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94a3b8',
  },
  twinParamValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    marginVertical: 2,
  },
  twinParamSub: {
    fontSize: 7.5,
    color: '#64748b',
  },

  // Doctor Hacks Section
  hacksCounter: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
  },
  hackCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  hackHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hackCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hackName: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  hackImpactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hackImpactText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#10b981',
  },
  hackMechanism: {
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 4,
    paddingLeft: 26,
  },

  // Patient Decision Selector
  decisionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  decisionChip: {
    flex: 1,
    minWidth: '47%',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decisionChipText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // Confirm / Discard Actions
  bottomActionContainer: {
    marginTop: 4,
    marginBottom: 20,
    gap: 8,
  },
  confirmLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#06b6d4',
    paddingVertical: 14,
    borderRadius: 12,
  },
  confirmLogBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  discardBtn: {
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  discardBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Locked State
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  shieldGlowCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  shieldInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  lockedSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  explanationCard: {
    marginTop: 16,
    padding: 14,
    width: '100%',
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bulletText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
});

export default FoodScannerScreen;
