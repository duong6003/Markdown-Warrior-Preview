# Layout Optimization — Design Spec

**Date:** 2026-05-22
**Scope:** `src/webview/styles/layouts.css`, `src/webview/layouts/*.svelte`
**Goal:** Rebuild layout visual language from the token layer up — fixing spacing inconsistency (A), grid proportions (C), and cross-layout design coherence (D).

---

## Problem Statement

All four layouts (Docs, Dashboard, Magazine, Story) were built incrementally and lack a shared design system. Specific issues:

- **Spacing:** Each layout defines its own `clamp()` values with no shared tokens — padding values differ by 2–4px between layouts for no reason.
- **Proportions:** Grid column ratios use absolute `px` widths that don't scale proportionally; Dashboard stats and card grid force fixed column counts.
- **Consistency:** Card hover, nav interaction states, header gradient angles/opacities, and font sizes are each defined independently — the four layouts look like four different products.

**Target aesthetic:** Modern SaaS — Vercel/Figma style. Rounded cards, generous whitespace, subtle gradients, soft shadows.

---

## Design Token System

All tokens live in `styles/layouts.css` `:root`. They replace the current `--layout-*` variables entirely.

### Spacing Scale

Two tiers — fluid for layout-level, 8pt grid for component-level.

**Section-level (fluid):**

```css
--space-section-xs:  clamp(1rem,   2vw, 1.5rem);   /* gap inside card */
--space-section-sm:  clamp(1.5rem, 3vw, 2.5rem);   /* card padding */
--space-section-md:  clamp(2rem,   4vw, 3.5rem);   /* gap between cards */
--space-section-lg:  clamp(3rem,   5vw, 5rem);     /* hero padding */
--space-section-xl:  clamp(4rem,   7vw, 7rem);     /* page top padding */
```

**Component-level (8pt grid, fixed):**

```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
```

### Typography Scale

Major Third (1.25×) modular scale. All layout headings and labels must pull from this scale — no ad-hoc font sizes.

```css
--text-xs:   0.75rem;                          /* line-height: 1.4 — eyebrow, caption */
--text-sm:   0.875rem;                         /* line-height: 1.4 — nav label, badge */
--text-base: 1rem;                             /* line-height: 1.6 — body */
--text-lg:   1.25rem;                          /* line-height: 1.4 — lead, subheading */
--text-xl:   1.563rem;                         /* line-height: 1.3 — h3 section */
--text-2xl:  1.953rem;                         /* line-height: 1.2 — h2 layout */
--text-3xl:  clamp(2.4rem, 5vw, 3.5rem);      /* line-height: 1.1 — h1 section */
--text-hero: clamp(3rem,   7vw, 5rem);         /* line-height: 0.98 — hero display only */
```

### Visual Tokens

```css
/* Border radius */
--radius-sm:   6px;
--radius-md:   10px;
--radius-lg:   16px;
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.10);
--shadow-md: 0 4px 6px rgba(0,0,0,.05), 0 10px 15px rgba(0,0,0,.10);
--shadow-lg: 0 10px 15px rgba(0,0,0,.04), 0 20px 25px rgba(0,0,0,.10);
```

---

## Shared Visual Language

These patterns are used identically across all four layouts.

### Card System

Three variants replace the current single `.layout-card`:

| Class | Use | Style |
|-------|-----|-------|
| `.lc-card` | Default card | border + `--radius-md` + `--shadow-sm` + bg-secondary |
| `.lc-card--hero` | Hero/header block | `--radius-lg` + `--shadow-md` + gradient accent overlay |
| `.lc-card--flat` | Nav panels, sidebars | border only, no shadow |

**Hover (all cards):** `--shadow-md` + `translateY(-2px)` — uniform, defined once in `layouts.css`.

### Header Pattern

Every layout's hero/header block follows this structure and scale:

```
Eyebrow:  --text-xs, uppercase, letter-spacing 0.08em, color: var(--md-accent)
Title:    --text-hero (fluid), font-weight 800, max-width 16ch
Desc:     --text-base or --text-lg, max-width 60ch, color: var(--md-fg-secondary)
```

**Gradient:** `linear-gradient(135deg, color-mix(in srgb, var(--md-accent) 12%, transparent), transparent 45%)`

The angle (135°) and opacity (12%) are fixed across all layouts. Current codebase has 14%, 16%, 18% with different angles — all normalized to 12%/135°.

### Navigation Interaction States

Applies to Docs sidebar buttons, Magazine rail buttons, Story dots — uniform interaction language:

```
Resting:  color fg-secondary, background transparent
Hover:    color fg-primary, background accent/10%, translateX(2px)
Active:   color fg-primary, background accent/16%, font-weight 600
```

Current codebase uses `translateX(3px)` in some places, `translateY(-1px)` in others — normalized to `translateX(2px)` for horizontal navs, `translateY(-2px)` for vertical.

### Page Spacing Rhythm

All layouts share the same outer spacing:

```
Page padding-block-start: --space-section-xl
Page padding-inline:      --space-section-md
Gap between layout blocks: --space-section-md
Gap inside cards:          --space-section-xs or --space-section-sm
```

---

## Layout-specific Changes

### DocsLayout

**Grid:**
```css
grid-template-columns: clamp(14rem, 22%, 20rem) minmax(0, 1fr);
```
Sidebar width expressed as percentage with clamp bounds — scales with viewport.

**Content max-width:** `72ch` applied to the article element for readability.

**Header title:** Switch from `clamp(2.4rem, 7vw, 4.6rem)` to `--text-3xl` — appropriate for a docs context, not a hero page.

### DashboardLayout

**Stats grid:**
```css
grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
```
Removes forced 4-column layout; adapts naturally on tablet/mobile without explicit breakpoints.

**Section grid:**
```css
grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr));
```
Cards reflow naturally instead of forcing 2 columns.

**Card body collapsed height:** `max-height: 18rem` (from `320px`) — equivalent to ~3 paragraphs, more semantically meaningful.

### MagazineLayout

**Hero title:** Replace hardcoded `5rem` with `--text-hero` (`clamp(3rem, 7vw, 5rem)`).

**Grid:**
```css
grid-template-columns: minmax(0, 1fr) clamp(14rem, 24%, 18rem);
```
Rail expressed as percentage with clamp — proportional to content column.

**Hero padding:** `--space-section-lg` → `--space-section-xl` for breathing room.

### StoryLayout

**Section grid:**
```css
grid-template-columns: clamp(5rem, 10vw, 8rem) minmax(0, 1fr);
```
Number column fluid with viewport — not clamped to narrow `6rem`.

**Section min-height:** `min(32rem, 80vh)` — less aggressive than current `min(42rem, calc(100vh - 3rem))`, avoids empty whitespace on large monitors.

**Number opacity:** `0.35` at rest, `1.0` on section hover — creates hierarchy without competing with content.

---

## Files Changed

| File | Change type |
|------|-------------|
| `src/webview/styles/layouts.css` | Full rewrite of `:root` tokens + `.lc-card*` + shared nav/hover rules |
| `src/webview/layouts/DocsLayout.svelte` | Grid ratio, header title scale, content max-width |
| `src/webview/layouts/DashboardLayout.svelte` | auto-fit stats, auto-fill grid, card body height |
| `src/webview/layouts/MagazineLayout.svelte` | Hero clamp, rail ratio, hero padding |
| `src/webview/layouts/StoryLayout.svelte` | Number column fluid, min-height, number opacity |

**Not touched:** `markdown-body.css`, `theme-bridge.css`, `animations.css`, `extensions.css`, all extension host code, message protocol.

---

## Success Criteria

- All four layouts share identical card hover behavior (verified by inspection)
- No ad-hoc font sizes outside the `--text-*` scale in any layout file
- Dashboard stats and grid reflow correctly at 480px, 720px, 960px viewports
- Hero gradient angle and opacity identical across Docs/Dashboard/Magazine
- `npm run build` passes with no errors
