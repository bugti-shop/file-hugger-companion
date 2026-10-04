import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '@/utils/settingsStorage';
import { updateStatusBarStyle } from '@/utils/statusBar';
import { clearCustomThemeStyles, setActiveCustomThemeId } from '@/utils/customThemeStorage';
export type ThemeId = 'light' | 'dark' | 'ocean' | 'forest' | 'sunset' | 'rose' | 'midnight' | 'minimal' | 'nebula' | 'obsidian' | 'graphite' | 'onyx' | 'charcoal' | 'custom';

export const themes = [
  { id: 'light' as const, name: 'Light Mode', preview: 'bg-white border border-border' },
  { id: 'dark' as const, name: 'Default Dark', preview: 'bg-gray-900' },
  { id: 'ocean' as const, name: 'Ocean Blue', preview: 'bg-gradient-to-br from-blue-900 to-cyan-700' },
  { id: 'forest' as const, name: 'Forest Green', preview: 'bg-gradient-to-br from-green-900 to-emerald-700' },
  { id: 'sunset' as const, name: 'Sunset Orange', preview: 'bg-gradient-to-br from-orange-900 to-rose-700' },
  { id: 'rose' as const, name: 'Rose Gold', preview: 'bg-gradient-to-br from-rose-900 to-pink-700' },
  { id: 'midnight' as const, name: 'Midnight Purple', preview: 'bg-gradient-to-br from-purple-900 to-indigo-700' },
  { id: 'minimal' as const, name: 'Minimal Gray', preview: 'bg-gradient-to-br from-gray-800 to-slate-700' },
  { id: 'nebula' as const, name: 'Nebula', preview: 'bg-gradient-to-br from-purple-950 to-pink-800' },
  { id: 'obsidian' as const, name: 'Obsidian', preview: 'bg-gradient-to-br from-slate-950 to-blue-950' },
  { id: 'graphite' as const, name: 'Graphite', preview: 'bg-gradient-to-br from-slate-900 to-slate-700' },
  { id: 'onyx' as const, name: 'Onyx', preview: 'bg-gradient-to-br from-black to-gray-900' },
  { id: 'charcoal' as const, name: 'Charcoal', preview: 'bg-gradient-to-br from-stone-900 to-stone-700' },
];

const allThemeClasses: ThemeId[] = ['light', 'dark', 'ocean', 'forest', 'sunset', 'rose', 'midnight', 'minimal', 'nebula', 'obsidian', 'graphite', 'onyx', 'charcoal', 'custom'];
const darkThemes: ThemeId[] = ['obsidian', 'dark', 'ocean', 'forest', 'sunset', 'rose', 'midnight', 'minimal', 'nebula', 'graphite', 'onyx', 'charcoal'];

export const useDarkMode = () => {
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('light');
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
  const [isLoaded, setIsLoaded] = useState(false);
  const currentTheme = selectedTheme === 'light' && systemDark ? 'obsidian' : selectedTheme;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    setSystemDark(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  // Load theme from IndexedDB on mount
  useEffect(() => {
    const loadTheme = async () => {
      const saved = await getSetting<string>('theme', '');
      if (saved && allThemeClasses.includes(saved as ThemeId)) {
        setSelectedTheme(saved as ThemeId);
      } else {
        // Check for old darkMode setting
        const oldDarkMode = await getSetting<boolean>('darkMode', false);
        setSelectedTheme(oldDarkMode ? 'obsidian' : 'light');
      }
      setIsLoaded(true);
    };
    loadTheme();
  }, []);

  const isDarkMode = currentTheme !== 'light';

  useEffect(() => {
    if (!isLoaded) return;
    
    // Persist the user's choice, not a temporary system appearance override.
    setSetting('theme', selectedTheme);
    
    // Remove all theme classes first
    allThemeClasses.forEach(cls => {
      document.documentElement.classList.remove(cls);
    });
    
    // Tailwind's dark: rules rely on .dark, even when the chosen palette has its own class.
    if (currentTheme !== 'light') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.add(currentTheme);
    }
    
    // Update status bar to match theme
    updateStatusBarStyle(currentTheme !== 'light', currentTheme);
  }, [currentTheme, selectedTheme, isLoaded]);

  // Cycle through dark themes on toggle. When `isPro` is false, only the
  // first dark theme ('obsidian') is free; cycling beyond it is gated, so the
  // toggle behaves as a simple light↔dark switch for free users.
  const toggleDarkMode = (isPro: boolean = true) => {
    setSelectedTheme(prev => {
      if (!isPro) {
        return prev === 'light' ? 'obsidian' : 'light';
      }
      // If currently light, go to first dark theme
      if (prev === 'light') {
        return 'obsidian';
      }
      // Find current dark theme index and go to next
      const currentIndex = darkThemes.indexOf(prev);
      const nextIndex = (currentIndex + 1) % (darkThemes.length + 1);
      // If we've cycled through all dark themes, go back to light
      if (nextIndex === darkThemes.length) {
        return 'light';
      }
      return darkThemes[nextIndex];
    });
  };

  const setTheme = (themeId: ThemeId) => {
    if (themeId !== 'custom') {
      clearCustomThemeStyles();
      setActiveCustomThemeId(null);
    }
    setSelectedTheme(themeId);
  };

  return { isDarkMode, toggleDarkMode, currentTheme, setTheme, themes };
};
