import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Activity, User, FileText, Sparkles, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../theme/colors';

/**
 * DataProvenanceBadge Component
 * Enforces Spec Section 1 & 47:
 * "AI-generated estimates must never be represented as actual medical measurements."
 * 
 * Explicit Provenance Types:
 * - MEASURED_LAB: 🟢 Certified laboratory blood/specimen test
 * - USER_REPORTED: 🟡 Self-reported manual user entry
 * - EXTRACTED_PDF: 🔵 OCR-parsed from physical medical document
 * - AI_ESTIMATE: 🟣 Computational neural network projection (with required clinical disclaimer)
 */

export const PROVENANCE_TYPES = {
  MEASURED_LAB: 'MEASURED_LAB',
  USER_REPORTED: 'USER_REPORTED',
  EXTRACTED_PDF: 'EXTRACTED_PDF',
  AI_ESTIMATE: 'AI_ESTIMATE',
};

const PROVENANCE_CONFIG = {
  MEASURED_LAB: {
    tag: '[MEASURED_LAB]',
    label: 'Laboratory Test',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    icon: Activity,
    dotColor: '#10b981',
    description: 'NABL & CLSI accredited wet-lab test measurement.',
  },
  USER_REPORTED: {
    tag: '[USER_REPORTED]',
    label: 'Manual Intake',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    icon: User,
    dotColor: '#f59e0b',
    description: 'Patient self-reported intake without clinical verification.',
  },
  EXTRACTED_PDF: {
    tag: '[EXTRACTED_PDF]',
    label: 'OCR Document',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.35)',
    icon: FileText,
    dotColor: '#06b6d4',
    description: 'Extracted via vision-language OCR from clinical report.',
  },
  AI_ESTIMATE: {
    tag: '[AI_ESTIMATE]',
    label: 'Neural Network Estimate',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.14)',
    borderColor: 'rgba(168, 85, 247, 0.4)',
    icon: Sparkles,
    dotColor: '#a855f7',
    description: 'Algorithmic projection; does not constitute a certified medical measurement.',
  },
};

export const normalizeProvenance = (source) => {
  if (!source) return PROVENANCE_TYPES.USER_REPORTED;
  const s = String(source).toUpperCase();
  if (s.includes('LAB') || s.includes('DOCTOR') || s.includes('ASSISTANT') || s.includes('MEASURED')) {
    return PROVENANCE_TYPES.MEASURED_LAB;
  }
  if (s.includes('PDF') || s.includes('OCR') || s.includes('SCAN') || s.includes('EXTRACT')) {
    return PROVENANCE_TYPES.EXTRACTED_PDF;
  }
  if (s.includes('AI') || s.includes('ESTIMATE') || s.includes('PREDICTION') || s.includes('NEURAL') || s.includes('PROJECT')) {
    return PROVENANCE_TYPES.AI_ESTIMATE;
  }
  return PROVENANCE_TYPES.USER_REPORTED;
};

export const DataProvenanceBadge = ({
  type = 'MEASURED_LAB',
  size = 'sm', // 'xs', 'sm', 'md', 'banner'
  showLabel = true,
  showDisclaimer = false,
  customDisclaimer,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const normalized = normalizeProvenance(type);
  const cfg = PROVENANCE_CONFIG[normalized] || PROVENANCE_CONFIG.MEASURED_LAB;
  const IconComp = cfg.icon;

  const isXs = size === 'xs';
  const isSm = size === 'sm';
  const isBanner = size === 'banner';

  if (isBanner) {
    return (
      <View
        style={[
          styles.bannerContainer,
          {
            backgroundColor: cfg.bgColor,
            borderColor: cfg.borderColor,
          },
          style,
        ]}
      >
        <View style={styles.bannerHeader}>
          <View style={[styles.dotIndicator, { backgroundColor: cfg.dotColor }]} />
          <Text style={[styles.bannerTag, { color: cfg.color }]}>{cfg.tag}</Text>
          <Text style={[styles.bannerLabel, { color: colors.textPrimary }]}>— {cfg.label}</Text>
        </View>
        <Text style={[styles.bannerDesc, { color: colors.textMuted }]}>{cfg.description}</Text>
        {normalized === PROVENANCE_TYPES.AI_ESTIMATE && (
          <View style={styles.disclaimerRow}>
            <AlertCircle size={12} color={colors.amberLight || '#f59e0b'} />
            <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
              {customDisclaimer ||
                'Clinical Rule Sec. 1 & 47: AI-generated estimates must never be represented as actual medical measurements. Consult a physician for diagnostic confirmation.'}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.badgeContainer,
          {
            backgroundColor: cfg.bgColor,
            borderColor: cfg.borderColor,
            paddingVertical: isXs ? 2 : isSm ? 3 : 4,
            paddingHorizontal: isXs ? 5 : isSm ? 7 : 9,
          },
        ]}
      >
        <View style={[styles.dotIndicator, { backgroundColor: cfg.dotColor, width: isXs ? 5 : 6, height: isXs ? 5 : 6 }]} />
        <Text
          style={[
            styles.tagText,
            {
              color: cfg.color,
              fontSize: isXs ? 9 : isSm ? 10 : 11,
            },
          ]}
        >
          {cfg.tag}
        </Text>
        {showLabel && !isXs && (
          <Text
            style={[
              styles.labelText,
              {
                color: cfg.color,
                fontSize: isSm ? 9 : 10,
              },
            ]}
          >
            {' '}{cfg.label}
          </Text>
        )}
      </View>

      {showDisclaimer && normalized === PROVENANCE_TYPES.AI_ESTIMATE && (
        <View style={styles.inlineDisclaimer}>
          <AlertCircle size={10} color={colors.amberLight || '#f59e0b'} />
          <Text style={[styles.inlineDisclaimerText, { color: colors.textMuted }]}>
            {customDisclaimer || 'Sec 1 & 47: AI projection; not a certified lab measurement.'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
  },
  dotIndicator: {
    borderRadius: 3,
    marginRight: 5,
  },
  tagText: {
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'monospace',
  },
  labelText: {
    fontWeight: '600',
    opacity: 0.9,
  },
  inlineDisclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  inlineDisclaimerText: {
    fontSize: 9,
    fontStyle: 'italic',
    lineHeight: 12,
  },
  bannerContainer: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 6,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bannerTag: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  bannerDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  disclaimerText: {
    fontSize: 10,
    fontStyle: 'italic',
    lineHeight: 14,
    flex: 1,
  },
});

export default DataProvenanceBadge;
