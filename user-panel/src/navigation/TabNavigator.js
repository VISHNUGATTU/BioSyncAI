import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Utensils, Clock, Scan, TrendingUp, User } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

import HomeScreen          from '../screens/HomeScreen';
import FoodDeliveryHomeScreen from '../screens/FoodDeliveryHomeScreen';
import FoodHistoryScreen   from '../screens/FoodHistoryScreen';
import FoodScannerScreen   from '../screens/FoodScannerScreen';
import VitalsAnalysisScreen from '../screens/VitalsAnalysisScreen';
import ProfileScreen       from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ITEMS = [
  { name: 'Home',     label: 'Home',     Icon: Home,        component: HomeScreen },
  { name: 'Eats',     label: 'Eats',     Icon: Utensils,    component: FoodDeliveryHomeScreen },
  { name: 'Scan',     label: 'Scan',     Icon: Scan,        component: FoodScannerScreen },
  { name: 'History',  label: 'History',  Icon: Clock,       component: FoodHistoryScreen },
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
            backgroundColor: isDark ? '#06080c' : '#ffffff',
            borderTopColor:  isDark ? 'rgba(255,255,255,0.09)' : colors.borderSubtle,
          },
          !isDark && shadows.md,
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
                      backgroundColor: colors.primaryGlow,
                      borderColor:     colors.borderCyanStrong,
                    },
                  ],
                ]}
              >
                <Icon
                  size={focused ? size - 1 : size}
                  color={focused ? colors.primary : color}
                  strokeWidth={focused ? 2.6 : 1.9}
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
    height:           Platform.OS === 'ios' ? 88 : 66,
    paddingTop:       7,
    paddingBottom:    Platform.OS === 'ios' ? 26 : 7,
    elevation:        12,
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: -3 },
    shadowOpacity:    0.12,
    shadowRadius:     12,
  },

  tabLabel: {
    fontSize:      10,
    fontWeight:    '800',
    letterSpacing: 0.25,
    marginTop:     2,
  },

  tabItem: { paddingVertical: 1 },

  iconWrap: {
    minWidth:       46,
    minHeight:      28,
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:   14,
  },

  activeIconWrap: {
    borderWidth:       1,
    paddingHorizontal: 11,
    paddingVertical:   3,
    borderRadius:      14,
  },
});
