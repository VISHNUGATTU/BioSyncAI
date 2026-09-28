import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { UserCheck, Phone, Navigation, Bike, Car, Shield } from 'lucide-react-native';
import { colors } from '../theme/colors';
import GlassCard from './GlassCard';

export const AssignedStaffCard = ({ appointment }) => {
  if (!appointment || !appointment.labAssistant) return null;

  const staff = appointment.labAssistant;
  const status = appointment.status;

  const handleCall = () => {
    if (staff.phone) {
      Linking.openURL(`tel:${staff.phone}`);
    }
  };

  return (
    <GlassCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.avatarCircle}>
          <UserCheck size={20} color={colors.cyan} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.staffName}>{staff.name || 'Certified Phlebotomist'}</Text>
            <View style={styles.verifiedBadge}>
              <Shield size={10} color={colors.emeraldLight} />
              <Text style={styles.verifiedText}>NABL Verified</Text>
            </View>
          </View>
          <Text style={styles.vehicleText}>
            {staff.vehicleType || 'Medical Courier Motorbike'} • BioSync Field Ops
          </Text>
        </View>
        
        {staff.phone ? (
          <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.8}>
            <Phone size={16} color="#000000" />
            <Text style={styles.callBtnText}>CALL</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.telemetryRow}>
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>ASSIGNED FIELD PHLEBOTOMIST</Text>
          <Text style={styles.telemetryVal}>{staff.phone || 'Available via Support'}</Text>
        </View>
        <View style={styles.telemetryItemRight}>
          <Text style={styles.telemetryLabel}>DISPATCH STATUS</Text>
          <Text style={[styles.telemetryVal, { color: colors.cyan }]}>
            {status.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  staffName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.emeraldLight,
  },
  vehicleText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.cyan,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  callBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  telemetryItem: {
    flex: 1,
  },
  telemetryItemRight: {
    alignItems: 'flex-end',
  },
  telemetryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  telemetryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default AssignedStaffCard;
