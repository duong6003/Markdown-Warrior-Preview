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
    expect(source).toContain("import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';");
    expect(source).toContain('let taskPercent = $derived');
    expect(source).toContain('class="dashboard-layout rich-layout"');
    expect(source).toContain('data-layout="dashboard"');
    expect(source).toContain('class="dashboard-header lc-card--hero"');
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
    expect(source).toContain('class="dashboard-card lc-card balanced-card balanced-card--preview"');
    expect(source).toContain('class:balanced-card--expanded={expanded[section.key]}');
    expect(source).toContain("balancedCardBodyId('dashboard', section.key)");
    expect(source).toContain('data-section-key={section.key}');
    expect(source).toContain('data-section-id={section.id}');
    expect(source).not.toMatch(/\s+id=\{section\.id\}/);
    expect(source).toContain('data-source-line={section.sourceLine}');
    expect(source).toContain('class="balanced-card__toggle"');
    expect(source).toContain('aria-expanded={expanded[section.key] ?');
    expect(source).toContain('aria-controls={balancedCardBodyId(');
    expect(source).toContain('onclick={() => toggleSection(section.key)}');
    expect(source).toContain('{section.blockTypes.join');
    expect(source).toContain('class="dashboard-card__body balanced-card__body markdown-body"');
    expect(source).toContain('balancedCardToggleLabel(Boolean(expanded[section.key]))');
    expect(source).not.toContain('class:expanded={expanded[section.key]}');
    expect(source).not.toContain('aria-pressed={expanded[section.key] ?');
    expect(source).not.toContain('aria-hidden={!expanded[section.key]}');
    expect(source).not.toContain('inert={expanded[section.key] ? undefined : true}');
    expect(source).toContain('{@html section.html}');
    expect(source).not.toContain('layout-card');
  });

  it('defines adaptive dashboard grids and semantic collapsed card bodies', () => {
    expect(source).toContain('grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));');
    expect(source).toContain('grid-template-columns: repeat(auto-fill, minmax(var(--balanced-card-min-width), 1fr));');
    expect(source).toContain('.dashboard-card__body {');
    expect(source).toContain('padding: var(--space-4) var(--space-6) 0;');
    expect(source).not.toContain('max-height: 18rem;');
    expect(source).not.toContain('.dashboard-card.expanded .dashboard-card__body');
    expect(source).toContain(':global(.dashboard-card__body table)');
    expect(source).toContain(':global(.dashboard-card__body pre)');
    expect(source).toContain('@media (max-width: 760px)');
    expect(source).toContain('grid-template-columns: 1fr;');
    expect(source).not.toContain('grid-template-columns: repeat(4, minmax(0, 1fr));');
    expect(source).not.toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
    expect(source).not.toContain('max-height: 320px;');
  });

  it('uses shared layout tokens for dashboard type, spacing, radius, and hero scale', () => {
    expect(source).toContain('gap: var(--space-section-md);');
    expect(source).toContain('gap: var(--space-4);');
    expect(source).toContain('padding: var(--space-section-lg);');
    expect(source).toContain('font: 800 var(--text-hero) / 0.98 var(--md-font-heading, var(--md-font-body));');
    expect(source).toContain('font: 800 var(--text-xs) / 1.4 var(--md-font-body);');
    expect(source).toContain('font: 800 var(--text-2xl) / 1 var(--md-font-heading, var(--md-font-body));');
    expect(source).toContain('border-radius: var(--radius-md);');
    expect(source).not.toContain('--layout-');
  });
});
