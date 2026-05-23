# Balanced Layout Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shared balanced-card behavior so Docs, Magazine, Story, and Dashboard sections keep consistent widths/heights while long content stays scrollable and expandable.

**Architecture:** Add shared CSS tokens/classes in `layouts.css`, a tiny TypeScript helper for body IDs and labels, then apply local expanded-state behavior in each Svelte layout. Keep document parsing and `DocumentModel` unchanged; only section/card presentation changes.

**Tech Stack:** Svelte 5, TypeScript, CSS custom properties, Vitest source/compile tests, Vite/esbuild build.

---

## File Structure

- Modify: `src/webview/styles/layouts.css` — shared balanced-card tokens, base classes, preview/expanded states, mobile relaxation.
- Create: `src/webview/lib/balanced-card.ts` — shared ID sanitizer and toggle label helper.
- Modify: `src/webview/layouts/DashboardLayout.svelte` — replace dashboard-only collapsed body behavior with shared balanced-card markup.
- Modify: `src/webview/layouts/DocsLayout.svelte` — wrap section HTML in shared balanced-card body and add local expand state.
- Modify: `src/webview/layouts/MagazineLayout.svelte` — same shared section card behavior as Docs while preserving rail/hero.
- Modify: `src/webview/layouts/StoryLayout.svelte` — apply balanced-card behavior inside story content panel while preserving section numbers/dots.
- Modify: `tests/layout-styles.test.ts` — assert shared balanced-card tokens/classes.
- Create: `tests/balanced-card.test.ts` — assert helper output.
- Modify: `tests/dashboard-layout.test.ts` — assert Dashboard uses shared classes and toggle controls.
- Modify: `tests/docs-layout.test.ts` — assert Docs uses shared classes and toggle controls.
- Modify: `tests/magazine-layout.test.ts` — assert Magazine uses shared classes and toggle controls.
- Modify: `tests/story-layout.test.ts` — assert Story uses shared classes and toggle controls.

---

### Task 1: Shared balanced-card stylesheet

**Files:**
- Modify: `tests/layout-styles.test.ts`
- Modify: `src/webview/styles/layouts.css`

- [ ] **Step 1: Write failing stylesheet test**

Add this test inside `describe('shared layout stylesheet', () => { ... })` after the existing card variants test in `tests/layout-styles.test.ts`:

```ts
  it('defines shared balanced-card sizing, preview, expanded, and mobile behavior', () => {
    expect(source).toContain('--balanced-card-min-width: 18rem;');
    expect(source).toContain('--balanced-card-min-height: clamp(18rem, 34vh, 24rem);');
    expect(source).toContain('--balanced-card-preview-height: clamp(13rem, 28vh, 19rem);');
    expect(source).toContain('--balanced-card-max-height: min(72vh, 48rem);');
    expect(source).toContain('--balanced-card-body-gap: var(--space-4);');
    expect(source).toContain('.balanced-card {');
    expect(source).toContain('min-height: var(--balanced-card-min-height);');
    expect(source).toContain('.balanced-card__body {');
    expect(source).toContain('max-height: var(--balanced-card-preview-height);');
    expect(source).toContain('overflow: auto;');
    expect(source).toContain('.balanced-card--expanded .balanced-card__body');
    expect(source).toContain('max-height: var(--balanced-card-max-height);');
    expect(source).toContain('.balanced-card__body::after');
    expect(source).toContain('.balanced-card--expanded .balanced-card__body::after');
    expect(source).toContain('.balanced-card__toggle');
    expect(source).toContain('--balanced-card-min-height: 0;');
    expect(source).toContain('--balanced-card-preview-height: min(62vh, 28rem);');
  });
```

- [ ] **Step 2: Run stylesheet test to verify failure**

Run:

```powershell
npm test -- tests/layout-styles.test.ts
```

Expected: FAIL. Missing `--balanced-card-*` tokens and `.balanced-card*` classes.

- [ ] **Step 3: Add balanced-card tokens**

In `src/webview/styles/layouts.css`, add these tokens inside `:root` after `--shadow-lg`:

```css
  --balanced-card-min-width: 18rem;
  --balanced-card-min-height: clamp(18rem, 34vh, 24rem);
  --balanced-card-preview-height: clamp(13rem, 28vh, 19rem);
  --balanced-card-max-height: min(72vh, 48rem);
  --balanced-card-body-gap: var(--space-4);
```

- [ ] **Step 4: Add balanced-card base classes**

In `src/webview/styles/layouts.css`, add this block after `.lc-card--flat { ... }` and before the shared hover rule:

```css
.balanced-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: var(--balanced-card-min-height);
  overflow: hidden;
}

.balanced-card__body {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  max-height: var(--balanced-card-preview-height);
  overflow: auto;
  scrollbar-width: thin;
  transition: max-height 0.2s ease;
}

.balanced-card--expanded .balanced-card__body {
  max-height: var(--balanced-card-max-height);
}

.balanced-card__body::after {
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

.balanced-card--expanded .balanced-card__body::after {
  display: none;
}

.balanced-card__toggle {
  all: unset;
  box-sizing: border-box;
  cursor: pointer;
  align-self: flex-start;
  margin: var(--space-3) var(--space-6) var(--space-4);
  min-height: var(--space-8);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--space-3);
  border: 1px solid var(--md-border);
  border-radius: var(--radius-full);
  color: var(--md-accent);
  background: color-mix(in srgb, var(--md-accent) 8%, transparent);
  font: 700 var(--text-xs) / 1 var(--md-font-body);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.balanced-card__toggle:hover,
.balanced-card__toggle:focus-visible {
  color: var(--md-fg-primary);
  background: color-mix(in srgb, var(--md-accent) 14%, transparent);
  border-color: var(--md-accent);
  transform: translateY(-1px);
}
```

- [ ] **Step 5: Add mobile relaxation**

In `src/webview/styles/layouts.css`, add this inside the existing `@media (max-width: 720px)` block after the `.rich-layout` rule:

```css

  :root {
    --balanced-card-min-height: 0;
    --balanced-card-preview-height: min(62vh, 28rem);
    --balanced-card-max-height: none;
  }

  .balanced-card__toggle {
    margin-inline: var(--space-4);
  }
```

- [ ] **Step 6: Run stylesheet test to verify pass**

Run:

```powershell
npm test -- tests/layout-styles.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit stylesheet changes**

```powershell
git add tests/layout-styles.test.ts src/webview/styles/layouts.css
git commit -m @'
feat: add shared balanced card styles

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
'@
```

---

### Task 2: Balanced-card helper

**Files:**
- Create: `tests/balanced-card.test.ts`
- Create: `src/webview/lib/balanced-card.ts`

- [ ] **Step 1: Write failing helper test**

Create `tests/balanced-card.test.ts`:

```ts
import { balancedCardBodyId, balancedCardToggleLabel } from '../src/webview/lib/balanced-card';

describe('balanced-card helpers', () => {
  it('creates stable sanitized body IDs scoped by layout', () => {
    expect(balancedCardBodyId('docs', 'section 1/a')).toBe('docs-balanced-body-section-1-a');
    expect(balancedCardBodyId('magazine', 'A_B-2')).toBe('magazine-balanced-body-A_B-2');
    expect(balancedCardBodyId('story', 'intro.title')).toBe('story-balanced-body-intro-title');
    expect(balancedCardBodyId('dashboard', 'kế hoạch')).toBe('dashboard-balanced-body-k-ho-ch');
  });

  it('returns consistent toggle labels', () => {
    expect(balancedCardToggleLabel(false)).toBe('Show more');
    expect(balancedCardToggleLabel(true)).toBe('Show less');
  });
});
```

- [ ] **Step 2: Run helper test to verify failure**

Run:

```powershell
npm test -- tests/balanced-card.test.ts
```

Expected: FAIL with module import error for `../src/webview/lib/balanced-card`.

- [ ] **Step 3: Create helper implementation**

Create `src/webview/lib/balanced-card.ts`:

```ts
export type BalancedCardLayout = 'dashboard' | 'docs' | 'magazine' | 'story';

export function balancedCardBodyId(layout: BalancedCardLayout, sectionKey: string): string {
  return `${layout}-balanced-body-${sectionKey.replace(/[^A-Za-z0-9_-]/g, '-')}`;
}

export function balancedCardToggleLabel(expanded: boolean): string {
  return expanded ? 'Show less' : 'Show more';
}
```

- [ ] **Step 4: Run helper test to verify pass**

Run:

```powershell
npm test -- tests/balanced-card.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit helper changes**

```powershell
git add tests/balanced-card.test.ts src/webview/lib/balanced-card.ts
git commit -m @'
feat: add balanced card helpers

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
'@
```

---

### Task 3: Dashboard balanced cards

**Files:**
- Modify: `tests/dashboard-layout.test.ts`
- Modify: `src/webview/layouts/DashboardLayout.svelte`

- [ ] **Step 1: Write failing Dashboard test assertions**

Update `tests/dashboard-layout.test.ts` so the first test expects shared balanced-card markup:

```ts
    expect(source).toContain("import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';");
    expect(source).toContain('class="dashboard-card lc-card balanced-card balanced-card--preview"');
    expect(source).toContain('class:balanced-card--expanded={expanded[section.key]}');
    expect(source).toContain("balancedCardBodyId('dashboard', section.key)");
    expect(source).toContain('class="dashboard-card__body balanced-card__body markdown-body"');
    expect(source).toContain('class="balanced-card__toggle"');
    expect(source).toContain('aria-expanded={expanded[section.key] ?');
    expect(source).toContain('aria-controls={balancedCardBodyId(');
    expect(source).toContain('balancedCardToggleLabel(Boolean(expanded[section.key]))');
    expect(source).not.toContain('class:expanded={expanded[section.key]}');
    expect(source).not.toContain('aria-pressed={expanded[section.key] ?');
```

Update the second test to remove old dashboard-only height assertions and add shared behavior assertions:

```ts
    expect(source).toContain('grid-template-columns: repeat(auto-fill, minmax(var(--balanced-card-min-width), 1fr));');
    expect(source).toContain('.dashboard-card__body {');
    expect(source).toContain('padding: var(--space-4) var(--space-6) 0;');
    expect(source).not.toContain('max-height: 18rem;');
    expect(source).not.toContain('.dashboard-card.expanded .dashboard-card__body');
```

- [ ] **Step 2: Run Dashboard test to verify failure**

Run:

```powershell
npm test -- tests/dashboard-layout.test.ts
```

Expected: FAIL. Dashboard still uses `dashboardBodyId`, `class:expanded`, `aria-pressed`, and `max-height: 18rem`.

- [ ] **Step 3: Update Dashboard script**

In `src/webview/layouts/DashboardLayout.svelte`, replace the script block with:

```svelte
<script lang="ts">
  import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC }: { model: DocumentModel; showTOC: boolean } = $props();
  let expanded = $state<Record<string, boolean>>({});
  let taskPercent = $derived(
    model.stats.taskCount > 0 ? Math.round((model.stats.completedTaskCount / model.stats.taskCount) * 100) : null,
  );

  function toggleSection(sectionKey: string) {
    expanded[sectionKey] = !expanded[sectionKey];
  }
</script>
```

- [ ] **Step 4: Update Dashboard card markup**

In `src/webview/layouts/DashboardLayout.svelte`, replace the card inside `{#each model.sections as section (section.key)}` with:

```svelte
      <article
        class="dashboard-card lc-card balanced-card balanced-card--preview"
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
        >
          {@html section.html}
        </div>
        <button
          class="balanced-card__toggle"
          type="button"
          aria-expanded={expanded[section.key] ? 'true' : 'false'}
          aria-controls={balancedCardBodyId('dashboard', section.key)}
          onclick={() => toggleSection(section.key)}
        >
          {balancedCardToggleLabel(Boolean(expanded[section.key]))}
        </button>
      </article>
```

- [ ] **Step 5: Update Dashboard styles**

In `src/webview/layouts/DashboardLayout.svelte`, make these style changes:

```css
  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--balanced-card-min-width), 1fr));
    gap: var(--space-section-md);
    align-items: stretch;
  }

  .dashboard-card {
    min-width: 0;
  }

  .dashboard-card__header {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    width: 100%;
    min-height: 4rem;
    padding: var(--space-4) var(--space-6);
    border-bottom: 1px solid var(--md-border);
    color: var(--md-fg-primary);
    background: color-mix(in srgb, var(--md-bg-tertiary) 58%, transparent);
  }

  .dashboard-card__body {
    padding: var(--space-4) var(--space-6) 0;
  }
```

Remove these old Dashboard rules:

```css
  .dashboard-card__header {
    all: unset;
    cursor: pointer;
  }

  .dashboard-card__header:hover,
  .dashboard-card__header:focus-visible {
    background: color-mix(in srgb, var(--md-accent) 12%, var(--md-bg-tertiary) 88%);
  }

  .dashboard-card__body {
    max-height: 18rem;
    overflow: auto;
    transition: max-height 0.2s ease;
  }

  .dashboard-card.expanded .dashboard-card__body {
    max-height: none;
    overflow: visible;
  }
```

Keep the existing table/pre rules, and keep the mobile padding rule for `.dashboard-card__body`.

- [ ] **Step 6: Run Dashboard test to verify pass**

Run:

```powershell
npm test -- tests/dashboard-layout.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Dashboard changes**

```powershell
git add tests/dashboard-layout.test.ts src/webview/layouts/DashboardLayout.svelte
git commit -m @'
feat: balance dashboard section cards

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
'@
```

---

### Task 4: Docs balanced cards

**Files:**
- Modify: `tests/docs-layout.test.ts`
- Modify: `src/webview/layouts/DocsLayout.svelte`

- [ ] **Step 1: Write failing Docs test assertions**

Update `tests/docs-layout.test.ts` first test expectations:

```ts
    expect(source).toContain("import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';");
    expect(source).toContain('let expanded = $state<Record<string, boolean>>({});');
    expect(source).toContain('function toggleSection(sectionKey: string)');
    expect(source).toContain('class="docs-section lc-card balanced-card balanced-card--preview"');
    expect(source).toContain('class:balanced-card--expanded={expanded[section.key]}');
    expect(source).toContain("balancedCardBodyId('docs', section.key)");
    expect(source).toContain('class="docs-section__body balanced-card__body markdown-body"');
    expect(source).toContain('class="balanced-card__toggle"');
    expect(source).toContain('aria-expanded={expanded[section.key] ?');
    expect(source).toContain('balancedCardToggleLabel(Boolean(expanded[section.key]))');
    expect(source).not.toContain('class="docs-section lc-card markdown-body"');
```

Update tokenized style expectations:

```ts
    expect(source).toContain('.docs-section__body {');
    expect(source).toContain('padding: var(--space-section-sm);');
    expect(source).toContain(':global(.docs-section__body > :first-child)');
    expect(source).toContain(':global(.docs-section__body pre)');
```

- [ ] **Step 2: Run Docs test to verify failure**

Run:

```powershell
npm test -- tests/docs-layout.test.ts
```

Expected: FAIL. Docs has no balanced-card helper, state, toggle, or body wrapper.

- [ ] **Step 3: Update Docs script**

In `src/webview/layouts/DocsLayout.svelte`, replace the script block with:

```svelte
<script lang="ts">
  import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC = true }: { model: DocumentModel; showTOC?: boolean } = $props();
  let hasSidebar = $derived(showTOC && model.sections.length > 1);
  let expanded = $state<Record<string, boolean>>({});

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

- [ ] **Step 4: Update Docs section markup**

Replace each Docs section markup with:

```svelte
        <section
          class="docs-section lc-card balanced-card balanced-card--preview"
          class:balanced-card--expanded={expanded[section.key]}
          data-section-key={section.key}
          data-section-id={section.id}
          data-reveal
          data-source-line={section.sourceLine}
        >
          <div
            id={balancedCardBodyId('docs', section.key)}
            class="docs-section__body balanced-card__body markdown-body"
          >
            {@html section.html}
          </div>
          <button
            class="balanced-card__toggle"
            type="button"
            aria-expanded={expanded[section.key] ? 'true' : 'false'}
            aria-controls={balancedCardBodyId('docs', section.key)}
            onclick={() => toggleSection(section.key)}
          >
            {balancedCardToggleLabel(Boolean(expanded[section.key]))}
          </button>
        </section>
```

- [ ] **Step 5: Update Docs styles**

Replace the existing `.docs-section` block and its section-content global selectors with:

```css
  .docs-section {
    min-width: 0;
  }

  .docs-section__body {
    padding: var(--space-section-sm);
    overflow-wrap: break-word;
  }

  :global(.docs-section__body > :first-child) {
    margin-top: 0;
  }

  :global(.docs-section__body > :last-child) {
    margin-bottom: 0;
  }

  :global(.docs-section__body h2:first-child),
  :global(.docs-section__body h3:first-child),
  :global(.docs-section__body h4:first-child) {
    color: var(--md-fg-primary);
    font-size: var(--text-xl);
    line-height: 1.3;
    letter-spacing: 0;
  }

  :global(.docs-section__body blockquote) {
    margin: var(--space-6) 0;
    padding: var(--space-4);
    border-left: 4px solid var(--md-accent);
    border-radius: var(--radius-md);
    color: var(--md-fg-primary);
    background: color-mix(in srgb, var(--md-accent) 9%, var(--md-bg-tertiary) 91%);
    font-size: var(--text-base);
  }

  :global(.docs-section__body pre) {
    margin: var(--space-6) 0;
    padding: var(--space-4);
    overflow: auto;
    border: 1px solid color-mix(in srgb, var(--md-border) 78%, var(--md-accent) 22%);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--md-bg-primary) 82%, black 18%);
  }

  :global(.docs-section__body code) {
    font-size: var(--text-sm);
  }

  :global(.docs-section__body table) {
    display: block;
    width: 100%;
    overflow-x: auto;
  }
```

In the `@media (max-width: 560px)` block, change `.docs-section` to `.docs-section__body`:

```css
    .docs-header,
    .docs-section__body {
      padding: var(--space-4);
    }
```

- [ ] **Step 6: Run Docs test to verify pass**

Run:

```powershell
npm test -- tests/docs-layout.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Docs changes**

```powershell
git add tests/docs-layout.test.ts src/webview/layouts/DocsLayout.svelte
git commit -m @'
feat: balance docs section cards

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
'@
```

---

### Task 5: Magazine balanced cards

**Files:**
- Modify: `tests/magazine-layout.test.ts`
- Modify: `src/webview/layouts/MagazineLayout.svelte`

- [ ] **Step 1: Write failing Magazine test assertions**

Update `tests/magazine-layout.test.ts` first test expectations:

```ts
    expect(source).toContain("import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';");
    expect(source).toContain('let expanded = $state<Record<string, boolean>>({});');
    expect(source).toContain('function toggleSection(sectionKey: string)');
    expect(source).toContain('class="magazine-section lc-card balanced-card balanced-card--preview"');
    expect(source).toContain('class:balanced-card--expanded={expanded[section.key]}');
    expect(source).toContain("balancedCardBodyId('magazine', section.key)");
    expect(source).toContain('class="magazine-section__body balanced-card__body markdown-body"');
    expect(source).toContain('class="balanced-card__toggle"');
    expect(source).toContain('aria-expanded={expanded[section.key] ?');
    expect(source).toContain('balancedCardToggleLabel(Boolean(expanded[section.key]))');
    expect(source).not.toContain('class="magazine-section lc-card markdown-body"');
```

Update style expectations:

```ts
    expect(source).toContain('.magazine-section__body {');
    expect(source).toContain('padding: var(--space-section-sm);');
    expect(source).toContain(':global(.magazine-section__body img)');
    expect(source).toContain(':global(.magazine-section__body table)');
```

- [ ] **Step 2: Run Magazine test to verify failure**

Run:

```powershell
npm test -- tests/magazine-layout.test.ts
```

Expected: FAIL. Magazine has no balanced-card helper, state, toggle, or body wrapper.

- [ ] **Step 3: Update Magazine script**

In `src/webview/layouts/MagazineLayout.svelte`, replace the script block with:

```svelte
<script lang="ts">
  import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC = true }: { model: DocumentModel; showTOC?: boolean } = $props();
  let expanded = $state<Record<string, boolean>>({});

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

- [ ] **Step 4: Update Magazine section markup**

Replace each Magazine section markup with:

```svelte
        <section
          class="magazine-section lc-card balanced-card balanced-card--preview"
          class:balanced-card--expanded={expanded[section.key]}
          data-section-key={section.key}
          data-section-id={section.id}
          data-reveal
          data-source-line={section.sourceLine}
        >
          <div
            id={balancedCardBodyId('magazine', section.key)}
            class="magazine-section__body balanced-card__body markdown-body"
          >
            {@html section.html}
          </div>
          <button
            class="balanced-card__toggle"
            type="button"
            aria-expanded={expanded[section.key] ? 'true' : 'false'}
            aria-controls={balancedCardBodyId('magazine', section.key)}
            onclick={() => toggleSection(section.key)}
          >
            {balancedCardToggleLabel(Boolean(expanded[section.key]))}
          </button>
        </section>
```

- [ ] **Step 5: Update Magazine styles**

Replace `.magazine-section` and its global content selectors with:

```css
  .magazine-section {
    min-width: 0;
  }

  .magazine-section__body {
    padding: var(--space-section-sm);
    overflow-wrap: break-word;
  }

  :global(.magazine-section__body > :first-child) {
    margin-top: 0;
  }

  :global(.magazine-section__body > :last-child) {
    margin-bottom: 0;
  }

  :global(.magazine-section__body h2:first-child),
  :global(.magazine-section__body h3:first-child) {
    color: var(--md-fg-primary);
    font-size: var(--text-2xl);
    line-height: 1.2;
    letter-spacing: 0;
  }

  :global(.magazine-section__body blockquote) {
    margin: var(--space-6) 0;
    padding: var(--space-4) var(--space-6);
    border-left: 4px solid var(--md-accent);
    border-radius: var(--radius-md);
    color: var(--md-fg-primary);
    background: color-mix(in srgb, var(--md-accent) 10%, var(--md-bg-tertiary) 90%);
    font-size: var(--text-base);
  }

  :global(.magazine-section__body img) {
    display: block;
    width: 100%;
    max-height: 34rem;
    object-fit: cover;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  :global(.magazine-section__body figure),
  :global(.magazine-section__body table),
  :global(.magazine-section__body pre) {
    margin: var(--space-6) 0;
  }

  :global(.magazine-section__body table) {
    display: block;
    width: 100%;
    overflow-x: auto;
    border-radius: var(--radius-md);
  }
```

In `@media (max-width: 560px)`, change `.magazine-section` to `.magazine-section__body`:

```css
    .magazine-hero,
    .magazine-section__body {
      padding: var(--space-4);
    }
```

- [ ] **Step 6: Run Magazine test to verify pass**

Run:

```powershell
npm test -- tests/magazine-layout.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Magazine changes**

```powershell
git add tests/magazine-layout.test.ts src/webview/layouts/MagazineLayout.svelte
git commit -m @'
feat: balance magazine section cards

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
'@
```

---

### Task 6: Story balanced cards

**Files:**
- Modify: `tests/story-layout.test.ts`
- Modify: `src/webview/layouts/StoryLayout.svelte`

- [ ] **Step 1: Write failing Story test assertions**

Update `tests/story-layout.test.ts` first test expectations:

```ts
    expect(source).toContain("import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';");
    expect(source).toContain('let expanded = $state<Record<string, boolean>>({});');
    expect(source).toContain('function toggleSection(sectionKey: string)');
    expect(source).toContain('class="story-section__content lc-card balanced-card balanced-card--preview"');
    expect(source).toContain('class:balanced-card--expanded={expanded[section.key]}');
    expect(source).toContain("balancedCardBodyId('story', section.key)");
    expect(source).toContain('class="story-section__body balanced-card__body markdown-body"');
    expect(source).toContain('class="balanced-card__toggle"');
    expect(source).toContain('aria-expanded={expanded[section.key] ?');
    expect(source).toContain('balancedCardToggleLabel(Boolean(expanded[section.key]))');
    expect(source).not.toContain('class="story-section__content markdown-body lc-card"');
```

Update style expectations:

```ts
    expect(source).toContain('.story-section__body {');
    expect(source).toContain('padding: var(--space-section-sm);');
    expect(source).toContain(':global(.story-section__body h1)');
    expect(source).toContain(':global(.story-section__body img)');
```

- [ ] **Step 2: Run Story test to verify failure**

Run:

```powershell
npm test -- tests/story-layout.test.ts
```

Expected: FAIL. Story content still puts `markdown-body` directly on `.story-section__content` and has no toggle.

- [ ] **Step 3: Update Story script**

In `src/webview/layouts/StoryLayout.svelte`, replace the script block with:

```svelte
<script lang="ts">
  import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC }: { model: DocumentModel; showTOC: boolean } = $props();
  let hasDots = $derived(showTOC && model.sections.length > 1);
  let expanded = $state<Record<string, boolean>>({});

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

- [ ] **Step 4: Update Story content card markup**

Replace the `.story-section__content` block with:

```svelte
        <div
          class="story-section__content lc-card balanced-card balanced-card--preview"
          class:balanced-card--expanded={expanded[section.key]}
        >
          <div
            id={balancedCardBodyId('story', section.key)}
            class="story-section__body balanced-card__body markdown-body"
          >
            {@html section.html}
          </div>
          <button
            class="balanced-card__toggle"
            type="button"
            aria-expanded={expanded[section.key] ? 'true' : 'false'}
            aria-controls={balancedCardBodyId('story', section.key)}
            onclick={() => toggleSection(section.key)}
          >
            {balancedCardToggleLabel(Boolean(expanded[section.key]))}
          </button>
        </div>
```

Keep `data-section-key`, `data-section-id`, `data-reveal`, and `data-source-line` on the outer `.story-section` wrapper.

- [ ] **Step 5: Update Story styles**

Replace `.story-section__content` content styles and global selectors with:

```css
  .story-section__content {
    min-width: 0;
  }

  .story-section__body {
    padding: var(--space-section-sm);
    overflow-wrap: break-word;
  }

  :global(.story-section__body > :first-child) {
    margin-top: 0;
  }

  :global(.story-section__body > :last-child) {
    margin-bottom: 0;
  }

  :global(.story-section__body h1),
  :global(.story-section__body h2) {
    margin-bottom: var(--space-4);
    color: var(--md-fg-primary);
    font-size: var(--text-hero);
    line-height: 0.98;
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }

  :global(.story-section__body p) {
    font-size: var(--text-lg);
    line-height: 1.6;
  }

  :global(.story-section__body blockquote) {
    margin: var(--space-6) 0;
    padding: var(--space-4) var(--space-6);
    border-left: 4px solid var(--md-accent);
    border-radius: var(--radius-md);
    color: var(--md-fg-primary);
    background: color-mix(in srgb, var(--md-accent) 10%, var(--md-bg-tertiary) 90%);
    font-size: var(--text-base);
  }

  :global(.story-section__body img) {
    display: block;
    width: 100%;
    max-height: 34rem;
    object-fit: cover;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  :global(.story-section__body hr) {
    display: none;
  }
```

In the mobile block, replace `.story-section__content` padding with `.story-section__body` padding:

```css
    .story-section__body {
      padding: var(--space-4);
    }
```

- [ ] **Step 6: Run Story test to verify pass**

Run:

```powershell
npm test -- tests/story-layout.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Story changes**

```powershell
git add tests/story-layout.test.ts src/webview/layouts/StoryLayout.svelte
git commit -m @'
feat: balance story section cards

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
'@
```

---

### Task 7: Full verification and manual check

**Files:**
- Modify only if tests reveal a concrete mismatch in files already changed above.

- [ ] **Step 1: Run all tests**

Run:

```powershell
npm test
```

Expected: PASS for all Vitest suites.

- [ ] **Step 2: Run production build**

Run:

```powershell
npm run build
```

Expected: PASS. Extension bundle emits to `dist/extension/extension.js`; webview bundle emits via Vite without Svelte/TypeScript errors.

- [ ] **Step 3: Manual extension-host verification**

Open this workspace in VS Code, press `F5` to launch Extension Development Host, then open a markdown file with short and long sections. Verify:

```markdown
# Balanced Card Check

## Short
One line.

## Medium
- One
- Two
- Three

## Long
Paragraph one with enough text to make the card body scroll. Paragraph one with enough text to make the card body scroll. Paragraph one with enough text to make the card body scroll.

Paragraph two with enough text to make the card body scroll. Paragraph two with enough text to make the card body scroll. Paragraph two with enough text to make the card body scroll.

```ts
export function example() {
  return 'code block stays scroll-safe';
}
```

| A | B | C | D | E |
|---|---|---|---|---|
| 1 | 2 | 3 | 4 | 5 |
```

Check all layout toolbar modes:
- Docs: section cards share preview height; sidebar still scrolls to cards.
- Magazine: section cards share preview height; rail still scrolls to cards.
- Story: section numbers and dots still work; content card balances short/long sections.
- Dashboard: section grid columns are consistent; stats/header unchanged.

For each layout, click `Show more`, then `Show less`. Expected: card body expands/collapses, `aria-expanded` changes, tables/code remain usable.

- [ ] **Step 4: Commit final verification fixes**

If Step 1 or Step 2 required code changes, commit those exact files:

```powershell
git add <changed-files>
git commit -m @'
fix: stabilize balanced card verification

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
'@
```

If no files changed, skip this commit.

---

## Self-Review

- Spec coverage: shared CSS tokens/classes, local expansion state, all four layouts, scrollable previews, mobile relaxation, accessibility attributes, tests, build, and manual UI check are covered.
- Placeholder scan: no placeholder tasks or deferred implementation text remain.
- Type consistency: helper exports `BalancedCardLayout`, `balancedCardBodyId`, and `balancedCardToggleLabel`; all layout imports use those exact names.
