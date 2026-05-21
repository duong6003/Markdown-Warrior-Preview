<script lang="ts">
  import { slide } from 'svelte/transition';

  interface TocItem {
    id: string;
    text: string;
    level: number;
  }

  let { html = '', visible = true }: { html: string; visible: boolean } = $props();
  let items = $derived(extractHeadings(html));
  let activeId = $state('');

  function extractHeadings(htmlContent: string): TocItem[] {
    const regex = /<h([1-4])\s[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h[1-4]>/gi;
    const results: TocItem[] = [];
    let match;

    while ((match = regex.exec(htmlContent)) !== null) {
      results.push({
        level: parseInt(match[1]),
        id: match[2],
        text: match[3].trim(),
      });
    }

    return results;
  }

  function scrollToHeading(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      activeId = id;
    }
  }
</script>

{#if visible && items.length > 0}
  <nav class="toc" transition:slide={{ duration: 200 }}>
    <h4 class="toc-title">Contents</h4>
    <ul class="toc-list">
      {#each items as item (item.id)}
        <li
          class="toc-item level-{item.level}"
          class:active={activeId === item.id}
        >
          <button onclick={() => scrollToHeading(item.id)}>
            {item.text}
          </button>
        </li>
      {/each}
    </ul>
  </nav>
{/if}

<style>
  .toc {
    position: fixed;
    top: 0;
    right: 0;
    width: 220px;
    height: 100vh;
    overflow-y: auto;
    padding: 1.2rem 1rem;
    background: var(--md-bg-secondary);
    border-left: 1px solid var(--md-border);
    font-size: 0.8rem;
    z-index: 10;
  }

  .toc-title {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--md-fg-muted);
    margin-bottom: 0.75rem;
    font-weight: 600;
  }

  .toc-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .toc-item button {
    all: unset;
    cursor: pointer;
    display: block;
    padding: 0.3rem 0;
    color: var(--md-fg-secondary);
    transition: color 0.2s ease, padding-left 0.2s ease;
    width: 100%;
    line-height: 1.4;
    border-radius: 3px;
  }

  .toc-item button:hover {
    color: var(--md-accent);
    padding-left: 4px;
  }

  .toc-item.active button {
    color: var(--md-accent);
    font-weight: 500;
  }

  .level-1 { padding-left: 0; }
  .level-2 { padding-left: 0.75rem; }
  .level-3 { padding-left: 1.5rem; }
  .level-4 { padding-left: 2.25rem; }
</style>
