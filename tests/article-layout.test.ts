import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';

const source = readFileSync('src/webview/layouts/ArticleLayout.svelte', 'utf8');

describe('ArticleLayout rich shell', () => {
  it('renders the required rich article structure from document sections', () => {
    compile(source, { filename: 'ArticleLayout.svelte', generate: 'client' });

    expect(source).toContain("import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';");
    expect(source).toContain("import { clipDetect } from '../lib/clip-detect';");
    expect(source).toContain('let expanded = $state<Record<string, boolean>>({});');
    expect(source).toContain('let needsClip = $state<Record<string, boolean>>({});');
    expect(source).toContain('function toggleSection(sectionKey: string)');
    expect(source).toContain('data-layout="article"');
    expect(source).toContain('class="article-layout rich-layout"');
    expect(source).toContain('class="article-hero lc-card--hero"');
    expect(source).toContain('>Article<');
    expect(source).not.toContain('Markdown Warrior');
    expect(source).toContain('{model.title}');
    expect(source).toContain('model.description');
    expect(source).toContain('<article class="article-content">');
    expect(source).not.toContain('<main class="article-content">');
    expect(source).toContain('{#each model.sections as section (section.key)}');
    expect(source).not.toContain('{#each model.sections as section (section.id)}');
    expect(source).toContain('class="article-section lc-card balanced-card"');
    expect(source).not.toContain('balanced-card--preview');
    expect(source).toContain('class:balanced-card--clippable={needsClip[section.key]}');
    expect(source).toContain('class:balanced-card--expanded={expanded[section.key]}');
    expect(source).toContain("balancedCardBodyId('article', section.key)");
    expect(source).toContain('class="article-section__body balanced-card__body markdown-body"');
    expect(source).toContain('use:clipDetect=');
    expect(source).toContain('needsClip[section.key] = needs');
    expect(source).toContain('{#if needsClip[section.key]}');
    expect(source).toContain('class="balanced-card__toggle"');
    expect(source).toContain('aria-expanded={expanded[section.key] ?');
    expect(source).toContain('aria-controls={balancedCardBodyId(');
    expect(source).toContain('onclick={() => toggleSection(section.key)}');
    expect(source).toContain('balancedCardToggleLabel(Boolean(expanded[section.key]))');
    expect(source).toContain('data-section-key={section.key}');
    expect(source).toContain('data-section-id={section.id}');
    expect(source).not.toMatch(/\s+id=\{section\.id\}/);
    expect(source).toContain('data-source-line={section.sourceLine}');
    expect(source).toContain('{@html section.html}');
    expect(source).not.toContain('layout-card');
  });

  it('uses GhostNav for section navigation', () => {
    expect(source).toContain('function scrollToSection(sectionKey: string, sectionId: string)');
    expect(source).toContain('document.getElementById(sectionId)');
    expect(source).toContain('document.querySelector');
    expect(source).toContain('[data-section-key="');
    expect(source).toContain('CSS.escape');
    expect(source.indexOf('[data-section-key="')).toBeLessThan(
      source.indexOf('document.getElementById(sectionId)'),
    );
    expect(source).toContain("scrollIntoView({ behavior: 'smooth', block: 'start' })");
    expect(source).toContain("import GhostNav from '../lib/GhostNav.svelte'");
    expect(source).toContain('<GhostNav sections={model.sections}');
    expect(source).toContain('onNavigate={scrollToSection}');
    expect(source).not.toContain('class="article-rail');
    expect(source).not.toContain('{#if showTOC && model.sections.length > 1}');
    expect(source).not.toMatch(/\{#if\s+[^}]*showTOC/);
  });

  it('uses tokenized article hero and section proportions', () => {
    expect(source).toContain('gap: var(--space-section-md);');
    expect(source).toContain('padding: var(--space-section-xl);');
    expect(source).toContain('font: 800 var(--text-hero) / 0.98 var(--md-font-heading, var(--md-font-body));');
    expect(source).toContain('font-size: var(--text-lg);');
    expect(source).toContain('font: 700 var(--text-xs) / 1.4 var(--md-font-body);');
    expect(source).toContain('.article-section__body {');
    expect(source).toContain('padding: var(--space-section-sm);');
    expect(source).toContain(':global(.article-section__body img)');
    expect(source).toContain(':global(.article-section__body table)');
    expect(source).toContain('font-size: var(--text-2xl);');
    expect(source).toContain('border-radius: var(--radius-md);');
    expect(source).not.toContain('--layout-');
    expect(source).not.toContain('font: 800 5rem/0.95');
    expect(source).not.toContain('translateX(3px)');
    expect(source).not.toContain('grid-template-columns: minmax(0, 1fr) clamp(14rem, 24%, 18rem);');
  });
});
