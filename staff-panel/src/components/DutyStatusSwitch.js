import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { ChevronDown, Check, Circle } from 'lucide-react-native';
import { colors } from '../theme/colors';
import useAuthStore from '../store/authStore';

export const DutyStatusSwitch = () => {
  const dutyStatus = useAuthStore((state) => state.dutyStatus);
  const setDutyStatus = useAuthStore((state) => state.setDutyStatus);
  const [modalVisible, setModalVisible] = useState(false);

  const statuses = [
    {
      id: 'Available',
      title: 'Online (Available)',
      desc: 'Ready to receive immediate pickup tasks',
      color: colors.emerald,
      glow: colors.emeraldGlow,
    },
    {
      id: 'On_Route',
      title: 'On Route (Active Trip)',
      desc: 'Currently in transit to patient location',
      color: colors.primary,
      glow: colors.primaryGlow,
    },
    {
      id: 'Off_Duty',
      title: 'Off Duty (Offline)',
      desc: 'Not accepting new sample collection trips',
      color: colors.textMuted,
      glow: 'transparent',
    },
  ];

  const current = statuses.find((s) => s.id === dutyStatus) || statuses[0];

  const handleSelect = (statusId) => {
    setDutyStatus(statusId);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
        style={[styles.container, { borderColor: current.color + '40' }]}
      >
        <View style={[styles.dot, { backgroundColor: current.color, shadowColor: current.color }]} />
        <Text style={[styles.statusText, { color: current.color }]}>
          {current.id.replace('_', ' ')}
        </Text>
        <ChevronDown size={14} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Duty Status</Text>
              <Text style={styles.modalSubtitle}>Syncs real-time availability to dispatch center</Text>
            </View>

            {statuses.map((item) => {
              const isSelected = item.id === dutyStatus;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.optionCard,
                    isSelected && { borderColor: item.color, backgroundColor: 'rgba(255,255,255,0.03)' },
                  ]}
                  onPress={() => handleSelect(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.statusIndicator, { backgroundColor: item.color }]} />
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionTitle, isSelected && { color: item.color }]}>
                      {item.title}
                    </Text>
                    <Text style={styles.optionDesc}>{item.desc}</Text>
                  </View>
                  {isSelected && <Check size={18} color={item.color} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(12, 12, 12, 0.65)',
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
    backgroundColor: 'rgba(12, 12, 12, 0.4)',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 14,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  optionDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export default DutyStatusSwitch;
