# Rich Layout Engine — Design Spec

## Overview

Markdown Warrior Preview will support multiple visual document layouts so markdown can feel like a designed web page instead of a plain top-to-bottom article. The feature adds a webview-side layout engine, automatic layout detection, frontmatter override, and a toolbar override.

V1 layouts:
- `magazine`
- `docs`
- `story`
- `dashboard`

Default behavior is automatic detection. Existing markdown files continue to work without edits.

## Goals

- Make normal markdown render as visually rich pages with stronger sectioning, cards, panels, buttons, and balanced animation.
- Provide 4 distinct layout modes for different document shapes.
- Auto-select layout from markdown structure.
- Allow explicit override through frontmatter and temporary override through toolbar.
- Preserve existing preview features: TOC, scroll sync, state persistence, Mermaid, KaTeX, checkboxes, local images, and presentation mode.

## Non-goals

- No new markdown syntax in V1.
- No replacement of current presentation mode.
- No heavy parallax or high-motion effects by default.
- No AI-based layout inference.

## Architecture

The webview will render through a new layout selection layer instead of always rendering one `.markdown-body` container.

```text
Host markdown render
  -> HTML + sourceMap + frontmatter
  -> Webview App.svelte
  -> LayoutEngine creates DocumentModel
  -> layout selector picks layout
  -> layout component renders html/model
```

New webview modules:

- `src/webview/lib/layout-engine.ts`
  - Parses HTML into a document model.
  - Computes layout detection signals.
  - Selects layout from frontmatter, toolbar override, or auto detection.

- `src/webview/types/layout.ts`
  - Defines `LayoutType`, `DocumentModel`, `DocumentSection`, and detection metadata.

New layout components:

- `src/webview/layouts/MagazineLayout.svelte`
- `src/webview/layouts/DocsLayout.svelte`
- `src/webview/layouts/StoryLayout.svelte`
- `src/webview/layouts/DashboardLayout.svelte`
- `src/webview/components/LayoutToolbar.svelte`

`App.svelte` remains the coordinator. It receives messages, stores HTML, applies layout state, renders `LayoutToolbar`, then renders the chosen layout component.

## Layout selection priority

1. Frontmatter override, if valid.
2. Toolbar override stored in webview state.
3. Auto detection.
4. `magazine` fallback.

Supported frontmatter:

```yaml
---
layout: docs
title: My Docs
description: Short intro
---
```

Valid layout values: `magazine`, `docs`, `story`, `dashboard`.

Toolbar choices:

- `Auto: <detected layout>`
- `Magazine`
- `Docs`
- `Story`
- `Dashboard`

Toolbar override does not edit markdown. It persists through `vscode.setState` for the current preview session.

## Document model

`LayoutEngine` will use `DOMParser` in the webview to analyze rendered HTML.

```ts
type LayoutType = 'magazine' | 'docs' | 'story' | 'dashboard';

interface DocumentModel {
  title: string;
  description: string;
  sections: DocumentSection[];
  stats: DocumentStats;
  signals: LayoutSignals;
  detectedLayout: LayoutType;
}

interface DocumentSection {
  id: string;
  title: string;
  level: number;
  html: string;
  sourceLine?: number;
  blockTypes: string[];
}
```

Source-line attributes must remain in rendered HTML. Layout components may wrap content, but they must not strip `data-source-line` attributes because scroll sync depends on them.

## Auto detection rules

Detection uses structural signals from rendered HTML:

- `story`
  - Many `<hr>` separators, or short sections with large headings.
  - Best for landing pages, portfolio-style content, presentation-like documents.

- `dashboard`
  - Many tables, task list checkboxes, dense lists, numbers, or short sections.
  - Best for reports, project status, checklists, metrics, README dashboards.

- `docs`
  - Deep heading structure, many code blocks, lists, and technical sections.
  - Best for documentation and technical notes.

- `magazine`
  - Default when other signals are not dominant.
  - Best for articles, essays, blog-style docs, mixed media pages.

Detection should be deterministic and unit-tested. If scores tie, priority is `story`, then `dashboard`, then `docs`, then `magazine`.

## Layout details

### Magazine layout

Purpose: make article-like markdown feel editorial and polished.

Features:
- Hero area from frontmatter title or first `h1`.
- Subtitle from frontmatter description or first paragraph.
- Content grouped by `h2` into large section cards.
- Images, tables, blockquotes, and code blocks receive featured visual treatment.
- TOC becomes a subtle right rail when enabled.

### Docs layout

Purpose: make technical docs feel like a modern documentation app.

Features:
- Persistent sidebar TOC.
- Sticky topbar with layout switch and reading progress.
- `blockquote` rendered as callout cards.
- Code blocks rendered as panels.
- Sections grouped around heading hierarchy.
- Dense but readable spacing.

### Story layout

Purpose: make content feel like a scroll-based landing page without replacing presentation mode.

Features:
- Sections created from `<hr>` separators or major headings.
- Each section uses full-screen-ish vertical spacing.
- Soft scroll snap.
- Section dots or compact nav.
- Reveal animation per section.
- No heavy parallax in V1.

### Dashboard layout

Purpose: make status docs, reports, and project READMEs feel like visual dashboards.

Features:
- Summary cards at top for document stats, heading count, table count, code block count, and task progress when tasks exist.
- Sections rendered as grid cards.
- Tables in responsive panels.
- Lists in card blocks.
- Long cards can expand/collapse.

## Interactions

- Layout toolbar uses pill-style buttons.
- Active layout has clear selected state.
- TOC entries highlight on hover and active section.
- Cards lift slightly on hover.
- Story layout has section nav dots.
- Dashboard long cards can expand/collapse.

## Animation policy

Motion is balanced by default:

- Initial reveal: fade + translate 12px.
- Scroll reveal: `IntersectionObserver` adds visible class.
- Hover lift: 2-4px.
- Border/accent glow: subtle only.
- Story sections use scroll snap and reveal, not heavy parallax.
- Respect `prefers-reduced-motion: reduce` by disabling transforms and long transitions.

## Existing feature compatibility

- Presentation mode stays separate. `SlideView.svelte` behavior is unchanged.
- Scroll sync continues to use existing `data-source-line` attributes.
- Checkbox interactions still work because layout components render original input elements.
- Mermaid and KaTeX post-render hooks still run after HTML updates in document layouts.
- TOC remains available, but visual placement differs by layout.
- Export HTML/PDF stays on the current document-mode rendering in V1. Layout-aware export is a follow-up task, not part of this spec.

## State persistence

Extend webview state with:

```ts
interface WebviewState {
  scrollPosition: number;
  collapsedHeadings: string[];
  tocVisible: boolean;
  mode: 'document' | 'presentation';
  layoutOverride: LayoutType | 'auto';
}
```

`layoutOverride: 'auto'` means detection is active.

## Testing

Unit tests:
- Detects `story` from repeated `hr` or short large sections.
- Detects `dashboard` from tables, checkboxes, dense lists, and numeric/status content.
- Detects `docs` from deep headings, code blocks, and technical list structure.
- Falls back to `magazine` for article-like content.
- Frontmatter layout override wins over auto detection.
- Invalid frontmatter layout falls back to auto detection.

Build/manual verification:
- `npm run build`
- `npm run test`
- Open markdown preview in VS Code.
- Verify auto layout selection on representative sample markdown files.
- Verify toolbar override changes layout without editing markdown.
- Verify scroll sync still works in each layout.
- Verify TOC and animations work.
- Verify `prefers-reduced-motion` disables motion-heavy effects.

## Rollout

V1 should ship as default auto-detect behavior. Existing markdown requires no migration. If a layout feels wrong, the user can choose another layout from toolbar or set `layout` in frontmatter.
