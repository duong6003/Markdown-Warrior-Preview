import { describe, expect, it, vi } from 'vitest';
import { buildExportHTML } from '../src/extension/exporter';
import type { FontInlineResult } from '../src/extension/font-inliner';

vi.mock('vscode', () => ({
  Uri: { file: vi.fn(), joinPath: vi.fn() },
  window: { showInformationMessage: vi.fn(), showSaveDialog: vi.fn() },
  env: { openExternal: vi.fn() },
}));

const mockFont: FontInlineResult = {
  css: '',
  stacks: { body: 'system-ui, sans-serif', heading: 'system-ui, sans-serif', code: 'monospace' },
};

const mockCss = {
  markdown: '.markdown-body { color: red; }',
  themes: ':root[data-theme="github-dark"] { --theme-bg: #0d1117; }',
  extensions: '.frontmatter-block { border: 1px solid; }',
};

describe('buildExportHTML', () => {
  it('sets data-theme on html element', () => {
    const out = buildExportHTML('<p>Hi</p>', 'test', 'github-dark', mockFont, mockCss);
    expect(out).toContain('data-theme="github-dark"');
  });

  it('embeds themes CSS', () => {
    const out = buildExportHTML('<p>Hi</p>', 'test', 'catppuccin-mocha', mockFont, mockCss);
    expect(out).toContain(mockCss.themes);
  });

  it('embeds markdown-body CSS', () => {
    const out = buildExportHTML('<p>Hi</p>', 'test', 'catppuccin-mocha', mockFont, mockCss);
    expect(out).toContain(mockCss.markdown);
  });

  it('embeds extensions CSS', () => {
    const out = buildExportHTML('<p>Hi</p>', 'test', 'catppuccin-mocha', mockFont, mockCss);
    expect(out).toContain(mockCss.extensions);
  });

  it('includes font stack overrides in :root', () => {
    const fontResult: FontInlineResult = {
      css: '',
      stacks: { body: "'Inter', sans-serif", heading: "'Playfair Display', serif", code: "'Fira Code', monospace" },
    };
    const out = buildExportHTML('<p>Hi</p>', 'test', 'github-dark', fontResult, mockCss);
    expect(out).toContain("--md-font-body: 'Inter', sans-serif");
    expect(out).toContain("--md-font-heading: 'Playfair Display', serif");
    expect(out).toContain("--md-font-mono: 'Fira Code', monospace");
  });

  it('embeds Google Fonts CSS when fontResult.css is non-empty', () => {
    const fontResult: FontInlineResult = {
      css: '@font-face { font-family: Inter; }',
      stacks: mockFont.stacks,
    };
    const out = buildExportHTML('<p>Hi</p>', 'test', 'github-dark', fontResult, mockCss);
    expect(out).toContain('@font-face { font-family: Inter; }');
  });

  it('does not contain prefers-color-scheme', () => {
    const out = buildExportHTML('<p>Hi</p>', 'test', 'catppuccin-mocha', mockFont, mockCss);
    expect(out).not.toContain('prefers-color-scheme');
  });

  it('includes extraCss when provided', () => {
    const printCss = '@media print { body { background: white; } }';
    const out = buildExportHTML('<p>Hi</p>', 'test', 'catppuccin-mocha', mockFont, mockCss, printCss);
    expect(out).toContain('@media print');
  });

  it('includes body HTML content', () => {
    const out = buildExportHTML('<p>Hello World</p>', 'test', 'github-dark', mockFont, mockCss);
    expect(out).toContain('<p>Hello World</p>');
  });

  it('escapes title to prevent XSS', () => {
    const out = buildExportHTML('<p/>', 'My Doc <test>', 'github-dark', mockFont, mockCss);
    expect(out).toContain('<title>My Doc &lt;test&gt;</title>');
  });

  it('includes KaTeX stylesheet link', () => {
    const out = buildExportHTML('<p>Hi</p>', 'test', 'github-dark', mockFont, mockCss);
    expect(out).toContain('katex');
  });
});
