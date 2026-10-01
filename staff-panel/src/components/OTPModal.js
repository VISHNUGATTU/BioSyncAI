import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react-native';

import { colors } from '../theme/colors';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

const OTPModal = ({
  visible = false,
  onClose,
  onVerify,
  onResend,
  phone = '',
  title = 'Verify OTP',
  subtitle = 'Enter the verification code sent to your registered mobile number.',
  loading = false,
}) => {
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] =
    useState(RESEND_SECONDS);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      setOtp('');
      setResendTimer(RESEND_SECONDS);
      return;
    }

    const timer = setInterval(() => {
      setResendTimer((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 350);

    return () => {
      clearInterval(timer);
      clearTimeout(focusTimer);
    };
  }, [visible]);

  const handleOtpChange = (value) => {
    const cleaned = value
      .replace(/[^0-9]/g, '')
      .slice(0, OTP_LENGTH);

    setOtp(cleaned);
  };

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH || loading) {
      return;
    }

    if (onVerify) {
      await onVerify(otp);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || loading) {
      return;
    }

    try {
      if (onResend) {
        await onResend();
      }

      setOtp('');
      setResendTimer(RESEND_SECONDS);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    } catch (error) {
      console.warn(
        '[OTPModal] Resend failed:',
        error?.message || error
      );
    }
  };

  const maskedPhone = phone
    ? phone.length > 4
      ? `${phone.slice(0, 3)}••••${phone.slice(-3)}`
      : phone
    : '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />

        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <ShieldCheck
                size={23}
                color={colors.primary}
                strokeWidth={2.3}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              disabled={loading}
              style={styles.closeButton}
            >
              <X
                size={19}
                color={colors.textSecondary}
                strokeWidth={2.2}
              />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {title}
          </Text>

          <Text style={styles.subtitle}>
            {subtitle}
          </Text>

          {maskedPhone ? (
            <Text style={styles.phoneText}>
              Code sent to{' '}
              <Text style={styles.phoneValue}>
                {maskedPhone}
              </Text>
            </Text>
          ) : null}

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            {Array.from({
              length: OTP_LENGTH,
            }).map((_, index) => {
              const digit = otp[index];
              const isActive =
                index === otp.length;

              return (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    isActive &&
                      styles.otpBoxActive,
                    digit &&
                      styles.otpBoxFilled,
                  ]}
                >
                  <Text style={styles.otpDigit}>
                    {digit || ''}
                  </Text>
                </View>
              );
            })}

            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={handleOtpChange}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={OTP_LENGTH}
              editable={!loading}
              style={styles.hiddenInput}
              caretHidden
              onSubmitEditing={handleVerify}
            />
          </View>

          {/* Tap Area */}
          <TouchableOpacity
            activeOpacity={1}
            disabled={loading}
            onPress={() =>
              inputRef.current?.focus()
            }
            style={styles.inputHint}
          >
            <Text style={styles.inputHintText}>
              {otp.length === OTP_LENGTH
                ? 'OTP entered'
                : `Enter ${OTP_LENGTH}-digit code`}
            </Text>
          </TouchableOpacity>

          {/* Verify */}
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={
              otp.length !== OTP_LENGTH ||
              loading
            }
            onPress={handleVerify}
            style={[
              styles.verifyButton,
              (otp.length !== OTP_LENGTH ||
                loading) &&
                styles.verifyButtonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={colors.bgDark}
              />
            ) : otp.length === OTP_LENGTH ? (
              <>
                <CheckCircle2
                  size={18}
                  color={colors.bgDark}
                  strokeWidth={2.5}
                />

                <Text style={styles.verifyText}>
                  Verify OTP
                </Text>
              </>
            ) : (
              <Text
                style={[
                  styles.verifyText,
                  styles.verifyTextDisabled,
                ]}
              >
                Verify OTP
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendLabel}>
              Didn't receive the code?
            </Text>

            <TouchableOpacity
              activeOpacity={0.75}
              disabled={
                resendTimer > 0 || loading
              }
              onPress={handleResend}
              style={styles.resendButton}
            >
              <RotateCcw
                size={14}
                color={
                  resendTimer > 0
                    ? colors.textMuted
                    : colors.primary
                }
                strokeWidth={2.3}
              />

              <Text
                style={[
                  styles.resendText,
                  resendTimer === 0 &&
                    styles.resendTextActive,
                ]}
              >
                {resendTimer > 0
                  ? `Resend in ${resendTimer}s`
                  : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <ShieldCheck
              size={14}
              color={colors.textMuted}
              strokeWidth={2}
            />

            <Text style={styles.securityText}>
              Never share your verification code with
              anyone.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 20,

    backgroundColor:
      colors.overlayStrong,
  },

  modalContainer: {
    width: '100%',
    maxWidth: 420,

    padding: 20,

    borderRadius: 24,

    backgroundColor:
      colors.bgCardElevated,

    borderWidth: 1,
    borderColor:
      colors.borderDefault,

    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.5,
    shadowRadius: 25,

    elevation: 14,
  },

  // ─────────────────────────────────────────────
  // HEADER
  // ─────────────────────────────────────────────

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerIcon: {
    width: 48,
    height: 48,

    borderRadius: 15,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      colors.alphaCyan10,

    borderWidth: 1,
    borderColor:
      colors.borderCyanStrong,
  },

  closeButton: {
    width: 36,
    height: 36,

    borderRadius: 11,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      colors.glass,

    borderWidth: 1,
    borderColor:
      colors.borderSubtle,
  },

  // ─────────────────────────────────────────────
  // TEXT
  // ─────────────────────────────────────────────

  title: {
    color: colors.textPrimary,

    fontSize: 21,
    fontWeight: '800',

    marginTop: 18,
  },

  subtitle: {
    color: colors.textMuted,

    fontSize: 11,
    lineHeight: 17,

    marginTop: 6,
  },

  phoneText: {
    color: colors.textMuted,

    fontSize: 10,

    marginTop: 12,
  },

  phoneValue: {
    color: colors.textSecondary,
    fontWeight: '700',
  },

  // ─────────────────────────────────────────────
  // OTP
  // ─────────────────────────────────────────────

  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',

    gap: 7,

    marginTop: 24,

    position: 'relative',
  },

  otpBox: {
    width: 43,
    height: 52,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      colors.bgCard,

    borderWidth: 1,
    borderColor:
      colors.borderDefault,
  },

  otpBoxActive: {
    borderColor:
      colors.primary,

    backgroundColor:
      colors.alphaCyan05,
  },

  otpBoxFilled: {
    borderColor:
      colors.borderCyanStrong,

    backgroundColor:
      colors.alphaCyan08,
  },

  otpDigit: {
    color: colors.textPrimary,

    fontSize: 20,
    fontWeight: '800',
  },

  hiddenInput: {
    position: 'absolute',

    width: '100%',
    height: 52,

    opacity: 0,
  },

  inputHint: {
    alignItems: 'center',

    marginTop: 9,
  },

  inputHintText: {
    color: colors.textMuted,

    fontSize: 9,
    fontWeight: '500',
  },

  // ─────────────────────────────────────────────
  // VERIFY
  // ─────────────────────────────────────────────

  verifyButton: {
    height: 49,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,

    marginTop: 20,

    borderRadius: 14,

    backgroundColor:
      colors.primary,

    borderWidth: 1,
    borderColor:
      colors.primaryLight,
  },

  verifyButtonDisabled: {
    backgroundColor:
      colors.bgCard,

    borderColor:
      colors.borderDefault,
  },

  verifyText: {
    color: colors.bgDark,

    fontSize: 13,
    fontWeight: '800',
  },

  verifyTextDisabled: {
    color: colors.textMuted,
  },

  // ─────────────────────────────────────────────
  // RESEND
  // ─────────────────────────────────────────────

  resendContainer: {
    alignItems: 'center',

    marginTop: 18,
  },

  resendLabel: {
    color: colors.textMuted,

    fontSize: 10,
  },

  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 7,

    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  resendText: {
    color: colors.textMuted,

    fontSize: 11,
    fontWeight: '700',

    marginLeft: 5,
  },

  resendTextActive: {
    color: colors.primary,
  },

  // ─────────────────────────────────────────────
  // SECURITY
  // ─────────────────────────────────────────────

  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 18,
    paddingTop: 13,

    borderTopWidth: 1,
    borderTopColor:
      colors.borderSubtle,
  },

  securityText: {
    color: colors.textMuted,

    fontSize: 9,

    marginLeft: 5,
  },
});

export default OTPModal;