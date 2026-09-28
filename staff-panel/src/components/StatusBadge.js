import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Clock,
  Navigation,
  MapPin,
  TestTube,
  CircleCheck,
  CircleAlert,
  Building,
  Activity,
  Sparkles,
} from 'lucide-react-native';
import { colors } from '../theme/colors';

export const StatusBadge = ({ status = 'Pending', size = 'medium' }) => {
  const getConfig = () => {
    switch (status) {
      case 'On_The_Way':
      case 'On_Route':
        return {
          label: 'On Route',
          color: colors.primaryLight,
          bg: 'rgba(6, 182, 212, 0.12)',
          border: 'rgba(6, 182, 212, 0.25)',
          icon: Navigation,
        };
      case 'Arrived':
        return {
          label: 'At Location',
          color: colors.emeraldLight,
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.25)',
          icon: MapPin,
        };
      case 'Collecting':
        return {
          label: 'Collecting Sample',
          color: colors.violetLight,
          bg: 'rgba(139, 92, 246, 0.12)',
          border: 'rgba(139, 92, 246, 0.25)',
          icon: TestTube,
        };
      case 'Sample_Collected':
        return {
          label: 'Sample Collected',
          color: colors.emeraldLight,
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.25)',
          icon: CircleCheck,
        };
      case 'At_Laboratory':
        return {
          label: 'At Laboratory',
          color: '#60a5fa',
          bg: 'rgba(96, 165, 250, 0.12)',
          border: 'rgba(96, 165, 250, 0.25)',
          icon: Building,
        };
      case 'Processing':
        return {
          label: 'Lab Processing',
          color: colors.violetLight,
          bg: 'rgba(139, 92, 246, 0.12)',
          border: 'rgba(139, 92, 246, 0.25)',
          icon: Activity,
        };
      case 'Completed':
      case 'Report_Generated':
      case 'Results Entered':
        return {
          label: status === 'Results Entered' ? 'Results Entered' : 'Completed',
          color: colors.emeraldLight,
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.25)',
          icon: CircleCheck,
        };
      case 'Results Ready':
        return {
          label: 'Results Ready',
          color: colors.emeraldLight,
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.35)',
          icon: Sparkles,
        };
      case 'Res yet to be obtained':
        return {
          label: 'Res yet to be obtained',
          color: colors.amberLight,
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.35)',
          icon: Clock,
        };
      case 'Failed':
      case 'Cancelled':
      case 'No_Show':
      case 'Rejected':
        return {
          label: status.replace('_', ' '),
          color: colors.roseLight,
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.25)',
          icon: CircleAlert,
        };
      case 'Assistant_Assigned':
      case 'Assigned':
      default:
        return {
          label: 'Assigned',
          color: colors.amberLight,
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.25)',
          icon: Clock,
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          paddingVertical: isSmall ? 3 : 5,
          paddingHorizontal: isSmall ? 8 : 10,
        },
      ]}
    >
      <Icon size={isSmall ? 10 : 12} color={config.color} />
      <Text style={[styles.text, { color: config.color, fontSize: isSmall ? 10 : 11 }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default StatusBadge;
