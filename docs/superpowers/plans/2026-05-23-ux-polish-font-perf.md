# UX Polish, Font Selection & Performance Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Ghost Nav chevron affordance, editor right-click preview, polished glassmorphism icon, per-slot font selection, and targeted performance fixes.

**Architecture:** 5 independent improvements. Ghost Nav and Font Selection touch the Svelte webview layer. Context menu and icon touch `package.json`/assets only. Performance audit targets mermaid, CSP, and layout-engine. Font loading requires a CSP fix in `preview-provider.ts` to allow Google Fonts.

**Tech Stack:** Svelte 5, TypeScript, Vitest, VS Code extension API

---

### Task 1: Ghost Nav Chevron Affordance

**Files:**
- Modify: `src/webview/lib/GhostNav.svelte`
- Modify: `tests/ghost-nav.test.ts`

- [ ] **Step 1: Update the strip opacity test**

In `tests/ghost-nav.test.ts`, find the line:
```ts
expect(source).toContain('opacity: 0.4;');
```
Change it to:
```ts
expect(source).toContain('opacity: 0.65;');
```

- [ ] **Step 2: Add chevron affordance tests**

Append to the `describe` block in `tests/ghost-nav.test.ts`:

```ts
  it('renders a ghost-chevron element alongside the strip', () => {
    expect(source).toContain('ghost-chevron');
    expect(source).toContain('‹');
  });

  it('hides the chevron when nav panel is open', () => {
    // The chevron must share the same hidden condition as the strip
    const hiddenMatches = (source.match(/class:hidden={navVisible}/g) || []).length;
    expect(hiddenMatches).toBeGreaterThanOrEqual(2);
  });

  it('defines a pulse keyframe animation for the chevron', () => {
    expect(source).toContain('@keyframes chevron-pulse');
    expect(source).toContain('.ghost-chevron.pulse');
  });

  it('brightens chevron on hover via parent selector', () => {
    expect(source).toContain('.ghost-nav:hover .ghost-chevron');
  });

  it('clears pulse timeout on destroy', () => {
    expect(source).toContain('pulseTimeout');
    expect(source).toContain('clearTimeout(pulseTimeout)');
  });
```

- [ ] **Step 3: Run tests to verify they fail**

```
npx vitest run tests/ghost-nav.test.ts
```

Expected: opacity test + 5 new chevron tests fail.

- [ ] **Step 4: Replace GhostNav.svelte**

Replace the full contents of `src/webview/lib/GhostNav.svelte`:

```svelte
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
```

- [ ] **Step 5: Run tests to verify they pass**

```
npx vitest run tests/ghost-nav.test.ts
```

Expected: All pass.

- [ ] **Step 6: Build**

```
npm run build
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/webview/lib/GhostNav.svelte tests/ghost-nav.test.ts
git commit -m "feat: add ghost-nav chevron pulse affordance"
```

---

### Task 2: Right-click Context Menu

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add editor/context entry**

In `package.json`, find `contributes.menus`. Currently:

```json
"menus": {
  "editor/title": [
    {
      "when": "resourceLangId == markdown",
      "command": "markdownWarrior.openPreview",
      "group": "navigation"
    }
  ]
}
```

Add `editor/context`:

```json
"menus": {
  "editor/title": [
    {
      "when": "resourceLangId == markdown",
      "command": "markdownWarrior.openPreview",
      "group": "navigation"
    }
  ],
  "editor/context": [
    {
      "when": "resourceLangId == markdown",
      "command": "markdownWarrior.openPreview",
      "group": "navigation"
    }
  ]
}
```

- [ ] **Step 2: Verify JSON is valid**

```
node -e "require('./package.json'); console.log('valid')"
```

Expected: `valid`

- [ ] **Step 3: Build**

```
npm run build
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "feat: add right-click context menu entry for markdown preview"
```

---

### Task 3: App Icon

**Files:**
- Create: `images/icon.svg`
- Create: `images/icon.png` (128×128)
- Modify: `package.json`

- [ ] **Step 1: Create images directory and icon.svg**

```bash
mkdir -p images
```

Create `images/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a2980"/>
      <stop offset="100%" stop-color="#6b21a8"/>
    </linearGradient>
    <linearGradient id="glass-shine" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.25)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.04)"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.35)"/>
    </filter>
  </defs>

  <!-- Background rounded square -->
  <rect x="4" y="4" width="120" height="120" rx="26" ry="26" fill="url(#bg)"/>

  <!-- Glass overlay panel -->
  <rect x="16" y="16" width="96" height="96" rx="18" ry="18"
        fill="url(#glass-shine)" opacity="0.9"/>

  <!-- Inner glass border -->
  <rect x="16" y="16" width="96" height="96" rx="18" ry="18"
        fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>

  <!-- Letter M -->
  <text x="64" y="82"
        font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
        font-size="62" font-weight="800"
        text-anchor="middle"
        fill="white"
        filter="url(#shadow)"
        opacity="0.95">M</text>

  <!-- Accent dot — bottom right, signals "live preview" -->
  <circle cx="102" cy="102" r="7" fill="#4fc1ff" opacity="0.9"/>
</svg>
```

- [ ] **Step 2: Export images/icon.png (128×128)**

Install sharp if not present, then export:

```bash
npm install --save-dev sharp
node -e "require('sharp')('images/icon.svg').resize(128,128).png().toFile('images/icon.png',(e,i)=>{ if(e) throw e; console.log('icon.png written', i); })"
```

If sharp fails on Windows with native bindings, open `images/icon.svg` in any browser, screenshot the rendered SVG at 128×128, and save as `images/icon.png`.

- [ ] **Step 3: Add icon field to package.json**

In `package.json`, add after `"version": "0.3.0"`:

```json
"icon": "images/icon.png",
```

- [ ] **Step 4: Verify JSON is valid**

```
node -e "require('./package.json'); console.log('valid')"
```

Expected: `valid`

- [ ] **Step 5: Build**

```
npm run build
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add images/icon.svg images/icon.png package.json
git commit -m "feat: add glassmorphism app icon"
```

---

### Task 4: Font Registry

**Files:**
- Create: `src/webview/lib/font-registry.ts`
- Create: `tests/font-registry.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/font-registry.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  BODY_FONTS,
  HEADING_FONTS,
  CODE_FONTS,
  getFontEntry,
  type FontEntry,
} from '../src/webview/lib/font-registry';

describe('font-registry', () => {
  it('BODY_FONTS has at least 4 entries', () => {
    expect(BODY_FONTS.length).toBeGreaterThanOrEqual(4);
  });

  it('HEADING_FONTS has at least 4 entries', () => {
    expect(HEADING_FONTS.length).toBeGreaterThanOrEqual(4);
  });

  it('CODE_FONTS has at least 3 entries', () => {
    expect(CODE_FONTS.length).toBeGreaterThanOrEqual(3);
  });

  it('all entries have required fields', () => {
    const all: FontEntry[] = [...BODY_FONTS, ...HEADING_FONTS, ...CODE_FONTS];
    for (const f of all) {
      expect(f.id, 'id').toBeTruthy();
      expect(f.label, 'label').toBeTruthy();
      expect(f.stack, 'stack').toBeTruthy();
    }
  });

  it('no duplicate ids within BODY_FONTS', () => {
    const ids = BODY_FONTS.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no duplicate ids within HEADING_FONTS', () => {
    const ids = HEADING_FONTS.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no duplicate ids within CODE_FONTS', () => {
    const ids = CODE_FONTS.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('first BODY_FONTS entry is system (no googleFamily)', () => {
    expect(BODY_FONTS[0].id).toBe('system');
    expect(BODY_FONTS[0].googleFamily).toBeUndefined();
  });

  it('first HEADING_FONTS entry is inherit (no googleFamily)', () => {
    expect(HEADING_FONTS[0].id).toBe('inherit');
    expect(HEADING_FONTS[0].googleFamily).toBeUndefined();
  });

  it('first CODE_FONTS entry is cascadia (no googleFamily)', () => {
    expect(CODE_FONTS[0].id).toBe('cascadia');
    expect(CODE_FONTS[0].googleFamily).toBeUndefined();
  });

  it('getFontEntry returns the correct entry', () => {
    const entry = getFontEntry('inter', BODY_FONTS);
    expect(entry.label).toBe('Inter');
    expect(entry.googleFamily).toBe('Inter');
  });

  it('getFontEntry throws on unknown id', () => {
    expect(() => getFontEntry('nonexistent', BODY_FONTS)).toThrow('Unknown font: nonexistent');
  });

  it('Google Font entries have googleFamily set', () => {
    const jetbrains = getFontEntry('jetbrains', CODE_FONTS);
    expect(jetbrains.googleFamily).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/font-registry.test.ts
```

Expected: All fail — "Cannot find module".

- [ ] **Step 3: Create src/webview/lib/font-registry.ts**

```ts
export interface FontEntry {
  id: string;
  label: string;
  stack: string;
  googleFamily?: string;
}

export const BODY_FONTS: FontEntry[] = [
  { id: 'system',       label: 'System UI',      stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', sans-serif" },
  { id: 'georgia',      label: 'Georgia',         stack: "Georgia, 'Times New Roman', serif" },
  { id: 'inter',        label: 'Inter',           stack: "'Inter', sans-serif",               googleFamily: 'Inter' },
  { id: 'lato',         label: 'Lato',            stack: "'Lato', sans-serif",                googleFamily: 'Lato' },
  { id: 'merriweather', label: 'Merriweather',    stack: "'Merriweather', serif",             googleFamily: 'Merriweather' },
  { id: 'nunito',       label: 'Nunito',          stack: "'Nunito', sans-serif",              googleFamily: 'Nunito' },
];

export const HEADING_FONTS: FontEntry[] = [
  { id: 'inherit',  label: 'Same as body',      stack: 'inherit' },
  { id: 'georgia',  label: 'Georgia',           stack: "Georgia, 'Times New Roman', serif" },
  { id: 'playfair', label: 'Playfair Display',  stack: "'Playfair Display', serif",          googleFamily: 'Playfair+Display' },
  { id: 'raleway',  label: 'Raleway',           stack: "'Raleway', sans-serif",              googleFamily: 'Raleway' },
  { id: 'poppins',  label: 'Poppins',           stack: "'Poppins', sans-serif",              googleFamily: 'Poppins' },
];

export const CODE_FONTS: FontEntry[] = [
  { id: 'cascadia',  label: 'Cascadia Code',   stack: "'Cascadia Code', Consolas, 'Courier New', monospace" },
  { id: 'jetbrains', label: 'JetBrains Mono',  stack: "'JetBrains Mono', monospace",         googleFamily: 'JetBrains+Mono' },
  { id: 'fira',      label: 'Fira Code',       stack: "'Fira Code', monospace",              googleFamily: 'Fira+Code' },
];

export function getFontEntry(id: string, fonts: FontEntry[]): FontEntry {
  const entry = fonts.find(f => f.id === id);
  if (!entry) throw new Error(`Unknown font: ${id}`);
  return entry;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/font-registry.test.ts
```

Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/webview/lib/font-registry.ts tests/font-registry.test.ts
git commit -m "feat: add font registry with body, heading, and code font entries"
```

---

### Task 5: Font Loader

**Files:**
- Create: `src/webview/lib/font-loader.ts`
- Create: `tests/font-loader.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/font-loader.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { loadGoogleFont, isFontLoaded } from '../src/webview/lib/font-loader';

describe('font-loader', () => {
  beforeEach(() => {
    document.querySelectorAll('link[data-gfont]').forEach(el => el.remove());
  });

  it('injects a stylesheet link for the given font family', () => {
    loadGoogleFont('Inter');
    const link = document.querySelector<HTMLLinkElement>('link[data-gfont="Inter"]');
    expect(link).not.toBeNull();
    expect(link?.rel).toBe('stylesheet');
    expect(link?.href).toContain('fonts.googleapis.com');
    expect(link?.href).toContain('Inter');
  });

  it('uses display=swap in the URL', () => {
    loadGoogleFont('Lato');
    const link = document.querySelector<HTMLLinkElement>('link[data-gfont="Lato"]');
    expect(link?.href).toContain('display=swap');
  });

  it('does not inject duplicate link tags for the same family', () => {
    loadGoogleFont('Inter');
    loadGoogleFont('Inter');
    const links = document.querySelectorAll('link[data-gfont="Inter"]');
    expect(links.length).toBe(1);
  });

  it('isFontLoaded returns false before loading', () => {
    expect(isFontLoaded('Poppins')).toBe(false);
  });

  it('isFontLoaded returns true after loading', () => {
    loadGoogleFont('Poppins');
    expect(isFontLoaded('Poppins')).toBe(true);
  });

  it('can load multiple different families independently', () => {
    loadGoogleFont('Inter');
    loadGoogleFont('Raleway');
    expect(isFontLoaded('Inter')).toBe(true);
    expect(isFontLoaded('Raleway')).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/font-loader.test.ts
```

Expected: All fail — "Cannot find module".

- [ ] **Step 3: Create src/webview/lib/font-loader.ts**

```ts
export function isFontLoaded(family: string): boolean {
  return document.querySelector(`link[data-gfont="${family}"]`) !== null;
}

export function loadGoogleFont(family: string): void {
  if (isFontLoaded(family)) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.dataset.gfont = family;
  link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
  document.head.appendChild(link);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/font-loader.test.ts
```

Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/webview/lib/font-loader.ts tests/font-loader.test.ts
git commit -m "feat: add Google Fonts loader with deduplication"
```

---

### Task 6: Extend WebviewState with Font Fields

**Files:**
- Modify: `src/webview/stores/state.ts`
- Create: `tests/state.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/state.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockState: Record<string, unknown> = {};

vi.mock('../src/webview/lib/message-bridge', () => ({
  getState: <T>() => (Object.keys(mockState).length > 0 ? (mockState as T) : null),
  setState: (s: unknown) => Object.assign(mockState, s),
}));

const { loadState, saveState } = await import('../src/webview/stores/state');

describe('state — font fields', () => {
  beforeEach(() => {
    Object.keys(mockState).forEach(k => delete mockState[k]);
  });

  it('defaults fontBody to "system"', () => {
    expect(loadState().fontBody).toBe('system');
  });

  it('defaults fontHeading to "inherit"', () => {
    expect(loadState().fontHeading).toBe('inherit');
  });

  it('defaults fontCode to "cascadia"', () => {
    expect(loadState().fontCode).toBe('cascadia');
  });

  it('persists fontBody via saveState/loadState', () => {
    saveState({ fontBody: 'inter' });
    expect(loadState().fontBody).toBe('inter');
  });

  it('persists fontHeading via saveState/loadState', () => {
    saveState({ fontHeading: 'playfair' });
    expect(loadState().fontHeading).toBe('playfair');
  });

  it('persists fontCode via saveState/loadState', () => {
    saveState({ fontCode: 'fira' });
    expect(loadState().fontCode).toBe('fira');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/state.test.ts
```

Expected: 3 default tests fail — `fontBody` is `undefined`.

- [ ] **Step 3: Update src/webview/stores/state.ts**

Replace full file:

```ts
import { getState, setState } from '../lib/message-bridge';
import { LAYOUT_TYPES, type LayoutOverride } from '../types/layout';

export interface WebviewState {
  scrollPosition: number;
  collapsedHeadings: string[];
  tocVisible: boolean;
  mode: 'document' | 'presentation';
  layoutOverride: LayoutOverride;
  fontBody: string;
  fontHeading: string;
  fontCode: string;
}

const DEFAULT_STATE: WebviewState = {
  scrollPosition: 0,
  collapsedHeadings: [],
  tocVisible: true,
  mode: 'document',
  layoutOverride: 'auto',
  fontBody: 'system',
  fontHeading: 'inherit',
  fontCode: 'cascadia',
};

export function loadState(): WebviewState {
  const state = getState<Partial<WebviewState>>() || {};
  return {
    ...DEFAULT_STATE,
    ...state,
    layoutOverride: normalizeLayoutOverride(state.layoutOverride),
    mode: state.mode === 'presentation' ? 'presentation' : 'document',
    collapsedHeadings: Array.isArray(state.collapsedHeadings)
      ? state.collapsedHeadings.filter((item): item is string => typeof item === 'string')
      : [],
    tocVisible: typeof state.tocVisible === 'boolean' ? state.tocVisible : DEFAULT_STATE.tocVisible,
    scrollPosition: typeof state.scrollPosition === 'number' ? state.scrollPosition : 0,
    fontBody: typeof state.fontBody === 'string' ? state.fontBody : DEFAULT_STATE.fontBody,
    fontHeading: typeof state.fontHeading === 'string' ? state.fontHeading : DEFAULT_STATE.fontHeading,
    fontCode: typeof state.fontCode === 'string' ? state.fontCode : DEFAULT_STATE.fontCode,
  };
}

export function saveState(state: Partial<WebviewState>) {
  const current = loadState();
  const updated = { ...current, ...state };
  setState(updated);
}

const LAYOUT_TYPE_SET = new Set<string>(LAYOUT_TYPES);

function normalizeLayoutOverride(value: unknown): LayoutOverride {
  if (value === 'auto') return 'auto';
  if (typeof value === 'string' && LAYOUT_TYPE_SET.has(value)) {
    return value as LayoutOverride;
  }
  return 'auto';
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/state.test.ts
```

Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/webview/stores/state.ts tests/state.test.ts
git commit -m "feat: extend WebviewState with fontBody, fontHeading, fontCode"
```

---

### Task 7: Add --md-font-heading + Apply to Headings

**Files:**
- Modify: `src/webview/styles/theme-bridge.css`
- Modify: `src/webview/styles/markdown-body.css`

- [ ] **Step 1: Add --md-font-heading to theme-bridge.css**

In `src/webview/styles/theme-bridge.css`, after this line:
```css
  --md-font-mono: var(--vscode-editor-fontFamily, 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace);
```

Add:
```css
  --md-font-heading: var(--md-font-body);
```

- [ ] **Step 2: Apply --md-font-heading in markdown-body.css**

In `src/webview/styles/markdown-body.css`, find the heading selector block and add `font-family`. If the block reads:

```css
.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 1.5em;
  ...
}
```

Add `font-family: var(--md-font-heading);` as the first property inside the block:

```css
.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  font-family: var(--md-font-heading);
  margin-top: 1.5em;
  ...
}
```

- [ ] **Step 3: Build**

```
npm run build
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/webview/styles/theme-bridge.css src/webview/styles/markdown-body.css
git commit -m "feat: add --md-font-heading CSS variable and apply to headings"
```

---

### Task 8: Fix CSP to Allow Google Fonts

**Files:**
- Modify: `src/extension/preview-provider.ts`

The current CSP in `getWebviewContent` blocks external fonts:
```
font-src ${webview.cspSource}
```
Google Fonts serve font files from `https://fonts.gstatic.com`. Without adding it, any Google Font injected by `font-loader.ts` will be blocked.

- [ ] **Step 1: Update the CSP in preview-provider.ts**

Find the `csp` array in `getWebviewContent` (around line 229). Change:

```ts
    const csp = [
      `default-src 'none'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${nonce}'`,
      `img-src ${webview.cspSource} https: data:`,
      `font-src ${webview.cspSource}`,
    ].join('; ');
```

To:

```ts
    const csp = [
      `default-src 'none'`,
      `style-src ${webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com`,
      `script-src 'nonce-${nonce}'`,
      `img-src ${webview.cspSource} https: data:`,
      `font-src ${webview.cspSource} https://fonts.gstatic.com`,
    ].join('; ');
```

- [ ] **Step 2: Build**

```
npm run build
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/extension/preview-provider.ts
git commit -m "fix: allow Google Fonts domains in webview CSP"
```

---

### Task 9: ThemePanel Typography Section + App.svelte Wiring

**Files:**
- Modify: `src/webview/components/ThemePanel.svelte`
- Modify: `src/webview/App.svelte`
- Modify: `tests/theme-panel.test.ts`

- [ ] **Step 1: Add Typography section tests**

Append to the `describe` block in `tests/theme-panel.test.ts`:

```ts
  it('renders a Typography section header', () => {
    expect(source).toContain('Typography');
  });

  it('accepts fontBody, fontHeading, fontCode, and onFontChange props', () => {
    expect(source).toContain('fontBody');
    expect(source).toContain('fontHeading');
    expect(source).toContain('fontCode');
    expect(source).toContain('onFontChange');
  });

  it('renders three font select elements', () => {
    const selectCount = (source.match(/<select/g) || []).length;
    expect(selectCount).toBeGreaterThanOrEqual(3);
  });

  it('imports from font-registry', () => {
    expect(source).toContain("from '../lib/font-registry'");
  });
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/theme-panel.test.ts
```

Expected: 4 new failures.

- [ ] **Step 3: Replace ThemePanel.svelte**

Replace full contents of `src/webview/components/ThemePanel.svelte`:

```svelte
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
```

- [ ] **Step 4: Run ThemePanel tests**

```
npx vitest run tests/theme-panel.test.ts
```

Expected: All pass.

- [ ] **Step 5: Wire fonts into App.svelte**

In `src/webview/App.svelte`, make these changes:

**Add imports** at the top of the `<script>` block (after existing imports):
```ts
  import { loadGoogleFont } from './lib/font-loader';
  import { BODY_FONTS, HEADING_FONTS, CODE_FONTS, getFontEntry } from './lib/font-registry';
```

**Add font state** after `let selectedTheme = $state(DEFAULT_THEME);`:
```ts
  let fontBody = $state(initialState.fontBody);
  let fontHeading = $state(initialState.fontHeading);
  let fontCode = $state(initialState.fontCode);
```

**Add font apply effect** after the existing `saveState` effect (the one that saves `tocVisible`, `mode`, `layoutOverride`):
```ts
  $effect(() => {
    applyFont('body', fontBody);
    applyFont('heading', fontHeading);
    applyFont('code', fontCode);
    saveState({ fontBody, fontHeading, fontCode });
  });
```

**Add helper functions** after `handleThemeSelect`:
```ts
  function applyFont(slot: 'body' | 'heading' | 'code', id: string) {
    const fonts = slot === 'body' ? BODY_FONTS : slot === 'heading' ? HEADING_FONTS : CODE_FONTS;
    const cssVar = slot === 'body' ? '--md-font-body' : slot === 'heading' ? '--md-font-heading' : '--md-font-mono';
    try {
      const entry = getFontEntry(id, fonts);
      if (entry.googleFamily) loadGoogleFont(entry.googleFamily);
      document.documentElement.style.setProperty(cssVar, entry.stack);
    } catch {
      // Unknown id — leave CSS var unchanged
    }
  }

  function handleFontChange(slot: 'body' | 'heading' | 'code', id: string) {
    if (slot === 'body') fontBody = id;
    else if (slot === 'heading') fontHeading = id;
    else fontCode = id;
  }
```

**Update `<ThemePanel>` usage** in the template (find the existing `<ThemePanel>` and replace):
```svelte
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
```

- [ ] **Step 6: Build**

```
npm run build
```

Expected: No errors.

- [ ] **Step 7: Run all tests**

```
npx vitest run
```

Expected: All pass.

- [ ] **Step 8: Commit**

```bash
git add src/webview/components/ThemePanel.svelte src/webview/App.svelte tests/theme-panel.test.ts
git commit -m "feat: add font selection UI in ThemePanel with body, heading, code slots"
```

---

### Task 10: Performance Audit

**Files reviewed:** `src/webview/lib/layout-engine.ts`, `src/webview/lib/mermaid-renderer.ts`

The audit of `preview-provider.ts` shows it is already clean: `updateTimeout` is cleared in `onDidDispose`, all disposables are tracked in the `this.disposables` array. No fix needed there.

`mermaid-renderer.ts` already deduplicates via `block.querySelector('svg')` check. No fix needed.

The one meaningful optimization: `createDocumentModel` in `layout-engine.ts` runs on every `html` change (after debounce). Adding a same-input guard short-circuits layout switches that don't change content.

- [ ] **Step 1: Read the top of layout-engine.ts to understand the module structure**

```
npx vitest run tests/layout-engine.test.ts
```

Confirm tests pass before touching the file.

Expected: All pass.

- [ ] **Step 2: Add same-input memo cache to layout-engine.ts**

Open `src/webview/lib/layout-engine.ts`. Find the `createDocumentModel` function. Above it, add two module-level variables:

```ts
let _lastHtml = '';
let _lastModel: DocumentModel | null = null;
```

Wrap the existing function body so that identical consecutive calls return the cached model:

```ts
export function createDocumentModel(
  html: string,
  frontmatter: Record<string, unknown> | null = null,
): DocumentModel {
  if (html === _lastHtml && _lastModel !== null) return _lastModel;
  _lastHtml = html;
  _lastModel = _buildDocumentModel(html, frontmatter);
  return _lastModel;
}
```

Rename the original function body to `_buildDocumentModel` (same signature, all existing logic moves inside it).

- [ ] **Step 3: Run layout-engine tests**

```
npx vitest run tests/layout-engine.test.ts
```

Expected: All pass — cache is transparent to callers.

- [ ] **Step 4: Run all tests**

```
npx vitest run
```

Expected: All pass.

- [ ] **Step 5: Build**

```
npm run build
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/webview/lib/layout-engine.ts
git commit -m "perf: add same-input memo cache to createDocumentModel"
```

---

## Final Checklist

- [ ] Ghost Nav chevron pulses once on ArticleLayout load, brightens on hover, hides when nav opens
- [ ] Right-clicking a `.md` file in the editor shows "Markdown Warrior: Open Preview"
- [ ] `images/icon.svg` and `images/icon.png` exist and are referenced in `package.json`
- [ ] ThemePanel shows Typography section with Body / Heading / Code dropdowns
- [ ] Selecting a Google Font loads without FOIT (display=swap)
- [ ] Heading font changes apply immediately via `--md-font-heading`
- [ ] Font selection persists across webview hide/show cycles
- [ ] CSP allows `fonts.googleapis.com` (styles) and `fonts.gstatic.com` (font files)
- [ ] `npx vitest run` — all tests pass
- [ ] `npm run build` — no errors
