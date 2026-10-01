import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  LayoutDashboard,
  CalendarCheck,
  FlaskConical,
  Wallet,
  User,
} from 'lucide-react-native';

import { colors, useTheme } from '../theme/colors';

import DashboardScreen  from '../screens/DashboardScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import SamplesScreen    from '../screens/SamplesScreen';
import EarningsScreen   from '../screens/EarningsScreen';
import ProfileScreen    from '../screens/ProfileScreen';

import { useAppointmentStore } from '../store/appointmentStore';

const Tab = createBottomTabNavigator();

const TAB_ITEMS = [
  { name: 'Dashboard',    label: 'Home',      Icon: LayoutDashboard,  component: DashboardScreen },
  { name: 'Appointments', label: 'Visits',    Icon: CalendarCheck,    component: AppointmentsScreen, badgeType: 'pending' },
  { name: 'Samples',      label: 'Specimens', Icon: FlaskConical,     component: SamplesScreen,      badgeType: 'samples' },
  { name: 'Earnings',     label: 'Payouts',   Icon: Wallet,           component: EarningsScreen },
  { name: 'Profile',      label: 'Staff ID',  Icon: User,             component: ProfileScreen },
];

export default function TabNavigator() {
  const { colors, isDark } = useTheme();
  const pendingCount = useAppointmentStore((s) => s.pendingAppointments?.length || 0);
  const sampleCount  = useAppointmentStore((s) => s.collectedSamples?.length || 0);

  const getBadge = (type) => {
    if (type === 'pending' && pendingCount > 0) return pendingCount;
    if (type === 'samples' && sampleCount > 0)  return sampleCount;
    return undefined;
  };

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown:              false,
        tabBarStyle:              [
          styles.tabBar,
          {
            backgroundColor: colors.bgCardElevated,
            borderTopColor: colors.borderSubtle,
          },
        ],
        tabBarActiveTintColor:    colors.primary,
        tabBarInactiveTintColor:  colors.textMuted,
        tabBarLabelStyle:         styles.tabLabel,
        tabBarItemStyle:          styles.tabItem,
        tabBarHideOnKeyboard:     true,
        tabBarAllowFontScaling:   false,
      }}
    >
      {TAB_ITEMS.map(({ name, label, Icon, component, badgeType }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            tabBarLabel: label,
            tabBarBadge:      badgeType ? getBadge(badgeType) : undefined,
            tabBarBadgeStyle: badgeType === 'samples' ? styles.badgeCyan : styles.badge,
            tabBarIcon: ({ color, size, focused }) => (
              <View style={[styles.iconWrap, focused && styles.activeIconWrap]}>
                <Icon
                  size={focused ? size - 1 : size}
                  color={color}
                  strokeWidth={focused ? 2.5 : 1.8}
                />
              </View>
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor:  colors.bgCardElevated,
    borderTopWidth:   1,
    borderTopColor:   colors.borderSubtle,
    height:           Platform.OS === 'ios' ? 86 : 64,
    paddingTop:       6,
    paddingBottom:    Platform.OS === 'ios' ? 26 : 6,
    elevation:        10,
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: -2 },
    shadowOpacity:    0.30,
    shadowRadius:     10,
  },

  tabLabel: {
    fontSize:      10,
    fontWeight:    '700',
    letterSpacing: 0.1,
    marginTop:     2,
  },

  tabItem: {
    paddingVertical: 1,
  },

  iconWrap: {
    minWidth:        44,
    minHeight:       28,
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:    12,
  },

  activeIconWrap: {
    backgroundColor:  colors.borderCyan,
    borderWidth:      1,
    borderColor:      colors.borderCyanStrong,
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:     12,
  },

  badge: {
    backgroundColor: colors.amber,
    color:           colors.textInverse,
    fontSize:        10,
    fontWeight:      '800',
    minWidth:        16,
    height:          16,
    borderRadius:    8,
    lineHeight:      14,
    textAlign:       'center',
  },

  badgeCyan: {
    backgroundColor: colors.primary,
    color:           colors.textInverse,
    fontSize:        10,
    fontWeight:      '800',
    minWidth:        16,
    height:          16,
    borderRadius:    8,
    lineHeight:      14,
    textAlign:       'center',
  },
});