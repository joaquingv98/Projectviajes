import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/useTheme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="fixed z-[9997] bottom-4 left-4 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105"
      style={{
        bottom: '1rem',
        left: '1rem',
        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.15)',
        border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
        color: isDark ? 'white' : '#0f172a',
      }}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
