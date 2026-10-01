import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme/ThemeContext';

const GlassCard = ({
  children,
  style,
  contentStyle,
  className = '',
  gradient = false,
  gradientColors,
  borderColor,
  borderWidth = 1,
  radius = 18,
  padding = 16,
  elevated = false,
  accent = false,
  onLayout,
}) => {
  const { colors, gradients, isDark, shadows } = useTheme();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.bgCard,
      borderRadius: radius,
      borderWidth,
      borderColor:
        borderColor ||
        (accent
          ? colors.borderCyan
          : colors.borderSubtle),
      padding,
    },
    !isDark && (elevated ? shadows.md : shadows.sm),
    elevated && isDark && styles.elevated,
    style,
  ];

  const content = (
    <View
      className="w-full"
      style={[
        styles.content,
        contentStyle,
      ]}
      onLayout={onLayout}
    >
      {children}
    </View>
  );

  if (gradient) {
    const activeGradient =
      gradientColors ||
      (Array.isArray(gradient) ? gradient : null) ||
      gradients.cardGradient;

    return (
      <LinearGradient
        colors={activeGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={cardStyle}
        className={`w-full overflow-hidden ${className}`}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <View
      style={cardStyle}
      className={`w-full overflow-hidden ${className}`}
      onLayout={onLayout}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },

  elevated: {
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 7,
  },

  content: {
    width: '100%',
  },
});

export default GlassCard;