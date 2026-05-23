<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { onMessage, postMessage } from './lib/message-bridge';
  import { scrollToLine, setupScrollReporter } from './lib/source-map';
  import { renderMermaidBlocks } from './lib/mermaid-renderer';
  import { setupLayoutReveal, teardownLayoutReveal } from './lib/layout-reveal';
  import { setupCheckboxHandler } from './lib/checkbox-handler';
  import { setupCollapsibleHeadings, restoreCollapsedState } from './lib/collapsible-headings';
  import { createDocumentModel, resolveLayout } from './lib/layout-engine';
  import { loadState, saveState } from './stores/state';
  import { DEFAULT_THEME } from './lib/theme-registry';
  import { loadGoogleFont } from './lib/font-loader';
  import { BODY_FONTS, HEADING_FONTS, CODE_FONTS, getFontEntry } from './lib/font-registry';
  import type { LayoutOverride } from './types/layout';
  import LayoutToolbar from './components/LayoutToolbar.svelte';
  import ThemePanel from './components/ThemePanel.svelte';
  import SlideView from './components/SlideView.svelte';
  import ArticleLayout from './layouts/ArticleLayout.svelte';
  import StoryLayout from './layouts/StoryLayout.svelte';
  import DashboardLayout from './layouts/DashboardLayout.svelte';

  const initialState = loadState();

  let html = $state('<p>Loading preview...</p>');
  let frontmatter = $state<Record<string, unknown> | null>(null);
  let showTOC = $state(initialState.tocVisible);
  let mode = $state<'document' | 'presentation'>(initialState.mode);
  let layoutOverride = $state<LayoutOverride>(initialState.layoutOverride);
  let selectedTheme = $state(DEFAULT_THEME);
  let fontBody = $state(initialState.fontBody);
  let fontHeading = $state(initialState.fontHeading);
  let fontCode = $state(initialState.fontCode);
  let panelVisible = $state(false);
  let model = $derived(createDocumentModel(html, frontmatter));
  let selectedLayout = $derived(resolveLayout(model.detectedLayout, frontmatter, layoutOverride));

  // Restored once when <main> first appears; guards against re-restoring on layout switches.
  let scrollRestored = false;
  // Cleanup for the per-session scroll-position save listener on <main>.
  let cleanupScrollSave: (() => void) | null = null;

  function clearScrollSaveListener() {
    cleanupScrollSave?.();
    cleanupScrollSave = null;
  }

  $effect(() => {
    saveState({ tocVisible: showTOC, mode, layoutOverride });
  });

  $effect(() => {
    applyFont('body', fontBody);
    applyFont('heading', fontHeading);
    applyFont('code', fontCode);
    saveState({ fontBody, fontHeading, fontCode });
  });

  $effect(() => {
    let cancelled = false;

    if (!(html && mode === 'document' && selectedLayout)) {
      clearScrollSaveListener();
      teardownLayoutReveal();
      return;
    }

    tick().then(() => {
      if (cancelled) return;

      renderMermaidBlocks();
      restoreCollapsedState();
      setupLayoutReveal();

      const main = document.querySelector('main') as HTMLElement | null;
      if (!main) return;

      // setupScrollReporter removes the previous listener before adding a new one,
      // so re-running on layout/mode change is safe.
      setupScrollReporter(main);

      if (!scrollRestored) {
        scrollRestored = true;
        if (initialState.scrollPosition > 0) {
          requestAnimationFrame(() => {
            if (!cancelled) {
              main.scrollTop = initialState.scrollPosition;
            }
          });
        }
      }

      // Replace save listener when <main> is remounted (layout switch recreates the element).
      clearScrollSaveListener();
      let saveTimeout: number | null = null;
      function onScrollSave() {
        if (saveTimeout !== null) {
          clearTimeout(saveTimeout);
        }
        saveTimeout = window.setTimeout(() => {
          if (!cancelled) {
            saveState({ scrollPosition: main.scrollTop });
          }
        }, 500);
      }
      main.addEventListener('scroll', onScrollSave);
      cleanupScrollSave = () => {
        if (saveTimeout !== null) {
          clearTimeout(saveTimeout);
          saveTimeout = null;
        }
        main.removeEventListener('scroll', onScrollSave);
      };
    });

    return () => {
      cancelled = true;
      clearScrollSaveListener();
      teardownLayoutReveal();
    };
  });

  onMessage((message) => {
    switch (message.type) {
      case 'update':
        html = message.html;
        frontmatter = message.frontmatter;
        selectedTheme = message.themeId;
        document.documentElement.dataset.theme = message.themeId;
        break;
      case 'scrollTo':
        if (mode === 'document') {
          scrollToLine(message.line);
        }
        break;
      case 'configChanged':
        showTOC = message.config.showTOC;
        break;
      case 'togglePresentation':
        toggleMode();
        break;
    }
  });

  function handleThemeSelect(themeId: string) {
    selectedTheme = themeId;
    document.documentElement.dataset.theme = themeId;
    postMessage({ type: 'setTheme', themeId });
  }

  function applyFont(slot: 'body' | 'heading' | 'code', id: string) {
    const fonts = slot === 'body' ? BODY_FONTS : slot === 'heading' ? HEADING_FONTS : CODE_FONTS;
    const cssVar = slot === 'body' ? '--md-font-body' : slot === 'heading' ? '--md-font-heading' : '--md-font-mono';
    try {
      const entry = getFontEntry(id, fonts);
      if (entry.googleFamily) loadGoogleFont(entry.googleFamily);
      document.documentElement.style.setProperty(cssVar, entry.stack);
    } catch {
      // Unknown id - leave CSS var unchanged.
    }
  }

  function handleFontChange(slot: 'body' | 'heading' | 'code', id: string) {
    if (slot === 'body') fontBody = id;
    else if (slot === 'heading') fontHeading = id;
    else fontCode = id;
  }

  function toggleMode() {
    mode = mode === 'document' ? 'presentation' : 'document';
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && mode === 'presentation') {
      e.preventDefault();
      mode = 'document';
    }
  }

  onMount(() => {
    setupCheckboxHandler();
    setupCollapsibleHeadings();
    document.documentElement.dataset.theme = selectedTheme;
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
      themePanelVisible={panelVisible}
      onOverrideChange={(v) => { layoutOverride = v; }}
      onTogglePresentation={toggleMode}
      onToggleThemePanel={() => { panelVisible = !panelVisible; }}
    />

    <div class="preview-body">
      <main class="layout-scroll-root" data-active-layout={selectedLayout}>
        {#if selectedLayout === 'article'}
          <ArticleLayout {model} {showTOC} />
        {:else if selectedLayout === 'story'}
          <StoryLayout {model} {showTOC} />
        {:else}
          <DashboardLayout {model} {showTOC} />
        {/if}
      </main>

      {#if panelVisible}
        <ThemePanel
          selectedTheme={selectedTheme}
          onSelect={handleThemeSelect}
          {fontBody}
          {fontHeading}
          {fontCode}
          onFontChange={handleFontChange}
        />
      {/if}
    </div>
  </div>
{/if}

<style>
  .preview-root {
    min-height: 100vh;
    background: var(--theme-bg, var(--md-bg-primary));
    display: flex;
    flex-direction: column;
  }

  .preview-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .layout-scroll-root {
    flex: 1;
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
