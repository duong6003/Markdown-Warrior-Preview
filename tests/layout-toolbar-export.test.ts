import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/webview/components/LayoutToolbar.svelte', 'utf8');

describe('LayoutToolbar export dropdown', () => {
  it('compiles without errors', () => {
    let result: ReturnType<typeof compile>;
    expect(() => {
      result = compile(source, { filename: 'LayoutToolbar.svelte', generate: 'client' });
    }).not.toThrow();
    const errors = result!.warnings.filter(w => !w.code?.startsWith('a11y'));
    expect(errors).toHaveLength(0);
  });

  it('declares onExportHTML and onExportPDF props', () => {
    expect(source).toContain('onExportHTML');
    expect(source).toContain('onExportPDF');
  });

  it('has an export toggle button', () => {
    expect(source).toContain('layout-toolbar__export-toggle');
  });

  it('has export dropdown items for HTML and PDF', () => {
    expect(source).toContain('Export as HTML');
    expect(source).toContain('Export as PDF');
  });

  it('uses exportOpen state to show/hide dropdown', () => {
    expect(source).toContain('exportOpen');
  });

  it('closes dropdown on window click outside', () => {
    expect(source).toContain('svelte:window');
  });
});
