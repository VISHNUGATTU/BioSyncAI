// BioSyncAI Staff Panel — Dynamic Tri-Theme Token Hub
import { darkColors, darkGradients, darkAlpha } from './darkTheme';
import {
  getActiveColors,
  getActiveGradients,
  getActiveAlpha,
  useTheme,
  ThemeProvider,
  ThemeContext,
} from './ThemeContext';

export { useTheme, ThemeProvider, ThemeContext };

/**
 * Dynamic Proxy for colors:
 * Ensures any direct import `import { colors } from '../theme/colors'`
 * continuously reflects the live active theme (Light, Dark, or System-derived).
 */
export const colors = new Proxy({}, {
  get(target, prop) {
    const active = getActiveColors();
    return active[prop] ?? darkColors[prop];
  },
  set(target, prop, value) {
    const active = getActiveColors();
    active[prop] = value;
    return true;
  },
  has(target, prop) {
    const active = getActiveColors();
    return prop in active || prop in darkColors;
  },
  ownKeys(target) {
    const active = getActiveColors();
    return Reflect.ownKeys(active);
  },
  getOwnPropertyDescriptor(target, prop) {
    const active = getActiveColors();
    return Reflect.getOwnPropertyDescriptor(active, prop) || Reflect.getOwnPropertyDescriptor(darkColors, prop);
  },
});

/**
 * Dynamic Proxy for gradients:
 */
export const gradients = new Proxy({}, {
  get(target, prop) {
    const active = getActiveGradients();
    return active[prop] ?? darkGradients[prop];
  },
  has(target, prop) {
    const active = getActiveGradients();
    return prop in active || prop in darkGradients;
  },
  ownKeys(target) {
    const active = getActiveGradients();
    return Reflect.ownKeys(active);
  },
});

/**
 * Dynamic Proxy for alpha:
 */
export const alpha = new Proxy({}, {
  get(target, prop) {
    const active = getActiveAlpha();
    return active[prop] ?? darkAlpha[prop];
  },
  has(target, prop) {
    const active = getActiveAlpha();
    return prop in active || prop in darkAlpha;
  },
  ownKeys(target) {
    const active = getActiveAlpha();
    return Reflect.ownKeys(active);
  },
});

export default colors;
