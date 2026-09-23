import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'system', // 'light', 'dark', 'system'
      activeTheme: 'light', 

      setTheme: (newTheme) => {
        let active = newTheme;
        if (newTheme === 'system') {
          active = getSystemTheme();
        }
        
        document.documentElement.setAttribute('data-theme', active);
        
        // Also update meta theme-color for mobile status bar
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', active === 'dark' ? '#0f172a' : '#f8fafc');
        }

        set({ theme: newTheme, activeTheme: active });
      },

      initTheme: () => {
        const { theme } = get();
        let active = theme;
        if (theme === 'system') {
          active = getSystemTheme();
        }
        document.documentElement.setAttribute('data-theme', active);
        set({ activeTheme: active });

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
          if (get().theme === 'system') {
            const newActive = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newActive);
            set({ activeTheme: newActive });
          }
        });
      },
    }),
    {
      name: 'biosync-mobile-theme',
    }
  )
);

export default useThemeStore;
