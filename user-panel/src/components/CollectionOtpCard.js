import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { KeyRound, ShieldCheck, CheckCircle2, Clock, Sparkles, Copy } from 'lucide-react-native';
import { colors } from '../theme/colors';
import GlassCard from './GlassCard';

export const CollectionOtpCard = ({ appointment }) => {
  if (!appointment) return null;

  const otp = appointment.collectionOTP || '—';
  const status = appointment.status;

  const isArrived = status === 'Arrived';
  const isCollecting = status === 'Collecting';
  const isCollected = ['Sample_Collected', 'At_Laboratory', 'Processing', 'Report_Generated', 'Completed'].includes(status);
  const isEnRoute = ['On_The_Way', 'On_Route'].includes(status);

  const handleCopyOtp = () => {
    Alert.alert('Collection OTP', `Your Verification OTP is: ${otp}\nShare this with the phlebotomist upon arrival.`);
  };

  return (
    <GlassCard style={[styles.card, isArrived && styles.cardArrivedGlow]}>
      {/* Top Banner */}
      <View style={styles.headerRow}>
        <View style={[styles.iconCircle, isArrived ? styles.iconCircleActive : styles.iconCircleDefault]}>
          <KeyRound size={20} color={isArrived ? colors.emeraldLight : colors.cyan} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Home Collection Authorization</Text>
          <Text style={styles.subtitle}>Secure handshake code for phlebotomist</Text>
        </View>
        {isCollected ? (
          <View style={styles.verifiedBadge}>
            <CheckCircle2 size={13} color={colors.emeraldLight} />
            <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
          </View>
        ) : isCollecting ? (
          <View style={styles.collectingBadge}>
            <Sparkles size={13} color={colors.cyan} />
            <Text style={styles.collectingBadgeText}>COLLECTING</Text>
          </View>
        ) : isArrived ? (
          <View style={styles.arrivedBadge}>
            <Text style={styles.arrivedBadgeText}>SHOW NOW</Text>
          </View>
        ) : null}
      </View>

      {/* The Giant OTP Display Box */}
      <TouchableOpacity 
        style={[styles.otpBox, isArrived && styles.otpBoxArrived]} 
        onPress={handleCopyOtp}
        activeOpacity={0.8}
      >
        <Text style={styles.otpLabel}>PATIENT VERIFICATION OTP</Text>
        <View style={styles.otpDigitsContainer}>
          {otp.split('').map((digit, idx) => (
            <View key={idx} style={[styles.digitCell, isArrived && styles.digitCellArrived]}>
              <Text style={[styles.digitText, isArrived && styles.digitTextArrived]}>{digit}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.otpHint}>Tap to view details</Text>
      </TouchableOpacity>

      {/* Dynamic Handshake Instructions */}
      <View style={styles.instructionBox}>
        {isCollected ? (
          <View style={styles.statusMsgRow}>
            <CheckCircle2 size={16} color={colors.emeraldLight} />
            <Text style={styles.statusMsgText}>
              OTP verified successfully. Specimens are sealed in 4°C cold storage and dispatched.
            </Text>
          </View>
        ) : isCollecting ? (
          <View style={styles.statusMsgRow}>
            <Sparkles size={16} color={colors.cyan} />
            <Text style={styles.statusMsgText}>
              Handshake complete. Phlebotomist is drawing blood & recording vital markers.
            </Text>
          </View>
        ) : isArrived ? (
          <View style={styles.statusMsgRow}>
            <ShieldCheck size={16} color={colors.emeraldLight} />
            <Text style={[styles.statusMsgText, { color: colors.emeraldLight, fontWeight: '700' }]}>
              Phlebotomist is at your door! Read this 4-digit code to authorize sample collection.
            </Text>
          </View>
        ) : isEnRoute ? (
          <View style={styles.statusMsgRow}>
            <Clock size={16} color={colors.amberLight} />
            <Text style={styles.statusMsgText}>
              Phlebotomist is traveling to your location. Keep this code ready for when they arrive.
            </Text>
          </View>
        ) : (
          <View style={styles.statusMsgRow}>
            <ShieldCheck size={16} color={colors.textMuted} />
            <Text style={styles.statusMsgText}>
              Assigned phlebotomist will ask for this code before taking any biological samples.
            </Text>
          </View>
        )}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 16,
  },
  cardArrivedGlow: {
    borderColor: colors.emerald,
    backgroundColor: '#06130b',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconCircleDefault: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  iconCircleActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.emeraldLight,
    letterSpacing: 0.5,
  },
  collectingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  collectingBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.cyan,
    letterSpacing: 0.5,
  },
  arrivedBadge: {
    backgroundColor: colors.emerald,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  arrivedBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  otpBox: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  otpBoxArrived: {
    backgroundColor: '#0a1e12',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  otpLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginBottom: 8,
  },
  otpDigitsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  digitCell: {
    width: 44,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitCellArrived: {
    backgroundColor: '#12331f',
    borderColor: colors.emeraldLight,
  },
  digitText: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.cyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  digitTextArrived: {
    color: '#ffffff',
  },
  otpHint: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 8,
  },
  instructionBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 10,
  },
  statusMsgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusMsgText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});

export default CollectionOtpCard;
