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
    expect(source).toContain('class="story-layout"');
    expect(source).toContain('data-layout="story"');
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
    expect(source).toContain('class="story-section__content markdown-body layout-card"');
    expect(source).toContain('{@html section.html}');
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

  it('defines story layout motion, section sizing, card content, and mobile rules', () => {
    expect(source).toContain('position: relative;');
    expect(source).toContain('scroll-snap-type: y proximity;');
    expect(source).toContain('min-height: min(42rem, calc(100vh - 3rem));');
    expect(source).toContain('scroll-snap-align: start;');
    expect(source).toContain('writing-mode: vertical-rl;');
    expect(source).toContain('position: fixed;');
    expect(source).toContain('background: var(--layout-card-bg);');
    expect(source).toContain(':global(.story-section__content h1)');
    expect(source).toContain(':global(.story-section__content h2)');
    expect(source).toContain(':global(.story-section__content hr)');
    expect(source).toContain('display: none;');
    expect(source).toContain('@media (max-width: 760px)');
    expect(source).toContain('grid-template-columns: 1fr;');
  });
});
