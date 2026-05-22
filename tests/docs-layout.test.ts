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
    expect(source).toContain('class="docs-layout"');
    expect(source).toContain('data-layout="docs"');
    expect(source).toContain('class="docs-content rich-layout"');
    expect(source).toContain('class="docs-header layout-card"');
    expect(source).toContain('Documentation');
    expect(source).toContain('{model.title}');
    expect(source).toContain('model.description');
    expect(source).toContain('class="docs-sections"');
    expect(source).toContain('{#each model.sections as section (section.key)}');
    expect(source).not.toContain('{#each model.sections as section (section.id)}');
    expect(source).toContain('class="docs-section layout-card markdown-body"');
    expect(source).toContain('data-section-key={section.key}');
    expect(source).toContain('data-section-id={section.id}');
    expect(source).not.toMatch(/\s+id=\{section\.id\}/);
    expect(source).toContain('data-source-line={section.sourceLine}');
    expect(source).toContain('{@html section.html}');
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
    expect(source).toContain('{#if showTOC && model.sections.length > 1}');
    expect(source).toContain('class="docs-sidebar"');
    expect(source).toContain('Docs');
    expect(source).toContain('<nav aria-label="Document sections">');
    expect(source).toContain('onclick={() => scrollToSection(section.key, section.id)}');
    expect(source).toContain('class:deep={section.level > 2}');
    expect(source).toContain('{section.title}');
  });
});
