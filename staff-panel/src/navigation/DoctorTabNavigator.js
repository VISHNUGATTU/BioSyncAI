import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FlaskConical, Stethoscope, User } from 'lucide-react-native';
import { colors } from '../theme/colors';
import DoctorSamplesScreen from '../screens/DoctorSamplesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function DoctorTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="DoctorSamples"
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
        name="DoctorSamples"
        component={DoctorSamplesScreen}
        options={{
          tabBarLabel: 'Specimen Oversight',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIconWrap : null}>
              <FlaskConical size={size} color={color} />
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
            <View style={focused ? styles.activeIconWrap : null}>
              <Stethoscope size={size} color={color} />
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
    borderTopColor: colors.borderSubtle,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  tabItem: {
    paddingVertical: 2,
  },
  activeIconWrap: {
    backgroundColor: colors.cyan + '18',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
});
