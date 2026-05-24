import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/extension/preview-provider.ts', 'utf8');

describe('PreviewProvider export message handling', () => {
  it('handles exportHTML webview message', () => {
    expect(source).toContain("case 'exportHTML'");
  });

  it('calls exporter.exportHTML with current editor and export config', () => {
    expect(source).toContain('this.exporter.exportHTML');
    expect(source).toContain('this.getExportConfig()');
  });

  it('handles exportPDF webview message', () => {
    expect(source).toContain("case 'exportPDF'");
  });

  it('calls exporter.exportPDF with current editor', () => {
    expect(source).toContain('this.exporter.exportPDF');
  });

  it('guards export calls with currentEditor check', () => {
    expect(source).toContain('this.currentEditor');
  });
});
