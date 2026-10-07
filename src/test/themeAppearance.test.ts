import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/settingsStorage', () => ({ getSetting: vi.fn(), setSetting: vi.fn() }));
vi.mock('@/utils/statusBar', () => ({ updateStatusBarStyle: vi.fn() }));
vi.mock('@/utils/customThemeStorage', () => ({ clearCustomThemeStyles: vi.fn(), setActiveCustomThemeId: vi.fn() }));
import { getSetting } from '@/utils/settingsStorage';

describe('startup appearance', () => {
  beforeEach(() => { vi.resetModules(); document.documentElement.className = ''; });
  const boot = async (saved: string, dark: boolean) => {
    vi.mocked(getSetting).mockResolvedValue(saved);
    window.matchMedia = vi.fn().mockReturnValue({ matches: dark, addEventListener: vi.fn() });
    const theme = await import('@/hooks/useDarkMode');
    await theme.initializeTheme();
    return theme;
  };
  it('first launch on a dark device uses Obsidian', async () => {
    const theme = await boot('system', true);
    expect(theme.getCurrentTheme()).toBe('obsidian');
    expect(document.documentElement.classList.contains('obsidian')).toBe(true);
  });
  it('first launch on a light device stays light', async () => {
    const theme = await boot('system', false);
    expect(theme.getCurrentTheme()).toBe('light');
  });
  it('manual light choice remains light on a dark device', async () => {
    const theme = await boot('light', true);
    await theme.initializeTheme();
    expect(theme.getCurrentTheme()).toBe('light');
  });
  it('legacy default dark resolves to Obsidian', async () => {
    const theme = await boot('dark', false);
    expect(theme.getCurrentTheme()).toBe('obsidian');
  });
});