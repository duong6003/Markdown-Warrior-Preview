import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';
import { describe, expect, it } from 'vitest';
import { THEMES } from '../src/webview/lib/theme-registry';

const source = readFileSync('src/webview/components/ThemePanel.svelte', 'utf8');

describe('ThemePanel.svelte', () => {
  it('compiles without errors', () => {
    let result: ReturnType<typeof compile>;
    expect(() => {
      result = compile(source, { filename: 'ThemePanel.svelte', generate: 'client' });
    }).not.toThrow();
    const errors = result!.warnings.filter(w => !w.code?.startsWith('a11y'));
    expect(errors).toHaveLength(0);
  });

  it('renders theme data from the registry', () => {
    expect(THEMES).toHaveLength(12);
    expect(source).toContain("import { THEMES } from '../lib/theme-registry'");
    expect(source).toContain('theme.id');
    expect(source).toContain('theme.label');
    expect(source).toContain('onSelect(theme.id)');
  });

  it('source contains dark and light group labels', () => {
    expect(source).toContain('Dark');
    expect(source).toContain('Light');
  });

  it('marks active theme with aria-pressed or class:active', () => {
    expect(source).toMatch(/aria-pressed|class:active/);
  });

  it('iterates themes with each block', () => {
    expect(source).toContain('{#each');
  });

  it('shows three swatches per theme row', () => {
    expect(source).toContain('theme.swatches.slice(0, 3)');
  });
});
