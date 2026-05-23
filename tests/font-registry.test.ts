import { describe, it, expect } from 'vitest';
import {
  BODY_FONTS,
  HEADING_FONTS,
  CODE_FONTS,
  getFontEntry,
  type FontEntry,
} from '../src/shared/font-registry';
import * as webviewRegistry from '../src/webview/lib/font-registry';

describe('font-registry', () => {
  it('webview registry re-exports the shared registry', () => {
    expect(webviewRegistry.BODY_FONTS).toBe(BODY_FONTS);
    expect(webviewRegistry.HEADING_FONTS).toBe(HEADING_FONTS);
    expect(webviewRegistry.CODE_FONTS).toBe(CODE_FONTS);
    expect(webviewRegistry.getFontEntry).toBe(getFontEntry);
  });

  it('BODY_FONTS has at least 4 entries', () => {
    expect(BODY_FONTS.length).toBeGreaterThanOrEqual(4);
  });

  it('HEADING_FONTS has at least 4 entries', () => {
    expect(HEADING_FONTS.length).toBeGreaterThanOrEqual(4);
  });

  it('CODE_FONTS has at least 3 entries', () => {
    expect(CODE_FONTS.length).toBeGreaterThanOrEqual(3);
  });

  it('all entries have required fields', () => {
    const all: FontEntry[] = [...BODY_FONTS, ...HEADING_FONTS, ...CODE_FONTS];
    for (const f of all) {
      expect(f.id, 'id').toBeTruthy();
      expect(f.label, 'label').toBeTruthy();
      expect(f.stack, 'stack').toBeTruthy();
    }
  });

  it('no duplicate ids within BODY_FONTS', () => {
    const ids = BODY_FONTS.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no duplicate ids within HEADING_FONTS', () => {
    const ids = HEADING_FONTS.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no duplicate ids within CODE_FONTS', () => {
    const ids = CODE_FONTS.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('first BODY_FONTS entry is system (no googleFamily)', () => {
    expect(BODY_FONTS[0].id).toBe('system');
    expect(BODY_FONTS[0].googleFamily).toBeUndefined();
  });

  it('first HEADING_FONTS entry is inherit (no googleFamily)', () => {
    expect(HEADING_FONTS[0].id).toBe('inherit');
    expect(HEADING_FONTS[0].googleFamily).toBeUndefined();
  });

  it('first CODE_FONTS entry is cascadia (no googleFamily)', () => {
    expect(CODE_FONTS[0].id).toBe('cascadia');
    expect(CODE_FONTS[0].googleFamily).toBeUndefined();
  });

  it('getFontEntry returns the correct entry', () => {
    const entry = getFontEntry('inter', BODY_FONTS);
    expect(entry.label).toBe('Inter');
    expect(entry.googleFamily).toBe('Inter');
  });

  it('getFontEntry throws on unknown id', () => {
    expect(() => getFontEntry('nonexistent', BODY_FONTS)).toThrow('Unknown font: nonexistent');
  });

  it('Google Font entries have googleFamily set', () => {
    const jetbrains = getFontEntry('jetbrains', CODE_FONTS);
    expect(jetbrains.googleFamily).toBeTruthy();
  });
});
