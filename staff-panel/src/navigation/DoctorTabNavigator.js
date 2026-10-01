import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  FlaskConical,
  Stethoscope,
} from 'lucide-react-native';

import { colors, useTheme } from '../theme/colors';

import DoctorSamplesScreen from '../screens/DoctorSamplesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function DoctorTabNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="DoctorSamples"
      screenOptions={{
        headerShown: false,

        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.bgSurface,
            borderTopColor: colors.borderSubtle,
          },
        ],

        tabBarActiveTintColor: colors.cyan,
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
                strokeWidth={focused ? 2.4 : 2}
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
                strokeWidth={focused ? 2.4 : 2}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgSurface,

    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,

    height: 64,

    paddingTop: 5,
    paddingBottom: 7,

    elevation: 12,

    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: '700',

    marginTop: 2,

    letterSpacing: 0.15,
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