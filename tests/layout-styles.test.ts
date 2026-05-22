import { readFileSync } from 'node:fs';

const source = readFileSync('src/webview/styles/layouts.css', 'utf8');

describe('shared layout stylesheet', () => {
  it('defines the token-first spacing, type, radius, and shadow system', () => {
    expect(source).toContain('--space-section-xs: clamp(1rem, 2vw, 1.5rem);');
    expect(source).toContain('--space-section-sm: clamp(1.5rem, 3vw, 2.5rem);');
    expect(source).toContain('--space-section-md: clamp(2rem, 4vw, 3.5rem);');
    expect(source).toContain('--space-section-lg: clamp(3rem, 5vw, 5rem);');
    expect(source).toContain('--space-section-xl: clamp(4rem, 7vw, 7rem);');
    expect(source).toContain('--space-1: 0.25rem;');
    expect(source).toContain('--space-2: 0.5rem;');
    expect(source).toContain('--space-3: 0.75rem;');
    expect(source).toContain('--space-4: 1rem;');
    expect(source).toContain('--space-6: 1.5rem;');
    expect(source).toContain('--space-8: 2rem;');
    expect(source).toContain('--text-xs: 0.75rem;');
    expect(source).toContain('--text-sm: 0.875rem;');
    expect(source).toContain('--text-base: 1rem;');
    expect(source).toContain('--text-lg: 1.25rem;');
    expect(source).toContain('--text-xl: 1.563rem;');
    expect(source).toContain('--text-2xl: 1.953rem;');
    expect(source).toContain('--text-3xl: clamp(2.4rem, 5vw, 3.5rem);');
    expect(source).toContain('--text-hero: clamp(3rem, 7vw, 5rem);');
    expect(source).toContain('--radius-sm: 6px;');
    expect(source).toContain('--radius-md: 10px;');
    expect(source).toContain('--radius-lg: 16px;');
    expect(source).toContain('--radius-full: 9999px;');
    expect(source).toContain('--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1);');
    expect(source).toContain('--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.1);');
    expect(source).toContain('--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.04), 0 20px 25px rgba(0, 0, 0, 0.1);');
  });

  it('defines card variants and removes legacy layout card classes', () => {
    expect(source).toContain('.lc-card,');
    expect(source).toContain('.lc-card--hero,');
    expect(source).toContain('.lc-card--flat');
    expect(source).toContain('box-shadow: var(--shadow-sm);');
    expect(source).toContain('box-shadow: var(--shadow-md);');
    expect(source).toContain('transform: translateY(-2px);');
    expect(source).toContain('linear-gradient(135deg, color-mix(in srgb, var(--md-accent) 12%, transparent), transparent 45%)');
    expect(source).not.toContain('.layout-card');
    expect(source).not.toContain('--layout-card');
    expect(source).not.toContain('--layout-gap');
    expect(source).not.toContain('--layout-wide-max');
  });

  it('centralizes toolbar and layout navigation interaction states', () => {
    expect(source).toContain('.docs-sidebar button:hover,');
    expect(source).toContain('.magazine-rail button:hover,');
    expect(source).toContain('transform: translateX(2px);');
    expect(source).toContain('.story-dots button:hover,');
    expect(source).toContain('transform: translateY(-2px);');
    expect(source).toContain('.layout-toolbar__pill:hover,');
    expect(source).toContain('transform: translateY(-1px);');
    expect(source).toContain('background: color-mix(in srgb, var(--md-accent) 16%, transparent);');
    expect(source).not.toContain('translateX(3px)');
    expect(source).not.toContain('translateX(-3px)');
  });
});
