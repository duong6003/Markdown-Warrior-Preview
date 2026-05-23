# Layout Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild all rich layouts around one token-first visual system with balanced spacing, proportional grids, and consistent card/header/nav behavior.

**Architecture:** Shared tokens, card variants, toolbar states, reveal motion, and layout nav interaction states live in `src/webview/styles/layouts.css`. Each Svelte layout consumes those tokens and keeps only structure, layout-specific grid proportions, and content styling. Vitest string/compile tests pin class names, token usage, grid formulas, and removed legacy values.

**Tech Stack:** Svelte 5, scoped Svelte component CSS, global CSS custom properties, Vitest, Vite, VS Code webview.

---

## Scope Check

This spec covers one subsystem: the rich layout visual layer. It touches one shared stylesheet, four layout components, and their layout tests. No extension host, markdown parser, message protocol, theme bridge, or markdown-body changes are part of this plan.

## File Structure

- Create `tests/layout-styles.test.ts` — protects shared layout tokens, card variants, hover behavior, nav transform values, and removal of deprecated `--layout-*` tokens.
- Modify `src/webview/styles/layouts.css` — owns global token system, `.lc-card*` variants, toolbar styling, shared nav interaction states, reveal motion, reduced-motion rules, and `.rich-layout` page rhythm.
- Modify `tests/docs-layout.test.ts` — pins Docs class rename, sidebar/header/card variants, proportional grid, readable content width, and token-based typography.
- Modify `src/webview/layouts/DocsLayout.svelte` — consumes `.lc-card--flat`, `.lc-card--hero`, `.lc-card`; applies Docs grid and 72ch article width.
- Modify `tests/dashboard-layout.test.ts` — pins Dashboard class rename, auto-fit stats, auto-fill section grid, 18rem collapsed body height, and removed forced fixed columns.
- Modify `src/webview/layouts/DashboardLayout.svelte` — consumes shared cards and switches to adaptive Dashboard grids.
- Modify `tests/magazine-layout.test.ts` — pins Magazine class rename, hero type token, rail clamp, and token spacing.
- Modify `src/webview/layouts/MagazineLayout.svelte` — consumes shared hero/card/flat variants and proportional magazine rail.
- Modify `tests/story-layout.test.ts` — pins Story class rename, fluid number column, softer section height, and number opacity behavior.
- Modify `src/webview/layouts/StoryLayout.svelte` — consumes shared card, fluid story grid, softer viewport height, and number hierarchy.

---

### Task 1: Shared layout token, card, and nav system

**Files:**
- Create: `tests/layout-styles.test.ts`
- Modify: `src/webview/styles/layouts.css`

- [ ] **Step 1: Write failing shared stylesheet test**

Create `tests/layout-styles.test.ts` with this content:

```ts
import { readFileSync } from 'node:fs';

const source = readFileSync('src/webview/styles/layouts.css', 'utf8');

describe('shared layout stylesheet', () => {
  it('defines the token-first spacing, type, radius, and shadow system', () => {
    expect(source).toContain('--space-section-xs: clamp(1rem, 2vw, 1.5rem);');
    expect(source).toContain('--space-section-sm: clamp(1.5rem, 3vw, 2.5rem);');
    expect(source).toContain('--space-section-md: clamp(2rem, 4vw, 3.5rem);');
    expect(source).toContain('--space-section-lg: clamp(3rem, 5vw, 5rem);');
    expect(source).toContain('--space-section-xl: clamp(4rem, 7vw, 7rem);');
    expect(source).toContain('--space-1: 0.25rem;');
    expect(source).toContain('--space-2: 0.5rem;');
    expect(source).toContain('--space-3: 0.75rem;');
    expect(source).toContain('--space-4: 1rem;');
    expect(source).toContain('--space-6: 1.5rem;');
    expect(source).toContain('--space-8: 2rem;');
    expect(source).toContain('--text-xs: 0.75rem;');
    expect(source).toContain('--text-sm: 0.875rem;');
    expect(source).toContain('--text-base: 1rem;');
    expect(source).toContain('--text-lg: 1.25rem;');
    expect(source).toContain('--text-xl: 1.563rem;');
    expect(source).toContain('--text-2xl: 1.953rem;');
    expect(source).toContain('--text-3xl: clamp(2.4rem, 5vw, 3.5rem);');
    expect(source).toContain('--text-hero: clamp(3rem, 7vw, 5rem);');
    expect(source).toContain('--radius-sm: 6px;');
    expect(source).toContain('--radius-md: 10px;');
    expect(source).toContain('--radius-lg: 16px;');
    expect(source).toContain('--radius-full: 9999px;');
    expect(source).toContain('--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1);');
    expect(source).toContain('--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.1);');
    expect(source).toContain('--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.04), 0 20px 25px rgba(0, 0, 0, 0.1);');
  });

  it('defines card variants and removes legacy layout card classes', () => {
    expect(source).toContain('.lc-card,');
    expect(source).toContain('.lc-card--hero,');
    expect(source).toContain('.lc-card--flat');
    expect(source).toContain('box-shadow: var(--shadow-sm);');
    expect(source).toContain('box-shadow: var(--shadow-md);');
    expect(source).toContain('transform: translateY(-2px);');
    expect(source).toContain('linear-gradient(135deg, color-mix(in srgb, var(--md-accent) 12%, transparent), transparent 45%)');
    expect(source).not.toContain('.layout-card');
    expect(source).not.toContain('--layout-card');
    expect(source).not.toContain('--layout-gap');
    expect(source).not.toContain('--layout-wide-max');
  });

  it('centralizes toolbar and layout navigation interaction states', () => {
    expect(source).toContain('.docs-sidebar button:hover,');
    expect(source).toContain('.magazine-rail button:hover,');
    expect(source).toContain('transform: translateX(2px);');
    expect(source).toContain('.story-dots button:hover,');
    expect(source).toContain('transform: translateY(-2px);');
    expect(source).toContain('.layout-toolbar__pill:hover,');
    expect(source).toContain('transform: translateY(-1px);');
    expect(source).toContain('background: color-mix(in srgb, var(--md-accent) 16%, transparent);');
    expect(source).not.toContain('translateX(3px)');
    expect(source).not.toContain('translateX(-3px)');
  });
});
```

- [ ] **Step 2: Run shared stylesheet test to verify it fails**

Run:

```powershell
npm test -- tests/layout-styles.test.ts
```

Expected: FAIL because `--space-section-xs`, `.lc-card`, and normalized nav transforms do not exist yet.

- [ ] **Step 3: Replace shared layout stylesheet**

Replace the full contents of `src/webview/styles/layouts.css` with this CSS:

```css
:root {
  --space-section-xs: clamp(1rem, 2vw, 1.5rem);
  --space-section-sm: clamp(1.5rem, 3vw, 2.5rem);
  --space-section-md: clamp(2rem, 4vw, 3.5rem);
  --space-section-lg: clamp(3rem, 5vw, 5rem);
  --space-section-xl: clamp(4rem, 7vw, 7rem);

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.563rem;
  --text-2xl: 1.953rem;
  --text-3xl: clamp(2.4rem, 5vw, 3.5rem);
  --text-hero: clamp(3rem, 7vw, 5rem);

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.04), 0 20px 25px rgba(0, 0, 0, 0.1);
}

.layout-toolbar {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 3.25rem;
  padding: var(--space-2) var(--space-section-xs);
  color: var(--md-fg-primary);
  background: color-mix(in srgb, var(--md-bg-primary) 90%, transparent);
  border-bottom: 1px solid var(--md-border);
  backdrop-filter: blur(14px);
}

.layout-toolbar__group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.layout-toolbar__group::-webkit-scrollbar {
  display: none;
}

.layout-toolbar__pill,
.layout-toolbar__slides {
  all: unset;
  box-sizing: border-box;
  cursor: pointer;
  flex: 0 0 auto;
  min-height: var(--space-8);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--space-3);
  border: 1px solid var(--md-border);
  border-radius: var(--radius-full);
  color: var(--md-fg-secondary);
  background: var(--md-bg-secondary);
  font: 600 var(--text-xs) / 1 var(--md-font-body);
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.layout-toolbar__pill:hover,
.layout-toolbar__slides:hover,
.layout-toolbar__pill:focus-visible,
.layout-toolbar__slides:focus-visible {
  color: var(--md-fg-primary);
  background: color-mix(in srgb, var(--md-accent) 10%, transparent);
  border-color: var(--md-accent);
  transform: translateY(-1px);
}

.layout-toolbar__pill.active,
.layout-toolbar__pill[aria-pressed='true'] {
  color: var(--md-fg-primary);
  background: color-mix(in srgb, var(--md-accent) 16%, transparent);
  border-color: var(--md-accent);
  font-weight: 600;
}

.layout-toolbar__status {
  margin-left: auto;
  flex: 0 0 auto;
  min-height: var(--space-8);
  display: inline-flex;
  align-items: center;
  padding: 0 var(--space-3);
  border: 1px solid var(--md-border);
  border-radius: var(--radius-full);
  color: var(--md-fg-secondary);
  background: color-mix(in srgb, var(--md-bg-tertiary) 82%, transparent);
  font: 700 var(--text-xs) / 1 var(--md-font-body);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.layout-toolbar__slides {
  color: var(--md-accent);
}

.rich-layout {
  width: min(100%, 1180px);
  margin: 0 auto;
  padding: var(--space-section-xl) var(--space-section-md) var(--space-section-md);
}

.lc-card,
.lc-card--hero,
.lc-card--flat {
  border: 1px solid color-mix(in srgb, var(--md-border) 82%, var(--md-accent) 18%);
  background: color-mix(in srgb, var(--md-bg-secondary) 90%, var(--md-bg-primary) 10%);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.lc-card {
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.lc-card--hero {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.lc-card--hero::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(135deg, color-mix(in srgb, var(--md-accent) 12%, transparent), transparent 45%);
}

.lc-card--hero > * {
  position: relative;
  z-index: 1;
}

.lc-card--flat {
  border-radius: var(--radius-md);
  box-shadow: none;
}

.lc-card:hover,
.lc-card--hero:hover,
.lc-card--flat:hover {
  border-color: color-mix(in srgb, var(--md-accent) 65%, var(--md-border) 35%);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.docs-sidebar button,
.magazine-rail button,
.story-dots button {
  color: var(--md-fg-secondary);
  background: transparent;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.docs-sidebar button:hover,
.docs-sidebar button:focus-visible,
.magazine-rail button:hover,
.magazine-rail button:focus-visible {
  color: var(--md-fg-primary);
  background: color-mix(in srgb, var(--md-accent) 10%, transparent);
  transform: translateX(2px);
}

.docs-sidebar button.active,
.docs-sidebar button[aria-current='true'],
.magazine-rail button.active,
.magazine-rail button[aria-current='true'],
.story-dots button.active,
.story-dots button[aria-current='true'] {
  color: var(--md-fg-primary);
  background: color-mix(in srgb, var(--md-accent) 16%, transparent);
  font-weight: 600;
}

.story-dots button:hover,
.story-dots button:focus-visible {
  color: var(--md-fg-primary);
  background: color-mix(in srgb, var(--md-accent) 10%, transparent);
  transform: translateY(-2px);
}

[data-reveal] {
  opacity: 0;
  transform: translateY(18px);
  transition:
    opacity 0.48s ease,
    transform 0.48s ease;
  transition-delay: var(--reveal-delay, 0ms);
  will-change: opacity, transform;
}

[data-reveal].is-visible {
  opacity: 1;
  transform: translateY(0);
  will-change: auto;
}

@media (max-width: 720px) {
  .layout-toolbar {
    gap: var(--space-2);
    padding-inline: var(--space-2);
  }

  .layout-toolbar__status {
    display: none;
  }

  .layout-toolbar__pill,
  .layout-toolbar__slides {
    padding-inline: var(--space-2);
    font-size: var(--text-xs);
  }

  .rich-layout {
    padding: var(--space-section-lg) var(--space-4) var(--space-section-sm);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 1ms !important;
  }

  [data-reveal],
  [data-reveal].is-visible {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
    will-change: auto;
  }

  .lc-card,
  .lc-card:hover,
  .lc-card--hero,
  .lc-card--hero:hover,
  .lc-card--flat,
  .lc-card--flat:hover,
  .layout-toolbar__pill,
  .layout-toolbar__slides,
  .layout-toolbar__pill:hover,
  .layout-toolbar__slides:hover,
  .docs-sidebar button,
  .docs-sidebar button:hover,
  .magazine-rail button,
  .magazine-rail button:hover,
  .story-dots button,
  .story-dots button:hover {
    transform: none !important;
  }
}
```

- [ ] **Step 4: Run shared stylesheet test to verify it passes**

Run:

```powershell
npm test -- tests/layout-styles.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit shared stylesheet foundation**

Run:

```powershell
git add tests/layout-styles.test.ts src/webview/styles/layouts.css
git commit -m @'
test: cover shared layout token system

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
'@
```

Expected: commit succeeds.

---

### Task 2: Docs layout token adoption and proportional sidebar

**Files:**
- Modify: `tests/docs-layout.test.ts`
- Modify: `src/webview/layouts/DocsLayout.svelte`

- [ ] **Step 1: Replace Docs layout test with new expectations**

Replace `tests/docs-layout.test.ts` with this content:

```ts
import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';

const source = readFileSync('src/webview/layouts/DocsLayout.svelte', 'utf8');

describe('DocsLayout rich shell', () => {
  it('renders the required rich docs structure from document sections', () => {
    compile(source, {
      filename: 'DocsLayout.svelte',
      generate: 'client',
    });

    expect(source).toContain('let { model, showTOC = true }');
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
    expect(source).toContain('class="docs-section lc-card markdown-body"');
    expect(source).toContain('data-section-key={section.key}');
    expect(source).toContain('data-section-id={section.id}');
    expect(source).not.toMatch(/\s+id=\{section\.id\}/);
    expect(source).toContain('data-source-line={section.sourceLine}');
    expect(source).toContain('{@html section.html}');
    expect(source).not.toContain('layout-card');
  });

  it('shows a conditional docs sidebar and scrolls unique wrappers first', () => {
    expect(source).toContain('function scrollToSection(sectionKey: string, sectionId: string)');
    expect(source).toContain('document.querySelector');
    expect(source).toContain('[data-section-key="');
    expect(source).toContain('CSS.escape');
    expect(source).toContain('document.getElementById(sectionId)');
    expect(source.indexOf('[data-section-key="')).toBeLessThan(
      source.indexOf('document.getElementById(sectionId)'),
    );
    expect(source).toContain("scrollIntoView({ behavior: 'smooth', block: 'start' })");
    expect(source).toContain('{#if hasSidebar}');
    expect(source).toContain('class="docs-sidebar lc-card--flat"');
    expect(source).toContain('Docs');
    expect(source).toContain('<nav aria-label="Document sections">');
    expect(source).toContain('onclick={() => scrollToSection(section.key, section.id)}');
    expect(source).toContain('class:deep={section.level > 2}');
    expect(source).toContain('{section.title}');
  });

  it('expands content to one column when the docs sidebar is omitted', () => {
    expect(source).toContain('let hasSidebar = $derived(showTOC && model.sections.length > 1)');
    expect(source).toContain('class:no-sidebar={!hasSidebar}');
    expect(source).toContain('{#if hasSidebar}');
    expect(source).not.toContain('{#if showTOC && model.sections.length > 1}');
    expect(source).toContain('.docs-layout.no-sidebar');
    expect(source).toContain('grid-template-columns: 1fr;');
    expect(source).toContain('grid-column: 1 / -1;');
  });

  it('uses tokenized docs spacing, type, and proportional grid values', () => {
    expect(source).toContain('grid-template-columns: clamp(14rem, 22%, 20rem) minmax(0, 1fr);');
    expect(source).toContain('gap: var(--space-section-md);');
    expect(source).toContain('max-width: 72ch;');
    expect(source).toContain('padding: var(--space-section-sm);');
    expect(source).toContain('font: 800 var(--text-3xl) / 1.1 var(--md-font-heading, var(--md-font-body));');
    expect(source).toContain('font: 800 var(--text-xs) / 1.4 var(--md-font-body);');
    expect(source).toContain('border-radius: var(--radius-md);');
    expect(source).not.toContain('--layout-');
    expect(source).not.toContain('translateX(3px)');
    expect(source).not.toContain('clamp(2.4rem, 7vw, 4.6rem)');
  });
});
```

- [ ] **Step 2: Run Docs layout test to verify it fails**

Run:

```powershell
npm test -- tests/docs-layout.test.ts
```

Expected: FAIL because `DocsLayout.svelte` still uses `layout-card`, old sidebar grid, old title clamp, and legacy layout tokens.

- [ ] **Step 3: Update Docs template classes**

In `src/webview/layouts/DocsLayout.svelte`, make these exact class replacements:

```svelte
<aside class="docs-sidebar lc-card--flat" data-reveal>
```

```svelte
<header class="docs-header lc-card--hero" data-reveal>
```

```svelte
class="docs-section lc-card markdown-body"
```

- [ ] **Step 4: Replace Docs style block**

Replace the full `<style>...</style>` block in `src/webview/layouts/DocsLayout.svelte` with this block:

```svelte
<style>
  .docs-layout {
    width: min(100%, 1180px);
    margin: 0 auto;
    padding: var(--space-section-xl) var(--space-section-md) var(--space-section-md);
    display: grid;
    grid-template-columns: clamp(14rem, 22%, 20rem) minmax(0, 1fr);
    align-items: start;
    gap: var(--space-section-md);
  }

  .docs-layout.no-sidebar {
    grid-template-columns: 1fr;
  }

  .docs-content.rich-layout {
    grid-column: auto;
    width: 100%;
    max-width: 72ch;
    min-width: 0;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-section-md);
  }

  .docs-layout.no-sidebar .docs-content {
    grid-column: 1 / -1;
    max-width: 72ch;
  }

  .docs-sidebar {
    position: sticky;
    top: calc(3.25rem + var(--space-4));
    display: grid;
    gap: var(--space-3);
    max-height: calc(100vh - 5.5rem);
    padding: var(--space-4);
    overflow: auto;
  }

  .docs-eyebrow,
  .docs-header span {
    margin: 0;
    color: var(--md-accent);
    font: 800 var(--text-xs) / 1.4 var(--md-font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .docs-sidebar h2 {
    margin: 0;
    color: var(--md-fg-primary);
    font: 700 var(--text-base) / 1.3 var(--md-font-heading, var(--md-font-body));
    overflow-wrap: anywhere;
  }

  .docs-sidebar nav {
    display: grid;
    gap: var(--space-1);
  }

  .docs-sidebar button {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    min-height: var(--space-8);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    font: 600 var(--text-sm) / 1.4 var(--md-font-body);
    overflow-wrap: anywhere;
  }

  .docs-sidebar button.deep {
    padding-left: var(--space-6);
    color: color-mix(in srgb, var(--md-fg-secondary) 82%, var(--md-accent) 18%);
    font-size: var(--text-xs);
    font-weight: 550;
  }

  .docs-header {
    display: grid;
    gap: var(--space-4);
    padding: var(--space-section-sm);
  }

  .docs-header h1 {
    max-width: 18ch;
    margin: 0;
    color: var(--md-fg-primary);
    font: 800 var(--text-3xl) / 1.1 var(--md-font-heading, var(--md-font-body));
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }

  .docs-header p {
    max-width: 60ch;
    margin: 0;
    color: var(--md-fg-secondary);
    font-size: var(--text-base);
    line-height: 1.6;
  }

  .docs-sections {
    display: grid;
    gap: var(--space-section-md);
  }

  .docs-section {
    min-width: 0;
    padding: var(--space-section-sm);
    overflow-wrap: break-word;
  }

  :global(.docs-section > :first-child) {
    margin-top: 0;
  }

  :global(.docs-section > :last-child) {
    margin-bottom: 0;
  }

  :global(.docs-section h2:first-child),
  :global(.docs-section h3:first-child),
  :global(.docs-section h4:first-child) {
    color: var(--md-fg-primary);
    font-size: var(--text-xl);
    line-height: 1.3;
    letter-spacing: 0;
  }

  :global(.docs-section blockquote) {
    margin: var(--space-6) 0;
    padding: var(--space-4);
    border-left: 4px solid var(--md-accent);
    border-radius: var(--radius-md);
    color: var(--md-fg-primary);
    background: color-mix(in srgb, var(--md-accent) 9%, var(--md-bg-tertiary) 91%);
    font-size: var(--text-base);
  }

  :global(.docs-section pre) {
    margin: var(--space-6) 0;
    padding: var(--space-4);
    overflow: auto;
    border: 1px solid color-mix(in srgb, var(--md-border) 78%, var(--md-accent) 22%);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--md-bg-primary) 82%, black 18%);
  }

  :global(.docs-section code) {
    font-size: var(--text-sm);
  }

  :global(.docs-section table) {
    display: block;
    width: 100%;
    overflow-x: auto;
  }

  @media (max-width: 900px) {
    .docs-layout {
      grid-template-columns: 1fr;
      padding: var(--space-section-lg) var(--space-4) var(--space-section-sm);
    }

    .docs-sidebar {
      position: static;
      max-height: none;
      order: -1;
    }

    .docs-sidebar nav {
      display: flex;
      gap: var(--space-2);
      overflow-x: auto;
      padding-bottom: var(--space-1);
      scrollbar-width: none;
    }

    .docs-sidebar nav::-webkit-scrollbar {
      display: none;
    }

    .docs-sidebar button {
      flex: 0 0 auto;
      border: 1px solid var(--md-border);
    }

    .docs-sidebar button.deep {
      padding-left: var(--space-3);
    }
  }

  @media (max-width: 560px) {
    .docs-layout {
      padding-inline: var(--space-4);
    }

    .docs-header,
    .docs-section {
      padding: var(--space-4);
    }
  }
</style>
```

- [ ] **Step 5: Run Docs layout test to verify it passes**

Run:

```powershell
npm test -- tests/docs-layout.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Docs layout changes**

Run:

```powershell
git add tests/docs-layout.test.ts src/webview/layouts/DocsLayout.svelte
git commit -m @'
fix: apply shared design system to docs layout

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
'@
```

Expected: commit succeeds.

---

### Task 3: Dashboard adaptive stats and card grid

**Files:**
- Modify: `tests/dashboard-layout.test.ts`
- Modify: `src/webview/layouts/DashboardLayout.svelte`

- [ ] **Step 1: Replace Dashboard layout test with new expectations**

Replace `tests/dashboard-layout.test.ts` with this content:

```ts
import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';

const source = readFileSync('src/webview/layouts/DashboardLayout.svelte', 'utf8');

describe('DashboardLayout rich shell', () => {
  it('renders dashboard shell, stats, and keyed section cards', () => {
    compile(source, {
      filename: 'DashboardLayout.svelte',
      generate: 'client',
    });

    expect(source).toContain('let { model, showTOC }');
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
    expect(source).toContain('class="dashboard-card lc-card"');
    expect(source).toContain('class:expanded={expanded[section.key]}');
    expect(source).toContain('data-section-key={section.key}');
    expect(source).toContain('data-section-id={section.id}');
    expect(source).not.toMatch(/\s+id=\{section\.id\}/);
    expect(source).toContain('data-source-line={section.sourceLine}');
    expect(source).toContain('aria-expanded={expanded[section.key] ?');
    expect(source).toContain('aria-controls={dashboardBodyId(section.key)}');
    expect(source).toContain('onclick={() => toggleSection(section.key)}');
    expect(source).toContain('{section.blockTypes.join');
    expect(source).toContain('class="dashboard-card__body markdown-body"');
    expect(source).toContain('id={dashboardBodyId(section.key)}');
    expect(source).not.toContain('aria-hidden={!expanded[section.key]}');
    expect(source).not.toContain('inert={expanded[section.key] ? undefined : true}');
    expect(source).toContain('{@html section.html}');
    expect(source).not.toContain('layout-card');
  });

  it('defines adaptive dashboard grids and semantic collapsed card bodies', () => {
    expect(source).toContain('grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));');
    expect(source).toContain('grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr));');
    expect(source).toContain('max-height: 18rem;');
    expect(source).toMatch(/\.dashboard-card__body\s*\{[^}]*overflow: auto;/);
    expect(source).toContain('.dashboard-card.expanded .dashboard-card__body');
    expect(source).toContain('max-height: none;');
    expect(source).toContain(':global(.dashboard-card__body table)');
    expect(source).toContain(':global(.dashboard-card__body pre)');
    expect(source).toContain('@media (max-width: 760px)');
    expect(source).toContain('grid-template-columns: 1fr;');
    expect(source).not.toContain('grid-template-columns: repeat(4, minmax(0, 1fr));');
    expect(source).not.toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
    expect(source).not.toContain('max-height: 320px;');
  });

  it('uses shared layout tokens for dashboard type, spacing, radius, and hero scale', () => {
    expect(source).toContain('gap: var(--space-section-md);');
    expect(source).toContain('gap: var(--space-4);');
    expect(source).toContain('padding: var(--space-section-lg);');
    expect(source).toContain('font: 800 var(--text-hero) / 0.98 var(--md-font-heading, var(--md-font-body));');
    expect(source).toContain('font: 800 var(--text-xs) / 1.4 var(--md-font-body);');
    expect(source).toContain('font: 800 var(--text-2xl) / 1 var(--md-font-heading, var(--md-font-body));');
    expect(source).toContain('border-radius: var(--radius-md);');
    expect(source).not.toContain('--layout-');
  });
});
```

- [ ] **Step 2: Run Dashboard layout test to verify it fails**

Run:

```powershell
npm test -- tests/dashboard-layout.test.ts
```

Expected: FAIL because Dashboard still uses `layout-card`, fixed 4/2-column grids, `320px`, and old layout tokens.

- [ ] **Step 3: Update Dashboard template classes**

In `src/webview/layouts/DashboardLayout.svelte`, make these exact class replacements:

```svelte
<header class="dashboard-header lc-card--hero" data-reveal>
```

```svelte
<div class="dashboard-stat lc-card" data-reveal>
```

Apply the stat card replacement to all four stat cards.

```svelte
class="dashboard-card lc-card"
```

- [ ] **Step 4: Replace Dashboard style block**

Replace the full `<style>...</style>` block in `src/webview/layouts/DashboardLayout.svelte` with this block:

```svelte
<style>
  .dashboard-layout {
    display: grid;
    gap: var(--space-section-md);
  }

  .dashboard-header {
    display: grid;
    gap: var(--space-4);
    padding: var(--space-section-lg);
  }

  .dashboard-header span,
  .dashboard-stat span,
  .dashboard-card__types {
    color: var(--md-accent);
    font: 800 var(--text-xs) / 1.4 var(--md-font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .dashboard-header h1 {
    max-width: 16ch;
    margin: 0;
    color: var(--md-fg-primary);
    font: 800 var(--text-hero) / 0.98 var(--md-font-heading, var(--md-font-body));
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }

  .dashboard-header p {
    max-width: 60ch;
    margin: 0;
    color: var(--md-fg-secondary);
    font-size: var(--text-lg);
    line-height: 1.4;
  }

  .dashboard-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    gap: var(--space-4);
  }

  .dashboard-stat {
    display: grid;
    gap: var(--space-3);
    min-width: 0;
    padding: var(--space-4);
    overflow: hidden;
  }

  .dashboard-stat strong {
    color: var(--md-fg-primary);
    font: 800 var(--text-2xl) / 1 var(--md-font-heading, var(--md-font-body));
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr));
    gap: var(--space-section-md);
    align-items: start;
  }

  .dashboard-card {
    min-width: 0;
    overflow: hidden;
  }

  .dashboard-card__header {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
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

  .dashboard-card__header:hover,
  .dashboard-card__header:focus-visible {
    background: color-mix(in srgb, var(--md-accent) 12%, var(--md-bg-tertiary) 88%);
  }

  .dashboard-card__title {
    min-width: 0;
    color: var(--md-fg-primary);
    font: 700 var(--text-base) / 1.3 var(--md-font-heading, var(--md-font-body));
    overflow-wrap: anywhere;
  }

  .dashboard-card__types {
    flex: 0 0 auto;
    max-width: 45%;
    overflow: hidden;
    text-align: right;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-card__body {
    max-height: 18rem;
    padding: var(--space-4) var(--space-6) var(--space-6);
    overflow: auto;
    transition: max-height 0.2s ease;
  }

  .dashboard-card.expanded .dashboard-card__body {
    max-height: none;
    overflow: visible;
  }

  :global(.dashboard-card__body > :first-child) {
    margin-top: 0;
  }

  :global(.dashboard-card__body > :last-child) {
    margin-bottom: 0;
  }

  :global(.dashboard-card__body table) {
    display: block;
    width: 100%;
    overflow-x: auto;
  }

  :global(.dashboard-card__body pre) {
    max-width: 100%;
    overflow: auto;
    border-radius: var(--radius-md);
  }

  @media (max-width: 760px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }

    .dashboard-header {
      padding: var(--space-section-sm);
    }

    .dashboard-stat,
    .dashboard-card__header,
    .dashboard-card__body {
      padding: var(--space-4);
    }

    .dashboard-card__header {
      align-items: flex-start;
      flex-direction: column;
      gap: var(--space-2);
    }

    .dashboard-card__types {
      max-width: 100%;
      text-align: left;
    }
  }
</style>
```

- [ ] **Step 5: Run Dashboard layout test to verify it passes**

Run:

```powershell
npm test -- tests/dashboard-layout.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Dashboard layout changes**

Run:

```powershell
git add tests/dashboard-layout.test.ts src/webview/layouts/DashboardLayout.svelte
git commit -m @'
fix: make dashboard layout adaptive

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
'@
```

Expected: commit succeeds.

---

### Task 4: Magazine hero, rail, and card language

**Files:**
- Modify: `tests/magazine-layout.test.ts`
- Modify: `src/webview/layouts/MagazineLayout.svelte`

- [ ] **Step 1: Replace Magazine layout test with new expectations**

Replace `tests/magazine-layout.test.ts` with this content:

```ts
import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';

const source = readFileSync('src/webview/layouts/MagazineLayout.svelte', 'utf8');

describe('MagazineLayout rich shell', () => {
  it('renders the required rich magazine structure from document sections', () => {
    compile(source, {
      filename: 'MagazineLayout.svelte',
      generate: 'client',
    });

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
    expect(source).toContain('class="magazine-section lc-card markdown-body"');
    expect(source).toContain('data-section-key={section.key}');
    expect(source).toContain('data-section-id={section.id}');
    expect(source).not.toMatch(/\s+id=\{section\.id\}/);
    expect(source).toContain('data-source-line={section.sourceLine}');
    expect(source).toContain('{@html section.html}');
    expect(source).not.toContain('layout-card');
  });

  it('shows a conditional section rail and scrolls sections smoothly', () => {
    expect(source).toContain('function scrollToSection(sectionKey: string, sectionId: string)');
    expect(source).toContain('document.getElementById(sectionId)');
    expect(source).toContain('document.querySelector');
    expect(source).toContain('[data-section-key="');
    expect(source).toContain('CSS.escape');
    expect(source.indexOf('[data-section-key="')).toBeLessThan(
      source.indexOf('document.getElementById(sectionId)'),
    );
    expect(source).toContain("scrollIntoView({ behavior: 'smooth', block: 'start' })");
    expect(source).toContain('{#if showTOC && model.sections.length > 1}');
    expect(source).toContain('class="magazine-rail lc-card--flat"');
    expect(source).toContain('Sections');
    expect(source).toContain('onclick={() => scrollToSection(section.key, section.id)}');
    expect(source).toContain('{section.title}');
  });

  it('uses tokenized magazine hero, rail, and section proportions', () => {
    expect(source).toContain('gap: var(--space-section-md);');
    expect(source).toContain('padding: var(--space-section-xl);');
    expect(source).toContain('font: 800 var(--text-hero) / 0.98 var(--md-font-heading, var(--md-font-body));');
    expect(source).toContain('font-size: var(--text-lg);');
    expect(source).toContain('grid-template-columns: minmax(0, 1fr) clamp(14rem, 24%, 18rem);');
    expect(source).toContain('font: 700 var(--text-xs) / 1.4 var(--md-font-body);');
    expect(source).toContain('font-size: var(--text-2xl);');
    expect(source).toContain('border-radius: var(--radius-md);');
    expect(source).not.toContain('--layout-');
    expect(source).not.toContain('font: 800 5rem/0.95');
    expect(source).not.toContain('translateX(3px)');
  });
});
```

- [ ] **Step 2: Run Magazine layout test to verify it fails**

Run:

```powershell
npm test -- tests/magazine-layout.test.ts
```

Expected: FAIL because Magazine still uses `layout-card`, hardcoded `5rem`, fixed rail range, old spacing tokens, and local `translateX(3px)`.

- [ ] **Step 3: Update Magazine template classes**

In `src/webview/layouts/MagazineLayout.svelte`, make these exact class replacements:

```svelte
<header class="magazine-hero lc-card--hero" data-reveal>
```

```svelte
class="magazine-section lc-card markdown-body"
```

```svelte
<aside class="magazine-rail lc-card--flat" data-reveal>
```

- [ ] **Step 4: Replace Magazine style block**

Replace the full `<style>...</style>` block in `src/webview/layouts/MagazineLayout.svelte` with this block:

```svelte
<style>
  .magazine-layout {
    display: grid;
    gap: var(--space-section-md);
  }

  .magazine-hero {
    padding: var(--space-section-xl);
  }

  .magazine-hero::after {
    content: '';
    position: absolute;
    inset: auto var(--space-section-lg) var(--space-section-sm) auto;
    width: clamp(5rem, 18vw, 13rem);
    height: 2px;
    background: var(--md-accent);
    opacity: 0.75;
  }

  .magazine-kicker {
    margin: 0 0 var(--space-3);
    color: var(--md-accent);
    font: 700 var(--text-xs) / 1.4 var(--md-font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .magazine-hero h1 {
    max-width: 13ch;
    margin: 0;
    color: var(--md-fg-primary);
    font: 800 var(--text-hero) / 0.98 var(--md-font-heading, var(--md-font-body));
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }

  .magazine-description {
    max-width: 60ch;
    margin: var(--space-6) 0 0;
    color: var(--md-fg-secondary);
    font-size: var(--text-lg);
    line-height: 1.4;
  }

  .magazine-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) clamp(14rem, 24%, 18rem);
    align-items: start;
    gap: var(--space-section-md);
  }

  .magazine-content {
    display: grid;
    gap: var(--space-section-md);
    min-width: 0;
  }

  .magazine-section {
    min-width: 0;
    padding: var(--space-section-sm);
    overflow-wrap: break-word;
  }

  .magazine-rail {
    position: sticky;
    top: calc(3.25rem + var(--space-4));
    display: grid;
    gap: var(--space-3);
    padding: var(--space-4);
  }

  .magazine-rail h2 {
    margin: 0;
    color: var(--md-fg-primary);
    font: 700 var(--text-xs) / 1.4 var(--md-font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .magazine-rail nav {
    display: grid;
    gap: var(--space-1);
  }

  .magazine-rail button {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    min-height: var(--space-8);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    font: 600 var(--text-sm) / 1.4 var(--md-font-body);
    overflow-wrap: anywhere;
  }

  :global(.magazine-section > :first-child) {
    margin-top: 0;
  }

  :global(.magazine-section > :last-child) {
    margin-bottom: 0;
  }

  :global(.magazine-section h2:first-child),
  :global(.magazine-section h3:first-child) {
    color: var(--md-fg-primary);
    font-size: var(--text-2xl);
    line-height: 1.2;
    letter-spacing: 0;
  }

  :global(.magazine-section blockquote) {
    margin: var(--space-6) 0;
    padding: var(--space-4) var(--space-6);
    border-left: 4px solid var(--md-accent);
    border-radius: var(--radius-md);
    color: var(--md-fg-primary);
    background: color-mix(in srgb, var(--md-accent) 10%, var(--md-bg-tertiary) 90%);
    font-size: var(--text-base);
  }

  :global(.magazine-section img) {
    display: block;
    width: 100%;
    max-height: 34rem;
    object-fit: cover;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  :global(.magazine-section figure),
  :global(.magazine-section table),
  :global(.magazine-section pre) {
    margin: var(--space-6) 0;
  }

  :global(.magazine-section table) {
    width: 100%;
    overflow: hidden;
    border-radius: var(--radius-md);
  }

  @media (max-width: 900px) {
    .magazine-grid {
      grid-template-columns: 1fr;
    }

    .magazine-rail {
      position: static;
      order: -1;
    }

    .magazine-rail nav {
      display: flex;
      gap: var(--space-2);
      overflow-x: auto;
      padding-bottom: var(--space-1);
      scrollbar-width: none;
    }

    .magazine-rail nav::-webkit-scrollbar {
      display: none;
    }

    .magazine-rail button {
      flex: 0 0 auto;
      border: 1px solid var(--md-border);
    }
  }

  @media (max-width: 560px) {
    .magazine-hero,
    .magazine-section {
      padding: var(--space-4);
    }

    .magazine-hero::after {
      display: none;
    }
  }
</style>
```

- [ ] **Step 5: Run Magazine layout test to verify it passes**

Run:

```powershell
npm test -- tests/magazine-layout.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Magazine layout changes**

Run:

```powershell
git add tests/magazine-layout.test.ts src/webview/layouts/MagazineLayout.svelte
git commit -m @'
fix: align magazine layout with shared visual system

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
'@
```

Expected: commit succeeds.

---

### Task 5: Story layout rhythm, number hierarchy, and dot interaction

**Files:**
- Modify: `tests/story-layout.test.ts`
- Modify: `src/webview/layouts/StoryLayout.svelte`

- [ ] **Step 1: Replace Story layout test with new expectations**

Replace `tests/story-layout.test.ts` with this content:

```ts
import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';

const source = readFileSync('src/webview/layouts/StoryLayout.svelte', 'utf8');

describe('StoryLayout rich shell', () => {
  it('renders the required rich story structure from document sections', () => {
    compile(source, {
      filename: 'StoryLayout.svelte',
      generate: 'client',
    });

    expect(source).toContain('let { model, showTOC }');
    expect(source).toContain('let hasDots = $derived(showTOC && model.sections.length > 1)');
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
    expect(source).toContain('class="story-section__content markdown-body lc-card"');
    expect(source).toContain('{@html section.html}');
    expect(source).not.toContain('layout-card');
  });

  it('scrolls dot buttons to unique section wrappers first', () => {
    expect(source).toContain('function scrollToSection(sectionKey: string, sectionId: string)');
    expect(source).toContain('document.querySelector');
    expect(source).toContain('[data-section-key="');
    expect(source).toContain('CSS.escape');
    expect(source).toContain('document.getElementById(sectionId)');
    expect(source.indexOf('[data-section-key="')).toBeLessThan(
      source.indexOf('document.getElementById(sectionId)'),
    );
    expect(source).toContain("scrollIntoView({ behavior: 'smooth', block: 'start' })");
    expect(source).toContain('onclick={() => scrollToSection(section.key, section.id)}');
    expect(source).toContain('title={section.title}');
    expect(source).toContain('aria-label={`Jump to ${section.title}`}');
    expect(source).toContain('{formatSectionNumber(index)}');
  });

  it('defines fluid story sections, softer section height, and number hierarchy', () => {
    expect(source).toContain('width: min(100%, 1180px);');
    expect(source).toContain('gap: var(--space-section-md);');
    expect(source).toContain('scroll-snap-type: y proximity;');
    expect(source).toContain('grid-template-columns: clamp(5rem, 10vw, 8rem) minmax(0, 1fr);');
    expect(source).toContain('min-height: min(32rem, 80vh);');
    expect(source).toContain('scroll-snap-align: start;');
    expect(source).toContain('opacity: 0.35;');
    expect(source).toContain('.story-section:hover .story-section__number');
    expect(source).toContain('opacity: 1;');
    expect(source).toContain('writing-mode: vertical-rl;');
    expect(source).toContain('position: fixed;');
    expect(source).toContain('max-height: calc(100vh - var(--space-8));');
    expect(source).toContain('overflow-y: auto;');
    expect(source).toContain(':global(.story-section__content h1)');
    expect(source).toContain(':global(.story-section__content h2)');
    expect(source).toContain(':global(.story-section__content hr)');
    expect(source).toContain('display: none;');
    expect(source).toContain('@media (max-width: 760px)');
    expect(source).toContain('grid-template-columns: 1fr;');
    expect(source).not.toContain('min-height: min(42rem, calc(100vh - 3rem));');
    expect(source).not.toContain('grid-template-columns: minmax(3rem, 6rem) minmax(0, 1fr);');
    expect(source).not.toContain('translateX(-3px)');
  });
});
```

- [ ] **Step 2: Run Story layout test to verify it fails**

Run:

```powershell
npm test -- tests/story-layout.test.ts
```

Expected: FAIL because Story still uses `layout-card`, narrow number column, aggressive section height, no number opacity hierarchy, and old dot transform.

- [ ] **Step 3: Update Story template class**

In `src/webview/layouts/StoryLayout.svelte`, replace the story content class with this exact class string:

```svelte
class="story-section__content markdown-body lc-card"
```

- [ ] **Step 4: Replace Story style block**

Replace the full `<style>...</style>` block in `src/webview/layouts/StoryLayout.svelte` with this block:

```svelte
<style>
  .story-layout {
    position: relative;
    width: min(100%, 1180px);
    margin: 0 auto;
    padding: var(--space-section-xl) var(--space-section-md) var(--space-section-md);
  }

  .story-sections {
    display: grid;
    gap: var(--space-section-md);
    scroll-snap-type: y proximity;
  }

  .story-section {
    display: grid;
    grid-template-columns: clamp(5rem, 10vw, 8rem) minmax(0, 1fr);
    align-items: center;
    gap: var(--space-section-md);
    min-height: min(32rem, 80vh);
    scroll-snap-align: start;
  }

  .story-section__number {
    justify-self: center;
    color: color-mix(in srgb, var(--md-accent) 78%, var(--md-fg-secondary) 22%);
    font: 800 var(--text-hero) / 1 var(--md-font-heading, var(--md-font-body));
    letter-spacing: 0;
    opacity: 0.35;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    transition: opacity 0.2s ease;
  }

  .story-section:hover .story-section__number,
  .story-section:focus-within .story-section__number {
    opacity: 1;
  }

  .story-section__content {
    min-width: 0;
    padding: var(--space-section-sm);
    overflow-wrap: break-word;
  }

  .story-dots {
    position: fixed;
    top: 50%;
    right: var(--space-4);
    z-index: 6;
    display: grid;
    gap: var(--space-2);
    max-height: calc(100vh - var(--space-8));
    overflow-y: auto;
    transform: translateY(-50%);
    scrollbar-width: thin;
  }

  .story-dots button {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    display: grid;
    place-items: center;
    width: calc(var(--space-8) + var(--space-1));
    height: calc(var(--space-8) + var(--space-1));
    border: 1px solid color-mix(in srgb, var(--md-border) 82%, var(--md-accent) 18%);
    border-radius: var(--radius-full);
    box-shadow: var(--shadow-sm);
    font: 700 var(--text-xs) / 1 var(--md-font-body);
    letter-spacing: 0;
  }

  :global(.story-section__content > :first-child) {
    margin-top: 0;
  }

  :global(.story-section__content > :last-child) {
    margin-bottom: 0;
  }

  :global(.story-section__content h1),
  :global(.story-section__content h2) {
    margin-bottom: var(--space-4);
    color: var(--md-fg-primary);
    font-size: var(--text-hero);
    line-height: 0.98;
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }

  :global(.story-section__content p) {
    font-size: var(--text-lg);
    line-height: 1.6;
  }

  :global(.story-section__content blockquote) {
    margin: var(--space-6) 0;
    padding: var(--space-4) var(--space-6);
    border-left: 4px solid var(--md-accent);
    border-radius: var(--radius-md);
    color: var(--md-fg-primary);
    background: color-mix(in srgb, var(--md-accent) 10%, var(--md-bg-tertiary) 90%);
    font-size: var(--text-base);
  }

  :global(.story-section__content img) {
    display: block;
    width: 100%;
    max-height: 34rem;
    object-fit: cover;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  :global(.story-section__content hr) {
    display: none;
  }

  @media (max-width: 760px) {
    .story-layout {
      padding: var(--space-section-lg) var(--space-4) var(--space-section-sm);
    }

    .story-sections {
      gap: var(--space-4);
      scroll-snap-type: none;
    }

    .story-section {
      grid-template-columns: 1fr;
      align-items: start;
      gap: var(--space-3);
      min-height: auto;
      scroll-snap-align: none;
    }

    .story-section__number {
      justify-self: start;
      font-size: var(--text-2xl);
      writing-mode: horizontal-tb;
    }

    .story-section__content {
      padding: var(--space-4);
    }

    .story-dots {
      position: sticky;
      top: calc(3.25rem + var(--space-3));
      grid-auto-flow: column;
      grid-auto-columns: minmax(var(--space-8), max-content);
      justify-content: start;
      overflow-x: auto;
      overflow-y: hidden;
      padding: var(--space-1) 0 var(--space-3);
      transform: none;
      scrollbar-width: none;
    }

    .story-dots::-webkit-scrollbar {
      display: none;
    }

    .story-dots button {
      width: var(--space-8);
      height: var(--space-8);
    }
  }
</style>
```

- [ ] **Step 5: Run Story layout test to verify it passes**

Run:

```powershell
npm test -- tests/story-layout.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Story layout changes**

Run:

```powershell
git add tests/story-layout.test.ts src/webview/layouts/StoryLayout.svelte
git commit -m @'
fix: rebalance story layout rhythm

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
'@
```

Expected: commit succeeds.

---

### Task 6: Full regression, build, and visual verification

**Files:**
- Inspect: `src/webview/styles/layouts.css`
- Inspect: `src/webview/layouts/DocsLayout.svelte`
- Inspect: `src/webview/layouts/DashboardLayout.svelte`
- Inspect: `src/webview/layouts/MagazineLayout.svelte`
- Inspect: `src/webview/layouts/StoryLayout.svelte`

- [ ] **Step 1: Run targeted layout tests**

Run:

```powershell
npm test -- tests/layout-styles.test.ts tests/docs-layout.test.ts tests/dashboard-layout.test.ts tests/magazine-layout.test.ts tests/story-layout.test.ts
```

Expected: PASS for all five test files.

- [ ] **Step 2: Run full test suite**

Run:

```powershell
npm test
```

Expected: PASS for all tests.

- [ ] **Step 3: Run production build**

Run:

```powershell
npm run build
```

Expected: both `build:extension` and `build:webview` complete with no errors.

- [ ] **Step 4: Inspect for deprecated layout system leftovers**

Run:

```powershell
git grep "layout-card\|--layout-\|translateX(3px)\|translateX(-3px)\|max-height: 320px\|repeat(4, minmax(0, 1fr))\|repeat(2, minmax(0, 1fr))" -- src/webview/styles/layouts.css src/webview/layouts
```

Expected: no matches.

- [ ] **Step 5: Start dev build for UI verification**

Run:

```powershell
npm run dev
```

Expected: extension and webview watch builds start without compile errors. Keep this terminal running while doing visual checks.

- [ ] **Step 6: Verify layouts in VS Code Extension Development Host**

Run from VS Code: press `F5` to launch the Extension Development Host.

Open this markdown file in the Extension Development Host:

```text
docs/superpowers/specs/2026-05-22-layout-optimization-design.md
```

Open MarkdownWarriorPreview, then use toolbar layout pills to check `Docs`, `Dashboard`, `Magazine`, and `Story`.

Expected visual results:

```text
Docs:
- Sidebar width scales between 14rem and 20rem.
- Article column reads around 72ch, not full monitor width.
- Header title is large but not hero-sized.
- Sidebar buttons slide right by 2px on hover.

Dashboard:
- Stats reflow automatically at narrow widths; no forced 4-column tablet squeeze.
- Section cards reflow from multi-column to one column without overflow.
- Collapsed card body shows roughly 18rem of content and expands cleanly.

Magazine:
- Hero title uses fluid 3rem to 5rem scale.
- Rail width scales proportionally between 14rem and 18rem.
- Hero has same 135deg/12% gradient language as other hero cards.
- Rail buttons slide right by 2px on hover.

Story:
- Number column scales between 5rem and 8rem.
- Sections no longer create excessive empty vertical whitespace.
- Section numbers rest at 35% opacity and become fully opaque on hover/focus.
- Dot buttons lift upward by 2px on hover.

All layouts:
- Card radius, border, hover lift, shadow, and background feel like one product.
- No layout shows horizontal page overflow at 480px, 720px, or 960px width.
```

- [ ] **Step 7: Stop dev build and commit verification fixes if any were needed**

If Step 6 revealed no fixes, skip this commit. If Step 6 required edits, run targeted tests, `npm test`, and `npm run build` again, then commit the edited files:

```powershell
git add src/webview/styles/layouts.css src/webview/layouts/DocsLayout.svelte src/webview/layouts/DashboardLayout.svelte src/webview/layouts/MagazineLayout.svelte src/webview/layouts/StoryLayout.svelte tests/layout-styles.test.ts tests/docs-layout.test.ts tests/dashboard-layout.test.ts tests/magazine-layout.test.ts tests/story-layout.test.ts
git commit -m @'
fix: polish layout visual regressions

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
'@
```

Expected: commit succeeds only when visual fixes were made.

---

## Spec Coverage Map

- Design tokens in `:root`: Task 1.
- `.layout-card` rename to `.lc-card*`: Tasks 2, 3, 4, 5.
- Shared card hover behavior: Task 1.
- Shared hero gradient at 135deg/12%: Task 1.
- Shared nav transforms: Task 1.
- Shared page spacing rhythm: Task 1 plus layout-specific consumption in Tasks 2, 3, 4, 5.
- Docs grid, 72ch content width, and `--text-3xl` title: Task 2.
- Dashboard `auto-fit`, `auto-fill`, and `18rem` collapsed body: Task 3.
- Magazine `--text-hero`, proportional rail, and `--space-section-xl` hero padding: Task 4.
- Story fluid number column, `min(32rem, 80vh)`, and number opacity: Task 5.
- `npm run build` success: Task 6.
- Visual checks at 480px, 720px, 960px: Task 6.
