<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { onMessage, postMessage } from './lib/message-bridge';
  import { scrollToLine, setupScrollReporter } from './lib/source-map';
  import { renderMermaidBlocks } from './lib/mermaid-renderer';
  import { setupCheckboxHandler } from './lib/checkbox-handler';
  import { setupCollapsibleHeadings, restoreCollapsedState } from './lib/collapsible-headings';
  import { loadState, saveState } from './stores/state';
  import TableOfContents from './components/TableOfContents.svelte';
  import SlideView from './components/SlideView.svelte';

  // Load persisted state
  const initialState = loadState();

  let html = $state('<p>Loading preview...</p>');
  let showTOC = $state(initialState.tocVisible);
  let mode = $state<'document' | 'presentation'>(initialState.mode);

  // Save state when it changes
  $effect(() => {
    saveState({ tocVisible: showTOC, mode });
  });

  // Render mermaid blocks and restore collapsible state after HTML updates
  $effect(() => {
    if (html && mode === 'document') {
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
        // Theme auto-syncs via CSS variables, no action needed
        break;
      case 'togglePresentation':
        toggleMode();
        break;
    }
  });

  function toggleMode() {
    mode = mode === 'document' ? 'presentation' : 'document';
  }

  function handleKeydown(e: KeyboardEvent) {
    // Escape exits presentation mode
    if (e.key === 'Escape' && mode === 'presentation') {
      e.preventDefault();
      mode = 'document';
    }
  }

  onMount(() => {
    setupScrollReporter();
    setupCheckboxHandler();
    setupCollapsibleHeadings();

    // Restore scroll position
    const main = document.querySelector('main');
    if (main && initialState.scrollPosition > 0) {
      requestAnimationFrame(() => {
        main.scrollTop = initialState.scrollPosition;
      });
    }

    // Save scroll position periodically
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

  // Notify host that webview is ready
  postMessage({ type: 'ready' });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if mode === 'presentation'}
  <SlideView {html} transition="fade" />
  <button class="exit-presentation" onclick={toggleMode} title="Exit presentation (Esc)">
    ✕
  </button>
{:else}
  <div class="layout" class:with-toc={showTOC}>
    <main>
      <div class="toolbar">
        <button class="toolbar-btn" onclick={toggleMode} title="Presentation mode">
          ▶ Slides
        </button>
      </div>
      <div class="markdown-body">
        {@html html}
      </div>
    </main>
    <TableOfContents {html} visible={showTOC} />
  </div>
{/if}

<style>
  .layout {
    display: flex;
    min-height: 100vh;
    background: var(--md-bg-primary);
  }

  main {
    flex: 1;
    overflow-y: auto;
    height: 100vh;
    scroll-behavior: smooth;
  }

  .layout.with-toc main {
    margin-right: 220px;
  }

  /* Toolbar */
  .toolbar {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    justify-content: flex-end;
    padding: 0.5rem 1rem;
    background: var(--md-bg-primary);
    border-bottom: 1px solid var(--md-border);
    opacity: 0.6;
    transition: opacity 0.2s ease;
  }

  .toolbar:hover {
    opacity: 1;
  }

  .toolbar-btn {
    all: unset;
    cursor: pointer;
    padding: 0.3rem 0.8rem;
    font-size: 0.75rem;
    color: var(--md-fg-secondary);
    background: var(--md-bg-secondary);
    border: 1px solid var(--md-border);
    border-radius: 4px;
    transition: color 0.2s ease, border-color 0.2s ease;
  }

  .toolbar-btn:hover {
    color: var(--md-accent);
    border-color: var(--md-accent);
  }

  /* Exit presentation button */
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
