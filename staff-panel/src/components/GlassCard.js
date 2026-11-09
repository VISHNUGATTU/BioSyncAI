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

  const resolvedBorderColor =
    borderColor ||
    (accent
      ? colors.borderCyan
      : isDark
      ? colors.borderSubtle
      : colors.borderDefault);

  const cardStyle = [
    styles.card,
    {
      backgroundColor: elevated ? colors.bgCardElevated : colors.bgCard,
      borderRadius: radius,
      borderWidth,
      borderColor: resolvedBorderColor,
      padding,
    },
    isDark
      ? elevated
        ? shadows.md
        : shadows.sm
      : elevated
      ? shadows.md
      : shadows.sm,
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
  },

  content: {
    width: '100%',
  },
});

export default GlassCard;
