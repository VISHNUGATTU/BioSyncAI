import './global.css';
import React, { useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Platform, LogBox } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

// Suppress all on-screen warning banners and error overlays in development.
// All diagnostic information, warnings, and errors strictly output to developer terminal.
LogBox.ignoreAllLogs(true);

function NavigationRoot() {
  const { colors, isDark } = useTheme();

  const navigationTheme = useMemo(() => {
    const baseTheme = isDark ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      dark: isDark,
      colors: {
        ...baseTheme.colors,
        primary: colors.primary,
        background: colors.bgDark,
        card: colors.bgCardElevated,
        text: colors.textPrimary,
        border: colors.borderSubtle,
        notification: colors.amber,
      },
      fonts: {
        ...baseTheme?.fonts,
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
  }, [colors, isDark]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor={colors.bgDark}
      />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationRoot />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
