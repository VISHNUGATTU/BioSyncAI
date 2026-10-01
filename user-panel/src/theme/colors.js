// BioSyncAI User Panel — Centralized Theme Gateway & Reactive Tokens
import { darkColors, darkGradients, darkShadows } from './darkTheme';
import { lightColors, lightGradients, lightShadows } from './lightTheme';
import {
  ThemeProvider,
  useTheme,
  ThemeContext,
  THEME_STORAGE_KEY,
  getActiveColors,
  getActiveGradients,
  getActiveShadows,
  setGlobalThemeMode,
} from './ThemeContext';

// Dynamic Proxy for backward compatibility with static imports `import { colors } from '../theme/colors'`
export const colors = new Proxy(darkColors, {
  get(target, prop) {
    const active = getActiveColors();
    return active[prop] !== undefined ? active[prop] : target[prop];
  },
  set(target, prop, value) {
    const active = getActiveColors();
    active[prop] = value;
    target[prop] = value;
    return true;
  },
});

export const gradients = new Proxy(darkGradients, {
  get(target, prop) {
    const active = getActiveGradients();
    return active[prop] !== undefined ? active[prop] : target[prop];
  },
});

export const shadows = new Proxy(darkShadows, {
  get(target, prop) {
    const active = getActiveShadows();
    return active[prop] !== undefined ? active[prop] : target[prop];
  },
});

// Re-export Theme Hooks & Context
export {
  ThemeProvider,
  useTheme,
  ThemeContext,
  THEME_STORAGE_KEY,
  darkColors,
  lightColors,
  darkGradients,
  lightGradients,
  darkShadows,
  lightShadows,
  setGlobalThemeMode,
};

export default colors;
