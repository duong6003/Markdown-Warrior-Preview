<script lang="ts">
  import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';
  import { clipDetect } from '../lib/clip-detect';
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC }: { model: DocumentModel; showTOC: boolean } = $props();
  let hasDots = $derived(showTOC && model.sections.length > 1);
  let expanded = $state<Record<string, boolean>>({});
  let needsClip = $state<Record<string, boolean>>({});

  function formatSectionNumber(index: number) {
    return String(index + 1).padStart(2, '0');
  }

  function toggleSection(sectionKey: string) {
    expanded[sectionKey] = !expanded[sectionKey];
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
  {#if hasDots}
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
  {/if}

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
        <div
          class="story-section__content lc-card balanced-card"
          class:balanced-card--clippable={needsClip[section.key]}
          class:balanced-card--expanded={expanded[section.key]}
        >
          <div
            id={balancedCardBodyId('story', section.key)}
            class="story-section__body balanced-card__body markdown-body"
            use:clipDetect={(needs: boolean) => { needsClip[section.key] = needs; }}
          >
            {@html section.html}
          </div>
          {#if needsClip[section.key]}
            <button
              class="balanced-card__toggle"
              type="button"
              aria-expanded={expanded[section.key] ? 'true' : 'false'}
              aria-controls={balancedCardBodyId('story', section.key)}
              onclick={() => toggleSection(section.key)}
            >
              {balancedCardToggleLabel(Boolean(expanded[section.key]))}
            </button>
          {/if}
        </div>
      </section>
    {/each}
  </div>
</div>

<style>
  .story-layout {
    position: relative;
    width: min(100%, 1180px);
    margin: 0 auto;
    padding: var(--space-section-xl) var(--space-section-md) var(--space-section-md);
  }

  .story-sections {
    display: grid;
    gap: var(--space-section-md);
    scroll-snap-type: y proximity;
  }

  .story-section {
    display: grid;
    grid-template-columns: clamp(5rem, 10vw, 8rem) minmax(0, 1fr);
    align-items: center;
    gap: var(--space-section-md);
    min-height: min(32rem, 80vh);
    scroll-snap-align: start;
  }

  .story-section__number {
    justify-self: center;
    color: color-mix(in srgb, var(--md-accent) 78%, var(--md-fg-secondary) 22%);
    font: 800 var(--text-hero) / 1 var(--md-font-heading, var(--md-font-body));
    letter-spacing: 0;
    opacity: 0.35;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    transition: opacity 0.2s ease;
  }

  .story-section:hover .story-section__number,
  .story-section:focus-within .story-section__number {
    opacity: 1;
  }

  .story-section__content {
    min-width: 0;
  }

  .story-section__body {
    padding: var(--space-section-sm);
    overflow-wrap: break-word;
  }

  .story-dots {
    position: fixed;
    top: 50%;
    right: var(--space-4);
    z-index: 6;
    display: grid;
    gap: var(--space-2);
    max-height: calc(100vh - var(--space-8));
    overflow-y: auto;
    transform: translateY(-50%);
    scrollbar-width: thin;
  }

  .story-dots button {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    display: grid;
    place-items: center;
    width: calc(var(--space-8) + var(--space-1));
    height: calc(var(--space-8) + var(--space-1));
    border: 1px solid color-mix(in srgb, var(--md-border) 82%, var(--md-accent) 18%);
    border-radius: var(--radius-full);
    box-shadow: var(--shadow-sm);
    font: 700 var(--text-xs) / 1 var(--md-font-body);
    letter-spacing: 0;
  }

  :global(.story-section__body > :first-child) {
    margin-top: 0;
  }

  :global(.story-section__body > :last-child) {
    margin-bottom: 0;
  }

  :global(.story-section__body h1),
  :global(.story-section__body h2) {
    margin-bottom: var(--space-4);
    color: var(--md-fg-primary);
    font-size: var(--text-hero);
    line-height: 0.98;
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }

  :global(.story-section__body p) {
    font-size: var(--text-lg);
    line-height: 1.6;
  }

  :global(.story-section__body blockquote) {
    margin: var(--space-6) 0;
    padding: var(--space-4) var(--space-6);
    border-left: 4px solid var(--md-accent);
    border-radius: var(--radius-md);
    color: var(--md-fg-primary);
    background: color-mix(in srgb, var(--md-accent) 10%, var(--md-bg-tertiary) 90%);
    font-size: var(--text-base);
  }

  :global(.story-section__body img) {
    display: block;
    width: 100%;
    max-height: 34rem;
    object-fit: cover;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  :global(.story-section__body hr) {
    display: none;
  }

  @media (max-width: 760px) {
    .story-layout {
      padding: var(--space-section-lg) var(--space-4) var(--space-section-sm);
    }

    .story-sections {
      gap: var(--space-4);
      scroll-snap-type: none;
    }

    .story-section {
      grid-template-columns: 1fr;
      align-items: start;
      gap: var(--space-3);
      min-height: auto;
      scroll-snap-align: none;
    }

    .story-section__number {
      justify-self: start;
      font-size: var(--text-2xl);
      writing-mode: horizontal-tb;
    }

    .story-section__body {
      padding: var(--space-4);
    }

    .story-dots {
      position: sticky;
      top: calc(3.25rem + var(--space-3));
      grid-auto-flow: column;
      grid-auto-columns: minmax(var(--space-8), max-content);
      justify-content: start;
      overflow-x: auto;
      overflow-y: hidden;
      padding: var(--space-1) 0 var(--space-3);
      transform: none;
      scrollbar-width: none;
    }

    .story-dots::-webkit-scrollbar {
      display: none;
    }

    .story-dots button {
      width: var(--space-8);
      height: var(--space-8);
    }
  }
</style>
