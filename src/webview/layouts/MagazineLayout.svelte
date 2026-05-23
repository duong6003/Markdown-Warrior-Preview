<script lang="ts">
  import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';
  import { clipDetect } from '../lib/clip-detect';
  import GhostNav from '../lib/GhostNav.svelte';
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC = true }: { model: DocumentModel; showTOC?: boolean } = $props();
  let expanded = $state<Record<string, boolean>>({});
  let needsClip = $state<Record<string, boolean>>({});

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

<div class="magazine-layout rich-layout" data-layout="magazine">
  <GhostNav sections={model.sections} onNavigate={scrollToSection} />

  <header class="magazine-hero lc-card--hero" data-reveal>
    <p class="magazine-kicker">Markdown Warrior</p>
    <h1>{model.title}</h1>
    {#if model.description}
      <p class="magazine-description">{model.description}</p>
    {/if}
  </header>

  <article class="magazine-content">
    {#each model.sections as section (section.key)}
      <section
        class="magazine-section lc-card balanced-card"
        class:balanced-card--clippable={needsClip[section.key]}
        class:balanced-card--expanded={expanded[section.key]}
        data-section-key={section.key}
        data-section-id={section.id}
        data-reveal
        data-source-line={section.sourceLine}
      >
        <div
          id={balancedCardBodyId('magazine', section.key)}
          class="magazine-section__body balanced-card__body markdown-body"
          use:clipDetect={(needs: boolean) => { needsClip[section.key] = needs; }}
        >
          {@html section.html}
        </div>
        {#if needsClip[section.key]}
          <button
            class="balanced-card__toggle"
            type="button"
            aria-expanded={expanded[section.key] ? 'true' : 'false'}
            aria-controls={balancedCardBodyId('magazine', section.key)}
            onclick={() => toggleSection(section.key)}
          >
            {balancedCardToggleLabel(Boolean(expanded[section.key]))}
          </button>
        {/if}
      </section>
    {/each}
  </article>
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

  .magazine-content {
    display: grid;
    gap: var(--space-section-md);
    min-width: 0;
  }

  .magazine-section {
    min-width: 0;
  }

  .magazine-section__body {
    padding: var(--space-section-sm);
    overflow-wrap: break-word;
  }

  :global(.magazine-section__body > :first-child) {
    margin-top: 0;
  }

  :global(.magazine-section__body > :last-child) {
    margin-bottom: 0;
  }

  :global(.magazine-section__body h2:first-child),
  :global(.magazine-section__body h3:first-child) {
    color: var(--md-fg-primary);
    font-size: var(--text-2xl);
    line-height: 1.2;
    letter-spacing: 0;
  }

  :global(.magazine-section__body blockquote) {
    margin: var(--space-6) 0;
    padding: var(--space-4) var(--space-6);
    border-left: 4px solid var(--md-accent);
    border-radius: var(--radius-md);
    color: var(--md-fg-primary);
    background: color-mix(in srgb, var(--md-accent) 10%, var(--md-bg-tertiary) 90%);
    font-size: var(--text-base);
  }

  :global(.magazine-section__body img) {
    display: block;
    width: 100%;
    max-height: 34rem;
    object-fit: cover;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  :global(.magazine-section__body figure),
  :global(.magazine-section__body table),
  :global(.magazine-section__body pre) {
    margin: var(--space-6) 0;
  }

  :global(.magazine-section__body table) {
    display: block;
    width: 100%;
    overflow-x: auto;
    border-radius: var(--radius-md);
  }

  @media (max-width: 560px) {
    .magazine-hero,
    .magazine-section__body {
      padding: var(--space-4);
    }

    .magazine-hero::after {
      display: none;
    }
  }
</style>
