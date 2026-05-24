import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/webview/App.svelte', 'utf8');

describe('App.svelte export messaging', () => {
  it('posts exportHTML message', () => {
    expect(source).toContain("postMessage({ type: 'exportHTML' })");
  });

  it('posts exportPDF message', () => {
    expect(source).toContain("postMessage({ type: 'exportPDF' })");
  });

  it('passes onExportHTML and onExportPDF to LayoutToolbar', () => {
    expect(source).toContain('onExportHTML');
    expect(source).toContain('onExportPDF');
  });
});
