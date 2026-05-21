<script lang="ts">
  import { onMessage, postMessage } from './lib/message-bridge';

  let html = $state('<p>Loading preview...</p>');

  onMessage((message) => {
    switch (message.type) {
      case 'update':
        html = message.html;
        break;
      case 'scrollTo':
        // Will be implemented in Phase v0.1
        break;
    }
  });

  // Notify host that webview is ready
  postMessage({ type: 'ready' });
</script>

<main>
  <div class="markdown-body">
    {@html html}
  </div>
</main>

<style>
  main {
    font-family: var(--vscode-font-family, sans-serif);
    color: var(--vscode-editor-foreground, #333);
    background: var(--vscode-editor-background, #fff);
    padding: 20px;
    min-height: 100vh;
  }

  :global(.markdown-body) {
    max-width: 800px;
    margin: 0 auto;
  }
</style>
