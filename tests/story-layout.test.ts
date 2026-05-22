import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';

const source = readFileSync('src/webview/layouts/StoryLayout.svelte', 'utf8');

describe('StoryLayout rich shell', () => {
  it('renders the required rich story structure from document sections', () => {
    compile(source, {
      filename: 'StoryLayout.svelte',
      generate: 'client',
    });

    expect(source).toContain('let { model, showTOC }');
    expect(source).toContain("import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';");
    expect(source).toContain('let hasDots = $derived(showTOC && model.sections.length > 1)');
    expect(source).toContain('let expanded = $state<Record<string, boolean>>({});');
    expect(source).toContain('function toggleSection(sectionKey: string)');
    expect(source).toContain('class="story-layout"');
    expect(source).toContain('data-layout="story"');
    expect(source).toContain('{#if hasDots}');
    expect(source).toContain('class="story-dots"');
    expect(source).toContain('aria-label="Story sections"');
    expect(source).toContain('class="story-sections"');
    expect(source).toContain('{#each model.sections as section, index (section.key)}');
    expect(source).not.toContain('{#each model.sections as section (section.id)}');
    expect(source).toContain('class="story-section"');
    expect(source).toContain('data-section-key={section.key}');
    expect(source).toContain('data-section-id={section.id}');
    expect(source).not.toMatch(/\s+id=\{section\.id\}/);
    expect(source).toContain('data-reveal');
    expect(source).toContain('data-source-line={section.sourceLine}');
    expect(source).toContain('class="story-section__number"');
    expect(source).toContain('{formatSectionNumber(index)}');
    expect(source).toContain('class="story-section__content lc-card balanced-card balanced-card--preview"');
    expect(source).toContain('class:balanced-card--expanded={expanded[section.key]}');
    expect(source).toContain("balancedCardBodyId('story', section.key)");
    expect(source).toContain('class="story-section__body balanced-card__body markdown-body"');
    expect(source).toContain('class="balanced-card__toggle"');
    expect(source).toContain('aria-expanded={expanded[section.key] ?');
    expect(source).toContain('balancedCardToggleLabel(Boolean(expanded[section.key]))');
    expect(source).not.toContain('class="story-section__content markdown-body lc-card"');
    expect(source).toContain('{@html section.html}');
    expect(source).not.toContain('layout-card');
  });

  it('scrolls dot buttons to unique section wrappers first', () => {
    expect(source).toContain('function scrollToSection(sectionKey: string, sectionId: string)');
    expect(source).toContain('document.querySelector');
    expect(source).toContain('[data-section-key="');
    expect(source).toContain('CSS.escape');
    expect(source).toContain('document.getElementById(sectionId)');
    expect(source.indexOf('[data-section-key="')).toBeLessThan(
      source.indexOf('document.getElementById(sectionId)'),
    );
    expect(source).toContain("scrollIntoView({ behavior: 'smooth', block: 'start' })");
    expect(source).toContain('onclick={() => scrollToSection(section.key, section.id)}');
    expect(source).toContain('title={section.title}');
    expect(source).toContain('aria-label={`Jump to ${section.title}`}');
    expect(source).toContain('{formatSectionNumber(index)}');
  });

  it('defines fluid story sections, softer section height, and tokenized hierarchy', () => {
    expect(source).toContain('width: min(100%, 1180px);');
    expect(source).toContain('padding: var(--space-section-xl) var(--space-section-md) var(--space-section-md);');
    expect(source).toContain('gap: var(--space-section-md);');
    expect(source).toContain('scroll-snap-type: y proximity;');
    expect(source).toContain('grid-template-columns: clamp(5rem, 10vw, 8rem) minmax(0, 1fr);');
    expect(source).toContain('min-height: min(32rem, 80vh);');
    expect(source).toContain('scroll-snap-align: start;');
    expect(source).toContain('font: 800 var(--text-hero) / 1 var(--md-font-heading, var(--md-font-body));');
    expect(source).toContain('opacity: 0.35;');
    expect(source).toContain('.story-section:hover .story-section__number');
    expect(source).toContain('opacity: 1;');
    expect(source).toContain('writing-mode: vertical-rl;');
    expect(source).toContain('padding: var(--space-section-sm);');
    expect(source).toContain('position: fixed;');
    expect(source).toContain('max-height: calc(100vh - var(--space-8));');
    expect(source).toContain('overflow-y: auto;');
    expect(source).toContain('.story-section__body {');
    expect(source).toContain('padding: var(--space-section-sm);');
    expect(source).toContain(':global(.story-section__body h1)');
    expect(source).toContain(':global(.story-section__body h2)');
    expect(source).toContain('font-size: var(--text-hero);');
    expect(source).toContain(':global(.story-section__body img)');
    expect(source).toContain(':global(.story-section__body p)');
    expect(source).toContain('font-size: var(--text-lg);');
    expect(source).toContain('border-radius: var(--radius-md);');
    expect(source).toContain('box-shadow: var(--shadow-sm);');
    expect(source).toContain(':global(.story-section__body hr)');
    expect(source).toContain('display: none;');
    expect(source).toContain('@media (max-width: 760px)');
    expect(source).toContain('grid-template-columns: 1fr;');
    expect(source).toContain('position: sticky;');
    expect(source).not.toContain('--layout-');
    expect(source).not.toContain('min-height: min(42rem, calc(100vh - 3rem));');
    expect(source).not.toContain('grid-template-columns: minmax(3rem, 6rem) minmax(0, 1fr);');
    expect(source).not.toContain('translateX(-3px)');
  });
});
