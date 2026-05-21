<script lang="ts">
  import type { LayoutOverride, LayoutType } from '../types/layout';

  const labels: Record<LayoutType, string> = {
    magazine: 'Magazine',
    docs: 'Docs',
    story: 'Story',
    dashboard: 'Dashboard',
  };

  const options: { value: LayoutOverride; label: string }[] = [
    { value: 'auto', label: 'Auto' },
    { value: 'magazine', label: 'Magazine' },
    { value: 'docs', label: 'Docs' },
    { value: 'story', label: 'Story' },
    { value: 'dashboard', label: 'Dashboard' },
  ];

  let {
    override = 'auto',
    detectedLayout = 'magazine',
    currentLayout = 'magazine',
    onOverrideChange,
    onTogglePresentation,
  }: {
    override: LayoutOverride;
    detectedLayout: LayoutType;
    currentLayout: LayoutType;
    onOverrideChange: (override: LayoutOverride) => void;
    onTogglePresentation: () => void;
  } = $props();
</script>

<nav class="layout-toolbar" aria-label="Preview layout controls">
  <div class="layout-toolbar__group" role="group" aria-label="Layout choices">
    {#each options as option (option.value)}
      <button
        class="layout-toolbar__pill"
        class:active={override === option.value}
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

  <button class="layout-toolbar__slides" type="button" onclick={onTogglePresentation} title="Presentation mode">
    ▶ Slides
  </button>
</nav>
