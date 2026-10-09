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
  ArrowLeft,
  X,
  Camera,
  Sparkles,
  Flame,
  Check,
  RefreshCw,
  Plus,
  Minus,
  Barcode,
  Layers,
  Edit2,
  CheckCircle2,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useTheme } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import userApi from '../api/userApi';
import draftService from '../services/draftService';
import GlassCard from '../components/GlassCard';
import FoodBarcodeScannerModal from '../components/FoodBarcodeScannerModal';

export const FoodScannerScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, hasVitals, fetchVitals, latestVitals } = useAuthStore();

  // Scanning states
  const [isScanning, setIsScanning] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [scanStepMessage, setScanStepMessage] = useState('Analyzing meal...');

  // Scanned Food Data
  const [scannedFood, setScannedFood] = useState(null);
  const [localImageUri, setLocalImageUri] = useState(null);
  const [customDishName, setCustomDishName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // Multi-item detected list
  const [allDetectedItems, setAllDetectedItems] = useState([]);
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  // Refusal / Error state
  const [refusalMessage, setRefusalMessage] = useState(null);

  // Portion Scaling (0.5x - 3.0x)
  const [portionMultiplier, setPortionMultiplier] = useState(1.0);

  // Simple Actionable Health Tips
  const [selectedTips, setSelectedTips] = useState({ walk: true, greens: false });
  const [showNutrientDetails, setShowNutrientDetails] = useState(false);

  // Modals
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);

  // Animated Scan Laser
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchVitals();
    checkForDraft();
  }, []);

  // Viewfinder laser loop
  useEffect(() => {
    if (isScanning) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 1300,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1300,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isScanning]);

  // Entrance animation when results appear
  useEffect(() => {
    if (scannedFood) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [scannedFood]);

  const checkForDraft = async () => {
    try {
      const res = await userApi.getUnconfirmedScan();
      if (res?.success && res.data) {
        populateScannedState(res.data);
        return;
      }
      const draft = await draftService.loadDraft('food_scan');
      if (draft?.data?.foodLog) {
        populateScannedState(draft.data.foodLog);
      }
    } catch (e) {}
  };

  const populateScannedState = (foodLogData) => {
    setScannedFood(foodLogData);
    setRefusalMessage(null);

    const detected = foodLogData.allDetectedItems || [];
    setAllDetectedItems(detected);
    setActiveItemIndex(-1);

    const initialName =
      foodLogData.recognizedItemName ||
      foodLogData.candidates?.[0]?.name ||
      'Healthy Meal';
    setCustomDishName(initialName);
    setPortionMultiplier(foodLogData.consumedQuantity || 1.0);
  };

  const handleBarcodeFoodFound = (foodLog) => {
    if (!foodLog) return;
    populateScannedState(foodLog);
    if (foodLog.imageUrl) {
      setLocalImageUri(foodLog.imageUrl);
    }
  };

  // Camera & Gallery pickers
  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera Access Needed', 'Please allow camera access to scan your meal.');
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
      Alert.alert('Camera Error', 'Could not open camera. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photos Access Needed', 'Please allow photo access to upload meal images.');
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
      Alert.alert('Gallery Error', 'Could not select photo from library.');
    }
  };

  const handleScanImage = async (imageUri, mimeType, fileName) => {
    setIsScanning(true);
    setLocalImageUri(imageUri);
    setRefusalMessage(null);

    try {
      setScanStepMessage('Analyzing dish & nutrition...');
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

      const res = await userApi.scanFood(formData);

      if (res?.success && res.data) {
        populateScannedState(res.data);
      } else {
        setRefusalMessage(
          res?.message || 'Could not recognize food in this photo. Please retake with clearer lighting.'
        );
      }
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not recognize food. Please try with clearer lighting.';
      setRefusalMessage(errMsg);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDiscardScan = async () => {
    await draftService.clearDraft('food_scan');
    setScannedFood(null);
    setLocalImageUri(null);
    setCustomDishName('');
    setAllDetectedItems([]);
    setRefusalMessage(null);
    setPortionMultiplier(1.0);
    setIsEditingName(false);
  };

  const handleCancel = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs', { screen: 'Home' });
    }
  };

  // Base metrics
  const baseGlucose = latestVitals?.metabolicHealth?.glucoseFasting || 92;

  // Nutrients (supports Entire Plate aggregated view or individual item inspection)
  const activeItem = activeItemIndex >= 0 && allDetectedItems[activeItemIndex] ? allDetectedItems[activeItemIndex] : null;
  const activeItemNutrients = activeItem?.nutritionProfile?.nutrients || activeItem?.nutrients;
  const currentNutrients = activeItemNutrients || scannedFood?.nutrients || {
    calories: 380,
    carbohydrates: 42,
    netCarbohydrates: 36,
    proteins: 24,
    fats: 12,
    fiber: 6,
    sodium: 320,
    potassium: 380,
  };

  const scaledCalories = Math.round((currentNutrients.calories || 380) * portionMultiplier);
  const scaledCarbs = Math.round((currentNutrients.carbohydrates || 42) * portionMultiplier);
  const scaledProtein = Math.round((currentNutrients.proteins || 24) * portionMultiplier);
  const scaledFat = Math.round((currentNutrients.fats || 12) * portionMultiplier);
  const scaledFiber = Math.round((currentNutrients.fiber || 6) * portionMultiplier);
  const scaledSodium = Math.round((currentNutrients.sodium || 320) * portionMultiplier);

  // Predicted glucose rise
  const estimatedSurge = Math.max(
    10,
    Math.round(scaledCarbs * (baseGlucose > 105 ? 0.42 : 0.28) * (selectedTips.walk ? 0.72 : 1.0))
  );

  const confirmFoodLog = async () => {
    if (!scannedFood) return;

    try {
      setIsConfirming(true);
      const activeName = customDishName.trim() || scannedFood.recognizedItemName || 'Healthy Meal';

      const scaledNutrients = {
        calories: scaledCalories,
        carbohydrates: scaledCarbs,
        proteins: scaledProtein,
        fats: scaledFat,
        fiber: scaledFiber,
        sodium: scaledSodium,
      };

      const payload = {
        consumedQuantity: portionMultiplier,
        servingUnit: scannedFood.servingUnit || 'portion',
        recognizedItemName: activeName,
        nutrients: scaledNutrients,
        userDecision: 'Consume',
      };

      let confirmRes;
      if (scannedFood._id) {
        confirmRes = await userApi.confirmFoodConsumption(scannedFood._id, payload);
      } else {
        confirmRes = await userApi.logMeal({
          ...payload,
          mealType: 'Lunch',
          predictedImpact: {
            glucoseSpike: estimatedSurge,
            aiWarningMessage: 'Nutrient response tracked in health profile',
          },
        });
      }

      if (confirmRes?.success) {
        await draftService.clearDraft('food_scan');
        Alert.alert(
          'Meal Saved',
          `"${activeName}" has been logged into your health records.`,
          [
            {
              text: 'View Log',
              onPress: () => navigation.navigate('MainTabs', { screen: 'History' }),
            },
            {
              text: 'Done',
              onPress: () => handleDiscardScan(),
            },
          ]
        );
      } else {
        Alert.alert('Notice', confirmRes?.message || 'Could not save meal.');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Unable to log meal.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.bgDark }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {scannedFood ? 'Meal Analysis' : 'Scan Meal'}
          </Text>
          <Text style={styles.headerSub}>AI Nutrition Recognition</Text>
        </View>

        {scannedFood ? (
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
            onPress={handleDiscardScan}
            activeOpacity={0.7}
          >
            <RefreshCw size={16} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================= */}
        {/* VIEW 1: CAMERA VIEWFINDER (When no food is scanned yet)  */}
        {/* ========================================================= */}
        {!scannedFood ? (
          <View>
            <View
              style={[
                styles.viewfinderBox,
                { backgroundColor: isDark ? '#060d13' : '#f0fdf4', borderColor: colors.primary },
              ]}
            >
              {/* Animated laser line */}
              {isScanning && (
                <Animated.View
                  style={[
                    styles.laserLine,
                    {
                      backgroundColor: colors.primary,
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 200],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}

              {/* Corner brackets */}
              <View style={[styles.corner, styles.cornerTL, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.cornerTR, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.cornerBL, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.cornerBR, { borderColor: colors.primary }]} />

              {localImageUri ? (
                <Image source={{ uri: localImageUri }} style={styles.previewImage} resizeMode="cover" />
              ) : (
                <View style={styles.viewfinderCenter}>
                  <View style={[styles.cameraCircle, { backgroundColor: 'rgba(6, 182, 212, 0.12)' }]}>
                    <Camera size={34} color={colors.primary} />
                  </View>
                  <Text style={[styles.viewfinderTitle, { color: colors.textPrimary }]}>
                    Point Camera at Food
                  </Text>
                  <Text style={styles.viewfinderSub}>
                    Hold steady to identify dish & predict glucose response
                  </Text>
                </View>
              )}

              {isScanning && (
                <View style={styles.scanningOverlay}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.scanningText}>{scanStepMessage}</Text>
                </View>
              )}
            </View>

            {/* Error / Refusal notice */}
            {refusalMessage && (
              <GlassCard style={styles.errorCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ShieldAlert size={20} color="#f87171" />
                  <Text style={styles.errorText}>{refusalMessage}</Text>
                </View>
              </GlassCard>
            )}

            {/* Capture Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.primaryCaptureBtn, { backgroundColor: colors.primary }, isScanning && { opacity: 0.6 }]}
                onPress={takePhoto}
                disabled={isScanning}
                activeOpacity={0.85}
              >
                <Camera size={18} color="#000000" />
                <Text style={styles.primaryCaptureBtnText}>TAKE PHOTO</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryCaptureBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
                onPress={pickFromGallery}
                disabled={isScanning}
                activeOpacity={0.85}
              >
                <Text style={[styles.secondaryCaptureBtnText, { color: colors.textPrimary }]}>GALLERY</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.barcodeBtn, { borderColor: colors.borderSubtle, backgroundColor: colors.bgCardElevated }]}
              onPress={() => setBarcodeScannerVisible(true)}
              activeOpacity={0.8}
            >
              <Barcode size={18} color={colors.primary} />
              <Text style={[styles.barcodeBtnText, { color: colors.textPrimary }]}>
                Scan Packaged Food Barcode
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ========================================================= */
          /* VIEW 2: SCANNED FOOD RESULTS (Minimal & Clean)           */
          /* ========================================================= */
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Food Header Card */}
            <GlassCard style={styles.foodHeroCard}>
              <View style={styles.foodHeroRow}>
                {localImageUri ? (
                  <Image source={{ uri: localImageUri }} style={styles.foodThumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.foodThumb, { backgroundColor: 'rgba(6, 182, 212, 0.1)', alignItems: 'center', justifyContent: 'center' }]}>
                    <Camera size={24} color={colors.primary} />
                  </View>
                )}

                <View style={{ flex: 1, marginLeft: 14 }}>
                  {isEditingName ? (
                    <View style={styles.editRow}>
                      <TextInput
                        style={[styles.nameInput, { color: colors.textPrimary, borderColor: colors.primary }]}
                        value={customDishName}
                        onChangeText={setCustomDishName}
                        autoFocus
                        onBlur={() => setIsEditingName(false)}
                      />
                      <TouchableOpacity onPress={() => setIsEditingName(false)} style={styles.confirmEditBtn}>
                        <Check size={14} color="#000000" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                      onPress={() => setIsEditingName(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.foodNameTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {customDishName}
                      </Text>
                      <Edit2 size={13} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}

                  <View style={styles.calBadgeRow}>
                    <View style={styles.calPill}>
                      <Flame size={12} color="#f97316" />
                      <Text style={styles.calPillText}>{scaledCalories} kcal</Text>
                    </View>
                    <Text style={styles.portionLabel}>{portionMultiplier}x serving</Text>
                  </View>
                </View>
              </View>

              {/* Multi-item selector pills if multiple items detected */}
              {allDetectedItems && allDetectedItems.length > 1 && (
                <View style={styles.multiPlateBox}>
                  <Text style={styles.multiPlateLabel}>Detected in plate ({allDetectedItems.length} items):</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                    <TouchableOpacity
                      style={[
                        styles.plateChip,
                        activeItemIndex === -1 && [styles.plateChipActive, { borderColor: colors.primary }],
                      ]}
                      onPress={() => {
                        setActiveItemIndex(-1);
                        setCustomDishName(scannedFood?.recognizedItemName || 'Meal Plate');
                      }}
                    >
                      <Text
                        style={[
                          styles.plateChipText,
                          activeItemIndex === -1 && { color: colors.primary, fontWeight: '800' },
                        ]}
                      >
                        Entire Plate
                      </Text>
                    </TouchableOpacity>
                    {allDetectedItems.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.plateChip,
                          activeItemIndex === idx && [styles.plateChipActive, { borderColor: colors.primary }],
                        ]}
                        onPress={() => {
                          setActiveItemIndex(idx);
                          setCustomDishName(item.itemName || customDishName);
                        }}
                      >
                        <Text
                          style={[
                            styles.plateChipText,
                            activeItemIndex === idx && { color: colors.primary, fontWeight: '800' },
                          ]}
                        >
                          {item.itemName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </GlassCard>

            {/* Macros 3-Grid */}
            <View style={styles.macrosGrid}>
              <View style={[styles.macroCard, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
                <Text style={styles.macroCardLabel}>CARBS</Text>
                <Text style={[styles.macroCardVal, { color: colors.textPrimary }]}>{scaledCarbs}g</Text>
                <View style={styles.macroBarBg}>
                  <View style={[styles.macroBarFill, { width: `${Math.min(100, (scaledCarbs / 75) * 100)}%`, backgroundColor: '#06b6d4' }]} />
                </View>
              </View>

              <View style={[styles.macroCard, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
                <Text style={styles.macroCardLabel}>PROTEIN</Text>
                <Text style={[styles.macroCardVal, { color: colors.textPrimary }]}>{scaledProtein}g</Text>
                <View style={styles.macroBarBg}>
                  <View style={[styles.macroBarFill, { width: `${Math.min(100, (scaledProtein / 50) * 100)}%`, backgroundColor: '#10b981' }]} />
                </View>
              </View>

              <View style={[styles.macroCard, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
                <Text style={styles.macroCardLabel}>FAT</Text>
                <Text style={[styles.macroCardVal, { color: colors.textPrimary }]}>{scaledFat}g</Text>
                <View style={styles.macroBarBg}>
                  <View style={[styles.macroBarFill, { width: `${Math.min(100, (scaledFat / 35) * 100)}%`, backgroundColor: '#fbbf24' }]} />
                </View>
              </View>
            </View>

            {/* Glucose Impact Card */}
            <GlassCard style={styles.impactCard}>
              <View style={styles.impactRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.impactLabel}>PREDICTED GLUCOSE RESPONSE</Text>
                  <Text style={[styles.impactValue, { color: colors.textPrimary }]}>
                    +{estimatedSurge} mg/dL Rise
                  </Text>
                  <Text style={styles.impactSub}>
                    {estimatedSurge < 25 ? 'Gentle rise • Stable glycemic response' : 'Moderate rise • Consider walking after meal'}
                  </Text>
                </View>

                <View style={[styles.impactBadge, { backgroundColor: estimatedSurge < 25 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
                  <Text style={[styles.impactBadgeText, { color: estimatedSurge < 25 ? colors.emeraldLight : colors.amberLight }]}>
                    {estimatedSurge < 25 ? 'Optimal' : 'Moderate'}
                  </Text>
                </View>
              </View>
            </GlassCard>

            {/* Portion Adjuster */}
            <GlassCard style={styles.portionCard}>
              <Text style={styles.portionTitle}>Portion Size</Text>
              <View style={styles.portionControls}>
                <TouchableOpacity
                  style={[styles.portionBtn, { backgroundColor: colors.bgCardSurface }]}
                  onPress={() => setPortionMultiplier((p) => Math.max(0.5, Number((p - 0.25).toFixed(2))))}
                  activeOpacity={0.7}
                >
                  <Minus size={16} color={colors.textPrimary} />
                </TouchableOpacity>

                <Text style={[styles.portionDisplay, { color: colors.textPrimary }]}>
                  {portionMultiplier}x
                </Text>

                <TouchableOpacity
                  style={[styles.portionBtn, { backgroundColor: colors.bgCardSurface }]}
                  onPress={() => setPortionMultiplier((p) => Math.min(3.0, Number((p + 0.25).toFixed(2))))}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </GlassCard>

            {/* Helpful Doctor Tips */}
            <GlassCard style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>Post-Meal Recommendations</Text>

              <TouchableOpacity
                style={[styles.tipItem, selectedTips.walk && styles.tipItemActive]}
                onPress={() => setSelectedTips((t) => ({ ...t, walk: !t.walk }))}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, selectedTips.walk && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  {selectedTips.walk && <Check size={12} color="#000000" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tipName, { color: colors.textPrimary }]}>Take a 10-Minute Walk</Text>
                  <Text style={styles.tipDesc}>Light post-meal stroll reduces glucose surge by up to 28%.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tipItem, selectedTips.greens && styles.tipItemActive]}
                onPress={() => setSelectedTips((t) => ({ ...t, greens: !t.greens }))}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, selectedTips.greens && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  {selectedTips.greens && <Check size={12} color="#000000" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tipName, { color: colors.textPrimary }]}>Eat Fiber / Greens First</Text>
                  <Text style={styles.tipDesc}>Slows carbohydrate absorption into the bloodstream.</Text>
                </View>
              </TouchableOpacity>
            </GlassCard>

            {/* Micronutrients Dropdown (Optional) */}
            <TouchableOpacity
              style={[styles.detailsToggle, { borderColor: colors.borderSubtle }]}
              onPress={() => setShowNutrientDetails(!showNutrientDetails)}
              activeOpacity={0.7}
            >
              <Text style={[styles.detailsToggleText, { color: colors.textSecondary }]}>
                {showNutrientDetails ? 'Hide Detailed Nutrients' : 'View Full Nutrition Breakdown'}
              </Text>
              {showNutrientDetails ? (
                <ChevronUp size={16} color={colors.textSecondary} />
              ) : (
                <ChevronDown size={16} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            {showNutrientDetails && (
              <GlassCard style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dietary Fiber</Text>
                  <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{scaledFiber}g</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sodium</Text>
                  <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{scaledSodium} mg</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Glycemic Index (GI)</Text>
                  <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{scannedFood.glycemicIndex || 52}</Text>
                </View>
              </GlassCard>
            )}

            {/* Confirm & Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }, isConfirming && { opacity: 0.7 }]}
              onPress={confirmFoodLog}
              disabled={isConfirming}
              activeOpacity={0.85}
            >
              {isConfirming ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#000000" />
                  <Text style={styles.saveBtnText}>SAVE TO HEALTH LOG</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </Animated.View>
        )}
      </ScrollView>

      {/* Barcode scanner modal */}
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
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 30,
  },

  /* Viewfinder */
  viewfinderBox: {
    height: 280,
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  viewfinderCenter: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  cameraCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  viewfinderTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  viewfinderSub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 17,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  laserLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 2,
    borderRadius: 1,
    zIndex: 10,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 3,
  },
  cornerTL: { top: 12, left: 12, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 12, right: 12, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 12, left: 12, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 12, right: 12, borderLeftWidth: 0, borderTopWidth: 0 },

  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  scanningText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },

  errorCard: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  errorText: {
    fontSize: 12,
    color: '#f87171',
    flex: 1,
    lineHeight: 16,
  },

  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  primaryCaptureBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryCaptureBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  secondaryCaptureBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryCaptureBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  barcodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  barcodeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* Results view */
  foodHeroCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  foodHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodThumb: {
    width: 60,
    height: 60,
    borderRadius: 14,
  },
  foodNameTitle: {
    fontSize: 16,
    fontWeight: '800',
    maxWidth: 200,
  },
  calBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  calPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  calPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f97316',
  },
  portionLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: '700',
  },
  confirmEditBtn: {
    backgroundColor: '#06b6d4',
    padding: 6,
    borderRadius: 6,
  },
  multiPlateBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  multiPlateLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  plateChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
  },
  plateChipActive: {
    borderWidth: 1,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },
  plateChipText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },

  /* Macros Grid */
  macrosGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  macroCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  macroCardLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '800',
    marginBottom: 2,
  },
  macroCardVal: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },
  macroBarBg: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },

  /* Impact Card */
  impactCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  impactLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  impactValue: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  impactSub: {
    fontSize: 11,
    color: '#94a3b8',
  },
  impactBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  impactBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  /* Portion Card */
  portionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
  },
  portionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  portionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  portionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionDisplay: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'center',
  },

  /* Tips Card */
  tipsCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  tipItemActive: {
    opacity: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipName: {
    fontSize: 12,
    fontWeight: '700',
  },
  tipDesc: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },

  /* Details toggle */
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  detailsToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailsCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* Save Button */
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.3,
  },
});

export default FoodScannerScreen;
