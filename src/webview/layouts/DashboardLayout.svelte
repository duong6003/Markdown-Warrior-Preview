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
</script>

<div class="dashboard-layout rich-layout" data-layout="dashboard" data-toc-visible={showTOC}>
  <header class="dashboard-header layout-card" data-reveal>
    <span>Dashboard</span>
    <h1>{model.title}</h1>
    {#if model.description}
      <p>{model.description}</p>
    {/if}
  </header>

  <section class="dashboard-stats" aria-label="Document stats">
    <div class="dashboard-stat layout-card" data-reveal>
      <span>Words</span>
      <strong>{model.stats.wordCount.toLocaleString()}</strong>
    </div>
    <div class="dashboard-stat layout-card" data-reveal>
      <span>Sections</span>
      <strong>{model.stats.sectionCount.toLocaleString()}</strong>
    </div>
    <div class="dashboard-stat layout-card" data-reveal>
      <span>Code</span>
      <strong>{model.stats.codeBlockCount.toLocaleString()}</strong>
    </div>
    <div class="dashboard-stat layout-card" data-reveal>
      <span>Tasks</span>
      <strong>{taskPercent === null ? '-' : `${taskPercent}%`}</strong>
    </div>
  </section>

  <section class="dashboard-grid" aria-label="Dashboard sections">
    {#each model.sections as section (section.key)}
      <article
        class="dashboard-card layout-card"
        class:expanded={expanded[section.key]}
        data-section-key={section.key}
        data-section-id={section.id}
        data-reveal
        data-source-line={section.sourceLine}
      >
        <button
          class="dashboard-card__header"
          type="button"
          aria-expanded={expanded[section.key] ? 'true' : 'false'}
          onclick={() => toggleSection(section.key)}
        >
          <span class="dashboard-card__title">{section.title}</span>
          <span class="dashboard-card__types">
            {section.blockTypes.join(' / ') || 'text'}
          </span>
        </button>
        <div class="dashboard-card__body markdown-body">
          {@html section.html}
        </div>
      </article>
    {/each}
  </section>
</div>

<style>
  .dashboard-layout {
    display: grid;
    gap: var(--layout-gap);
  }

  .dashboard-header {
    display: grid;
    gap: 0.8rem;
    padding: clamp(1.5rem, 4vw, 3rem);
    overflow: hidden;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--md-accent) 14%, transparent), transparent 52%),
      color-mix(in srgb, var(--md-bg-secondary) 90%, var(--md-bg-primary) 10%);
  }

  .dashboard-header span,
  .dashboard-stat span,
  .dashboard-card__types {
    color: var(--md-accent);
    font: 800 0.72rem/1 var(--md-font-body);
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .dashboard-header h1 {
    max-width: 16ch;
    margin: 0;
    color: var(--md-fg-primary);
    font: 800 clamp(2.25rem, 6vw, 4.5rem) / 1 var(--md-font-heading, var(--md-font-body));
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }

  .dashboard-header p {
    max-width: 70ch;
    margin: 0;
    color: var(--md-fg-secondary);
    font-size: 1.05rem;
    line-height: 1.65;
  }

  .dashboard-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.85rem;
  }

  .dashboard-stat {
    display: grid;
    gap: 0.65rem;
    min-width: 0;
    padding: 1rem;
    overflow: hidden;
  }

  .dashboard-stat strong {
    color: var(--md-fg-primary);
    font: 800 clamp(1.55rem, 3vw, 2.35rem) / 1 var(--md-font-heading, var(--md-font-body));
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--layout-gap);
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
    gap: 1rem;
    width: 100%;
    min-height: 4rem;
    padding: 1rem 1.15rem;
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
    font: 750 1rem/1.25 var(--md-font-heading, var(--md-font-body));
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
    max-height: 320px;
    padding: 1rem 1.15rem 1.15rem;
    overflow: hidden;
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
    border-radius: var(--layout-card-radius);
  }

  @media (max-width: 900px) {
    .dashboard-stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .dashboard-stats,
    .dashboard-grid {
      grid-template-columns: 1fr;
    }

    .dashboard-header,
    .dashboard-stat,
    .dashboard-card__header,
    .dashboard-card__body {
      padding: 1rem;
    }

    .dashboard-card__header {
      align-items: flex-start;
      flex-direction: column;
      gap: 0.5rem;
    }

    .dashboard-card__types {
      max-width: 100%;
      text-align: left;
    }
  }
</style>
