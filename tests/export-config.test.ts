import { describe, expect, it } from 'vitest';
import { THEMES } from '../src/shared/theme-registry';
import {
  DEFAULT_EXPORT_CONFIG,
  THEME_EXPORT_COLORS,
  getExportThemeColors,
  normalizeExportConfig,
} from '../src/shared/export-config';

describe('export-config', () => {
  it('defines defaults matching preview defaults', () => {
    expect(DEFAULT_EXPORT_CONFIG).toEqual({
      themeId: 'catppuccin-mocha',
      fontBody: 'system',
      fontHeading: 'inherit',
      fontCode: 'cascadia',
    });
  });

  it('has export colors for every registered theme', () => {
    for (const theme of THEMES) {
      expect(THEME_EXPORT_COLORS[theme.id], theme.id).toBeTruthy();
    }
  });

  it('each theme color entry has all required CSS variables', () => {
    for (const [id, colors] of Object.entries(THEME_EXPORT_COLORS)) {
      expect(colors.bg, `${id}.bg`).toMatch(/^#/);
      expect(colors.bgSecondary, `${id}.bgSecondary`).toMatch(/^#/);
      expect(colors.bgTertiary, `${id}.bgTertiary`).toMatch(/^#/);
      expect(colors.fg, `${id}.fg`).toMatch(/^#/);
      expect(colors.fgSecondary, `${id}.fgSecondary`).toMatch(/^#/);
      expect(colors.fgMuted, `${id}.fgMuted`).toMatch(/^#/);
      expect(colors.accent, `${id}.accent`).toMatch(/^#/);
      expect(colors.accentHover, `${id}.accentHover`).toMatch(/^#/);
      expect(colors.border, `${id}.border`).toMatch(/^#/);
      expect(colors.codeBg, `${id}.codeBg`).toMatch(/^#/);
    }
  });

  it('returns github-dark colors for unknown theme ids', () => {
    expect(getExportThemeColors('missing-theme')).toBe(THEME_EXPORT_COLORS['github-dark']);
  });

  it('normalizes invalid config fields to defaults', () => {
    expect(normalizeExportConfig({ themeId: 7, fontBody: null, fontHeading: [], fontCode: {} })).toEqual(DEFAULT_EXPORT_CONFIG);
  });

  it('preserves valid string config fields', () => {
    expect(normalizeExportConfig({
      themeId: 'github-light',
      fontBody: 'inter',
      fontHeading: 'playfair',
      fontCode: 'fira',
    })).toEqual({
      themeId: 'github-light',
      fontBody: 'inter',
      fontHeading: 'playfair',
      fontCode: 'fira',
    });
  });
});
