import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Check,
  Zap,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import { useUserAppointmentStore } from '../store/userAppointmentStore';
import GlassCard from '../components/GlassCard';

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

export const BookAppointmentScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { testCatalog, fetchTestCatalog, bookAppointment, isLoading } =
    useUserAppointmentStore();

  const [selectedPlanId, setSelectedPlanId] = useState(
    route?.params?.preselectedTestId || null
  );
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(MORNING_SLOTS[1]);
  const [prepAcknowledged, setPrepAcknowledged] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState(null);

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
    if (!testCatalog || testCatalog.length === 0) {
      fetchTestCatalog();
    }
  }, []);

  useEffect(() => {
    if (route?.params?.preselectedTestId) {
      setSelectedPlanId(route.params.preselectedTestId);
    }
  }, [route?.params?.preselectedTestId]);

  const selectedPlan = testCatalog?.find((t) => t._id === selectedPlanId) || null;

  const handleBook = async () => {
    if (!selectedPlan) {
      Alert.alert('Plan Required', 'Please select a diagnostic plan to proceed.');
      return;
    }
    if (!prepAcknowledged) {
      Alert.alert(
        'Preparation Acknowledgment Required',
        'Please confirm that you will follow the mandatory fasting/preparation instructions before booking.'
      );
      return;
    }

    const payload = {
      testId: selectedPlan._id,
      scheduledDate: availableDates[selectedDateIdx].isoString,
      timeSlot: selectedSlot,
      preparationAcknowledged: true,
      address: user?.address || {
        street: 'Flat 402, Cyber Heights',
        city: 'Hyderabad',
        pincode: '500081',
        coordinates: { lat: 17.4485, lng: 78.3768 },
      },
    };

    const res = await bookAppointment(payload);

    if (res.success) {
      setBookingSuccessData(res.appointment);
    } else {
      Alert.alert('Booking Notice', res.message || 'Unable to book appointment');
    }
  };

  // -------------------------------------------------------------
  // SUCCESS SCREEN: SHOW GLOWING OTP & ASSIGNED STAFF
  // -------------------------------------------------------------
  if (bookingSuccessData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.successScroll}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={40} color={colors.emeraldLight} />
          </View>
          <Text style={styles.successTitle}>Home Visit Scheduled!</Text>
          <Text style={styles.successSubtitle}>
            BioSync AI distance routing has auto-assigned your nearest certified phlebotomist.
          </Text>

          <GlassCard style={styles.successOtpCard}>
            <Text style={styles.successOtpLabel}>YOUR SECURE COLLECTION OTP</Text>
            <View style={styles.successDigitsRow}>
              {(bookingSuccessData.collectionOTP || '4829').split('').map((d, i) => (
                <View key={i} style={styles.successDigitBox}>
                  <Text style={styles.successDigitText}>{d}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.successOtpHint}>
              Keep this verification code ready. The phlebotomist will verify it at your doorstep before collecting blood samples.
            </Text>
          </GlassCard>

          <TouchableOpacity
            style={styles.goToHomeBtn}
            onPress={() => {
              setBookingSuccessData(null);
              setSelectedPlanId(null);
              navigation.navigate('Home');
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
  // MAIN BOOKING WORKFLOW
  // -------------------------------------------------------------
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Diagnostic Home Visits</Text>
          <Text style={styles.headerSubtitle}>
            {selectedPlan
              ? 'Complete timing & collection details'
              : 'Select a clinical diagnostic plan to calibrate your profile'}
          </Text>
        </View>
        {selectedPlan ? (
          <TouchableOpacity
            style={styles.changePlanHeaderBtn}
            onPress={() => setSelectedPlanId(null)}
            activeOpacity={0.7}
          >
            <Text style={styles.changePlanHeaderText}>CHANGE PLAN</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: OPTIONS NEATLY PRESENTED */}
        {!selectedPlan ? (
          <View style={styles.plansSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.stepHeading}>STEP 1: SELECT YOUR DIAGNOSTIC PLAN</Text>
              <Text style={styles.stepSubHeading}>
                NABL Accredited • Home collection with cold-chain 4°C telemetry
              </Text>
            </View>

            {testCatalog && testCatalog.length > 0 ? (
              testCatalog.map((plan) => {
                const fastingRequired = plan.preparationInstructions?.requiresFasting;
                const fastingHours = plan.preparationInstructions?.fastingHoursRequired || 12;

                return (
                  <TouchableOpacity
                    key={plan._id}
                    style={styles.planCard}
                    onPress={() => setSelectedPlanId(plan._id)}
                    activeOpacity={0.85}
                  >
                    {/* Top Row: Plan Name & Price */}
                    <View style={styles.planCardTop}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <View style={styles.badgeRow}>
                          <View style={styles.accreditedBadge}>
                            <ShieldCheck size={11} color={colors.cyan} />
                            <Text style={styles.accreditedBadgeText}>NABL & ISO-15189</Text>
                          </View>
                          {plan.category ? (
                            <View style={styles.categoryBadge}>
                              <Text style={styles.categoryBadgeText}>{plan.category}</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.planName}>{plan.testName}</Text>
                      </View>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceCurrency}>₹</Text>
                        <Text style={styles.priceValue}>
                          {plan.pricing?.basePrice || 499}
                        </Text>
                      </View>
                    </View>

                    {/* Middle: Clinical Highlights & Fasting Info */}
                    <View style={styles.planMetaRow}>
                      <View style={styles.metaPill}>
                        <FlaskConical size={12} color={colors.cyan} />
                        <Text style={styles.metaPillText}>
                          {plan.sampleTypes?.join(', ') || 'Blood & Urine Samples'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metaPill,
                          fastingRequired ? styles.fastingPill : styles.regularPill,
                        ]}
                      >
                        <Clock
                          size={12}
                          color={fastingRequired ? colors.amberLight : colors.emeraldLight}
                        />
                        <Text
                          style={[
                            styles.metaPillText,
                            fastingRequired ? { color: colors.amberLight } : { color: colors.emeraldLight },
                          ]}
                        >
                          {fastingRequired ? `${fastingHours}h Fasting Required` : 'No Fasting Needed'}
                        </Text>
                      </View>
                    </View>

                    {/* Bottom CTA Button */}
                    <View style={styles.planCardBottom}>
                      <Text style={styles.turnaroundText}>
                        Results delivered within {plan.turnaroundTimeHours || 24} hours
                      </Text>
                      <View style={styles.selectPlanBtn}>
                        <Text style={styles.selectPlanBtnText}>CHOOSE PLAN</Text>
                        <ChevronRight size={14} color="#000000" />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colors.cyan} />
                <Text style={styles.loadingText}>Loading diagnostic plans...</Text>
              </View>
            )}
          </View>
        ) : (
          /* STEP 2: "AFTER CLICKING THE PLAN THEN IT SHOULD [SHOW] TIMINGS AND ALL THE DETAILS" */
          <View style={styles.detailsWorkflowSection}>
            {/* Selected Plan Spotlight Banner */}
            <GlassCard style={styles.selectedPlanBanner}>
              <View style={styles.selectedPlanHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.selectedTag}>
                    <Check size={11} color={colors.emeraldLight} />
                    <Text style={styles.selectedTagText}>SELECTED PLAN</Text>
                  </View>
                  <Text style={styles.selectedPlanTitle}>{selectedPlan.testName}</Text>
                  <Text style={styles.selectedPlanPrice}>
                    ₹{selectedPlan.pricing?.basePrice || 499} • {selectedPlan.category || 'Clinical Panel'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.changeBtnSmall}
                  onPress={() => setSelectedPlanId(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.changeBtnSmallText}>Change</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>

            {/* Timings 1: Collection Date */}
            <View style={styles.detailSection}>
              <View style={styles.detailSectionHeader}>
                <Calendar size={16} color={colors.cyan} />
                <Text style={styles.detailSectionTitle}>1. CHOOSE COLLECTION DATE</Text>
              </View>
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
                      style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                      onPress={() => setSelectedDateIdx(idx)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.dateChipDay, isSelected && styles.dateChipDaySelected]}>
                        {d.day}
                      </Text>
                      <Text style={[styles.dateChipVal, isSelected && styles.dateChipValSelected]}>
                        {d.dateStr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Timings 2: Time Slots */}
            <View style={styles.detailSection}>
              <View style={styles.detailSectionHeader}>
                <Clock size={16} color={colors.cyan} />
                <Text style={styles.detailSectionTitle}>2. CHOOSE VISIT TIMINGS</Text>
              </View>

              {/* Recommended Fasting Morning Slots */}
              <Text style={styles.slotCategoryLabel}>
                🌅 MORNING SLOTS (RECOMMENDED FOR FASTING BIOMARKERS)
              </Text>
              <View style={styles.slotsGrid}>
                {MORNING_SLOTS.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.slotCard, isSelected && styles.slotCardSelected]}
                      onPress={() => setSelectedSlot(slot)}
                      activeOpacity={0.8}
                    >
                      <Clock size={12} color={isSelected ? '#000000' : colors.cyan} />
                      <Text style={[styles.slotCardText, isSelected && styles.slotCardTextSelected]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Regular Slots */}
              <Text style={[styles.slotCategoryLabel, { marginTop: 12 }]}>
                ⛅ AFTERNOON / EVENING SLOTS
              </Text>
              <View style={styles.slotsGrid}>
                {REGULAR_SLOTS.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.slotCard, isSelected && styles.slotCardSelected]}
                      onPress={() => setSelectedSlot(slot)}
                      activeOpacity={0.8}
                    >
                      <Clock size={12} color={isSelected ? '#000000' : colors.textMuted} />
                      <Text style={[styles.slotCardText, isSelected && styles.slotCardTextSelected]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Details: Collection Address & Distance Assignment */}
            <View style={styles.detailSection}>
              <View style={styles.detailSectionHeader}>
                <MapPin size={16} color={colors.cyan} />
                <Text style={styles.detailSectionTitle}>3. HOME COLLECTION ADDRESS</Text>
              </View>
              <GlassCard style={styles.addressCard}>
                <View style={styles.addressHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addressMain}>
                      {user?.address?.street || 'Flat 402, Cyber Heights'}
                    </Text>
                    <Text style={styles.addressCity}>
                      {user?.address?.city || 'Hyderabad'}, {user?.address?.pincode || '500081'}
                    </Text>
                  </View>
                  <View style={styles.distanceBadge}>
                    <Zap size={11} color={colors.cyan} />
                    <Text style={styles.distanceBadgeText}>Nearest Staff</Text>
                  </View>
                </View>
                <Text style={styles.dispatchNote}>
                  BioSync distance routing will automatically assign the nearest available phlebotomist.
                </Text>
              </GlassCard>
            </View>

            {/* Preparation Acknowledgement */}
            <TouchableOpacity
              style={[styles.ackCard, prepAcknowledged && styles.ackCardChecked]}
              onPress={() => setPrepAcknowledged(!prepAcknowledged)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, prepAcknowledged && styles.checkboxChecked]}>
                {prepAcknowledged ? <Check size={14} color="#000000" /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ackTitle}>Preparation & Fasting Acknowledged</Text>
                <Text style={styles.ackSubtitle}>
                  I confirm 10-12 hours overnight fasting (water permitted) for accurate metabolic biomarker calibration.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Confirm Booking CTA */}
            <TouchableOpacity
              style={[styles.confirmBtn, isLoading && { opacity: 0.7 }]}
              onPress={handleBook}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <Sparkles size={18} color="#000000" />
                  <Text style={styles.confirmBtnText}>
                    CONFIRM & SCHEDULE VISIT • ₹{selectedPlan.pricing?.basePrice || 499}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  changePlanHeaderBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changePlanHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.cyan,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  plansSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    marginBottom: 14,
  },
  stepHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.cyan,
    letterSpacing: 1.5,
  },
  stepSubHeading: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },
  planCard: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  planCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  accreditedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  accreditedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.cyan,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },
  planName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  priceCurrency: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.cyan,
    marginTop: 2,
    marginRight: 2,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  planMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#121212',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fastingPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  regularPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  metaPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  planCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  turnaroundText: {
    fontSize: 10,
    color: colors.textMuted,
    flex: 1,
  },
  selectPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cyan,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  selectPlanBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
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
  detailsWorkflowSection: {
    gap: 18,
  },
  selectedPlanBanner: {
    backgroundColor: '#07181f',
    borderColor: colors.cyan,
    padding: 16,
  },
  selectedPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  selectedTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.emeraldLight,
    letterSpacing: 1,
  },
  selectedPlanTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
  },
  selectedPlanPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.cyanLight,
    marginTop: 2,
  },
  changeBtnSmall: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  changeBtnSmallText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  detailSection: {
    marginBottom: 4,
  },
  detailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  detailSectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.cyan,
    letterSpacing: 1.5,
  },
  datesRow: {
    gap: 10,
  },
  dateChip: {
    width: 78,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  dateChipSelected: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyanLight,
  },
  dateChipDay: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  dateChipDaySelected: {
    color: '#000000',
  },
  dateChipVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
  },
  dateChipValSelected: {
    color: '#000000',
  },
  slotCategoryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  slotCardSelected: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyanLight,
  },
  slotCardText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  slotCardTextSelected: {
    color: '#000000',
  },
  addressCard: {
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  addressMain: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  addressCity: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  distanceBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.cyan,
  },
  dispatchNote: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
  },
  ackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    padding: 14,
  },
  ackCardChecked: {
    backgroundColor: '#06130b',
    borderColor: colors.emerald,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.emerald,
    borderColor: colors.emeraldLight,
  },
  ackTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  ackSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 14,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.cyan,
    paddingVertical: 15,
    borderRadius: 14,
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  successScroll: {
    paddingHorizontal: 20,
    paddingTop: 30,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  successOtpCard: {
    width: '100%',
    backgroundColor: '#0a0a0a',
    borderColor: colors.emerald,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  successOtpLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  successDigitsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  successDigitBox: {
    width: 50,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#12331f',
    borderWidth: 1,
    borderColor: colors.emeraldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successDigitText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
  },
  successOtpHint: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  goToHomeBtn: {
    width: '100%',
    backgroundColor: colors.cyan,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  goToHomeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1,
  },
});

export default BookAppointmentScreen;
