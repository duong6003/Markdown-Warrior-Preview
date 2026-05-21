<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { onMessage, postMessage } from './lib/message-bridge';
  import { scrollToLine, setupScrollReporter } from './lib/source-map';
  import { renderMermaidBlocks } from './lib/mermaid-renderer';
  import { setupCheckboxHandler } from './lib/checkbox-handler';
  import { loadState, saveState } from './stores/state';
  import TableOfContents from './components/TableOfContents.svelte';

  // Load persisted state
  const initialState = loadState();

  let html = $state('<p>Loading preview...</p>');
  let showTOC = $state(initialState.tocVisible);

  // Save TOC state when it changes
  $effect(() => {
    saveState({ tocVisible: showTOC });
  });

  // Render mermaid blocks after HTML updates
  $effect(() => {
    if (html) {
      tick().then(() => {
        renderMermaidBlocks();
      });
    }
  });

  onMessage((message) => {
    switch (message.type) {
      case 'update':
        html = message.html;
        break;
      case 'scrollTo':
        scrollToLine(message.line);
        break;
      case 'configChanged':
        showTOC = message.config.showTOC;
        break;
    }
  });

  onMount(() => {
    setupScrollReporter();
    setupCheckboxHandler();

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

<div class="layout" class:with-toc={showTOC}>
  <main>
    <div class="markdown-body">
      {@html html}
    </div>
  </main>
  <TableOfContents {html} visible={showTOC} />
</div>

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
</style>
