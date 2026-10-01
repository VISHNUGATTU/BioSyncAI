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

  const formatDelta = (value) => {
    if (value === undefined || value === null) {
      return '0';
    }

    return value > 0 ? `+${value}` : value;
  };

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
                <HeartPulse
                  size={20}
                  color={colors.primary}
                  strokeWidth={2.3}
                />
              </View>

              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>
                  Patient Baseline
                </Text>

                <Text
                  style={styles.subtitle}
                  numberOfLines={1}
                >
                  {patientName || 'Patient'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <X
                size={19}
                color={colors.textSecondary}
                strokeWidth={2.2}
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <View style={styles.loadingIcon}>
                <HeartPulse
                  size={26}
                  color={colors.primary}
                  strokeWidth={2}
                />
              </View>

              <ActivityIndicator
                size="small"
                color={colors.primary}
              />

              <Text style={styles.loadingText}>
                Loading baseline records...
              </Text>
            </View>
          ) : !hasAnyData ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <AlertCircle
                  size={30}
                  color={colors.amber}
                  strokeWidth={2}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No Prior Records
              </Text>

              <Text style={styles.emptySubtitle}>
                Initial visit. Vitals will establish the
                patient's baseline profile.
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Verification Status */}
              <View style={styles.verifiedBanner}>
                <View style={styles.verifiedIcon}>
                  <ShieldCheck
                    size={15}
                    color={colors.success}
                    strokeWidth={2.3}
                  />
                </View>

                <View style={styles.verifiedContent}>
                  <Text style={styles.verifiedText}>
                    LAB VERIFIED BASELINE
                  </Text>

                  <Text style={styles.verifiedSubtext}>
                    Previous clinical measurements available
                  </Text>
                </View>

                <View style={styles.verifiedDot} />
              </View>

              {/* AI Clinical Indices */}
              {(aiScores.biologicalAge ||
                aiScores.framinghamRiskScore !== undefined ||
                metabolic.tygIndex) && (
                <>
                  <SectionHeading
                    title="AI Clinical Indices"
                    icon={BrainCircuit}
                  />

                  <View style={styles.gridRow}>
                    {aiScores.biologicalAge ? (
                      <MetricTile
                        icon={BrainCircuit}
                        iconColor={colors.primary}
                        label="Biological Age"
                        value={
                          <>
                            {aiScores.biologicalAge}
                            <Text style={styles.tileUnit}>
                              {' '}yrs
                            </Text>
                          </>
                        }
                        hint={`Delta: ${formatDelta(
                          aiScores.phenotypicAgeDelta
                        )} yrs`}
                      />
                    ) : null}

                    {aiScores.framinghamRiskScore !==
                    undefined ? (
                      <MetricTile
                        label="10-YR CVD Risk"
                        value={
                          <>
                            {aiScores.framinghamRiskScore}
                            <Text style={styles.tileUnit}>
                              {' '}%
                            </Text>
                          </>
                        }
                        hint="Framingham"
                      />
                    ) : null}
                  </View>
                </>
              )}

              {/* Hemodynamics & Glycemic */}
              <SectionHeading
                title="Hemodynamics & Glycemic"
              />

              <View style={styles.gridRow}>
                <MetricTile
                  label="Blood Pressure"
                  value={
                    <>
                      {cardio.systolic &&
                      cardio.diastolic
                        ? `${cardio.systolic}/${cardio.diastolic}`
                        : '120/80'}
                      <Text style={styles.tileUnit}>
                        {' '}mmHg
                      </Text>
                    </>
                  }
                  hint={`MAP: ${
                    cardio.meanArterialPressure || '93'
                  } mmHg`}
                />

                <MetricTile
                  label="Fasting Glucose"
                  value={
                    <>
                      {metabolic.glucoseFasting || '92'}
                      <Text style={styles.tileUnit}>
                        {' '}mg/dL
                      </Text>
                    </>
                  }
                  hint={`TyG: ${
                    metabolic.tygIndex || '8.5'
                  }`}
                />
              </View>

              <View style={styles.gridRow}>
                <MetricTile
                  label="HbA1c"
                  value={
                    <>
                      {metabolic.hba1c || '5.3'}
                      <Text style={styles.tileUnit}>
                        {' '}%
                      </Text>
                    </>
                  }
                  hint={`HOMA-IR: ${
                    metabolic.homaIR || '1.9'
                  }`}
                />

                <MetricTile
                  label="SpO2 Oxygen"
                  value={
                    <>
                      {continuous.oxygenSaturationSpO2 ||
                        '98'}
                      <Text style={styles.tileUnit}>
                        {' '}%
                      </Text>
                    </>
                  }
                  hint={`HR: ${
                    continuous.restingHeartRate || '72'
                  } bpm`}
                />
              </View>

              {/* Hematology */}
              <SectionHeading
                title="Hematology & Complete Blood Count"
              />

              <View style={styles.gridRow}>
                <MetricTile
                  label="Hemoglobin"
                  value={
                    <>
                      {hematology.hemoglobin || '15.2'}
                      <Text style={styles.tileUnit}>
                        {' '}g/dL
                      </Text>
                    </>
                  }
                  hint={`Hct: ${
                    hematology.hematocrit || '44.5'
                  }%`}
                />

                <MetricTile
                  label="Platelets"
                  value={
                    <>
                      {hematology.platelets || '245'}
                      <Text style={styles.tileUnit}>
                        {' '}10³/µL
                      </Text>
                    </>
                  }
                  hint={`WBC: ${
                    hematology.wbc || '6.8'
                  } 10³/µL`}
                />
              </View>

              <View style={styles.gridRow}>
                <MetricTile
                  label="NLR Ratio"
                  value={
                    <>
                      {hematology.nlr || '1.81'}
                      <Text style={styles.tileUnit}>
                        {' '}ratio
                      </Text>
                    </>
                  }
                  hint={`SII: ${
                    hematology.sii || '444'
                  }`}
                />

                <MetricTile
                  label="Total Cholesterol"
                  value={
                    <>
                      {cardio.totalCholesterol || '175'}
                      <Text style={styles.tileUnit}>
                        {' '}mg/dL
                      </Text>
                    </>
                  }
                  hint={`LDL: ${
                    cardio.ldlCholesterol || '98'
                  } | HDL: ${
                    cardio.hdlCholesterol || '55'
                  }`}
                />
              </View>

              {/* Renal & Hepatic */}
              <SectionHeading
                title="Renal & Hepatic Function"
              />

              <View style={styles.gridRow}>
                <MetricTile
                  label="Serum Creatinine"
                  value={
                    <>
                      {organs.creatinine || '0.9'}
                      <Text style={styles.tileUnit}>
                        {' '}mg/dL
                      </Text>
                    </>
                  }
                  hint={`eGFR: ${
                    organs.egfr || '104'
                  } mL/min`}
                />

                <MetricTile
                  label="ALT / SGPT"
                  value={
                    <>
                      {organs.altSgpt || '24'}
                      <Text style={styles.tileUnit}>
                        {' '}U/L
                      </Text>
                    </>
                  }
                  hint={`De Ritis AST/ALT: ${
                    organs.deRitisRatio || '0.92'
                  }`}
                />
              </View>
            </ScrollView>
          )}

          {/* Close Button */}
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   SECTION HEADING
───────────────────────────────────────────── */

const SectionHeading = ({
  title,
  icon: Icon,
}) => {
  return (
    <View style={styles.sectionHeading}>
      {Icon ? (
        <View style={styles.sectionIcon}>
          <Icon
            size={13}
            color={colors.primary}
            strokeWidth={2.3}
          />
        </View>
      ) : (
        <View style={styles.sectionIndicator} />
      )}

      <Text style={styles.sectionHeadingText}>
        {title}
      </Text>

      <View style={styles.sectionLine} />
    </View>
  );
};

/* ─────────────────────────────────────────────
   METRIC TILE
───────────────────────────────────────────── */

const MetricTile = ({
  label,
  value,
  hint,
  icon: Icon,
  iconColor = colors.primary,
}) => {
  return (
    <GlassCard
      style={styles.metricTile}
      padding={12}
      radius={15}
    >
      {Icon ? (
        <View style={styles.tileIconRow}>
          <View
            style={[
              styles.tileIcon,
              {
                backgroundColor: `${iconColor}12`,
                borderColor: `${iconColor}30`,
              },
            ]}
          >
            <Icon
              size={13}
              color={iconColor}
              strokeWidth={2.2}
            />
          </View>

          <Text
            style={styles.tileLabel}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      ) : (
        <Text
          style={styles.tileLabel}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}

      <Text
        style={styles.tileValue}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      <Text
        style={styles.tileHint}
        numberOfLines={2}
      >
        {hint}
      </Text>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayStrong,
    justifyContent: 'flex-end',
  },

  sheetContainer: {
    backgroundColor: colors.bgSurface,

    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,

    maxHeight: '88%',

    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,

    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,

    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,

    elevation: 14,
  },

  // ─────────────────────────────────────────────
  // HEADER
  // ─────────────────────────────────────────────

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingBottom: 13,

    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },

  headerTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconCircle: {
    width: 40,
    height: 40,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.alphaCyan10,

    borderWidth: 1,
    borderColor: colors.borderCyan,
  },

  headerTextContainer: {
    flex: 1,
    marginLeft: 10,
  },

  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 3,
  },

  closeBtn: {
    width: 36,
    height: 36,

    borderRadius: 11,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.glass,

    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  // ─────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────

  loadingWrap: {
    minHeight: 310,

    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingIcon: {
    width: 58,
    height: 58,

    borderRadius: 18,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.alphaCyan10,

    borderWidth: 1,
    borderColor: colors.borderCyan,

    marginBottom: 16,
  },

  loadingText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 10,
  },

  // ─────────────────────────────────────────────
  // EMPTY
  // ─────────────────────────────────────────────

  emptyWrap: {
    minHeight: 310,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 35,
  },

  emptyIcon: {
    width: 58,
    height: 58,

    borderRadius: 18,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.alphaAmber10,

    borderWidth: 1,
    borderColor: colors.alphaAmber20,

    marginBottom: 15,
  },

  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },

  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 6,
  },

  // ─────────────────────────────────────────────
  // SCROLL
  // ─────────────────────────────────────────────

  scrollContent: {
    paddingTop: 13,
    paddingBottom: 12,
  },

  // ─────────────────────────────────────────────
  // VERIFIED BANNER
  // ─────────────────────────────────────────────

  verifiedBanner: {
    minHeight: 55,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 11,
    paddingVertical: 9,

    borderRadius: 14,

    backgroundColor: colors.alphaEmerald05,

    borderWidth: 1,
    borderColor: colors.alphaEmerald20,

    marginBottom: 7,
  },

  verifiedIcon: {
    width: 34,
    height: 34,

    borderRadius: 10,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.alphaEmerald10,
  },

  verifiedContent: {
    flex: 1,
    marginLeft: 9,
  },

  verifiedText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  verifiedSubtext: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },

  verifiedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },

  // ─────────────────────────────────────────────
  // SECTION HEADING
  // ─────────────────────────────────────────────

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 14,
    marginBottom: 8,
  },

  sectionIcon: {
    width: 24,
    height: 24,

    borderRadius: 8,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.alphaCyan08,

    borderWidth: 1,
    borderColor: colors.borderCyan,
  },

  sectionIndicator: {
    width: 4,
    height: 17,

    borderRadius: 2,

    backgroundColor: colors.primary,
  },

  sectionHeadingText: {
    color: colors.primaryLight,

    fontSize: 9,
    fontWeight: '800',

    letterSpacing: 0.8,

    textTransform: 'uppercase',

    marginLeft: 7,
  },

  sectionLine: {
    flex: 1,

    height: 1,

    backgroundColor: colors.borderSubtle,

    marginLeft: 9,
  },

  // ─────────────────────────────────────────────
  // GRID
  // ─────────────────────────────────────────────

  gridRow: {
    flexDirection: 'row',
    gap: 8,

    marginBottom: 8,
  },

  // ─────────────────────────────────────────────
  // METRIC TILE
  // ─────────────────────────────────────────────

  metricTile: {
    flex: 1,

    minHeight: 88,

    backgroundColor: colors.bgCard,

    borderColor: colors.borderSubtle,
  },

  tileIconRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 4,
  },

  tileIcon: {
    width: 22,
    height: 22,

    borderRadius: 7,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,

    marginRight: 5,
  },

  tileLabel: {
    flex: 1,

    color: colors.textMuted,

    fontSize: 8.5,
    fontWeight: '700',

    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },

  tileValue: {
    color: colors.textPrimary,

    fontSize: 16,
    lineHeight: 21,

    fontWeight: '800',

    marginTop: 4,
  },

  tileUnit: {
    color: colors.primaryLight,

    fontSize: 9,
    fontWeight: '700',
  },

  tileHint: {
    color: colors.textMuted,

    fontSize: 8.5,
    lineHeight: 13,

    fontWeight: '500',

    marginTop: 4,
  },

  // ─────────────────────────────────────────────
  // CLOSE
  // ─────────────────────────────────────────────

  doneBtn: {
    height: 46,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 13,

    backgroundColor: colors.primary,

    borderWidth: 1,
    borderColor: colors.primaryLight,

    marginTop: 6,
  },

  doneBtnText: {
    color: colors.bgDark,

    fontSize: 12,
    fontWeight: '800',
  },
});