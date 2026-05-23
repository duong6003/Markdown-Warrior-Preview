import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { THEMES } from '../src/shared/theme-registry';
import {
  DEFAULT_EXPORT_CONFIG,
  THEME_EXPORT_COLORS,
  getExportThemeColors,
  normalizeExportConfig,
} from '../src/shared/export-config';

function extractThemeTokens(themeId: string): Record<string, string> {
  const source = readFileSync('src/webview/styles/themes.css', 'utf8');
  const escapedThemeId = themeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blockPattern = new RegExp(`:root\\[data-theme="${escapedThemeId}"\\]\\s*{(?<body>[\\s\\S]*?)}`);
  const body = source.match(blockPattern)?.groups?.body;
  if (!body) throw new Error(`Missing theme CSS block: ${themeId}`);

  return Object.fromEntries(
    [...body.matchAll(/--(theme-[\w-]+):\s*(#[0-9a-fA-F]{3,8});/g)].map(([, key, value]) => [
      key,
      value.toLowerCase(),
    ]),
  );
}

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

  it('matches export color variables to preview theme tokens', () => {
    for (const theme of THEMES) {
      const tokens = extractThemeTokens(theme.id);
      expect(THEME_EXPORT_COLORS[theme.id], theme.id).toEqual({
        bg: tokens['theme-bg'],
        bgSecondary: tokens['theme-surface'],
        bgTertiary: tokens['theme-surface'],
        fg: tokens['theme-text'],
        fgSecondary: tokens['theme-text-muted'],
        fgMuted: tokens['theme-text-muted'],
        accent: tokens['theme-accent'],
        accentHover: tokens['theme-heading'],
        border: tokens['theme-border'],
        codeBg: tokens['theme-surface'],
      });
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
