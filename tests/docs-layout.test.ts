import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';

const source = readFileSync('src/webview/layouts/DocsLayout.svelte', 'utf8');

describe('DocsLayout rich shell', () => {
  it('renders the required rich docs structure from document sections', () => {
    compile(source, {
      filename: 'DocsLayout.svelte',
      generate: 'client',
    });

    expect(source).toContain('let { model, showTOC = true }');
    expect(source).toContain("import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';");
    expect(source).toContain('let expanded = $state<Record<string, boolean>>({});');
    expect(source).toContain('function toggleSection(sectionKey: string)');
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
    expect(source).toContain('class="docs-section lc-card balanced-card balanced-card--preview"');
    expect(source).toContain('class:balanced-card--expanded={expanded[section.key]}');
    expect(source).toContain("balancedCardBodyId('docs', section.key)");
    expect(source).toContain('class="docs-section__body balanced-card__body markdown-body"');
    expect(source).toContain('class="balanced-card__toggle"');
    expect(source).toContain('aria-expanded={expanded[section.key] ?');
    expect(source).toContain('balancedCardToggleLabel(Boolean(expanded[section.key]))');
    expect(source).not.toContain('class="docs-section lc-card markdown-body"');
    expect(source).toContain('data-section-key={section.key}');
    expect(source).toContain('data-section-id={section.id}');
    expect(source).not.toMatch(/\s+id=\{section\.id\}/);
    expect(source).toContain('data-source-line={section.sourceLine}');
    expect(source).toContain('{@html section.html}');
    expect(source).not.toContain('layout-card');
  });

  it('shows a conditional docs sidebar and scrolls unique wrappers first', () => {
    expect(source).toContain('function scrollToSection(sectionKey: string, sectionId: string)');
    expect(source).toContain('document.querySelector');
    expect(source).toContain('[data-section-key="');
    expect(source).toContain('CSS.escape');
    expect(source).toContain('document.getElementById(sectionId)');
    expect(source.indexOf('[data-section-key="')).toBeLessThan(
      source.indexOf('document.getElementById(sectionId)'),
    );
    expect(source).toContain("scrollIntoView({ behavior: 'smooth', block: 'start' })");
    expect(source).toContain('{#if hasSidebar}');
    expect(source).toContain('class="docs-sidebar lc-card--flat"');
    expect(source).toContain('Docs');
    expect(source).toContain('<nav aria-label="Document sections">');
    expect(source).toContain('onclick={() => scrollToSection(section.key, section.id)}');
    expect(source).toContain('class:deep={section.level > 2}');
    expect(source).toContain('{section.title}');
  });

  it('expands content to one column when the docs sidebar is omitted', () => {
    expect(source).toContain('let hasSidebar = $derived(showTOC && model.sections.length > 1)');
    expect(source).toContain('class:no-sidebar={!hasSidebar}');
    expect(source).toContain('{#if hasSidebar}');
    expect(source).not.toContain('{#if showTOC && model.sections.length > 1}');
    expect(source).toContain('.docs-layout.no-sidebar');
    expect(source).toContain('grid-template-columns: 1fr;');
    expect(source).toContain('grid-column: 1 / -1;');
  });

  it('uses tokenized docs spacing, type, and proportional grid values', () => {
    expect(source).toContain('grid-template-columns: clamp(14rem, 22%, 20rem) minmax(0, 1fr);');
    expect(source).toContain('gap: var(--space-section-md);');
    expect(source).toContain('max-width: 72ch;');
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
