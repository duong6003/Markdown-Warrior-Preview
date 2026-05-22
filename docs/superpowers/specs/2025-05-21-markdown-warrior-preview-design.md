# Markdown Warrior Preview — Design Spec

## Overview

A VS Code extension that provides a modern, beautiful, and interactive markdown preview with presentation mode capabilities. Built with Svelte + Vite for the webview, markdown-it as the parsing core, and a phased release strategy from MVP to full-featured product.

**Target audience:** Developer community (VS Code Marketplace)
**Differentiator:** Combines beautiful preview + presentation mode + smooth animations in one extension

---

## Architecture

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────┐
│  Extension Host (TypeScript)                        │
│  - WebviewPanel provider                            │
│  - File watcher (onDidChangeTextDocument)           │
│  - Scroll sync coordinator                          │
│  - Local asset URI resolver                         │
│  - Command registration                            │
│  - Configuration management                        │
└──────────────────────────┬──────────────────────────┘
                           │ postMessage (typed protocol)
┌──────────────────────────▼──────────────────────────┐
│  Webview (Svelte 5 + Vite)                          │
│  - DocumentView component (normal preview)          │
│  - SlideView component (presentation mode)          │
│  - TOC sidebar                                      │
│  - Toolbar (theme, mode toggle, export)             │
│  - Scroll sync listener                            │
│  - State persistence (getState/setState)            │
└──────────────────────────┬──────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────┐
│  Markdown Processing Pipeline                       │
│  - markdown-it (core parser)                        │
│  - Source line mapping plugin (data-source-line)    │
│  - Shiki (syntax highlighting)                      │
│  - Mermaid (diagrams) [v0.2]                        │
│  - KaTeX (math) [v0.2]                              │
│  - gray-matter (frontmatter) [v0.2]                 │
└─────────────────────────────────────────────────────┘
```

### Bi-directional Communication Protocol

Messages from Host → Webview:
- `{ type: 'update', html, sourceMap }` — new rendered content
- `{ type: 'scrollTo', line }` — scroll preview to line
- `{ type: 'themeChanged' }` — VS Code theme changed
- `{ type: 'configChanged', config }` — user settings changed

Messages from Webview → Host:
- `{ type: 'openExternal', url }` — open URL in browser
- `{ type: 'openFile', path }` — open file in editor
- `{ type: 'scrollSync', line }` — sync editor scroll position
- `{ type: 'checkboxToggle', line, checked }` — toggle task list item
- `{ type: 'ready' }` — webview initialized

Security: Host validates all incoming messages. URL whitelist (`https:`, `http:`, `mailto:`). Path traversal rejection for file opens.

---

## Core Systems

### 1. Scroll Sync (Two-way)

**Source Map Generation:**
- Custom markdown-it plugin injects `data-source-line="N"` on every block-level element
- Stored as sorted array: `[{ line: number, element: HTMLElement }]`

**Editor → Preview:**
1. `onDidChangeTextEditorVisibleRanges` fires
2. Get top visible line number
3. Binary search source map for nearest `data-source-line`
4. `element.scrollIntoView({ behavior: 'smooth', block: 'start' })`
5. Interpolate between two anchors for sub-line precision

**Preview → Editor:**
1. `IntersectionObserver` on source-mapped elements
2. Top-most visible element → read `data-source-line`
3. Send `{ type: 'scrollSync', line }` to Host
4. Host calls `editor.revealRange(line, TextEditorRevealType.AtTop)`

**Infinite Loop Prevention:**
- `scrollSource` flag: `'editor' | 'preview' | null`
- When receiving scroll from other side, set flag + ignore own scroll events for 80ms
- `requestAnimationFrame` coalescing for rapid events

### 2. Local Asset Resolution

- Host scans HTML output for `src="..."` attributes with relative/absolute paths
- Resolve relative paths against markdown file's directory
- Convert via `webview.asWebviewUri(vscode.Uri.file(absolutePath))`
- Set `localResourceRoots` to: workspace folders + file's parent directory
- CSP: `img-src ${webview.cspSource} https: data:`

### 3. State Persistence

```typescript
interface WebviewState {
  scrollPosition: number;
  collapsedHeadings: string[]; // heading IDs
  currentSlide: number; // presentation mode
  tocVisible: boolean;
  mode: 'document' | 'presentation';
}
```

- `retainContextWhenHidden: true` on WebviewPanel
- On every state change: `vscode.setState(state)`
- On webview restore: `vscode.getState()` → restore UI

### 4. Performance Strategy

**Debouncing:**
- `onDidChangeTextDocument` debounced at 200ms
- Typing stops → parse → diff → update

**Rendering:**
- Files < 5000 lines: full re-parse (markdown-it: ~20ms for 10K lines)
- Files > 5000 lines: section-based incremental update (detect changed line range, re-render only affected sections)
- Heavy renders (mermaid, KaTeX): async, show placeholder → replace when ready

**Web Worker:** Deferred to v0.2+ only if mermaid/KaTeX cause jank on main thread.

---

## UI/UX Design

### Theme System

```css
/* theme-bridge.css — maps VS Code vars to semantic tokens */
:root {
  --md-bg-primary: var(--vscode-editor-background);
  --md-bg-secondary: var(--vscode-sideBar-background);
  --md-fg-primary: var(--vscode-editor-foreground);
  --md-fg-secondary: var(--vscode-descriptionForeground);
  --md-accent: var(--vscode-textLink-foreground);
  --md-accent-hover: var(--vscode-textLink-activeForeground);
  --md-border: var(--vscode-panel-border);
  --md-code-bg: var(--vscode-textCodeBlock-background);
  --md-selection: var(--vscode-editor-selectionBackground);
}
```

VS Code auto-injects CSS variables into webview → theme sync is automatic, zero JS needed.

### CSS Strategy

- **Svelte scoped styles** for UI components (toolbar, TOC, slide controls)
- **Global `.markdown-body` styles** for rendered markdown content
- **CSS custom properties** for all colors/spacing → single source of truth
- **No Tailwind** — unnecessary complexity for isolated webview

### CSS Encapsulation

- All markdown output wrapped in `<div class="markdown-body">...</div>`
- Styles target `.markdown-body h1`, `.markdown-body p`, etc.
- Svelte component styles are scoped by default (hash-based)
- No CSS leak possible — webview is already sandboxed from VS Code UI

### Syntax Highlighting

- **Shiki** with CSS variables theme
- Uses same TextMate grammars as VS Code → color consistency
- Single theme definition adapts to light/dark via CSS variables
- Code font: `var(--vscode-editor-fontFamily)` for consistency with editor

### Font Fallback System

```css
--md-font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  'Noto Sans', 'Noto Sans CJK SC', 'Noto Sans CJK TC', sans-serif;
--md-font-mono: var(--vscode-editor-fontFamily, 'JetBrains Mono'),
  'Fira Code', 'Cascadia Code', 'Consolas', 'Liberation Mono', monospace;
--md-font-math: 'KaTeX_Main', 'Latin Modern Math', 'STIX Two Math',
  'Cambria Math', serif;
```

Covers: Latin, Vietnamese, CJK, Math symbols. KaTeX bundles its own fonts.

### Layout Modes

**Document Mode:** Single scrollable column, optional TOC sidebar
**Presentation Mode:** Full-viewport slides, grid layout, navigation controls

Implemented as separate Svelte components (`DocumentView.svelte`, `SlideView.svelte`). Toggle switches entire component tree — no CSS class hacks.

### Hardware Acceleration

- Only animate `transform` and `opacity` (compositor-only properties)
- `will-change: transform` applied before animation, removed after
- Svelte `transition:` and `animate:` directives use transforms by default
- Parallax: `transform: translate3d(0, calc(var(--scroll) * 0.3), 0)`
- Target: 60fps on integrated graphics

---

## Presentation Mode

### Slide Separation
- `---` (horizontal rule) splits document into slides
- Each slide rendered in viewport-sized container
- Frontmatter `slideTheme`, `transition` options [v0.3]

### Navigation
- Arrow keys (left/right or up/down)
- Click navigation dots
- Swipe gestures (touch)
- `Escape` to exit presentation mode

### Speaker Notes [v0.3]
- Syntax: `<!-- notes: Your speaker notes here -->`
- Displayed in separate panel or overlay (toggle with `S` key)
- Not visible in normal document mode

### Transitions
- Slide transitions: fade, slide-left, slide-up (CSS transforms)
- Element transitions: Svelte `in:fly`, `in:fade` for content appearing
- Configurable per-slide via frontmatter or global setting

---

## Project Structure

```
markdown-warrior-preview/
├── src/
│   ├── extension/              # VS Code extension host
│   │   ├── extension.ts        # Entry point, activation
│   │   ├── preview-provider.ts # WebviewPanel management
│   │   ├── markdown-engine.ts  # Parse + render pipeline
│   │   ├── scroll-sync.ts      # Editor-side scroll coordination
│   │   ├── asset-resolver.ts   # Local image URI resolution
│   │   └── config.ts           # Settings management
│   └── webview/                # Svelte webview app
│       ├── App.svelte          # Root component
│       ├── components/
│       │   ├── DocumentView.svelte
│       │   ├── SlideView.svelte
│       │   ├── TableOfContents.svelte
│       │   ├── Toolbar.svelte
│       │   └── CodeBlock.svelte
│       ├── stores/
│       │   ├── content.ts      # Markdown content store
│       │   ├── theme.ts        # Theme state
│       │   └── scroll.ts       # Scroll sync state
│       ├── styles/
│       │   ├── theme-bridge.css
│       │   ├── markdown-body.css
│       │   └── animations.css
│       ├── lib/
│       │   ├── message-bridge.ts  # postMessage typed wrapper
│       │   └── source-map.ts      # Line-to-element mapping
│       └── main.ts             # Webview entry point
├── package.json                # Extension manifest
├── vite.config.ts              # Webview build config
├── tsconfig.json
├── tsconfig.webview.json
└── .vscodeignore
```

---

## Dependencies

### Extension Host
- `markdown-it` — Markdown parser
- `markdown-it-source-map` — Line number injection (or custom plugin)
- `gray-matter` — Frontmatter parsing [v0.2]

### Webview
- `svelte` (v5) — UI framework
- `shiki` — Syntax highlighting
- `mermaid` — Diagrams [v0.2]
- `katex` — Math rendering [v0.2]

### Build
- `vite` — Bundler
- `@sveltejs/vite-plugin-svelte` — Svelte compilation
- `@vscode/vsce` — Extension packaging
- `esbuild` — Extension host bundling

---

## Commands & Configuration

### Commands
- `markdownWarrior.openPreview` — Open preview to the side
- `markdownWarrior.togglePresentation` — Switch to presentation mode
- `markdownWarrior.exportHTML` — Export as HTML [v1.0]
- `markdownWarrior.exportPDF` — Export as PDF [v1.0]

### Settings
```json
{
  "markdownWarrior.theme": "auto | light | dark",
  "markdownWarrior.fontSize": 16,
  "markdownWarrior.lineHeight": 1.6,
  "markdownWarrior.scrollSync": true,
  "markdownWarrior.showTOC": true,
  "markdownWarrior.presentationTransition": "fade | slide | none"
}
```

---

## Release Phases

| Phase | Scope | Key Deliverables |
|-------|-------|-----------------|
| **v0.0** | Foundation | Project scaffold, Vite+Svelte+VS Code bridge, build pipeline, CSP config, CI/CD (GitHub Actions) |
| **v0.1** | MVP | Beautiful preview, theme sync, TOC, Shiki highlighting, two-way scroll sync, local images, state persistence, debounced updates, smooth animations |
| **v0.2** | Extended | Mermaid diagrams, KaTeX math, frontmatter display, interactive checkboxes, collapsible headings |
| **v0.3** | Presentation | Slide mode, navigation, speaker notes, page breaks, parallax effects, slide transitions |
| **v1.0** | Polish | Export PDF/HTML, settings UI, E2E tests (`@vscode/test-electron`), bundle optimization, Marketplace publish |

---

## Testing Strategy

- **Unit tests:** Vitest for markdown-engine, source-map logic, message protocol
- **Component tests:** Svelte component testing with `@testing-library/svelte`
- **Integration tests:** `@vscode/test-electron` for full extension lifecycle [v1.0]
- **Bundle analysis:** `rollup-plugin-visualizer` to track size regressions

---

## Success Criteria

- Preview renders in < 100ms for files under 1000 lines
- Scroll sync latency < 50ms
- Bundle size < 500KB (webview JS + CSS)
- 60fps animations on integrated graphics
- Works with VS Code 1.80+ (Webview API stability)
- 4.5+ star rating target on Marketplace
