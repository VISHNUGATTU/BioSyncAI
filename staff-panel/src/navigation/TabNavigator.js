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
import { colors } from '../theme/colors';
import DashboardScreen from '../screens/DashboardScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import SamplesScreen from '../screens/SamplesScreen';
import EarningsScreen from '../screens/EarningsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useAppointmentStore } from '../store/appointmentStore';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const pendingCount = useAppointmentStore((state) => state.pendingAppointments?.length || 0);
  const sampleCount = useAppointmentStore((state) => state.collectedSamples?.length || 0);

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIconWrap : null}>
              <LayoutDashboard size={size} color={color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          tabBarLabel: 'Visits',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: styles.badge,
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIconWrap : null}>
              <CalendarCheck size={size} color={color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Samples"
        component={SamplesScreen}
        options={{
          tabBarLabel: 'Specimens',
          tabBarBadge: sampleCount > 0 ? sampleCount : undefined,
          tabBarBadgeStyle: styles.badgeCyan,
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIconWrap : null}>
              <FlaskConical size={size} color={color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{
          tabBarLabel: 'Payouts',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIconWrap : null}>
              <Wallet size={size} color={color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Staff ID',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIconWrap : null}>
              <User size={size} color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgCardElevated,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabItem: {
    paddingVertical: 2,
  },
  activeIconWrap: {
    paddingBottom: 2,
    borderBottomWidth: 2,
    borderBottomColor: colors.cyan,
  },
  badge: {
    backgroundColor: colors.amber,
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    lineHeight: 14,
  },
  badgeCyan: {
    backgroundColor: colors.cyan,
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    lineHeight: 14,
  },
});
