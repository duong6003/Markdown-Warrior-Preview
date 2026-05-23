<script lang="ts">
  import { THEMES } from '../lib/theme-registry';
  import { BODY_FONTS, HEADING_FONTS, CODE_FONTS } from '../lib/font-registry';

  let {
    selectedTheme,
    onSelect,
    fontBody,
    fontHeading,
    fontCode,
    onFontChange,
  }: {
    selectedTheme: string;
    onSelect: (id: string) => void;
    fontBody: string;
    fontHeading: string;
    fontCode: string;
    onFontChange: (slot: 'body' | 'heading' | 'code', id: string) => void;
  } = $props();

  const darkThemes = THEMES.filter(theme => theme.mode === 'dark');
  const lightThemes = THEMES.filter(theme => theme.mode === 'light');
</script>

<aside class="theme-panel" aria-label="Theme and typography">
  <div class="theme-panel__header">Themes</div>

  <section class="theme-panel__group" aria-labelledby="theme-panel-dark">
    <div class="theme-panel__group-label" id="theme-panel-dark">Dark</div>
    {#each darkThemes as theme (theme.id)}
      <button
        class="theme-panel__item"
        class:active={selectedTheme === theme.id}
        aria-pressed={selectedTheme === theme.id}
        type="button"
        onclick={() => onSelect(theme.id)}
      >
        <span class="theme-panel__label">{theme.label}</span>
        <span class="theme-panel__swatches" aria-hidden="true">
          {#each theme.swatches.slice(0, 3) as color (color)}
            <span class="theme-panel__swatch" style:background={color}></span>
          {/each}
        </span>
      </button>
    {/each}
  </section>

  <section class="theme-panel__group" aria-labelledby="theme-panel-light">
    <div class="theme-panel__group-label" id="theme-panel-light">Light</div>
    {#each lightThemes as theme (theme.id)}
      <button
        class="theme-panel__item"
        class:active={selectedTheme === theme.id}
        aria-pressed={selectedTheme === theme.id}
        type="button"
        onclick={() => onSelect(theme.id)}
      >
        <span class="theme-panel__label">{theme.label}</span>
        <span class="theme-panel__swatches" aria-hidden="true">
          {#each theme.swatches.slice(0, 3) as color (color)}
            <span class="theme-panel__swatch" style:background={color}></span>
          {/each}
        </span>
      </button>
    {/each}
  </section>

  <div class="theme-panel__divider"></div>
  <div class="theme-panel__header">Typography</div>

  <section class="theme-panel__group">
    <div class="theme-panel__group-label">Body</div>
    <select
      class="theme-panel__select"
      value={fontBody}
      onchange={(e) => onFontChange('body', (e.target as HTMLSelectElement).value)}
    >
      {#each BODY_FONTS as font (font.id)}
        <option value={font.id}>{font.label}</option>
      {/each}
    </select>
  </section>

  <section class="theme-panel__group">
    <div class="theme-panel__group-label">Heading</div>
    <select
      class="theme-panel__select"
      value={fontHeading}
      onchange={(e) => onFontChange('heading', (e.target as HTMLSelectElement).value)}
    >
      {#each HEADING_FONTS as font (font.id)}
        <option value={font.id}>{font.label}</option>
      {/each}
    </select>
  </section>

  <section class="theme-panel__group">
    <div class="theme-panel__group-label">Code</div>
    <select
      class="theme-panel__select"
      value={fontCode}
      onchange={(e) => onFontChange('code', (e.target as HTMLSelectElement).value)}
    >
      {#each CODE_FONTS as font (font.id)}
        <option value={font.id}>{font.label}</option>
      {/each}
    </select>
  </section>
</aside>

<style>
  .theme-panel {
    width: 180px;
    height: 100%;
    flex-shrink: 0;
    overflow-y: auto;
    box-sizing: border-box;
    padding: 0.75rem 0.5rem;
    color: var(--theme-text, var(--md-fg-primary));
    background: var(--theme-surface, var(--md-bg-secondary));
    border-left: 1px solid var(--theme-border, var(--md-border));
  }

  .theme-panel__header {
    margin-bottom: 0.5rem;
    padding: 0 0.5rem 0.5rem;
    border-bottom: 1px solid var(--theme-border, var(--md-border));
    color: var(--theme-text-muted, var(--md-fg-secondary));
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .theme-panel__divider {
    margin: 0.75rem 0.5rem;
    border-top: 1px solid var(--theme-border, var(--md-border));
  }

  .theme-panel__group {
    margin: 0 0 0.75rem;
  }

  .theme-panel__group-label {
    padding: 0 0.5rem 0.25rem;
    color: var(--theme-text-muted, var(--md-fg-secondary));
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .theme-panel__item {
    all: unset;
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
    padding: 0.375rem 0.5rem;
    border-left: 3px solid transparent;
    border-radius: var(--theme-radius, 4px);
    cursor: pointer;
  }

  .theme-panel__item:hover,
  .theme-panel__item:focus-visible {
    background: color-mix(in srgb, var(--theme-accent, var(--md-accent)) 8%, transparent);
    outline: 1px solid var(--theme-accent, var(--md-accent));
    outline-offset: -1px;
  }

  .theme-panel__item.active {
    border-left-color: var(--theme-accent, var(--md-accent));
    background: color-mix(in srgb, var(--theme-accent, var(--md-accent)) 12%, transparent);
  }

  .theme-panel__label {
    margin-bottom: 0.25rem;
    color: var(--theme-text, var(--md-fg-primary));
    font-size: 0.75rem;
    line-height: 1.2;
  }

  .theme-panel__swatches {
    display: flex;
    gap: 2px;
  }

  .theme-panel__swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border: 1px solid rgba(128, 128, 128, 0.3);
    border-radius: 2px;
  }

  .theme-panel__select {
    all: unset;
    display: block;
    width: 100%;
    box-sizing: border-box;
    padding: 0.3rem 0.5rem;
    background: color-mix(in srgb, var(--theme-accent, var(--md-accent)) 6%, var(--theme-surface, var(--md-bg-secondary)));
    border: 1px solid var(--theme-border, var(--md-border));
    border-radius: var(--theme-radius, 4px);
    color: var(--theme-text, var(--md-fg-primary));
    font-size: 0.75rem;
    cursor: pointer;
    appearance: auto;
  }

  .theme-panel__select:focus {
    outline: 1px solid var(--theme-accent, var(--md-accent));
  }
</style>
