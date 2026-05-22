<script lang="ts">
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC }: { model: DocumentModel; showTOC: boolean } = $props();
  let expanded = $state<Record<string, boolean>>({});
  let taskPercent = $derived(
    model.stats.taskCount > 0 ? Math.round((model.stats.completedTaskCount / model.stats.taskCount) * 100) : null,
  );

  function toggleSection(sectionKey: string) {
    expanded[sectionKey] = !expanded[sectionKey];
  }

  function dashboardBodyId(sectionKey: string) {
    return `dashboard-body-${sectionKey.replace(/[^A-Za-z0-9_-]/g, '-')}`;
  }
</script>

<div class="dashboard-layout rich-layout" data-layout="dashboard" data-toc-visible={showTOC}>
  <header class="dashboard-header lc-card--hero" data-reveal>
    <span>Dashboard</span>
    <h1>{model.title}</h1>
    {#if model.description}
      <p>{model.description}</p>
    {/if}
  </header>

  <section class="dashboard-stats" aria-label="Document stats">
    <div class="dashboard-stat lc-card" data-reveal>
      <span>Words</span>
      <strong>{model.stats.wordCount.toLocaleString()}</strong>
    </div>
    <div class="dashboard-stat lc-card" data-reveal>
      <span>Sections</span>
      <strong>{model.stats.sectionCount.toLocaleString()}</strong>
    </div>
    <div class="dashboard-stat lc-card" data-reveal>
      <span>Code</span>
      <strong>{model.stats.codeBlockCount.toLocaleString()}</strong>
    </div>
    <div class="dashboard-stat lc-card" data-reveal>
      <span>Tasks</span>
      <strong>{taskPercent === null ? '-' : `${taskPercent}%`}</strong>
    </div>
  </section>

  <section class="dashboard-grid" aria-label="Dashboard sections">
    {#each model.sections as section (section.key)}
      <article
        class="dashboard-card lc-card"
        class:expanded={expanded[section.key]}
        data-section-key={section.key}
        data-section-id={section.id}
        data-reveal
        data-source-line={section.sourceLine}
      >
        <button
          class="dashboard-card__header"
          type="button"
          aria-pressed={expanded[section.key] ? 'true' : 'false'}
          aria-controls={dashboardBodyId(section.key)}
          onclick={() => toggleSection(section.key)}
        >
          <span class="dashboard-card__title">{section.title}</span>
          <span class="dashboard-card__types">
            {section.blockTypes.join(' / ') || 'text'}
          </span>
        </button>
        <div
          id={dashboardBodyId(section.key)}
          class="dashboard-card__body markdown-body"
        >
          {@html section.html}
        </div>
      </article>
    {/each}
  </section>
</div>

<style>
  .dashboard-layout {
    display: grid;
    gap: var(--space-section-md);
  }

  .dashboard-header {
    display: grid;
    gap: var(--space-4);
    padding: var(--space-section-lg);
  }

  .dashboard-header span,
  .dashboard-stat span,
  .dashboard-card__types {
    color: var(--md-accent);
    font: 800 var(--text-xs) / 1.4 var(--md-font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .dashboard-header h1 {
    max-width: 16ch;
    margin: 0;
    color: var(--md-fg-primary);
    font: 800 var(--text-hero) / 0.98 var(--md-font-heading, var(--md-font-body));
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }

  .dashboard-header p {
    max-width: 60ch;
    margin: 0;
    color: var(--md-fg-secondary);
    font-size: var(--text-lg);
    line-height: 1.4;
  }

  .dashboard-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    gap: var(--space-4);
  }

  .dashboard-stat {
    display: grid;
    gap: var(--space-3);
    min-width: 0;
    padding: var(--space-4);
    overflow: hidden;
  }

  .dashboard-stat strong {
    color: var(--md-fg-primary);
    font: 800 var(--text-2xl) / 1 var(--md-font-heading, var(--md-font-body));
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr));
    gap: var(--space-section-md);
    align-items: start;
  }

  .dashboard-card {
    min-width: 0;
    overflow: hidden;
  }

  .dashboard-card__header {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    width: 100%;
    min-height: 4rem;
    padding: var(--space-4) var(--space-6);
    border-bottom: 1px solid var(--md-border);
    color: var(--md-fg-primary);
    background: color-mix(in srgb, var(--md-bg-tertiary) 58%, transparent);
  }

  .dashboard-card__header:hover,
  .dashboard-card__header:focus-visible {
    background: color-mix(in srgb, var(--md-accent) 12%, var(--md-bg-tertiary) 88%);
  }

  .dashboard-card__title {
    min-width: 0;
    color: var(--md-fg-primary);
    font: 700 var(--text-base) / 1.3 var(--md-font-heading, var(--md-font-body));
    overflow-wrap: anywhere;
  }

  .dashboard-card__types {
    flex: 0 0 auto;
    max-width: 45%;
    overflow: hidden;
    text-align: right;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-card__body {
    max-height: 18rem;
    padding: var(--space-4) var(--space-6) var(--space-6);
    overflow: auto;
    transition: max-height 0.2s ease;
  }

  .dashboard-card.expanded .dashboard-card__body {
    max-height: none;
    overflow: visible;
  }

  :global(.dashboard-card__body > :first-child) {
    margin-top: 0;
  }

  :global(.dashboard-card__body > :last-child) {
    margin-bottom: 0;
  }

  :global(.dashboard-card__body table) {
    display: block;
    width: 100%;
    overflow-x: auto;
  }

  :global(.dashboard-card__body pre) {
    max-width: 100%;
    overflow: auto;
    border-radius: var(--radius-md);
  }

  @media (max-width: 760px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }

    .dashboard-header {
      padding: var(--space-section-sm);
    }

    .dashboard-stat,
    .dashboard-card__header,
    .dashboard-card__body {
      padding: var(--space-4);
    }

    .dashboard-card__header {
      align-items: flex-start;
      flex-direction: column;
      gap: var(--space-2);
    }

    .dashboard-card__types {
      max-width: 100%;
      text-align: left;
    }
  }
</style>
