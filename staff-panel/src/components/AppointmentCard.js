import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import {
  Phone,
  Navigation,
  Clock,
  MapPin,
  ChevronRight,
  FlaskConical,
  KeyRound,
} from 'lucide-react-native';
import { colors, shadows } from '../theme/colors';
import GlassCard from './GlassCard';
import StatusBadge from './StatusBadge';

export const AppointmentCard = ({ appointment, onPress, onNavigate }) => {
  if (!appointment) return null;

  const user = appointment.user || {};
  const patientName = user.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Patient';

  const address = appointment.address || user.address || {};
  const addressText = typeof address === 'string'
    ? address
    : [
        address.houseNumber,
        address.street,
        address.landmark,
        address.city,
        address.pincode || address.postalCode,
      ].filter(Boolean).join(', ') || 'Address on file';

  const rawTests = appointment.tests || (appointment.testCatalog ? [appointment.testCatalog] : []);
  const tests = Array.isArray(rawTests) ? rawTests.filter(Boolean) : [];
  const testNames = tests.map((t) => (t && typeof t === 'object' ? (t.testName || t.name || 'Lab Panel') : 'Lab Panel')).filter(Boolean);

  const formattedDate = appointment.scheduledDate
    ? new Date(appointment.scheduledDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      })
    : 'Today';

  const handleCall = (e) => {
    e?.stopPropagation?.();
    const phone = user.phoneNumber || user.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleOpenMaps = (e) => {
    e?.stopPropagation?.();
    if (onNavigate) {
      onNavigate(appointment);
    } else {
      const query = encodeURIComponent(addressText);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={() => onPress && onPress(appointment)}>
      <GlassCard style={styles.card}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={styles.patientInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user.firstName?.[0] || 'P').toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.patientName}>{patientName}</Text>
              <View style={styles.timeSlotRow}>
                <Clock size={11} color={colors.textSecondary} />
                <Text style={styles.timeSlot}>
                  {formattedDate} • {appointment.timeSlot || '09:00 - 10:00 AM'}
                </Text>
              </View>
            </View>
          </View>

          <StatusBadge status={appointment.status} size="small" />
        </View>

        {/* Address */}
        <View style={styles.addressRow}>
          <MapPin size={13} color={colors.primaryLight} style={styles.addressIcon} />
          <Text style={styles.addressText} numberOfLines={2}>
            {addressText}
          </Text>
        </View>

        {/* Tests Badges */}
        {testNames.length > 0 && (
          <View style={styles.testsContainer}>
            {testNames.slice(0, 3).map((test, index) => (
              <View key={index} style={styles.testBadge}>
                <FlaskConical size={10} color={colors.textCyan} />
                <Text style={styles.testBadgeText} numberOfLines={1}>
                  {test}
                </Text>
              </View>
            ))}
            {testNames.length > 3 && (
              <View style={styles.testBadgeMore}>
                <Text style={styles.testBadgeMoreText}>+{testNames.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* Actions Bar */}
        <View style={styles.actionsBar}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleCall} activeOpacity={0.7}>
              <Phone size={14} color={colors.emeraldLight} />
              <Text style={styles.iconBtnText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={handleOpenMaps} activeOpacity={0.7}>
              <Navigation size={14} color={colors.primaryLight} />
              <Text style={styles.iconBtnText}>Map</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rightAction}>
            <Text style={styles.viewDetailsText}>Servicing Flow</Text>
            <ChevronRight size={14} color={colors.primaryLight} />
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeSlot: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
  },
  addressIcon: {
    marginTop: 2,
    marginRight: 6,
  },
  addressText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    flex: 1,
  },
  testsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  testBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderColor: 'rgba(6, 182, 212, 0.2)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  testBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textCyan,
  },
  testBadgeMore: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  testBadgeMoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  leftActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryLight,
  },
});

export default AppointmentCard;
