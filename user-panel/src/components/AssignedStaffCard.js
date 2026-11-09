import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { UserCheck, Phone, Shield, Radio, Navigation } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import GlassCard from './GlassCard';
import PhlebotomistLiveRadarModal from './PhlebotomistLiveRadarModal';

export const AssignedStaffCard = ({ appointment }) => {
  const { colors, isDark } = useTheme();
  const [radarVisible, setRadarVisible] = useState(false);

  if (!appointment || !appointment.labAssistant) return null;

  const staff = appointment.labAssistant;
  const status = appointment.status;

  const handleCall = () => {
    if (staff.phone) {
      Linking.openURL(`tel:${staff.phone}`);
    }
  };

  const isEnRoute = ['On_Route', 'On_The_Way', 'Arrived', 'Collecting', 'Assistant_Assigned', 'Assigned'].includes(status);

  return (
    <>
      <GlassCard style={{ marginBottom: 16 }}>
        <View className="flex-row items-center gap-3 mb-3">
          <View
            className="w-11 h-11 rounded-2xl border items-center justify-center"
            style={{ backgroundColor: colors.cyanGlow, borderColor: colors.borderCyan }}
          >
            <UserCheck size={20} color={colors.cyan} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5 flex-wrap">
              <Text className="text-sm font-extrabold" style={{ color: colors.textPrimary }}>
                {staff.name || 'Certified Phlebotomist'}
              </Text>
              <View
                className="flex-row items-center gap-1 px-1.5 py-0.5 rounded-md border"
                style={{ backgroundColor: colors.emeraldGlow, borderColor: colors.emerald }}
              >
                <Shield size={10} color={colors.emerald} />
                <Text className="text-[9px] font-extrabold" style={{ color: colors.emerald }}>
                  NABL Verified
                </Text>
              </View>
            </View>
            <Text className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
              {staff.vehicleType || 'Medical Courier Motorbike'} • BioSync Field Ops
            </Text>
          </View>
          
          <View className="flex-row items-center gap-1.5">
            {isEnRoute ? (
              <TouchableOpacity 
                className="flex-row items-center gap-1 px-2.5 py-2 rounded-xl active:opacity-80"
                style={{ backgroundColor: colors.cyan }}
                onPress={() => setRadarVisible(true)} 
                activeOpacity={0.8}
              >
                <Radio size={13} color={isDark ? '#000000' : '#ffffff'} />
                <Text
                  className="text-[10px] font-black tracking-wider"
                  style={{ color: isDark ? '#000000' : '#ffffff' }}
                >
                  RADAR
                </Text>
              </TouchableOpacity>
            ) : null}

            {staff.phone ? (
              <TouchableOpacity 
                className="flex-row items-center gap-1 px-2.5 py-2 rounded-xl border active:opacity-80"
                style={{
                  backgroundColor: colors.bgCardSurface,
                  borderColor: colors.borderSubtle,
                }}
                onPress={handleCall} 
                activeOpacity={0.8}
              >
                <Phone size={13} color={colors.textPrimary} />
                <Text
                  className="text-[10px] font-black tracking-wider"
                  style={{ color: colors.textPrimary }}
                >
                  CALL
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View
          className="flex-row justify-between pt-2.5 border-t"
          style={{ borderTopColor: colors.borderSubtle }}
        >
          <View className="flex-1">
            <Text className="text-[9px] font-extrabold tracking-wider" style={{ color: colors.textMuted }}>
              ASSIGNED FIELD PHLEBOTOMIST
            </Text>
            <Text className="text-xs font-bold mt-0.5" style={{ color: colors.textPrimary }}>
              {staff.phone || 'Available via Support'}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-[9px] font-extrabold tracking-wider" style={{ color: colors.textMuted }}>
              DISPATCH STATUS
            </Text>
            <Text className="text-xs font-bold mt-0.5" style={{ color: colors.cyan }}>
              {status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>
      </GlassCard>

      <PhlebotomistLiveRadarModal
        visible={radarVisible}
        onClose={() => setRadarVisible(false)}
        appointment={appointment}
      />
    </>
  );
};

export default AssignedStaffCard;
