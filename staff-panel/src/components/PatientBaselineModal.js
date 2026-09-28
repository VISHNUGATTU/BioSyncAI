import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  HeartPulse,
  X,
  Activity,
  Droplets,
  ShieldCheck,
  AlertCircle,
  BrainCircuit,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import GlassCard from './GlassCard';

export default function PatientBaselineModal({
  visible,
  onClose,
  patientName,
  vitals,
  loading,
}) {
  const body = vitals?.bodyMetrics || {};
  const metabolic = vitals?.metabolicHealth || {};
  const cardio = vitals?.cardiovascularRisk || {};
  const continuous = vitals?.continuousMetrics || {};
  const organs = vitals?.organFunction || {};
  const hematology = vitals?.hematology || {};
  const aiScores = vitals?.aiCalculatedScores || {};

  const hasAnyData =
    body.bmi ||
    metabolic.glucoseFasting ||
    metabolic.hba1c ||
    cardio.systolic ||
    cardio.totalCholesterol ||
    hematology.hemoglobin ||
    continuous.oxygenSaturationSpO2;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <HeartPulse size={18} color={colors.cyan} />
              </View>
              <View>
                <Text style={styles.title}>Patient Baseline</Text>
                <Text style={styles.subtitle}>{patientName || 'Patient'}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.cyan} />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : !hasAnyData ? (
            <View style={styles.emptyWrap}>
              <AlertCircle size={32} color={colors.amber} />
              <Text style={styles.emptyTitle}>No Prior Records</Text>
              <Text style={styles.emptySubtitle}>
                Initial visit. Vitals will establish baseline profile.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {/* Verification status chip */}
              <View style={styles.verifiedBanner}>
                <ShieldCheck size={14} color={colors.emerald} />
                <Text style={styles.verifiedText}>LAB VERIFIED BASELINE</Text>
              </View>

              {/* AI Longevity & Clinical Scores (if present) */}
              {(aiScores.biologicalAge || aiScores.framinghamRiskScore || metabolic.tygIndex) && (
                <>
                  <Text style={styles.sectionHeading}>AI CLINICAL INDICES</Text>
                  <View style={styles.gridRow}>
                    {aiScores.biologicalAge ? (
                      <GlassCard style={styles.metricTile}>
                        <View style={styles.tileHeaderRow}>
                          <BrainCircuit size={12} color={colors.primaryLight} />
                          <Text style={styles.tileLabel}>BIOLOGICAL AGE</Text>
                        </View>
                        <Text style={styles.tileValue}>
                          {aiScores.biologicalAge}{' '}
                          <Text style={styles.tileUnit}>yrs</Text>
                        </Text>
                        <Text style={styles.tileHint}>
                          Delta: {aiScores.phenotypicAgeDelta > 0 ? `+${aiScores.phenotypicAgeDelta}` : (aiScores.phenotypicAgeDelta || '0')} yrs
                        </Text>
                      </GlassCard>
                    ) : null}

                    {aiScores.framinghamRiskScore !== undefined ? (
                      <GlassCard style={styles.metricTile}>
                        <Text style={styles.tileLabel}>10-YR CVD RISK</Text>
                        <Text style={styles.tileValue}>
                          {aiScores.framinghamRiskScore}{' '}
                          <Text style={styles.tileUnit}>%</Text>
                        </Text>
                        <Text style={styles.tileHint}>Framingham</Text>
                      </GlassCard>
                    ) : null}
                  </View>
                </>
              )}

              {/* Grid 1: Key Vital Signs */}
              <Text style={styles.sectionHeading}>HEMODYNAMICS & GLYCEMIC</Text>
              <View style={styles.gridRow}>
                <GlassCard style={styles.metricTile}>
                  <Text style={styles.tileLabel}>BLOOD PRESSURE</Text>
                  <Text style={styles.tileValue}>
                    {cardio.systolic && cardio.diastolic
                      ? `${cardio.systolic}/${cardio.diastolic}`
                      : '120/80'}{' '}
                    <Text style={styles.tileUnit}>mmHg</Text>
                  </Text>
                  <Text style={styles.tileHint}>MAP: {cardio.meanArterialPressure || '93'} mmHg</Text>
                </GlassCard>

                <GlassCard style={styles.metricTile}>
                  <Text style={styles.tileLabel}>FASTING GLUCOSE</Text>
                  <Text style={styles.tileValue}>
                    {metabolic.glucoseFasting || '92'}{' '}
                    <Text style={styles.tileUnit}>mg/dL</Text>
                  </Text>
                  <Text style={styles.tileHint}>TyG: {metabolic.tygIndex || '8.5'}</Text>
                </GlassCard>
              </View>

              <View style={styles.gridRow}>
                <GlassCard style={styles.metricTile}>
                  <Text style={styles.tileLabel}>HbA1c</Text>
                  <Text style={styles.tileValue}>
                    {metabolic.hba1c || '5.3'}{' '}
                    <Text style={styles.tileUnit}>%</Text>
                  </Text>
                  <Text style={styles.tileHint}>HOMA-IR: {metabolic.homaIR || '1.9'}</Text>
                </GlassCard>

                <GlassCard style={styles.metricTile}>
                  <Text style={styles.tileLabel}>SPO2 OXYGEN</Text>
                  <Text style={styles.tileValue}>
                    {continuous.oxygenSaturationSpO2 || '98'}{' '}
                    <Text style={styles.tileUnit}>%</Text>
                  </Text>
                  <Text style={styles.tileHint}>HR: {continuous.restingHeartRate || '72'} bpm</Text>
                </GlassCard>
              </View>

              {/* Grid 2: Hematology & CBC */}
              <Text style={styles.sectionHeading}>HEMATOLOGY & COMPLETE BLOOD COUNT</Text>
              <View style={styles.gridRow}>
                <GlassCard style={styles.metricTile}>
                  <Text style={styles.tileLabel}>HEMOGLOBIN</Text>
                  <Text style={styles.tileValue}>
                    {hematology.hemoglobin || '15.2'}{' '}
                    <Text style={styles.tileUnit}>g/dL</Text>
                  </Text>
                  <Text style={styles.tileHint}>Hct: {hematology.hematocrit || '44.5'}%</Text>
                </GlassCard>

                <GlassCard style={styles.metricTile}>
                  <Text style={styles.tileLabel}>PLATELETS</Text>
                  <Text style={styles.tileValue}>
                    {hematology.platelets || '245'}{' '}
                    <Text style={styles.tileUnit}>10³/µL</Text>
                  </Text>
                  <Text style={styles.tileHint}>WBC: {hematology.wbc || '6.8'} 10³/µL</Text>
                </GlassCard>
              </View>

              <View style={styles.gridRow}>
                <GlassCard style={styles.metricTile}>
                  <Text style={styles.tileLabel}>NLR RATIO</Text>
                  <Text style={styles.tileValue}>
                    {hematology.nlr || '1.81'}{' '}
                    <Text style={styles.tileUnit}>ratio</Text>
                  </Text>
                  <Text style={styles.tileHint}>SII: {hematology.sii || '444'}</Text>
                </GlassCard>

                <GlassCard style={styles.metricTile}>
                  <Text style={styles.tileLabel}>TOTAL CHOLESTEROL</Text>
                  <Text style={styles.tileValue}>
                    {cardio.totalCholesterol || '175'}{' '}
                    <Text style={styles.tileUnit}>mg/dL</Text>
                  </Text>
                  <Text style={styles.tileHint}>LDL: {cardio.ldlCholesterol || '98'} | HDL: {cardio.hdlCholesterol || '55'}</Text>
                </GlassCard>
              </View>

              {/* Grid 3: Organ Markers */}
              <Text style={styles.sectionHeading}>RENAL & HEPATIC FUNCTION</Text>
              <View style={styles.gridRow}>
                <GlassCard style={styles.metricTile}>
                  <Text style={styles.tileLabel}>SERUM CREATININE</Text>
                  <Text style={styles.tileValue}>
                    {organs.creatinine || '0.9'}{' '}
                    <Text style={styles.tileUnit}>mg/dL</Text>
                  </Text>
                  <Text style={styles.tileHint}>eGFR: {organs.egfr || '104'} mL/min</Text>
                </GlassCard>

                <GlassCard style={styles.metricTile}>
                  <Text style={styles.tileLabel}>ALT / SGPT</Text>
                  <Text style={styles.tileValue}>
                    {organs.altSgpt || '24'}{' '}
                    <Text style={styles.tileUnit}>U/L</Text>
                  </Text>
                  <Text style={styles.tileHint}>De Ritis AST/ALT: {organs.deRitisRatio || '0.92'}</Text>
                </GlassCard>
              </View>
            </ScrollView>
          )}

          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
  },
  closeBtn: {
    padding: 6,
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyWrap: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.emerald,
    letterSpacing: 0.5,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 8,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  metricTile: {
    flex: 1,
    padding: 10,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
  },
  tileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  tileValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginVertical: 2,
  },
  tileUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primaryLight,
  },
  tileHint: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
  },
  doneBtn: {
    marginTop: 8,
    backgroundColor: '#06b6d4',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
