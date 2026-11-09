import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import {
  MapPin,
  Phone,
  Navigation,
  Clock3,
  User,
  ChevronRight,
} from 'lucide-react-native';

import { useTheme } from '../theme/ThemeContext';

const AppointmentCard = ({
  appointment,
  onPress,
  onCall,
  onMap,
  showActions = true,
  className = '',
}) => {
  const { colors, isDark, shadows } = useTheme();
  if (!appointment) {
    return null;
  }

  const patient =
    appointment.patient ||
    appointment.user ||
    {};

  const patientName =
    patient.name ||
    patient.fullName ||
    (patient.firstName ? `${patient.firstName} ${patient.lastName || ''}`.trim() : '') ||
    appointment.patientName ||
    appointment.userName ||
    'Patient';

  const phone =
    patient.phone ||
    patient.phoneNumber ||
    patient.mobile ||
    appointment.phone ||
    appointment.patientPhone ||
    '';

  const rawAddress =
    appointment.address ||
    patient.address ||
    appointment.collectionAddress ||
    appointment.location?.address ||
    'Address not available';

  const address =
    typeof rawAddress === 'string'
      ? rawAddress
      : typeof rawAddress === 'object' && rawAddress !== null
      ? [
          rawAddress.houseNumber,
          rawAddress.street,
          rawAddress.landmark,
          rawAddress.city,
          rawAddress.state,
          rawAddress.pincode || rawAddress.postalCode,
        ]
          .filter(Boolean)
          .join(', ') || 'Address on file'
      : 'Address not available';

  const appointmentTime =
    appointment.timeSlot ||
    appointment.time ||
    appointment.appointmentTime ||
    appointment.scheduledTime ||
    appointment.slot ||
    '--';

  const status =
    appointment.status ||
    'Pending';

  const appointmentType =
    appointment.type ||
    appointment.appointmentType ||
    'Home Collection';

  const appointmentId =
    appointment.appointmentId ||
    appointment._id ||
    appointment.id;

  const getStatusColor = () => {
    switch (status) {
      case 'On_The_Way':
      case 'On_Route':
        return colors.blue;

      case 'Arrived':
        return colors.amber;

      case 'Collecting':
        return colors.primary;

      case 'Completed':
      case 'Report_Generated':
      case 'Sample_Collected':
        return colors.success;

      case 'Rejected':
      case 'Cancelled':
      case 'Failed':
      case 'No_Show':
        return colors.danger;

      default:
        return colors.amber;
    }
  };

  const getStatusLabel = () => {
    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const handleCardPress = () => {
    if (onPress) {
      onPress(appointment);
    }
  };

  const handleCall = () => {
    if (onCall && phone) {
      onCall(phone, appointment);
    }
  };

  const handleMap = () => {
    if (onMap) {
      onMap(appointment);
    }
  };

  const statusColor = getStatusColor();

  return (
    <View
      style={[
        {
          width: '100%',
          backgroundColor: colors.bgCard,
          borderColor: isDark ? colors.borderSubtle : colors.borderDefault,
          borderWidth: 1,
          borderRadius: 20,
          padding: 16,
          marginBottom: 12,
          overflow: 'hidden',
        },
        shadows?.sm,
      ]}
    >
      {/* Clickable Card Body (Header + ID + Details) */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleCardPress}
        disabled={!onPress}
        style={{ width: '100%' }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 15,
                backgroundColor: colors.alphaCyan10,
                borderWidth: 1,
                borderColor: colors.borderCyan,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User
                size={20}
                color={colors.primary}
                strokeWidth={2.2}
              />
            </View>

            <View style={{ flex: 1, justifyContent: 'center', minWidth: 0 }}>
              <Text
                style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.2 }}
                numberOfLines={1}
              >
                {patientName}
              </Text>

              <Text
                style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 2 }}
                numberOfLines={1}
              >
                {appointmentType}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: `${statusColor}40`,
              backgroundColor: `${statusColor}16`,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                marginRight: 6,
                backgroundColor: statusColor,
              }}
            />

            <Text
              style={{
                fontSize: 10,
                fontWeight: '900',
                letterSpacing: 0.4,
                textTransform: 'uppercase',
                color: statusColor,
              }}
            >
              {getStatusLabel()}
            </Text>
          </View>
        </View>

        {/* Appointment ID */}
        {appointmentId ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : colors.bgCardSoft,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Appointment ID
            </Text>

            <Text
              style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, maxWidth: '65%', fontVariant: ['tabular-nums'] }}
              numberOfLines={1}
            >
              {String(appointmentId)}
            </Text>
          </View>
        ) : null}

        {/* Details */}
        <View
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.025)' : colors.bgCardSoft,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            borderRadius: 16,
            padding: 12,
            gap: 10,
            marginBottom: showActions ? 14 : 0,
          }}
        >
          {/* Time */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: colors.alphaCyan10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock3
                size={16}
                color={colors.primary}
                strokeWidth={2.1}
              />
            </View>

            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={{ fontSize: 9.5, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Scheduled Time
              </Text>

              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginTop: 2 }}>
                {appointmentTime}
              </Text>
            </View>
          </View>

          {/* Address */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: colors.alphaCyan10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapPin
                size={16}
                color={colors.primary}
                strokeWidth={2.1}
              />
            </View>

            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={{ fontSize: 9.5, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Collection Address
              </Text>

              <Text
                style={{ fontSize: 12, fontWeight: '600', color: colors.textPrimary, marginTop: 2, lineHeight: 17 }}
                numberOfLines={2}
              >
                {address}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Actions (Clean Sibling Row - ZERO nested touchables) */}
      {showActions && (
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: colors.borderSubtle,
          }}
        >
          {onCall && phone ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCall}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                height: 40,
                gap: 6,
                backgroundColor: colors.alphaEmerald10,
                borderWidth: 1,
                borderColor: colors.alphaEmerald20,
                paddingHorizontal: 14,
                borderRadius: 12,
              }}
            >
              <Phone
                size={15}
                color={colors.emeraldLight}
                strokeWidth={2.2}
              />

              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.emeraldLight }}>
                Call
              </Text>
            </TouchableOpacity>
          ) : null}

          {onMap ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleMap}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                height: 40,
                gap: 6,
                backgroundColor: colors.alphaCyan10,
                borderWidth: 1,
                borderColor: colors.borderCyan,
                paddingHorizontal: 14,
                borderRadius: 12,
              }}
            >
              <Navigation
                size={15}
                color={colors.primaryLight}
                strokeWidth={2.2}
              />

              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primaryLight }}>
                Map
              </Text>
            </TouchableOpacity>
          ) : null}

          {onPress ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCardPress}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                height: 40,
                gap: 4,
                backgroundColor: colors.primary,
                paddingHorizontal: 14,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.4 }}>
                View
              </Text>

              <ChevronRight
                size={16}
                color="#FFFFFF"
                strokeWidth={2.5}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
};

export default AppointmentCard;
