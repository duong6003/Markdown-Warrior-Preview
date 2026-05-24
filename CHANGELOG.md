# Changelog

## [0.4.1] - 2026-05-24

### Added
- Export dropdown button ("⬇ Export ▾") in the preview toolbar. Click to reveal two options: Export as HTML and Export as PDF — no Command Palette needed.
- Dropdown closes automatically after selecting an option or clicking outside.

---

## [0.4.0] - 2026-05-24

### Added
- HTML export now matches the active preview configuration: selected theme colors, body/heading/code font choices, and Shiki syntax theme.
- Google Fonts used by the preview can be embedded into exported HTML as base64 `woff2` data for offline viewing.
- Export flow warns before embedding Google Fonts and supports using system fallback fonts instead.
- Font selections sync from the webview to the extension host so export commands can use the current preview typography.

### Changed
- Font registry is shared between the webview and extension host.
- Exported HTML uses baked-in theme CSS variables instead of `prefers-color-scheme`, making the output stable across environments.

### Fixed
- Exported code blocks now render with the selected theme's Shiki colors.

---

## [0.3.0] - 2026-05-23

### Added
- Ghost nav gradient strip: a 3 px accent-colored strip at the left edge signals "hover here" when the overlay nav is available. Fades out when the panel opens.

### Changed
- `docs` and `magazine` layouts consolidated into a single **Article** layout. Article is the new general-purpose reading layout for all long-form content.
- Layout toolbar and auto-detection now show `Article` instead of `Magazine`/`Docs`.
- Saved `layoutOverride: 'docs'` or `'magazine'` from previous versions gracefully falls back to auto-detect — no migration needed.

### Removed
- `Docs` layout removed (was redundant after the ghost nav refactor — both layouts shared the same overlay nav and section-card structure).

---

## [0.2.0] - 2026-05-23

### Added
- **Ghost Nav** (`GhostNav.svelte`): hover-triggered overlay navigation for Docs and Magazine layouts. Replaces the permanent sidebar and rail — content now uses the full viewport width.
- Hover trigger zone: fixed 20 px strip at the left edge. Panel appears via a smooth fly transition (`x: −220`, 180 ms, `cubicOut`).
- 150 ms debounce ensures a smooth handoff between the edge zone and the panel without flicker.
- Panel is centered vertically and respects deep (H3+) headings with indented entries.
- Mobile: ghost nav hidden at ≤ 900 px (full-width layout retained).

---

## [0.1.0] - 2026-05-23

### Added
- First public release of Markdown Warrior Preview under the `markdown-warrior-view` package name.
- Rich Markdown preview for VS Code with readable typography, local image support, frontmatter display, tables, task lists, and collapsible headings.
- Automatic and manual rich layouts: Auto, Docs, Magazine, Story, and Dashboard.
- 12 built-in full theme packs with preview colors, markdown UI colors, syntax highlighting, font stack, and surface styling.
- Theme side panel with global persistence across files and VS Code sessions.
- Shiki syntax highlighting with per-theme rendering.
- Mermaid diagram rendering.
- KaTeX inline and block math rendering.
- Two-way scroll sync between editor and preview.
- Presentation mode using `---` slide separators and optional speaker notes.
- Export commands for standalone HTML and browser-based PDF output.
