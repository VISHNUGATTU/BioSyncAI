import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  X,
  AlertTriangle,
  UserX,
  ShieldAlert,
  Activity,
  FlaskConical,
  Clock,
  MapPin,
  FileText,
  Check,
  AlertOctagon,
} from 'lucide-react-native';
import { colors, useTheme } from '../theme/colors';

const EXCEPTION_CATEGORIES = [
  {
    id: 'Unreachable_Patient',
    label: 'Patient Absent / Unreachable',
    tag: 'OPERATIONAL',
    tagColor: colors.amberLight || '#f59e0b',
    icon: UserX,
    description: 'Door unanswered, no response at doorstep, phone unreachable after arrival timestamp.',
  },
  {
    id: 'Patient_Refusal',
    label: 'Patient Declined Collection',
    tag: 'PATIENT DECISION',
    tagColor: colors.dangerLight || '#f43f5e',
    icon: ShieldAlert,
    description: 'Patient explicitly refused specimen draw or phlebotomy access upon staff arrival.',
  },
  {
    id: 'Vein_Collapse_Difficult_Draw',
    label: 'Vein Collapse / Difficult Draw',
    tag: 'CLINICAL LIMITATION',
    tagColor: colors.purpleLight || '#a855f7',
    icon: Activity,
    description: 'Fragile/collapsed veins, severe haematoma risk, multiple failed venipuncture attempts.',
  },
  {
    id: 'Sample_Compromised_Hemolyzed',
    label: 'Compromised Specimen / Hemolysis',
    tag: 'SPECIMEN INTEGRITY',
    tagColor: colors.dangerLight || '#f43f5e',
    icon: FlaskConical,
    description: 'Visible hemolysis, accidental clotting in EDTA, damaged collection tube, or vacuum failure.',
  },
  {
    id: 'Patient_Not_Fasting',
    label: 'Fasting Protocol Violated',
    tag: 'PRE-ANALYTICAL',
    tagColor: colors.amberLight || '#f59e0b',
    icon: Clock,
    description: 'Patient consumed food or caloric beverages within mandatory 10-12 hr fasting window.',
  },
  {
    id: 'Address_Untraceable',
    label: 'Address Untraceable / Inaccessible',
    tag: 'ACCESS BARRIER',
    tagColor: colors.cyanLight || '#06b6d4',
    icon: MapPin,
    description: 'Premises could not be reached, safety hazard, security access denial, or incorrect location.',
  },
  {
    id: 'Other',
    label: 'Other Clinical / Operational Issue',
    tag: 'GENERAL EXCEPTION',
    tagColor: colors.textMuted || '#94a3b8',
    icon: FileText,
    description: 'Unforeseen field circumstance requiring custom clinical notes and follow-up.',
  },
];

export default function ClinicalExceptionModal({
  visible,
  onClose,
  onSubmit,
  loading = false,
  appointmentId,
  patientName = 'Patient',
}) {
  const { isDark } = useTheme();
  const [selectedException, setSelectedException] = useState('Unreachable_Patient');
  const [notes, setNotes] = useState('');

  const activeCategory = EXCEPTION_CATEGORIES.find((c) => c.id === selectedException);

  const handleConfirm = () => {
    if (selectedException === 'Other' && (!notes || notes.trim().length < 5)) {
      Alert.alert(
        'Notes Required',
        'Please enter detailed notes describing the reason for this exception (at least 5 characters).'
      );
      return;
    }

    Alert.alert(
      'Terminate Home Visit?',
      `Are you sure you want to log a collection exception for ${patientName}?\n\nReason: ${activeCategory?.label}\n\nThis will mark the visit as failed and notify the patient to reschedule.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Log Exception',
          style: 'destructive',
          onPress: () => {
            if (onSubmit) {
              onSubmit({
                exceptionType: selectedException,
                reason: activeCategory?.label || selectedException,
                notes: notes.trim(),
              });
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    if (!loading && onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#0b0f17' : '#ffffff',
              borderColor: isDark ? 'rgba(244, 63, 94, 0.3)' : 'rgba(244, 63, 94, 0.25)',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerBadge}>
                <AlertOctagon size={12} color="#f43f5e" />
                <Text style={styles.headerBadgeText}>CRITICAL FIELD EXCEPTION</Text>
              </View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Report Non-Collection
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {patientName} • Visit #{appointmentId ? appointmentId.slice(-6).toUpperCase() : '---'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' },
              ]}
              onPress={handleClose}
              disabled={loading}
              activeOpacity={0.7}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Warning Banner */}
          <View
            style={[
              styles.warningBanner,
              {
                backgroundColor: isDark ? 'rgba(244, 63, 94, 0.08)' : '#fff1f2',
                borderColor: isDark ? 'rgba(244, 63, 94, 0.25)' : '#fecdd3',
              },
            ]}
          >
            <AlertTriangle size={15} color="#f43f5e" />
            <Text style={[styles.warningText, { color: isDark ? '#fda4af' : '#e11d48' }]}>
              Logging an exception will immediately abort this collection task and alert clinical operations.
            </Text>
          </View>

          {/* Exception Options List */}
          <ScrollView
            style={styles.optionsList}
            contentContainerStyle={styles.optionsListContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              SELECT PRIMARY CLINICAL / FIELD REASON
            </Text>

            {EXCEPTION_CATEGORIES.map((item) => {
              const isSelected = selectedException === item.id;
              const IconComp = item.icon;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(244, 63, 94, 0.12)'
                          : 'rgba(244, 63, 94, 0.06)'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.02)'
                        : '#f8fafc',
                      borderColor: isSelected
                        ? '#f43f5e'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.07)'
                        : '#e2e8f0',
                    },
                  ]}
                  onPress={() => setSelectedException(item.id)}
                  activeOpacity={0.75}
                >
                  <View style={styles.optionHeader}>
                    <View
                      style={[
                        styles.iconWrap,
                        {
                          backgroundColor: isSelected
                            ? 'rgba(244, 63, 94, 0.2)'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : '#e2e8f0',
                        },
                      ]}
                    >
                      <IconComp
                        size={16}
                        color={isSelected ? '#f43f5e' : colors.textSecondary}
                      />
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={styles.titleRow}>
                        <Text
                          style={[
                            styles.optionTitle,
                            {
                              color: isSelected ? '#f43f5e' : colors.textPrimary,
                              fontWeight: isSelected ? '800' : '700',
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                        <View
                          style={[
                            styles.categoryTag,
                            { backgroundColor: `${item.tagColor}18`, borderColor: `${item.tagColor}40` },
                          ]}
                        >
                          <Text style={[styles.categoryTagText, { color: item.tagColor }]}>
                            {item.tag}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.optionDescription,
                          { color: colors.textMuted },
                        ]}
                      >
                        {item.description}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.radioCircle,
                        {
                          borderColor: isSelected ? '#f43f5e' : colors.textMuted,
                          backgroundColor: isSelected ? '#f43f5e' : 'transparent',
                        },
                      ]}
                    >
                      {isSelected && <Check size={11} color="#ffffff" strokeWidth={3} />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Notes Section */}
            <View style={styles.notesSection}>
              <View style={styles.notesLabelRow}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                  ADDITIONAL CLINICAL OBSERVATIONS
                </Text>
                <Text style={[styles.notesCharCount, { color: colors.textMuted }]}>
                  {selectedException === 'Other' ? 'Required (min 5 chars)' : 'Optional'}
                </Text>
              </View>

              <TextInput
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.4)' : '#f8fafc',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1',
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="Document specific patient statements, vein conditions, or draw attempts..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View
            style={[
              styles.footer,
              { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0' },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1',
                },
              ]}
              onPress={handleClose}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>
                Resume Visit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor: '#e11d48',
                  opacity: loading ? 0.7 : 1,
                },
              ]}
              onPress={handleConfirm}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <AlertOctagon size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.submitBtnText}>Terminate & Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  headerBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#f43f5e',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  optionsList: {
    paddingHorizontal: 20,
  },
  optionsListContent: {
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  optionCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionTitle: {
    fontSize: 13,
  },
  categoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  categoryTagText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  optionDescription: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginTop: 6,
  },
  notesSection: {
    marginTop: 8,
  },
  notesLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesCharCount: {
    fontSize: 10,
    fontWeight: '600',
  },
  notesInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 12.5,
    minHeight: 70,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  submitBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },
});
