# Scroll-First Reading Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the always-on balanced-card clip with content-aware detection so cards render at natural height and "Show more" only appears on sections whose rendered content truly exceeds a viewport-relative threshold.

**Architecture:** A new `clipDetect` Svelte action uses `ResizeObserver` to measure each card body after render and marks it clippable only when `scrollHeight > max(65vh, 640px)`. The `docs` layout loses all clipping machinery. The other three layouts adopt the action. The CSS class `balanced-card--preview` (always-on) is replaced by `balanced-card--clippable` (only when detection fires).

**Tech Stack:** Svelte 5 actions, `$state` runes, Vitest (node env, globals), CSS custom properties.

---

## File Map

| File | Action |
|---|---|
| `src/webview/lib/clip-detect.ts` | Create — Svelte action |
| `src/webview/styles/layouts.css` | Modify — clip CSS scoped to `--clippable` |
| `src/webview/layouts/DocsLayout.svelte` | Modify — remove all balanced-card machinery |
| `src/webview/layouts/DashboardLayout.svelte` | Modify — add clip-detect action |
| `src/webview/layouts/MagazineLayout.svelte` | Modify — add clip-detect action |
| `src/webview/layouts/StoryLayout.svelte` | Modify — add clip-detect action |
| `tests/clip-detect.test.ts` | Create — unit tests |
| `tests/layout-styles.test.ts` | Modify — update CSS assertions |
| `tests/docs-layout.test.ts` | Modify — remove balanced-card assertions |
| `tests/dashboard-layout.test.ts` | Modify — add clip-detect assertions |
| `tests/magazine-layout.test.ts` | Modify — add clip-detect assertions |
| `tests/story-layout.test.ts` | Modify — add clip-detect assertions |

`balanced-card.ts`, `layout-engine.ts`, `types/layout.ts`, extension host files — **no changes**.

---

### Task 1: Create `clipDetect` Svelte action

**Files:**
- Create: `tests/clip-detect.test.ts`
- Create: `src/webview/lib/clip-detect.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/clip-detect.test.ts
import { clipDetect } from '../src/webview/lib/clip-detect';

describe('clipDetect action', () => {
  let observeCallback: (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;
  let disconnected: boolean;

  beforeEach(() => {
    disconnected = false;
    vi.stubGlobal('ResizeObserver', class {
      constructor(cb: typeof observeCallback) { observeCallback = cb; }
      observe() {}
      disconnect() { disconnected = true; }
    });
    vi.stubGlobal('innerHeight', 1000);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls onUpdate(false) immediately when scrollHeight is below threshold', () => {
    const node = { scrollHeight: 300 } as HTMLElement;
    const onUpdate = vi.fn();
    clipDetect(node, onUpdate);
    expect(onUpdate).toHaveBeenCalledWith(false);
  });

  it('calls onUpdate(true) immediately when scrollHeight exceeds threshold', () => {
    // innerHeight=1000 → threshold = max(650, 640) = 650
    const node = { scrollHeight: 700 } as HTMLElement;
    const onUpdate = vi.fn();
    clipDetect(node, onUpdate);
    expect(onUpdate).toHaveBeenCalledWith(true);
  });

  it('uses 640px minimum threshold when 65vh is smaller', () => {
    vi.stubGlobal('innerHeight', 800); // 65% = 520 < 640 → threshold = 640
    const node = { scrollHeight: 620 } as HTMLElement;
    const onUpdate = vi.fn();
    clipDetect(node, onUpdate);
    expect(onUpdate).toHaveBeenCalledWith(false); // 620 <= 640
  });

  it('re-evaluates on resize and calls onUpdate with updated verdict', () => {
    const node = { scrollHeight: 300 } as HTMLElement;
    const onUpdate = vi.fn();
    clipDetect(node, onUpdate);
    onUpdate.mockClear();

    (node as any).scrollHeight = 700;
    observeCallback([], {} as ResizeObserver);

    expect(onUpdate).toHaveBeenCalledWith(true);
  });

  it('returns a destroy function that disconnects the observer', () => {
    const node = { scrollHeight: 100 } as HTMLElement;
    const { destroy } = clipDetect(node, vi.fn());
    destroy();
    expect(disconnected).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npm test -- --reporter=verbose 2>&1 | head -20
```
Expected: FAIL — `Cannot find module '../src/webview/lib/clip-detect'`.

- [ ] **Step 3: Implement `clip-detect.ts`**

```ts
// src/webview/lib/clip-detect.ts
export function clipDetect(
  node: HTMLElement,
  onUpdate: (needsClip: boolean) => void,
): { destroy: () => void } {
  const threshold = Math.max(window.innerHeight * 0.65, 640);
  const check = () => onUpdate(node.scrollHeight > threshold);
  const ro = new ResizeObserver(check);
  ro.observe(node);
  check();
  return { destroy: () => ro.disconnect() };
}
```

- [ ] **Step 4: Run test to verify it passes**

```
npm test -- --reporter=verbose 2>&1 | grep -A 2 "clip-detect"
```
Expected: 5 tests passing under `clipDetect action`.

- [ ] **Step 5: Commit**

```bash
git add src/webview/lib/clip-detect.ts tests/clip-detect.test.ts
git commit -m "feat: add clipDetect action for content-aware card clipping"
```

---

### Task 2: Update CSS — replace always-on clip with `balanced-card--clippable`

**Files:**
- Modify: `tests/layout-styles.test.ts` (lines 49–67)
- Modify: `src/webview/styles/layouts.css`

- [ ] **Step 1: Update the test first (TDD — write failing test)**

In `tests/layout-styles.test.ts`, replace the `it('defines shared balanced-card sizing...')` block (lines 49–67) with:

```ts
  it('defines shared balanced-card sizing, clip-detection, and mobile behavior', () => {
    expect(source).toContain('--balanced-card-min-width: 22rem;');
    expect(source).not.toContain('--balanced-card-preview-height:');
    expect(source).not.toContain('--balanced-card-min-height:');
    expect(source).toContain('--balanced-card-clip-height: clamp(32rem, 65vh, 52rem);');
    expect(source).toContain('--balanced-card-max-height: min(72vh, 48rem);');
    expect(source).toContain('--balanced-card-body-gap: var(--space-4);');
    expect(source).toContain('.balanced-card {');
    expect(source).not.toContain('min-height: var(--balanced-card-min-height);');
    expect(source).toContain('.balanced-card__body {');
    expect(source).not.toContain('max-height: var(--balanced-card-preview-height);');
    expect(source).toContain('.balanced-card--clippable .balanced-card__body {');
    expect(source).toContain('max-height: var(--balanced-card-clip-height);');
    expect(source).toContain('overflow: auto;');
    expect(source).toContain('.balanced-card--clippable.balanced-card--expanded .balanced-card__body {');
    expect(source).toContain('max-height: var(--balanced-card-max-height);');
    expect(source).toContain('.balanced-card--clippable:not(.balanced-card--expanded) .balanced-card__body::after {');
    expect(source).toContain('.balanced-card__toggle');
    expect(source).not.toContain('.balanced-card--expanded .balanced-card__body::after');
    expect(source).toContain('--balanced-card-max-height: none;');
  });
```

- [ ] **Step 2: Run tests to verify the CSS test now fails**

```
npm test -- --reporter=verbose 2>&1 | grep -A 5 "balanced-card sizing"
```
Expected: FAIL with assertion mismatches.

- [ ] **Step 3: Apply CSS changes to `layouts.css`**

**In `:root`**, replace:
```css
  --balanced-card-min-width: 18rem;
  --balanced-card-min-height: clamp(18rem, 34vh, 24rem);
  --balanced-card-preview-height: clamp(13rem, 28vh, 19rem);
  --balanced-card-max-height: min(72vh, 48rem);
```
With:
```css
  --balanced-card-min-width: 22rem;
  --balanced-card-clip-height: clamp(32rem, 65vh, 52rem);
  --balanced-card-max-height: min(72vh, 48rem);
```

**Replace `.balanced-card` block**:
```css
.balanced-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}
```

**Replace `.balanced-card__body` + `.balanced-card--expanded .balanced-card__body` blocks**:
```css
.balanced-card__body {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
}

.balanced-card--clippable .balanced-card__body {
  max-height: var(--balanced-card-clip-height);
  overflow: auto;
  scrollbar-width: thin;
  transition: max-height 0.2s ease;
}

.balanced-card--clippable.balanced-card--expanded .balanced-card__body {
  max-height: var(--balanced-card-max-height);
}
```

**Replace `.balanced-card__body::after` + `.balanced-card--expanded .balanced-card__body::after` blocks**:
```css
.balanced-card--clippable:not(.balanced-card--expanded) .balanced-card__body::after {
  content: '';
  position: sticky;
  bottom: 0;
  display: block;
  height: var(--space-8);
  margin-top: calc(var(--space-8) * -1);
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    transparent,
    color-mix(in srgb, var(--md-bg-secondary) 96%, transparent)
  );
}
```

**In `@media (max-width: 720px)` `:root` block**, replace:
```css
    --balanced-card-min-height: 0;
    --balanced-card-preview-height: min(62vh, 28rem);
    --balanced-card-max-height: none;
```
With:
```css
    --balanced-card-max-height: none;
```

- [ ] **Step 4: Run all tests to verify they pass**

```
npm test
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/webview/styles/layouts.css tests/layout-styles.test.ts
git commit -m "refactor: replace always-on balanced-card clip with content-aware clippable CSS"
```

---

### Task 3: Update `DocsLayout.svelte` — remove all balanced-card

**Files:**
- Modify: `tests/docs-layout.test.ts`
- Modify: `src/webview/layouts/DocsLayout.svelte`

- [ ] **Step 1: Update `docs-layout.test.ts` first**

Replace the first `it` block (lines 7–41) with:

```ts
  it('renders the required rich docs structure from document sections', () => {
    compile(source, {
      filename: 'DocsLayout.svelte',
      generate: 'client',
    });

    expect(source).toContain('let { model, showTOC = true }');
    expect(source).not.toContain("import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';");
    expect(source).not.toContain('let expanded = $state<Record<string, boolean>>({});');
    expect(source).not.toContain('function toggleSection(sectionKey: string)');
    expect(source).toContain('class="docs-layout"');
    expect(source).toContain('data-layout="docs"');
    expect(source).toContain('class="docs-content rich-layout"');
    expect(source).toContain('class="docs-header lc-card--hero"');
    expect(source).toContain('Documentation');
    expect(source).toContain('{model.title}');
    expect(source).toContain('model.description');
    expect(source).toContain('class="docs-sections"');
    expect(source).toContain('{#each model.sections as section (section.key)}');
    expect(source).not.toContain('{#each model.sections as section (section.id)}');
    expect(source).toContain('class="docs-section lc-card"');
    expect(source).not.toContain('balanced-card--preview');
    expect(source).not.toContain('balanced-card--expanded');
    expect(source).not.toContain('balancedCardBodyId');
    expect(source).toContain('class="docs-section__body markdown-body"');
    expect(source).not.toContain('class="balanced-card__toggle"');
    expect(source).not.toContain('aria-expanded={expanded[section.key] ?');
    expect(source).not.toContain('balancedCardToggleLabel');
    expect(source).toContain('data-section-key={section.key}');
    expect(source).toContain('data-section-id={section.id}');
    expect(source).not.toMatch(/\s+id=\{section\.id\}/);
    expect(source).toContain('data-source-line={section.sourceLine}');
    expect(source).toContain('{@html section.html}');
    expect(source).not.toContain('layout-card');
  });
```

- [ ] **Step 2: Run tests to verify docs-layout test now fails**

```
npm test -- --reporter=verbose 2>&1 | grep -A 5 "DocsLayout"
```
Expected: FAIL.

- [ ] **Step 3: Update `DocsLayout.svelte`**

Replace the entire `<script>` block:

```svelte
<script lang="ts">
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC = true }: { model: DocumentModel; showTOC?: boolean } = $props();
  let hasSidebar = $derived(showTOC && model.sections.length > 1);

  function scrollToSection(sectionKey: string, sectionId: string) {
    const escapedKey =
      typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(sectionKey) : sectionKey.replace(/"/g, '\\"');
    const target =
      document.querySelector<HTMLElement>(`[data-section-key="${escapedKey}"]`) ??
      document.getElementById(sectionId);

    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>
```

Replace the `{#each}` section block (the one with `docs-section`) with:

```svelte
      {#each model.sections as section (section.key)}
        <section
          class="docs-section lc-card"
          data-section-key={section.key}
          data-section-id={section.id}
          data-reveal
          data-source-line={section.sourceLine}
        >
          <div class="docs-section__body markdown-body">
            {@html section.html}
          </div>
        </section>
      {/each}
```

- [ ] **Step 4: Run all tests to verify they pass**

```
npm test
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/webview/layouts/DocsLayout.svelte tests/docs-layout.test.ts
git commit -m "refactor: remove balanced-card clipping from docs layout — full scroll reading"
```

---

### Task 4: Update `DashboardLayout.svelte` — content-aware clipping

**Files:**
- Modify: `tests/dashboard-layout.test.ts`
- Modify: `src/webview/layouts/DashboardLayout.svelte`

- [ ] **Step 1: Update `dashboard-layout.test.ts` first**

Replace the first `it` block (lines 7–53) with:

```ts
  it('renders dashboard shell, stats, and keyed section cards', () => {
    compile(source, {
      filename: 'DashboardLayout.svelte',
      generate: 'client',
    });

    expect(source).toContain('let { model, showTOC }');
    expect(source).toContain("import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';");
    expect(source).toContain("import { clipDetect } from '../lib/clip-detect';");
    expect(source).toContain('let needsClip = $state<Record<string, boolean>>({});');
    expect(source).toContain('let taskPercent = $derived');
    expect(source).toContain('class="dashboard-layout rich-layout"');
    expect(source).toContain('data-layout="dashboard"');
    expect(source).toContain('class="dashboard-header lc-card--hero"');
    expect(source).toContain('<span>Dashboard</span>');
    expect(source).toContain('{model.title}');
    expect(source).toContain('model.description');
    expect(source).toContain('class="dashboard-stats"');
    expect(source).toContain('aria-label="Document stats"');
    expect(source).toContain('Words');
    expect(source).toContain('Sections');
    expect(source).toContain('Code');
    expect(source).toContain('Tasks');
    expect(source).toContain('{taskPercent === null ?');
    expect(source).toContain('class="dashboard-grid"');
    expect(source).toContain('aria-label="Dashboard sections"');
    expect(source).toContain('{#each model.sections as section (section.key)}');
    expect(source).not.toContain('{#each model.sections as section (section.id)}');
    expect(source).toContain('class="dashboard-card lc-card balanced-card"');
    expect(source).not.toContain('balanced-card--preview');
    expect(source).toContain('class:balanced-card--clippable={needsClip[section.key]}');
    expect(source).toContain('class:balanced-card--expanded={expanded[section.key]}');
    expect(source).toContain("balancedCardBodyId('dashboard', section.key)");
    expect(source).toContain('data-section-key={section.key}');
    expect(source).toContain('data-section-id={section.id}');
    expect(source).not.toMatch(/\s+id=\{section\.id\}/);
    expect(source).toContain('data-source-line={section.sourceLine}');
    expect(source).toContain('use:clipDetect=');
    expect(source).toContain('needsClip[section.key] = needs');
    expect(source).toContain('{#if needsClip[section.key]}');
    expect(source).toContain('class="balanced-card__toggle"');
    expect(source).toContain('aria-expanded={expanded[section.key] ?');
    expect(source).toContain('aria-controls={balancedCardBodyId(');
    expect(source).toContain('onclick={() => toggleSection(section.key)}');
    expect(source).toContain('{section.blockTypes.join');
    expect(source).toContain('class="dashboard-card__body balanced-card__body markdown-body"');
    expect(source).toContain('balancedCardToggleLabel(Boolean(expanded[section.key]))');
    expect(source).not.toContain('class:expanded={expanded[section.key]}');
    expect(source).not.toContain('aria-pressed={expanded[section.key] ?');
    expect(source).toContain('{@html section.html}');
    expect(source).not.toContain('layout-card');
  });
```

- [ ] **Step 2: Run tests to verify dashboard test now fails**

```
npm test -- --reporter=verbose 2>&1 | grep -A 5 "DashboardLayout"
```
Expected: FAIL.

- [ ] **Step 3: Update `DashboardLayout.svelte`**

Replace the `<script>` block:

```svelte
<script lang="ts">
  import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';
  import { clipDetect } from '../lib/clip-detect';
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC }: { model: DocumentModel; showTOC: boolean } = $props();
  let expanded = $state<Record<string, boolean>>({});
  let needsClip = $state<Record<string, boolean>>({});
  let taskPercent = $derived(
    model.stats.taskCount > 0 ? Math.round((model.stats.completedTaskCount / model.stats.taskCount) * 100) : null,
  );

  function toggleSection(sectionKey: string) {
    expanded[sectionKey] = !expanded[sectionKey];
  }
</script>
```

Replace the `<article>` inside `{#each}` with:

```svelte
      <article
        class="dashboard-card lc-card balanced-card"
        class:balanced-card--clippable={needsClip[section.key]}
        class:balanced-card--expanded={expanded[section.key]}
        data-section-key={section.key}
        data-section-id={section.id}
        data-reveal
        data-source-line={section.sourceLine}
      >
        <div class="dashboard-card__header">
          <span class="dashboard-card__title">{section.title}</span>
          <span class="dashboard-card__types">
            {section.blockTypes.join(' / ') || 'text'}
          </span>
        </div>
        <div
          id={balancedCardBodyId('dashboard', section.key)}
          class="dashboard-card__body balanced-card__body markdown-body"
          use:clipDetect={(needs: boolean) => { needsClip[section.key] = needs; }}
        >
          {@html section.html}
        </div>
        {#if needsClip[section.key]}
          <button
            class="balanced-card__toggle"
            type="button"
            aria-expanded={expanded[section.key] ? 'true' : 'false'}
            aria-controls={balancedCardBodyId('dashboard', section.key)}
            onclick={() => toggleSection(section.key)}
          >
            {balancedCardToggleLabel(Boolean(expanded[section.key]))}
          </button>
        {/if}
      </article>
```

- [ ] **Step 4: Run all tests to verify they pass**

```
npm test
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/webview/layouts/DashboardLayout.svelte tests/dashboard-layout.test.ts
git commit -m "feat: dashboard cards clip only when content exceeds viewport threshold"
```

---

### Task 5: Update `MagazineLayout.svelte` — content-aware clipping

**Files:**
- Modify: `tests/magazine-layout.test.ts`
- Modify: `src/webview/layouts/MagazineLayout.svelte`

- [ ] **Step 1: Update `magazine-layout.test.ts` first**

Replace the first `it` block (lines 7–40) with:

```ts
  it('renders the required rich magazine structure from document sections', () => {
    compile(source, {
      filename: 'MagazineLayout.svelte',
      generate: 'client',
    });

    expect(source).toContain("import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';");
    expect(source).toContain("import { clipDetect } from '../lib/clip-detect';");
    expect(source).toContain('let expanded = $state<Record<string, boolean>>({});');
    expect(source).toContain('let needsClip = $state<Record<string, boolean>>({});');
    expect(source).toContain('function toggleSection(sectionKey: string)');
    expect(source).toContain('data-layout="magazine"');
    expect(source).toContain('class="magazine-layout rich-layout"');
    expect(source).toContain('class="magazine-hero lc-card--hero"');
    expect(source).toContain('Markdown Warrior');
    expect(source).toContain('{model.title}');
    expect(source).toContain('model.description');
    expect(source).toContain('<article class="magazine-content">');
    expect(source).not.toContain('<main class="magazine-content">');
    expect(source).toContain('{#each model.sections as section (section.key)}');
    expect(source).not.toContain('{#each model.sections as section (section.id)}');
    expect(source).toContain('class="magazine-section lc-card balanced-card"');
    expect(source).not.toContain('balanced-card--preview');
    expect(source).toContain('class:balanced-card--clippable={needsClip[section.key]}');
    expect(source).toContain('class:balanced-card--expanded={expanded[section.key]}');
    expect(source).toContain("balancedCardBodyId('magazine', section.key)");
    expect(source).toContain('class="magazine-section__body balanced-card__body markdown-body"');
    expect(source).toContain('use:clipDetect=');
    expect(source).toContain('needsClip[section.key] = needs');
    expect(source).toContain('{#if needsClip[section.key]}');
    expect(source).toContain('class="balanced-card__toggle"');
    expect(source).toContain('aria-expanded={expanded[section.key] ?');
    expect(source).toContain('balancedCardToggleLabel(Boolean(expanded[section.key]))');
    expect(source).not.toContain('class="magazine-section lc-card markdown-body"');
    expect(source).toContain('data-section-key={section.key}');
    expect(source).toContain('data-section-id={section.id}');
    expect(source).not.toMatch(/\s+id=\{section\.id\}/);
    expect(source).toContain('data-source-line={section.sourceLine}');
    expect(source).toContain('{@html section.html}');
    expect(source).not.toContain('layout-card');
  });
```

- [ ] **Step 2: Run tests to verify magazine test now fails**

```
npm test -- --reporter=verbose 2>&1 | grep -A 5 "MagazineLayout"
```
Expected: FAIL.

- [ ] **Step 3: Update `MagazineLayout.svelte`**

Replace the `<script>` block:

```svelte
<script lang="ts">
  import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';
  import { clipDetect } from '../lib/clip-detect';
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC = true }: { model: DocumentModel; showTOC?: boolean } = $props();
  let expanded = $state<Record<string, boolean>>({});
  let needsClip = $state<Record<string, boolean>>({});

  function toggleSection(sectionKey: string) {
    expanded[sectionKey] = !expanded[sectionKey];
  }

  function scrollToSection(sectionKey: string, sectionId: string) {
    const escapedKey =
      typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(sectionKey) : sectionKey.replace(/"/g, '\\"');
    const target =
      document.querySelector<HTMLElement>(`[data-section-key="${escapedKey}"]`) ??
      document.getElementById(sectionId);

    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>
```

Replace the `<section>` inside `{#each}` with:

```svelte
        <section
          class="magazine-section lc-card balanced-card"
          class:balanced-card--clippable={needsClip[section.key]}
          class:balanced-card--expanded={expanded[section.key]}
          data-section-key={section.key}
          data-section-id={section.id}
          data-reveal
          data-source-line={section.sourceLine}
        >
          <div
            id={balancedCardBodyId('magazine', section.key)}
            class="magazine-section__body balanced-card__body markdown-body"
            use:clipDetect={(needs: boolean) => { needsClip[section.key] = needs; }}
          >
            {@html section.html}
          </div>
          {#if needsClip[section.key]}
            <button
              class="balanced-card__toggle"
              type="button"
              aria-expanded={expanded[section.key] ? 'true' : 'false'}
              aria-controls={balancedCardBodyId('magazine', section.key)}
              onclick={() => toggleSection(section.key)}
            >
              {balancedCardToggleLabel(Boolean(expanded[section.key]))}
            </button>
          {/if}
        </section>
```

- [ ] **Step 4: Run all tests to verify they pass**

```
npm test
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/webview/layouts/MagazineLayout.svelte tests/magazine-layout.test.ts
git commit -m "feat: magazine sections clip only when content exceeds viewport threshold"
```

---

### Task 6: Update `StoryLayout.svelte` — content-aware clipping

**Files:**
- Modify: `tests/story-layout.test.ts`
- Modify: `src/webview/layouts/StoryLayout.svelte`

- [ ] **Step 1: Update `story-layout.test.ts` first**

Replace the first `it` block (lines 7–44) with:

```ts
  it('renders the required rich story structure from document sections', () => {
    compile(source, {
      filename: 'StoryLayout.svelte',
      generate: 'client',
    });

    expect(source).toContain('let { model, showTOC }');
    expect(source).toContain("import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';");
    expect(source).toContain("import { clipDetect } from '../lib/clip-detect';");
    expect(source).toContain('let hasDots = $derived(showTOC && model.sections.length > 1)');
    expect(source).toContain('let expanded = $state<Record<string, boolean>>({});');
    expect(source).toContain('let needsClip = $state<Record<string, boolean>>({});');
    expect(source).toContain('function toggleSection(sectionKey: string)');
    expect(source).toContain('class="story-layout"');
    expect(source).toContain('data-layout="story"');
    expect(source).toContain('{#if hasDots}');
    expect(source).toContain('class="story-dots"');
    expect(source).toContain('aria-label="Story sections"');
    expect(source).toContain('class="story-sections"');
    expect(source).toContain('{#each model.sections as section, index (section.key)}');
    expect(source).not.toContain('{#each model.sections as section (section.id)}');
    expect(source).toContain('class="story-section"');
    expect(source).toContain('data-section-key={section.key}');
    expect(source).toContain('data-section-id={section.id}');
    expect(source).not.toMatch(/\s+id=\{section\.id\}/);
    expect(source).toContain('data-reveal');
    expect(source).toContain('data-source-line={section.sourceLine}');
    expect(source).toContain('class="story-section__number"');
    expect(source).toContain('{formatSectionNumber(index)}');
    expect(source).toContain('class="story-section__content lc-card balanced-card"');
    expect(source).not.toContain('balanced-card--preview');
    expect(source).toContain('class:balanced-card--clippable={needsClip[section.key]}');
    expect(source).toContain('class:balanced-card--expanded={expanded[section.key]}');
    expect(source).toContain("balancedCardBodyId('story', section.key)");
    expect(source).toContain('class="story-section__body balanced-card__body markdown-body"');
    expect(source).toContain('use:clipDetect=');
    expect(source).toContain('needsClip[section.key] = needs');
    expect(source).toContain('{#if needsClip[section.key]}');
    expect(source).toContain('class="balanced-card__toggle"');
    expect(source).toContain('aria-expanded={expanded[section.key] ?');
    expect(source).toContain('balancedCardToggleLabel(Boolean(expanded[section.key]))');
    expect(source).not.toContain('class="story-section__content markdown-body lc-card"');
    expect(source).toContain('{@html section.html}');
    expect(source).not.toContain('layout-card');
  });
```

- [ ] **Step 2: Run tests to verify story test now fails**

```
npm test -- --reporter=verbose 2>&1 | grep -A 5 "StoryLayout"
```
Expected: FAIL.

- [ ] **Step 3: Update `StoryLayout.svelte`**

Replace the `<script>` block:

```svelte
<script lang="ts">
  import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';
  import { clipDetect } from '../lib/clip-detect';
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC }: { model: DocumentModel; showTOC: boolean } = $props();
  let hasDots = $derived(showTOC && model.sections.length > 1);
  let expanded = $state<Record<string, boolean>>({});
  let needsClip = $state<Record<string, boolean>>({});

  function formatSectionNumber(index: number) {
    return String(index + 1).padStart(2, '0');
  }

  function toggleSection(sectionKey: string) {
    expanded[sectionKey] = !expanded[sectionKey];
  }

  function scrollToSection(sectionKey: string, sectionId: string) {
    const escapedKey =
      typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(sectionKey) : sectionKey.replace(/"/g, '\\"');
    const target =
      document.querySelector<HTMLElement>(`[data-section-key="${escapedKey}"]`) ??
      document.getElementById(sectionId);

    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>
```

Replace the `.story-section__content` div inside `{#each}` with:

```svelte
        <div
          class="story-section__content lc-card balanced-card"
          class:balanced-card--clippable={needsClip[section.key]}
          class:balanced-card--expanded={expanded[section.key]}
        >
          <div
            id={balancedCardBodyId('story', section.key)}
            class="story-section__body balanced-card__body markdown-body"
            use:clipDetect={(needs: boolean) => { needsClip[section.key] = needs; }}
          >
            {@html section.html}
          </div>
          {#if needsClip[section.key]}
            <button
              class="balanced-card__toggle"
              type="button"
              aria-expanded={expanded[section.key] ? 'true' : 'false'}
              aria-controls={balancedCardBodyId('story', section.key)}
              onclick={() => toggleSection(section.key)}
            >
              {balancedCardToggleLabel(Boolean(expanded[section.key]))}
            </button>
          {/if}
        </div>
```

- [ ] **Step 4: Run all tests to verify they pass**

```
npm test
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/webview/layouts/StoryLayout.svelte tests/story-layout.test.ts
git commit -m "feat: story sections clip only when content exceeds viewport threshold"
```
