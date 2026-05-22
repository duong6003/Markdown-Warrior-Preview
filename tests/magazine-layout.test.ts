import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';

const source = readFileSync('src/webview/layouts/MagazineLayout.svelte', 'utf8');

describe('MagazineLayout rich shell', () => {
  it('renders the required rich magazine structure from document sections', () => {
    compile(source, {
      filename: 'MagazineLayout.svelte',
      generate: 'client',
    });

    expect(source).toContain('data-layout="magazine"');
    expect(source).toContain('class="magazine-layout rich-layout"');
    expect(source).toContain('class="magazine-hero layout-card"');
    expect(source).toContain('Markdown Warrior');
    expect(source).toContain('{model.title}');
    expect(source).toContain('model.description');
    expect(source).toContain('class="magazine-content"');
    expect(source).toContain('{#each model.sections as section');
    expect(source).toContain('class="magazine-section layout-card markdown-body"');
    expect(source).toContain('data-section-id={section.id}');
    expect(source).not.toMatch(/\s+id=\{section\.id\}/);
    expect(source).toContain('data-source-line={section.sourceLine}');
    expect(source).toContain('{@html section.html}');
  });

  it('shows a conditional section rail and scrolls sections smoothly', () => {
    expect(source).toContain('function scrollToSection(id: string)');
    expect(source).toContain('document.getElementById(id)');
    expect(source).toContain('document.querySelector');
    expect(source).toContain('[data-section-id="');
    expect(source).toContain('CSS.escape');
    expect(source).toContain("scrollIntoView({ behavior: 'smooth', block: 'start' })");
    expect(source).toContain('{#if showTOC && model.sections.length > 1}');
    expect(source).toContain('class="magazine-rail"');
    expect(source).toContain('Sections');
    expect(source).toContain('onclick={() => scrollToSection(section.id)}');
    expect(source).toContain('{section.title}');
  });
});
