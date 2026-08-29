import { Sun, Moon } from 'lucide-react';
import { ThemeMode } from '../lib/theme';

interface ThemeToggleProps {
  theme: ThemeMode;
  onToggle: () => void;
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({
  theme,
  onToggle,
  className = '',
  showLabel = false,
}: ThemeToggleProps) {
  const isDark = theme === 'dark';

  return (
    <button
      id="theme-switcher-btn"
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer shadow-xs border ${
        isDark
          ? 'bg-[#16161a] hover:bg-[#202026] text-amber-300 hover:text-amber-200 border-[#26262a] hover:border-amber-400/30'
          : 'bg-white hover:bg-slate-50 text-amber-600 hover:text-amber-700 border-slate-200 hover:border-amber-300'
      } ${className}`}
    >
      <span className="relative flex items-center justify-center w-4 h-4">
        {isDark ? (
          <Sun className="w-3.5 h-3.5 text-amber-400 transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Moon className="w-3.5 h-3.5 text-indigo-500 transition-transform duration-300 rotate-0 scale-100" />
        )}
      </span>
      {showLabel ? (
        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
      ) : (
        <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
      )}
    </button>
  );
}
