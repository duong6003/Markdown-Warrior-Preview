# Export Dropdown UI — Design Spec

**Date:** 2026-05-24  
**Status:** Approved

## Overview

Add an "⬇ Export ▾" dropdown button to the preview toolbar so users can export the current markdown file without opening the Command Palette. The dropdown exposes two options: Export as HTML and Export as PDF.

## UI Placement

The button sits at the far right of `LayoutToolbar`, after "▶ Slides". It is always visible when the preview panel is open, regardless of which layout or theme is active.

Toolbar order (left → right):
```
[Auto: Article] [Article] [Story] [Dashboard]  ···  [Themes] [▶ Slides] [⬇ Export ▾]
```

## Dropdown Behavior

- **Open:** click the button
- **Close:** click an option (triggers action immediately), or click anywhere outside the dropdown
- **Options:**
  1. ⬇ Export as HTML
  2. 🖨 Export as PDF

No keyboard shortcut hints are shown in the dropdown items.

## Message Flow

The webview cannot call VSCode APIs directly, so it uses the existing message bridge:

```
User clicks option
  → LayoutToolbar emits callback
    → App.svelte calls postMessage({ type: 'exportHTML' | 'exportPDF' })
      → preview-provider.ts receives message
        → calls exporter.exportHTML(editor, config) or exporter.exportPDF(editor)
```

`exportHTML` passes the current `ExportConfig` (theme + fonts) from `previewProvider.getExportConfig()`, matching what the existing VSCode command does.

## Files Changed

| File | Change |
|------|--------|
| `src/shared/messages.ts` | Add `{ type: 'exportHTML' }` and `{ type: 'exportPDF' }` to `WebviewToHostMessage` union |
| `src/webview/components/LayoutToolbar.svelte` | Add dropdown button with open/close state; emit `onExportHTML` and `onExportPDF` callbacks to parent |
| `src/webview/App.svelte` | Receive callbacks from LayoutToolbar, call `postMessage` for each |
| `src/extension/preview-provider.ts` | Handle `exportHTML` and `exportPDF` message types in the webview message listener |

## Component Design: LayoutToolbar

New props added to `LayoutToolbar.svelte`:

```ts
onExportHTML: () => void;
onExportPDF: () => void;
```

Internal state:
```ts
let exportOpen = $state(false);
```

Dropdown closes on:
- Selecting an option (call callback, then `exportOpen = false`)
- `blur` / click-outside via Svelte's `use:clickOutside` pattern or a window `mousedown` listener

## Styling

The button matches existing toolbar pill style (`layout-toolbar__pill`). When the dropdown is open, the button gets an `active` class (same as Themes button when panel is open). The dropdown panel uses `position: absolute`, `z-index` above content, with a subtle `box-shadow` matching the theme's border/bg variables.

## Out of Scope

- Adding new export formats (Markdown, DOCX, etc.)
- Export configuration UI (font/theme selection in dropdown) — already handled by Theme Panel
- Keyboard shortcut for export — still available via Command Palette (`markdownWarrior.exportHTML`)
