<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import type { DocumentSection } from '../types/layout';

  let {
    sections,
    onNavigate,
  }: {
    sections: DocumentSection[];
    onNavigate: (key: string, id: string) => void;
  } = $props();

  let navVisible = $state(false);
  let chevronPulse = $state(false);
  let hideTimeout: ReturnType<typeof setTimeout> | undefined;
  let pulseTimeout: ReturnType<typeof setTimeout> | undefined;

  onMount(() => {
    chevronPulse = true;
    pulseTimeout = setTimeout(() => {
      chevronPulse = false;
    }, 700);
  });

  onDestroy(() => {
    clearTimeout(hideTimeout);
    clearTimeout(pulseTimeout);
  });

  function showNav() {
    clearTimeout(hideTimeout);
    navVisible = true;
  }

  function scheduleHide() {
    hideTimeout = setTimeout(() => {
      navVisible = false;
    }, 150);
  }
</script>

{#if sections.length > 1}
  <div class="ghost-nav">
    <div class="ghost-strip" class:hidden={navVisible}></div>
    <span
      class="ghost-chevron"
      class:hidden={navVisible}
      class:pulse={chevronPulse}
      aria-hidden="true"
    >‹</span>
    <div
      class="ghost-edge-zone"
      role="presentation"
      onmouseenter={showNav}
      onmouseleave={scheduleHide}
    ></div>

    {#if navVisible}
      <nav
        class="ghost-nav-panel lc-card--flat"
        aria-label="Document sections"
        transition:fly={{ x: -220, duration: 180, easing: cubicOut }}
        onmouseenter={showNav}
        onmouseleave={scheduleHide}
      >
        {#each sections as section (section.key)}
          <button
            type="button"
            class:deep={section.level > 2}
            onclick={() => onNavigate(section.key, section.id)}
          >
            {section.title}
          </button>
        {/each}
      </nav>
    {/if}
  </div>
{/if}

<style>
  .ghost-nav {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 100;
    pointer-events: none;
  }

  .ghost-edge-zone {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 20px;
    cursor: pointer;
    pointer-events: all;
  }

  .ghost-strip {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      var(--md-accent) 25%,
      var(--md-accent) 75%,
      transparent 100%
    );
    opacity: 0.65;
    pointer-events: none;
    transition: opacity 0.15s;
  }

  .ghost-strip.hidden {
    opacity: 0;
  }

  .ghost-chevron {
    position: absolute;
    top: 50%;
    left: -1px;
    transform: translateY(-50%);
    font-size: 14px;
    line-height: 1;
    color: var(--md-accent);
    opacity: 0.5;
    pointer-events: none;
    transition: opacity 0.15s ease;
    user-select: none;
  }

  .ghost-chevron.hidden {
    opacity: 0;
  }

  .ghost-nav:hover .ghost-chevron:not(.hidden) {
    opacity: 1;
  }

  @keyframes chevron-pulse {
    0%   { opacity: 0.5; transform: translateY(-50%) scale(1); }
    40%  { opacity: 1;   transform: translateY(-50%) scale(1.3); }
    100% { opacity: 0.5; transform: translateY(-50%) scale(1); }
  }

  .ghost-chevron.pulse {
    animation: chevron-pulse 0.65s ease-out forwards;
  }

  .ghost-nav-panel {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    width: clamp(12rem, 22vw, 16rem);
    max-height: calc(100vh - 4rem);
    padding: var(--space-4);
    display: grid;
    gap: var(--space-1);
    overflow-y: auto;
    pointer-events: all;
    background: color-mix(in srgb, var(--md-bg-primary) 92%, black 8%);
    border-right: 1px solid color-mix(in srgb, var(--md-border) 60%, var(--md-accent) 40%);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(8px);
  }

  .ghost-nav-panel button {
    all: unset;
    box-sizing: border-box;
    min-height: var(--space-8);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    color: var(--md-fg-primary);
    cursor: pointer;
    font: 600 var(--text-sm) / 1.4 var(--md-font-body);
    overflow-wrap: anywhere;
  }

  .ghost-nav-panel button.deep {
    padding-left: var(--space-6);
    color: color-mix(in srgb, var(--md-fg-secondary) 82%, var(--md-accent) 18%);
    font-size: var(--text-xs);
    font-weight: 550;
  }

  .ghost-nav-panel button:hover {
    color: var(--md-fg-primary);
    background: color-mix(in srgb, var(--md-accent) 12%, transparent 88%);
  }

  @media (max-width: 900px) {
    .ghost-nav {
      display: none;
    }
  }
</style>
