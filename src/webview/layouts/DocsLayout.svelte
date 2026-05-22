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
    <aside class="docs-sidebar" data-reveal>
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
    <header class="docs-header layout-card" data-reveal>
      <span>Documentation</span>
      <h1>{model.title}</h1>
      {#if model.description}
        <p>{model.description}</p>
      {/if}
    </header>

    <div class="docs-sections">
      {#each model.sections as section (section.key)}
        <section
          class="docs-section layout-card markdown-body"
          data-section-key={section.key}
          data-section-id={section.id}
          data-reveal
          data-source-line={section.sourceLine}
        >
          {@html section.html}
        </section>
      {/each}
    </div>
  </article>
</div>

<style>
  .docs-layout {
    width: min(100%, var(--layout-wide-max));
    margin: 0 auto;
    padding: clamp(1rem, 2.5vw, 2rem);
    display: grid;
    grid-template-columns: minmax(12rem, 17rem) minmax(0, 1fr);
    align-items: start;
    gap: var(--layout-gap);
  }

  .docs-layout.no-sidebar {
    grid-template-columns: 1fr;
  }

  .docs-content.rich-layout {
    grid-column: auto;
    width: 100%;
    min-width: 0;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--layout-gap);
  }

  .docs-layout.no-sidebar .docs-content {
    grid-column: 1 / -1;
  }

  .docs-sidebar {
    position: sticky;
    top: 4.25rem;
    display: grid;
    gap: 0.85rem;
    max-height: calc(100vh - 5.5rem);
    padding: 1rem;
    overflow: auto;
    border: var(--layout-card-border);
    border-radius: var(--layout-card-radius);
    background: color-mix(in srgb, var(--md-bg-secondary) 92%, transparent);
  }

  .docs-eyebrow,
  .docs-header span {
    margin: 0;
    color: var(--md-accent);
    font: 800 0.72rem/1 var(--md-font-body);
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .docs-sidebar h2 {
    margin: 0;
    color: var(--md-fg-primary);
    font: 750 1rem/1.25 var(--md-font-heading, var(--md-font-body));
    overflow-wrap: anywhere;
  }

  .docs-sidebar nav {
    display: grid;
    gap: 0.25rem;
  }

  .docs-sidebar button {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    min-height: 2rem;
    padding: 0.5rem 0.65rem;
    border-radius: 6px;
    color: var(--md-fg-secondary);
    font: 600 0.86rem/1.3 var(--md-font-body);
    overflow-wrap: anywhere;
    transition:
      background-color 0.18s ease,
      color 0.18s ease,
      transform 0.18s ease;
  }

  .docs-sidebar button.deep {
    padding-left: 1.35rem;
    color: color-mix(in srgb, var(--md-fg-secondary) 82%, var(--md-accent) 18%);
    font-size: 0.8rem;
    font-weight: 550;
  }

  .docs-sidebar button:hover,
  .docs-sidebar button:focus-visible {
    color: var(--md-fg-primary);
    background: color-mix(in srgb, var(--md-accent) 13%, transparent);
    transform: translateX(3px);
  }

  .docs-header {
    display: grid;
    gap: 0.9rem;
    padding: clamp(1.5rem, 4vw, 3rem);
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--md-accent) 16%, transparent), transparent 48%),
      color-mix(in srgb, var(--md-bg-secondary) 90%, var(--md-bg-primary) 10%);
  }

  .docs-header h1 {
    max-width: 18ch;
    margin: 0;
    color: var(--md-fg-primary);
    font: 800 clamp(2.4rem, 7vw, 4.6rem) / 0.98 var(--md-font-heading, var(--md-font-body));
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }

  .docs-header p {
    max-width: 68ch;
    margin: 0;
    color: var(--md-fg-secondary);
    font-size: 1.05rem;
    line-height: 1.65;
  }

  .docs-sections {
    display: grid;
    gap: var(--layout-gap);
  }

  .docs-section {
    min-width: 0;
    padding: clamp(1.1rem, 3vw, 2rem);
    overflow-wrap: break-word;
  }

  :global(.docs-section > :first-child) {
    margin-top: 0;
  }

  :global(.docs-section > :last-child) {
    margin-bottom: 0;
  }

  :global(.docs-section h2:first-child),
  :global(.docs-section h3:first-child),
  :global(.docs-section h4:first-child) {
    color: var(--md-fg-primary);
    letter-spacing: 0;
  }

  :global(.docs-section blockquote) {
    margin: 1.4rem 0;
    padding: 1rem 1.15rem;
    border-left: 4px solid var(--md-accent);
    border-radius: var(--layout-card-radius);
    color: var(--md-fg-primary);
    background: color-mix(in srgb, var(--md-accent) 9%, var(--md-bg-tertiary) 91%);
  }

  :global(.docs-section pre) {
    margin: 1.35rem 0;
    padding: 1rem;
    overflow: auto;
    border: 1px solid color-mix(in srgb, var(--md-border) 78%, var(--md-accent) 22%);
    border-radius: var(--layout-card-radius);
    background: color-mix(in srgb, var(--md-bg-primary) 82%, black 18%);
  }

  :global(.docs-section code) {
    font-size: 0.92em;
  }

  :global(.docs-section table) {
    display: block;
    width: 100%;
    overflow-x: auto;
  }

  @media (max-width: 900px) {
    .docs-layout {
      grid-template-columns: 1fr;
    }

    .docs-sidebar {
      position: static;
      max-height: none;
      order: -1;
    }

    .docs-sidebar nav {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.2rem;
      scrollbar-width: none;
    }

    .docs-sidebar nav::-webkit-scrollbar {
      display: none;
    }

    .docs-sidebar button {
      flex: 0 0 auto;
      border: 1px solid var(--md-border);
      background: var(--md-bg-tertiary);
    }

    .docs-sidebar button.deep {
      padding-left: 0.65rem;
    }
  }

  @media (max-width: 560px) {
    .docs-layout {
      padding: 1rem;
    }

    .docs-header,
    .docs-section {
      padding: 1rem;
    }

    .docs-header h1 {
      font-size: 2.4rem;
    }
  }
</style>
