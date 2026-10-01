import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Linking,
} from 'react-native';
import {
  X,
  Headphones,
  Phone,
  MessageCircle,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';

import { colors } from '../theme/colors';

const OpsHelpLineModal = ({
  visible = false,
  onClose,
  supportPhone,
  onCallSupport,
  onChatSupport,
  title = 'Operations Help',
  subtitle = 'Need help with an appointment or field operation?',
}) => {
  const handleCall = async () => {
    if (onCallSupport) {
      onCallSupport();
      return;
    }

    if (!supportPhone) {
      return;
    }

    try {
      const phoneUrl = `tel:${supportPhone}`;
      const supported = await Linking.canOpenURL(phoneUrl);

      if (supported) {
        await Linking.openURL(phoneUrl);
      }
    } catch (error) {
      console.warn(
        '[OpsHelpLineModal] Failed to open phone:',
        error?.message || error
      );
    }
  };

  const handleChat = () => {
    if (onChatSupport) {
      onChatSupport();
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
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />

        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Headphones
                size={21}
                color={colors.primary}
                strokeWidth={2.3}
              />
            </View>

            <View style={styles.headerContent}>
              <Text style={styles.title}>
                {title}
              </Text>

              <Text style={styles.subtitle}>
                {subtitle}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={styles.closeButton}
            >
              <X
                size={19}
                color={colors.textSecondary}
                strokeWidth={2.2}
              />
            </TouchableOpacity>
          </View>

          {/* Emergency / Priority Notice */}
          <View style={styles.notice}>
            <View style={styles.noticeIcon}>
              <ShieldCheck
                size={17}
                color={colors.success}
                strokeWidth={2.2}
              />
            </View>

            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>
                Operations Support
              </Text>

              <Text style={styles.noticeText}>
                Contact the operations team if you need
                assistance during a field visit.
              </Text>
            </View>
          </View>

          {/* Support Options */}
          <View style={styles.options}>
            {/* Call Support */}
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={handleCall}
              style={styles.option}
            >
              <View
                style={[
                  styles.optionIcon,
                  styles.callIcon,
                ]}
              >
                <Phone
                  size={19}
                  color={colors.success}
                  strokeWidth={2.3}
                />
              </View>

              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  Call Operations
                </Text>

                <Text style={styles.optionDescription}>
                  Speak directly with the support team
                </Text>

                {supportPhone ? (
                  <Text style={styles.phoneNumber}>
                    {supportPhone}
                  </Text>
                ) : null}
              </View>

              <ChevronRight
                size={19}
                color={colors.textMuted}
                strokeWidth={2}
              />
            </TouchableOpacity>

            {/* Chat Support */}
            {onChatSupport ? (
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={handleChat}
                style={styles.option}
              >
                <View
                  style={[
                    styles.optionIcon,
                    styles.chatIcon,
                  ]}
                >
                  <MessageCircle
                    size={19}
                    color={colors.primary}
                    strokeWidth={2.3}
                  />
                </View>

                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>
                    Chat with Operations
                  </Text>

                  <Text style={styles.optionDescription}>
                    Send a message to the support team
                  </Text>
                </View>

                <ChevronRight
                  size={19}
                  color={colors.textMuted}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Important Notice */}
          <View style={styles.warningBox}>
            <View style={styles.warningIcon}>
              <AlertTriangle
                size={16}
                color={colors.amber}
                strokeWidth={2.2}
              />
            </View>

            <Text style={styles.warningText}>
              For urgent safety-related situations, follow
              your organization's emergency procedures first.
            </Text>
          </View>

          {/* Close */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            style={styles.doneButton}
          >
            <Text style={styles.doneButtonText}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,

    backgroundColor: colors.overlayStrong,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 20,
  },

  modalContainer: {
    width: '100%',
    maxWidth: 430,

    backgroundColor: colors.bgCardElevated,

    borderRadius: 22,

    borderWidth: 1,
    borderColor: colors.borderDefault,

    padding: 18,

    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.45,
    shadowRadius: 24,

    elevation: 12,
  },

  // ─────────────────────────────────────────────
  // HEADER
  // ─────────────────────────────────────────────

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  headerIcon: {
    width: 44,
    height: 44,

    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.alphaCyan10,
    borderWidth: 1,
    borderColor: colors.borderCyan,
  },

  headerContent: {
    flex: 1,
    marginLeft: 11,
    paddingRight: 8,
  },

  title: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  closeButton: {
    width: 34,
    height: 34,

    borderRadius: 10,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  // ─────────────────────────────────────────────
  // NOTICE
  // ─────────────────────────────────────────────

  notice: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 18,
    padding: 12,

    borderRadius: 14,

    backgroundColor: colors.alphaCyan05,
    borderWidth: 1,
    borderColor: colors.borderCyan,
  },

  noticeIcon: {
    width: 34,
    height: 34,

    borderRadius: 10,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.alphaEmerald10,
  },

  noticeContent: {
    flex: 1,
    marginLeft: 10,
  },

  noticeTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },

  noticeText: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  // ─────────────────────────────────────────────
  // OPTIONS
  // ─────────────────────────────────────────────

  options: {
    marginTop: 14,
    gap: 9,
  },

  option: {
    minHeight: 67,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 11,
    paddingVertical: 10,

    borderRadius: 15,

    backgroundColor: colors.bgCard,

    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  optionIcon: {
    width: 40,
    height: 40,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
  },

  callIcon: {
    backgroundColor: colors.alphaEmerald10,
    borderColor: colors.alphaEmerald20,
  },

  chatIcon: {
    backgroundColor: colors.alphaCyan10,
    borderColor: colors.borderCyan,
  },

  optionContent: {
    flex: 1,
    marginLeft: 10,
    paddingRight: 8,
  },

  optionTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '750',
  },

  optionDescription: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 3,
  },

  phoneNumber: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },

  // ─────────────────────────────────────────────
  // WARNING
  // ─────────────────────────────────────────────

  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    marginTop: 14,
    padding: 11,

    borderRadius: 13,

    backgroundColor: colors.alphaAmber10,
    borderWidth: 1,
    borderColor: colors.alphaAmber20,
  },

  warningIcon: {
    marginTop: 1,
  },

  warningText: {
    flex: 1,

    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 14,

    marginLeft: 8,
  },

  // ─────────────────────────────────────────────
  // BUTTON
  // ─────────────────────────────────────────────

  doneButton: {
    height: 46,

    marginTop: 15,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.bgCard,

    borderWidth: 1,
    borderColor: colors.borderDefault,
  },

  doneButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default OpsHelpLineModal;