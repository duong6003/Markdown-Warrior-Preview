<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { onMessage, postMessage } from './lib/message-bridge';
  import { scrollToLine, setupScrollReporter } from './lib/source-map';
  import { renderMermaidBlocks } from './lib/mermaid-renderer';
  import { setupCheckboxHandler } from './lib/checkbox-handler';
  import { setupCollapsibleHeadings, restoreCollapsedState } from './lib/collapsible-headings';
  import { createDocumentModel, resolveLayout } from './lib/layout-engine';
  import { loadState, saveState } from './stores/state';
  import type { LayoutOverride } from './types/layout';
  import LayoutToolbar from './components/LayoutToolbar.svelte';
  import SlideView from './components/SlideView.svelte';
  import MagazineLayout from './layouts/MagazineLayout.svelte';
  import DocsLayout from './layouts/DocsLayout.svelte';
  import StoryLayout from './layouts/StoryLayout.svelte';
  import DashboardLayout from './layouts/DashboardLayout.svelte';

  const initialState = loadState();

  let html = $state('<p>Loading preview...</p>');
  let frontmatter = $state<Record<string, unknown> | null>(null);
  let showTOC = $state(initialState.tocVisible);
  let mode = $state<'document' | 'presentation'>(initialState.mode);
  let layoutOverride = $state<LayoutOverride>(initialState.layoutOverride);
  let model = $derived(createDocumentModel(html, frontmatter));
  let selectedLayout = $derived(resolveLayout(model.detectedLayout, frontmatter, layoutOverride));

  $effect(() => {
    saveState({ tocVisible: showTOC, mode, layoutOverride });
  });

  $effect(() => {
    if (html && mode === 'document') {
      selectedLayout;
      tick().then(() => {
        renderMermaidBlocks();
        restoreCollapsedState();
      });
    }
  });

  onMessage((message) => {
    switch (message.type) {
      case 'update':
        html = message.html;
        frontmatter = message.frontmatter;
        break;
      case 'scrollTo':
        if (mode === 'document') {
          scrollToLine(message.line);
        }
        break;
      case 'configChanged':
        showTOC = message.config.showTOC;
        break;
      case 'themeChanged':
        break;
      case 'togglePresentation':
        toggleMode();
        break;
    }
  });

  function toggleMode() {
    mode = mode === 'document' ? 'presentation' : 'document';
  }

  function setLayoutOverride(next: LayoutOverride) {
    layoutOverride = next;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && mode === 'presentation') {
      e.preventDefault();
      mode = 'document';
    }
  }

  onMount(() => {
    setupScrollReporter();
    setupCheckboxHandler();
    setupCollapsibleHeadings();

    const main = document.querySelector('main');
    if (main && initialState.scrollPosition > 0) {
      requestAnimationFrame(() => {
        main.scrollTop = initialState.scrollPosition;
      });
    }

    let saveTimeout: number;
    main?.addEventListener('scroll', () => {
      clearTimeout(saveTimeout);
      saveTimeout = window.setTimeout(() => {
        if (main) {
          saveState({ scrollPosition: main.scrollTop });
        }
      }, 500);
    });
  });

  postMessage({ type: 'ready' });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if mode === 'presentation'}
  <SlideView {html} transition="fade" />
  <button class="exit-presentation" onclick={toggleMode} title="Exit presentation (Esc)">
    ✕
  </button>
{:else}
  <div class="preview-root">
    <LayoutToolbar
      override={layoutOverride}
      detectedLayout={model.detectedLayout}
      currentLayout={selectedLayout}
      onOverrideChange={setLayoutOverride}
      onTogglePresentation={toggleMode}
    />

    <main class="layout-scroll-root" data-active-layout={selectedLayout}>
      {#if selectedLayout === 'magazine'}
        <MagazineLayout {model} {showTOC} />
      {:else if selectedLayout === 'docs'}
        <DocsLayout {model} {showTOC} />
      {:else if selectedLayout === 'story'}
        <StoryLayout {model} {showTOC} />
      {:else}
        <DashboardLayout {model} {showTOC} />
      {/if}
    </main>
  </div>
{/if}

<style>
  .preview-root {
    min-height: 100vh;
    background: var(--md-bg-primary);
  }

  .layout-scroll-root {
    height: 100vh;
    overflow-y: auto;
    scroll-behavior: smooth;
    padding-top: 3.25rem;
  }

  .exit-presentation {
    all: unset;
    cursor: pointer;
    position: fixed;
    top: 1rem;
    right: 1rem;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--md-bg-secondary);
    border: 1px solid var(--md-border);
    border-radius: 50%;
    color: var(--md-fg-secondary);
    font-size: 1rem;
    z-index: 200;
    opacity: 0;
    transition: opacity 0.3s ease, color 0.2s ease;
  }

  .exit-presentation:hover {
    color: var(--md-accent);
    opacity: 1 !important;
  }

  :global(body:hover) .exit-presentation {
    opacity: 0.6;
  }
</style>
