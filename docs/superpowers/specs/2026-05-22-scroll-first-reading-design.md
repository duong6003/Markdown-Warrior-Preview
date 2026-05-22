# Scroll-First Reading Experience — Design Spec

## Overview

Replace the current "always-clip" balanced card system with a content-aware clipping strategy. Cards render at their natural height by default; only sections whose rendered content exceeds a viewport-relative threshold receive a clip cap and a "Show more" toggle. The `docs` layout removes clipping entirely.

**Goal:** Reading a markdown document should require scrolling, not clicking. "Show more" becomes a last resort for genuinely long sections, not the default state for every card.

**Affected layouts:** `dashboard`, `magazine`, `story` (content-aware clip), `docs` (no clip).

---

## Problem

`balanced-card__body` has a hardcoded `max-height: clamp(13rem, 28vh, 19rem)` applied to every card in every layout. This means:

- A 2-line section is clipped to 19rem and shows a "Show more" button.
- A 50-line section is also clipped to the same height — both look identical until expanded.
- The reader must click "Show more" on almost every card before reading anything.
- Dashboard cards also have `min-height: clamp(18rem, 34vh, 24rem)`, making short-content cards look padded and empty.

---

## Architecture

### New file: `src/webview/lib/clip-detect.ts`

A Svelte action that measures whether a card body's rendered content exceeds a threshold, and fires a callback when the answer changes.

```
clipDetect(node: HTMLElement, onUpdate: (needsClip: boolean) => void)
  threshold = max(window.innerHeight × 0.65, 640px)
  ResizeObserver → check scrollHeight > threshold → call onUpdate
  returns { destroy } for Svelte action cleanup
```

**Threshold rationale:** `max(65vh, 640px)` means:
- On a 900px tall panel: threshold ≈ 585px (~36rem) — roughly 4–5 paragraphs or a medium code block.
- On a 600px panel: threshold = 640px = 40rem (minimum floor).
- Typical markdown sections (1–3 paragraphs + code) are 15–28rem — well below threshold. Only unusually long sections (full API references, long narrative passages) get clipped.

**ResizeObserver:** Re-checks whenever the element resizes — handles async-rendered content (Mermaid diagrams, images) that could push height above the threshold after initial paint.

### CSS: `src/webview/styles/layouts.css`

**Removed:**
- `--balanced-card-preview-height` variable (was the always-on clip height)
- `max-height` from `.balanced-card__body` default rules
- `overflow: auto` and `scrollbar-width` from `.balanced-card__body` default rules
- `transition: max-height` from `.balanced-card__body` default rules
- `.balanced-card--expanded .balanced-card__body` overrides
- `.balanced-card--expanded .balanced-card__body::after { display: none }` rule
- `min-height` from `.balanced-card` (was `clamp(18rem, 34vh, 24rem)`)

**Added:**
- `--balanced-card-clip-height: clamp(32rem, 65vh, 52rem)` — the clip cap applied only to tall cards
- `.balanced-card--clippable .balanced-card__body` — applies `max-height`, `overflow: auto`, `scrollbar-width: thin`, `transition: max-height 0.2s ease`
- `.balanced-card--clippable.balanced-card--expanded .balanced-card__body` — expands to `var(--balanced-card-max-height)`
- `.balanced-card--clippable:not(.balanced-card--expanded) .balanced-card__body::after` — the fade-out gradient, scoped to clipped-and-collapsed state only

**Changed:**
- `--balanced-card-min-width: 18rem` → `22rem` (dashboard cards were too narrow on typical VS Code panel widths)

### Layout changes

#### `DocsLayout.svelte`

Remove all balanced-card machinery:
- Remove `import { balancedCardBodyId, balancedCardToggleLabel }`
- Remove `expanded` state and `toggleSection` function
- Remove `balanced-card balanced-card--preview` classes from `<section>`
- Remove `class:balanced-card--expanded`
- Remove `id={balancedCardBodyId(...)}` from body div
- Remove `<button class="balanced-card__toggle">` entirely

Result: docs sections are plain `lc-card` elements with `docs-section__body` padding. Content flows at natural height.

#### `DashboardLayout.svelte`, `MagazineLayout.svelte`, `StoryLayout.svelte`

Apply the same pattern to all three:

**State additions:**
```ts
let needsClip = $state<Record<string, boolean>>({});
```

**Class changes on the card/section element:**
```svelte
// Remove: balanced-card--preview (always-on)
// Add:
class:balanced-card--clippable={needsClip[section.key]}
```

**On the card body div:**
```svelte
use:clipDetect={(needs: boolean) => { needsClip[section.key] = needs; }}
```

**Toggle button — conditional render:**
```svelte
{#if needsClip[section.key]}
  <button class="balanced-card__toggle" ...>
    {balancedCardToggleLabel(Boolean(expanded[section.key]))}
  </button>
{/if}
```

---

## Data Flow

```
HTML content injected into card body
        ↓
ResizeObserver fires on body element
        ↓
clipDetect compares scrollHeight > threshold
        ↓
needsClip[sectionKey] = true | false
        ↓
┌─ needsClip = false ──────────────────┐
│  Card renders at natural height      │
│  No toggle button                    │
│  No fade gradient                    │
└──────────────────────────────────────┘
┌─ needsClip = true ───────────────────┐
│  .balanced-card--clippable applied   │
│  max-height clips body               │
│  Fade gradient appears at bottom     │
│  Toggle button renders               │
│    → click → balanced-card--expanded │
│    → body expands to max-height      │
└──────────────────────────────────────┘
```

---

## Edge Cases

**Async content (Mermaid, images):** `ResizeObserver` handles this — when an image or diagram loads and increases the body height, the observer fires again and re-evaluates the threshold.

**Section content updates (live preview):** When the extension sends new HTML, sections re-render. The `use:` action is re-run on the updated body element, `ResizeObserver` resets, and `needsClip` is recalculated.

**`prefers-reduced-motion`:** The `transition: max-height 0.2s ease` on clippable bodies is covered by the existing `prefers-reduced-motion` block in `layouts.css`, which sets all transitions to 1ms.

**Story layout `min-height: min(32rem, 80vh)` on `.story-section`:** This is on the section container, not the card. It remains unchanged — the story section still has minimum height for visual rhythm. The card inside it loses its own min-height but inherits the section space.

---

## Files Changed

| File | Change |
|---|---|
| `src/webview/lib/clip-detect.ts` | New file — Svelte action |
| `src/webview/styles/layouts.css` | Replace always-on clip with conditional |
| `src/webview/layouts/DocsLayout.svelte` | Remove balanced-card entirely |
| `src/webview/layouts/DashboardLayout.svelte` | Use clip-detect, conditional toggle |
| `src/webview/layouts/MagazineLayout.svelte` | Use clip-detect, conditional toggle |
| `src/webview/layouts/StoryLayout.svelte` | Use clip-detect, conditional toggle |

No changes to: `balanced-card.ts`, `layout-engine.ts`, `types/layout.ts`, extension host code.

---

## Success Criteria

- A section with ≤ 3 paragraphs renders fully with no toggle button visible.
- A section with 6+ dense paragraphs or multiple large code blocks gets clipped and shows toggle.
- The `docs` layout never shows a "Show more" button regardless of section length.
- Dashboard cards with short content no longer have excessive empty space.
- Async content (diagrams, images) triggers correct re-evaluation after load.
- No visual regression in `prefers-reduced-motion` mode.
