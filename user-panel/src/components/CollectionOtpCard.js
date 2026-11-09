import React from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { KeyRound, ShieldCheck, CheckCircle2, Clock, Sparkles } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import GlassCard from './GlassCard';

export const CollectionOtpCard = ({ appointment }) => {
  const { colors, isDark } = useTheme();
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
    <GlassCard
      style={{
        marginBottom: 16,
        borderColor: isArrived ? colors.emerald : colors.borderSubtle,
        backgroundColor: isArrived
          ? (isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(5, 150, 105, 0.06)')
          : colors.bgCardElevated,
      }}
    >
      {/* Top Banner */}
      <View className="flex-row items-center gap-3 mb-3.5">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center border"
          style={{
            backgroundColor: isArrived ? colors.emeraldGlow : colors.cyanGlow,
            borderColor: isArrived ? colors.emerald : colors.borderCyan,
          }}
        >
          <KeyRound size={20} color={isArrived ? colors.emerald : colors.cyan} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-extrabold" style={{ color: colors.textPrimary }}>
            Home Collection Authorization
          </Text>
          <Text className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
            Secure handshake code for phlebotomist
          </Text>
        </View>
        {isCollected ? (
          <View
            className="flex-row items-center gap-1 px-2 py-1 rounded-lg border"
            style={{ backgroundColor: colors.emeraldGlow, borderColor: colors.emerald }}
          >
            <CheckCircle2 size={13} color={colors.emerald} />
            <Text className="text-[10px] font-black tracking-wider" style={{ color: colors.emerald }}>
              VERIFIED
            </Text>
          </View>
        ) : isCollecting ? (
          <View
            className="flex-row items-center gap-1 px-2 py-1 rounded-lg border"
            style={{ backgroundColor: colors.cyanGlow, borderColor: colors.cyan }}
          >
            <Sparkles size={13} color={colors.cyan} />
            <Text className="text-[10px] font-black tracking-wider" style={{ color: colors.cyan }}>
              COLLECTING
            </Text>
          </View>
        ) : isArrived ? (
          <View className="px-2.5 py-1 rounded-lg" style={{ backgroundColor: colors.emerald }}>
            <Text className="text-[10px] font-black tracking-wider" style={{ color: '#ffffff' }}>
              SHOW NOW
            </Text>
          </View>
        ) : null}
      </View>

      {/* The Giant OTP Display Box */}
      <TouchableOpacity 
        className="border rounded-2xl py-3.5 px-4 items-center mb-3 active:opacity-80"
        style={{
          backgroundColor: isArrived
            ? (isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(5, 150, 105, 0.08)')
            : colors.bgCardSurface,
          borderColor: isArrived ? colors.emerald : colors.borderSubtle,
        }}
        onPress={handleCopyOtp}
        activeOpacity={0.8}
      >
        <Text className="text-[10px] font-black tracking-widest mb-2" style={{ color: colors.textSecondary }}>
          PATIENT VERIFICATION OTP
        </Text>
        <View className="flex-row justify-center gap-2.5">
          {otp.split('').map((digit, idx) => (
            <View 
              key={idx} 
              className="w-11 h-13 py-2 rounded-xl border items-center justify-center"
              style={{
                backgroundColor: isArrived
                  ? (isDark ? '#12331f' : '#ecfdf5')
                  : colors.bgCardElevated,
                borderColor: isArrived ? colors.emerald : colors.borderMedium,
              }}
            >
              <Text 
                className="text-2xl font-black"
                style={{
                  color: isArrived ? colors.emerald : colors.cyan,
                  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                }}
              >
                {digit}
              </Text>
            </View>
          ))}
        </View>
        <Text className="text-[10px] mt-2" style={{ color: colors.textMuted }}>
          Tap to view details
        </Text>
      </TouchableOpacity>

      {/* Dynamic Handshake Instructions */}
      <View
        className="rounded-xl p-2.5"
        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.bgCardSurface }}
      >
        {isCollected ? (
          <View className="flex-row items-center gap-2">
            <CheckCircle2 size={16} color={colors.emerald} />
            <Text className="flex-1 text-[11px] leading-4" style={{ color: colors.textSecondary }}>
              OTP verified successfully. Specimens are sealed in 4°C cold storage and dispatched.
            </Text>
          </View>
        ) : isCollecting ? (
          <View className="flex-row items-center gap-2">
            <Sparkles size={16} color={colors.cyan} />
            <Text className="flex-1 text-[11px] leading-4" style={{ color: colors.textSecondary }}>
              Handshake complete. Phlebotomist is drawing blood & recording vital markers.
            </Text>
          </View>
        ) : isArrived ? (
          <View className="flex-row items-center gap-2">
            <ShieldCheck size={16} color={colors.emerald} />
            <Text className="flex-1 text-[11px] font-bold leading-4" style={{ color: colors.emerald }}>
              Phlebotomist is at your door! Read this 4-digit code to authorize sample collection.
            </Text>
          </View>
        ) : isEnRoute ? (
          <View className="flex-row items-center gap-2">
            <Clock size={16} color={colors.amber} />
            <Text className="flex-1 text-[11px] leading-4" style={{ color: colors.textSecondary }}>
              Phlebotomist is traveling to your location. Keep this code ready for when they arrive.
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-2">
            <ShieldCheck size={16} color={colors.textMuted} />
            <Text className="flex-1 text-[11px] leading-4" style={{ color: colors.textSecondary }}>
              Assigned phlebotomist will ask for this code before taking any biological samples.
            </Text>
          </View>
        )}
      </View>
    </GlassCard>
  );
};

export default CollectionOtpCard;
