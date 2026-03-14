import { createContext } from 'react';

export type Theme = 'dark' | 'light';

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

export const STORAGE_KEY = 'app_theme';

export const ThemeContext = createContext<ThemeContextValue | null>(null);
