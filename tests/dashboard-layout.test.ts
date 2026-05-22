import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';

const source = readFileSync('src/webview/layouts/DashboardLayout.svelte', 'utf8');

describe('DashboardLayout rich shell', () => {
  it('renders dashboard shell, stats, and keyed section cards', () => {
    compile(source, {
      filename: 'DashboardLayout.svelte',
      generate: 'client',
    });

    expect(source).toContain('let { model, showTOC }');
    expect(source).toContain('let taskPercent = $derived');
    expect(source).toContain('class="dashboard-layout rich-layout"');
    expect(source).toContain('data-layout="dashboard"');
    expect(source).toContain('class="dashboard-header layout-card"');
    expect(source).toContain('<span>Dashboard</span>');
    expect(source).toContain('{model.title}');
    expect(source).toContain('model.description');
    expect(source).toContain('class="dashboard-stats"');
    expect(source).toContain('aria-label="Document stats"');
    expect(source).toContain('Words');
    expect(source).toContain('Sections');
    expect(source).toContain('Code');
    expect(source).toContain('Tasks');
    expect(source).toContain('{taskPercent === null ?');
    expect(source).toContain('class="dashboard-grid"');
    expect(source).toContain('aria-label="Dashboard sections"');
    expect(source).toContain('{#each model.sections as section (section.key)}');
    expect(source).not.toContain('{#each model.sections as section (section.id)}');
    expect(source).toContain('class="dashboard-card layout-card"');
    expect(source).toContain('class:expanded={expanded[section.key]}');
    expect(source).toContain('data-section-key={section.key}');
    expect(source).toContain('data-section-id={section.id}');
    expect(source).not.toMatch(/\s+id=\{section\.id\}/);
    expect(source).toContain('data-source-line={section.sourceLine}');
    expect(source).toContain('aria-expanded={expanded[section.key] ?');
    expect(source).toContain('onclick={() => toggleSection(section.key)}');
    expect(source).toContain('{section.blockTypes.join');
    expect(source).toContain('class="dashboard-card__body markdown-body"');
    expect(source).toContain('{@html section.html}');
  });

  it('defines responsive dashboard styles and collapsed card bodies', () => {
    expect(source).toContain('width: min(100%, var(--layout-wide-max));');
    expect(source).toContain('grid-template-columns: repeat(4, minmax(0, 1fr));');
    expect(source).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
    expect(source).toContain('overflow: hidden;');
    expect(source).toContain('display: flex;');
    expect(source).toContain('max-height: 320px;');
    expect(source).toContain('.dashboard-card.expanded .dashboard-card__body');
    expect(source).toContain('max-height: none;');
    expect(source).toContain(':global(.dashboard-card__body table)');
    expect(source).toContain(':global(.dashboard-card__body pre)');
    expect(source).toContain('@media (max-width: 760px)');
    expect(source).toContain('grid-template-columns: 1fr;');
  });
});
