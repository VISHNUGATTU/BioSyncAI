import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
} from 'lucide-react-native';

import { colors } from '../theme/colors';
import GlassCard from './GlassCard';

export const TUBE_SPECS = {
  BLUE: {
    key: 'BLUE',
    name: 'Light Blue Top',
    additive: '3.2% Buffered Sodium Citrate',
    color: '#38bdf8',
    borderColor: '#0284c7',
    use: 'Coagulation, PT / INR, Clotting Factors',
    inversions: 'Invert gently 3-4 times',
    order: 1,
    fillRequirement:
      'Must fill precisely to the indicator line (9:1 ratio)',
  },

  GOLD: {
    key: 'GOLD',
    name: 'Gold / Yellow Top (SST)',
    additive: 'Clot Activator & Gel Separator',
    color: '#facc15',
    borderColor: '#ca8a04',
    use: 'Lipid Profile, LFT, KFT, Hormones, Vitamins',
    inversions:
      'Invert gently 5 times, allow 30 min clot time',
    order: 2,
    fillRequirement:
      'Standard draw volume (3.5 - 5.0 mL)',
  },

  LAVENDER: {
    key: 'LAVENDER',
    name: 'Lavender Top (EDTA)',
    additive: 'K2 / K3 EDTA Anticoagulant',
    color: '#c084fc',
    borderColor: '#9333ea',
    use: 'Complete Blood Count (CBC), HbA1c, ESR',
    inversions:
      'Invert gently 8-10 times immediately',
    order: 3,
    fillRequirement:
      'Fill to nominal mark to prevent micro-clotting',
  },

  GREY: {
    key: 'GREY',
    name: 'Grey Top (Fluoride)',
    additive: 'Sodium Fluoride / Potassium Oxalate',
    color: '#94a3b8',
    borderColor: '#475569',
    use: 'Fasting Plasma Glucose, Insulin, GTT',
    inversions:
      'Invert gently 8-10 times immediately',
    order: 4,
    fillRequirement:
      'Prevents glycolysis (accurate glucose measurement)',
  },
};

export const getRequiredSpecimenTubes = (tests = []) => {
  const tubes = new Set();

  const testNames = tests
    .map(
      (t) =>
        (t?.testName ||
          t?.name ||
          '').toLowerCase()
    )
    .join(' ');

  // EDTA Lavender
  if (
    testNames.includes('cbc') ||
    testNames.includes('blood count') ||
    testNames.includes('hba1c') ||
    testNames.includes('hemoglobin') ||
    testNames.includes('esr') ||
    testNames.includes('genetic') ||
    tests.length === 0
  ) {
    tubes.add('LAVENDER');
  }

  // SST Gold
  if (
    testNames.includes('lipid') ||
    testNames.includes('cholesterol') ||
    testNames.includes('liver') ||
    testNames.includes('lft') ||
    testNames.includes('kidney') ||
    testNames.includes('kft') ||
    testNames.includes('thyroid') ||
    testNames.includes('vitamin') ||
    testNames.includes('hormone') ||
    testNames.includes('creatinine') ||
    testNames.includes('calcium') ||
    tests.length === 0
  ) {
    tubes.add('GOLD');
  }

  // Grey Fluoride
  if (
    testNames.includes('glucose') ||
    testNames.includes('sugar') ||
    testNames.includes('fasting') ||
    testNames.includes('diabetes') ||
    testNames.includes('insulin') ||
    testNames.includes('metabolic')
  ) {
    tubes.add('GREY');
  }

  // Light Blue Citrate
  if (
    testNames.includes('coag') ||
    testNames.includes('pt') ||
    testNames.includes('inr') ||
    testNames.includes('clotting') ||
    testNames.includes('dimer')
  ) {
    tubes.add('BLUE');
  }

  // Return sorted by standard CLSI Order of Draw
  return Array.from(tubes)
    .map((key) => TUBE_SPECS[key])
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
};

export default function SpecimenTubeGuide({
  tests = [],
  collapsible = true,
  initialExpanded = false,
}) {
  const [expanded, setExpanded] =
    useState(initialExpanded);

  const requiredTubes =
    getRequiredSpecimenTubes(tests);

  const handleToggle = () => {
    if (!collapsible) {
      return;
    }

    setExpanded((previous) => !previous);
  };

  return (
    <GlassCard
      style={styles.card}
      padding={14}
      radius={17}
    >
      {/* Header */}
      <TouchableOpacity
        style={styles.headerRow}
        onPress={handleToggle}
        activeOpacity={collapsible ? 0.75 : 1}
        disabled={!collapsible}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <FlaskConical
              size={18}
              color={colors.primary}
              strokeWidth={2.2}
            />
          </View>

          <View style={styles.headerTextContainer}>
            <View style={styles.titleRow}>
              <Text
                style={styles.cardTitle}
                numberOfLines={1}
              >
                Vacutainer Specimen Tubes
              </Text>

              <View style={styles.tubeCountBadge}>
                <Text style={styles.tubeCountText}>
                  {requiredTubes.length}
                </Text>

                <Text style={styles.tubeCountLabel}>
                  {requiredTubes.length === 1
                    ? 'Tube'
                    : 'Tubes'}
                </Text>
              </View>
            </View>

            <Text style={styles.cardSubtitle}>
              CLSI Standard Clinical Order of Draw
            </Text>
          </View>
        </View>

        {collapsible && (
          <View style={styles.collapseIcon}>
            {expanded ? (
              <ChevronUp
                size={19}
                color={colors.textSecondary}
                strokeWidth={2.1}
              />
            ) : (
              <ChevronDown
                size={19}
                color={colors.textSecondary}
                strokeWidth={2.1}
              />
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Collapsed Summary */}
      {!expanded && (
        <View style={styles.pillsContainer}>
          {requiredTubes.length === 0 ? (
            <View style={styles.noTubes}>
              <Text style={styles.noTubesText}>
                No specimen tubes identified
              </Text>
            </View>
          ) : (
            <View style={styles.pillsRow}>
              {requiredTubes.map((tube) => (
                <View
                  key={tube.key}
                  style={[
                    styles.tubePill,
                    {
                      borderColor: `${tube.borderColor}80`,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.tubeDot,
                      {
                        backgroundColor:
                          tube.color,
                      },
                    ]}
                  />

                  <Text
                    style={styles.tubePillText}
                    numberOfLines={1}
                  >
                    {tube.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Expanded Details */}
      {expanded && (
        <View style={styles.detailedList}>
          {/* Order Notice */}
          <View style={styles.orderNotice}>
            <View style={styles.orderNoticeIcon}>
              <Sparkles
                size={15}
                color={colors.primary}
                strokeWidth={2.2}
              />
            </View>

            <View style={styles.orderNoticeContent}>
              <Text style={styles.orderNoticeTitle}>
                Order of Draw
              </Text>

              <Text style={styles.orderNoticeText}>
                Draw blood in sequential order #1 through #
                {requiredTubes.length} to prevent chemical
                additive cross-contamination.
              </Text>
            </View>
          </View>

          {/* Tube Cards */}
          {requiredTubes.map((tube, index) => (
            <TubeDetail
              key={tube.key}
              tube={tube}
              index={index}
            />
          ))}
        </View>
      )}
    </GlassCard>
  );
}

/* ─────────────────────────────────────────────
   TUBE DETAIL
───────────────────────────────────────────── */

const TubeDetail = ({ tube, index }) => {
  return (
    <View
      style={[
        styles.tubeDetailItem,
        {
          borderLeftColor: tube.color,
        },
      ]}
    >
      {/* Top Row */}
      <View style={styles.tubeDetailTop}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepNumber}>
            {index + 1}
          </Text>

          <Text style={styles.stepText}>
            DRAW
          </Text>
        </View>

        <View
          style={[
            styles.capColorBadge,
            {
              backgroundColor: `${tube.color}15`,
              borderColor: `${tube.borderColor}80`,
            },
          ]}
        >
          <View
            style={[
              styles.capColorDot,
              {
                backgroundColor: tube.color,
              },
            ]}
          />

          <Text
            style={[
              styles.capColorText,
              {
                color: tube.color,
              },
            ]}
            numberOfLines={1}
          >
            {tube.name}
          </Text>
        </View>
      </View>

      {/* Additive */}
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>
          ADDITIVE
        </Text>

        <Text style={styles.infoValue}>
          {tube.additive}
        </Text>
      </View>

      {/* Usage */}
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>
          USE FOR
        </Text>

        <Text style={styles.usageText}>
          {tube.use}
        </Text>
      </View>

      {/* Instructions */}
      <View style={styles.instructionContainer}>
        <View style={styles.instructionItem}>
          <View style={styles.instructionIcon}>
            <CheckCircle2
              size={13}
              color={colors.success}
              strokeWidth={2.2}
            />
          </View>

          <Text style={styles.instructionText}>
            {tube.inversions}
          </Text>
        </View>

        <View style={styles.fillRequirement}>
          <Text style={styles.fillLabel}>
            FILL
          </Text>

          <Text style={styles.fillText}>
            {tube.fillRequirement}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    marginBottom: 14,

    backgroundColor: colors.bgCard,

    borderColor: colors.borderDefault,
  },

  // ─────────────────────────────────────────────
  // HEADER
  // ─────────────────────────────────────────────

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
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
    minWidth: 0,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',

    minWidth: 0,
  },

  cardTitle: {
    flexShrink: 1,

    color: colors.textPrimary,

    fontSize: 13,
    fontWeight: '800',
  },

  tubeCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    marginLeft: 7,

    paddingHorizontal: 7,
    paddingVertical: 3,

    borderRadius: 7,

    backgroundColor: colors.alphaCyan10,

    borderWidth: 1,
    borderColor: colors.borderCyan,
  },

  tubeCountText: {
    color: colors.primaryLight,

    fontSize: 10,
    fontWeight: '800',
  },

  tubeCountLabel: {
    color: colors.textMuted,

    fontSize: 8,
    fontWeight: '600',

    marginLeft: 3,
  },

  cardSubtitle: {
    color: colors.textMuted,

    fontSize: 9.5,
    fontWeight: '500',

    marginTop: 4,
  },

  collapseIcon: {
    width: 32,
    height: 32,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 10,

    backgroundColor: colors.glass,

    borderWidth: 1,
    borderColor: colors.borderSubtle,

    marginLeft: 8,
  },

  // ─────────────────────────────────────────────
  // COLLAPSED PILLS
  // ─────────────────────────────────────────────

  pillsContainer: {
    marginTop: 13,

    paddingTop: 12,

    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },

  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  tubePill: {
    flexDirection: 'row',
    alignItems: 'center',

    maxWidth: '100%',

    paddingHorizontal: 9,
    paddingVertical: 6,

    borderRadius: 9,

    backgroundColor: colors.bgCardElevated,

    borderWidth: 1,
  },

  tubeDot: {
    width: 8,
    height: 8,

    borderRadius: 4,

    marginRight: 6,
  },

  tubePillText: {
    flexShrink: 1,

    color: colors.textSecondary,

    fontSize: 10,
    fontWeight: '600',
  },

  noTubes: {
    paddingVertical: 8,
  },

  noTubesText: {
    color: colors.textMuted,

    fontSize: 10,
    fontWeight: '500',
  },

  // ─────────────────────────────────────────────
  // EXPANDED
  // ─────────────────────────────────────────────

  detailedList: {
    marginTop: 14,
    gap: 10,
  },

  orderNotice: {
    flexDirection: 'row',
    alignItems: 'center',

    padding: 11,

    borderRadius: 13,

    backgroundColor: colors.alphaCyan05,

    borderWidth: 1,
    borderColor: colors.borderCyan,
  },

  orderNoticeIcon: {
    width: 32,
    height: 32,

    borderRadius: 10,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.alphaCyan10,
  },

  orderNoticeContent: {
    flex: 1,
    marginLeft: 9,
  },

  orderNoticeTitle: {
    color: colors.primaryLight,

    fontSize: 10,
    fontWeight: '800',

    marginBottom: 2,
  },

  orderNoticeText: {
    color: colors.textMuted,

    fontSize: 9.5,
    lineHeight: 14,
  },

  // ─────────────────────────────────────────────
  // TUBE DETAIL
  // ─────────────────────────────────────────────

  tubeDetailItem: {
    padding: 12,

    borderRadius: 14,

    backgroundColor: colors.bgCardElevated,

    borderWidth: 1,
    borderColor: colors.borderSubtle,

    borderLeftWidth: 4,
  },

  tubeDetailTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    gap: 8,

    marginBottom: 11,
  },

  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 7,
    paddingVertical: 4,

    borderRadius: 7,

    backgroundColor: colors.bgDark,

    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  stepNumber: {
    color: colors.primaryLight,

    fontSize: 11,
    fontWeight: '800',
  },

  stepText: {
    color: colors.textMuted,

    fontSize: 8,
    fontWeight: '800',

    marginLeft: 4,
  },

  capColorBadge: {
    flex: 1,

    flexDirection: 'row',
    alignItems: 'center',

    justifyContent: 'flex-end',

    paddingHorizontal: 8,
    paddingVertical: 5,

    borderRadius: 8,

    borderWidth: 1,
  },

  capColorDot: {
    width: 8,
    height: 8,

    borderRadius: 4,

    marginRight: 6,
  },

  capColorText: {
    flexShrink: 1,

    fontSize: 10,
    fontWeight: '800',

    textAlign: 'right',
  },

  // ─────────────────────────────────────────────
  // INFO
  // ─────────────────────────────────────────────

  infoBlock: {
    marginBottom: 9,
  },

  infoLabel: {
    color: colors.textMuted,

    fontSize: 8,
    fontWeight: '800',

    letterSpacing: 0.7,

    marginBottom: 3,
  },

  infoValue: {
    color: colors.textSecondary,

    fontSize: 10.5,
    lineHeight: 15,

    fontWeight: '600',
  },

  usageText: {
    color: colors.textPrimary,

    fontSize: 10.5,
    lineHeight: 15,

    fontWeight: '600',
  },

  // ─────────────────────────────────────────────
  // INSTRUCTIONS
  // ─────────────────────────────────────────────

  instructionContainer: {
    paddingTop: 9,

    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },

  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 8,
  },

  instructionIcon: {
    width: 24,
    height: 24,

    borderRadius: 7,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.alphaEmerald10,

    marginRight: 7,
  },

  instructionText: {
    flex: 1,

    color: colors.success,

    fontSize: 9.5,
    lineHeight: 14,

    fontWeight: '600',
  },

  fillRequirement: {
    padding: 8,

    borderRadius: 9,

    backgroundColor: colors.bgDark,

    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  fillLabel: {
    color: colors.primaryLight,

    fontSize: 8,
    fontWeight: '800',

    letterSpacing: 0.6,

    marginBottom: 3,
  },

  fillText: {
    color: colors.textMuted,

    fontSize: 9,
    lineHeight: 13,

    fontStyle: 'italic',
  },
});