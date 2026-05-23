<script lang="ts">
  import type { LayoutOverride, LayoutType } from '../types/layout';

  const labels: Record<LayoutType, string> = {
    article: 'Article',
    story: 'Story',
    dashboard: 'Dashboard',
  };

  const options: { value: LayoutOverride; label: string }[] = [
    { value: 'auto', label: 'Auto' },
    { value: 'article', label: 'Article' },
    { value: 'story', label: 'Story' },
    { value: 'dashboard', label: 'Dashboard' },
  ];

  let {
    override = 'auto',
    detectedLayout,
    currentLayout,
    themePanelVisible = false,
    onOverrideChange,
    onTogglePresentation,
    onToggleThemePanel = () => {},
  }: {
    override?: LayoutOverride;
    detectedLayout: LayoutType;
    currentLayout: LayoutType;
    themePanelVisible?: boolean;
    onOverrideChange: (override: LayoutOverride) => void;
    onTogglePresentation: () => void;
    onToggleThemePanel?: () => void;
  } = $props();
</script>

<nav class="layout-toolbar" aria-label="Preview layout controls">
  <div class="layout-toolbar__group" role="group" aria-label="Layout choices">
    {#each options as option (option.value)}
      <button
        class="layout-toolbar__pill"
        class:active={override === option.value}
        aria-pressed={override === option.value}
        type="button"
        title={option.value === 'auto' ? `Auto: ${labels[detectedLayout]}` : option.label}
        onclick={() => onOverrideChange(option.value)}
      >
        {#if option.value === 'auto'}
          Auto: {labels[detectedLayout]}
        {:else}
          {option.label}
        {/if}
      </button>
    {/each}
  </div>

  <div class="layout-toolbar__status" aria-label="Current layout">
    {labels[currentLayout]}
  </div>

  <button
    class="layout-toolbar__theme-toggle"
    class:active={themePanelVisible}
    type="button"
    aria-pressed={themePanelVisible}
    title="Theme panel"
    onclick={onToggleThemePanel}
  >
    Themes
  </button>

  <button class="layout-toolbar__slides" type="button" onclick={onTogglePresentation} title="Presentation mode">
    ▶ Slides
  </button>
</nav>
