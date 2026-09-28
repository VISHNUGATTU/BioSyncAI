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
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import { useUserAppointmentStore } from '../store/userAppointmentStore';
import GlassCard from '../components/GlassCard';

const TIME_SLOTS = [
  '06:30 - 07:30 AM',
  '07:30 - 08:30 AM',
  '08:30 - 09:30 AM',
  '09:30 - 10:30 AM',
  '10:30 - 11:30 AM',
  '04:30 - 05:30 PM',
];

export const BookAppointmentScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { testCatalog, fetchTestCatalog, bookAppointment, isLoading } =
    useUserAppointmentStore();

  const [selectedTestId, setSelectedTestId] = useState(
    route?.params?.preselectedTestId || null
  );
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[1]);
  const [prepAcknowledged, setPrepAcknowledged] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState(null);

  // Generate next 5 available booking dates
  const availableDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
      setSelectedTestId(route.params.preselectedTestId);
    } else if (testCatalog && testCatalog.length > 0 && !selectedTestId) {
      setSelectedTestId(testCatalog[0]._id);
    }
  }, [testCatalog, route?.params?.preselectedTestId]);

  const selectedTest = testCatalog?.find((t) => t._id === selectedTestId) || testCatalog?.[0];

  const handleBook = async () => {
    if (!selectedTest) {
      Alert.alert('Selection Required', 'Please select a diagnostic test panel.');
      return;
    }
    if (!prepAcknowledged) {
      Alert.alert(
        'Preparation Acknowledged Required',
        'Please confirm that you will follow the mandatory fasting/preparation instructions before booking.'
      );
      return;
    }

    const payload = {
      testId: selectedTest._id,
      scheduledDate: availableDates[selectedDateIdx].isoString,
      timeSlot: selectedSlot,
      preparationAcknowledged: true,
      address: user?.address || {
        street: 'Flat 402, Highline Residency',
        city: 'Hyderabad',
        pincode: '500081',
        coordinates: { lat: 17.4435, lng: 78.3842 },
      },
    };

    const res = await bookAppointment(payload);

    if (res.success) {
      setBookingSuccessData(res.appointment);
    } else {
      Alert.alert('Booking Notice', res.message || 'Unable to book appointment');
    }
  };

  if (bookingSuccessData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.successScroll}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={40} color={colors.emeraldLight} />
          </View>
          <Text style={styles.successTitle}>Home Visit Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            BioSync AI distance routing has assigned the nearest certified phlebotomist.
          </Text>

          <GlassCard style={styles.successOtpCard}>
            <Text style={styles.successOtpLabel}>YOUR COLLECTION OTP</Text>
            <View style={styles.successDigitsRow}>
              {(bookingSuccessData.collectionOTP || '4829').split('').map((d, i) => (
                <View key={i} style={styles.successDigitBox}>
                  <Text style={styles.successDigitText}>{d}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.successOtpHint}>
              Keep this 4-digit code ready. The phlebotomist will verify it at your doorstep before collecting blood samples.
            </Text>
          </GlassCard>

          <TouchableOpacity
            style={styles.goToHomeBtn}
            onPress={() => {
              setBookingSuccessData(null);
              navigation.navigate('Home');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.goToHomeText}>TRACK LIVE IN HOME</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule Home Collection</Text>
        <Text style={styles.headerSubtitle}>
          NABL Certified Phlebotomist • Real-time GPS & 4°C Telemetry
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: SELECT DIAGNOSTIC PANEL */}
        <View style={styles.stepSection}>
          <Text style={styles.stepTitle}>1. SELECT DIAGNOSTIC PANEL</Text>
          {testCatalog && testCatalog.length > 0 ? (
            testCatalog.map((t) => {
              const isSelected = selectedTestId === t._id;
              return (
                <TouchableOpacity
                  key={t._id}
                  style={[styles.testOptionCard, isSelected && styles.testOptionSelected]}
                  onPress={() => setSelectedTestId(t._id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.testRadioCircle}>
                    {isSelected ? <View style={styles.testRadioInner} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.testName, isSelected && styles.testNameSelected]}>
                      {t.testName}
                    </Text>
                    <Text style={styles.testMeta}>
                      {t.category} • Turnaround: {t.turnaroundTimeHours || 24}h
                    </Text>
                    {t.preparationInstructions?.requiresFasting ? (
                      <View style={styles.fastingPill}>
                        <Clock size={10} color={colors.amberLight} />
                        <Text style={styles.fastingPillText}>
                          Fasting: {t.preparationInstructions.fastingHoursRequired || 10-12} hours required
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.priceColumn}>
                    <Text style={styles.priceVal}>
                      ₹{t.pricing?.basePrice || 499}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <ActivityIndicator size="small" color={colors.cyan} style={{ marginVertical: 20 }} />
          )}
        </View>

        {/* STEP 2: SELECT COLLECTION DATE */}
        <View style={styles.stepSection}>
          <Text style={styles.stepTitle}>2. SELECT DATE</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateSelectorRow}
          >
            {availableDates.map((d, idx) => {
              const isSelected = selectedDateIdx === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                  onPress={() => setSelectedDateIdx(idx)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dateDayText, isSelected && styles.dateDaySelected]}>
                    {d.day}
                  </Text>
                  <Text style={[styles.dateValText, isSelected && styles.dateValSelected]}>
                    {d.dateStr}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* STEP 3: SELECT TIME SLOT */}
        <View style={styles.stepSection}>
          <Text style={styles.stepTitle}>3. SELECT TIME SLOT</Text>
          <View style={styles.slotsGrid}>
            {TIME_SLOTS.map((slot) => {
              const isSelected = selectedSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[styles.slotChip, isSelected && styles.slotChipSelected]}
                  onPress={() => setSelectedSlot(slot)}
                  activeOpacity={0.8}
                >
                  <Clock size={12} color={isSelected ? '#000000' : colors.textMuted} />
                  <Text style={[styles.slotChipText, isSelected && styles.slotChipTextSelected]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* STEP 4: PATIENT ADDRESS */}
        <View style={styles.stepSection}>
          <Text style={styles.stepTitle}>4. COLLECTION ADDRESS</Text>
          <GlassCard style={styles.addressCard}>
            <View style={styles.addressRow}>
              <MapPin size={18} color={colors.cyan} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressStreet}>
                  {user?.address?.street || 'Flat 402, Highline Residency'}
                </Text>
                <Text style={styles.addressSub}>
                  {user?.address?.city || 'Hyderabad'}, {user?.address?.pincode || '500081'}
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* MANDATORY PREPARATION ACKNOWLEDGEMENT */}
        <TouchableOpacity
          style={[styles.ackCard, prepAcknowledged && styles.ackCardChecked]}
          onPress={() => setPrepAcknowledged(!prepAcknowledged)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, prepAcknowledged && styles.checkboxChecked]}>
            {prepAcknowledged ? <CheckCircle2 size={14} color="#000000" /> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ackTitle}>Preparation & Fasting Acknowledged</Text>
            <Text style={styles.ackDesc}>
              I confirm that I will maintain required fasting (water permitted) and be available at the address with my phone.
            </Text>
          </View>
        </TouchableOpacity>

        {/* BOOK SUBMIT BUTTON */}
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
                CONFIRM & ASSIGN NEAREST STAFF • ₹{selectedTest?.pricing?.basePrice || 499}
              </Text>
            </>
          )}
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  stepSection: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.cyan,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  testOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  testOptionSelected: {
    backgroundColor: '#07181d',
    borderColor: colors.cyan,
  },
  testRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.cyan,
  },
  testName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  testNameSelected: {
    color: colors.cyanLight,
  },
  testMeta: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  fastingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  fastingPillText: {
    fontSize: 10,
    color: colors.amberLight,
    fontWeight: '700',
  },
  priceColumn: {
    alignItems: 'flex-end',
  },
  priceVal: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.cyan,
  },
  dateSelectorRow: {
    gap: 10,
  },
  dateCard: {
    width: 76,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  dateCardSelected: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyanLight,
  },
  dateDayText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  dateDaySelected: {
    color: '#000000',
  },
  dateValText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
  },
  dateValSelected: {
    color: '#000000',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  slotChipSelected: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyanLight,
  },
  slotChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  slotChipTextSelected: {
    color: '#000000',
  },
  addressCard: {
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressStreet: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  addressSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
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
    marginBottom: 20,
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
  ackDesc: {
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
    paddingVertical: 14,
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
