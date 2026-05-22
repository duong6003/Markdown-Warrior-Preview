<script lang="ts">
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC = true }: { model: DocumentModel; showTOC?: boolean } = $props();

  function scrollToSection(sectionKey: string, sectionId: string) {
    const escapedKey =
      typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(sectionKey) : sectionKey.replace(/"/g, '\\"');
    const target =
      document.querySelector<HTMLElement>(`[data-section-key="${escapedKey}"]`) ??
      document.getElementById(sectionId);

    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<div class="magazine-layout rich-layout" data-layout="magazine">
  <header class="magazine-hero lc-card--hero" data-reveal>
    <p class="magazine-kicker">Markdown Warrior</p>
    <h1>{model.title}</h1>
    {#if model.description}
      <p class="magazine-description">{model.description}</p>
    {/if}
  </header>

  <div class="magazine-grid">
    <article class="magazine-content">
      {#each model.sections as section (section.key)}
        <section
          class="magazine-section lc-card markdown-body"
          data-section-key={section.key}
          data-section-id={section.id}
          data-reveal
          data-source-line={section.sourceLine}
        >
          {@html section.html}
        </section>
      {/each}
    </article>

    {#if showTOC && model.sections.length > 1}
      <aside class="magazine-rail lc-card--flat" data-reveal>
        <h2>Sections</h2>
        <nav aria-label="Magazine sections">
          {#each model.sections as section (section.key)}
            <button type="button" onclick={() => scrollToSection(section.key, section.id)}>
              {section.title}
            </button>
          {/each}
        </nav>
      </aside>
    {/if}
  </div>
</div>

<style>
  .magazine-layout {
    display: grid;
    gap: var(--space-section-md);
  }

  .magazine-hero {
    padding: var(--space-section-xl);
  }

  .magazine-hero::after {
    content: '';
    position: absolute;
    inset: auto var(--space-section-lg) var(--space-section-sm) auto;
    width: clamp(5rem, 18vw, 13rem);
    height: 2px;
    background: var(--md-accent);
    opacity: 0.75;
  }

  .magazine-kicker {
    margin: 0 0 var(--space-3);
    color: var(--md-accent);
    font: 700 var(--text-xs) / 1.4 var(--md-font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .magazine-hero h1 {
    max-width: 13ch;
    margin: 0;
    color: var(--md-fg-primary);
    font: 800 var(--text-hero) / 0.98 var(--md-font-heading, var(--md-font-body));
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }

  .magazine-description {
    max-width: 60ch;
    margin: var(--space-6) 0 0;
    color: var(--md-fg-secondary);
    font-size: var(--text-lg);
    line-height: 1.4;
  }

  .magazine-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) clamp(14rem, 24%, 18rem);
    align-items: start;
    gap: var(--space-section-md);
  }

  .magazine-content {
    display: grid;
    gap: var(--space-section-md);
    min-width: 0;
  }

  .magazine-section {
    min-width: 0;
    padding: var(--space-section-sm);
    overflow-wrap: break-word;
  }

  .magazine-rail {
    position: sticky;
    top: calc(3.25rem + var(--space-4));
    display: grid;
    gap: var(--space-3);
    padding: var(--space-4);
  }

  .magazine-rail h2 {
    margin: 0;
    color: var(--md-fg-primary);
    font: 700 var(--text-xs) / 1.4 var(--md-font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .magazine-rail nav {
    display: grid;
    gap: var(--space-1);
  }

  .magazine-rail button {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    min-height: var(--space-8);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    font: 600 var(--text-sm) / 1.4 var(--md-font-body);
    overflow-wrap: anywhere;
  }

  :global(.magazine-section > :first-child) {
    margin-top: 0;
  }

  :global(.magazine-section > :last-child) {
    margin-bottom: 0;
  }

  :global(.magazine-section h2:first-child),
  :global(.magazine-section h3:first-child) {
    color: var(--md-fg-primary);
    font-size: var(--text-2xl);
    line-height: 1.2;
    letter-spacing: 0;
  }

  :global(.magazine-section blockquote) {
    margin: var(--space-6) 0;
    padding: var(--space-4) var(--space-6);
    border-left: 4px solid var(--md-accent);
    border-radius: var(--radius-md);
    color: var(--md-fg-primary);
    background: color-mix(in srgb, var(--md-accent) 10%, var(--md-bg-tertiary) 90%);
    font-size: var(--text-base);
  }

  :global(.magazine-section img) {
    display: block;
    width: 100%;
    max-height: 34rem;
    object-fit: cover;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  :global(.magazine-section figure),
  :global(.magazine-section table),
  :global(.magazine-section pre) {
    margin: var(--space-6) 0;
  }

  :global(.magazine-section table) {
    width: 100%;
    overflow: hidden;
    border-radius: var(--radius-md);
  }

  @media (max-width: 900px) {
    .magazine-grid {
      grid-template-columns: 1fr;
    }

    .magazine-rail {
      position: static;
      order: -1;
    }

    .magazine-rail nav {
      display: flex;
      gap: var(--space-2);
      overflow-x: auto;
      padding-bottom: var(--space-1);
      scrollbar-width: none;
    }

    .magazine-rail nav::-webkit-scrollbar {
      display: none;
    }

    .magazine-rail button {
      flex: 0 0 auto;
      border: 1px solid var(--md-border);
    }
  }

  @media (max-width: 560px) {
    .magazine-hero,
    .magazine-section {
      padding: var(--space-4);
    }

    .magazine-hero::after {
      display: none;
    }
  }
</style>
