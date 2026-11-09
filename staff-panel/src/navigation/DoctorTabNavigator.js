import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  FlaskConical,
  Stethoscope,
} from 'lucide-react-native';

import { useTheme } from '../theme/colors';

import DoctorSamplesScreen from '../screens/DoctorSamplesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function DoctorTabNavigator() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  return (
    <Tab.Navigator
      initialRouteName="DoctorSamples"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: isDark ? colors.primaryLight : colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarHideOnKeyboard: true,
        tabBarAllowFontScaling: false,
      }}
    >
      <Tab.Screen
        name="DoctorSamples"
        component={DoctorSamplesScreen}
        options={{
          tabBarLabel: 'Specimen Oversight',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && styles.activeIconWrap,
              ]}
            >
              <FlaskConical
                size={size}
                color={color}
                strokeWidth={focused ? 2.5 : 1.9}
              />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="DoctorProfile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Doctor Credentials',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && styles.activeIconWrap,
              ]}
            >
              <Stethoscope
                size={size}
                color={color}
                strokeWidth={focused ? 2.5 : 1.9}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    tabBar: {
      backgroundColor: isDark ? colors.bgCardElevated : '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: isDark ? colors.borderDefault : colors.borderSubtle,
      height: Platform.OS === 'ios' ? 86 : 66,
      paddingTop: 6,
      paddingBottom: Platform.OS === 'ios' ? 26 : 7,
      elevation: 12,
      shadowColor: isDark ? '#000000' : '#0F172A',
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: isDark ? 0.35 : 0.06,
      shadowRadius: 12,
    },

    tabLabel: {
      fontSize: 10,
      fontWeight: '800',
      marginTop: 2,
      letterSpacing: 0.2,
    },

    tabItem: {
      paddingVertical: 1,
    },

    iconWrap: {
      minWidth: 46,
      minHeight: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
    },

    activeIconWrap: {
      backgroundColor: colors.borderCyan,
      borderWidth: 1,
      borderColor: colors.borderCyanStrong,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 14,
    },
  });
