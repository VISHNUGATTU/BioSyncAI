import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import the Context
import { AuthContext } from '../context/AuthContext';

// 1. ALL SCREENS MUST BE IMPORTED AT THE TOP
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/main/DashboardScreen';
import UserProfileScreen from '../screens/main/UserProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import ScannerScreen from '../screens/main/ScannerScreen';
import HistoryScreen from '../screens/main/HistoryScreen';
import HealthScreen from '../screens/main/HealthScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import EditIdentityScreen from '../screens/main/EditIdentityScreen';
import EditBiometricsScreen from '../screens/main/EditBiometricsScreen';
import BookingScreen from '../screens/main/BookingScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        {user === null ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            {/* MAIN APP SCREENS (Standard Navigation) */}
            <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
            <Stack.Screen name="HealthScreen" component={HealthScreen} />
            <Stack.Screen name="HistoryScreen" component={HistoryScreen} />
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
            <Stack.Screen name="UserProfileScreen" component={UserProfileScreen} />

            {/* MODALS (Forms that slide up) */}
            <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} options={{ presentation: 'modal' }}/>
            <Stack.Screen name="ScannerScreen" component={ScannerScreen} options={{ presentation: 'modal' }}/>
            <Stack.Screen name="EditIdentityScreen" component={EditIdentityScreen} options={{ presentation: 'modal' }}/>
            <Stack.Screen name="EditBiometricsScreen" component={EditBiometricsScreen} options={{ presentation: 'modal' }}/>
            <Stack.Screen name="BookingScreen" component={BookingScreen} options={{ presentation: 'modal' }}/>
          </>
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}