# HTML Export with Current Configuration — Design Spec

**Date:** 2026-05-23
**Status:** Approved

## Overview

Upgrade the existing `exportHTML` command so the output file faithfully reflects the user's current preview configuration: selected theme (colors baked in, no `prefers-color-scheme`), font choices (body / heading / code), and Shiki syntax-highlight colors. Google Fonts used in the preview can optionally be embedded as base64 data for offline use, with a graceful fallback to system fonts if the user declines.

---

## Problem Statement

The current `Exporter.exportHTML()` ignores all user configuration:
- Hardcoded light/dark palette via `prefers-color-scheme` — ignores the selected theme
- `engine.render(text)` called without a Shiki theme — syntax highlighting colors are wrong
- No font configuration — always uses system defaults
- Font state (`fontBody`, `fontHeading`, `fontCode`) lives only in the webview browser-side state and is invisible to the extension host

---

## Architecture

### Export Flow

```
Command "Export HTML"
        │
        ▼
extension.ts → previewProvider.getExportConfig()
                       │ ExportConfig { themeId, fontBody, fontHeading, fontCode }
                       ▼
              exporter.exportHTML(editor, config)
                       │
             ┌─────────┴──────────┐
             ▼                    ▼
    engine.render(text,     FontInliner.prepare(config)
      shikiTheme)               │
                         ┌──────┴──────────────────┐
                         │ Has Google Fonts?        │
                         ▼ Yes                      ▼ No
                  VS Code dialog              return null
                  "Embed fonts (~500KB
                   each)?"
                  [Embed][Fallback][Cancel]
                         │
                  ┌──────┴──────┐
                  ▼             ▼
           fetch GFonts    return fallback
           CSS + woff2     system stacks
           → base64
           → inlined CSS
                         │
              ◄───────────────────────
              wrapInHTMLDocument(html, config, fontResult)
                         │
              baked-in theme colors
            + font-family CSS vars
            + inline font CSS (if embedded)
            + Shiki HTML (already colored)
```

### Font State Sync

Font settings are stored in the webview's browser-side state. To make them available to the extension host at export time:

- On `onMount` in `App.svelte`: send `{ type: 'syncFonts', fontBody, fontHeading, fontCode }` (current state from `loadState()`)
- On `handleFontChange` in `App.svelte`: send `{ type: 'setFont', slot, id }` after each change
- `PreviewProvider` handles both messages and persists each slot to `context.globalState`
- `PreviewProvider.getExportConfig()` reads from `globalState` with defaults as fallback

---

## New Files

### `src/shared/export-config.ts`

```ts
export interface ExportConfig {
  themeId: string;
  fontBody: string;
  fontHeading: string;
  fontCode: string;
}

export interface ThemeExportColors {
  bg: string; bgSecondary: string; bgTertiary: string;
  fg: string; fgSecondary: string; fgMuted: string;
  accent: string; border: string; codeBg: string;
}

export const THEME_EXPORT_COLORS: Record<string, ThemeExportColors>
```

Contains color palettes for all 12 themes matching the values used in the webview's `theme-bridge.css`. Falls back to `github-dark` colors for unknown theme IDs.

### `src/shared/font-registry.ts`

Moved from `src/webview/lib/font-registry.ts`. Identical content. Both extension host and webview need `BODY_FONTS`, `HEADING_FONTS`, `CODE_FONTS`, `getFontEntry`.

`src/webview/lib/font-registry.ts` becomes a single re-export:
```ts
export * from '../../shared/font-registry';
```

### `src/extension/font-inliner.ts`

```ts
export interface FontInlineResult {
  css: string;          // inlined @font-face CSS (or empty string)
  stacks: FontStacks;   // resolved font-family values to use in CSS vars
}

export interface FontStacks {
  body: string;
  heading: string;
  code: string;
}

export async function prepareFonts(
  config: ExportConfig,
  showDialog: (families: string[]) => Promise<'embed' | 'fallback' | 'cancel'>,
): Promise<FontInlineResult | null>  // null = user cancelled
```

**Internal flow:**
1. Collect unique `googleFamily` values from the three font entries
2. If none → return `{ css: '', stacks: resolvedStacks }` immediately (no dialog)
3. Call `showDialog(families)` — caller supplies the VS Code dialog implementation
4. If `'cancel'` → return `null`
5. If `'fallback'` → return `{ css: '', stacks: systemFallbackStacks }` where stacks are: body = `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`; heading = `inherit` (if config says `inherit`) or same as body; code = `Consolas, 'Courier New', monospace`
6. If `'embed'`:
   - For each family: `GET https://fonts.googleapis.com/css2?family=${family}&display=swap` (with `User-Agent: Mozilla/5.0` header to get woff2 URLs)
   - Parse `src: url(...)` from `@font-face` blocks
   - Fetch each woff2 URL → base64-encode → replace in CSS
   - Return `{ css: combinedInlinedCSS, stacks: resolvedStacks }`

Uses Node.js built-in `https` module — no new dependencies.

The `showDialog` callback is injected by `exporter.ts` using `vscode.window.showInformationMessage`.

---

## Modified Files

### `src/shared/messages.ts`

Add to `WebviewToHostMessage`:
```ts
| { type: 'setFont'; slot: 'body' | 'heading' | 'code'; id: string }
| { type: 'syncFonts'; fontBody: string; fontHeading: string; fontCode: string }
```

### `src/webview/App.svelte`

**`onMount`:** After initial setup, post `syncFonts`:
```ts
postMessage({ type: 'syncFonts', fontBody, fontHeading, fontCode });
```

**`handleFontChange`:** After updating state, post `setFont`:
```ts
postMessage({ type: 'setFont', slot, id });
```

### `src/extension/preview-provider.ts`

Add constants:
```ts
const FONT_BODY_KEY = 'markdownWarrior.fontBody';
const FONT_HEADING_KEY = 'markdownWarrior.fontHeading';
const FONT_CODE_KEY = 'markdownWarrior.fontCode';
```

Add message handlers in `handleWebviewMessage`:
```ts
case 'setFont': {
  const key = message.slot === 'body' ? FONT_BODY_KEY
            : message.slot === 'heading' ? FONT_HEADING_KEY
            : FONT_CODE_KEY;
  await this.context.globalState.update(key, message.id);
  break;
}
case 'syncFonts':
  await Promise.all([
    this.context.globalState.update(FONT_BODY_KEY, message.fontBody),
    this.context.globalState.update(FONT_HEADING_KEY, message.fontHeading),
    this.context.globalState.update(FONT_CODE_KEY, message.fontCode),
  ]);
  break;
```

Add public method:
```ts
public getExportConfig(): ExportConfig {
  return {
    themeId: this.selectedThemeId,
    fontBody: this.context.globalState.get(FONT_BODY_KEY, 'system'),
    fontHeading: this.context.globalState.get(FONT_HEADING_KEY, 'inherit'),
    fontCode: this.context.globalState.get(FONT_CODE_KEY, 'cascadia'),
  };
}
```

### `src/extension/extension.ts`

Update `exportHTMLCmd`:
```ts
const exportHTMLCmd = vscode.commands.registerCommand(
  'markdownWarrior.exportHTML',
  async () => {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'markdown') {
      const config = previewProvider.getExportConfig();
      await exporter.exportHTML(editor, config);
    } else {
      vscode.window.showWarningMessage('Open a Markdown file first.');
    }
  }
);
```

### `src/extension/exporter.ts`

- `exportHTML(editor, config: ExportConfig)`:
  1. Call `prepareFonts(config, showDialog)` → get `FontInlineResult | null`
  2. If null → return (user cancelled)
  3. `const shikiTheme = getTheme(config.themeId).shikiTheme`
  4. `const { html } = this.engine.render(text, shikiTheme)`
  5. `const htmlContent = this.wrapInHTMLDocument(html, fileName, config, fontResult)`
  6. Show save dialog → write file

- `wrapInHTMLDocument(html, title, config, fontResult)`:
  - Look up `THEME_EXPORT_COLORS[config.themeId]`
  - Set CSS variables from theme colors
  - Set `--md-font-body`, `--md-font-heading`, `--md-font-mono` from `fontResult.stacks`
  - Inject `fontResult.css` into `<style>` block if non-empty

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Unknown `themeId` in export config | Fall back to `github-dark` colors |
| Google Fonts API unreachable | Show error message, offer retry or fallback |
| Individual woff2 fetch fails | Skip that font, log warning, continue with others |
| User cancels save dialog | Silent no-op |
| User cancels font dialog | Silent no-op |

---

## Testing

- `tests/export-config.test.ts` — all 12 themes have color entries, `ExportConfig` defaults are valid
- `tests/font-inliner.test.ts` — unit tests with mocked `https` fetch: no-GFont path, embed path, fallback path, cancel path, fetch error path
- `tests/exporter.test.ts` — test that `wrapInHTMLDocument` injects correct CSS vars for a given config; test that `exportHTML` bails on cancel
- `tests/preview-provider.test.ts` (or integration) — `setFont` and `syncFonts` messages update globalState correctly

All existing 127 tests must continue to pass.

**Out of scope:** `exportPDF` is not updated in this spec — it continues to use the existing generic `wrapInHTMLDocument` for the browser-print flow.

---

## File Summary

| File | Action |
|---|---|
| `src/shared/export-config.ts` | Create |
| `src/shared/font-registry.ts` | Create (move from webview/lib) |
| `src/extension/font-inliner.ts` | Create |
| `src/shared/messages.ts` | Modify — add 2 message types |
| `src/webview/lib/font-registry.ts` | Modify → re-export only |
| `src/webview/App.svelte` | Modify — syncFonts + setFont messages |
| `src/extension/preview-provider.ts` | Modify — handle font messages, getExportConfig() |
| `src/extension/extension.ts` | Modify — pass config to exporter |
| `src/extension/exporter.ts` | Modify — accept config, use FontInliner, bake theme |
