import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Scan, CalendarPlus, Activity, User } from 'lucide-react-native';
import { colors } from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import FoodScannerScreen from '../screens/FoodScannerScreen';
import BookAppointmentScreen from '../screens/BookAppointmentScreen';
import AppointmentsListScreen from '../screens/AppointmentsListScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="FoodScanner"
        component={FoodScannerScreen}
        options={{
          tabBarLabel: 'Scan Food',
          tabBarIcon: ({ color, size }) => <Scan size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="BookAppointment"
        component={BookAppointmentScreen}
        options={{
          tabBarLabel: 'Schedule',
          tabBarIcon: ({ color, size }) => (
            <CalendarPlus size={size || 20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsListScreen}
        options={{
          tabBarLabel: 'Visits',
          tabBarIcon: ({ color, size }) => <Activity size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size || 20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000000',
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
