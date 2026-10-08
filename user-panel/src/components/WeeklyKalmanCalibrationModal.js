import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  X,
  RotateCcw,
  Sparkles,
  Activity,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Zap,
} from 'lucide-react-native';
import userApi from '../api/userApi';
import { useAuthStore } from '../store/authStore';

export const WeeklyKalmanCalibrationModal = ({ visible, onClose, onSuccess }) => {
  const { latestVitals, fetchVitals } = useAuthStore();

  const prevMetabolic = latestVitals?.metabolicHealth || {};
  const prevCardio = latestVitals?.cardiovascularRisk || {};
  const prevKalman = latestVitals?.kalmanCalibration || {};

  const [fastingGlucose, setFastingGlucose] = useState(
    prevMetabolic.glucoseFasting ? String(prevMetabolic.glucoseFasting) : '92'
  );
  const [hba1c, setHba1c] = useState(
    prevMetabolic.hba1c ? String(prevMetabolic.hba1c) : '5.4'
  );
  const [systolic, setSystolic] = useState(
    prevCardio.systolic ? String(prevCardio.systolic) : '120'
  );
  const [diastolic, setDiastolic] = useState(
    prevCardio.diastolic ? String(prevCardio.diastolic) : '80'
  );
  const [notes, setNotes] = useState('Routine weekly clinical lab test');

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationResult, setCalibrationResult] = useState(null);

  const handleRunCalibration = async () => {
    const g0 = parseFloat(fastingGlucose);
    const a1c = parseFloat(hba1c);
    const sbp = parseFloat(systolic);
    const dbp = parseFloat(diastolic);

    if (isNaN(g0) || isNaN(a1c) || isNaN(sbp) || isNaN(dbp)) {
      Alert.alert('Invalid Biomarkers', 'Please enter valid numerical values for all lab metrics.');
      return;
    }

    try {
      setIsCalibrating(true);
      const res = await userApi.calibrateWeeklyVitals({
        newTestVitals: {
          glucoseFasting: g0,
          hba1c: a1c,
          systolic: sbp,
          diastolic: dbp,
        },
        notes,
        source: 'Weekly_Lab',
      });

      if (res?.success && res.calibration) {
        setCalibrationResult(res.calibration);
        await fetchVitals();
        if (onSuccess) onSuccess(res.calibration);
      } else {
        Alert.alert('Notice', res?.message || 'Calibration completed.');
      }
    } catch (err) {
      Alert.alert('Calibration Error', err?.response?.data?.message || err?.message || 'Unable to run Kalman calibration.');
    } finally {
      setIsCalibrating(false);
    }
  };

  const handleClose = () => {
    setCalibrationResult(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.headerIconCircle}>
                <RotateCcw size={18} color="#06b6d4" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Adaptive Kalman Calibration</Text>
                <Text style={styles.headerSubtitle}>Weekly Recursive Twin Sensitivity Update (EKF)</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {!calibrationResult ? (
              <>
                {/* Active Digital Twin Vector Preview */}
                <View style={styles.twinVectorCard}>
                  <Text style={styles.twinVectorTitle}>CURRENT PERSONAL TWIN VECTOR (M_user)</Text>
                  <View style={styles.vectorRow}>
                    <View style={styles.vectorItem}>
                      <Text style={styles.vectorLabel}>β_carb (Glycemic)</Text>
                      <Text style={styles.vectorValue}>
                        {prevKalman.betaCarb ? prevKalman.betaCarb.toFixed(3) : '0.280'}
                      </Text>
                      <Text style={styles.vectorSub}>mg/dL per g carb</Text>
                    </View>
                    <View style={styles.vectorDivider} />
                    <View style={styles.vectorItem}>
                      <Text style={styles.vectorLabel}>β_sodium (BP)</Text>
                      <Text style={styles.vectorValue}>
                        {prevKalman.betaSodium ? prevKalman.betaSodium.toFixed(4) : '0.0070'}
                      </Text>
                      <Text style={styles.vectorSub}>mmHg per mg Na</Text>
                    </View>
                    <View style={styles.vectorDivider} />
                    <View style={styles.vectorItem}>
                      <Text style={styles.vectorLabel}>S_I (Insulin Sens.)</Text>
                      <Text style={styles.vectorValue}>
                        {prevKalman.insulinSensitivity ? prevKalman.insulinSensitivity.toFixed(3) : '0.720'}
                      </Text>
                      <Text style={styles.vectorSub}>Index [0.2 - 1.2]</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.sectionHeading}>INPUT NEW WEEKLY BLOOD TEST BIOMARKERS</Text>

                {/* Form Fields */}
                <View style={styles.inputGrid}>
                  <View style={styles.inputField}>
                    <Text style={styles.inputLabel}>FASTING GLUCOSE (mg/dL)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={fastingGlucose}
                      onChangeText={setFastingGlucose}
                      keyboardType="numeric"
                      placeholder="92"
                      placeholderTextColor="#64748b"
                    />
                  </View>

                  <View style={styles.inputField}>
                    <Text style={styles.inputLabel}>HBA1C (%)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={hba1c}
                      onChangeText={setHba1c}
                      keyboardType="numeric"
                      placeholder="5.4"
                      placeholderTextColor="#64748b"
                    />
                  </View>

                  <View style={styles.inputField}>
                    <Text style={styles.inputLabel}>SYSTOLIC BP (mmHg)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={systolic}
                      onChangeText={setSystolic}
                      keyboardType="numeric"
                      placeholder="120"
                      placeholderTextColor="#64748b"
                    />
                  </View>

                  <View style={styles.inputField}>
                    <Text style={styles.inputLabel}>DIASTOLIC BP (mmHg)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={diastolic}
                      onChangeText={setDiastolic}
                      keyboardType="numeric"
                      placeholder="80"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                </View>

                <View style={[styles.inputField, { marginTop: 10 }]}>
                  <Text style={styles.inputLabel}>CLINICAL CONTEXT / LAB NOTES</Text>
                  <TextInput
                    style={[styles.textInput, { height: 42 }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="e.g. Completed 7 days of prebiotic sequencing"
                    placeholderTextColor="#64748b"
                  />
                </View>

                {/* Trigger Button */}
                <TouchableOpacity
                  style={[styles.calibrateActionBtn, isCalibrating && { opacity: 0.7 }]}
                  onPress={handleRunCalibration}
                  disabled={isCalibrating}
                  activeOpacity={0.85}
                >
                  {isCalibrating ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <>
                      <Sparkles size={16} color="#000000" />
                      <Text style={styles.calibrateActionBtnText}>EXECUTE EXTENDED KALMAN FILTER (EKF)</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              /* CALIBRATION RESULTS VIEW */
              <View style={styles.resultContainer}>
                <View style={styles.successBadge}>
                  <CheckCircle2 size={18} color="#10b981" />
                  <Text style={styles.successBadgeText}>ADAPTIVE CALIBRATION COMPLETED</Text>
                </View>

                {/* Parameter Shifts Strip */}
                <Text style={styles.sectionHeading}>METABOLIC PARAMETER SHIFTS</Text>
                <View style={styles.shiftsGrid}>
                  <View style={styles.shiftCard}>
                    <Text style={styles.shiftName}>β_carb Multiplier</Text>
                    <Text style={styles.shiftNewVal}>
                      {calibrationResult.calibratedParameters?.betaCarb}
                    </Text>
                    <View style={styles.shiftDeltaRow}>
                      {calibrationResult.parameterShiftsPercent?.betaCarbShift <= 0 ? (
                        <TrendingDown size={12} color="#10b981" />
                      ) : (
                        <TrendingUp size={12} color="#f59e0b" />
                      )}
                      <Text
                        style={[
                          styles.shiftDeltaText,
                          {
                            color:
                              calibrationResult.parameterShiftsPercent?.betaCarbShift <= 0
                                ? '#10b981'
                                : '#f59e0b',
                          },
                        ]}
                      >
                        {calibrationResult.parameterShiftsPercent?.betaCarbShift >= 0 ? '+' : ''}
                        {calibrationResult.parameterShiftsPercent?.betaCarbShift}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.shiftCard}>
                    <Text style={styles.shiftName}>β_sodium Multiplier</Text>
                    <Text style={styles.shiftNewVal}>
                      {calibrationResult.calibratedParameters?.betaSodium}
                    </Text>
                    <View style={styles.shiftDeltaRow}>
                      {calibrationResult.parameterShiftsPercent?.betaSodiumShift <= 0 ? (
                        <TrendingDown size={12} color="#10b981" />
                      ) : (
                        <TrendingUp size={12} color="#f59e0b" />
                      )}
                      <Text
                        style={[
                          styles.shiftDeltaText,
                          {
                            color:
                              calibrationResult.parameterShiftsPercent?.betaSodiumShift <= 0
                                ? '#10b981'
                                : '#f59e0b',
                          },
                        ]}
                      >
                        {calibrationResult.parameterShiftsPercent?.betaSodiumShift >= 0 ? '+' : ''}
                        {calibrationResult.parameterShiftsPercent?.betaSodiumShift}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.shiftCard}>
                    <Text style={styles.shiftName}>Insulin Sensitivity (S_I)</Text>
                    <Text style={styles.shiftNewVal}>
                      {calibrationResult.calibratedParameters?.insulinSensitivity}
                    </Text>
                    <View style={styles.shiftDeltaRow}>
                      {calibrationResult.parameterShiftsPercent?.insulinSensitivityShift >= 0 ? (
                        <TrendingUp size={12} color="#10b981" />
                      ) : (
                        <TrendingDown size={12} color="#f59e0b" />
                      )}
                      <Text
                        style={[
                          styles.shiftDeltaText,
                          {
                            color:
                              calibrationResult.parameterShiftsPercent?.insulinSensitivityShift >= 0
                                ? '#10b981'
                                : '#f59e0b',
                          },
                        ]}
                      >
                        {calibrationResult.parameterShiftsPercent?.insulinSensitivityShift >= 0 ? '+' : ''}
                        {calibrationResult.parameterShiftsPercent?.insulinSensitivityShift}%
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Clinical Adaptation Report */}
                <View style={styles.reportBox}>
                  <Text style={styles.reportSummary}>
                    {calibrationResult.clinicalAdaptationReport?.summary}
                  </Text>
                  {calibrationResult.clinicalAdaptationReport?.insights?.map((ins, i) => (
                    <View key={i} style={styles.insightRow}>
                      <ChevronRight size={13} color="#06b6d4" style={{ marginTop: 2 }} />
                      <Text style={styles.insightText}>{ins}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.doneBtn} onPress={handleClose} activeOpacity={0.85}>
                  <Text style={styles.doneBtnText}>DONE & RETURN TO APP</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#051117',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    maxHeight: '90%',
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: 16,
  },
  twinVectorCard: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  twinVectorTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#06b6d4',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  vectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vectorItem: {
    flex: 1,
    alignItems: 'center',
  },
  vectorLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#94a3b8',
  },
  vectorValue: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  vectorSub: {
    fontSize: 7.5,
    color: '#64748b',
    marginTop: 1,
  },
  vectorDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  inputField: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  calibrateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#06b6d4',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 18,
  },
  calibrateActionBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  resultContainer: {
    paddingVertical: 6,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 14,
  },
  successBadgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#10b981',
  },
  shiftsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  shiftCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  shiftName: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#94a3b8',
    textAlign: 'center',
  },
  shiftNewVal: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#ffffff',
    marginVertical: 3,
  },
  shiftDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  shiftDeltaText: {
    fontSize: 9,
    fontWeight: '800',
  },
  reportBox: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  reportSummary: {
    fontSize: 11,
    lineHeight: 16,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 8,
  },
  insightRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  insightText: {
    fontSize: 10,
    lineHeight: 14,
    color: '#94a3b8',
    flex: 1,
  },
  doneBtn: {
    backgroundColor: '#06b6d4',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
});

export default WeeklyKalmanCalibrationModal;
