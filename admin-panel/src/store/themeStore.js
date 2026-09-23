import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const getSystemTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const applyTheme = (theme) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.setAttribute('data-theme', theme);
};

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'system',
      activeTheme: 'light',

      setTheme: (newTheme) => {
        const active =
          newTheme === 'system'
            ? getSystemTheme()
            : newTheme;

        applyTheme(active);

        set({
          theme: newTheme,
          activeTheme: active,
        });
      },

      initTheme: () => {
        const { theme } = get();

        const active =
          theme === 'system'
            ? getSystemTheme()
            : theme;

        applyTheme(active);

        set({
          activeTheme: active,
        });
      },

      syncSystemTheme: () => {
        if (get().theme !== 'system') {
          return;
        }

        const active = getSystemTheme();

        applyTheme(active);

        set({
          activeTheme: active,
        });
      },
    }),
    {
      name: 'biosync-admin-theme',
    }
  )
);

export default useThemeStore;