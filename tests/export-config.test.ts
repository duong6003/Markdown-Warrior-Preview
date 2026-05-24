import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EXPORT_CONFIG,
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
