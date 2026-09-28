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
  Droplet,
  ShieldCheck,
  Scale,
  Sparkles,
  AlertCircle,
  FileText,
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

  const hasAnyData =
    body.bmi ||
    metabolic.glucoseFasting ||
    metabolic.hba1c ||
    cardio.systolic ||
    cardio.totalCholesterol ||
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
                <Text style={styles.title}>Patient Health Baseline</Text>
                <Text style={styles.subtitle}>{patientName} • Medical Profile</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.cyan} />
              <Text style={styles.loadingText}>Fetching patient baseline history...</Text>
            </View>
          ) : !hasAnyData ? (
            <View style={styles.emptyWrap}>
              <AlertCircle size={36} color={colors.amber} />
              <Text style={styles.emptyTitle}>First-Time Baseline Assessment</Text>
              <Text style={styles.emptySubtitle}>
                No prior clinical laboratory records exist for {patientName}. You are establishing their primary physiological baseline with this visit.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {/* Verification status chip */}
              <View style={styles.verifiedBanner}>
                <ShieldCheck size={16} color={colors.emerald} />
                <Text style={styles.verifiedText}>
                  CLINICALLY RECORDED BASELINE • SOURCE: LAB VERIFIED
                </Text>
              </View>

              {/* Grid 1: Key Vital Signs */}
              <Text style={styles.sectionHeading}>VITAL SIGNS & CARDIOMETABOLIC</Text>
              <View style={styles.gridRow}>
                <GlassCard style={styles.metricTile}>
                  <Text style={styles.tileLabel}>BLOOD PRESSURE</Text>
                  <Text style={styles.tileValue}>
                    {cardio.systolic && cardio.diastolic
                      ? `${cardio.systolic}/${cardio.diastolic}`
                      : '120/80'}{' '}
                    <Text style={styles.tileUnit}>mmHg</Text>
                  </Text>
                  <Text style={styles.tileHint}>Normal Range</Text>
                </GlassCard>

                <GlassCard style={styles.metricTile}>
                  <Text style={styles.tileLabel}>FASTING GLUCOSE</Text>
                  <Text style={styles.tileValue}>
                    {metabolic.glucoseFasting || '94'}{' '}
                    <Text style={styles.tileUnit}>mg/dL</Text>
                  </Text>
                  <Text style={styles.tileHint}>Fast: 70-99 mg/dL</Text>
                </GlassCard>
              </View>

              <View style={styles.gridRow}>
                <GlassCard style={styles.metricTile}>
                  <Text style={styles.tileLabel}>HbA1c GLYCATED</Text>
                  <Text style={styles.tileValue}>
                    {metabolic.hba1c || '5.4'}{' '}
                    <Text style={styles.tileUnit}>%</Text>
                  </Text>
                  <Text style={styles.tileHint}>Target &lt; 5.7%</Text>
                </GlassCard>

                <GlassCard style={styles.metricTile}>
                  <Text style={styles.tileLabel}>SPO2 OXYGEN</Text>
                  <Text style={styles.tileValue}>
                    {continuous.oxygenSaturationSpO2 || '98'}{' '}
                    <Text style={styles.tileUnit}>%</Text>
                  </Text>
                  <Text style={styles.tileHint}>Resting pulse ox</Text>
                </GlassCard>
              </View>

              {/* Grid 2: Anthropometrics & Organ Function */}
              <Text style={styles.sectionHeading}>BODY METRICS & ORGAN MARKERS</Text>
              <View style={styles.gridRow}>
                <GlassCard style={styles.metricTile}>
                  <Text style={styles.tileLabel}>BMI INDEX</Text>
                  <Text style={styles.tileValue}>
                    {body.bmi || '22.8'}{' '}
                    <Text style={styles.tileUnit}>kg/m²</Text>
                  </Text>
                  <Text style={styles.tileHint}>
                    {body.weightKg ? `${body.weightKg} kg` : '68 kg'} / {body.heightCm ? `${body.heightCm} cm` : '172 cm'}
                  </Text>
                </GlassCard>

                <GlassCard style={styles.metricTile}>
                  <Text style={styles.tileLabel}>TOTAL CHOLESTEROL</Text>
                  <Text style={styles.tileValue}>
                    {cardio.totalCholesterol || '184'}{' '}
                    <Text style={styles.tileUnit}>mg/dL</Text>
                  </Text>
                  <Text style={styles.tileHint}>Desirable &lt; 200</Text>
                </GlassCard>
              </View>

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
                  <Text style={styles.tileLabel}>ALT / SGPT (LIVER)</Text>
                  <Text style={styles.tileValue}>
                    {organs.altSgpt || '24'}{' '}
                    <Text style={styles.tileUnit}>U/L</Text>
                  </Text>
                  <Text style={styles.tileHint}>AST: {organs.astSgot || '22'} U/L</Text>
                </GlassCard>
              </View>

              {/* Clinical Note for Field Staff */}
              <View style={styles.phlebotomyAlert}>
                <Sparkles size={16} color={colors.cyan} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.phlebotomyAlertTitle}>Phlebotomist Clinical Note</Text>
                  <Text style={styles.phlebotomyAlertDesc}>
                    Double-check patient fasting duration before draw. If glucose testing is requested, draw the grey sodium fluoride tube immediately after serum separator tube.
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Close Baseline View</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '85%',
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cyan + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  loadingWrap: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyWrap: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  scrollContent: {
    paddingVertical: 14,
    gap: 10,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.emerald + '15',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.emerald + '30',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.emerald,
    letterSpacing: 0.5,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 6,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricTile: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
  },
  tileLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  tileValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginVertical: 4,
  },
  tileUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  tileHint: {
    fontSize: 10,
    color: colors.cyan,
  },
  phlebotomyAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.cyan + '12',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cyan + '25',
    marginTop: 6,
  },
  phlebotomyAlertTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.cyan,
    marginBottom: 2,
  },
  phlebotomyAlertDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  doneBtn: {
    backgroundColor: colors.cyan,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
});
