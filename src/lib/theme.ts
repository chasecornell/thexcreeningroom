export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'screening-room-theme';

export function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  
  // Default to dark as primary cinema aesthetic
  return 'dark';
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  }

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    console.error('Failed to save theme to localStorage', e);
  }
}
