# Balanced Layout Cards — Design Spec

## Overview

Upgrade all rich markdown layouts so content cards feel aligned, clean, and consistent even when sections have very different amounts of content. Current card styling is visually acceptable, but short sections look too small beside long sections. New behavior favors balanced width and height over natural content height.

Target layouts:
- Docs
- Magazine
- Story
- Dashboard

Primary outcome: cards share predictable grid width and preview height, long content stays contained, and users can expand when they need full content.

## Goals

- Keep card widths consistent within each layout's grid/container.
- Give content cards a shared minimum/preview height so short sections do not collapse visually.
- Keep long sections from stretching the whole layout by default.
- Support both scroll-in-card and preview expansion for long content.
- Preserve existing markdown behavior for code blocks, tables, images, links, and source-line metadata.
- Avoid changing `DocumentModel`; this is layout/UI behavior.

## Non-goals

- No masonry layout.
- No content-aware section sizing in `layout-engine.ts`.
- No new user setting.
- No redesign of hero headers, sidebars, toolbar, or document parsing.

## Architecture

Add a shared balanced-card styling system in `src/webview/styles/layouts.css`.

Core pieces:
- Shared CSS custom properties for balanced card width/height behavior.
- Shared classes for cards, card body, preview containment, fade edge, and expanded state.
- Layout-specific grid rules remain inside each Svelte layout component.
- Expansion state stays local in each layout component using section keys.

Proposed shared classes:
- `.balanced-card` — base card sizing and layout.
- `.balanced-card__body` — scrollable/preview content area.
- `.balanced-card--preview` — default contained state.
- `.balanced-card--expanded` — full-content state.
- `.balanced-card__fade` or pseudo-element — visual fade at bottom of preview.
- `.balanced-card__toggle` — Show more / Show less control.

Proposed shared tokens:
- `--balanced-card-min-width`
- `--balanced-card-min-height`
- `--balanced-card-preview-height`
- `--balanced-card-max-height`
- `--balanced-card-body-gap`

These tokens can be overridden per layout when needed while keeping one shared behavior model.

## Layout behavior

### Dashboard

Dashboard already uses card sections with a local expanded state. Replace layout-specific body height behavior with shared balanced-card behavior.

Default:
- Grid uses a consistent `repeat(auto-fill, minmax(..., 1fr))` column model.
- Cards use shared preview height.
- Long body content scrolls inside the card.
- Toggle expands/collapses full content.

### Docs

Docs keeps its sidebar and single content column. Each document section becomes a balanced card in the content column.

Default:
- Width remains governed by docs content container.
- Each section card uses shared min/preview height.
- Long content scrolls inside the card until expanded.

### Magazine

Magazine keeps hero + content/rail structure. Each magazine section uses balanced-card behavior.

Default:
- Content column remains the primary width anchor.
- Section cards share preview height.
- Long visual/text sections stay contained until expanded.

### Story

Story keeps section numbers and scroll-snap structure on desktop. The content panel uses balanced-card behavior.

Default:
- Story section min-height can remain for full-screen rhythm.
- Content card uses balanced preview height so short story beats do not look undersized.
- Expansion affects only the content card, not navigation dots or source metadata.

## Overflow and expansion

Default state:
- Body has `max-height: var(--balanced-card-preview-height)`.
- Body uses `overflow: auto` so content remains accessible.
- Card keeps `min-height: var(--balanced-card-min-height)` so short content aligns better.
- A fade edge suggests more content when content extends below preview height.

Expanded state:
- Body uses `max-height: none` or a larger layout-safe value.
- Overflow becomes visible where layout allows, or remains auto for code/table safety.
- Toggle text changes between `Show more` and `Show less`.

Toggle visibility:
- Prefer showing the toggle for all section cards to keep behavior predictable and avoid DOM measurement complexity.
- If later needed, overflow detection can hide toggles for short cards, but this spec does not require it.

## Responsive behavior

Desktop/tablet:
- Enforce stronger card balancing.
- Use consistent grid widths and preview heights.
- Keep long content contained by default.

Mobile:
- Reduce preview height constraints or allow more natural flow.
- Keep toggle behavior.
- Avoid nested scrolling becoming too cramped.
- Preserve horizontal scrolling for tables/pre blocks.

## Accessibility

- Toggle is a real `<button>`.
- Toggle uses `aria-expanded` and `aria-controls`.
- Body IDs derive from section keys and are sanitized.
- Scrollable bodies remain keyboard reachable through normal content focus.
- Existing source-line attributes stay on section/card wrappers.

## Testing

Update or add Vitest coverage for:
- Shared balanced-card classes/tokens in layout style tests.
- Docs renders section cards with balanced-card classes and toggle controls.
- Magazine renders section cards with balanced-card classes and toggle controls.
- Story renders content cards with balanced-card classes and toggle controls.
- Dashboard uses shared balanced-card classes instead of only dashboard-specific height rules.
- Expanded state class/attribute is represented in component markup where tests can assert it.

Run:
- `npm test`
- `npm run build`

## Risks

- Nested scrolling can feel awkward on mobile. Mitigation: relax preview height constraints on small screens.
- Always-visible toggles can be visually noisy for short cards. Mitigation: style toggle subtly and place consistently.
- Story layout expansion could disrupt scroll rhythm. Mitigation: expansion affects content card only and mobile disables strict snap behavior already.

## Acceptance criteria

- All four layouts show content sections/cards with consistent width rules and shared minimum/preview height behavior.
- Short cards no longer appear visually collapsed beside long cards.
- Long cards do not stretch the layout by default.
- Users can scroll preview content and expand/collapse full content.
- Tables and code blocks remain usable without overflowing horizontally.
- Existing source-line metadata and section navigation keep working.
- Tests and build pass.
