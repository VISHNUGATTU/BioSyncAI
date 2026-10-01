import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Utensils, Scan, TrendingUp, User } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

import HomeScreen          from '../screens/HomeScreen';
import FoodHistoryScreen   from '../screens/FoodHistoryScreen';
import FoodScannerScreen   from '../screens/FoodScannerScreen';
import VitalsAnalysisScreen from '../screens/VitalsAnalysisScreen';
import ProfileScreen       from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ITEMS = [
  { name: 'Home',     label: 'Home',     Icon: Home,        component: HomeScreen },
  { name: 'History',  label: 'History',  Icon: Utensils,    component: FoodHistoryScreen },
  { name: 'Scan',     label: 'Scan',     Icon: Scan,        component: FoodScannerScreen },
  { name: 'Analysis', label: 'Analysis', Icon: TrendingUp,  component: VitalsAnalysisScreen },
  { name: 'Profile',  label: 'Profile',  Icon: User,        component: ProfileScreen },
];

export default function TabNavigator() {
  const { colors, isDark, shadows } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:             false,
        tabBarStyle:             [
          styles.tabBar,
          {
            backgroundColor: colors.bgSurface,
            borderTopColor:  colors.borderSubtle,
          },
          !isDark && shadows.sm,
        ],
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle:        styles.tabLabel,
        tabBarItemStyle:         styles.tabItem,
        tabBarHideOnKeyboard:    true,
        tabBarAllowFontScaling:  false,
      }}
    >
      {TAB_ITEMS.map(({ name, label, Icon, component }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            tabBarLabel: label,
            tabBarIcon: ({ color, size, focused }) => (
              <View
                style={[
                  styles.iconWrap,
                  focused && [
                    styles.activeIconWrap,
                    {
                      backgroundColor: colors.borderCyan,
                      borderColor:     colors.borderCyanStrong,
                    },
                  ],
                ]}
              >
                <Icon
                  size={focused ? size - 1 : size}
                  color={focused ? colors.primary : color}
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
    borderTopWidth:   1,
    height:           Platform.OS === 'ios' ? 86 : 64,
    paddingTop:       6,
    paddingBottom:    Platform.OS === 'ios' ? 26 : 6,
    elevation:        10,
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: -2 },
    shadowOpacity:    0.08,
    shadowRadius:     10,
  },

  tabLabel: {
    fontSize:      9.5,
    fontWeight:    '700',
    letterSpacing: 0.2,
    marginTop:     2,
  },

  tabItem: { paddingVertical: 1 },

  iconWrap: {
    minWidth:       44,
    minHeight:      26,
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:   12,
  },

  activeIconWrap: {
    borderWidth:       1,
    paddingHorizontal: 10,
    paddingVertical:   3,
    borderRadius:      12,
  },
});
