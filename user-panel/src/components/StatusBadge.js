import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const STATUS_CONFIGS = {
  Booked: { bg: 'rgba(6, 182, 212, 0.15)', text: colors.cyan, label: 'BOOKED' },
  Assistant_Assigned: { bg: 'rgba(6, 182, 212, 0.15)', text: colors.cyan, label: 'STAFF ASSIGNED' },
  Assigned: { bg: 'rgba(6, 182, 212, 0.15)', text: colors.cyan, label: 'STAFF ASSIGNED' },
  On_The_Way: { bg: 'rgba(245, 158, 11, 0.15)', text: colors.amberLight, label: 'EN ROUTE' },
  On_Route: { bg: 'rgba(245, 158, 11, 0.15)', text: colors.amberLight, label: 'EN ROUTE' },
  Arrived: { bg: 'rgba(16, 185, 129, 0.2)', text: colors.emeraldLight, label: 'STAFF ARRIVED' },
  Collecting: { bg: 'rgba(6, 182, 212, 0.2)', text: colors.cyan, label: 'COLLECTING VIALS' },
  Sample_Collected: { bg: 'rgba(16, 185, 129, 0.15)', text: colors.emeraldLight, label: 'SAMPLE SECURED' },
  At_Laboratory: { bg: 'rgba(139, 92, 246, 0.15)', text: colors.violetLight, label: 'AT LAB HUB' },
  Processing: { bg: 'rgba(139, 92, 246, 0.2)', text: colors.violetLight, label: 'IN ANALYZER' },
  Report_Generated: { bg: 'rgba(16, 185, 129, 0.2)', text: colors.emeraldLight, label: 'REPORT READY' },
  Completed: { bg: 'rgba(16, 185, 129, 0.15)', text: colors.emeraldLight, label: 'COMPLETED' },
  Cancelled: { bg: 'rgba(244, 63, 94, 0.15)', text: colors.roseLight, label: 'CANCELLED' },
};

export const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIGS[status] || {
    bg: 'rgba(255, 255, 255, 0.1)',
    text: colors.textSecondary,
    label: (status || 'UNKNOWN').toUpperCase().replace(/_/g, ' '),
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});

export default StatusBadge;
