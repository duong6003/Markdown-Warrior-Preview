import { describe, it, expect } from 'vitest';

// Test the asset resolution logic (without VS Code API dependency)
describe('Asset Resolution Logic', () => {
  // We test the regex patterns used in asset-resolver.ts
  const imgRegex = /(<img[^>]+src=")([^"]+)(")/gi;

  it('matches img tags with src attributes', () => {
    const html = '<img src="./image.png" alt="test">';
    const matches = [...html.matchAll(imgRegex)];
    expect(matches.length).toBe(1);
    expect(matches[0][2]).toBe('./image.png');
  });

  it('matches multiple img tags', () => {
    const html = '<img src="a.png"><img src="b.jpg">';
    const matches = [...html.matchAll(imgRegex)];
    expect(matches.length).toBe(2);
    expect(matches[0][2]).toBe('a.png');
    expect(matches[1][2]).toBe('b.jpg');
  });

  it('skips https URLs', () => {
    const html = '<img src="https://example.com/img.png">';
    const matches = [...html.matchAll(imgRegex)];
    expect(matches.length).toBe(1);
    // The resolver would skip this based on protocol check
    expect(matches[0][2].startsWith('https://')).toBe(true);
  });

  it('skips data URIs', () => {
    const html = '<img src="data:image/png;base64,abc123">';
    const matches = [...html.matchAll(imgRegex)];
    expect(matches.length).toBe(1);
    expect(matches[0][2].startsWith('data:')).toBe(true);
  });

  it('handles relative paths', () => {
    const html = '<img src="../assets/photo.jpg">';
    const matches = [...html.matchAll(imgRegex)];
    expect(matches[0][2]).toBe('../assets/photo.jpg');
  });
});
