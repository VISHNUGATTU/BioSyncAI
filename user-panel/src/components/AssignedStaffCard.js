import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { UserCheck, Phone, Shield, Radio, Navigation } from 'lucide-react-native';
import { colors } from '../theme/colors';
import GlassCard from './GlassCard';
import PhlebotomistLiveRadarModal from './PhlebotomistLiveRadarModal';

export const AssignedStaffCard = ({ appointment }) => {
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
      <GlassCard className="bg-[#0a0a0a] border border-white/10 mb-4">
        <View className="flex-row items-center gap-3 mb-3">
          <View className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 items-center justify-center">
            <UserCheck size={20} color={colors.cyan} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5 flex-wrap">
              <Text className="text-sm font-extrabold text-white">{staff.name || 'Certified Phlebotomist'}</Text>
              <View className="flex-row items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/30">
                <Shield size={10} color={colors.emeraldLight} />
                <Text className="text-[9px] font-extrabold text-emerald-400">NABL Verified</Text>
              </View>
            </View>
            <Text className="text-[11px] text-neutral-400 mt-0.5">
              {staff.vehicleType || 'Medical Courier Motorbike'} • BioSync Field Ops
            </Text>
          </View>
          
          <View className="flex-row items-center gap-1.5">
            {isEnRoute ? (
              <TouchableOpacity 
                className="flex-row items-center gap-1 bg-cyan-400 px-2.5 py-2 rounded-xl active:opacity-80" 
                onPress={() => setRadarVisible(true)} 
                activeOpacity={0.8}
              >
                <Radio size={13} color="#000000" />
                <Text className="text-[10px] font-black text-black tracking-wider">RADAR</Text>
              </TouchableOpacity>
            ) : null}

            {staff.phone ? (
              <TouchableOpacity 
                className="flex-row items-center gap-1 bg-white/10 px-2.5 py-2 rounded-xl border border-white/10 active:opacity-80" 
                onPress={handleCall} 
                activeOpacity={0.8}
              >
                <Phone size={13} color="#ffffff" />
                <Text className="text-[10px] font-black text-white tracking-wider">CALL</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View className="flex-row justify-between pt-2.5 border-t border-white/5">
          <View className="flex-1">
            <Text className="text-[9px] font-extrabold text-neutral-400 tracking-wider">ASSIGNED FIELD PHLEBOTOMIST</Text>
            <Text className="text-xs font-bold text-neutral-300 mt-0.5">{staff.phone || 'Available via Support'}</Text>
          </View>
          <View className="items-end">
            <Text className="text-[9px] font-extrabold text-neutral-400 tracking-wider">DISPATCH STATUS</Text>
            <Text className="text-xs font-bold text-cyan-400 mt-0.5">
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
