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

export const StatusBadge = ({
  status = 'Pending',
  size = 'medium',
}) => {
  const getConfig = () => {
    switch (status) {
      case 'On_The_Way':
      case 'On_Route':
        return {
          label: 'On Route',
          color: colors.primaryLight,
          bg: colors.alphaCyan10,
          border: colors.borderCyan,
          icon: Navigation,
        };

      case 'Arrived':
        return {
          label: 'At Location',
          color: colors.successLight,
          bg: colors.alphaEmerald10,
          border: colors.alphaEmerald20,
          icon: MapPin,
        };

      case 'Collecting':
        return {
          label: 'Collecting Sample',
          color: colors.purpleLight,
          bg: colors.alphaPurple10 || 'rgba(139, 92, 246, 0.10)',
          border:
            colors.alphaPurple20 ||
            'rgba(139, 92, 246, 0.22)',
          icon: TestTube,
        };

      case 'Sample_Collected':
        return {
          label: 'Sample Collected',
          color: colors.successLight,
          bg: colors.alphaEmerald10,
          border: colors.alphaEmerald20,
          icon: CircleCheck,
        };

      case 'At_Laboratory':
        return {
          label: 'At Laboratory',
          color: colors.blueLight,
          bg: 'rgba(59, 130, 246, 0.10)',
          border: 'rgba(59, 130, 246, 0.22)',
          icon: Building,
        };

      case 'Processing':
        return {
          label: 'Lab Processing',
          color: colors.purpleLight,
          bg:
            colors.alphaPurple10 ||
            'rgba(139, 92, 246, 0.10)',
          border:
            colors.alphaPurple20 ||
            'rgba(139, 92, 246, 0.22)',
          icon: Activity,
        };

      case 'Completed':
      case 'Report_Generated':
      case 'Results Entered':
        return {
          label:
            status === 'Results Entered'
              ? 'Results Entered'
              : 'Completed',
          color: colors.successLight,
          bg: colors.alphaEmerald10,
          border: colors.alphaEmerald20,
          icon: CircleCheck,
        };

      case 'Results Ready':
        return {
          label: 'Results Ready',
          color: colors.successLight,
          bg: colors.alphaEmerald15,
          border: colors.alphaEmerald30,
          icon: Sparkles,
        };

      case 'Res yet to be obtained':
        return {
          label: 'Res yet to be obtained',
          color: colors.amberLight,
          bg: colors.alphaAmber10,
          border: colors.alphaAmber20,
          icon: Clock,
        };

      case 'Failed':
      case 'Cancelled':
      case 'No_Show':
      case 'Rejected':
        return {
          label: status.replace(/_/g, ' '),
          color: colors.dangerLight,
          bg: colors.alphaRose10,
          border: colors.alphaRose20,
          icon: CircleAlert,
        };

      case 'Assistant_Assigned':
      case 'Assigned':
      default:
        return {
          label: 'Assigned',
          color: colors.amberLight,
          bg: colors.alphaAmber10,
          border: colors.alphaAmber20,
          icon: Clock,
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;
  const isSmall = size === 'small';

  return (
    <View
      className={`flex-row items-center self-start rounded-lg border gap-1.5 ${isSmall ? 'py-1 px-2' : 'py-1.5 px-2.5'}`}
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          paddingVertical: isSmall ? 4 : 5,
          paddingHorizontal: isSmall ? 8 : 10,
        },
      ]}
    >
      <Icon
        size={isSmall ? 10 : 12}
        color={config.color}
        strokeWidth={2.2}
      />

      <Text
        className={`font-black uppercase tracking-wider ${isSmall ? 'text-[9px]' : 'text-[10px]'}`}
        style={[
          styles.text,
          {
            color: config.color,
            fontSize: isSmall ? 9 : 10,
          },
        ]}
        numberOfLines={1}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',

    alignSelf: 'flex-start',

    borderRadius: 8,

    borderWidth: 1,

    gap: 5,
  },

  text: {
    fontWeight: '800',

    textTransform: 'uppercase',

    letterSpacing: 0.45,
  },
});

export default StatusBadge;