# Theme Selection — Design Spec (v0.6.0)

## Overview

Add a full theme system to MarkdownWarriorPreview. Each theme is a "theme pack" that bundles color scheme, syntax highlighting, font stack, and spacing into a single named preset. Users pick a theme from a side panel; the selection persists globally across all files and VS Code sessions.

**Goal:** Let readers choose a visual experience that suits their environment and preference — from warm reading themes (Sepia, Solarized Light) to deep dark developer themes (Vesper, Pitch Black) — without any coupling to VS Code's own color theme.

**Affected files:** extension host (persistence, Shiki), webview (CSS variables, side panel UI), shared CSS tokens.

---

## Prerequisites

Before implementing v0.6.0, the following cleanup and integration steps must be completed:

1. **Changelog polish** — add `0.3.0` and `0.4.0` entries to `CHANGELOG.md` to close the gap from `0.2.0` to `0.5.0`.
2. **Merge `scroll-first-reading` into `master`** — worktree at `.worktrees/scroll-first-reading`, branch HEAD `a47b809`. Run `npm test` and `npm run build` after merge.
3. **Git cleanup** — remove worktree, delete local branch `scroll-first-reading`, run `git worktree prune`.
4. **Build warnings** (non-blocking but clean up):
   - `MODULE_TYPELESS_PACKAGE_JSON` for `src/webview/svelte.config.js` — add `"type": "module"` to that config or add explicit extension.
   - Vite chunk size warning — add `build.chunkSizeWarningLimit: 1000` to `vite.config.ts` or split webview chunks if practical.

---

## Architecture

### Approach: CSS custom properties + Shiki theme map

Each theme is defined in two places:
1. A TypeScript object in `theme-registry.ts` (id, label, mode, shikiTheme, swatches)
2. A CSS block in `themes.css` (CSS custom property overrides on `:root[data-theme="x"]`)

**Theme change flow:**
1. User clicks theme in side panel
2. Webview sets `document.documentElement.dataset.theme = themeId` → CSS variables update instantly (prose layer)
3. Webview sends `{ type: 'setTheme', themeId }` to extension host via `postMessage`
4. Extension saves to `context.globalState`, re-renders markdown with new Shiki theme
5. Extension sends updated HTML back to webview → syntax highlighting updates

The two-step update (CSS instant + Shiki async) gives immediate visual feedback while the code block re-render catches up in the background.

---

## Theme Catalogue (12 themes)

| id | Label | Mode | Shiki theme |
|----|-------|------|-------------|
| `catppuccin-mocha` | Catppuccin Mocha | dark | `catppuccin-mocha` |
| `github-dark` | GitHub Dark | dark | `github-dark` |
| `dracula` | Dracula | dark | `dracula` |
| `tokyo-night` | Tokyo Night | dark | `tokyo-night` |
| `nord` | Nord | dark | `nord` |
| `high-contrast-dark` | High Contrast Dark | dark | `min-dark` |
| `vesper` | Vesper | dark | `vesper` |
| `pitch-black` | Pitch Black (OLED) | dark | `github-dark` *(fallback — no Shiki equivalent)* |
| `catppuccin-latte` | Catppuccin Latte | light | `catppuccin-latte` |
| `github-light` | GitHub Light | light | `github-light` |
| `sepia` | Sepia | light | `min-light` |
| `solarized-light` | Solarized Light | light | `solarized-light` |

**Default theme:** `catppuccin-mocha`

**Persistence:** VS Code `context.globalState` — global across all files and workspaces, independent of VS Code's own color theme.

---

## Components

### `src/webview/lib/theme-registry.ts` (new)

```typescript
interface ThemeDefinition {
  id: string
  label: string
  mode: 'dark' | 'light'
  shikiTheme: string
  swatches: [string, string, string, string, string] // 5 hex colors
}

export const THEMES: ThemeDefinition[]
export const DEFAULT_THEME = 'catppuccin-mocha'
export function getTheme(id: string): ThemeDefinition
```

Pure data module — no side effects, fully testable.

### `src/webview/styles/themes.css` (new)

CSS custom property definitions for all 12 themes. Structure:

```css
/* Default fallback = Catppuccin Mocha */
:root {
  --theme-bg: #1e1e2e;
  --theme-surface: #313244;
  --theme-text: #cdd6f4;
  --theme-text-muted: #a6adc8;
  --theme-heading: #cba6f7;
  --theme-accent: #89b4fa;
  --theme-border: #45475a;
  --theme-shadow: rgba(0,0,0,0.4);
  --theme-font-body: system-ui, sans-serif;
  --theme-font-mono: 'JetBrains Mono', monospace;
  --theme-radius: 6px;
}

:root[data-theme="github-light"] { ... }
:root[data-theme="dracula"] { ... }
/* 12 blocks total */
```

`layouts.css` is updated to consume these variables for background, text, heading, border, and shadow tokens. Layout-specific tokens (grid, spacing, card dimensions) remain unchanged.

### `src/webview/components/ThemePanel.svelte` (new)

Side panel rendered to the right of the preview content. Props:

```typescript
selectedTheme: string       // currently active theme id
onSelect: (id: string) => void
```

Renders themes grouped into **Dark** and **Light** sections. Each row shows the theme label and 3 color swatches. The active theme has an accent-colored left border. Panel visibility is toggled via a 🎨 icon added to the existing toolbar.

`App.svelte` manages `panelVisible: boolean` state and passes it to the toolbar.

### `src/extension/preview-provider.ts` (modified)

- On `setTheme` message: call `context.globalState.update('selectedTheme', themeId)`
- On every `_update()`: read `context.globalState.get('selectedTheme', DEFAULT_THEME)` and pass to markdown engine
- Include `themeId` in the `update` postMessage payload sent to webview

### `src/extension/markdown-engine.ts` (modified)

`render(markdown: string, shikiTheme: string): Promise<string>`

Accepts `shikiTheme` as a parameter instead of a hardcoded value. Uses Shiki's `bundledThemes` — all 12 mapped themes are available in Shiki's bundle (no extra dependencies).

---

## Data Flow

```
User clicks theme
  → ThemePanel calls onSelect(themeId)
  → App.svelte sets document.documentElement.dataset.theme = themeId  [instant CSS]
  → App.svelte sends postMessage { type: 'setTheme', themeId }
    → preview-provider saves to globalState
    → markdown-engine re-renders with new shikiTheme
    → extension sends { type: 'update', html, themeId } to webview
      → App.svelte updates html content  [syntax highlighting updated]

VS Code restart / new file opened
  → preview-provider reads globalState on _update()
  → sends { type: 'update', html, themeId }
  → App.svelte applies dataset.theme on mount
```

---

## Testing Strategy

**`tests/theme-registry.test.ts`** (new, ~8 tests):
- All 12 themes have required fields: `id`, `label`, `mode`, `shikiTheme`, `swatches`
- Each theme has exactly 5 hex color swatches
- `DEFAULT_THEME` exists in the registry
- No duplicate `id` values
- `mode` is only `'dark'` or `'light'`
- `getTheme()` returns correct definition; throws on unknown id

**`tests/themes-css.test.ts`** (new, ~6 tests):
- `themes.css` exists
- Defines all 12 `[data-theme="x"]` blocks
- Each block contains all 11 `--theme-*` variables
- `:root` default block is present (Catppuccin Mocha fallback)

**`tests/theme-panel.test.ts`** (new, ~5 tests):
- `ThemePanel.svelte` compiles without errors
- Rendered HTML contains all 12 theme ids
- Dark/Light group labels are present
- Active theme row has highlight attribute/class

**`tests/markdown-engine.test.ts`** (modified, ~3 new tests):
- `render()` accepts and uses `shikiTheme` parameter
- Renders successfully with `'github-dark'` and `'dracula'`
- Output contains Shiki inline style markers

**Expected total:** ~89 tests (currently 67, adding 22 new: 8 + 6 + 5 in new files, 3 added to existing `markdown-engine.test.ts`).

---

## Scope Boundaries

**In scope for v0.6.0:**
- 12 built-in themes, side panel UI, CSS variable system, Shiki integration, global persistence

**Out of scope:**
- User-defined custom themes
- Per-file theme override via frontmatter
- Syncing with VS Code's color theme
- Theme export/import
- Marketplace publish (separate step)
