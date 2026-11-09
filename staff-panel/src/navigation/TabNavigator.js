import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  LayoutDashboard,
  CalendarCheck,
  FlaskConical,
  Wallet,
  User,
} from 'lucide-react-native';

import { useTheme } from '../theme/colors';

import DashboardScreen    from '../screens/DashboardScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import SamplesScreen      from '../screens/SamplesScreen';
import EarningsScreen     from '../screens/EarningsScreen';
import ProfileScreen      from '../screens/ProfileScreen';

import { useAppointmentStore } from '../store/appointmentStore';

const Tab = createBottomTabNavigator();

const TAB_ITEMS = [
  { name: 'Dashboard',    label: 'Home',      Icon: LayoutDashboard, component: DashboardScreen },
  { name: 'Appointments', label: 'Visits',    Icon: CalendarCheck,   component: AppointmentsScreen, badgeType: 'pending' },
  { name: 'Samples',      label: 'Specimens', Icon: FlaskConical,    component: SamplesScreen,      badgeType: 'samples' },
  { name: 'Earnings',     label: 'Payouts',   Icon: Wallet,          component: EarningsScreen },
  { name: 'Profile',      label: 'Staff ID',  Icon: User,            component: ProfileScreen },
];

export default function TabNavigator() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

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
        tabBarStyle:              styles.tabBar,
        tabBarActiveTintColor:    isDark ? colors.primaryLight : colors.primary,
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
                  strokeWidth={focused ? 2.5 : 1.9}
                />
              </View>
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    tabBar: {
      backgroundColor:  isDark ? colors.bgCardElevated : '#FFFFFF',
      borderTopWidth:   1,
      borderTopColor:   isDark ? colors.borderDefault : colors.borderSubtle,
      height:           Platform.OS === 'ios' ? 86 : 66,
      paddingTop:       6,
      paddingBottom:    Platform.OS === 'ios' ? 26 : 7,
      elevation:        12,
      shadowColor:      isDark ? '#000000' : '#0F172A',
      shadowOffset:     { width: 0, height: -4 },
      shadowOpacity:    isDark ? 0.35 : 0.06,
      shadowRadius:     12,
    },

    tabLabel: {
      fontSize:      10,
      fontWeight:    '800',
      letterSpacing: 0.2,
      marginTop:     2,
    },

    tabItem: {
      paddingVertical: 1,
    },

    iconWrap: {
      minWidth:        46,
      minHeight:       28,
      alignItems:      'center',
      justifyContent:  'center',
      borderRadius:    12,
    },

    activeIconWrap: {
      backgroundColor:   colors.borderCyan,
      borderWidth:       1,
      borderColor:       colors.borderCyanStrong,
      paddingHorizontal: 11,
      paddingVertical:   4,
      borderRadius:      12,
    },

    badge: {
      backgroundColor: colors.amber,
      color:           '#FFFFFF',
      fontSize:        10,
      fontWeight:      '900',
      minWidth:        17,
      height:          17,
      borderRadius:    9,
      lineHeight:      15,
      textAlign:       'center',
    },

    badgeCyan: {
      backgroundColor: colors.primary,
      color:           '#FFFFFF',
      fontSize:        10,
      fontWeight:      '900',
      minWidth:        17,
      height:          17,
      borderRadius:    9,
      lineHeight:      15,
      textAlign:       'center',
    },
  });
