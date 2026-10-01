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

import { colors, useTheme } from '../theme/colors';

const AppointmentCard = ({
  appointment,
  onPress,
  onCall,
  onMap,
  showActions = true,
  className = '',
}) => {
  const { isDark } = useTheme();
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
    appointment.patientName ||
    appointment.userName ||
    'Patient';

  const phone =
    patient.phone ||
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
        return colors.success;

      case 'Rejected':
      case 'Cancelled':
        return colors.danger;

      default:
        return colors.textSecondary;
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

  return (
    <View
      style={[
        {
          width: '100%',
          backgroundColor: colors.bgCard,
          borderColor: colors.borderSubtle,
          borderWidth: 1,
          borderRadius: 20,
          padding: 16,
          marginBottom: 12,
          overflow: 'hidden',
          shadowColor: isDark ? 'transparent' : '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0 : 0.05,
          shadowRadius: 8,
          elevation: isDark ? 0 : 2,
        },
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
                borderRadius: 16,
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
                style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary }}
                numberOfLines={1}
              >
                {patientName}
              </Text>

              <Text
                style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}
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
              paddingVertical: 4,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: getStatusColor(),
              backgroundColor: `${getStatusColor()}15`,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                marginRight: 6,
                backgroundColor: getStatusColor(),
              }}
            />

            <Text
              style={{
                fontSize: 11,
                fontWeight: '900',
                letterSpacing: 0.5,
                color: getStatusColor(),
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
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Appointment ID
            </Text>

            <Text
              style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, maxWidth: '65%' }}
              numberOfLines={1}
            >
              {String(appointmentId)}
            </Text>
          </View>
        ) : null}

        {/* Details */}
        <View
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
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
                size={17}
                color={colors.primary}
                strokeWidth={2}
              />
            </View>

            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Scheduled Time
              </Text>

              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textPrimary, marginTop: 2 }}>
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
                size={17}
                color={colors.primary}
                strokeWidth={2}
              />
            </View>

            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Collection Address
              </Text>

              <Text
                style={{ fontSize: 12, fontWeight: '600', color: colors.textPrimary, marginTop: 2 }}
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
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                paddingHorizontal: 14,
                borderRadius: 12,
              }}
            >
              <Phone
                size={16}
                color={colors.primary}
                strokeWidth={2.2}
              />

              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primaryLight }}>
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
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                paddingHorizontal: 14,
                borderRadius: 12,
              }}
            >
              <Navigation
                size={16}
                color={colors.primary}
                strokeWidth={2.2}
              />

              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primaryLight }}>
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
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}>
                View
              </Text>

              <ChevronRight
                size={17}
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