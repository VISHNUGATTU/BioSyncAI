import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import {
  CircleCheck,
  Clock3,
  Navigation,
  Moon,
  ChevronDown,
  X,
  Check,
} from 'lucide-react-native';

import { useTheme } from '../theme/ThemeContext';

const DutyStatusSwitch = ({
  status,
  currentStatus,
  onStatusChange,
  visible,
  onClose,
  disabled = false,
  compact = false,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const statusConfigs = useMemo(() => [
    {
      value: 'Available',
      label: 'Available',
      description: 'Ready for new assignments',
      icon: CircleCheck,
      color: colors.success || '#10B981',
    },
    {
      value: 'On_Route',
      label: 'On Route',
      description: 'Travelling to patient location',
      icon: Navigation,
      color: colors.blue || '#3B82F6',
    },
    {
      value: 'Collecting',
      label: 'Collecting',
      description: 'Currently collecting specimen',
      icon: Clock3,
      color: colors.primary || '#06B6D4',
    },
    {
      value: 'Off_Duty',
      label: 'Off Duty',
      description: 'Not accepting field assignments',
      icon: Moon,
      color: colors.textMuted || '#64748B',
    },
  ], [colors]);

  const activeStatusValue = currentStatus || status || 'Available';

  const activeOption =
    statusConfigs.find(
      (item) => item.value === activeStatusValue
    ) || statusConfigs[0];

  const ActiveIcon = activeOption.icon;

  const isModalVisible =
    visible !== undefined ? visible : internalModalOpen;

  const handleCloseModal = () => {
    if (onClose) {
      onClose();
    }
    setInternalModalOpen(false);
  };

  const handleSelectStatus = async (newStatus) => {
    if (disabled || isUpdating || newStatus === activeStatusValue) {
      handleCloseModal();
      return;
    }

    try {
      setIsUpdating(true);
      if (onStatusChange) {
        await onStatusChange(newStatus);
      }
      handleCloseModal();
    } catch (error) {
      console.warn(
        '[DutyStatusSwitch] Failed to change status:',
        error?.message || error
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // ─────────────────────────────────────────────
  // MODAL CONTENT
  // ─────────────────────────────────────────────
  const modalContent = (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="fade"
      onRequestClose={handleCloseModal}
    >
      <Pressable
        style={[
          styles.modalOverlay,
          { backgroundColor: colors.overlay },
        ]}
        onPress={handleCloseModal}
      >
        <Pressable
          style={[
            styles.modalSheet,
            {
              backgroundColor: colors.bgCardElevated,
              borderColor: colors.borderDefault,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleBox}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: colors.textPrimary },
                ]}
              >
                Duty Status
              </Text>
              <Text
                style={[
                  styles.modalSubtitle,
                  { color: colors.textMuted },
                ]}
              >
                Select your active field availability
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.modalCloseBtn,
                {
                  backgroundColor: colors.alphaCyan10,
                  borderColor: colors.borderCyan,
                },
              ]}
              onPress={handleCloseModal}
              activeOpacity={0.7}
            >
              <X
                size={16}
                color={colors.textSecondary}
                strokeWidth={2.4}
              />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View style={styles.optionsList}>
            {statusConfigs.map((option) => {
              const Icon = option.icon;
              const isSelected = option.value === activeStatusValue;

              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.8}
                  disabled={isUpdating}
                  onPress={() => handleSelectStatus(option.value)}
                  style={[
                    styles.optionRow,
                    {
                      backgroundColor: isSelected
                        ? `${option.color}16`
                        : isDark
                        ? colors.bgCard
                        : colors.bgCardSoft,
                      borderColor: isSelected
                        ? `${option.color}48`
                        : colors.borderSubtle,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.optionIconBox,
                      {
                        backgroundColor: `${option.color}18`,
                        borderColor: `${option.color}35`,
                      },
                    ]}
                  >
                    <Icon
                      size={18}
                      color={option.color}
                      strokeWidth={2.3}
                    />
                  </View>

                  <View style={styles.optionDetails}>
                    <Text
                      style={[
                        styles.optionLabel,
                        {
                          color: isSelected
                            ? option.color
                            : colors.textPrimary,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.optionDesc,
                        { color: colors.textMuted },
                      ]}
                      numberOfLines={1}
                    >
                      {option.description}
                    </Text>
                  </View>

                  {isSelected && (
                    <View
                      style={[
                        styles.selectedIndicator,
                        { backgroundColor: option.color },
                      ]}
                    >
                      <Check
                        size={12}
                        color="#FFFFFF"
                        strokeWidth={3}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {isUpdating && (
            <View style={styles.updatingOverlay}>
              <ActivityIndicator
                size="small"
                color={colors.primaryLight}
              />
              <Text
                style={[
                  styles.updatingText,
                  { color: colors.primaryLight },
                ]}
              >
                Updating status...
              </Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );

  // If used purely as a Modal (e.g. from ProfileScreen)
  if (visible !== undefined) {
    return modalContent;
  }

  // ─────────────────────────────────────────────
  // COMPACT PILL MODE (FOR DASHBOARD HEADER)
  // ─────────────────────────────────────────────
  if (compact) {
    return (
      <>
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={disabled || isUpdating}
          onPress={() => setInternalModalOpen(true)}
          style={[
            styles.compactPill,
            {
              backgroundColor: `${activeOption.color}16`,
              borderColor: `${activeOption.color}38`,
            },
            style,
          ]}
        >
          {/* Status Indicator Dot */}
          <View
            style={[
              styles.statusDot,
              { backgroundColor: activeOption.color },
            ]}
          />

          <Text
            style={[
              styles.compactLabel,
              { color: colors.textPrimary },
            ]}
            numberOfLines={1}
          >
            {activeOption.label}
          </Text>

          {isUpdating ? (
            <ActivityIndicator
              size="small"
              color={activeOption.color}
              style={{ transform: [{ scale: 0.7 }] }}
            />
          ) : (
            <ChevronDown
              size={13}
              color={colors.textSecondary}
              strokeWidth={2.4}
            />
          )}
        </TouchableOpacity>

        {modalContent}
      </>
    );
  }

  // ─────────────────────────────────────────────
  // FULL CARD MODE (FOR SETTINGS / INLINE USE)
  // ─────────────────────────────────────────────
  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={disabled || isUpdating}
        onPress={() => setInternalModalOpen(true)}
        style={[
          styles.fullCard,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.borderSubtle,
          },
          style,
        ]}
      >
        <View
          style={[
            styles.fullCardIconBox,
            {
              backgroundColor: `${activeOption.color}18`,
              borderColor: `${activeOption.color}35`,
            },
          ]}
        >
          <ActiveIcon
            size={18}
            color={activeOption.color}
            strokeWidth={2.3}
          />
        </View>

        <View style={styles.fullCardDetails}>
          <Text
            style={[
              styles.fullCardHeading,
              { color: colors.textMuted },
            ]}
          >
            DUTY STATUS
          </Text>
          <View style={styles.fullCardStatusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: activeOption.color },
              ]}
            />
            <Text
              style={[
                styles.fullCardStatusText,
                { color: activeOption.color },
              ]}
            >
              {activeOption.label}
            </Text>
          </View>
        </View>

        {isUpdating ? (
          <ActivityIndicator
            size="small"
            color={colors.primaryLight}
          />
        ) : (
          <ChevronDown
            size={18}
            color={colors.textMuted}
            strokeWidth={2}
          />
        )}
      </TouchableOpacity>

      {modalContent}
    </>
  );
};

const styles = StyleSheet.create({
  /* Compact Pill (Header Mode) */
  compactPill: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    borderRadius: 13,
    borderWidth: 1,
    gap: 7,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  compactLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.1,
  },

  /* Full Card Mode */
  fullCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },

  fullCardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  fullCardDetails: {
    flex: 1,
    marginLeft: 12,
  },

  fullCardHeading: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  fullCardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },

  fullCardStatusText: {
    fontSize: 13,
    fontWeight: '800',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  modalSheet: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  modalHeaderTitleBox: {
    flex: 1,
    paddingRight: 10,
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  modalSubtitle: {
    fontSize: 11,
    marginTop: 3,
  },

  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  optionsList: {
    gap: 9,
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },

  optionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  optionDetails: {
    flex: 1,
    marginLeft: 11,
  },

  optionLabel: {
    fontSize: 13,
    fontWeight: '800',
  },

  optionDesc: {
    fontSize: 10,
    marginTop: 2,
  },

  selectedIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  updatingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 6,
  },

  updatingText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default DutyStatusSwitch;
