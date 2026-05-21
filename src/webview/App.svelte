<script lang="ts">
  let message = $state('MarkdownWarriorPreview — Webview Ready');
</script>

<main>
  <h1>{message}</h1>
  <p>Webview is connected and running.</p>
</main>

<style>
  main {
    font-family: var(--vscode-font-family, sans-serif);
    color: var(--vscode-editor-foreground, #333);
    background: var(--vscode-editor-background, #fff);
    padding: 20px;
    min-height: 100vh;
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
</style>
