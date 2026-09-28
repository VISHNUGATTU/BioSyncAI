import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '../theme/colors';

export const MetricCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  accentColor = colors.primary,
  gradient = colors.cardGradient,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, { borderColor: accentColor + '30' }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.inner}
      >
        <View style={styles.topRow}>
          <View style={[styles.iconWrapper, { backgroundColor: accentColor + '18', borderColor: accentColor + '35' }]}>
            {Icon && <Icon size={18} color={accentColor} />}
          </View>
          {onPress && (
            <ChevronRight size={14} color={colors.textMuted} />
          )}
        </View>

        <Text style={styles.value}>{value}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#0a0a0a',
  },
  inner: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export default MetricCard;
