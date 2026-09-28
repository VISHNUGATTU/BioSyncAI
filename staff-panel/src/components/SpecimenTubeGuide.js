import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FlaskConical, ChevronDown, ChevronUp, AlertCircle, Sparkles } from 'lucide-react-native';
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
    fillRequirement: 'Must fill precisely to the indicator line (9:1 ratio)',
  },
  GOLD: {
    key: 'GOLD',
    name: 'Gold / Yellow Top (SST)',
    additive: 'Clot Activator & Gel Separator',
    color: '#facc15',
    borderColor: '#ca8a04',
    use: 'Lipid Profile, LFT, KFT, Hormones, Vitamins',
    inversions: 'Invert gently 5 times, allow 30 min clot time',
    order: 2,
    fillRequirement: 'Standard draw volume (3.5 - 5.0 mL)',
  },
  LAVENDER: {
    key: 'LAVENDER',
    name: 'Lavender Top (EDTA)',
    additive: 'K2 / K3 EDTA Anticoagulant',
    color: '#c084fc',
    borderColor: '#9333ea',
    use: 'Complete Blood Count (CBC), HbA1c, ESR',
    inversions: 'Invert gently 8-10 times immediately',
    order: 3,
    fillRequirement: 'Fill to nominal mark to prevent micro-clotting',
  },
  GREY: {
    key: 'GREY',
    name: 'Grey Top (Fluoride)',
    additive: 'Sodium Fluoride / Potassium Oxalate',
    color: '#94a3b8',
    borderColor: '#475569',
    use: 'Fasting Plasma Glucose, Insulin, GTT',
    inversions: 'Invert gently 8-10 times immediately',
    order: 4,
    fillRequirement: 'Prevents glycolysis (accurate glucose measurement)',
  },
};

export const getRequiredSpecimenTubes = (tests = []) => {
  const tubes = new Set();
  const testNames = tests
    .map((t) => (t?.testName || t?.name || '').toLowerCase())
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
    .map((k) => TUBE_SPECS[k])
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
};

export default function SpecimenTubeGuide({ tests = [], collapsible = true, initialExpanded = false }) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const requiredTubes = getRequiredSpecimenTubes(tests);

  return (
    <GlassCard style={styles.card}>
      <TouchableOpacity
        style={styles.headerRow}
        onPress={() => collapsible && setExpanded(!expanded)}
        activeOpacity={collapsible ? 0.7 : 1}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <FlaskConical size={16} color={colors.cyan} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle}>Vacutainer Specimen Tubes</Text>
              <View style={styles.tubeCountBadge}>
                <Text style={styles.tubeCountText}>{requiredTubes.length} Tubes Needed</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>CLSI Standard Clinical Order of Draw</Text>
          </View>
        </View>

        {collapsible && (
          <View style={styles.collapseIcon}>
            {expanded ? <ChevronUp size={18} color={colors.textSecondary} /> : <ChevronDown size={18} color={colors.textSecondary} />}
          </View>
        )}
      </TouchableOpacity>

      {/* Pill summary when collapsed */}
      {!expanded && (
        <View style={styles.pillsRow}>
          {requiredTubes.map((tube) => (
            <View key={tube.key} style={[styles.tubePill, { borderColor: tube.borderColor }]}>
              <View style={[styles.tubeDot, { backgroundColor: tube.color }]} />
              <Text style={styles.tubePillText}>{tube.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Expanded detailed cards */}
      {expanded && (
        <View style={styles.detailedList}>
          <View style={styles.orderNotice}>
            <Sparkles size={14} color={colors.cyan} />
            <Text style={styles.orderNoticeText}>
              Draw blood in sequential order #1 through #{requiredTubes.length} to prevent chemical additive cross-contamination.
            </Text>
          </View>

          {requiredTubes.map((tube, index) => (
            <View key={tube.key} style={[styles.tubeDetailItem, { borderLeftColor: tube.color }]}>
              <View style={styles.tubeDetailTop}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>Draw #{index + 1}</Text>
                </View>
                <View style={[styles.capColorBadge, { backgroundColor: tube.color + '25', borderColor: tube.color }]}>
                  <View style={[styles.capColorDot, { backgroundColor: tube.color }]} />
                  <Text style={[styles.capColorText, { color: tube.color }]}>{tube.name}</Text>
                </View>
              </View>

              <Text style={styles.additiveTitle}>Additive: <Text style={styles.additiveVal}>{tube.additive}</Text></Text>
              <Text style={styles.usageText}>For: {tube.use}</Text>

              <View style={styles.instructionRow}>
                <View style={styles.instructionBadge}>
                  <Text style={styles.instructionText}>🔄 {tube.inversions}</Text>
                </View>
                <Text style={styles.fillRequirementText}>{tube.fillRequirement}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginBottom: 14,
    borderRadius: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.cyan + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tubeCountBadge: {
    backgroundColor: colors.cyan + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.cyan + '40',
  },
  tubeCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.cyan,
  },
  cardSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  collapseIcon: {
    padding: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  tubePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.bgCardElevated,
    borderWidth: 1,
  },
  tubeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tubePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  detailedList: {
    marginTop: 14,
    gap: 10,
  },
  orderNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cyan + '12',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cyan + '25',
  },
  orderNoticeText: {
    fontSize: 11,
    color: colors.cyan,
    flex: 1,
    lineHeight: 16,
  },
  tubeDetailItem: {
    backgroundColor: colors.bgCardElevated,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  tubeDetailTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepBadge: {
    backgroundColor: colors.bgDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  capColorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  capColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  capColorText: {
    fontSize: 11,
    fontWeight: '700',
  },
  additiveTitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  additiveVal: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  usageText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: 8,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: 6,
    flexWrap: 'wrap',
  },
  instructionBadge: {
    backgroundColor: colors.bgDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  instructionText: {
    fontSize: 10,
    color: colors.emerald,
    fontWeight: '600',
  },
  fillRequirementText: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
