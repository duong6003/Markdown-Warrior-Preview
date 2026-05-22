import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';

const source = readFileSync('src/webview/layouts/MagazineLayout.svelte', 'utf8');

describe('MagazineLayout rich shell', () => {
  it('renders the required rich magazine structure from document sections', () => {
    compile(source, {
      filename: 'MagazineLayout.svelte',
      generate: 'client',
    });

    expect(source).toContain("import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';");
    expect(source).toContain("import { clipDetect } from '../lib/clip-detect';");
    expect(source).toContain('let expanded = $state<Record<string, boolean>>({});');
    expect(source).toContain('let needsClip = $state<Record<string, boolean>>({});');
    expect(source).toContain('function toggleSection(sectionKey: string)');
    expect(source).toContain('data-layout="magazine"');
    expect(source).toContain('class="magazine-layout rich-layout"');
    expect(source).toContain('class="magazine-hero lc-card--hero"');
    expect(source).toContain('Markdown Warrior');
    expect(source).toContain('{model.title}');
    expect(source).toContain('model.description');
    expect(source).toContain('<article class="magazine-content">');
    expect(source).not.toContain('<main class="magazine-content">');
    expect(source).toContain('{#each model.sections as section (section.key)}');
    expect(source).not.toContain('{#each model.sections as section (section.id)}');
    expect(source).toContain('class="magazine-section lc-card balanced-card"');
    expect(source).not.toContain('balanced-card--preview');
    expect(source).toContain('class:balanced-card--clippable={needsClip[section.key]}');
    expect(source).toContain('class:balanced-card--expanded={expanded[section.key]}');
    expect(source).toContain("balancedCardBodyId('magazine', section.key)");
    expect(source).toContain('class="magazine-section__body balanced-card__body markdown-body"');
    expect(source).toContain('use:clipDetect=');
    expect(source).toContain('needsClip[section.key] = needs');
    expect(source).toContain('{#if needsClip[section.key]}');
    expect(source).toContain('class="balanced-card__toggle"');
    expect(source).toContain('aria-expanded={expanded[section.key] ?');
    expect(source).toContain('aria-controls={balancedCardBodyId(');
    expect(source).toContain('onclick={() => toggleSection(section.key)}');
    expect(source).toContain('balancedCardToggleLabel(Boolean(expanded[section.key]))');
    expect(source).not.toContain('class="magazine-section lc-card markdown-body"');
    expect(source).toContain('data-section-key={section.key}');
    expect(source).toContain('data-section-id={section.id}');
    expect(source).not.toMatch(/\s+id=\{section\.id\}/);
    expect(source).toContain('data-source-line={section.sourceLine}');
    expect(source).toContain('{@html section.html}');
    expect(source).not.toContain('layout-card');
  });

  it('shows a conditional section rail and scrolls sections smoothly', () => {
    expect(source).toContain('function scrollToSection(sectionKey: string, sectionId: string)');
    expect(source).toContain('document.getElementById(sectionId)');
    expect(source).toContain('document.querySelector');
    expect(source).toContain('[data-section-key="');
    expect(source).toContain('CSS.escape');
    expect(source.indexOf('[data-section-key="')).toBeLessThan(
      source.indexOf('document.getElementById(sectionId)'),
    );
    expect(source).toContain("scrollIntoView({ behavior: 'smooth', block: 'start' })");
    expect(source).toContain('{#if showTOC && model.sections.length > 1}');
    expect(source).toContain('class="magazine-rail lc-card--flat"');
    expect(source).toContain('Sections');
    expect(source).toContain('onclick={() => scrollToSection(section.key, section.id)}');
    expect(source).toContain('{section.title}');
  });

  it('uses tokenized magazine hero, rail, and section proportions', () => {
    expect(source).toContain('gap: var(--space-section-md);');
    expect(source).toContain('padding: var(--space-section-xl);');
    expect(source).toContain('font: 800 var(--text-hero) / 0.98 var(--md-font-heading, var(--md-font-body));');
    expect(source).toContain('font-size: var(--text-lg);');
    expect(source).toContain('grid-template-columns: minmax(0, 1fr) clamp(14rem, 24%, 18rem);');
    expect(source).toContain('font: 700 var(--text-xs) / 1.4 var(--md-font-body);');
    expect(source).toContain('.magazine-section__body {');
    expect(source).toContain('padding: var(--space-section-sm);');
    expect(source).toContain(':global(.magazine-section__body img)');
    expect(source).toContain(':global(.magazine-section__body table)');
    expect(source).toContain('font-size: var(--text-2xl);');
    expect(source).toContain('border-radius: var(--radius-md);');
    expect(source).not.toContain('--layout-');
    expect(source).not.toContain('font: 800 5rem/0.95');
    expect(source).not.toContain('translateX(3px)');
  });
});
