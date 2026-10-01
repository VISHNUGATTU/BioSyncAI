import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export const GlassCard = ({ children, style, surface = false, className = '' }) => {
  const { colors, isDark, shadows } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: surface ? colors.bgCardSurface : colors.bgCardElevated,
          borderColor: colors.borderSubtle,
        },
        !isDark && shadows.sm,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
});

export default GlassCard;
