import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Clock,
  RotateCcw,
  X,
  AlertCircle,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../theme/colors';
import userApi from '../api/userApi';

const TIME_SLOTS = [
  { slot: '06:00 AM - 07:00 AM', label: 'Early Fasting', badge: 'FASTING' },
  { slot: '07:00 AM - 08:00 AM', label: 'Standard Fasting', badge: 'FASTING' },
  { slot: '08:00 AM - 09:00 AM', label: 'Recommended Morning', badge: 'POPULAR' },
  { slot: '09:00 AM - 10:00 AM', label: 'Standard Collection', badge: null },
  { slot: '10:00 AM - 11:00 AM', label: 'Late Morning', badge: null },
  { slot: '05:00 PM - 06:00 PM', label: 'Evening Visit', badge: 'NON-FASTING' },
];

export const RescheduleModal = ({
  visible,
  onClose,
  appointment,
  onSuccess,
}) => {
  const { colors, isDark } = useTheme();

  // Generate next 7 available days starting tomorrow
  const availableDates = useMemo(() => {
    const list = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const isoStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      list.push({
        isoStr,
        dayName,
        monthDay,
        label: i === 1 ? 'Tomorrow' : `${dayName}, ${monthDay}`,
      });
    }
    return list;
  }, []);

  const [selectedDate, setSelectedDate] = useState(availableDates[0]?.isoStr);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[1].slot);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!appointment) return null;

  const currentScheduledStr = appointment.scheduledDate
    ? new Date(appointment.scheduledDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Scheduled Date';

  const handleConfirm = async () => {
    if (!selectedDate || !selectedSlot) {
      Alert.alert('Required Selection', 'Please select both a new visit date and time slot.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await userApi.rescheduleAppointment(appointment._id, selectedDate, selectedSlot);
      if (res.success) {
        Alert.alert(
          'Appointment Rescheduled',
          `Your home visit has been successfully updated to ${selectedDate} (${selectedSlot}).`,
          [{ text: 'OK', onPress: () => {
            onClose();
            if (onSuccess) onSuccess();
          }}]
        );
      } else {
        Alert.alert('Notice', res.message || 'Could not reschedule appointment.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Rescheduling failed.';
      Alert.alert('Reschedule Blocked', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? '#0c0e12' : '#ffffff', borderColor: colors.borderSubtle }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.headerIconWrap, { backgroundColor: colors.cyanGlow }]}>
                <RotateCcw size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Reschedule Visit
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  Select a new date & morning collection slot
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Current Schedule Summary */}
            <View style={[styles.currentScheduleBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc', borderColor: colors.borderSubtle }]}>
              <Text style={styles.currentScheduleLabel}>CURRENT APPOINTMENT</Text>
              <Text style={[styles.currentScheduleTest, { color: colors.textPrimary }]}>
                {appointment.testCatalog?.testName || 'Diagnostic Panel'}
              </Text>
              <View style={styles.currentScheduleRow}>
                <Clock size={12} color={colors.amberLight || '#f59e0b'} />
                <Text style={[styles.currentScheduleTime, { color: colors.textSecondary }]}>
                  {currentScheduledStr} • {appointment.timeSlot || '08:00 AM'}
                </Text>
              </View>
            </View>

            {/* Select Date */}
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
              SELECT NEW DATE
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesRow}>
              {availableDates.map((item) => {
                const isSelected = selectedDate === item.isoStr;
                return (
                  <TouchableOpacity
                    key={item.isoStr}
                    style={[
                      styles.datePill,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
                        borderColor: colors.borderSubtle,
                      },
                      isSelected && [
                        styles.datePillActive,
                        { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(6, 182, 212, 0.14)' : 'rgba(8, 145, 178, 0.1)' },
                      ],
                    ]}
                    onPress={() => setSelectedDate(item.isoStr)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.datePillDay, { color: isSelected ? colors.primary : colors.textMuted }]}>
                      {item.dayName}
                    </Text>
                    <Text style={[styles.datePillDate, { color: isSelected ? colors.primary : colors.textPrimary }]}>
                      {item.monthDay}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Select Time Slot */}
            <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: 14 }]}>
              SELECT COLLECTION TIME SLOT
            </Text>
            <View style={styles.slotsGrid}>
              {TIME_SLOTS.map((slotObj) => {
                const isSelected = selectedSlot === slotObj.slot;
                return (
                  <TouchableOpacity
                    key={slotObj.slot}
                    style={[
                      styles.slotOption,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                        borderColor: colors.borderSubtle,
                      },
                      isSelected && [
                        styles.slotOptionActive,
                        { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(6, 182, 212, 0.12)' : 'rgba(8, 145, 178, 0.08)' },
                      ],
                    ]}
                    onPress={() => setSelectedSlot(slotObj.slot)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.slotOptionTime, { color: isSelected ? colors.primary : colors.textPrimary }]}>
                        {slotObj.slot}
                      </Text>
                      <Text style={[styles.slotOptionLabel, { color: colors.textMuted }]}>
                        {slotObj.label}
                      </Text>
                    </View>
                    {slotObj.badge && (
                      <View style={[styles.slotBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.06)' }]}>
                        <Text style={[styles.slotBadgeText, { color: colors.textSecondary }]}>
                          {slotObj.badge}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 33 Clinical Logistics Notice */}
            <View style={[styles.policyNoticeBox, { backgroundColor: isDark ? 'rgba(6, 182, 212, 0.06)' : 'rgba(8, 145, 178, 0.05)', borderColor: colors.borderCyan }]}>
              <AlertCircle size={14} color={colors.primary} />
              <Text style={[styles.policyNoticeText, { color: colors.textMuted }]}>
                <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Clinical Cutoff Policy (Sec 33): </Text>
                Appointments can be rescheduled up to 8 hours prior to collection. Within 8 hours, slots are locked to preserve cold chain transport and phlebotomist dispatch.
              </Text>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.modalFooter, { borderTopColor: colors.borderSubtle }]}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
              onPress={onClose}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                Keep Current
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>CONFIRM RESCHEDULE</Text>
                  <ChevronRight size={14} color="#000000" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 10.5,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  modalBody: {
    padding: 16,
  },
  currentScheduleBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  currentScheduleLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  currentScheduleTest: {
    fontSize: 13,
    fontWeight: '700',
  },
  currentScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  currentScheduleTime: {
    fontSize: 11,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  datesRow: {
    gap: 8,
    paddingBottom: 4,
  },
  datePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 70,
  },
  datePillActive: {
    borderWidth: 1.5,
  },
  datePillDay: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  datePillDate: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  slotsGrid: {
    gap: 8,
  },
  slotOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  slotOptionActive: {
    borderWidth: 1.5,
  },
  slotOptionTime: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  slotOptionLabel: {
    fontSize: 10,
    marginTop: 1,
  },
  slotBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  slotBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  policyNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    marginBottom: 6,
  },
  policyNoticeText: {
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  submitBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});

export default RescheduleModal;
