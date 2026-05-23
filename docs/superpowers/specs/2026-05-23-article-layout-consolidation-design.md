# Article Layout Consolidation & Ghost Nav Affordance — Design Spec

**Date:** 2026-05-23
**Phase:** Display Experience Optimization (continued)

---

## Problem

1. `docs` and `magazine` layouts are functionally redundant after the ghost nav refactor — both use the same overlay nav, hero header, and section cards. Maintaining two layouts doubles the surface for divergence.
2. The ghost nav edge zone is invisible, giving users no affordance that hover interaction is available at the left edge.

---

## Goals

1. Remove the `docs` layout entirely. Rename `magazine` → `article` to reflect its role as a general-purpose reading layout for all long-form content.
2. Add a visible gradient strip at the left edge that signals "hover here" and disappears when the nav panel is open.

---

## Design

### Part 1: Layout Consolidation

#### Files deleted
- `src/webview/layouts/DocsLayout.svelte`
- `tests/docs-layout.test.ts`

#### Files renamed / updated
- `src/webview/layouts/MagazineLayout.svelte` → `src/webview/layouts/ArticleLayout.svelte`
  - All CSS class prefixes `magazine-*` → `article-*`
  - Kicker text `"Markdown Warrior"` → `"Article"`
  - Component-internal variable names updated accordingly
- `tests/magazine-layout.test.ts` → `tests/article-layout.test.ts`
  - All string assertions updated: `magazine-*` → `article-*`, `"Markdown Warrior"` → `"Article"`, import path updated

#### Type system (`src/webview/types/layout.ts`)

```typescript
export const LAYOUT_TYPES = ['article', 'story', 'dashboard'] as const;
// 'docs' removed, 'magazine' renamed to 'article'
```

`LayoutType` and `LayoutOverride` derive from `LAYOUT_TYPES` — no other changes needed in this file.

#### Detection engine (`src/webview/lib/layout-engine.ts`)

- `LAYOUT_PRIORITY` changes from `['story', 'dashboard', 'docs', 'magazine']` → `['story', 'dashboard']`
- `detectLayout()` scores map:
  - Remove `docs` score block entirely
  - Rename `magazine` key → `article` (score formula unchanged: `paragraphCount + imageCount * 2 + blockquoteCount + 2`)
- `article` remains the baseline — its `+ 2` constant ensures it wins when story and dashboard scores are both zero
- `resolveLayout()` and `isLayoutType()` use `LAYOUT_TYPES` — automatically correct after type update

#### App.svelte (`src/webview/App.svelte`)

- Remove `import DocsLayout`
- Change `import MagazineLayout` → `import ArticleLayout from './layouts/ArticleLayout.svelte'`
- Remove `{:else if selectedLayout === 'docs'}` branch
- Change `{#if selectedLayout === 'magazine'}` → `{#if selectedLayout === 'article'}`

#### LayoutToolbar (`src/webview/components/LayoutToolbar.svelte`)

- Remove `docs: 'Docs'` from `labels` map
- Remove `{ value: 'docs', label: 'Docs' }` from `options` array
- Change `magazine: 'Magazine'` → `article: 'Article'` in `labels`
- Change `{ value: 'magazine', label: 'Magazine' }` → `{ value: 'article', label: 'Article' }` in `options`

#### Shared stylesheet (`src/webview/styles/layouts.css`)

Remove the now-dead interaction state rules for the removed sidebar and rail:
```css
/* Remove these two selectors from the hover rule group: */
.docs-sidebar button:hover,
.magazine-rail button:hover,
```

Keep `.story-dots button:hover` and `.layout-toolbar__pill:hover` — those are still active.

#### Test: `tests/layout-styles.test.ts`

Remove assertions referencing the deleted rules:
```typescript
// Remove:
expect(source).toContain('.docs-sidebar button:hover,');
expect(source).toContain('.magazine-rail button:hover,');
```

---

### Part 2: Ghost Nav Gradient Strip

**File:** `src/webview/lib/GhostNav.svelte`

**DOM addition:**
```svelte
<div class="ghost-nav">
  <div class="ghost-strip" class:hidden={navVisible}></div>
  <div class="ghost-edge-zone" ...></div>
  {#if navVisible}
    <nav class="ghost-nav-panel" ...>...</nav>
  {/if}
</div>
```

**CSS addition:**
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

**Behavior:** Strip is always rendered when `sections.length > 1`. It fades out when `navVisible` is true (panel has appeared). No JS required beyond binding existing `navVisible` state to `class:hidden`. Mobile: hidden along with the rest of `.ghost-nav` via existing `display: none` rule.

---

## Testing

| File | Change |
|---|---|
| `tests/docs-layout.test.ts` | Delete |
| `tests/magazine-layout.test.ts` | Rename → `article-layout.test.ts`, update all class/string assertions |
| `tests/ghost-nav.test.ts` | Add: strip element present, `class:hidden={navVisible}`, gradient CSS |
| `tests/layout-styles.test.ts` | Remove `.docs-sidebar button:hover` and `.magazine-rail button:hover` assertions |

---

## Out of Scope

- Frontmatter `layout: docs` compatibility (extension not yet widely distributed)
- Keyboard navigation for ghost nav panel
- Docs-type detection score being merged into article score (article is already the baseline fallback)
- Saved `layoutOverride: 'docs'` or `'magazine'` in webview state: `isLayoutType()` returns false for invalid values, `resolveLayout()` falls back to auto — graceful degradation, no migration needed
