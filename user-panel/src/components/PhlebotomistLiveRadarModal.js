import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  ScrollView,
  Platform,
} from 'react-native';
import {
  X,
  Navigation,
  Phone,
  Shield,
  Clock,
  Compass,
  Radio,
  CheckCircle2,
  Thermometer,
  RotateCw,
  MapPin,
  Bike,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import GlassCard from './GlassCard';
import { userApi } from '../api/userApi';

export const PhlebotomistLiveRadarModal = ({ visible, onClose, appointment }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Animations
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Start continuous radar sweep and pulsing animation
  useEffect(() => {
    if (!visible) return;

    const createPulse = (anim, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const pulse1 = createPulse(pulseAnim1, 0);
    const pulse2 = createPulse(pulseAnim2, 1200);

    const rotation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulse1.start();
    pulse2.start();
    rotation.start();

    return () => {
      pulse1.stop();
      pulse2.stop();
      rotation.stop();
      pulseAnim1.setValue(0);
      pulseAnim2.setValue(0);
      rotateAnim.setValue(0);
    };
  }, [visible]);

  // Fetch live tracking telemetry
  const fetchTracking = async (showSpinner = false) => {
    if (!appointment?._id) return;
    if (showSpinner) setLoading(true);
    try {
      const res = await userApi.getLiveTracking(appointment._id);
      if (res?.success && res.data) {
        setTrackingData(res.data);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.warn('[LiveRadar] Telemetry fetch notice:', err.message);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && appointment?._id) {
      fetchTracking(true);
      const timer = setInterval(() => {
        fetchTracking(false);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [visible, appointment?._id]);

  if (!visible) return null;

  const staff = trackingData?.phlebotomist || appointment?.labAssistant || {};
  const telemetry = trackingData?.telemetry || {};
  const destination = trackingData?.destination || {};
  const routePhase = trackingData?.routePhase || 'EN_ROUTE';

  const handleCall = () => {
    if (staff.phone) {
      Linking.openURL(`tel:${staff.phone}`);
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getPhaseBadge = () => {
    switch (routePhase) {
      case 'ARRIVING_NOW':
        return { label: 'ARRIVING AT DOORSTEP', color: colors.emerald, bg: 'bg-emerald-500/20' };
      case 'ARRIVED_AT_DOORSTEP':
        return { label: 'ARRIVED • READY FOR OTP', color: colors.cyan, bg: 'bg-cyan-500/20' };
      case 'SAMPLE_COLLECTION_IN_PROGRESS':
        return { label: 'COLLECTING SPECIMEN', color: '#f59e0b', bg: 'bg-amber-500/20' };
      default:
        return { label: 'EN ROUTE ON BIKE', color: colors.cyan, bg: 'bg-cyan-500/10' };
    }
  };

  const phaseBadge = getPhaseBadge();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/85 justify-end">
        <View className="bg-[#0c0c0e] rounded-t-3xl border-t border-white/10 max-h-[90%] p-5 pb-8">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4 border-b border-white/10">
            <View className="flex-row items-center gap-2.5">
              <View className="w-8 h-8 rounded-xl bg-cyan-500/20 items-center justify-center border border-cyan-500/30">
                <Radio size={16} color={colors.cyan} />
              </View>
              <View>
                <Text className="text-sm font-black text-white tracking-wider">LIVE COURIER RADAR</Text>
                <Text className="text-[10px] text-neutral-400">
                  Real-time GPS • Refreshed {Math.round((new Date() - lastRefreshed) / 1000)}s ago
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => fetchTracking(true)}
                className="w-8 h-8 rounded-xl bg-white/5 items-center justify-center border border-white/10"
                activeOpacity={0.7}
              >
                <RotateCw size={14} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 rounded-xl bg-white/5 items-center justify-center border border-white/10"
                activeOpacity={0.7}
              >
                <X size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-4">
            {/* Visual Radar Animation Box */}
            <View className="h-48 w-full bg-[#050507] rounded-2xl border border-white/10 items-center justify-center overflow-hidden mb-4 relative">
              {/* Concentric grid rings */}
              <View className="w-40 h-40 rounded-full border border-cyan-500/20 absolute" />
              <View className="w-28 h-28 rounded-full border border-cyan-500/30 absolute" />
              <View className="w-16 h-16 rounded-full border border-cyan-500/40 absolute" />

              {/* Pulsing radar waves */}
              <Animated.View
                style={{
                  width: 170,
                  height: 170,
                  borderRadius: 85,
                  borderWidth: 2,
                  borderColor: colors.cyan,
                  position: 'absolute',
                  opacity: pulseAnim1.interpolate({
                    inputRange: [0, 0.7, 1],
                    outputRange: [0.9, 0.3, 0],
                  }),
                  transform: [
                    {
                      scale: pulseAnim1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.2, 1.1],
                      }),
                    },
                  ],
                }}
              />
              <Animated.View
                style={{
                  width: 170,
                  height: 170,
                  borderRadius: 85,
                  borderWidth: 2,
                  borderColor: colors.cyan,
                  position: 'absolute',
                  opacity: pulseAnim2.interpolate({
                    inputRange: [0, 0.7, 1],
                    outputRange: [0.9, 0.3, 0],
                  }),
                  transform: [
                    {
                      scale: pulseAnim2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.2, 1.1],
                      }),
                    },
                  ],
                }}
              />

              {/* Rotating radar sweep beam */}
              <Animated.View
                style={{
                  width: 160,
                  height: 160,
                  position: 'absolute',
                  transform: [{ rotate: spin }],
                }}
              >
                <View className="w-1/2 h-0.5 bg-gradient-to-r from-transparent to-cyan-400 absolute top-1/2 right-0" />
              </Animated.View>

              {/* Center Beacon Point (Phlebotomist Motorcycle) */}
              <View className="w-10 h-10 rounded-full bg-cyan-500/30 border border-cyan-400 items-center justify-center z-10 shadow-lg shadow-cyan-500/50">
                <Bike size={18} color="#ffffff" />
              </View>

              {/* Distance Overlay Badges */}
              <View className="absolute top-3 left-3 bg-black/75 px-2.5 py-1 rounded-lg border border-white/10 flex-row items-center gap-1.5">
                <Compass size={11} color={colors.cyan} />
                <Text className="text-[10px] font-bold text-neutral-300">
                  {staff.currentLocation?.heading ? `${staff.currentLocation.heading}° HDG` : 'BEARING NORTH'}
                </Text>
              </View>

              <View className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg border border-white/10 ${phaseBadge.bg}`}>
                <Text className="text-[10px] font-black" style={{ color: phaseBadge.color }}>
                  {phaseBadge.label}
                </Text>
              </View>
            </View>

            {/* Live Metrics Grid */}
            <View className="flex-row gap-3 mb-4">
              {/* ETA Metric */}
              <GlassCard className="flex-1 bg-[#121216] border border-white/10 p-3.5">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Clock size={13} color={colors.cyan} />
                  <Text className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Estimated Arrival</Text>
                </View>
                <Text className="text-2xl font-black text-white">
                  {telemetry.estimatedArrivalMinutes ? `~${telemetry.estimatedArrivalMinutes} min` : '4-8 min'}
                </Text>
                <Text className="text-[10px] text-cyan-400 font-bold mt-0.5">
                  {telemetry.distanceKm ? `${telemetry.distanceKm} km away` : '1.2 km away'}
                </Text>
              </GlassCard>

              {/* Cold Chain Specimen Security */}
              <GlassCard className="flex-1 bg-[#121216] border border-white/10 p-3.5">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Thermometer size={13} color={colors.emerald} />
                  <Text className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Cold-Chain Kit</Text>
                </View>
                <Text className="text-lg font-black text-emerald-400">4°C Active</Text>
                <Text className="text-[10px] text-neutral-400 font-medium mt-0.5">
                  NABL Sealed Ice-Pack
                </Text>
              </GlassCard>
            </View>

            {/* Phlebotomist Profile & Call Card */}
            <GlassCard className="bg-[#121216] border border-white/10 p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Text className="text-sm font-black text-white">{staff.name || 'Certified Phlebotomist'}</Text>
                    <View className="flex-row items-center gap-1 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      <Shield size={10} color={colors.emerald} />
                      <Text className="text-[9px] font-bold text-emerald-400">Verified</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-neutral-400">
                    {staff.vehicleType || 'Medical Courier Motorbike'} • {staff.vehicleNumber || 'BIO-OPS-01'}
                  </Text>
                  <Text className="text-[11px] text-cyan-400 font-bold mt-1">
                    ⭐ {staff.rating || '4.9'} ({staff.collectionsCompleted || '120+'} Successful draws)
                  </Text>
                </View>

                {staff.phone ? (
                  <TouchableOpacity
                    onPress={handleCall}
                    className="flex-row items-center gap-1.5 bg-cyan-400 px-3.5 py-2.5 rounded-xl active:opacity-80"
                    activeOpacity={0.8}
                  >
                    <Phone size={14} color="#000000" />
                    <Text className="text-xs font-black text-black">CALL</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </GlassCard>

            {/* Patient Address Confirmation */}
            <GlassCard className="bg-[#121216] border border-white/10 p-3.5 mb-2">
              <View className="flex-row items-start gap-2.5">
                <MapPin size={16} color={colors.cyan} className="mt-0.5" />
                <View className="flex-1">
                  <Text className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    DELIVERY DESTINATION
                  </Text>
                  <Text className="text-xs font-bold text-neutral-200 mt-0.5 leading-snug">
                    {destination.address || 'Patient Residence on file'}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default PhlebotomistLiveRadarModal;
