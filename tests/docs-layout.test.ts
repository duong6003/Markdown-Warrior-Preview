import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';

const source = readFileSync('src/webview/layouts/DocsLayout.svelte', 'utf8');

describe('DocsLayout rich shell', () => {
  it('renders the required rich docs structure from document sections', () => {
    compile(source, { filename: 'DocsLayout.svelte', generate: 'client' });

    expect(source).toContain('let { model, showTOC = true }');
    expect(source).not.toContain("import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';");
    expect(source).not.toContain('let expanded = $state<Record<string, boolean>>({});');
    expect(source).not.toContain('function toggleSection(sectionKey: string)');
    expect(source).toContain('class="docs-layout"');
    expect(source).toContain('data-layout="docs"');
    expect(source).toContain('class="docs-content rich-layout"');
    expect(source).toContain('class="docs-header lc-card--hero"');
    expect(source).toContain('Documentation');
    expect(source).toContain('{model.title}');
    expect(source).toContain('model.description');
    expect(source).toContain('class="docs-sections"');
    expect(source).toContain('{#each model.sections as section (section.key)}');
    expect(source).not.toContain('{#each model.sections as section (section.id)}');
    expect(source).toContain('class="docs-section lc-card"');
    expect(source).not.toContain('balanced-card--preview');
    expect(source).not.toContain('balanced-card--expanded');
    expect(source).not.toContain('balancedCardBodyId');
    expect(source).toContain('class="docs-section__body markdown-body"');
    expect(source).not.toContain('class="balanced-card__toggle"');
    expect(source).not.toContain('aria-expanded={expanded[section.key] ?');
    expect(source).not.toContain('balancedCardToggleLabel');
    expect(source).toContain('data-section-key={section.key}');
    expect(source).toContain('data-section-id={section.id}');
    expect(source).not.toMatch(/\s+id=\{section\.id\}/);
    expect(source).toContain('data-source-line={section.sourceLine}');
    expect(source).toContain('{@html section.html}');
    expect(source).not.toContain('layout-card');
  });

  it('uses GhostNav for section navigation', () => {
    expect(source).toContain('function scrollToSection(sectionKey: string, sectionId: string)');
    expect(source).toContain('document.querySelector');
    expect(source).toContain('[data-section-key="');
    expect(source).toContain('CSS.escape');
    expect(source).toContain('document.getElementById(sectionId)');
    expect(source).toContain("scrollIntoView({ behavior: 'smooth', block: 'start' })");
    expect(source).toContain("import GhostNav from '../lib/GhostNav.svelte'");
    expect(source).toContain('{#if showTOC}');
    expect(source).toContain('<GhostNav sections={model.sections}');
    expect(source).toContain('onNavigate={scrollToSection}');
    expect(source).not.toContain('class="docs-sidebar');
    expect(source).not.toContain('{#if hasSidebar}');
  });

  it('uses full-width single-column layout', () => {
    expect(source).not.toContain('let hasSidebar');
    expect(source).not.toContain('class:no-sidebar');
    expect(source).toContain('grid-template-columns: 1fr;');
    expect(source).toContain('max-width: 80ch;');
    expect(source).not.toContain('grid-template-columns: clamp(14rem, 22%, 20rem) minmax(0, 1fr);');
    expect(source).not.toContain('grid-column: 1 / -1;');
  });

  it('uses tokenized docs spacing and typography', () => {
    expect(source).toContain('grid-template-columns: 1fr;');
    expect(source).toContain('gap: var(--space-section-md);');
    expect(source).toContain('max-width: 80ch;');
    expect(source).toContain('.docs-section__body {');
    expect(source).toContain('padding: var(--space-section-sm);');
    expect(source).toContain(':global(.docs-section__body > :first-child)');
    expect(source).toContain(':global(.docs-section__body pre)');
    expect(source).toContain('font: 800 var(--text-3xl) / 1.1 var(--md-font-heading, var(--md-font-body));');
    expect(source).toContain('font: 800 var(--text-xs) / 1.4 var(--md-font-body);');
    expect(source).toContain('border-radius: var(--radius-md);');
    expect(source).not.toContain('--layout-');
    expect(source).not.toContain('translateX(3px)');
    expect(source).not.toContain('clamp(2.4rem, 7vw, 4.6rem)');
  });
});
