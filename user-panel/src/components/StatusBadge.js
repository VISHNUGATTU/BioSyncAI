import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export const StatusBadge = ({ status, className = '', style }) => {
  const { colors, isDark } = useTheme();

  const STATUS_CONFIGS = {
    Booked:             { bg: isDark ? 'rgba(6, 182, 212, 0.16)' : 'rgba(8, 145, 178, 0.12)', border: isDark ? 'rgba(6, 182, 212, 0.35)' : 'rgba(8, 145, 178, 0.3)', text: colors.cyan, label: 'BOOKED' },
    Assistant_Assigned: { bg: isDark ? 'rgba(6, 182, 212, 0.16)' : 'rgba(8, 145, 178, 0.12)', border: isDark ? 'rgba(6, 182, 212, 0.35)' : 'rgba(8, 145, 178, 0.3)', text: colors.cyan, label: 'STAFF ASSIGNED' },
    Assigned:           { bg: isDark ? 'rgba(6, 182, 212, 0.16)' : 'rgba(8, 145, 178, 0.12)', border: isDark ? 'rgba(6, 182, 212, 0.35)' : 'rgba(8, 145, 178, 0.3)', text: colors.cyan, label: 'STAFF ASSIGNED' },
    On_The_Way:         { bg: isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(217, 119, 6, 0.12)', border: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(217, 119, 6, 0.3)', text: isDark ? colors.amberLight : colors.amber, label: 'EN ROUTE' },
    On_Route:           { bg: isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(217, 119, 6, 0.12)', border: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(217, 119, 6, 0.3)', text: isDark ? colors.amberLight : colors.amber, label: 'EN ROUTE' },
    Arrived:            { bg: isDark ? 'rgba(16, 185, 129, 0.20)' : 'rgba(5, 150, 105, 0.14)', border: isDark ? 'rgba(16, 185, 129, 0.40)' : 'rgba(5, 150, 105, 0.35)', text: isDark ? colors.emeraldLight : colors.emerald, label: 'STAFF ARRIVED' },
    Collecting:         { bg: isDark ? 'rgba(6, 182, 212, 0.20)' : 'rgba(8, 145, 178, 0.14)', border: isDark ? 'rgba(6, 182, 212, 0.40)' : 'rgba(8, 145, 178, 0.35)', text: colors.cyan, label: 'COLLECTING VIALS' },
    Sample_Collected:   { bg: isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(5, 150, 105, 0.12)', border: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(5, 150, 105, 0.3)', text: isDark ? colors.emeraldLight : colors.emerald, label: 'SAMPLE SECURED' },
    At_Laboratory:      { bg: isDark ? 'rgba(139, 92, 246, 0.16)' : 'rgba(124, 58, 237, 0.12)', border: isDark ? 'rgba(139, 92, 246, 0.35)' : 'rgba(124, 58, 237, 0.3)', text: isDark ? colors.violetLight : colors.violet, label: 'AT LAB HUB' },
    Processing:         { bg: isDark ? 'rgba(139, 92, 246, 0.20)' : 'rgba(124, 58, 237, 0.14)', border: isDark ? 'rgba(139, 92, 246, 0.40)' : 'rgba(124, 58, 237, 0.35)', text: isDark ? colors.violetLight : colors.violet, label: 'IN ANALYZER' },
    Report_Generated:   { bg: isDark ? 'rgba(16, 185, 129, 0.20)' : 'rgba(5, 150, 105, 0.14)', border: isDark ? 'rgba(16, 185, 129, 0.40)' : 'rgba(5, 150, 105, 0.35)', text: isDark ? colors.emeraldLight : colors.emerald, label: 'REPORT READY' },
    Completed:          { bg: isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(5, 150, 105, 0.12)', border: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(5, 150, 105, 0.3)', text: isDark ? colors.emeraldLight : colors.emerald, label: 'COMPLETED' },
    Cancelled:          { bg: isDark ? 'rgba(244, 63, 94, 0.16)' : 'rgba(225, 29, 72, 0.12)', border: isDark ? 'rgba(244, 63, 94, 0.35)' : 'rgba(225, 29, 72, 0.3)', text: isDark ? colors.roseLight : colors.rose, label: 'CANCELLED' },
    Failed:             { bg: isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(220, 38, 38, 0.12)', border: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(220, 38, 38, 0.3)', text: isDark ? '#f87171' : '#dc2626', label: 'COLLECTION FAILED' },
    No_Show:            { bg: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(217, 119, 6, 0.12)', border: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(217, 119, 6, 0.3)', text: isDark ? '#fbbf24' : '#d97706', label: 'PATIENT ABSENT' },
    Rejected:           { bg: isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(220, 38, 38, 0.12)', border: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(220, 38, 38, 0.3)', text: isDark ? '#f87171' : '#dc2626', label: 'DRAW EXCEPTION' },
    Sample_Rejected:    { bg: isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(220, 38, 38, 0.12)', border: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(220, 38, 38, 0.3)', text: isDark ? '#f87171' : '#dc2626', label: 'SPECIMEN REJECTED' },
  };

  const config = STATUS_CONFIGS[status] || {
    bg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
    border: colors.borderSubtle,
    text: colors.textSecondary,
    label: (status || 'UNKNOWN').toUpperCase().replace(/_/g, ' '),
  };

  return (
    <View 
      className={`px-2.5 py-1 rounded-lg self-start ${className}`} 
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
        style,
      ]}
    >
      <Text 
        className="text-[10px] font-black tracking-wider" 
        style={{ color: config.text }}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
});

export default StatusBadge;
