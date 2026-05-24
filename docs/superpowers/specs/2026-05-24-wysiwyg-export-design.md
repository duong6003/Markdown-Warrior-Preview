# WYSIWYG Export (HTML & PDF) — Design Spec

**Date:** 2026-05-24
**Status:** Approved

---

## Problem

The current export feature does not match what the user sees in the preview:

1. **HTML export (`exportHTML`)** — `wrapExportHTMLDocument()` contains hand-rolled CSS that is a partial, out-of-sync copy of the actual webview CSS files. Concrete gaps:
   - Missing `letter-spacing`, `word-wrap`, `.shiki` override, and other rules from `markdown-body.css`
   - `extensions.css` styles (frontmatter block, KaTeX, mermaid, collapsible headings) are completely absent
   - `THEME_EXPORT_COLORS` in `export-config.ts` is a separate color table that duplicates and can drift from `themes.css`

2. **PDF export (`exportPDF`)** — calls the old `wrapInHTMLDocument()` which is hardcoded GitHub light/dark, ignores selected theme, ignores selected fonts, ignores all config.

---

## Goal

- **HTML export:** what the user sees in the preview is exactly what is in the exported file (WYSIWYG) — same colors, same typography, same content styles, same syntax highlighting.
- **PDF export:** same theme and fonts as the preview, proper `@media print` CSS for clean printing.

---

## Non-Goals

- Capturing layout chrome (toolbar, TOC sidebar, theme panel) in the export — export is always a clean document layout.
- Mermaid diagram rendering in export (diagrams show as code blocks; not changed in this feature).
- Changing the PDF delivery mechanism (still browser print-to-PDF via `Ctrl+P`).

---

## Architecture

### Why Not DOM Snapshot

A webview DOM snapshot (sending rendered HTML back from the webview via message) was considered but rejected:

- **Unnecessary complexity** — Shiki already uses named themes and inlines hex colors directly into HTML spans. There is no CSS variable indirection for syntax highlighting. The Shiki output is already identical between preview and export.
- **Interactive state** — a DOM snapshot would capture interactive state (checked checkboxes, collapsed headings, scroll position) which is wrong for a static export.
- **Simpler fix exists** — the only real divergence is the CSS, which can be fixed by using the same CSS files.

### Solution: Embed the Actual CSS Files

The export HTML embeds the same CSS files the webview uses, with `data-theme` set on `<html>` to trigger the correct theme CSS rules — exactly as the webview does.

```
<html data-theme="catppuccin-mocha">
<head>
  <style>/* themes.css */</style>         ← sets --md-* vars per theme
  <style>/* markdown-body.css */</style>  ← content typography
  <style>/* extensions.css */</style>     ← frontmatter, KaTeX, mermaid shells, etc.
  <style>/* KaTeX CDN or bundled CSS */</style>
  <style>                                 ← font overrides from user config
    :root {
      --md-font-body: <stack>;
      --md-font-heading: <stack>;
      --md-font-mono: <stack>;
    }
  </style>
  <style>/* Google Fonts CSS (embedded or CDN link) */</style>
  <style>/* @media print (PDF export only) */</style>
</head>
<body>
  <div class="markdown-body">
    <!-- engine.render() output — unchanged -->
  </div>
</body>
</html>
```

`theme-bridge.css` is **not included** — it exists to bridge `--vscode-*` vars for the VS Code webview environment. In a standalone HTML file, `themes.css` directly sets all `--md-*` vars via `--theme-*` and no VS Code vars are needed.

`animations.css` is **not included** — static export should not have entrance animations.

---

## CSS File Delivery

### Build Step

A new script (`scripts/copy-export-styles.js`) copies the three CSS files to `dist/export-styles/` as part of the build:

```
dist/
  export-styles/
    markdown-body.css    ← copied from src/webview/styles/
    themes.css           ← copied from src/webview/styles/
    extensions.css       ← copied from src/webview/styles/
  webview/               ← Vite output (unchanged)
  extension/             ← esbuild output (unchanged)
```

`dist/` is already included in the VSIX (not in `.vscodeignore`), so no packaging changes are needed.

### Build Script (`scripts/copy-export-styles.js`)

```js
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'webview', 'styles');
const dest = path.join(__dirname, '..', 'dist', 'export-styles');

fs.mkdirSync(dest, { recursive: true });
for (const file of ['markdown-body.css', 'themes.css', 'extensions.css']) {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
}
console.log('Export styles copied.');
```

### `package.json` Build Update

```json
"build": "npm run build:export-styles && npm run build:ext && npm run build:webview",
"build:export-styles": "node scripts/copy-export-styles.js"
```

### `Exporter` Constructor Change

`Exporter` currently takes only `MarkdownEngine`. It needs `extensionUri` to locate `dist/export-styles/`. Update constructor:

```typescript
constructor(private engine: MarkdownEngine, private extensionUri: vscode.Uri) {}
```

Update the call site in `extension.ts` to pass `context.extensionUri`.

### Runtime Reading (in `Exporter`)

```typescript
private readExportStyles(): { markdown: string; themes: string; extensions: string } {
  const dir = vscode.Uri.joinPath(this.extensionUri, 'dist', 'export-styles');
  const read = (name: string) =>
    fs.readFileSync(vscode.Uri.joinPath(dir, name).fsPath, 'utf-8');
  return {
    markdown: read('markdown-body.css'),
    themes: read('themes.css'),
    extensions: read('extensions.css'),
  };
}
```

---

## Export HTML Construction

### New method: `buildExportHTML()`

Replaces both `wrapExportHTMLDocument()` and `wrapInHTMLDocument()`.

```typescript
private buildExportHTML(
  bodyHtml: string,
  title: string,
  themeId: string,
  fontResult: FontInlineResult,
  cssFiles: { markdown: string; themes: string; extensions: string },
  extraCss = '',
): string
```

The `:root` font override block:
```css
:root {
  --md-font-body: <fontResult.stacks.body>;
  --md-font-heading: <fontResult.stacks.heading>;
  --md-font-mono: <fontResult.stacks.code>;
  --md-font-size: 16px;
  --md-line-height: 1.6;
}
```

KaTeX CSS is included via a `<link>` to the CDN (`https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.css`). This keeps the export file small. For fully offline exports this can be a future option.

---

## `exportHTML()` Flow (updated)

```
exportHTML(editor, config):
  1. prepareFonts(config, showDialog)   ← unchanged, handles Google Fonts dialog
  2. engine.render(text, shikiTheme)    ← unchanged
  3. readExportStyles()                 ← NEW
  4. buildExportHTML(html, fileName, themeId, fontResult, cssFiles)  ← NEW
  5. showSaveDialog() + writeFileSync() ← unchanged
```

---

## `exportPDF()` Flow (fixed)

`exportPDF()` now takes `config: ExportConfig` (same as `exportHTML`). The preview provider passes config to both.

```
exportPDF(editor, config):
  1. prepareFonts(config, showDialog)   ← same as exportHTML
  2. engine.render(text, shikiTheme)    ← same as exportHTML
  3. readExportStyles()                 ← same as exportHTML
  4. buildExportHTML(..., printCss)     ← same + printCss passed as extraCss
  5. write to temp file + open in browser ← unchanged
```

### `@media print` CSS (`printCss`)

```css
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .markdown-body { max-width: none; padding: 1cm 2cm; }
  pre { white-space: pre-wrap; word-break: break-word; page-break-inside: avoid; }
  h1, h2, h3, h4 { page-break-after: avoid; }
  pre, blockquote, figure, table { page-break-inside: avoid; }
  img { max-width: 100%; }
  .task-checkbox { pointer-events: none; }
  a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 0.8em; color: var(--md-fg-muted); }
}
```

`print-color-adjust: exact` is critical — without it browsers strip background colors, making dark themes print as white.

---

## Message Changes

`exportPDF` message from webview (`{ type: 'exportPDF' }`) carries no payload — unchanged.

`PreviewProvider` already has `getExportConfig()`. The handler for `exportPDF` in `extension.ts` is updated to call `getExportConfig()` and pass it to `exporter.exportPDF(editor, config)`.

---

## Cleanup (deleted)

| Item | File | Reason |
|------|------|--------|
| `wrapExportHTMLDocument()` | `exporter.ts` | Replaced by `buildExportHTML()` |
| `wrapInHTMLDocument()` | `exporter.ts` | Obsolete |
| `THEME_EXPORT_COLORS` | `export-config.ts` | Replaced by `themes.css` |
| `ThemeExportColors` interface | `export-config.ts` | No longer needed |
| `getExportThemeColors()` | `export-config.ts` | No longer needed |

---

## Testing

### Updated tests
- `export-config.test.ts` — remove tests for `THEME_EXPORT_COLORS` / `getExportThemeColors`
- `exporter-config.test.ts` — update to reflect new export HTML structure (check `data-theme` attr, check CSS file content embedded)

### New tests
- `exporter-css-embed.test.ts`:
  - Verify exported HTML contains `data-theme="<themeId>"` on `<html>`
  - Verify exported HTML contains content from `themes.css` (spot-check a selector)
  - Verify exported HTML contains content from `markdown-body.css`
  - Verify PDF export HTML contains `@media print`
  - Verify PDF export HTML contains `print-color-adjust: exact`
  - Verify exported HTML does NOT contain `prefers-color-scheme` (regression)

### Build test
- Verify `dist/export-styles/` exists after `npm run build`
- Verify the three CSS files are present and non-empty

---

## Files Touched

```
src/extension/exporter.ts          ← add extensionUri to constructor; replace wrapExportHTMLDocument + wrapInHTMLDocument → buildExportHTML; fix exportPDF to accept config
src/shared/export-config.ts        ← remove THEME_EXPORT_COLORS, ThemeExportColors, getExportThemeColors
src/extension/extension.ts         ← pass extensionUri to Exporter constructor; pass config to exportPDF handler
scripts/copy-export-styles.js      ← new build script
package.json                       ← add build:export-styles step
tests/export-config.test.ts        ← remove THEME_EXPORT_COLORS tests
tests/exporter-config.test.ts      ← update for new HTML structure (data-theme, CSS presence)
tests/exporter-css-embed.test.ts   ← new test file
```
