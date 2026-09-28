import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Phone,
  Navigation,
  MapPin,
  Clock,
  User,
  FlaskConical,
  TriangleAlert,
  CircleCheck,
  KeyRound,
  ShieldCheck,
  X,
  FileText,
  ChevronRight,
  HeartPulse,
  Headset,
  Stethoscope,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import useAppointmentStore from '../store/appointmentStore';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import OTPModal from '../components/OTPModal';
import SpecimenTubeGuide from '../components/SpecimenTubeGuide';
import PatientBaselineModal from '../components/PatientBaselineModal';
import OpsHelplineModal from '../components/OpsHelplineModal';
import staffApi from '../api/staffApi';
import locationService from '../services/locationService';

export const AppointmentDetailScreen = ({ route, navigation }) => {
  const { appointment } = route.params || {};
  const { updateStatus, rejectAppointment } = useAppointmentStore();

  const [currentAppt, setCurrentAppt] = useState(appointment);
  const [actionLoading, setActionLoading] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);

  // Reject / cancellation modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('Patient_No_Show');
  const [rejectNotes, setRejectNotes] = useState('');

  // Patient Baseline & Ops Helpline modals
  const [baselineModalVisible, setBaselineModalVisible] = useState(false);
  const [baselineLoading, setBaselineLoading] = useState(false);
  const [baselineData, setBaselineData] = useState(null);
  const [helplineModalVisible, setHelplineModalVisible] = useState(false);

  const handleOpenBaseline = async () => {
    setBaselineModalVisible(true);
    setBaselineLoading(true);
    try {
      const res = await staffApi.getAppointmentVitals(currentAppt._id);
      if (res?.success && res?.data) {
        setBaselineData(res.data);
      } else {
        setBaselineData(null);
      }
    } catch (err) {
      console.warn('Baseline fetch warning:', err.message);
      setBaselineData(null);
    } finally {
      setBaselineLoading(false);
    }
  };

  if (!currentAppt) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>Appointment details not found.</Text>
      </SafeAreaView>
    );
  }

  const user = currentAppt.user || {};
  const patientName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Patient';
  const address = currentAppt.address || user.address || {};
  const addressText = typeof address === 'string'
    ? address
    : [
        address.houseNumber,
        address.street,
        address.landmark,
        address.city,
        address.pincode || address.postalCode,
      ].filter(Boolean).join(', ') || 'Address on file';

  const rawTests = currentAppt.tests || (currentAppt.testCatalog ? [currentAppt.testCatalog] : []);
  const tests = Array.isArray(rawTests) ? rawTests.filter(Boolean) : [];

  const handleCall = () => {
    const phone = user.phoneNumber || user.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleOpenMaps = () => {
    if (address.coordinates?.lat && address.coordinates?.lng) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${address.coordinates.lat},${address.coordinates.lng}`);
    } else {
      const query = encodeURIComponent(addressText);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    }
  };

  // State Machine Step 1: Start Route
  const handleStartTrip = async () => {
    try {
      setActionLoading(true);
      const res = await updateStatus(currentAppt._id, 'On_The_Way');
      if (res.success) {
        setCurrentAppt({ ...currentAppt, status: 'On_The_Way' });
        // Engage live location streaming
        await locationService.startTracking();
        Alert.alert('Trip Started', 'Trip initialized. Live GPS updates active and streaming to dispatch.');
      } else {
        Alert.alert('Error', res.message || 'Failed to start trip.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // State Machine Step 2: Mark Arrived
  const handleMarkArrived = async () => {
    try {
      setActionLoading(true);
      const res = await updateStatus(currentAppt._id, 'Arrived');
      if (res.success) {
        setCurrentAppt({ ...currentAppt, status: 'Arrived' });
        Alert.alert('Arrival Confirmed', 'You have arrived. Verify Collection OTP with the patient to start.');
      } else {
        Alert.alert('Error', res.message || 'Failed to mark arrived.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // State Machine Step 3: Verify OTP & Begin Collection
  const handleVerifyOTP = async (otpCode) => {
    try {
      setActionLoading(true);
      const res = await updateStatus(currentAppt._id, 'Collecting', otpCode);
      if (res.success) {
        setOtpModalVisible(false);
        setCurrentAppt({ ...currentAppt, status: 'Collecting' });
        // Auto-navigate to ActiveCollection screen
        navigation.navigate('ActiveCollection', { appointment: { ...currentAppt, status: 'Collecting' } });
      } else {
        Alert.alert('OTP Verification Failed', res.message || 'Incorrect OTP code provided by the patient.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // State Machine Step 4: Proceed to Barcode Scan
  const handleProceedCollection = () => {
    navigation.navigate('ActiveCollection', { appointment: currentAppt });
  };

  // Rejection Submission
  const handleConfirmReject = async () => {
    try {
      setActionLoading(true);
      const res = await rejectAppointment(currentAppt._id, rejectReason, rejectNotes);
      if (res.success) {
        setRejectModalVisible(false);
        Alert.alert('Trip Cancelled', 'Appointment marked as rejected/cancelled.');
        navigation.goBack();
      } else {
        Alert.alert('Error', res.message || 'Failed to cancel appointment');
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Servicing Task</Text>
        <StatusBadge status={currentAppt.status} size="small" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Patient Profile Card */}
        <GlassCard style={styles.card}>
          <View style={styles.patientRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user.firstName?.[0] || 'P').toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientName}>{patientName}</Text>
              <Text style={styles.phoneText}>{user.phoneNumber || user.phone || 'Phone on file'}</Text>
            </View>

            <TouchableOpacity style={styles.callCircleBtn} onPress={handleCall}>
              <Phone size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Scheduled Date/Time */}
          <View style={styles.timeBanner}>
            <Clock size={15} color={colors.primaryLight} />
            <Text style={styles.timeBannerText}>
              Slot: {currentAppt.timeSlot || '09:00 - 10:00 AM'}
            </Text>
          </View>

          {currentAppt.doctor && (
            <View style={styles.assignedDoctorPill}>
              <Stethoscope size={13} color={colors.cyan} />
              <Text style={styles.assignedDoctorText}>
                {currentAppt.doctor.name || 'Assigned Pathologist'}
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Quick Context & Helpline Action Strip */}
        <View style={styles.quickActionStrip}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={handleOpenBaseline}
            activeOpacity={0.8}
          >
            <HeartPulse size={15} color={colors.cyan} />
            <Text style={styles.quickActionBtnText}>Patient Baseline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { borderColor: colors.rose + '40', backgroundColor: colors.rose + '10' }]}
            onPress={() => setHelplineModalVisible(true)}
            activeOpacity={0.8}
          >
            <Headset size={15} color={colors.roseLight} />
            <Text style={[styles.quickActionBtnText, { color: colors.roseLight }]}>Ops Helpline / SOS</Text>
          </TouchableOpacity>
        </View>

        {/* Collection Location Card */}
        <GlassCard style={styles.card}>
          <View style={styles.cardSectionHeader}>
            <MapPin size={16} color={colors.primaryLight} />
            <Text style={styles.cardSectionTitle}>Collection Location</Text>
          </View>

          <Text style={styles.fullAddressText}>{addressText}</Text>

          <TouchableOpacity style={styles.navigateBtn} onPress={handleOpenMaps} activeOpacity={0.8}>
            <Navigation size={16} color="#fff" />
            <Text style={styles.navigateBtnText}>Open Google Maps Route</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Single Unified Diagnostic Protocol Card */}
        <GlassCard style={styles.card}>
          <View style={styles.cardSectionHeader}>
            <FlaskConical size={16} color={colors.primaryLight} />
            <Text style={styles.cardSectionTitle}>Assigned Diagnostic Package</Text>
          </View>

          <View style={styles.testItem}>
            <View style={styles.testDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.testItemTitle}>BioSync 360 Full Biomarker Diagnostic</Text>
              <Text style={styles.testItemDesc}>
                Category: Comprehensive Health & AI Prediction • Tri-Specimen Protocol
              </Text>
              <Text style={styles.fastingNote}>Requires 10-12 Hours Overnight Fasting</Text>
            </View>
          </View>

          <View style={styles.packageComponentsBox}>
            <Text style={styles.packageComponentsTitle}>INCLUDED COLLECTION PROTOCOLS:</Text>
            <View style={styles.componentItemRow}>
              <Text style={styles.componentEmoji}>📋</Text>
              <Text style={styles.componentText}>Clinical Intake: Physical Vitals & Medical Properties Questionnaire</Text>
            </View>
            <View style={styles.componentItemRow}>
              <Text style={styles.componentEmoji}>🩸</Text>
              <Text style={styles.componentText}>Venous Blood Draw: EDTA, Serum Separator, Fluoride tubes (3 vials)</Text>
            </View>
            <View style={styles.componentItemRow}>
              <Text style={styles.componentEmoji}>🟡</Text>
              <Text style={styles.componentText}>Midstream Urine Specimen: 50ml sterile container</Text>
            </View>
            <View style={styles.componentItemRow}>
              <Text style={styles.componentEmoji}>🟤</Text>
              <Text style={styles.componentText}>Stool Specimen: Sterile container in biohazard transport pouch</Text>
            </View>
          </View>
        </GlassCard>

        {/* Specimen Vacutainer Guide & Order of Draw */}
        <SpecimenTubeGuide tests={tests} collapsible={true} initialExpanded={false} />

        {/* Controlled State Machine Action Box */}
        <View style={styles.workflowBox}>
          <Text style={styles.workflowHeaderTitle}>SERVICE WORKFLOW CONTROLS</Text>

          {/* Condition 1: Assistant_Assigned / Pending */}
          {['Assistant_Assigned', 'Assigned', 'Booked', 'Pending'].includes(currentAppt.status) && (
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={handleStartTrip}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Navigation size={18} color="#fff" />
                  <Text style={styles.primaryActionBtnText}>Start Trip (On The Way)</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Condition 2: On_The_Way */}
          {['On_The_Way', 'On_Route'].includes(currentAppt.status) && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: colors.emerald }]}
              onPress={handleMarkArrived}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <CircleCheck size={18} color="#fff" />
                  <Text style={styles.primaryActionBtnText}>Mark Arrived at Patient Location</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Condition 3: Arrived -> Prompt OTP */}
          {currentAppt.status === 'Arrived' && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: colors.violet }]}
              onPress={() => setOtpModalVisible(true)}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <KeyRound size={18} color="#fff" />
                  <Text style={styles.primaryActionBtnText}>Verify OTP & Begin Sample Collection</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Condition 4: Collecting -> Go to barcode & photo screen */}
          {currentAppt.status === 'Collecting' && (
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={handleProceedCollection}
              activeOpacity={0.8}
            >
              <FlaskConical size={18} color="#fff" />
              <Text style={styles.primaryActionBtnText}>Record Sample Barcode & Vials</Text>
              <ChevronRight size={18} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Condition 5: Already Collected */}
          {['Sample_Collected', 'At_Laboratory', 'Processing', 'Completed'].includes(currentAppt.status) && (
            <View style={styles.completedNotice}>
              <CircleCheck size={24} color={colors.emeraldLight} />
              <View style={{ flex: 1 }}>
                <Text style={styles.completedTitle}>Sample Secured & Barcoded</Text>
                <Text style={styles.completedDesc}>
                  Specimen has been barcoded. Proceed to the Samples tab to handover to the central laboratory.
                </Text>
              </View>
            </View>
          )}

          {/* Exceptional Cancellation Action */}
          {!['Sample_Collected', 'Completed'].includes(currentAppt.status) && (
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => setRejectModalVisible(true)}
              activeOpacity={0.7}
            >
              <TriangleAlert size={15} color={colors.roseLight} />
              <Text style={styles.rejectBtnText}>Report No-Show / Cancel Collection</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* OTP Verification Modal */}
      <OTPModal
        visible={otpModalVisible}
        onClose={() => setOtpModalVisible(false)}
        onVerify={handleVerifyOTP}
        patientName={patientName}
        loading={actionLoading}
      />

      {/* Rejection / Issue Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancel Sample Collection</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Please select the clinical/operational reason for non-collection.
            </Text>

            {/* Reasons Picker */}
            {[
              { id: 'Patient_No_Show', label: 'Patient Absent / Unreachable' },
              { id: 'Patient_Refused', label: 'Patient Refused Collection' },
              { id: 'Fasting_Violated', label: 'Fasting Requirements Not Met' },
              { id: 'Wrong_Address', label: 'Address Incorrect / Inaccessible' },
            ].map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[
                  styles.reasonOption,
                  rejectReason === r.id && styles.reasonOptionActive,
                ]}
                onPress={() => setRejectReason(r.id)}
              >
                <Text
                  style={[
                    styles.reasonOptionText,
                    rejectReason === r.id && styles.reasonOptionTextActive,
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}

            <TextInput
              style={styles.notesInput}
              placeholder="Additional clinical notes (optional)"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              value={rejectNotes}
              onChangeText={setRejectNotes}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmReject}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm Cancellation</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Patient Health Baseline Modal */}
      <PatientBaselineModal
        visible={baselineModalVisible}
        onClose={() => setBaselineModalVisible(false)}
        patientName={patientName}
        vitals={baselineData?.vitals || user?.vitals || baselineData}
        loading={baselineLoading}
      />

      {/* Ops Dispatch Helpline & Emergency Modal */}
      <OpsHelplineModal
        visible={helplineModalVisible}
        onClose={() => setHelplineModalVisible(false)}
        appointmentId={currentAppt._id}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  phoneText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  callCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  timeBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textCyan,
  },
  cardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  fullAddressText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
  },
  navigateBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  testDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryLight,
    marginTop: 5,
    marginRight: 10,
  },
  testItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  testItemDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  fastingNote: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.amberLight,
    marginTop: 4,
  },
  noTestsText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  workflowBox: {
    marginTop: 8,
  },
  workflowHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginBottom: 12,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 16,
    marginBottom: 12,
  },
  primaryActionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  completedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.emeraldLight,
  },
  completedDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  rejectBtnText: {
    color: colors.roseLight,
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: colors.roseLight,
    padding: 20,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  reasonOption: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(12, 12, 12, 0.6)',
    marginBottom: 8,
  },
  reasonOptionActive: {
    borderColor: colors.rose,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  reasonOptionText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  reasonOptionTextActive: {
    color: colors.roseLight,
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: 'rgba(12, 12, 12, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    color: colors.textPrimary,
    padding: 12,
    marginTop: 8,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 2,
    backgroundColor: colors.rose,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  quickActionStrip: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.bgCardElevated,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  quickActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  packageComponentsBox: {
    backgroundColor: 'rgba(12, 12, 12, 0.7)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
    marginTop: 10,
    gap: 8,
  },
  packageComponentsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.cyanLight,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  componentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  componentEmoji: {
    fontSize: 14,
  },
  componentText: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  assignedDoctorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    alignSelf: 'flex-start',
  },
  assignedDoctorText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.cyanLight,
  },
});

export default AppointmentDetailScreen;
