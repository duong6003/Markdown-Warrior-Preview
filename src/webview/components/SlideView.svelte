<script lang="ts">
  import { fly, fade } from 'svelte/transition';

  interface Slide {
    html: string;
    notes: string;
    index: number;
  }

  let { html = '', transition = 'fade' }: { html: string; transition: string } = $props();

  let slides = $derived(parseSlides(html));
  let currentSlide = $state(0);
  let showNotes = $state(false);
  let totalSlides = $derived(slides.length);

  function parseSlides(htmlContent: string): Slide[] {
    // Split on <hr> tags (rendered from ---) 
    const parts = htmlContent.split(/<hr[^>]*>/gi);

    return parts.map((part, index) => {
      // Extract speaker notes from <!-- notes: ... -->
      const notesMatch = part.match(/<!--\s*notes?:\s*([\s\S]*?)-->/i);
      const notes = notesMatch ? notesMatch[1].trim() : '';
      const slideHtml = part.replace(/<!--\s*notes?:\s*[\s\S]*?-->/gi, '').trim();

      return { html: slideHtml, notes, index };
    }).filter(s => s.html.length > 0);
  }

  function nextSlide() {
    if (currentSlide < totalSlides - 1) {
      currentSlide++;
    }
  }

  function prevSlide() {
    if (currentSlide > 0) {
      currentSlide--;
    }
  }

  function goToSlide(index: number) {
    currentSlide = Math.max(0, Math.min(index, totalSlides - 1));
  }

  function handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
        e.preventDefault();
        nextSlide();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        prevSlide();
        break;
      case 'Home':
        e.preventDefault();
        goToSlide(0);
        break;
      case 'End':
        e.preventDefault();
        goToSlide(totalSlides - 1);
        break;
      case 's':
      case 'S':
        showNotes = !showNotes;
        break;
      case 'Escape':
        // Exit handled by parent
        break;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="slide-container">
  <!-- Current slide -->
  {#key currentSlide}
    <div
      class="slide"
      in:fade={{ duration: 250 }}
    >
      <div class="slide-content markdown-body">
        {@html slides[currentSlide]?.html || ''}
      </div>
    </div>
  {/key}

  <!-- Speaker notes overlay -->
  {#if showNotes && slides[currentSlide]?.notes}
    <div class="notes-overlay" transition:fly={{ y: 100, duration: 200 }}>
      <div class="notes-header">Speaker Notes (S to toggle)</div>
      <div class="notes-content">{slides[currentSlide].notes}</div>
    </div>
  {/if}

  <!-- Navigation controls -->
  <div class="slide-controls">
    <button class="nav-btn" onclick={prevSlide} disabled={currentSlide === 0}>
      ←
    </button>

    <div class="slide-dots">
      {#each slides as _, i}
        <button
          class="dot"
          class:active={i === currentSlide}
          onclick={() => goToSlide(i)}
          aria-label="Go to slide {i + 1}"
        ></button>
      {/each}
    </div>

    <button class="nav-btn" onclick={nextSlide} disabled={currentSlide === totalSlides - 1}>
      →
    </button>
  </div>

  <!-- Slide counter -->
  <div class="slide-counter">
    {currentSlide + 1} / {totalSlides}
  </div>
</div>

<style>
  .slide-container {
    position: fixed;
    inset: 0;
    background: var(--md-bg-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 100;
    overflow: hidden;
  }

  .slide {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4rem;
  }

  .slide-content {
    max-width: 900px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    font-size: 1.4em;
    line-height: 1.5;
  }

  .slide-content :global(h1) {
    font-size: 2.5em;
    text-align: center;
    border: none;
    margin-bottom: 0.5em;
  }

  .slide-content :global(h2) {
    font-size: 1.8em;
    border: none;
  }

  .slide-content :global(ul),
  .slide-content :global(ol) {
    font-size: 1.1em;
  }

  .slide-content :global(pre) {
    font-size: 0.75em;
  }

  /* Navigation controls */
  .slide-controls {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1rem;
    background: var(--md-bg-secondary);
    border-radius: 2rem;
    border: 1px solid var(--md-border);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .slide-container:hover .slide-controls {
    opacity: 1;
  }

  .nav-btn {
    all: unset;
    cursor: pointer;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: var(--md-fg-primary);
    font-size: 1.2em;
    transition: background 0.2s ease, color 0.2s ease;
  }

  .nav-btn:hover:not(:disabled) {
    background: var(--md-bg-tertiary);
    color: var(--md-accent);
  }

  .nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .slide-dots {
    display: flex;
    gap: 0.4rem;
  }

  .dot {
    all: unset;
    cursor: pointer;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--md-fg-muted);
    transition: background 0.2s ease, transform 0.2s ease;
  }

  .dot:hover {
    background: var(--md-fg-secondary);
    transform: scale(1.3);
  }

  .dot.active {
    background: var(--md-accent);
    transform: scale(1.3);
  }

  /* Slide counter */
  .slide-counter {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    font-size: 0.8rem;
    color: var(--md-fg-muted);
    font-family: var(--md-font-mono);
  }

  /* Speaker notes */
  .notes-overlay {
    position: fixed;
    bottom: 5rem;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    max-height: 30vh;
    overflow-y: auto;
    background: var(--md-bg-secondary);
    border: 1px solid var(--md-border);
    border-radius: var(--md-radius);
    padding: 1rem;
    z-index: 110;
  }

  .notes-header {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--md-fg-muted);
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  .notes-content {
    font-size: 0.9rem;
    color: var(--md-fg-secondary);
    line-height: 1.5;
  }
</style>
