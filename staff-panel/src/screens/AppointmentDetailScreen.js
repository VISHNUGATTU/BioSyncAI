import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Phone,
  Navigation,
  MapPin,
  Clock,
  FlaskConical,
  TriangleAlert,
  CircleCheck,
  KeyRound,
  ChevronRight,
  HeartPulse,
  Headset,
  Stethoscope,
  Building2,
  AlertOctagon,
} from 'lucide-react-native';

import { colors, useTheme } from '../theme/colors';
import useAppointmentStore from '../store/appointmentStore';

import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import OTPModal from '../components/OTPModal';
import SpecimenTubeGuide from '../components/SpecimenTubeGuide';
import PatientBaselineModal from '../components/PatientBaselineModal';
import OpsHelplineModal from '../components/OpsHelplineModal';
import ClinicalExceptionModal from '../components/ClinicalExceptionModal';
import LifecycleStateMachine from '../components/LifecycleStateMachine';

import staffApi from '../api/staffApi';
import locationService from '../services/locationService';
import mapNavigationService from '../services/mapNavigationService';

export const AppointmentDetailScreen = ({
  route,
  navigation,
}) => {
  const { isDark } = useTheme();
  const { appointment } = route.params || {};

  const {
    updateStatus,
    rejectAppointment,
  } = useAppointmentStore();

  const [currentAppt, setCurrentAppt] =
    useState(appointment);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [otpModalVisible, setOtpModalVisible] =
    useState(false);

  const [rejectModalVisible, setRejectModalVisible] =
    useState(false);

  const [rejectReason, setRejectReason] =
    useState('Patient_No_Show');

  const [rejectNotes, setRejectNotes] =
    useState('');

  const [baselineModalVisible, setBaselineModalVisible] =
    useState(false);

  const [baselineLoading, setBaselineLoading] =
    useState(false);

  const [baselineData, setBaselineData] =
    useState(null);

  const [helplineModalVisible, setHelplineModalVisible] =
    useState(false);

  // ---------------------------------------------------------
  // Patient Baseline
  // ---------------------------------------------------------

  const handleOpenBaseline = async () => {
    setBaselineModalVisible(true);
    setBaselineLoading(true);

    try {
      const res =
        await staffApi.getAppointmentVitals(
          currentAppt._id
        );

      if (res?.success && res?.data) {
        setBaselineData(res.data);
      } else {
        setBaselineData(null);
      }
    } catch (err) {
      console.warn(
        'Baseline fetch warning:',
        err?.message || err
      );

      setBaselineData(null);
    } finally {
      setBaselineLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Safety check
  // ---------------------------------------------------------

  if (!currentAppt) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <TriangleAlert
            size={28}
            color={colors.roseLight}
          />

          <Text style={styles.errorText}>
            Appointment details not found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------
  // Patient information
  // ---------------------------------------------------------

  const user = currentAppt.user || {};

  const patientName = user.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Patient';

  const address =
    currentAppt.address ||
    user.address ||
    {};

  const addressText =
    typeof address === 'string'
      ? address
      : [
          address.houseNumber,
          address.street,
          address.landmark,
          address.city,
          address.pincode ||
            address.postalCode,
        ]
          .filter(Boolean)
          .join(', ') || 'Address on file';

  const rawTests =
    currentAppt.tests ||
    (currentAppt.testCatalog
      ? [currentAppt.testCatalog]
      : []);

  const tests = Array.isArray(rawTests)
    ? rawTests.filter(Boolean)
    : [];

  // ---------------------------------------------------------
  // Call patient
  // ---------------------------------------------------------

  const handleCall = () => {
    const phone =
      user.phoneNumber ||
      user.phone;

    if (!phone) {
      Alert.alert(
        'Phone Number Unavailable',
        'No patient phone number is available.'
      );
      return;
    }

    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert(
        'Unable to Call',
        'The phone application could not be opened.'
      );
    });
  };

  // ---------------------------------------------------------
  // Open Google Maps
  // ---------------------------------------------------------

  const handleOpenMaps = () => {
    mapNavigationService.openNavigation(address, address.coordinates, patientName);
  };

  const handleDropoffToLab = async () => {
    try {
      setActionLoading(true);
      const res = await staffApi.bulkLaboratoryDropoff([currentAppt._id]);
      if (res.success) {
        const updated = {
          ...currentAppt,
          status: 'At_Laboratory',
        };
        setCurrentAppt(updated);
        Alert.alert(
          'Laboratory Handover Confirmed',
          'Specimens delivered and marked At Laboratory. Processing is pending analysis by pathologist.'
        );
      } else {
        Alert.alert('Notice', res.message || 'Failed to update laboratory dropoff.');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Laboratory handover failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Step 1 — Start Route
  // ---------------------------------------------------------

  const handleStartTrip = async () => {
    try {
      setActionLoading(true);

      const res = await updateStatus(
        currentAppt._id,
        'On_The_Way'
      );

      if (res.success) {
        const updatedAppointment = {
          ...currentAppt,
          status: 'On_The_Way',
        };

        setCurrentAppt(updatedAppointment);

        await locationService.startTracking();

        Alert.alert(
          'Trip Started',
          'Trip initialized. Live GPS updates are now active.'
        );
      } else {
        Alert.alert(
          'Error',
          res.message ||
            'Failed to start trip.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error?.message ||
          'Failed to start trip.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Step 2 — Mark Arrived
  // ---------------------------------------------------------

  const handleMarkArrived = async () => {
    try {
      setActionLoading(true);

      const res = await updateStatus(
        currentAppt._id,
        'Arrived'
      );

      if (res.success) {
        setCurrentAppt({
          ...currentAppt,
          status: 'Arrived',
        });

        Alert.alert(
          'Arrival Confirmed',
          'You have arrived. Verify the Collection OTP with the patient to begin.'
        );
      } else {
        Alert.alert(
          'Error',
          res.message ||
            'Failed to mark arrived.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error?.message ||
          'Failed to mark arrival.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Step 3 — Verify OTP
  // ---------------------------------------------------------

  const handleVerifyOTP = async (
    otpCode
  ) => {
    try {
      setActionLoading(true);

      const res = await updateStatus(
        currentAppt._id,
        'Collecting',
        otpCode
      );

      if (res.success) {
        setOtpModalVisible(false);

        const updatedAppointment = {
          ...currentAppt,
          status: 'Collecting',
        };

        setCurrentAppt(updatedAppointment);

        navigation.navigate(
          'ActiveCollection',
          {
            appointment:
              updatedAppointment,
          }
        );
      } else {
        Alert.alert(
          'OTP Verification Failed',
          res.message ||
            'Incorrect OTP code provided by the patient.'
        );
      }
    } catch (error) {
      Alert.alert(
        'OTP Verification Failed',
        error?.message ||
          'Unable to verify the OTP.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Step 4 — Continue Collection
  // ---------------------------------------------------------

  const handleProceedCollection = () => {
    navigation.navigate(
      'ActiveCollection',
      {
        appointment: currentAppt,
      }
    );
  };

  // ---------------------------------------------------------
  // Field Clinical Exception / Reject Handler
  // ---------------------------------------------------------

  const handleConfirmReject = async ({ reason, notes, exceptionType }) => {
    try {
      setActionLoading(true);

      const res = await rejectAppointment(
        currentAppt._id,
        reason,
        notes,
        exceptionType
      );

      if (res.success) {
        setRejectModalVisible(false);

        Alert.alert(
          'Exception Logged',
          `Collection exception (${reason}) recorded. Operational dispatch and patient notified.`
        );

        navigation.goBack();
      } else {
        Alert.alert(
          'Error',
          res.message || 'Failed to cancel appointment.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to cancel appointment.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.bgDark }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.navbar, { backgroundColor: colors.bgSurface, borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <ArrowLeft
            size={20}
            color={colors.textPrimary}
          />
        </TouchableOpacity>

        <View style={styles.navTitleWrap}>
          <Text style={styles.navTitle}>
            Servicing Task
          </Text>

          <Text style={styles.navSubtitle}>
            Appointment workflow
          </Text>
        </View>

        <StatusBadge
          status={currentAppt.status}
          size="small"
        />
      </View>

      <ScrollView
        style={{ backgroundColor: colors.bgDark }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* ------------------------------------------------ */}
        {/* Patient Profile */}
        {/* ------------------------------------------------ */}

        <GlassCard style={styles.card}>
          <View style={styles.patientRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(
                  user.firstName?.[0] ||
                  'P'
                ).toUpperCase()}
              </Text>
            </View>

            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>
                {patientName}
              </Text>

              <Text style={styles.phoneText}>
                {user.phoneNumber ||
                  user.phone ||
                  'Phone on file'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.callCircleBtn}
              onPress={handleCall}
              activeOpacity={0.8}
            >
              <Phone
                size={18}
                color="#ffffff"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.timeBanner}>
            <Clock
              size={15}
              color={colors.primaryLight}
            />

            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>
                Scheduled Collection
              </Text>

              <Text style={styles.timeBannerText}>
                {currentAppt.timeSlot ||
                  '09:00 - 10:00 AM'}
              </Text>
            </View>
          </View>

          {currentAppt.doctor && (
            <View
              style={styles.assignedDoctorPill}
            >
              <Stethoscope
                size={13}
                color={colors.cyan}
              />

              <Text
                style={styles.assignedDoctorText}
              >
                {currentAppt.doctor.name ||
                  'Assigned Pathologist'}
              </Text>
            </View>
          )}
        </GlassCard>

        {/* ------------------------------------------------ */}
        {/* 8-Stage Strict State Machine Lifecycle Stepper   */}
        {/* ------------------------------------------------ */}
        <LifecycleStateMachine
          status={currentAppt.status}
          appointmentId={currentAppt._id}
        />

        {/* ------------------------------------------------ */}
        {/* Quick Actions */}
        {/* ------------------------------------------------ */}

        <View style={styles.quickActionStrip}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={handleOpenBaseline}
            activeOpacity={0.8}
          >
            <HeartPulse
              size={15}
              color={colors.cyan}
            />

            <Text
              style={styles.quickActionBtnText}
            >
              Patient Baseline
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickActionBtn,
              styles.sosActionBtn,
            ]}
            onPress={() =>
              setHelplineModalVisible(true)
            }
            activeOpacity={0.8}
          >
            <Headset
              size={15}
              color={colors.roseLight}
            />

            <Text
              style={[
                styles.quickActionBtnText,
                styles.sosActionText,
              ]}
            >
              Ops Helpline / SOS
            </Text>
          </TouchableOpacity>
        </View>

        {/* ------------------------------------------------ */}
        {/* Collection Location */}
        {/* ------------------------------------------------ */}

        <GlassCard style={styles.card}>
          <View style={styles.cardSectionHeader}>
            <View style={styles.sectionIcon}>
              <MapPin
                size={16}
                color={colors.primaryLight}
              />
            </View>

            <Text
              style={styles.cardSectionTitle}
            >
              Collection Location
            </Text>
          </View>

          <Text
            style={styles.fullAddressText}
          >
            {addressText}
          </Text>

          <TouchableOpacity
            style={styles.navigateBtn}
            onPress={handleOpenMaps}
            activeOpacity={0.8}
          >
            <Navigation
              size={16}
              color="#ffffff"
            />

            <Text
              style={styles.navigateBtnText}
            >
              Open Google Maps Route
            </Text>
          </TouchableOpacity>
        </GlassCard>

        {/* ------------------------------------------------ */}
        {/* Diagnostic Package */}
        {/* ------------------------------------------------ */}

        <GlassCard style={styles.card}>
          <View style={styles.cardSectionHeader}>
            <View style={styles.sectionIcon}>
              <FlaskConical
                size={16}
                color={colors.primaryLight}
              />
            </View>

            <Text
              style={styles.cardSectionTitle}
            >
              Assigned Diagnostic Package
            </Text>
          </View>

          <View style={styles.testItem}>
            <View style={styles.testDot} />

            <View style={styles.testContent}>
              <Text
                style={styles.testItemTitle}
              >
                BioSync 360 Full Biomarker Diagnostic
              </Text>

              <Text
                style={styles.testItemDesc}
              >
                Category: Comprehensive Health & AI
                Prediction • Tri-Specimen Protocol
              </Text>

              <Text
                style={styles.fastingNote}
              >
                Requires 10-12 Hours Overnight Fasting
              </Text>
            </View>
          </View>

          <View
            style={styles.packageComponentsBox}
          >
            <Text
              style={styles.packageComponentsTitle}
            >
              INCLUDED COLLECTION PROTOCOLS
            </Text>

            <View
              style={styles.componentItemRow}
            >
              <View
                style={styles.componentIcon}
              >
                <Text style={styles.componentEmoji}>
                  📋
                </Text>
              </View>

              <Text
                style={styles.componentText}
              >
                Clinical Intake: Physical Vitals &
                Medical Properties Questionnaire
              </Text>
            </View>

            <View
              style={styles.componentItemRow}
            >
              <View
                style={styles.componentIcon}
              >
                <Text style={styles.componentEmoji}>
                  🩸
                </Text>
              </View>

              <Text
                style={styles.componentText}
              >
                Venous Blood Draw: EDTA, Serum
                Separator, Fluoride tubes (3 vials)
              </Text>
            </View>

            <View
              style={styles.componentItemRow}
            >
              <View
                style={styles.componentIcon}
              >
                <Text style={styles.componentEmoji}>
                  🟡
                </Text>
              </View>

              <Text
                style={styles.componentText}
              >
                Midstream Urine Specimen: 50ml
                sterile container
              </Text>
            </View>

            <View
              style={styles.componentItemRow}
            >
              <View
                style={styles.componentIcon}
              >
                <Text style={styles.componentEmoji}>
                  🟤
                </Text>
              </View>

              <Text
                style={styles.componentText}
              >
                Stool Specimen: Sterile container
                in biohazard transport pouch
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* ------------------------------------------------ */}
        {/* Specimen Guide */}
        {/* ------------------------------------------------ */}

        <SpecimenTubeGuide
          tests={tests}
          collapsible={true}
          initialExpanded={false}
        />

        {/* ------------------------------------------------ */}
        {/* Workflow Controls */}
        {/* ------------------------------------------------ */}

        <View style={styles.workflowBox}>
          <View
            style={styles.workflowHeaderRow}
          >
            <View>
              <Text
                style={styles.workflowHeaderTitle}
              >
                SERVICE WORKFLOW
              </Text>

              <Text
                style={styles.workflowSubtitle}
              >
                Follow the collection state sequence
              </Text>
            </View>

            <View
              style={styles.workflowIndicator}
            />
          </View>

          {/* Pending / Assigned */}
          {[
            'Assistant_Assigned',
            'Assigned',
            'Booked',
            'Pending',
          ].includes(currentAppt.status) && (
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={handleStartTrip}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Navigation
                    size={18}
                    color="#ffffff"
                  />

                  <Text
                    style={
                      styles.primaryActionBtnText
                    }
                  >
                    Start Trip (On The Way)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* On The Way */}
          {[
            'On_The_Way',
            'On_Route',
          ].includes(currentAppt.status) && (
            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                styles.arrivedActionBtn,
              ]}
              onPress={handleMarkArrived}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <CircleCheck
                    size={18}
                    color="#ffffff"
                  />

                  <Text
                    style={
                      styles.primaryActionBtnText
                    }
                  >
                    Mark Arrived at Patient Location
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Arrived */}
          {currentAppt.status === 'Arrived' && (
            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                styles.otpActionBtn,
              ]}
              onPress={() =>
                setOtpModalVisible(true)
              }
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <KeyRound
                    size={18}
                    color="#ffffff"
                  />

                  <Text
                    style={
                      styles.primaryActionBtnText
                    }
                  >
                    Verify OTP & Begin Sample Collection
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Collecting */}
          {currentAppt.status === 'Collecting' && (
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={handleProceedCollection}
              activeOpacity={0.8}
            >
              <FlaskConical
                size={18}
                color="#ffffff"
              />

              <Text
                style={
                  styles.primaryActionBtnText
                }
              >
                Record Sample Barcode & Vials
              </Text>

              <ChevronRight
                size={18}
                color="#ffffff"
              />
            </TouchableOpacity>
          )}

          {/* Stage 6: Sample Collected */}
          {currentAppt.status === 'Sample_Collected' && (
            <View>
              <View style={styles.completedNotice}>
                <View style={styles.completedIcon}>
                  <CircleCheck
                    size={22}
                    color={colors.emeraldLight}
                  />
                </View>

                <View style={styles.completedContent}>
                  <Text style={styles.completedTitle}>
                    Sample Secured & Barcoded
                  </Text>

                  <Text style={styles.completedDesc}>
                    Specimens are sealed and vitals captured. Handover to the central laboratory to log into the accession system.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryActionBtn, styles.labDropoffBtn]}
                onPress={handleDropoffToLab}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Building2
                      size={18}
                      color="#ffffff"
                    />

                    <Text style={styles.primaryActionBtnText}>
                      Handover Specimens to Central Laboratory
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={handleProceedCollection}
                activeOpacity={0.8}
              >
                <FlaskConical
                  size={16}
                  color={colors.textSecondary}
                />

                <Text style={styles.secondaryActionBtnText}>
                  Review / Amend Collection Data
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Stage 7: At Laboratory */}
          {['At_Laboratory', 'Processing'].includes(currentAppt.status) && (
            <View style={styles.completedNotice}>
              <View
                style={[
                  styles.completedIcon,
                  { backgroundColor: colors.indigoDark ? colors.indigoDark + '30' : '#6366F130' },
                ]}
              >
                <Building2
                  size={22}
                  color={colors.indigoLight || '#818CF8'}
                />
              </View>

              <View style={styles.completedContent}>
                <Text
                  style={[
                    styles.completedTitle,
                    { color: colors.indigoLight || '#818CF8' },
                  ]}
                >
                  Specimens at Central Laboratory
                </Text>

                <Text style={styles.completedDesc}>
                  Specimens have been received by the lab. Clinical pathologists are running biochemical and hematological assays.
                </Text>
              </View>
            </View>
          )}

          {/* Stage 8: Completed */}
          {['Completed', 'Report_Generated'].includes(currentAppt.status) && (
            <View style={styles.completedNotice}>
              <View style={styles.completedIcon}>
                <CircleCheck
                  size={22}
                  color={colors.emeraldLight}
                />
              </View>

              <View style={styles.completedContent}>
                <Text style={styles.completedTitle}>
                  Diagnostic Lifecycle Completed
                </Text>

                <Text style={styles.completedDesc}>
                  Laboratory analysis finished and diagnostic report generated. Results are published to patient health profile.
                </Text>
              </View>
            </View>
          )}

          {/* Cancellation (Guarded against past-collection transitions) */}
          {![
            'Sample_Collected',
            'At_Laboratory',
            'Processing',
            'Completed',
            'Report_Generated',
            'Cancelled',
            'Failed',
            'No_Show',
            'Rejected',
          ].includes(currentAppt.status) && (
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() =>
                setRejectModalVisible(true)
              }
              activeOpacity={0.7}
            >
              <AlertOctagon
                size={15}
                color={colors.roseLight}
              />

              <Text
                style={styles.rejectBtnText}
              >
                Report Clinical Exception / Non-Performance
              </Text>
            </TouchableOpacity>
          )}

          {/* Exception / Cancelled Notice Banner */}
          {['Cancelled', 'Failed', 'No_Show', 'Rejected'].includes(currentAppt.status) && (
            <View style={[styles.completedNotice, { borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
              <View style={[styles.completedIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <AlertOctagon
                  size={22}
                  color="#ef4444"
                />
              </View>

              <View style={styles.completedContent}>
                <Text style={[styles.completedTitle, { color: '#ef4444' }]}>
                  Collection Non-Performance / Exception
                </Text>

                <Text style={styles.completedDesc}>
                  {currentAppt.failureReason || currentAppt.cancellationReason || 'Collection halted due to clinical or logistical exception.'}
                  {currentAppt.failureNotes ? ` (${currentAppt.failureNotes})` : ''}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* -------------------------------------------------- */}
      {/* OTP Modal */}
      {/* -------------------------------------------------- */}

      <OTPModal
        visible={otpModalVisible}
        onClose={() =>
          setOtpModalVisible(false)
        }
        onVerify={handleVerifyOTP}
        patientName={patientName}
        loading={actionLoading}
      />

      {/* -------------------------------------------------- */}
      {/* Field Clinical Exception Modal */}
      {/* -------------------------------------------------- */}
      <ClinicalExceptionModal
        visible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        onSubmit={handleConfirmReject}
        loading={actionLoading}
        appointmentId={currentAppt?._id}
        patientName={patientName}
      />

      {/* -------------------------------------------------- */}
      {/* Patient Baseline */}
      {/* -------------------------------------------------- */}

      <PatientBaselineModal
        visible={baselineModalVisible}
        onClose={() =>
          setBaselineModalVisible(false)
        }
        patientName={patientName}
        vitals={
          baselineData?.vitals ||
          user?.vitals ||
          baselineData
        }
        loading={baselineLoading}
      />

      {/* -------------------------------------------------- */}
      {/* Operations Helpline */}
      {/* -------------------------------------------------- */}

      <OpsHelplineModal
        visible={helplineModalVisible}
        onClose={() =>
          setHelplineModalVisible(false)
        }
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
    minHeight: 64,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 16,
    paddingVertical: 10,

    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,

    backgroundColor: colors.bgSurface,
  },

  backBtn: {
    width: 40,
    height: 40,

    borderRadius: 13,

    backgroundColor: colors.glassStrong,

    borderWidth: 1,
    borderColor: colors.borderSubtle,

    alignItems: 'center',
    justifyContent: 'center',
  },

  navTitleWrap: {
    flex: 1,

    marginLeft: 12,
  },

  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  navSubtitle: {
    fontSize: 10,
    color: colors.textMuted,

    marginTop: 2,

    letterSpacing: 0.3,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  card: {
    marginBottom: 14,
  },

  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 14,
  },

  avatar: {
    width: 50,
    height: 50,

    borderRadius: 16,

    backgroundColor: colors.alpha?.cyan15 ||
      'rgba(6, 182, 212, 0.15)',

    borderWidth: 1,
    borderColor: colors.borderCyan,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 13,
  },

  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryLight,
  },

  patientInfo: {
    flex: 1,
  },

  patientName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  phoneText: {
    fontSize: 12,
    color: colors.textSecondary,

    marginTop: 3,
  },

  callCircleBtn: {
    width: 40,
    height: 40,

    borderRadius: 20,

    backgroundColor: colors.emerald,

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: colors.emerald,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,

    elevation: 4,
  },

  timeBanner: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: colors.alpha?.cyan08 ||
      'rgba(6, 182, 212, 0.08)',

    padding: 11,

    borderRadius: 12,

    borderWidth: 1,
    borderColor: colors.borderCyan,
  },

  timeInfo: {
    marginLeft: 8,
  },

  timeLabel: {
    fontSize: 9,
    fontWeight: '700',

    color: colors.textMuted,

    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  timeBannerText: {
    fontSize: 12,
    fontWeight: '700',

    color: colors.primaryLight,

    marginTop: 2,
  },

  assignedDoctorPill: {
    flexDirection: 'row',
    alignItems: 'center',

    alignSelf: 'flex-start',

    gap: 6,

    marginTop: 9,

    paddingVertical: 6,
    paddingHorizontal: 10,

    backgroundColor: colors.alpha?.cyan10 ||
      'rgba(6, 182, 212, 0.10)',

    borderRadius: 9,

    borderWidth: 1,
    borderColor: colors.borderCyan,
  },

  assignedDoctorText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.cyanLight,
  },

  quickActionStrip: {
    flexDirection: 'row',

    gap: 10,

    marginBottom: 14,
  },

  quickActionBtn: {
    flex: 1,

    minHeight: 44,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 7,

    backgroundColor: colors.bgCardElevated,

    paddingVertical: 10,
    paddingHorizontal: 8,

    borderRadius: 12,

    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  quickActionBtnText: {
    fontSize: 11,
    fontWeight: '700',

    color: colors.textSecondary,
  },

  sosActionBtn: {
    borderColor:
      colors.roseDark + '55',

    backgroundColor:
      colors.roseDark + '12',
  },

  sosActionText: {
    color: colors.roseLight,
  },

  cardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 11,
  },

  sectionIcon: {
    width: 30,
    height: 30,

    borderRadius: 9,

    backgroundColor:
      colors.alpha?.cyan10 ||
      'rgba(6, 182, 212, 0.10)',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 9,
  },

  cardSectionTitle: {
    flex: 1,

    fontSize: 14,
    fontWeight: '800',

    color: colors.textPrimary,
  },

  fullAddressText: {
    fontSize: 13,

    color: colors.textSecondary,

    lineHeight: 20,

    marginBottom: 14,
  },

  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,

    backgroundColor: colors.primary,

    paddingVertical: 13,

    borderRadius: 13,

    shadowColor: colors.cyan,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 7,

    elevation: 3,
  },

  navigateBtnText: {
    color: '#ffffff',

    fontSize: 13,
    fontWeight: '800',
  },

  testItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    backgroundColor: colors.glass,

    padding: 13,

    borderRadius: 13,

    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  testDot: {
    width: 8,
    height: 8,

    borderRadius: 4,

    backgroundColor: colors.primaryLight,

    marginTop: 5,
    marginRight: 10,
  },

  testContent: {
    flex: 1,
  },

  testItemTitle: {
    fontSize: 13,
    fontWeight: '800',

    color: colors.textPrimary,
  },

  testItemDesc: {
    fontSize: 11,

    color: colors.textSecondary,

    lineHeight: 16,

    marginTop: 3,
  },

  fastingNote: {
    fontSize: 10,
    fontWeight: '800',

    color: colors.amberLight,

    marginTop: 6,
  },

  packageComponentsBox: {
    backgroundColor:
      colors.bgSurface,

    borderRadius: 12,

    borderWidth: 1,
    borderColor: colors.borderSubtle,

    padding: 12,

    marginTop: 10,

    gap: 10,
  },

  packageComponentsTitle: {
    fontSize: 9,
    fontWeight: '900',

    color: colors.cyanLight,

    letterSpacing: 0.8,

    marginBottom: 2,
  },

  componentItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    gap: 9,
  },

  componentIcon: {
    width: 25,
    height: 25,

    borderRadius: 7,

    backgroundColor: colors.glassStrong,

    alignItems: 'center',
    justifyContent: 'center',
  },

  componentEmoji: {
    fontSize: 13,
  },

  componentText: {
    flex: 1,

    fontSize: 11,

    color: colors.textSecondary,

    lineHeight: 16,
  },

  workflowBox: {
    marginTop: 4,

    marginBottom: 8,
  },

  workflowHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 12,
  },

  workflowHeaderTitle: {
    fontSize: 10,
    fontWeight: '900',

    letterSpacing: 1.4,

    color: colors.textMuted,
  },

  workflowSubtitle: {
    fontSize: 10,

    color: colors.textMuted,

    marginTop: 3,
  },

  workflowIndicator: {
    width: 8,
    height: 8,

    borderRadius: 4,

    backgroundColor: colors.cyan,

    shadowColor: colors.cyan,
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },

  primaryActionBtn: {
    minHeight: 52,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,

    backgroundColor: colors.primary,

    paddingVertical: 14,
    paddingHorizontal: 16,

    borderRadius: 15,

    marginBottom: 10,

    shadowColor: colors.cyan,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,

    elevation: 3,
  },

  arrivedActionBtn: {
    backgroundColor: colors.emerald,
  },

  otpActionBtn: {
    backgroundColor: colors.purple,
  },

  labDropoffBtn: {
    backgroundColor: colors.indigo || '#6366F1',
    shadowColor: colors.indigo || '#6366F1',
  },

  secondaryActionBtn: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.glassStrong || 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
  },

  secondaryActionBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },

  primaryActionBtnText: {
    flex: 1,

    color: '#ffffff',

    fontSize: 13,
    fontWeight: '800',

    textAlign: 'center',

    letterSpacing: 0.15,
  },

  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor:
      colors.emeraldDark + '18',

    borderWidth: 1,
    borderColor:
      colors.emeraldDark + '55',

    padding: 14,

    borderRadius: 15,

    marginBottom: 10,
  },

  completedIcon: {
    width: 38,
    height: 38,

    borderRadius: 12,

    backgroundColor:
      colors.emeraldDark + '20',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 11,
  },

  completedContent: {
    flex: 1,
  },

  completedTitle: {
    fontSize: 13,
    fontWeight: '800',

    color: colors.emeraldLight,
  },

  completedDesc: {
    fontSize: 11,

    color: colors.textSecondary,

    marginTop: 3,

    lineHeight: 16,
  },

  rejectBtn: {
    minHeight: 40,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 7,

    paddingVertical: 10,

    borderRadius: 12,

    borderWidth: 1,
    borderColor: colors.roseDark + '30',

    backgroundColor: colors.roseDark + '08',
  },

  rejectBtnText: {
    color: colors.roseLight,

    fontSize: 11,
    fontWeight: '700',
  },

  errorContainer: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    padding: 24,

    gap: 12,
  },

  errorText: {
    color: colors.roseLight,

    fontSize: 13,
    fontWeight: '600',

    textAlign: 'center',
  },

  modalOverlay: {
    flex: 1,

    backgroundColor: colors.overlayStrong,

    justifyContent: 'center',

    padding: 18,
  },

  modalContent: {
    backgroundColor: colors.bgCard,

    borderRadius: 24,

    borderWidth: 1,
    borderColor: colors.borderStrong,

    padding: 20,

    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.45,
    shadowRadius: 24,

    elevation: 15,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',

    marginBottom: 10,
  },

  modalTitleWrap: {
    flex: 1,

    marginRight: 12,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '800',

    color: colors.textPrimary,
  },

  modalEyebrow: {
    fontSize: 9,
    fontWeight: '800',

    color: colors.roseLight,

    letterSpacing: 1,

    marginTop: 4,
  },

  modalCloseBtn: {
    width: 34,
    height: 34,

    borderRadius: 10,

    backgroundColor: colors.glassStrong,

    alignItems: 'center',
    justifyContent: 'center',
  },

  modalSubtitle: {
    fontSize: 12,

    color: colors.textSecondary,

    lineHeight: 18,

    marginBottom: 15,
  },

  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',

    padding: 12,

    borderRadius: 12,

    borderWidth: 1,
    borderColor: colors.borderSubtle,

    backgroundColor: colors.bgSurface,

    marginBottom: 8,
  },

  reasonOptionActive: {
    borderColor: colors.roseDark + '90',

    backgroundColor:
      colors.roseDark + '12',
  },

  reasonRadio: {
    width: 18,
    height: 18,

    borderRadius: 9,

    borderWidth: 1.5,
    borderColor: colors.textMuted,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,
  },

  reasonRadioActive: {
    borderColor: colors.roseLight,
  },

  reasonRadioDot: {
    width: 8,
    height: 8,

    borderRadius: 4,

    backgroundColor: colors.roseLight,
  },

  reasonOptionText: {
    flex: 1,

    fontSize: 12,

    color: colors.textSecondary,
  },

  reasonOptionTextActive: {
    color: colors.roseLight,

    fontWeight: '700',
  },

  notesInput: {
    minHeight: 90,

    backgroundColor: colors.bgSurface,

    borderWidth: 1,
    borderColor: colors.borderSubtle,

    borderRadius: 12,

    color: colors.textPrimary,

    padding: 12,

    marginTop: 6,
    marginBottom: 18,

    textAlignVertical: 'top',

    fontSize: 12,
  },

  modalActionRow: {
    flexDirection: 'row',

    gap: 10,
  },

  modalCancelBtn: {
    flex: 1,

    paddingVertical: 13,

    borderRadius: 12,

    borderWidth: 1,
    borderColor: colors.borderDefault,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.glass,
  },

  modalCancelText: {
    color: colors.textSecondary,

    fontSize: 13,
    fontWeight: '700',
  },

  modalConfirmBtn: {
    flex: 2,

    backgroundColor: colors.rose,

    paddingVertical: 13,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',
  },

  modalConfirmText: {
    color: '#ffffff',

    fontSize: 13,
    fontWeight: '800',
  },
});

export default AppointmentDetailScreen;