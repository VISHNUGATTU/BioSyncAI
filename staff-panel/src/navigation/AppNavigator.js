import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity } from 'lucide-react-native';

import { colors, gradients } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import LoginScreen from '../screens/LoginScreen';
import TabNavigator from './TabNavigator';
import DoctorTabNavigator from './DoctorTabNavigator';
import AppointmentDetailScreen from '../screens/AppointmentDetailScreen';
import ActiveCollectionScreen from '../screens/ActiveCollectionScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role || state.user?.role || 'lab_assistant');
  const loadStoredSession = useAuthStore((state) => state.loadStoredSession);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await loadStoredSession();
      } catch (err) {
        console.warn('Session init warning:', err);
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, []);

  if (initializing) {
    return (
      <View style={styles.splashContainer}>
        <LinearGradient
          colors={[colors.bgDark, colors.bgSurface]}
          style={styles.splashGradient}
        >
          <View style={styles.logoWrap}>
            <LinearGradient colors={gradients.cyanBlue} style={styles.logoIcon}>
              <Activity size={36} color="#ffffff" strokeWidth={2.5} />
            </LinearGradient>
            <Text style={styles.brandTitle}>
              BioSync<Text style={{ color: colors.cyan }}>AI</Text>
            </Text>
            <Text style={styles.brandSubtitle}>CLINICAL SPECIMEN & PHLEBOTOMY OS</Text>
          </View>
          <ActivityIndicator size="large" color={colors.cyan} style={styles.loader} />
        </LinearGradient>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgDark },
        animation: 'slide_from_right',
      }}
    >
      {!token ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : role === 'doctor' ? (
        <Stack.Screen name="DoctorTabs" component={DoctorTabNavigator} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen
            name="AppointmentDetail"
            component={AppointmentDetailScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="ActiveCollection"
            component={ActiveCollectionScreen}
            options={{
              animation: 'slide_from_bottom',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  splashGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 12,
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.cyan,
    letterSpacing: 2,
    marginTop: 6,
  },
  loader: {
    marginTop: 12,
  },
});
