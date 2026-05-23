// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { loadGoogleFont, isFontLoaded } from '../src/webview/lib/font-loader';

describe('font-loader', () => {
  beforeEach(() => {
    document.querySelectorAll('link[data-gfont]').forEach(el => el.remove());
  });

  it('injects a stylesheet link for the given font family', () => {
    loadGoogleFont('Inter');
    const link = document.querySelector<HTMLLinkElement>('link[data-gfont="Inter"]');
    expect(link).not.toBeNull();
    expect(link?.rel).toBe('stylesheet');
    expect(link?.href).toContain('fonts.googleapis.com');
    expect(link?.href).toContain('Inter');
  });

  it('uses display=swap in the URL', () => {
    loadGoogleFont('Lato');
    const link = document.querySelector<HTMLLinkElement>('link[data-gfont="Lato"]');
    expect(link?.href).toContain('display=swap');
  });

  it('does not inject duplicate link tags for the same family', () => {
    loadGoogleFont('Inter');
    loadGoogleFont('Inter');
    const links = document.querySelectorAll('link[data-gfont="Inter"]');
    expect(links.length).toBe(1);
  });

  it('isFontLoaded returns false before loading', () => {
    expect(isFontLoaded('Poppins')).toBe(false);
  });

  it('isFontLoaded returns true after loading', () => {
    loadGoogleFont('Poppins');
    expect(isFontLoaded('Poppins')).toBe(true);
  });

  it('can load multiple different families independently', () => {
    loadGoogleFont('Inter');
    loadGoogleFont('Raleway');
    expect(isFontLoaded('Inter')).toBe(true);
    expect(isFontLoaded('Raleway')).toBe(true);
  });
});
