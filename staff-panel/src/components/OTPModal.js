import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { KeyRound, X, CircleCheck, TriangleAlert } from 'lucide-react-native';
import { colors } from '../theme/colors';

export const OTPModal = ({ visible, onClose, onVerify, patientName = 'Patient', loading = false }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleVerify = () => {
    if (!otp.trim()) {
      setError('Please enter the Collection OTP');
      return;
    }
    setError('');
    onVerify(otp.trim());
  };

  const handleClose = () => {
    setOtp('');
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <KeyRound size={22} color={colors.primaryLight} />
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Collection OTP Verification</Text>
          <Text style={styles.subtitle}>
            Ask <Text style={styles.patientHighlight}>{patientName}</Text> for the 4-6 digit collection code displayed on their BioSync patient portal.
          </Text>

          {/* OTP Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter OTP (e.g. 482910)"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={(val) => {
                setOtp(val);
                if (error) setError('');
              }}
              autoFocus
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <TriangleAlert size={14} color={colors.roseLight} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={loading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.verifyBtn, loading && { opacity: 0.6 }]}
              onPress={handleVerify}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <CircleCheck size={16} color="#fff" />
                  <Text style={styles.verifyBtnText}>Verify & Begin</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 20,
  },
  patientHighlight: {
    color: colors.primaryLight,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(12, 12, 12, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 3,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: colors.roseLight,
    fontSize: 12,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  verifyBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  verifyBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default OTPModal;
