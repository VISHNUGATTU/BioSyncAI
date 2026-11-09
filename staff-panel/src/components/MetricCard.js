import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react-native';

import GlassCard from './GlassCard';
import { useTheme } from '../theme/ThemeContext';

const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  accentColor,
  trend,
  trendValue,
  trendLabel,
  onPress,
  style,
  compact = false,
}) => {
  const { colors, isDark } = useTheme();
  const effectiveIconColor =
    accentColor || iconColor || colors.primaryLight || colors.primary;

  const getTrendColor = () => {
    if (trend === 'up') {
      return colors.success;
    }

    if (trend === 'down') {
      return colors.danger;
    }

    return colors.textMuted;
  };

  const getTrendIcon = () => {
    if (trend === 'up') {
      return TrendingUp;
    }

    if (trend === 'down') {
      return TrendingDown;
    }

    return Minus;
  };

  const TrendIcon = getTrendIcon();
  const currentTrendColor = getTrendColor();

  const content = (
    <View style={styles.innerContent}>
      <View className="w-full flex-row items-center justify-between" style={styles.topRow}>
        <View
          className="w-10 h-10 rounded-xl items-center justify-center border"
          style={[
            styles.iconContainer,
            {
              backgroundColor: `${effectiveIconColor}${isDark ? '18' : '14'}`,
              borderColor: `${effectiveIconColor}${isDark ? '35' : '30'}`,
            },
          ]}
        >
          {Icon ? (
            <Icon
              size={compact ? 18 : 20}
              color={effectiveIconColor}
              strokeWidth={2.3}
            />
          ) : null}
        </View>

        {trend ? (
          <View
            className="flex-row items-center min-h-[26px] px-2 py-1 rounded-lg border"
            style={[
              styles.trendBadge,
              {
                backgroundColor: `${currentTrendColor}14`,
                borderColor: `${currentTrendColor}28`,
              },
            ]}
          >
            <TrendIcon
              size={13}
              color={currentTrendColor}
              strokeWidth={2.5}
            />

            {trendValue ? (
              <Text
                className="text-[10px] font-extrabold ml-1"
                style={[
                  styles.trendValue,
                  {
                    color: currentTrendColor,
                  },
                ]}
              >
                {trendValue}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View className="mt-3.5" style={styles.valueContainer}>
        <Text
          className={`font-extrabold tracking-tight ${compact ? 'text-xl leading-7' : 'text-2xl leading-8'}`}
          style={[
            styles.value,
            { color: colors.textPrimary },
            compact && styles.compactValue,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value ?? '--'}
        </Text>

        <Text
          className="text-xs font-semibold mt-1"
          style={[styles.title, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {title || 'Metric'}
        </Text>
      </View>

      {subtitle || trendLabel ? (
        <View className="flex-row items-center justify-between mt-3" style={styles.bottomRow}>
          {subtitle ? (
            <Text
              className="flex-1 text-[10px] font-medium"
              style={[styles.subtitle, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : (
            <View />
          )}

          {trendLabel ? (
            <Text
              className="text-[9px] font-medium ml-2"
              style={[styles.trendLabel, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {trendLabel}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.86}
        onPress={onPress}
        style={[{ width: '100%' }, style]}
      >
        <GlassCard
          accent
          elevated
          padding={compact ? 12 : 14}
          style={styles.card}
        >
          {content}
        </GlassCard>
      </TouchableOpacity>
    );
  }

  return (
    <GlassCard
      accent
      elevated
      padding={compact ? 12 : 14}
      style={[styles.card, style]}
    >
      {content}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },

  innerContent: {
    width: '100%',
    minHeight: 114,
    justifyContent: 'space-between',
  },

  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 25,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },

  trendValue: {
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
  },

  valueContainer: {
    marginTop: 10,
  },

  value: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },

  compactValue: {
    fontSize: 22,
    lineHeight: 28,
  },

  title: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  subtitle: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  trendLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default MetricCard;
