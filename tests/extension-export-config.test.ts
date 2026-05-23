import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/extension/extension.ts', 'utf8');

describe('extension exportHTML command config wiring', () => {
  it('passes PreviewProvider export config into exporter.exportHTML', () => {
    expect(source).toContain('const config = previewProvider.getExportConfig()');
    expect(source).toContain('await exporter.exportHTML(editor, config)');
  });

  it('uses async command handler for HTML export', () => {
    expect(source).toMatch(/markdownWarrior\.exportHTML',[\s\S]*async \(\) =>/);
  });
});
