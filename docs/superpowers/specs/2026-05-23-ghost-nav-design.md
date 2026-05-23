# Ghost Navigation — Design Spec

**Date:** 2026-05-23  
**Phase:** Display Experience Optimization  
**Scope:** Docs layout, Magazine layout

---

## Problem

Docs and Magazine layouts both dedicate 18–24% of horizontal width to a permanent navigation sidebar/rail. This sidebar is always visible, even when users are not navigating — it compresses content width without adding value during active reading.

## Goal

Give 100% of the display width to content. Navigation becomes available on demand when the user needs it, triggered by hovering near the left edge of the preview.

---

## Design

### Behavior

- A 20px invisible edge zone sits fixed at the left side of the preview viewport at all times.
- When the cursor enters the edge zone, a navigation panel slides in from the left (overlay, not push).
- The panel stays visible while the cursor is over either the edge zone or the panel itself.
- When the cursor leaves both zones, the panel slides back out after a 150ms debounce.
- No pin/lock. Pure hover-only.
- On mobile (≤900px), GhostNav does not render. The existing horizontal strip nav behavior on mobile is preserved.

### Trigger & Handoff

Hover state uses a 150ms debounce to prevent flicker during the mouse handoff from edge zone to panel:

- `showNav()` — clears pending hide timeout, sets `navVisible = true`
- `scheduleHide()` — sets a 150ms timeout to set `navVisible = false`

Both edge zone (`mouseenter`/`mouseleave`) and nav panel (`mouseenter`/`mouseleave`) call `showNav` and `scheduleHide` respectively. This is the standard pattern for dropdown menus.

### Visual

**Edge zone:**
- `position: fixed`, left: 0, top: 0, bottom: 0, width: 20px
- Transparent, `pointer-events: all`
- Cursor: `pointer` on hover to signal interactivity

**Nav panel (when visible):**
- `position: fixed`, left: 0, top: 50%, `transform: translateY(-50%)`
- Width: `clamp(12rem, 22vw, 16rem)`
- Background: `color-mix(in srgb, var(--md-bg-primary) 92%, black 8%)`
- `backdrop-filter: blur(8px)`
- Border-right: `1px solid color-mix(in srgb, var(--md-border) 60%, var(--md-accent) 40%)`
- Box shadow: `4px 0 24px rgba(0,0,0,0.35)`
- Svelte transition: `fly({ x: -220, duration: 180, easing: cubicOut })`

**Section buttons:**
- Reuse font, padding, and hover color from current sidebar/rail style
- Deep sections (level > 2) indent with smaller font weight, same as current
- No active/current-section highlighting in this phase

---

## Architecture

### New file: `src/webview/lib/GhostNav.svelte`

```typescript
interface Props {
  sections: DocumentSection[];
  onNavigate: (key: string, id: string) => void;
}
```

Internal state:
```typescript
let navVisible = $state(false);
let hideTimeout: ReturnType<typeof setTimeout>;
```

DOM structure:
```
<div class="ghost-nav">               <!-- fixed wrapper, z-index: 100 -->
  <div class="ghost-edge-zone"        <!-- 20px, full height -->
    onmouseenter={showNav}
    onmouseleave={scheduleHide}
  />
  {#if navVisible}
    <nav class="ghost-nav-panel"      <!-- fly transition x:-220 -->
      transition:fly={...}
      onmouseenter={showNav}
      onmouseleave={scheduleHide}
    >
      {#each sections as section}
        <button onclick={() => onNavigate(section.key, section.id)}>
          {section.title}
        </button>
      {/each}
    </nav>
  {/if}
</div>
```

### Modified: `src/webview/layouts/DocsLayout.svelte`

- Remove `<aside class="docs-sidebar">` and all sidebar CSS
- Keep `showTOC` prop in the component signature (same reason as Magazine above). Prop becomes unused.
- Remove `hasSidebar` derived state
- Change grid from 2-column to 1-column: `grid-template-columns: 1fr`
- Increase content `max-width` from `72ch` to `80ch`
- Add `<GhostNav sections={model.sections} onNavigate={scrollToSection} />`
- Keep `scrollToSection` function unchanged

### Modified: `src/webview/layouts/MagazineLayout.svelte`

- Remove `<aside class="magazine-rail">` and all rail CSS
- Keep `showTOC` prop in the component signature — App.svelte passes it to all layouts and removing it would require changing App.svelte. The prop becomes unused in the layout itself.
- GhostNav renders whenever `sections.length > 1`, independent of `showTOC`. Since ghost nav is non-intrusive (only visible on hover), gating it on `showTOC` is not necessary.
- Change `magazine-grid` from 2-column to single column
- Add `<GhostNav sections={model.sections} onNavigate={scrollToSection} />`
- Keep `scrollToSection` function unchanged

### Data Flow

No changes to extension host, message bridge, or markdown engine. Change is presentation-layer only:

```
PreviewProvider → webview message → App.svelte → DocsLayout / MagazineLayout
                                                          ↓
                                                    GhostNav.svelte
                                                    (sections[], onNavigate)
```

---

## Testing

| File | Change |
|---|---|
| `tests/ghost-nav.test.ts` | New. Render with sections, render with 0 sections, render with 1 section, section key sanitization |
| `tests/docs-layout.test.ts` | Remove sidebar assertions, add GhostNav render assertion |
| `tests/magazine-layout.test.ts` | Remove rail assertions, add GhostNav render assertion |

---

## Out of Scope

- Scroll tracking / active section highlight
- Story and Dashboard layouts (no sidebar navigation, unchanged)
- Animation tuning beyond initial values
- Keyboard navigation for ghost nav panel
