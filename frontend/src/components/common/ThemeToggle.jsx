import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = ({ className = '', showLabel = false }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center gap-2 p-2 rounded-xl border transition-all duration-200 ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-amber-400 hover:text-amber-300'
          : 'bg-white hover:bg-slate-100 border-slate-200 text-indigo-600 hover:text-indigo-700 shadow-sm'
      } ${className}`}
      title={isDark ? 'Switch to White Theme' : 'Switch to Dark Theme'}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-300 hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
};
