# Changelog

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
