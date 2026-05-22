import { describe, it, expect } from 'vitest';
import { THEMES, DEFAULT_THEME, getTheme } from '../src/webview/lib/theme-registry';

describe('theme-registry', () => {
  it('exports 12 themes', () => {
    expect(THEMES).toHaveLength(12);
  });

  it('all themes have required fields', () => {
    for (const theme of THEMES) {
      expect(theme.id, 'id').toBeTruthy();
      expect(theme.label, 'label').toBeTruthy();
      expect(['dark', 'light'], 'mode').toContain(theme.mode);
      expect(theme.shikiTheme, 'shikiTheme').toBeTruthy();
      expect(theme.swatches, 'swatches length').toHaveLength(5);
    }
  });

  it('all swatches are 6-digit hex colors', () => {
    const hex = /^#[0-9a-f]{6}$/i;
    for (const theme of THEMES) {
      for (const swatch of theme.swatches) {
        expect(swatch, `${theme.id} swatch ${swatch}`).toMatch(hex);
      }
    }
  });

  it('has no duplicate ids', () => {
    const ids = THEMES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('DEFAULT_THEME exists in registry', () => {
    expect(THEMES.find(t => t.id === DEFAULT_THEME)).toBeDefined();
  });

  it('getTheme returns correct definition for dracula', () => {
    const theme = getTheme('dracula');
    expect(theme.label).toBe('Dracula');
    expect(theme.mode).toBe('dark');
    expect(theme.shikiTheme).toBe('dracula');
  });

  it('getTheme throws on unknown id', () => {
    expect(() => getTheme('nonexistent')).toThrow('Unknown theme: nonexistent');
  });
});
