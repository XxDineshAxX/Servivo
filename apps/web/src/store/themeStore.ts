import { create } from 'zustand';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('servivo-theme', theme);
}

// Initialise from localStorage or system preference
const stored = localStorage.getItem('servivo-theme') as Theme | null;
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialTheme: Theme = stored ?? (systemDark ? 'dark' : 'light');
applyTheme(initialTheme);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,
  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      return { theme: next };
    }),
}));
