import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  FlaskConical,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Check,
  Zap,
  Banknote,
  CreditCard,
  Edit3,
  Save,
  RotateCcw,
  FileText,
  Crosshair,
  Navigation,
  LocateFixed,
  Info,
  AlertTriangle,
  Activity,
  Heart,
  Droplets,
  Dna,
  Pill,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useUserAppointmentStore } from '../store/userAppointmentStore';
import GlassCard from '../components/GlassCard';
import MapLocationPickerModal from '../components/MapLocationPickerModal';
import draftService from '../services/draftService';
import locationService from '../services/locationService';

const MORNING_SLOTS = [
  '06:30 - 07:30 AM',
  '07:30 - 08:30 AM',
  '08:30 - 09:30 AM',
  '09:30 - 10:30 AM',
];

const REGULAR_SLOTS = [
  '10:30 - 11:30 AM',
  '04:30 - 05:30 PM',
];

const INCLUDED_VITAL_CATEGORIES = [
  { label: 'CBC & Hematology', desc: '14 parameters (Hb, RBC, WBC, Platelets, ESR)', icon: Droplets, color: '#ef4444' },
  { label: 'Cardiovascular & Lipids', desc: 'Total Cholesterol, HDL, LDL, Triglycerides, ApoB', icon: Heart, color: '#f43f5e' },
  { label: 'Metabolic & Glycemic', desc: 'Fasting Blood Glucose, HbA1c, Fasting Insulin, HOMA-IR', icon: Activity, color: '#f59e0b' },
  { label: 'Renal / Kidney Panel', desc: 'Serum Creatinine, eGFR, BUN, Uric Acid, Electrolytes', icon: FlaskConical, color: '#06b6d4' },
  { label: 'Hepatic / Liver Screen', desc: 'LFT, SGOT/AST, SGPT/ALT, Bilirubin, Enzymes', icon: ShieldCheck, color: '#10b981' },
  { label: 'Thyroid Health Battery', desc: 'Ultrasensitive TSH, Free T3, Free T4', icon: Zap, color: '#8b5cf6' },
  { label: 'Immunology & hs-CRP', desc: 'High-Sensitivity CRP, Serum Ferritin', icon: ShieldCheck, color: '#ec4899' },
  { label: 'Micronutrients & Vitamins', desc: 'Active Vitamin D3 (25-OH) & Vitamin B12', icon: Pill, color: '#14b8a6' },
];

export const BookAppointmentScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const { testCatalog, fetchTestCatalog, bookAppointment, isLoading } =
    useUserAppointmentStore();

  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(MORNING_SLOTS[1]);
  const [paymentMode, setPaymentMode] = useState('COD'); // 'COD' | 'Online'
  const [prepAcknowledged, setPrepAcknowledged] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState(null);

  // Accurate Location Locking on Map
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [lockedCoordinates, setLockedCoordinates] = useState(
    user?.address?.coordinates?.lat && user?.address?.coordinates?.lng
      ? { lat: Number(user.address.coordinates.lat), lng: Number(user.address.coordinates.lng) }
      : null
  );

  // Address Fields
  const [houseNumber, setHouseNumber] = useState(user?.address?.houseNumber || '');
  const [street, setStreet] = useState(user?.address?.street || '');
  const [landmark, setLandmark] = useState(user?.address?.landmark || '');
  const [city, setCity] = useState(user?.address?.city || 'Hyderabad');
  const [state, setState] = useState(user?.address?.state || 'Telangana');
  const [pincode, setPincode] = useState(user?.address?.pincode || '500081');
  const [notes, setNotes] = useState('');
  const [isEditingManualAddress, setIsEditingManualAddress] = useState(false);

  // Draft recovery state
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(true);
  const hasInitializedRef = useRef(false);

  // Generate next 5 available booking dates
  const availableDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      isoString: d.toISOString(),
    };
  });

  useEffect(() => {
    fetchTestCatalog();
  }, []);

  // 1. Single Master Plan: Always use the active full vitals plan from catalog
  const singleMasterPlan = testCatalog && testCatalog.length > 0
    ? testCatalog.find(t => t.isActive !== false) || testCatalog[0]
    : null;

  // 2. Load Draft on Screen Mount ("Never Lose User Progress")
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const draft = await draftService.loadDraft('appointment_booking');
        if (draft && draft.data && isMounted) {
          const d = draft.data;
          let restored = false;

          if (typeof d.selectedDateIdx === 'number') {
            setSelectedDateIdx(d.selectedDateIdx);
            restored = true;
          }
          if (d.selectedSlot) {
            setSelectedSlot(d.selectedSlot);
            restored = true;
          }
          if (d.paymentMode) {
            setPaymentMode(d.paymentMode);
          }
          if (typeof d.prepAcknowledged === 'boolean') {
            setPrepAcknowledged(d.prepAcknowledged);
          }
          if (d.lockedCoordinates?.lat && d.lockedCoordinates?.lng) {
            setLockedCoordinates({
              lat: Number(d.lockedCoordinates.lat),
              lng: Number(d.lockedCoordinates.lng),
            });
            restored = true;
          }
          if (d.houseNumber) setHouseNumber(d.houseNumber);
          if (d.street) setStreet(d.street);
          if (d.landmark) setLandmark(d.landmark);
          if (d.city) setCity(d.city);
          if (d.state) setState(d.state);
          if (d.pincode) setPincode(d.pincode);
          if (d.notes) setNotes(d.notes);

          if (restored) {
            setHasRestoredDraft(true);
          }
        }
      } catch (err) {
        console.warn('Draft load warning:', err.message);
      } finally {
        if (isMounted) {
          setIsDraftLoading(false);
          hasInitializedRef.current = true;
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Auto-save Draft on state changes
  useEffect(() => {
    if (!hasInitializedRef.current) return;

    draftService.saveDraft('appointment_booking', {
      step: lockedCoordinates ? 2 : 1,
      totalSteps: 2,
      data: {
        selectedDateIdx,
        selectedSlot,
        paymentMode,
        prepAcknowledged,
        lockedCoordinates,
        houseNumber,
        street,
        landmark,
        city,
        state,
        pincode,
        notes,
      },
    });
  }, [
    selectedDateIdx,
    selectedSlot,
    paymentMode,
    prepAcknowledged,
    lockedCoordinates,
    houseNumber,
    street,
    landmark,
    city,
    state,
    pincode,
    notes,
  ]);

  const handleDiscardDraft = async () => {
    await draftService.clearDraft('appointment_booking');
    setSelectedDateIdx(0);
    setSelectedSlot(MORNING_SLOTS[1]);
    setPaymentMode('COD');
    setPrepAcknowledged(false);
    setLockedCoordinates(null);
    setHouseNumber(user?.address?.houseNumber || '');
    setStreet(user?.address?.street || '');
    setLandmark(user?.address?.landmark || '');
    setCity(user?.address?.city || 'Hyderabad');
    setState(user?.address?.state || 'Telangana');
    setPincode(user?.address?.pincode || '500081');
    setNotes('');
    setHasRestoredDraft(false);
    Alert.alert('Draft Discarded', 'Your booking form has been reset to starting state.');
  };

  // Fast GPS Detection handler
  const handleQuickGpsDetect = async () => {
    setIsLocatingGps(true);
    try {
      const gps = await locationService.getCurrentCoordinates();
      if (gps?.lat && gps?.lng) {
        const nextCoords = { lat: Number(gps.lat.toFixed(6)), lng: Number(gps.lng.toFixed(6)) };
        setLockedCoordinates(nextCoords);

        // Reverse geocode to populate road, city & pincode
        const geo = await locationService.reverseGeocode(nextCoords.lat, nextCoords.lng);
        if (geo) {
          if (geo.street) setStreet(geo.street);
          if (geo.city) setCity(geo.city);
          if (geo.state) setState(geo.state);
          if (geo.pincode) setPincode(geo.pincode);
          if (geo.landmark && !landmark) setLandmark(geo.landmark);
        }

        Alert.alert(
          'Location Locked',
          `GPS coordinates successfully locked:\n${nextCoords.lat}°, ${nextCoords.lng}°\n\nOur Lab Assistant will navigate directly to this point.`
        );
      }
    } catch (err) {
      Alert.alert(
        'GPS Detection Notice',
        err.message || 'Could not fetch GPS. Please tap "Select on Map" to drop your pin manually.'
      );
    } finally {
      setIsLocatingGps(false);
    }
  };

  // Called when user confirms location in the Map Modal
  const handleLocationFromMapModal = (locData) => {
    if (locData?.coordinates?.lat && locData?.coordinates?.lng) {
      setLockedCoordinates({
        lat: Number(locData.coordinates.lat),
        lng: Number(locData.coordinates.lng),
      });
      if (locData.houseNumber) setHouseNumber(locData.houseNumber);
      if (locData.street) setStreet(locData.street);
      if (locData.landmark) setLandmark(locData.landmark);
      if (locData.city) setCity(locData.city);
      if (locData.state) setState(locData.state);
      if (locData.pincode) setPincode(locData.pincode);
    }
  };

  const handleBook = async () => {
    if (!singleMasterPlan) {
      Alert.alert('Loading Test Plan', 'Please wait while the diagnostic plan loads.');
      return;
    }

    // Require Map Location Locking as explicitly requested
    if (!lockedCoordinates || !lockedCoordinates.lat || !lockedCoordinates.lng) {
      Alert.alert(
        'Doorstep Map Location Required',
        'Please tap "Select on Map" or "Use Live GPS" to lock your exact doorstep so our Lab Assistant navigates straight to you.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Select on Map', onPress: () => setIsMapModalVisible(true) },
        ]
      );
      return;
    }

    const effectiveStreet = street.trim() || user?.address?.street;
    const effectiveCity = city.trim() || user?.address?.city || 'Hyderabad';
    const effectivePincode = pincode.trim() || user?.address?.pincode || '500081';

    if (!effectiveStreet) {
      setIsEditingManualAddress(true);
      Alert.alert(
        'Street Address Required',
        'Please enter your street / building address so our phlebotomist has full reference details.'
      );
      return;
    }

    if (!prepAcknowledged) {
      Alert.alert(
        'Preparation Acknowledgment Required',
        'Please confirm that you will follow 10-12 hours overnight fasting before sample collection for accurate biomarker calibration.'
      );
      return;
    }

    const payload = {
      testId: singleMasterPlan._id,
      scheduledDate: availableDates[selectedDateIdx].isoString,
      timeSlot: selectedSlot,
      paymentMode,
      preparationAcknowledged: true,
      address: {
        houseNumber: houseNumber.trim(),
        street: effectiveStreet,
        landmark: landmark.trim(),
        city: effectiveCity,
        state: state.trim() || 'Telangana',
        pincode: effectivePincode,
        coordinates: {
          lat: Number(lockedCoordinates.lat),
          lng: Number(lockedCoordinates.lng),
        },
        notes: notes.trim(),
      },
    };

    const res = await bookAppointment(payload);

    if (res.success) {
      await draftService.clearDraft('appointment_booking');
      setHasRestoredDraft(false);
      setBookingSuccessData(res.appointment);
    } else {
      Alert.alert('Booking Notice', res.message || 'Unable to book appointment');
    }
  };

  // -------------------------------------------------------------
  // SUCCESS SCREEN: SHOW SECURE COLLECTION OTP & LOCKED MAP LOCATION
  // -------------------------------------------------------------
  if (bookingSuccessData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.bgDark }]}>
        <ScrollView contentContainerStyle={styles.successScroll}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={42} color={colors.emeraldLight} />
          </View>
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Home Visit Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            BioSync shortest-path satellite routing has scheduled your collection visit.
          </Text>

          {/* Glowing OTP Box */}
          <GlassCard style={styles.successOtpCard}>
            <Text style={styles.successOtpLabel}>YOUR SECURE COLLECTION OTP</Text>
            <View style={styles.successDigitsRow}>
              {(bookingSuccessData.collectionOTP || '482916').split('').map((d, i) => (
                <View key={i} style={styles.successDigitBox}>
                  <Text style={styles.successDigitText}>{d}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.successOtpHint}>
              Keep this 6-digit code ready. The phlebotomist will verify it at your doorstep before collecting blood samples.
            </Text>
          </GlassCard>

          {/* Locked Map Location Summary */}
          <GlassCard style={[styles.successLocationCard, { backgroundColor: isDark ? '#07181f' : '#ecfeff', borderColor: colors.cyan }]}>
            <View style={styles.successLocationHeader}>
              <MapPin size={16} color={colors.cyan} />
              <Text style={styles.successLocationTitle}>LOCKED COLLECTION DOORSTEP</Text>
            </View>
            <Text style={[styles.successAddressText, { color: colors.textPrimary }]}>
              {[houseNumber, street, landmark, city, pincode].filter(Boolean).join(', ')}
            </Text>
            {lockedCoordinates ? (
              <View style={styles.successCoordsPill}>
                <LocateFixed size={11} color={colors.cyan} />
                <Text style={styles.successCoordsText}>
                  Coordinates: {lockedCoordinates.lat.toFixed(5)}° N, {lockedCoordinates.lng.toFixed(5)}° E (GPS Locked)
                </Text>
              </View>
            ) : null}
            <Text style={styles.successDispatchNote}>
              Turn-by-turn Google Maps coordinates dispatched directly to your assigned Lab Assistant.
            </Text>
          </GlassCard>

          {/* Time & Plan Summary */}
          <View style={styles.successSummaryRow}>
            <View style={[styles.successSummaryItem, { backgroundColor: colors.bgCardElevated }]}>
              <Calendar size={14} color={colors.cyan} />
              <Text style={[styles.successSummaryVal, { color: colors.textPrimary }]}>
                {availableDates[selectedDateIdx].dateStr}
              </Text>
              <Text style={styles.successSummaryLbl}>{selectedSlot}</Text>
            </View>
            <View style={[styles.successSummaryItem, { backgroundColor: colors.bgCardElevated }]}>
              <FlaskConical size={14} color={colors.emeraldLight} />
              <Text style={[styles.successSummaryVal, { color: colors.textPrimary }]}>All Total Vitals</Text>
              <Text style={styles.successSummaryLbl}>56+ Biomarkers</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.goToHomeBtn, { backgroundColor: colors.cyan }]}
            onPress={() => {
              setBookingSuccessData(null);
              navigation.navigate('MainTabs', { screen: 'Home' });
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.goToHomeText}>TRACK LIVE VISIT IN HOME</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // -------------------------------------------------------------
  // MAIN BOOKING WORKFLOW (1 SINGLE FULL VITALS PLAN + MAP LOCKING)
  // -------------------------------------------------------------
  const basePrice = singleMasterPlan?.pricing?.basePrice || 499;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.bgDark }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Schedule Home Vitals Collection</Text>
          <Text style={styles.headerSubtitle}>
            1 Comprehensive Plan • Full Clinical Vitals Baseline • Accurate Doorstep Map Lock
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* DRAFT RECOVERY BANNER */}
        {hasRestoredDraft ? (
          <View style={styles.draftRecoveryBanner}>
            <View style={styles.draftRecoveryLeft}>
              <RotateCcw size={15} color={colors.emeraldLight} style={styles.draftRecoveryIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.draftRecoveryTitle}>Booking Draft Restored</Text>
                <Text style={styles.draftRecoverySub}>Resumed your selected slot & locked map coordinates</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.draftDiscardBtn} 
              onPress={handleDiscardDraft}
              activeOpacity={0.7}
            >
              <Text style={styles.draftDiscardText}>Discard</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ========================================================= */}
        {/* SECTION 1: THE SINGLE COMPREHENSIVE FULL VITALS PLAN     */}
        {/* ========================================================= */}
        <View style={styles.detailSection}>
          <View style={styles.detailSectionHeader}>
            <FlaskConical size={16} color={colors.cyan} />
            <Text style={styles.detailSectionTitle}>1. DIAGNOSTIC COLLECTION PLAN (ALL TOTAL VITALS)</Text>
          </View>

          <GlassCard style={[styles.masterPlanCard, { borderColor: colors.cyan, backgroundColor: isDark ? '#07181f' : '#ecfeff' }]}>
            {/* Top Badges */}
            <View style={styles.masterPlanTop}>
              <View style={styles.masterPlanBadgeRow}>
                <View style={styles.singlePlanTag}>
                  <Sparkles size={11} color="#030712" />
                  <Text style={styles.singlePlanTagText}>1 MASTER PLAN • ALL VITALS INCLUDED</Text>
                </View>
                <View style={styles.accreditedTag}>
                  <ShieldCheck size={11} color={colors.emeraldLight} />
                  <Text style={styles.accreditedTagText}>NABL & ISO-15189</Text>
                </View>
              </View>

              {/* Title & Price */}
              <Text style={[styles.masterPlanTitle, { color: colors.textPrimary }]}>
                {singleMasterPlan?.testName || 'BioSync Complete Health & Full Vital Battery (All Biomarkers)'}
              </Text>
              <Text style={styles.masterPlanSubtitle}>
                Complete diagnostic battery calibrated to measure and verify all 8 body vitals systems in the database.
              </Text>

              <View style={styles.priceRow}>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceCurrency}>₹</Text>
                  <Text style={[styles.priceValue, { color: colors.textPrimary }]}>{basePrice}</Text>
                  <Text style={styles.priceInclusive}>• Doorstep Collection & Telemetry Included</Text>
                </View>
              </View>
            </View>

            {/* Fasting Requirement Pill */}
            <View style={styles.fastingBanner}>
              <Clock size={13} color={colors.amberLight} />
              <Text style={styles.fastingBannerText}>
                Requires 10-12 hours overnight fasting. Water intake permitted.
              </Text>
            </View>

            {/* Total Vitals Covered Grid */}
            <Text style={styles.vitalsCoverageHeading}>ALL 8 BODY VITALS SYSTEMS COVERED IN DB:</Text>
            <View style={styles.vitalsGrid}>
              {INCLUDED_VITAL_CATEGORIES.map((cat, idx) => {
                const IconComponent = cat.icon;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.vitalItemCard,
                      { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff', borderColor: colors.borderSubtle },
                    ]}
                  >
                    <View style={[styles.vitalIconWrap, { backgroundColor: cat.color + '20' }]}>
                      <IconComponent size={14} color={cat.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.vitalItemTitle, { color: colors.textPrimary }]}>{cat.label}</Text>
                      <Text style={styles.vitalItemDesc} numberOfLines={1}>{cat.desc}</Text>
                    </View>
                    <Check size={13} color={colors.emeraldLight} />
                  </View>
                );
              })}
            </View>
          </GlassCard>
        </View>

        {/* ========================================================= */}
        {/* SECTION 2: ACCURATE DOORSTEP LOCATION LOCKING ON MAP     */}
        {/* ========================================================= */}
        <View style={styles.detailSection}>
          <View style={styles.detailSectionHeader}>
            <MapPin size={16} color={colors.cyan} />
            <Text style={styles.detailSectionTitle}>2. HOME COLLECTION LOCATION (MAP LOCK)</Text>
          </View>

          {lockedCoordinates ? (
            /* LOCKED STATE: SHOWS MAP PIN, COORDINATES & ADDRESS */
            <GlassCard style={[styles.lockedLocationCard, { borderColor: colors.emeraldLight }]}>
              <View style={styles.lockedHeaderRow}>
                <View style={styles.lockedBadge}>
                  <CheckCircle2 size={13} color={colors.emeraldLight} />
                  <Text style={styles.lockedBadgeText}>MAP & SATELLITE ACCURATELY LOCKED</Text>
                </View>
                <TouchableOpacity
                  style={styles.adjustMapBtn}
                  onPress={() => setIsMapModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <MapPin size={12} color={colors.cyan} />
                  <Text style={styles.adjustMapBtnText}>ADJUST PIN</Text>
                </TouchableOpacity>
              </View>

              {/* Readout Coordinates */}
              <View style={styles.coordsDisplayBox}>
                <LocateFixed size={14} color={colors.cyan} />
                <Text style={styles.coordsDisplayText}>
                  Latitude: {lockedCoordinates.lat.toFixed(6)}° N, Longitude: {lockedCoordinates.lng.toFixed(6)}° E
                </Text>
              </View>

              {/* Resolved Street Address Readout */}
              <View style={styles.addressDisplayBox}>
                <Text style={[styles.addressDisplayTextMain, { color: colors.textPrimary }]}>
                  {[houseNumber, street].filter(Boolean).join(', ') || 'Doorstep Location'}
                </Text>
                <Text style={styles.addressDisplayTextSub}>
                  {[landmark, city, state, pincode].filter(Boolean).join(' • ')}
                </Text>
              </View>

              {/* Phlebotomist Turn-by-Turn Navigation Guarantee */}
              <View style={styles.laNavigationAssurance}>
                <Zap size={12} color={colors.cyan} />
                <Text style={styles.laNavigationAssuranceText}>
                  Our certified Lab Assistant will receive these exact coordinates on Google Maps to navigate directly to your entrance with zero detour.
                </Text>
              </View>

              {/* Secondary Options Strip */}
              <View style={styles.locationActionStrip}>
                <TouchableOpacity
                  style={styles.locationActionItem}
                  onPress={() => setIsEditingManualAddress(!isEditingManualAddress)}
                  activeOpacity={0.7}
                >
                  <Edit3 size={12} color={colors.cyan} />
                  <Text style={styles.locationActionItemText}>
                    {isEditingManualAddress ? 'Hide Details' : 'Edit House / Landmark'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.locationActionItem}
                  onPress={handleQuickGpsDetect}
                  disabled={isLocatingGps}
                  activeOpacity={0.7}
                >
                  {isLocatingGps ? (
                    <ActivityIndicator size="small" color={colors.cyan} />
                  ) : (
                    <>
                      <Crosshair size={12} color={colors.cyan} />
                      <Text style={styles.locationActionItemText}>Refresh GPS</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Expandable Manual House/Flat & Landmark Editor */}
              {isEditingManualAddress ? (
                <View style={styles.manualAddressForm}>
                  <View style={styles.inputFieldGroup}>
                    <Text style={styles.inputFieldLabel}>HOUSE / FLAT / APARTMENT NO</Text>
                    <TextInput
                      style={[styles.textInputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                      placeholder="e.g. Flat 402, Cyber Heights"
                      placeholderTextColor={colors.textMuted}
                      value={houseNumber}
                      onChangeText={setHouseNumber}
                    />
                  </View>
                  <View style={styles.inputFieldGroup}>
                    <Text style={styles.inputFieldLabel}>LANDMARK / GATE / SPECIAL INSTRUCTION</Text>
                    <TextInput
                      style={[styles.textInputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                      placeholder="e.g. Near Metro Pillar 42, ring doorbell"
                      placeholderTextColor={colors.textMuted}
                      value={landmark}
                      onChangeText={setLandmark}
                    />
                  </View>
                </View>
              ) : null}
            </GlassCard>
          ) : (
            /* UNLOCKED STATE: PROMPTS USER TO SELECT ON MAP OR GPS */
            <GlassCard style={[styles.unlockedLocationCard, { borderColor: 'rgba(6, 182, 212, 0.4)' }]}>
              <View style={styles.unlockedTop}>
                <View style={styles.unlockedIconCircle}>
                  <MapPin size={24} color={colors.cyan} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.unlockedTitle, { color: colors.textPrimary }]}>
                    Lock Exact Doorstep on Map
                  </Text>
                  <Text style={styles.unlockedSubtitle}>
                    Select your exact doorstep on the map so the phlebotomist navigates straight to your home.
                  </Text>
                </View>
              </View>

              {/* Action Buttons: Select on Map & Live GPS */}
              <View style={styles.mapActionRow}>
                <TouchableOpacity
                  style={[styles.selectOnMapBtn, { backgroundColor: colors.cyan }]}
                  onPress={() => setIsMapModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <MapPin size={16} color="#030712" />
                  <Text style={styles.selectOnMapBtnText}>SELECT ON INTERACTIVE MAP</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickGpsBtn, { borderColor: colors.cyan }]}
                  onPress={handleQuickGpsDetect}
                  disabled={isLocatingGps}
                  activeOpacity={0.8}
                >
                  {isLocatingGps ? (
                    <ActivityIndicator size="small" color={colors.cyan} />
                  ) : (
                    <>
                      <Crosshair size={14} color={colors.cyan} />
                      <Text style={styles.quickGpsBtnText}>USE CURRENT GPS</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </GlassCard>
          )}
        </View>

        {/* ========================================================= */}
        {/* SECTION 3: VISIT TIMINGS (DATE & FASTING SLOTS)          */}
        {/* ========================================================= */}
        <View style={styles.detailSection}>
          <View style={styles.detailSectionHeader}>
            <Calendar size={16} color={colors.cyan} />
            <Text style={styles.detailSectionTitle}>3. CHOOSE VISIT DATE & TIME</Text>
          </View>

          {/* Date Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesRow}
          >
            {availableDates.map((d, idx) => {
              const isSelected = selectedDateIdx === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dateChip,
                    {
                      backgroundColor: isDark ? '#0d0d0d' : '#f1f5f9',
                      borderColor: colors.borderSubtle,
                    },
                    isSelected && styles.dateChipSelected,
                  ]}
                  onPress={() => setSelectedDateIdx(idx)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dateChipDay, isSelected && styles.dateChipDaySelected]}>
                    {d.day}
                  </Text>
                  <Text style={[styles.dateChipVal, { color: isSelected ? '#000000' : colors.textPrimary }, isSelected && styles.dateChipValSelected]}>
                    {d.dateStr}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Morning Slots (Recommended for Fasting) */}
          <Text style={styles.slotCategoryLabel}>
            🌅 MORNING SLOTS (MANDATORY FOR ACCURATE FASTING BIOMARKERS)
          </Text>
          <View style={styles.slotsGrid}>
            {MORNING_SLOTS.map((slot) => {
              const isSelected = selectedSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.slotCard,
                    {
                      backgroundColor: isDark ? '#0d0d0d' : '#f1f5f9',
                      borderColor: colors.borderSubtle,
                    },
                    isSelected && styles.slotCardSelected,
                  ]}
                  onPress={() => setSelectedSlot(slot)}
                  activeOpacity={0.8}
                >
                  <Clock size={12} color={isSelected ? '#000000' : colors.cyan} />
                  <Text style={[styles.slotCardText, { color: isSelected ? '#000000' : colors.textSecondary }, isSelected && styles.slotCardTextSelected]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Afternoon / Evening Slots */}
          <Text style={[styles.slotCategoryLabel, { marginTop: 12 }]}>
            ⛅ AFTERNOON / EVENING SLOTS
          </Text>
          <View style={styles.slotsGrid}>
            {REGULAR_SLOTS.map((slot) => {
              const isSelected = selectedSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.slotCard,
                    {
                      backgroundColor: isDark ? '#0d0d0d' : '#f1f5f9',
                      borderColor: colors.borderSubtle,
                    },
                    isSelected && styles.slotCardSelected,
                  ]}
                  onPress={() => setSelectedSlot(slot)}
                  activeOpacity={0.8}
                >
                  <Clock size={12} color={isSelected ? '#000000' : colors.textMuted} />
                  <Text style={[styles.slotCardText, { color: isSelected ? '#000000' : colors.textSecondary }, isSelected && styles.slotCardTextSelected]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ========================================================= */}
        {/* SECTION 4: MODE OF PAYMENT (COD VS ONLINE)                */}
        {/* ========================================================= */}
        <View style={styles.detailSection}>
          <View style={styles.detailSectionHeader}>
            <CreditCard size={16} color={colors.cyan} />
            <Text style={styles.detailSectionTitle}>4. MODE OF PAYMENT</Text>
          </View>

          <View style={styles.paymentOptionsRow}>
            {/* Cash on Delivery (COD) Card */}
            <TouchableOpacity
              style={[
                styles.paymentCard,
                {
                  backgroundColor: colors.bgCardElevated,
                  borderColor: colors.borderSubtle,
                },
                paymentMode === 'COD' && [styles.paymentCardSelected, { backgroundColor: isDark ? '#07181f' : '#ecfeff' }],
              ]}
              onPress={() => setPaymentMode('COD')}
              activeOpacity={0.8}
            >
              <View style={styles.paymentCardTop}>
                <View style={[styles.paymentIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Banknote size={18} color={colors.emeraldLight} />
                </View>
                {paymentMode === 'COD' ? (
                  <View style={styles.selectedPill}>
                    <Check size={10} color="#000000" />
                    <Text style={styles.selectedPillText}>SELECTED</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.paymentTitle, { color: colors.textPrimary }]}>Pay on Collection</Text>
              <Text style={styles.paymentDesc}>
                Pay cash or scan UPI with the phlebotomist at your doorstep upon blood draw.
              </Text>
            </TouchableOpacity>

            {/* Online Payment Card */}
            <TouchableOpacity
              style={[
                styles.paymentCard,
                {
                  backgroundColor: colors.bgCardElevated,
                  borderColor: colors.borderSubtle,
                },
                paymentMode === 'Online' && [styles.paymentCardSelected, { backgroundColor: isDark ? '#07181f' : '#ecfeff' }],
              ]}
              onPress={() => setPaymentMode('Online')}
              activeOpacity={0.8}
            >
              <View style={styles.paymentCardTop}>
                <View style={[styles.paymentIconWrap, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                  <CreditCard size={18} color={colors.cyanLight} />
                </View>
                {paymentMode === 'Online' ? (
                  <View style={styles.selectedPill}>
                    <Check size={10} color="#000000" />
                    <Text style={styles.selectedPillText}>SELECTED</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.paymentTitle, { color: colors.textPrimary }]}>Prepay Online</Text>
              <Text style={styles.paymentDesc}>
                Instant checkout via UPI, Google Pay, PhonePe, Debit/Credit Card.
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================= */}
        {/* SECTION 5: FASTING & PREPARATION CONFIRMATION             */}
        {/* ========================================================= */}
        <View style={styles.detailSection}>
          <TouchableOpacity
            style={[
              styles.prepAcknowledgeCard,
              {
                backgroundColor: isDark ? '#0a0a0a' : '#f8fafc',
                borderColor: prepAcknowledged ? colors.emeraldLight : colors.borderSubtle,
              },
            ]}
            onPress={() => setPrepAcknowledged(!prepAcknowledged)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.checkboxBox,
                prepAcknowledged && { backgroundColor: colors.emeraldLight, borderColor: colors.emeraldLight },
              ]}
            >
              {prepAcknowledged ? <Check size={14} color="#000000" /> : null}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.prepAcknowledgeTitle, { color: colors.textPrimary }]}>
                I confirm 10-12 hours overnight fasting
              </Text>
              <Text style={styles.prepAcknowledgeDesc}>
                Required for clinical blood glucose, lipid profile, and liver enzyme accuracy. Drinking plain water is permitted.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ========================================================= */}
        {/* CONFIRMATION BUTTON                                       */}
        {/* ========================================================= */}
        <TouchableOpacity
          style={[styles.mainBookBtn, { backgroundColor: colors.cyan }]}
          onPress={handleBook}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#030712" />
          ) : (
            <>
              <Text style={styles.mainBookBtnText}>
                CONFIRM HOME COLLECTION • ₹{basePrice}
              </Text>
              <ChevronRight size={18} color="#030712" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ========================================================= */}
      {/* INTERACTIVE MAP LOCATION PICKER MODAL                     */}
      {/* ========================================================= */}
      <MapLocationPickerModal
        visible={isMapModalVisible}
        onClose={() => setIsMapModalVisible(false)}
        initialCoordinates={lockedCoordinates}
        initialAddress={{
          houseNumber,
          street,
          landmark,
          city,
          state,
          pincode,
        }}
        onLocationSelected={handleLocationFromMapModal}
        colors={colors}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Draft Banner
  draftRecoveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  draftRecoveryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  draftRecoveryIcon: {
    marginRight: 10,
  },
  draftRecoveryTitle: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '800',
  },
  draftRecoverySub: {
    color: '#9ca3af',
    fontSize: 10.5,
    marginTop: 1,
  },
  draftDiscardBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 8,
  },
  draftDiscardText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
  },

  // Sections
  detailSection: {
    marginBottom: 22,
  },
  detailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  detailSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#22d3ee',
    letterSpacing: 1.2,
  },

  // Single Master Plan Card
  masterPlanCard: {
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 18,
  },
  masterPlanTop: {
    marginBottom: 12,
  },
  masterPlanBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  singlePlanTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#22d3ee',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  singlePlanTagText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#030712',
    letterSpacing: 0.4,
  },
  accreditedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  accreditedTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#34d399',
  },
  masterPlanTitle: {
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
    marginBottom: 4,
  },
  masterPlanSubtitle: {
    fontSize: 11.5,
    color: '#9ca3af',
    lineHeight: 16,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceCurrency: {
    fontSize: 13,
    fontWeight: '900',
    color: '#22d3ee',
    marginRight: 2,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  priceInclusive: {
    fontSize: 11,
    color: '#9ca3af',
    marginLeft: 6,
  },
  fastingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 8,
    marginBottom: 14,
  },
  fastingBannerText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  vitalsCoverageHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  vitalsGrid: {
    gap: 6,
  },
  vitalItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  vitalIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalItemTitle: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  vitalItemDesc: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 1,
  },

  // Map Locked Location Card
  lockedLocationCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
  },
  lockedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  lockedBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 0.4,
  },
  adjustMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  adjustMapBtnText: {
    color: '#22d3ee',
    fontSize: 10.5,
    fontWeight: '800',
  },
  coordsDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginBottom: 10,
  },
  coordsDisplayText: {
    color: '#22d3ee',
    fontSize: 11,
    fontWeight: '700',
  },
  addressDisplayBox: {
    marginBottom: 10,
  },
  addressDisplayTextMain: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  addressDisplayTextSub: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  laNavigationAssurance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  laNavigationAssuranceText: {
    color: '#9ca3af',
    fontSize: 10.5,
    flex: 1,
    lineHeight: 14,
  },
  locationActionStrip: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
  },
  locationActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationActionItemText: {
    color: '#22d3ee',
    fontSize: 11,
    fontWeight: '700',
  },
  manualAddressForm: {
    marginTop: 12,
    gap: 10,
  },
  inputFieldGroup: {},
  inputFieldLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#9ca3af',
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  textInputField: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },

  // Unlocked Location Card
  unlockedLocationCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
  },
  unlockedTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  unlockedIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockedTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  unlockedSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
    lineHeight: 15,
  },
  mapActionRow: {
    gap: 10,
  },
  selectOnMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  selectOnMapBtnText: {
    color: '#030712',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  quickGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.06)',
  },
  quickGpsBtnText: {
    color: '#22d3ee',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  // Dates & Slots
  datesRow: {
    gap: 8,
    marginBottom: 14,
  },
  dateChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 70,
  },
  dateChipSelected: {
    backgroundColor: '#22d3ee',
    borderColor: '#22d3ee',
  },
  dateChipDay: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
    marginBottom: 2,
  },
  dateChipDaySelected: {
    color: '#030712',
  },
  dateChipVal: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  dateChipValSelected: {
    color: '#030712',
  },
  slotCategoryLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    minWidth: '47%',
  },
  slotCardSelected: {
    backgroundColor: '#22d3ee',
    borderColor: '#22d3ee',
  },
  slotCardText: {
    fontSize: 11,
    fontWeight: '700',
  },
  slotCardTextSelected: {
    color: '#030712',
  },

  // Mode of Payment
  paymentOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  paymentCardSelected: {
    borderColor: '#22d3ee',
    borderWidth: 1.5,
  },
  paymentCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#22d3ee',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  selectedPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#030712',
  },
  paymentTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  paymentDesc: {
    fontSize: 10,
    color: '#9ca3af',
    lineHeight: 14,
  },

  // Preparation confirmation
  prepAcknowledgeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  prepAcknowledgeTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  prepAcknowledgeDesc: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
    lineHeight: 15,
  },

  // Main Booking Button
  mainBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 6,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  mainBookBtnText: {
    color: '#030712',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  // Success Screen
  successScroll: {
    padding: 20,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 12.5,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 17,
  },
  successOtpCard: {
    width: '100%',
    padding: 18,
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 16,
  },
  successOtpLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#22d3ee',
    letterSpacing: 1,
    marginBottom: 10,
  },
  successDigitsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  successDigitBox: {
    width: 40,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1.5,
    borderColor: '#22d3ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successDigitText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#22d3ee',
  },
  successOtpHint: {
    fontSize: 10.5,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 14,
  },
  successLocationCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  successLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  successLocationTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#22d3ee',
    letterSpacing: 0.8,
  },
  successAddressText: {
    fontSize: 13.5,
    fontWeight: '800',
    lineHeight: 18,
    marginBottom: 8,
  },
  successCoordsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  successCoordsText: {
    color: '#22d3ee',
    fontSize: 10,
    fontWeight: '800',
  },
  successDispatchNote: {
    fontSize: 10.5,
    color: '#9ca3af',
    lineHeight: 14,
  },
  successSummaryRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  successSummaryItem: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  successSummaryVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 2,
  },
  successSummaryLbl: {
    fontSize: 10,
    color: '#9ca3af',
  },
  goToHomeBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  goToHomeText: {
    color: '#030712',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});

export default BookAppointmentScreen;
