import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, darkGradients, darkShadows } from './darkTheme';
import { lightColors, lightGradients, lightShadows } from './lightTheme';

export const THEME_STORAGE_KEY = 'biosync_theme_preference';

// Global mutable reference for legacy/sync color readers
let currentThemeMode = 'dark';
let activeColorsRef = darkColors;
let activeGradientsRef = darkGradients;
let activeShadowsRef = darkShadows;

export const setGlobalThemeMode = (mode) => {
  currentThemeMode = mode;
  activeColorsRef = mode === 'dark' ? darkColors : lightColors;
  activeGradientsRef = mode === 'dark' ? darkGradients : lightGradients;
  activeShadowsRef = mode === 'dark' ? darkShadows : lightShadows;
};

export const getActiveColors = () => activeColorsRef;
export const getActiveGradients = () => activeGradientsRef;
export const getActiveShadows = () => activeShadowsRef;

export const ThemeContext = createContext({
  themePreference: 'system', // 'system' | 'light' | 'dark'
  mode: 'dark', // 'light' | 'dark'
  isDark: true,
  colors: darkColors,
  gradients: darkGradients,
  shadows: darkShadows,
  setTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const deviceColorScheme = useColorScheme(); // 'light' | 'dark' | null
  const [themePreference, setThemePreferenceState] = useState('system');
  const [systemScheme, setSystemScheme] = useState(
    Appearance.getColorScheme() || deviceColorScheme || 'light'
  );

  // Load saved preference on mount
  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (isMounted && saved && ['system', 'light', 'dark'].includes(saved)) {
          setThemePreferenceState(saved);
        }
      })
      .catch((err) => {
        console.warn('[ThemeProvider] Failed reading stored theme:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to system OS appearance changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme) {
        setSystemScheme(colorScheme);
      }
    });

    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, []);

  // Sync when hook detects change
  useEffect(() => {
    if (deviceColorScheme) {
      setSystemScheme(deviceColorScheme);
    }
  }, [deviceColorScheme]);

  // Handle setting new preference
  const setTheme = useCallback(async (preference) => {
    if (!['system', 'light', 'dark'].includes(preference)) return;
    setThemePreferenceState(preference);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch (err) {
      console.warn('[ThemeProvider] Failed saving theme preference:', err);
    }
  }, []);

  // Resolve active theme mode
  const mode = useMemo(() => {
    if (themePreference === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return themePreference;
  }, [themePreference, systemScheme]);

  const isDark = mode === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const gradients = isDark ? darkGradients : lightGradients;
  const shadows = isDark ? darkShadows : lightShadows;

  // Sync global reference
  useEffect(() => {
    setGlobalThemeMode(mode);
  }, [mode]);

  const contextValue = useMemo(() => ({
    themePreference,
    mode,
    isDark,
    colors,
    gradients,
    shadows,
    setTheme,
  }), [themePreference, mode, isDark, colors, gradients, shadows, setTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
