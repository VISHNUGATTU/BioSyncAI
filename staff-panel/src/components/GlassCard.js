import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows } from '../theme/colors';

export const GlassCard = ({
  children,
  style,
  gradient = colors.cardGradient,
  borderColor = colors.borderSubtle,
  elevation = 'sm',
}) => {
  return (
    <View style={[styles.container, shadows[elevation] || shadows.sm, { borderColor }, style]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
  },
});

export default GlassCard;
