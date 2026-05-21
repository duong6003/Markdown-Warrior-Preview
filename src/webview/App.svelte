<script lang="ts">
  import { onMount } from 'svelte';
  import { onMessage, postMessage } from './lib/message-bridge';
  import { scrollToLine, setupScrollReporter } from './lib/source-map';
  import TableOfContents from './components/TableOfContents.svelte';

  let html = $state('<p>Loading preview...</p>');
  let showTOC = $state(true);

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
