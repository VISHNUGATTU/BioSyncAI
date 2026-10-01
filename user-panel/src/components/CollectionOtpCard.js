import React from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { KeyRound, ShieldCheck, CheckCircle2, Clock, Sparkles } from 'lucide-react-native';
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
    <GlassCard className={`mb-4 border ${isArrived ? 'bg-[#06130b] border-emerald-500' : 'bg-[#0a0a0a] border-white/10'}`}>
      {/* Top Banner */}
      <View className="flex-row items-center gap-3 mb-3.5">
        <View className={`w-10 h-10 rounded-xl items-center justify-center border ${isArrived ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-cyan-500/10 border-cyan-500/30'}`}>
          <KeyRound size={20} color={isArrived ? colors.emeraldLight : colors.cyan} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-extrabold text-white">Home Collection Authorization</Text>
          <Text className="text-[11px] text-neutral-400 mt-0.5">Secure handshake code for phlebotomist</Text>
        </View>
        {isCollected ? (
          <View className="flex-row items-center gap-1 bg-emerald-500/15 border border-emerald-500/40 px-2 py-1 rounded-lg">
            <CheckCircle2 size={13} color={colors.emeraldLight} />
            <Text className="text-[10px] font-black text-emerald-400 tracking-wider">VERIFIED</Text>
          </View>
        ) : isCollecting ? (
          <View className="flex-row items-center gap-1 bg-cyan-500/15 border border-cyan-500/40 px-2 py-1 rounded-lg">
            <Sparkles size={13} color={colors.cyan} />
            <Text className="text-[10px] font-black text-cyan-400 tracking-wider">COLLECTING</Text>
          </View>
        ) : isArrived ? (
          <View className="bg-emerald-500 px-2.5 py-1 rounded-lg">
            <Text className="text-[10px] font-black text-black tracking-wider">SHOW NOW</Text>
          </View>
        ) : null}
      </View>

      {/* The Giant OTP Display Box */}
      <TouchableOpacity 
        className={`border rounded-2xl py-3.5 px-4 items-center mb-3 active:opacity-80 ${isArrived ? 'bg-[#0a1e12] border-emerald-500/40' : 'bg-[#121212] border-white/10'}`} 
        onPress={handleCopyOtp}
        activeOpacity={0.8}
      >
        <Text className="text-[10px] font-black tracking-widest text-neutral-400 mb-2">PATIENT VERIFICATION OTP</Text>
        <View className="flex-row justify-center gap-2.5">
          {otp.split('').map((digit, idx) => (
            <View 
              key={idx} 
              className={`w-11 h-13 py-2 rounded-xl border items-center justify-center ${isArrived ? 'bg-[#12331f] border-emerald-400' : 'bg-[#181818] border-white/15'}`}
            >
              <Text 
                className={`text-2xl font-black ${isArrived ? 'text-white' : 'text-cyan-400'}`}
                style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
              >
                {digit}
              </Text>
            </View>
          ))}
        </View>
        <Text className="text-[10px] text-neutral-400 mt-2">Tap to view details</Text>
      </TouchableOpacity>

      {/* Dynamic Handshake Instructions */}
      <View className="bg-white/5 rounded-xl p-2.5">
        {isCollected ? (
          <View className="flex-row items-center gap-2">
            <CheckCircle2 size={16} color={colors.emeraldLight} />
            <Text className="flex-1 text-[11px] text-neutral-300 leading-4">
              OTP verified successfully. Specimens are sealed in 4°C cold storage and dispatched.
            </Text>
          </View>
        ) : isCollecting ? (
          <View className="flex-row items-center gap-2">
            <Sparkles size={16} color={colors.cyan} />
            <Text className="flex-1 text-[11px] text-neutral-300 leading-4">
              Handshake complete. Phlebotomist is drawing blood & recording vital markers.
            </Text>
          </View>
        ) : isArrived ? (
          <View className="flex-row items-center gap-2">
            <ShieldCheck size={16} color={colors.emeraldLight} />
            <Text className="flex-1 text-[11px] text-emerald-400 font-bold leading-4">
              Phlebotomist is at your door! Read this 4-digit code to authorize sample collection.
            </Text>
          </View>
        ) : isEnRoute ? (
          <View className="flex-row items-center gap-2">
            <Clock size={16} color={colors.amberLight} />
            <Text className="flex-1 text-[11px] text-neutral-300 leading-4">
              Phlebotomist is traveling to your location. Keep this code ready for when they arrive.
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-2">
            <ShieldCheck size={16} color={colors.textMuted} />
            <Text className="flex-1 text-[11px] text-neutral-300 leading-4">
              Assigned phlebotomist will ask for this code before taking any biological samples.
            </Text>
          </View>
        )}
      </View>
    </GlassCard>
  );
};

export default CollectionOtpCard;
