import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/extension/exporter.ts', 'utf8');

describe('Exporter HTML config support', () => {
  it('exports buildExportHTML as a standalone function', () => {
    expect(source).toContain('export function buildExportHTML(');
  });

  it('imports theme registry and font inliner', () => {
    expect(source).toContain("from '../shared/export-config'");
    expect(source).toContain("from '../shared/theme-registry'");
    expect(source).toContain("from './font-inliner'");
  });

  it('exportHTML accepts config argument', () => {
    expect(source).toContain('public async exportHTML(editor: vscode.TextEditor, config: ExportConfig)');
  });

  it('renders markdown with selected Shiki theme', () => {
    expect(source).toContain('const shikiTheme = getTheme(config.themeId).shikiTheme');
    expect(source).toContain('this.engine.render(text, shikiTheme)');
  });

  it('prepares fonts before writing HTML', () => {
    expect(source).toContain('const fontResult = await prepareFonts(config');
    expect(source).toContain('if (!fontResult) return');
  });

  it('shows Embed, Use system fallbacks, and Cancel options', () => {
    expect(source).toContain("'Embed'");
    expect(source).toContain("'Use system fallbacks'");
    expect(source).toContain("'Cancel'");
  });

  it('sets data-theme attribute on exported HTML', () => {
    expect(source).toContain('data-theme="${themeId}"');
  });

  it('reads CSS from dist/export-styles', () => {
    expect(source).toContain("'dist', 'export-styles'");
    expect(source).toContain("'markdown-body.css'");
    expect(source).toContain("'themes.css'");
    expect(source).toContain("'extensions.css'");
  });

  it('does not contain prefers-color-scheme', () => {
    expect(source).not.toContain('prefers-color-scheme');
  });

  it('PDF export uses print-color-adjust: exact', () => {
    expect(source).toContain('print-color-adjust: exact');
  });

  it('does not contain old wrapper methods', () => {
    expect(source).not.toContain('wrapExportHTMLDocument');
    expect(source).not.toContain('wrapInHTMLDocument');
  });
});
