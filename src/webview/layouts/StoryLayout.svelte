<script lang="ts">
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC }: { model: DocumentModel; showTOC: boolean } = $props();

  function formatSectionNumber(index: number) {
    return String(index + 1).padStart(2, '0');
  }

  function scrollToSection(sectionKey: string, sectionId: string) {
    const escapedKey =
      typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(sectionKey) : sectionKey.replace(/"/g, '\\"');
    const target =
      document.querySelector<HTMLElement>(`[data-section-key="${escapedKey}"]`) ??
      document.getElementById(sectionId);

    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<div class="story-layout" data-layout="story">
  <nav class="story-dots" aria-label="Story sections">
    {#each model.sections as section, index (section.key)}
      <button
        type="button"
        title={section.title}
        aria-label={`Jump to ${section.title}`}
        onclick={() => scrollToSection(section.key, section.id)}
      >
        {formatSectionNumber(index)}
      </button>
    {/each}
  </nav>

  <div class="story-sections" data-toc-visible={showTOC}>
    {#each model.sections as section, index (section.key)}
      <section
        class="story-section"
        data-section-key={section.key}
        data-section-id={section.id}
        data-reveal
        data-source-line={section.sourceLine}
      >
        <div class="story-section__number" aria-hidden="true">
          {formatSectionNumber(index)}
        </div>
        <div class="story-section__content markdown-body layout-card">
          {@html section.html}
        </div>
      </section>
    {/each}
  </div>
</div>

<style>
  .story-layout {
    position: relative;
    width: min(100%, var(--layout-wide-max));
    margin: 0 auto;
    padding: clamp(1rem, 2.5vw, 2rem);
  }

  .story-sections {
    display: grid;
    gap: clamp(1.5rem, 4vw, 3rem);
    scroll-snap-type: y proximity;
  }

  .story-section {
    display: grid;
    grid-template-columns: minmax(3rem, 6rem) minmax(0, 1fr);
    align-items: center;
    gap: clamp(1rem, 3vw, 2rem);
    min-height: min(42rem, calc(100vh - 3rem));
    scroll-snap-align: start;
  }

  .story-section__number {
    justify-self: center;
    color: color-mix(in srgb, var(--md-accent) 78%, var(--md-fg-secondary) 22%);
    font: 800 clamp(2.5rem, 8vw, 5.25rem) / 1 var(--md-font-heading, var(--md-font-body));
    letter-spacing: 0;
    writing-mode: vertical-rl;
    text-orientation: mixed;
  }

  .story-section__content {
    min-width: 0;
    padding: clamp(1.35rem, 4vw, 3.25rem);
    overflow-wrap: break-word;
    background: var(--layout-card-bg);
  }

  .story-dots {
    position: fixed;
    top: 50%;
    right: clamp(0.5rem, 2vw, 1.25rem);
    z-index: 6;
    display: grid;
    gap: 0.5rem;
    transform: translateY(-50%);
  }

  .story-dots button {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    display: grid;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
    border: 1px solid color-mix(in srgb, var(--md-border) 82%, var(--md-accent) 18%);
    border-radius: 999px;
    color: var(--md-fg-secondary);
    background: color-mix(in srgb, var(--md-bg-secondary) 92%, transparent);
    box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.16);
    font: 750 0.72rem/1 var(--md-font-body);
    letter-spacing: 0;
    transition:
      border-color 0.18s ease,
      background-color 0.18s ease,
      color 0.18s ease,
      transform 0.18s ease;
  }

  .story-dots button:hover,
  .story-dots button:focus-visible {
    color: var(--md-fg-primary);
    border-color: var(--md-accent);
    background: color-mix(in srgb, var(--md-accent) 16%, var(--md-bg-secondary) 84%);
    transform: translateX(-3px);
  }

  :global(.story-section__content > :first-child) {
    margin-top: 0;
  }

  :global(.story-section__content > :last-child) {
    margin-bottom: 0;
  }

  :global(.story-section__content h1),
  :global(.story-section__content h2) {
    margin-bottom: 1rem;
    color: var(--md-fg-primary);
    font-size: clamp(2.4rem, 7vw, 5rem);
    line-height: 0.98;
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }

  :global(.story-section__content p) {
    font-size: clamp(1rem, 1.6vw, 1.22rem);
    line-height: 1.7;
  }

  :global(.story-section__content blockquote) {
    margin: 1.5rem 0;
    padding: 1.15rem 1.3rem;
    border-left: 4px solid var(--md-accent);
    border-radius: var(--layout-card-radius);
    color: var(--md-fg-primary);
    background: color-mix(in srgb, var(--md-accent) 10%, var(--md-bg-tertiary) 90%);
    font-size: 1.08em;
  }

  :global(.story-section__content img) {
    display: block;
    width: 100%;
    max-height: 34rem;
    object-fit: cover;
    border-radius: var(--layout-card-radius);
    box-shadow: var(--md-shadow);
  }

  :global(.story-section__content hr) {
    display: none;
  }

  @media (max-width: 760px) {
    .story-layout {
      padding: 1rem;
    }

    .story-sections {
      gap: 1rem;
      scroll-snap-type: none;
    }

    .story-section {
      grid-template-columns: 1fr;
      align-items: start;
      gap: 0.75rem;
      min-height: auto;
      scroll-snap-align: none;
    }

    .story-section__number {
      justify-self: start;
      font-size: 2rem;
      writing-mode: horizontal-tb;
    }

    .story-section__content {
      padding: 1rem;
    }

    .story-dots {
      position: sticky;
      top: 0.75rem;
      grid-auto-flow: column;
      grid-auto-columns: minmax(2rem, max-content);
      justify-content: start;
      overflow-x: auto;
      padding: 0.25rem 0 0.75rem;
      transform: none;
      scrollbar-width: none;
    }

    .story-dots::-webkit-scrollbar {
      display: none;
    }

    .story-dots button {
      width: 2rem;
      height: 2rem;
      background: var(--md-bg-secondary);
    }

    .story-dots button:hover,
    .story-dots button:focus-visible {
      transform: translateY(-2px);
    }

    :global(.story-section__content h1),
    :global(.story-section__content h2) {
      font-size: 2.25rem;
    }
  }
</style>
