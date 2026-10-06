import { useSyncExternalStore } from 'react';
import { getSetting, setSetting } from '@/utils/settingsStorage';
import { updateStatusBarStyle } from '@/utils/statusBar';
import { clearCustomThemeStyles, setActiveCustomThemeId } from '@/utils/customThemeStorage';
export type ThemeId = 'light' | 'dark' | 'ocean' | 'forest' | 'sunset' | 'rose' | 'midnight' | 'minimal' | 'nebula' | 'obsidian' | 'graphite' | 'onyx' | 'charcoal' | 'custom';
type ThemePreference = ThemeId | 'system';

export const themes = [
  { id: 'light' as const, name: 'Light Mode', preview: 'bg-white border border-border' },
  { id: 'dark' as const, name: 'Obsidian Dark', preview: 'bg-gray-900' },
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

// One appearance store for startup and every screen; mounting Settings never resets it.
let selectedTheme: ThemePreference = 'system';
let initialization: Promise<void> | undefined;
const listeners = new Set<() => void>();
const systemMedia = window.matchMedia('(prefers-color-scheme: dark)');
const normalizeTheme = (theme: ThemePreference): ThemePreference => theme === 'dark' ? 'obsidian' : theme;
export const getCurrentTheme = (): ThemeId => selectedTheme === 'system'
  ? (systemMedia.matches ? 'obsidian' : 'light') : selectedTheme;

const applyAppearance = () => {
  const current = getCurrentTheme();
  allThemeClasses.forEach(cls => document.documentElement.classList.remove(cls));
  if (current !== 'custom') clearCustomThemeStyles();
  if (current !== 'light') document.documentElement.classList.add('dark', current);
  document.documentElement.style.colorScheme = current === 'light' ? 'light' : 'dark';
  updateStatusBarStyle(current !== 'light', current);
  listeners.forEach(listener => listener());
};
systemMedia.addEventListener('change', () => {
  if (selectedTheme === 'system') applyAppearance();
});
// Paint the system palette immediately, before async settings or React loads.
applyAppearance();

export const initializeTheme = (): Promise<void> => {
  if (initialization) return initialization;
  initialization = (async () => {
    const saved = await getSetting<string>('theme', 'system');
    selectedTheme = saved === 'system' || allThemeClasses.includes(saved as ThemeId)
      ? normalizeTheme(saved as ThemePreference) : 'system';
    applyAppearance();
  })();
  return initialization;
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

export const useDarkMode = () => {
  const currentTheme = useSyncExternalStore(subscribe, getCurrentTheme);
  const setTheme = (themeId: ThemeId) => {
    selectedTheme = normalizeTheme(themeId);
    if (themeId !== 'custom') setActiveCustomThemeId(null);
    applyAppearance();
    void setSetting('theme', selectedTheme);
  };
  const toggleDarkMode = (isPro = true) => {
    if (!isPro) { setTheme(currentTheme === 'light' ? 'obsidian' : 'light'); return; }
    const index = darkThemes.indexOf(currentTheme);
    setTheme(currentTheme === 'light' ? 'obsidian' : (darkThemes[index + 1] ?? 'light'));
  };
  return { isDarkMode: currentTheme !== 'light', toggleDarkMode, currentTheme, setTheme, themes };
};
