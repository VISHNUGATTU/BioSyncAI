import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { Platform, LogBox } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';

// Suppress all on-screen warning banners and error overlays.
// All diagnostic logs, warnings, and errors output strictly to the terminal.
LogBox.ignoreAllLogs(true);

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.cyan,
    background: colors.bgDark,
    card: colors.bgCardElevated,
    text: colors.textPrimary,
    border: colors.borderSubtle,
    notification: colors.amber,
  },
  fonts: {
    ...DarkTheme?.fonts,
    regular: {
      fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
      fontWeight: '400',
    },
    medium: {
      fontFamily: Platform.select({ ios: 'System', default: 'sans-serif-medium' }),
      fontWeight: '500',
    },
    bold: {
      fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
      fontWeight: '700',
    },
    heavy: {
      fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
      fontWeight: '900',
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style="light" backgroundColor={colors.bgDark} />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
