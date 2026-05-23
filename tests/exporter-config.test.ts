import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/extension/exporter.ts', 'utf8');

describe('Exporter HTML config support', () => {
  it('imports export config, theme colors, theme registry, and font inliner', () => {
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

  it('wraps exported HTML with baked theme variables and font CSS', () => {
    expect(source).toContain('getExportThemeColors(config.themeId)');
    expect(source).toContain('--md-bg-primary: ${colors.bg};');
    expect(source).toContain('--md-font-heading: ${fontResult.stacks.heading};');
    expect(source).toContain('${fontResult.css}');
  });

  it('does not use prefers-color-scheme in HTML export wrapper', () => {
    const wrapperIndex = source.indexOf('private wrapExportHTMLDocument');
    expect(wrapperIndex).toBeGreaterThanOrEqual(0);
    const pdfWrapperIndex = source.indexOf('private wrapInHTMLDocument', wrapperIndex);
    expect(pdfWrapperIndex).toBeGreaterThan(wrapperIndex);
    const exportHtmlSection = source.slice(wrapperIndex, pdfWrapperIndex);
    expect(exportHtmlSection).not.toContain('prefers-color-scheme');
  });
});
