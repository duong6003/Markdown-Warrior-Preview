# Article Layout Consolidation & Ghost Nav Affordance — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the `docs` layout, rename `magazine` → `article`, and add a gradient strip affordance to GhostNav.

**Architecture:** Three atomic groups: (1) update the type system and detection engine, (2) rename/consolidate the layout component with new tests, (3) add the gradient strip to GhostNav. Each group ends with a green test suite and a commit.

**Tech Stack:** Svelte 5, TypeScript, Vitest (source-text `readFileSync + toContain` pattern), esbuild/Vite

---

## File map

| File | Action |
|---|---|
| `src/webview/types/layout.ts` | Modify — change `LAYOUT_TYPES` |
| `src/webview/lib/layout-engine.ts` | Modify — `LAYOUT_PRIORITY`, score keys |
| `tests/layout-engine.test.ts` | Modify — rename/remove docs assertions |
| `src/webview/layouts/ArticleLayout.svelte` | Create — renamed/updated MagazineLayout |
| `src/webview/layouts/MagazineLayout.svelte` | Delete |
| `src/webview/layouts/DocsLayout.svelte` | Delete |
| `tests/article-layout.test.ts` | Create — article-* assertions |
| `tests/magazine-layout.test.ts` | Delete |
| `tests/docs-layout.test.ts` | Delete |
| `src/webview/App.svelte` | Modify — imports + render branch |
| `src/webview/components/LayoutToolbar.svelte` | Modify — remove docs, rename magazine→article |
| `src/webview/styles/layouts.css` | Modify — remove dead hover selectors |
| `tests/layout-styles.test.ts` | Modify — remove two dead assertions |
| `src/webview/lib/GhostNav.svelte` | Modify — add ghost strip element + CSS |
| `tests/ghost-nav.test.ts` | Modify — add strip assertions |

---

## Task 1: Update layout-engine test to expect `article`

**Files:**
- Modify: `tests/layout-engine.test.ts`

- [ ] **Step 1: Update the test — rename magazine→article, remove docs detection test, fix frontmatter test**

  In `tests/layout-engine.test.ts`, apply these three changes:

  **Change 1** — rename the first test and its assertion:
  ```typescript
  // OLD:
  it('falls back to magazine for article-like content', () => {
      const model = createDocumentModel(articleHtml, null);
      expect(model.detectedLayout).toBe('magazine');

  // NEW:
  it('falls back to article for article-like content', () => {
      const model = createDocumentModel(articleHtml, null);
      expect(model.detectedLayout).toBe('article');
  ```

  **Change 2** — delete the entire `'detects docs layout from deep headings and code blocks'` test block (lines 131–148 in the file as of this writing).

  **Change 3** — update the frontmatter test. Old content:
  ```typescript
  it('uses valid frontmatter layout before auto detection', () => {
      const model = createDocumentModel(articleHtml, { layout: 'docs' });

      expect(model.detectedLayout).toBe('magazine');
      expect(resolveLayout(model.detectedLayout, { layout: 'docs' }, 'auto')).toBe('docs');
  ```
  New content (use `'story'` — a still-valid layout — to test that frontmatter wins):
  ```typescript
  it('uses valid frontmatter layout before auto detection', () => {
      const model = createDocumentModel(articleHtml, { layout: 'story' });

      expect(model.detectedLayout).toBe('article');
      expect(resolveLayout(model.detectedLayout, { layout: 'story' }, 'auto')).toBe('story');
  ```

- [ ] **Step 2: Run the failing tests**

  ```powershell
  npm test -- tests/layout-engine.test.ts
  ```

  Expected: FAIL — "received 'magazine', expected 'article'" (the implementation hasn't changed yet).

---

## Task 2: Update the type system and detection engine

**Files:**
- Modify: `src/webview/types/layout.ts`
- Modify: `src/webview/lib/layout-engine.ts`

- [ ] **Step 1: Update `LAYOUT_TYPES` in `src/webview/types/layout.ts`**

  Change line 1:
  ```typescript
  // OLD:
  export const LAYOUT_TYPES = ['magazine', 'docs', 'story', 'dashboard'] as const;

  // NEW:
  export const LAYOUT_TYPES = ['article', 'story', 'dashboard'] as const;
  ```

  `LayoutType` and `LayoutOverride` derive from this — no other changes needed in this file.

- [ ] **Step 2: Update `LAYOUT_PRIORITY` in `src/webview/lib/layout-engine.ts`**

  Change line 14:
  ```typescript
  // OLD:
  const LAYOUT_PRIORITY: LayoutType[] = ['story', 'dashboard', 'docs', 'magazine'];

  // NEW:
  const LAYOUT_PRIORITY: LayoutType[] = ['story', 'dashboard'];
  ```

- [ ] **Step 3: Update `detectLayout` scores map in `src/webview/lib/layout-engine.ts`**

  Replace the `scores` object and the default `best` below it (lines 108–132):
  ```typescript
  // OLD:
  const scores: Record<LayoutType, number> = {
      story:
        signals.hrCount * 5 +
        signals.shortSectionCount * 2 +
        (signals.sectionCount >= 4 ? 2 : 0),
      dashboard:
        signals.tableCount * 5 +
        signals.taskCount * 4 +
        signals.listCount * 2 +
        Math.min(signals.numberCount, 6),
      docs:
        signals.codeBlockCount * 4 +
        signals.h3PlusCount * 2 +
        signals.listCount +
        (signals.headingCount >= 5 ? 2 : 0),
      magazine:
        signals.paragraphCount + signals.imageCount * 2 + signals.blockquoteCount + 2,
  };

  let best: LayoutType = 'magazine';
  let bestScore = scores.magazine;

  // NEW:
  const scores: Record<LayoutType, number> = {
      story:
        signals.hrCount * 5 +
        signals.shortSectionCount * 2 +
        (signals.sectionCount >= 4 ? 2 : 0),
      dashboard:
        signals.tableCount * 5 +
        signals.taskCount * 4 +
        signals.listCount * 2 +
        Math.min(signals.numberCount, 6),
      article:
        signals.paragraphCount + signals.imageCount * 2 + signals.blockquoteCount + 2,
  };

  let best: LayoutType = 'article';
  let bestScore = scores.article;
  ```

- [ ] **Step 4: Run tests and confirm green**

  ```powershell
  npm test -- tests/layout-engine.test.ts
  ```

  Expected: all tests in that file PASS.

- [ ] **Step 5: Commit**

  ```powershell
  git -c safe.directory='C:/Users/PC/Desktop/extention markdown' add tests/layout-engine.test.ts src/webview/types/layout.ts src/webview/lib/layout-engine.ts
  git -c safe.directory='C:/Users/PC/Desktop/extention markdown' commit -m "Remove docs layout type, rename magazine to article in engine"
  ```

---

## Task 3: Write failing article-layout test

**Files:**
- Create: `tests/article-layout.test.ts`

- [ ] **Step 1: Create `tests/article-layout.test.ts`**

  ```typescript
  import { readFileSync } from 'node:fs';
  import { compile } from 'svelte/compiler';

  const source = readFileSync('src/webview/layouts/ArticleLayout.svelte', 'utf8');

  describe('ArticleLayout rich shell', () => {
    it('renders the required rich article structure from document sections', () => {
      compile(source, { filename: 'ArticleLayout.svelte', generate: 'client' });

      expect(source).toContain("import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';");
      expect(source).toContain("import { clipDetect } from '../lib/clip-detect';");
      expect(source).toContain('let expanded = $state<Record<string, boolean>>({});');
      expect(source).toContain('let needsClip = $state<Record<string, boolean>>({});');
      expect(source).toContain('function toggleSection(sectionKey: string)');
      expect(source).toContain('data-layout="article"');
      expect(source).toContain('class="article-layout rich-layout"');
      expect(source).toContain('class="article-hero lc-card--hero"');
      expect(source).toContain('>Article<');
      expect(source).not.toContain('Markdown Warrior');
      expect(source).toContain('{model.title}');
      expect(source).toContain('model.description');
      expect(source).toContain('<article class="article-content">');
      expect(source).not.toContain('<main class="article-content">');
      expect(source).toContain('{#each model.sections as section (section.key)}');
      expect(source).not.toContain('{#each model.sections as section (section.id)}');
      expect(source).toContain('class="article-section lc-card balanced-card"');
      expect(source).not.toContain('balanced-card--preview');
      expect(source).toContain('class:balanced-card--clippable={needsClip[section.key]}');
      expect(source).toContain('class:balanced-card--expanded={expanded[section.key]}');
      expect(source).toContain("balancedCardBodyId('article', section.key)");
      expect(source).toContain('class="article-section__body balanced-card__body markdown-body"');
      expect(source).toContain('use:clipDetect=');
      expect(source).toContain('needsClip[section.key] = needs');
      expect(source).toContain('{#if needsClip[section.key]}');
      expect(source).toContain('class="balanced-card__toggle"');
      expect(source).toContain('aria-expanded={expanded[section.key] ?');
      expect(source).toContain('aria-controls={balancedCardBodyId(');
      expect(source).toContain('onclick={() => toggleSection(section.key)}');
      expect(source).toContain('balancedCardToggleLabel(Boolean(expanded[section.key]))');
      expect(source).toContain('data-section-key={section.key}');
      expect(source).toContain('data-section-id={section.id}');
      expect(source).not.toMatch(/\s+id=\{section\.id\}/);
      expect(source).toContain('data-source-line={section.sourceLine}');
      expect(source).toContain('{@html section.html}');
      expect(source).not.toContain('layout-card');
    });

    it('uses GhostNav for section navigation', () => {
      expect(source).toContain('function scrollToSection(sectionKey: string, sectionId: string)');
      expect(source).toContain('document.getElementById(sectionId)');
      expect(source).toContain('document.querySelector');
      expect(source).toContain('[data-section-key="');
      expect(source).toContain('CSS.escape');
      expect(source.indexOf('[data-section-key="')).toBeLessThan(
        source.indexOf('document.getElementById(sectionId)'),
      );
      expect(source).toContain("scrollIntoView({ behavior: 'smooth', block: 'start' })");
      expect(source).toContain("import GhostNav from '../lib/GhostNav.svelte'");
      expect(source).toContain('<GhostNav sections={model.sections}');
      expect(source).toContain('onNavigate={scrollToSection}');
      expect(source).not.toContain('class="article-rail');
      expect(source).not.toContain('{#if showTOC && model.sections.length > 1}');
      expect(source).not.toMatch(/\{#if\s+[^}]*showTOC/);
    });

    it('uses tokenized article hero and section proportions', () => {
      expect(source).toContain('gap: var(--space-section-md);');
      expect(source).toContain('padding: var(--space-section-xl);');
      expect(source).toContain('font: 800 var(--text-hero) / 0.98 var(--md-font-heading, var(--md-font-body));');
      expect(source).toContain('font-size: var(--text-lg);');
      expect(source).toContain('font: 700 var(--text-xs) / 1.4 var(--md-font-body);');
      expect(source).toContain('.article-section__body {');
      expect(source).toContain('padding: var(--space-section-sm);');
      expect(source).toContain(':global(.article-section__body img)');
      expect(source).toContain(':global(.article-section__body table)');
      expect(source).toContain('font-size: var(--text-2xl);');
      expect(source).toContain('border-radius: var(--radius-md);');
      expect(source).not.toContain('--layout-');
      expect(source).not.toContain('font: 800 5rem/0.95');
      expect(source).not.toContain('translateX(3px)');
      expect(source).not.toContain('grid-template-columns: minmax(0, 1fr) clamp(14rem, 24%, 18rem);');
    });
  });
  ```

- [ ] **Step 2: Run the failing test**

  ```powershell
  npm test -- tests/article-layout.test.ts
  ```

  Expected: FAIL — "no such file: src/webview/layouts/ArticleLayout.svelte".

---

## Task 4: Create ArticleLayout.svelte

**Files:**
- Create: `src/webview/layouts/ArticleLayout.svelte`

- [ ] **Step 1: Create `src/webview/layouts/ArticleLayout.svelte`**

  This is `MagazineLayout.svelte` with all `magazine` references renamed to `article` and the kicker text changed from `"Markdown Warrior"` to `"Article"`:

  ```svelte
  <script lang="ts">
    import { balancedCardBodyId, balancedCardToggleLabel } from '../lib/balanced-card';
    import { clipDetect } from '../lib/clip-detect';
    import GhostNav from '../lib/GhostNav.svelte';
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

  <div class="article-layout rich-layout" data-layout="article">
    <GhostNav sections={model.sections} onNavigate={scrollToSection} />

    <header class="article-hero lc-card--hero" data-reveal>
      <p class="article-kicker">Article</p>
      <h1>{model.title}</h1>
      {#if model.description}
        <p class="article-description">{model.description}</p>
      {/if}
    </header>

    <article class="article-content">
      {#each model.sections as section (section.key)}
        <section
          class="article-section lc-card balanced-card"
          class:balanced-card--clippable={needsClip[section.key]}
          class:balanced-card--expanded={expanded[section.key]}
          data-section-key={section.key}
          data-section-id={section.id}
          data-reveal
          data-source-line={section.sourceLine}
        >
          <div
            id={balancedCardBodyId('article', section.key)}
            class="article-section__body balanced-card__body markdown-body"
            use:clipDetect={(needs: boolean) => { needsClip[section.key] = needs; }}
          >
            {@html section.html}
          </div>
          {#if needsClip[section.key]}
            <button
              class="balanced-card__toggle"
              type="button"
              aria-expanded={expanded[section.key] ? 'true' : 'false'}
              aria-controls={balancedCardBodyId('article', section.key)}
              onclick={() => toggleSection(section.key)}
            >
              {balancedCardToggleLabel(Boolean(expanded[section.key]))}
            </button>
          {/if}
        </section>
      {/each}
    </article>
  </div>

  <style>
    .article-layout {
      display: grid;
      gap: var(--space-section-md);
    }

    .article-hero {
      padding: var(--space-section-xl);
    }

    .article-hero::after {
      content: '';
      position: absolute;
      inset: auto var(--space-section-lg) var(--space-section-sm) auto;
      width: clamp(5rem, 18vw, 13rem);
      height: 2px;
      background: var(--md-accent);
      opacity: 0.75;
    }

    .article-kicker {
      margin: 0 0 var(--space-3);
      color: var(--md-accent);
      font: 700 var(--text-xs) / 1.4 var(--md-font-body);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .article-hero h1 {
      max-width: 13ch;
      margin: 0;
      color: var(--md-fg-primary);
      font: 800 var(--text-hero) / 0.98 var(--md-font-heading, var(--md-font-body));
      letter-spacing: 0;
      overflow-wrap: anywhere;
    }

    .article-description {
      max-width: 60ch;
      margin: var(--space-6) 0 0;
      color: var(--md-fg-secondary);
      font-size: var(--text-lg);
      line-height: 1.4;
    }

    .article-content {
      display: grid;
      gap: var(--space-section-md);
      min-width: 0;
    }

    .article-section {
      min-width: 0;
    }

    .article-section__body {
      padding: var(--space-section-sm);
      overflow-wrap: break-word;
    }

    :global(.article-section__body > :first-child) {
      margin-top: 0;
    }

    :global(.article-section__body > :last-child) {
      margin-bottom: 0;
    }

    :global(.article-section__body h2:first-child),
    :global(.article-section__body h3:first-child) {
      color: var(--md-fg-primary);
      font-size: var(--text-2xl);
      line-height: 1.2;
      letter-spacing: 0;
    }

    :global(.article-section__body blockquote) {
      margin: var(--space-6) 0;
      padding: var(--space-4) var(--space-6);
      border-left: 4px solid var(--md-accent);
      border-radius: var(--radius-md);
      color: var(--md-fg-primary);
      background: color-mix(in srgb, var(--md-accent) 10%, var(--md-bg-tertiary) 90%);
      font-size: var(--text-base);
    }

    :global(.article-section__body img) {
      display: block;
      width: 100%;
      max-height: 34rem;
      object-fit: cover;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
    }

    :global(.article-section__body figure),
    :global(.article-section__body table),
    :global(.article-section__body pre) {
      margin: var(--space-6) 0;
    }

    :global(.article-section__body table) {
      display: block;
      width: 100%;
      overflow-x: auto;
      border-radius: var(--radius-md);
    }

    @media (max-width: 560px) {
      .article-hero,
      .article-section__body {
        padding: var(--space-4);
      }

      .article-hero::after {
        display: none;
      }
    }
  </style>
  ```

- [ ] **Step 2: Run the test to confirm it passes**

  ```powershell
  npm test -- tests/article-layout.test.ts
  ```

  Expected: all 3 tests PASS.

- [ ] **Step 3: Commit**

  ```powershell
  git -c safe.directory='C:/Users/PC/Desktop/extention markdown' add tests/article-layout.test.ts src/webview/layouts/ArticleLayout.svelte
  git -c safe.directory='C:/Users/PC/Desktop/extention markdown' commit -m "Add ArticleLayout replacing MagazineLayout"
  ```

---

## Task 5: Update App.svelte and LayoutToolbar.svelte

**Files:**
- Modify: `src/webview/App.svelte`
- Modify: `src/webview/components/LayoutToolbar.svelte`

- [ ] **Step 1: Update imports and render branch in `src/webview/App.svelte`**

  Replace the two layout import lines (lines 16–17):
  ```typescript
  // OLD:
  import MagazineLayout from './layouts/MagazineLayout.svelte';
  import DocsLayout from './layouts/DocsLayout.svelte';

  // NEW:
  import ArticleLayout from './layouts/ArticleLayout.svelte';
  ```

  Replace the layout render block (lines 180–188):
  ```svelte
  <!-- OLD: -->
  {#if selectedLayout === 'magazine'}
    <MagazineLayout {model} {showTOC} />
  {:else if selectedLayout === 'docs'}
    <DocsLayout {model} {showTOC} />
  {:else if selectedLayout === 'story'}
    <StoryLayout {model} {showTOC} />
  {:else}
    <DashboardLayout {model} {showTOC} />
  {/if}

  <!-- NEW: -->
  {#if selectedLayout === 'article'}
    <ArticleLayout {model} {showTOC} />
  {:else if selectedLayout === 'story'}
    <StoryLayout {model} {showTOC} />
  {:else}
    <DashboardLayout {model} {showTOC} />
  {/if}
  ```

- [ ] **Step 2: Update labels and options in `src/webview/components/LayoutToolbar.svelte`**

  Replace the entire `labels` and `options` definitions (lines 4–17):
  ```typescript
  // OLD:
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

  // NEW:
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
  ```

- [ ] **Step 3: Run the full test suite**

  ```powershell
  npm test
  ```

  Expected: all previously passing tests still pass (no test files cover App.svelte or LayoutToolbar.svelte directly).

- [ ] **Step 4: Commit**

  ```powershell
  git -c safe.directory='C:/Users/PC/Desktop/extention markdown' add src/webview/App.svelte src/webview/components/LayoutToolbar.svelte
  git -c safe.directory='C:/Users/PC/Desktop/extention markdown' commit -m "Wire ArticleLayout into App and LayoutToolbar"
  ```

---

## Task 6: CSS cleanup and delete dead files

**Files:**
- Modify: `src/webview/styles/layouts.css`
- Modify: `tests/layout-styles.test.ts`
- Delete: `src/webview/layouts/DocsLayout.svelte`
- Delete: `src/webview/layouts/MagazineLayout.svelte`
- Delete: `tests/docs-layout.test.ts`
- Delete: `tests/magazine-layout.test.ts`

- [ ] **Step 1: Remove the two dead hover selectors from `src/webview/styles/layouts.css`**

  The current hover rule group (lines 287–294) reads:
  ```css
  .docs-sidebar button:hover,
  .docs-sidebar button:focus-visible,
  .magazine-rail button:hover,
  .magazine-rail button:focus-visible {
  ```
  Change to:
  ```css
  .docs-sidebar button:focus-visible,
  .magazine-rail button:focus-visible {
  ```
  (Remove the two `:hover` selector lines. The `:focus-visible` lines and the rule body remain.)

- [ ] **Step 2: Remove the two dead assertions from `tests/layout-styles.test.ts`**

  In the `'centralizes toolbar and layout navigation interaction states'` test, remove these two lines:
  ```typescript
  // Remove:
  expect(source).toContain('.docs-sidebar button:hover,');
  expect(source).toContain('.magazine-rail button:hover,');
  ```

- [ ] **Step 3: Delete the four dead files**

  ```powershell
  Remove-Item 'src/webview/layouts/DocsLayout.svelte'
  Remove-Item 'src/webview/layouts/MagazineLayout.svelte'
  Remove-Item 'tests/docs-layout.test.ts'
  Remove-Item 'tests/magazine-layout.test.ts'
  ```

- [ ] **Step 4: Run the full test suite**

  ```powershell
  npm test
  ```

  Expected: all tests pass. The deleted test files are no longer discovered. The remaining 13 test files all pass.

- [ ] **Step 5: Commit**

  ```powershell
  git -c safe.directory='C:/Users/PC/Desktop/extention markdown' add -A
  git -c safe.directory='C:/Users/PC/Desktop/extention markdown' commit -m "Delete docs/magazine layouts and clean up dead CSS selectors"
  ```

---

## Task 7: Write failing ghost strip test

**Files:**
- Modify: `tests/ghost-nav.test.ts`

- [ ] **Step 1: Add the strip test to `tests/ghost-nav.test.ts`**

  Append a new `it` block at the end of the `describe('GhostNav', ...)` block (before the closing `}`):
  ```typescript
  it('shows a gradient strip affordance at the left edge', () => {
    expect(source).toContain('class="ghost-strip"');
    expect(source).toContain('class:hidden={navVisible}');
    expect(source).toContain('.ghost-strip {');
    expect(source).toContain('width: 3px;');
    expect(source).toContain('linear-gradient(');
    expect(source).toContain('var(--md-accent)');
    expect(source).toContain('opacity: 0.4;');
    expect(source).toContain('.ghost-strip.hidden {');
    expect(source).toContain('opacity: 0;');
    expect(source).toContain('pointer-events: none;');
  });
  ```

- [ ] **Step 2: Run the failing test**

  ```powershell
  npm test -- tests/ghost-nav.test.ts
  ```

  Expected: FAIL on the new test — strip element and CSS not yet present.

---

## Task 8: Add ghost strip to GhostNav.svelte

**Files:**
- Modify: `src/webview/lib/GhostNav.svelte`

- [ ] **Step 1: Add `<div class="ghost-strip">` to the template**

  In the template section of `src/webview/lib/GhostNav.svelte`, the current inner `<div class="ghost-nav">` block reads:
  ```svelte
  <div class="ghost-nav">
    <div
      class="ghost-edge-zone"
  ```
  Change to (add the strip div before the edge zone):
  ```svelte
  <div class="ghost-nav">
    <div class="ghost-strip" class:hidden={navVisible}></div>
    <div
      class="ghost-edge-zone"
  ```

- [ ] **Step 2: Add `.ghost-strip` CSS to the `<style>` block**

  Append this CSS inside the `<style>` block, after the `.ghost-edge-zone` rule and before the `.ghost-nav-panel` rule:
  ```css
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
    opacity: 0.4;
    pointer-events: none;
    transition: opacity 0.15s;
  }

  .ghost-strip.hidden {
    opacity: 0;
  }
  ```

- [ ] **Step 3: Run the test to confirm it passes**

  ```powershell
  npm test -- tests/ghost-nav.test.ts
  ```

  Expected: all 9 tests PASS.

- [ ] **Step 4: Run the full test suite**

  ```powershell
  npm test
  ```

  Expected: all tests pass.

- [ ] **Step 5: Commit**

  ```powershell
  git -c safe.directory='C:/Users/PC/Desktop/extention markdown' add src/webview/lib/GhostNav.svelte tests/ghost-nav.test.ts
  git -c safe.directory='C:/Users/PC/Desktop/extention markdown' commit -m "Add ghost strip affordance to GhostNav left edge"
  ```

---

## Task 9: Final verification and build

- [ ] **Step 1: Run full test suite**

  ```powershell
  npm test
  ```

  Expected output (counts may differ slightly):
  ```
  Test Files  13 passed (13)
  Tests       XX passed (XX)
  ```
  Zero failures, zero skipped.

- [ ] **Step 2: Run the build**

  ```powershell
  npm run build
  ```

  Expected: extension bundle exits 0, Vite webview build exits 0. The existing large-bundle warning for `dist\extension\extension.js` is non-blocking.
