<script lang="ts">
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC = true }: { model: DocumentModel; showTOC?: boolean } = $props();

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<div class="magazine-layout rich-layout" data-layout="magazine">
  <header class="magazine-hero layout-card" data-reveal>
    <p class="magazine-kicker">Markdown Warrior</p>
    <h1>{model.title}</h1>
    {#if model.description}
      <p class="magazine-description">{model.description}</p>
    {/if}
  </header>

  <div class="magazine-grid">
    <main class="magazine-content">
      {#each model.sections as section (section.id)}
        <section
          class="magazine-section layout-card markdown-body"
          data-section-id={section.id}
          data-reveal
          data-source-line={section.sourceLine}
        >
          {@html section.html}
        </section>
      {/each}
    </main>

    {#if showTOC && model.sections.length > 1}
      <aside class="magazine-rail" data-reveal>
        <h2>Sections</h2>
        <nav aria-label="Magazine sections">
          {#each model.sections as section (section.id)}
            <button type="button" onclick={() => scrollToSection(section.id)}>
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
    gap: clamp(1.25rem, 3vw, 2.25rem);
  }

  .magazine-hero {
    position: relative;
    overflow: hidden;
    padding: clamp(2rem, 6vw, 4.75rem);
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--md-accent) 18%, transparent), transparent 42%),
      color-mix(in srgb, var(--md-bg-secondary) 88%, var(--md-bg-primary) 12%);
  }

  .magazine-hero::after {
    content: '';
    position: absolute;
    inset: auto clamp(2rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3rem) auto;
    width: clamp(5rem, 18vw, 13rem);
    height: 2px;
    background: var(--md-accent);
    opacity: 0.75;
  }

  .magazine-kicker {
    margin: 0 0 0.8rem;
    color: var(--md-accent);
    font: 700 0.78rem/1 var(--md-font-body);
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .magazine-hero h1 {
    max-width: 13ch;
    margin: 0;
    color: var(--md-fg-primary);
    font: 800 5rem/0.95 var(--md-font-heading, var(--md-font-body));
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }

  .magazine-description {
    max-width: 62ch;
    margin: clamp(1rem, 2vw, 1.5rem) 0 0;
    color: var(--md-fg-secondary);
    font-size: 1.15rem;
    line-height: 1.65;
  }

  .magazine-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(12rem, 16rem);
    align-items: start;
    gap: var(--layout-gap);
  }

  .magazine-content {
    display: grid;
    gap: var(--layout-gap);
    min-width: 0;
  }

  .magazine-section {
    min-width: 0;
    padding: clamp(1.25rem, 3vw, 2.25rem);
    overflow-wrap: break-word;
  }

  .magazine-rail {
    position: sticky;
    top: 4.25rem;
    display: grid;
    gap: 0.75rem;
    padding: 1rem;
    border-left: 2px solid color-mix(in srgb, var(--md-accent) 40%, var(--md-border) 60%);
  }

  .magazine-rail h2 {
    margin: 0;
    color: var(--md-fg-primary);
    font: 700 0.78rem/1 var(--md-font-body);
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .magazine-rail nav {
    display: grid;
    gap: 0.35rem;
  }

  .magazine-rail button {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    min-height: 2.25rem;
    padding: 0.55rem 0.65rem;
    border-radius: var(--layout-card-radius);
    color: var(--md-fg-secondary);
    font: 600 0.86rem/1.25 var(--md-font-body);
    overflow-wrap: anywhere;
    transition:
      background-color 0.18s ease,
      color 0.18s ease,
      transform 0.18s ease;
  }

  .magazine-rail button:hover,
  .magazine-rail button:focus-visible {
    color: var(--md-fg-primary);
    background: color-mix(in srgb, var(--md-accent) 14%, transparent);
    transform: translateX(3px);
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
    font-size: 2.25rem;
    line-height: 1.05;
    letter-spacing: 0;
  }

  :global(.magazine-section blockquote) {
    margin: 1.75rem 0;
    padding: 1.25rem 1.35rem;
    border-left: 4px solid var(--md-accent);
    border-radius: var(--layout-card-radius);
    color: var(--md-fg-primary);
    background: color-mix(in srgb, var(--md-accent) 10%, var(--md-bg-tertiary) 90%);
    font-size: 1.08em;
  }

  :global(.magazine-section img) {
    display: block;
    width: 100%;
    max-height: 34rem;
    object-fit: cover;
    border-radius: var(--layout-card-radius);
    box-shadow: var(--md-shadow);
  }

  :global(.magazine-section figure),
  :global(.magazine-section table),
  :global(.magazine-section pre) {
    margin: 1.5rem 0;
  }

  :global(.magazine-section table) {
    width: 100%;
    overflow: hidden;
    border-radius: var(--layout-card-radius);
  }

  @media (max-width: 900px) {
    .magazine-grid {
      grid-template-columns: 1fr;
    }

    .magazine-rail {
      position: static;
      order: -1;
      border-left: 0;
      border-top: 2px solid color-mix(in srgb, var(--md-accent) 40%, var(--md-border) 60%);
      padding-inline: 0;
    }

    .magazine-rail nav {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
      scrollbar-width: none;
    }

    .magazine-rail nav::-webkit-scrollbar {
      display: none;
    }

    .magazine-rail button {
      flex: 0 0 auto;
      border: 1px solid var(--md-border);
      background: var(--md-bg-secondary);
    }
  }

  @media (max-width: 560px) {
    .magazine-hero,
    .magazine-section {
      padding: 1.1rem;
    }

    .magazine-hero h1 {
      font-size: 3rem;
    }

    .magazine-hero::after {
      display: none;
    }

    :global(.magazine-section h2:first-child),
    :global(.magazine-section h3:first-child) {
      font-size: 1.65rem;
    }
  }
</style>
