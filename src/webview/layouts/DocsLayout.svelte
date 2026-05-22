<script lang="ts">
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC = true }: { model: DocumentModel; showTOC?: boolean } = $props();
  let hasSidebar = $derived(showTOC && model.sections.length > 1);

  function scrollToSection(sectionKey: string, sectionId: string) {
    const escapedKey =
      typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(sectionKey) : sectionKey.replace(/"/g, '\\"');
    const target =
      document.querySelector<HTMLElement>(`[data-section-key="${escapedKey}"]`) ??
      document.getElementById(sectionId);

    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<div class="docs-layout" class:no-sidebar={!hasSidebar} data-layout="docs">
  {#if hasSidebar}
    <aside class="docs-sidebar lc-card--flat" data-reveal>
      <p class="docs-eyebrow">Docs</p>
      <h2>{model.title}</h2>
      <nav aria-label="Document sections">
        {#each model.sections as section (section.key)}
          <button
            type="button"
            class:deep={section.level > 2}
            onclick={() => scrollToSection(section.key, section.id)}
          >
            {section.title}
          </button>
        {/each}
      </nav>
    </aside>
  {/if}

  <article class="docs-content rich-layout">
    <header class="docs-header lc-card--hero" data-reveal>
      <span>Documentation</span>
      <h1>{model.title}</h1>
      {#if model.description}
        <p>{model.description}</p>
      {/if}
    </header>

    <div class="docs-sections">
      {#each model.sections as section (section.key)}
        <section
          class="docs-section lc-card"
          data-section-key={section.key}
          data-section-id={section.id}
          data-reveal
          data-source-line={section.sourceLine}
        >
          <div class="docs-section__body markdown-body">
            {@html section.html}
          </div>
        </section>
      {/each}
    </div>
  </article>
</div>

<style>
  .docs-layout {
    width: min(100%, 1180px);
    margin: 0 auto;
    padding: var(--space-section-xl) var(--space-section-md) var(--space-section-md);
    display: grid;
    grid-template-columns: clamp(14rem, 22%, 20rem) minmax(0, 1fr);
    align-items: start;
    gap: var(--space-section-md);
  }

  .docs-layout.no-sidebar {
    grid-template-columns: 1fr;
  }

  .docs-content.rich-layout {
    grid-column: auto;
    width: 100%;
    max-width: 72ch;
    min-width: 0;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-section-md);
  }

  .docs-layout.no-sidebar .docs-content {
    grid-column: 1 / -1;
    max-width: 72ch;
  }

  .docs-sidebar {
    position: sticky;
    top: calc(3.25rem + var(--space-4));
    display: grid;
    gap: var(--space-3);
    max-height: calc(100vh - 5.5rem);
    padding: var(--space-4);
    overflow: auto;
  }

  .docs-eyebrow,
  .docs-header span {
    margin: 0;
    color: var(--md-accent);
    font: 800 var(--text-xs) / 1.4 var(--md-font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .docs-sidebar h2 {
    margin: 0;
    color: var(--md-fg-primary);
    font: 700 var(--text-base) / 1.3 var(--md-font-heading, var(--md-font-body));
    overflow-wrap: anywhere;
  }

  .docs-sidebar nav {
    display: grid;
    gap: var(--space-1);
  }

  .docs-sidebar button {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    min-height: var(--space-8);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    font: 600 var(--text-sm) / 1.4 var(--md-font-body);
    overflow-wrap: anywhere;
  }

  .docs-sidebar button.deep {
    padding-left: var(--space-6);
    color: color-mix(in srgb, var(--md-fg-secondary) 82%, var(--md-accent) 18%);
    font-size: var(--text-xs);
    font-weight: 550;
  }

  .docs-header {
    display: grid;
    gap: var(--space-4);
    padding: var(--space-section-sm);
  }

  .docs-header h1 {
    max-width: 18ch;
    margin: 0;
    color: var(--md-fg-primary);
    font: 800 var(--text-3xl) / 1.1 var(--md-font-heading, var(--md-font-body));
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }

  .docs-header p {
    max-width: 60ch;
    margin: 0;
    color: var(--md-fg-secondary);
    font-size: var(--text-base);
    line-height: 1.6;
  }

  .docs-sections {
    display: grid;
    gap: var(--space-section-md);
  }

  .docs-section {
    min-width: 0;
  }

  .docs-section__body {
    padding: var(--space-section-sm);
    overflow-wrap: break-word;
  }

  :global(.docs-section__body > :first-child) {
    margin-top: 0;
  }

  :global(.docs-section__body > :last-child) {
    margin-bottom: 0;
  }

  :global(.docs-section__body h2:first-child),
  :global(.docs-section__body h3:first-child),
  :global(.docs-section__body h4:first-child) {
    color: var(--md-fg-primary);
    font-size: var(--text-xl);
    line-height: 1.3;
    letter-spacing: 0;
  }

  :global(.docs-section__body blockquote) {
    margin: var(--space-6) 0;
    padding: var(--space-4);
    border-left: 4px solid var(--md-accent);
    border-radius: var(--radius-md);
    color: var(--md-fg-primary);
    background: color-mix(in srgb, var(--md-accent) 9%, var(--md-bg-tertiary) 91%);
    font-size: var(--text-base);
  }

  :global(.docs-section__body pre) {
    margin: var(--space-6) 0;
    padding: var(--space-4);
    overflow: auto;
    border: 1px solid color-mix(in srgb, var(--md-border) 78%, var(--md-accent) 22%);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--md-bg-primary) 82%, black 18%);
  }

  :global(.docs-section__body code) {
    font-size: var(--text-sm);
  }

  :global(.docs-section__body table) {
    display: block;
    width: 100%;
    overflow-x: auto;
  }

  @media (max-width: 900px) {
    .docs-layout {
      grid-template-columns: 1fr;
      padding: var(--space-section-lg) var(--space-4) var(--space-section-sm);
    }

    .docs-sidebar {
      position: static;
      max-height: none;
      order: -1;
    }

    .docs-sidebar nav {
      display: flex;
      gap: var(--space-2);
      overflow-x: auto;
      padding-bottom: var(--space-1);
      scrollbar-width: none;
    }

    .docs-sidebar nav::-webkit-scrollbar {
      display: none;
    }

    .docs-sidebar button {
      flex: 0 0 auto;
      border: 1px solid var(--md-border);
    }

    .docs-sidebar button.deep {
      padding-left: var(--space-3);
    }
  }

  @media (max-width: 560px) {
    .docs-layout {
      padding-inline: var(--space-4);
    }

    .docs-header,
    .docs-section__body {
      padding: var(--space-4);
    }
  }
</style>
