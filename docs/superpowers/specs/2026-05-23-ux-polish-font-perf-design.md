# Design Spec: UX Polish, Font Selection & Performance Audit

**Date:** 2026-05-23  
**Status:** Approved  
**Scope:** 5 independent improvements to Markdown Warrior Preview v0.3.0

---

## 1. Ghost Nav Chevron Affordance

### Problem
The current `ghost-strip` is 3px wide at `opacity: 0.4`. It reads as a decorative border, not an interactive navigation affordance. Users have no clear signal that hovering the left edge opens a nav panel.

### Solution
Add a `‹` chevron element centered vertically on the strip. It runs a one-time pulse animation on component mount, then stays at idle opacity. On hover it brightens. No layout changes.

### Changes — `src/webview/lib/GhostNav.svelte`

**HTML:** Add a `<span class="ghost-chevron">‹</span>` inside `.ghost-nav`, sibling to `.ghost-strip` and `.ghost-edge-zone`. Hide it when `navVisible` is true (same condition as strip hide).

**CSS additions:**
- `.ghost-strip` idle opacity: `0.4` → `0.65`
- `.ghost-chevron`: `position: absolute`, centered vertically (`top: 50%`, `transform: translateY(-50%)`), `left: -3px`, `font-size: 14px`, `color: var(--md-accent)`, `opacity: 0.5`, `pointer-events: none`, `transition: opacity 0.15s`
- `.ghost-chevron.pulse`: keyframe animation — scale 1 → 1.25 → 1, opacity 0.5 → 1 → 0.5 — runs once for 600ms on mount, class removed after
- On hover of `.ghost-edge-zone` (via sibling selector or class on parent): `.ghost-chevron` opacity → `1`
- `.ghost-chevron.hidden`: `opacity: 0` (when nav panel open)

**Logic:** In `onMount` equivalent — add class `pulse` to chevron element via a `$state` boolean, remove after 650ms.

### Success Criteria
- Chevron pulses once visibly when ArticleLayout first renders
- Hovering left edge brightens chevron and strip
- When nav panel opens, chevron disappears (same as strip)
- No layout shift, no size change to any surrounding element

---

## 2. Right-click Context Menu — "Open Preview"

### Problem
The command `markdownWarrior.openPreview` is accessible via command palette and editor title bar, but not via right-click inside the editor. Users expect right-click → preview for markdown files.

### Solution
Add an `editor/context` menu entry to `package.json`. The command already exists — only a menu registration is needed.

### Changes — `package.json`

In `contributes.menus`, add alongside the existing `editor/title` entry:

```json
"editor/context": [
  {
    "when": "resourceLangId == markdown",
    "command": "markdownWarrior.openPreview",
    "group": "navigation"
  }
]
```

No changes to extension host code. No new command registration needed.

### Success Criteria
- Right-clicking inside a `.md` file in the editor shows "Markdown Warrior: Open Preview"
- Entry does not appear for non-markdown files
- Clicking it opens the preview panel (same behavior as title bar button)

---

## 3. App Icon — Glassmorphism / 3D Light

### Problem
Current icon is not visually distinctive. The extension marketplace and activity bar deserve a polished, recognizable icon.

### Style Direction
- Shape: rounded square (20% corner radius)
- Background: diagonal gradient `#1a2980 → #6b21a8` (navy → purple)
- Overlay: frosted glass panel — white `rgba(255,255,255,0.12)`, slightly inset, with subtle inner border `rgba(255,255,255,0.2)` and `blur` simulation via layered shapes
- Letter: bold **M** in white with soft drop shadow `rgba(0,0,0,0.25)`
- Accent detail: small filled circle `var(--md-accent)` at bottom-right (~10% of icon size) to suggest "live preview" dot
- Must be legible at 16×16, 32×32, 128×128

### Deliverables
- `images/icon.svg` — source SVG, 128×128 viewBox
- `images/icon.png` — exported 128×128 PNG (referenced in `package.json` `"icon"` field)

### Changes — `package.json`
Add or update: `"icon": "images/icon.png"`

### Success Criteria
- Icon looks sharp in Extensions sidebar (128px) and activity bar (16px)
- Glassmorphism layering is visible at 128px, degrades gracefully at small sizes
- No pixelation or aliasing in PNG export

---

## 4. Font Selection

### Architecture Overview

Font selection is a pure webview-side feature. No extension host involvement. State persists via existing `WebviewState` in `message-bridge`.

### Font Registry — `src/webview/lib/font-registry.ts` (new file)

Defines two categories of font entries:

```typescript
export interface FontEntry {
  id: string;
  label: string;
  stack: string;       // CSS font-family value
  googleFamily?: string; // If present, must be loaded via Google Fonts link
}
```

**Body fonts:**

| id | label | stack | Google? |
|----|-------|-------|---------|
| `system` | System UI | `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | no |
| `georgia` | Georgia | `Georgia, 'Times New Roman', serif` | no |
| `inter` | Inter | `'Inter', sans-serif` | yes |
| `lato` | Lato | `'Lato', sans-serif` | yes |
| `merriweather` | Merriweather | `'Merriweather', serif` | yes |
| `nunito` | Nunito | `'Nunito', sans-serif` | yes |

**Heading fonts** (same structure, additional options):

| id | label | stack | Google? |
|----|-------|-------|---------|
| `inherit` | Same as body | `inherit` | no |
| `playfair` | Playfair Display | `'Playfair Display', serif` | yes |
| `raleway` | Raleway | `'Raleway', sans-serif` | yes |
| `poppins` | Poppins | `'Poppins', sans-serif` | yes |

**Code fonts:**

| id | label | stack | Google? |
|----|-------|-------|---------|
| `cascadia` | Cascadia Code | `'Cascadia Code', Consolas, monospace` | no |
| `jetbrains` | JetBrains Mono | `'JetBrains Mono', monospace` | yes |
| `fira` | Fira Code | `'Fira Code', monospace` | yes |

### Google Fonts Loading — `src/webview/lib/font-loader.ts` (new file)

```typescript
export function loadGoogleFont(family: string): void
```

- Checks if a `<link>` with `data-gfont={family}` already exists in `<head>` — skips if yes.
- Injects `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=...&display=swap">`.
- Uses `display=swap` to avoid FOIT.
- Called once per font selection change, only when `googleFamily` is defined.

### State Extension — `src/webview/stores/state.ts`

Add to `WebviewState`:
```typescript
fontBody: string;     // font id, default 'system'
fontHeading: string;  // font id, default 'inherit'
fontCode: string;     // font id, default 'cascadia'
```

Add to `DEFAULT_STATE` and `loadState` normalization (validate against known font ids, fall back to default).

### CSS Application — `src/webview/styles/theme-bridge.css`

The three custom properties already exist:
- `--md-font-body`
- `--md-font-mono`

Add: `--md-font-heading` (currently missing, headings fall back to body font).

Font selection writes to these via inline style on `<html>` or `<body>` — same pattern used by theme selection (`document.documentElement.dataset.theme`). Use `document.documentElement.style.setProperty('--md-font-body', stack)`.

### UI — `src/webview/components/ThemePanel.svelte`

Extend the existing panel with a "Typography" section below the theme list.

Structure:
```
── Typography ─────────────────
  Body      [dropdown ▾]
  Heading   [dropdown ▾]
  Code      [dropdown ▾]
```

Each dropdown is a `<select>` element styled to match the panel aesthetic. On change:
1. Look up `FontEntry` by selected id
2. If `googleFamily` set, call `loadGoogleFont(entry.googleFamily)`
3. Set CSS custom property via `document.documentElement.style.setProperty`
4. Call `saveState({ fontBody: id })` (or heading/code)

Props added to `ThemePanel`:
```typescript
fontBody: string;
fontHeading: string;
fontCode: string;
onFontChange: (slot: 'body' | 'heading' | 'code', id: string) => void;
```

`App.svelte` reads font state from `loadState()` and passes down. On `onFontChange`, applies CSS var and saves state.

### Success Criteria
- Font dropdowns appear in Theme Panel below theme list
- Selecting a Google Font loads it without layout shift (swap)
- Selected font persists across panel close/open and tab switches
- Code font applies to both inline `code` and `pre > code`
- Heading font applies to h1–h6 via `--md-font-heading`
- Offline: system fonts work; Google Fonts fail silently (browser handles it)

---

## 5. Performance Audit

### Scope
Static code review of 4 layers. No profiling tool required at this stage. Findings will be fix-or-note decisions.

### Layer 1 — Extension Host (`src/extension/`)

Check:
- `preview-provider.ts`: debounce on `onDidChangeTextDocument` — currently 200ms, acceptable. Verify timeout is cleared on dispose.
- `MarkdownEngine.render()`: called synchronously on every keystroke after debounce. Check if Shiki highlight throws and falls back cleanly without try/catch overhead per block.
- `AssetResolver.resolveAssets()`: regex replace on full HTML string — acceptable for typical doc sizes, note if very large docs could be slow.
- Scroll sync: `onDidChangeTextEditorVisibleRanges` fires frequently — check that it's not doing DOM work, only posting a message.

### Layer 2 — Message Bridge (`src/shared/messages.ts`)

Check:
- `update` message payload: sends full HTML string on every keystroke (after debounce). `sourceMap` array size. For large documents (1000+ lines), sourceMap could be 500+ entries — check if it's actually used or can be trimmed.
- No streaming or diffing — full re-render on every update. Acceptable at current scope, note as future optimization if large docs show lag.

### Layer 3 — Webview Boot (`src/webview/`)

Check:
- Mermaid: `renderMermaidBlocks()` called in `$effect` after every `html` change. Mermaid is heavy. Check if it re-renders blocks that haven't changed (no caching by diagram hash).
- `setupLayoutReveal()` / `teardownLayoutReveal()`: IntersectionObserver setup/teardown on every layout change — verify observers are fully disconnected before re-creating.
- `setupCollapsibleHeadings()` and `setupCheckboxHandler()`: called once in `onMount` — verify they don't attach duplicate listeners if somehow called again.

### Layer 4 — Svelte Reactivity

Check:
- `model = $derived(createDocumentModel(html, frontmatter))`: `createDocumentModel` runs on every `html` change. Check if it does expensive DOM parsing (DOMParser) — if yes, this is the main render bottleneck.
- `selectedLayout = $derived(resolveLayout(...))`: lightweight key lookup, fine.
- `$effect` in `App.svelte`: the main effect depends on `html`, `mode`, `selectedLayout` — all three trigger the full tick + setup sequence. Ensure `cancelled` flag prevents stale async work.

### Findings Format
Each finding will be: **location → issue → severity (info / warn / fix) → proposed change**.  
Only `fix` severity items go into the implementation plan.

---

## Implementation Order

Suggested sequence (each is independent, can be parallelized):

1. **Ghost Nav Chevron** — small, self-contained, high visibility impact
2. **Context Menu** — 3-line `package.json` change, zero risk
3. **App Icon** — design asset, no code risk
4. **Performance Audit** — review first, then targeted fixes
5. **Font Selection** — largest change, touches state, ThemePanel, CSS

---

## Files Affected Summary

| File | Change type |
|------|-------------|
| `src/webview/lib/GhostNav.svelte` | Modify |
| `package.json` | Modify (menus + icon field) |
| `images/icon.svg` | Create |
| `images/icon.png` | Create |
| `src/webview/lib/font-registry.ts` | Create |
| `src/webview/lib/font-loader.ts` | Create |
| `src/webview/stores/state.ts` | Modify |
| `src/webview/styles/theme-bridge.css` | Modify |
| `src/webview/components/ThemePanel.svelte` | Modify |
| `src/webview/App.svelte` | Modify |
| `src/extension/preview-provider.ts` | Audit → possible fix |
| `src/webview/lib/mermaid-renderer.ts` | Audit → possible fix |
