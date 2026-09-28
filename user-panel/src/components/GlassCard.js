import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export const GlassCard = ({ children, style, surface = false }) => {
  return (
    <View style={[styles.card, surface && styles.surface, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCardElevated,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  surface: {
    backgroundColor: colors.bgCardSurface,
  },
});

export default GlassCard;
