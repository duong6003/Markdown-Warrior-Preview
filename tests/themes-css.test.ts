import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { THEMES } from '../src/webview/lib/theme-registry';

const source = readFileSync('src/webview/styles/themes.css', 'utf8');

const THEME_VARS = [
  '--theme-bg',
  '--theme-surface',
  '--theme-text',
  '--theme-text-muted',
  '--theme-heading',
  '--theme-accent',
  '--theme-border',
  '--theme-shadow',
  '--theme-font-body',
  '--theme-font-mono',
  '--theme-radius',
];

const MD_BRIDGE_VARS = [
  '--md-bg-primary',
  '--md-bg-secondary',
  '--md-bg-tertiary',
  '--md-fg-primary',
  '--md-fg-secondary',
  '--md-fg-muted',
  '--md-accent',
  '--md-accent-hover',
  '--md-border',
  '--md-code-bg',
  '--md-selection',
  '--md-font-body',
  '--md-font-mono',
  '--md-radius',
  '--md-shadow',
  '--md-shadow-lg',
];

describe('themes.css', () => {
  it('defines a :root default block', () => {
    expect(source).toMatch(/:root\s*\{/);
  });

  it('defines all 12 data-theme blocks', () => {
    for (const theme of THEMES) {
      expect(source, `missing block for ${theme.id}`).toContain(`[data-theme="${theme.id}"]`);
    }
  });

  it(':root default block contains all 11 theme variables', () => {
    const rootBlock = source.match(/:root\s*\{([^}]+)\}/)?.[1] ?? '';
    for (const v of THEME_VARS) {
      expect(rootBlock, `root missing ${v}`).toContain(v);
    }
  });

  it('each theme block contains all 11 theme variables', () => {
    for (const theme of THEMES) {
      const pattern = new RegExp(`\\[data-theme="${theme.id}"\\]\\s*\\{([^}]+)\\}`);
      const block = source.match(pattern)?.[1] ?? '';
      for (const v of THEME_VARS) {
        expect(block, `${theme.id} missing ${v}`).toContain(v);
      }
    }
  });

  it('bridges selected theme variables into existing markdown tokens', () => {
    const bridgeBlock = source.match(/:root,\s*:root\[data-theme\]\s*\{([^}]+)\}/)?.[1] ?? '';
    for (const v of MD_BRIDGE_VARS) {
      expect(bridgeBlock, `bridge missing ${v}`).toContain(v);
    }
    expect(bridgeBlock).toContain('--md-bg-primary: var(--theme-bg)');
    expect(bridgeBlock).toContain('--md-fg-primary: var(--theme-text)');
    expect(bridgeBlock).toContain('--md-accent: var(--theme-accent)');
  });
});
