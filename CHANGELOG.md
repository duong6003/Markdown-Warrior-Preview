# Changelog

## [0.6.0] - 2026-05-22

### Added
- 12 built-in full theme packs (color scheme + syntax highlighting + font + spacing).
- Theme side panel — toggle with 🎨 in the toolbar, grouped into Dark and Light sections.
- Per-theme Shiki syntax highlighting (Catppuccin, GitHub, Dracula, Tokyo Night, Nord, High Contrast, Vesper, Pitch Black, Sepia, Solarized Light).
- Theme persists globally across all files and VS Code sessions via `globalState`.

## [0.5.0] - 2026-05-22

### Added
- Content-aware clipping for Dashboard, Magazine, and Story section cards.
- `clipDetect` webview action that measures rendered content and reacts to viewport resizing.

### Changed
- Cards render at natural height by default — no longer clipped on every section.
- "Show more" toggle only appears when content genuinely exceeds 65 % of viewport height.
- Docs layout removes card clipping entirely for a continuous scroll reading experience.
- Dashboard, Magazine, and Story use a `ResizeObserver` + viewport resize listener to detect overflow.
- Docs layout now renders sections at natural height for full scroll reading.
- Balanced-card clipping now applies only when rendered content exceeds the viewport-relative threshold.

## [0.4.0] - 2026-05-22

### Added
- Shared balanced-card behavior across Docs, Magazine, Story, and Dashboard.
- Consistent card min-widths and min-heights via shared CSS tokens.
- Expandable card bodies with "Show more / Show less" accessibility toggles.
- `balanced-card.ts` helper for sanitized body IDs and toggle labels.

## [0.3.0] - 2026-05-22

### Changed
- Rebuilt all rich layouts around a unified token-first visual system.
- Shared spacing scale, type scale, radius, and shadow tokens in `layouts.css`.
- Proportional grids and consistent card/header/nav interaction states across all layouts.

## [0.2.0] - 2026-05-22

### Added
- Automatic rich layout rendering with Magazine, Docs, Story, and Dashboard modes.
- Layout switcher toolbar with persisted automatic/manual layout selection.
- Webview layout engine with frontmatter-aware overrides and content-based detection.
- Shared reveal motion system with reduced-motion fallback.
- Rich layout tests covering detection, reveal behavior, and layout structure.

### Fixed
- Preserved source-line `0` mappings in the layout model.
- Preserved pre-heading content in section-based rich layouts.
- Avoided duplicate section IDs by using stable internal section keys.
- Hardened layout switching lifecycle cleanup for scroll and reveal observers.
- Improved dashboard disclosure accessibility and rich layout section navigation.

## [0.1.0] - 2025-05-21

### Added
- Beautiful markdown preview with VS Code theme sync
- Shiki syntax highlighting (CSS variables theme)
- Table of Contents sidebar
- Two-way scroll sync between editor and preview
- Local image resolution
- Smooth animations (fade-in, hover effects, link underlines)
- State persistence (scroll position, TOC, collapsed headings)
- Mermaid diagram rendering
- KaTeX math support (inline and block)
- YAML frontmatter display
- Interactive task list checkboxes
- Collapsible headings (h2/h3)
- Presentation mode with slide navigation
- Speaker notes support
- Export to HTML
- Export to PDF (via browser)
- Configurable font size, line height, and transitions
