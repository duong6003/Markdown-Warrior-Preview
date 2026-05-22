# MarkdownWarriorPreview — Session Summary

## Project Overview

**Tên:** MarkdownWarriorPreview
**Repo:** https://github.com/duong6003/Markdown-Warrior-Preview
**Publisher ID:** Dng
**Version:** 0.2.0
**Status:** Local build xong, chưa publish lên Marketplace. 27 commits ahead of origin/master.

---

## Tech Stack

- **Extension Host:** TypeScript, esbuild
- **Webview:** Svelte 5, Vite 8
- **Markdown Parser:** markdown-it (custom plugins cho source map, heading IDs, KaTeX, task lists)
- **Syntax Highlighting:** Shiki (CSS variables theme)
- **Diagrams:** Mermaid (lazy-loaded, code-split)
- **Math:** KaTeX (inline `$...$` + block `$$...$$`)
- **Frontmatter:** gray-matter
- **Tests:** Vitest

---

## Architecture

```
src/
├── extension/                  # VS Code Extension Host (Node.js)
│   ├── extension.ts            # Entry point, command registration
│   ├── preview-provider.ts     # WebviewPanel, message handling, file watcher, scroll sync
│   ├── markdown-engine.ts      # markdown-it + Shiki + KaTeX + source map + task lists
│   ├── scroll-sync.ts          # Editor-side scroll coordination (loop prevention)
│   ├── asset-resolver.ts       # Local image → webview URI resolution
│   └── exporter.ts             # Export HTML/PDF
├── shared/
│   └── messages.ts             # Typed message protocol (Host ↔ Webview)
└── webview/                    # Svelte 5 Webview App
    ├── App.svelte              # Root: mode switching (document/presentation/layout), toolbar
    ├── main.ts                 # Entry + CSS imports
    ├── components/
    │   ├── TableOfContents.svelte  # TOC sidebar (fixed right, click-to-navigate)
    │   └── SlideView.svelte        # Presentation mode (slides, dots, speaker notes)
    ├── layouts/                    # Rich layout components (v0.2.0)
    │   ├── MagazineLayout.svelte
    │   ├── DocsLayout.svelte
    │   ├── StoryLayout.svelte
    │   └── DashboardLayout.svelte
    ├── lib/
    │   ├── layout-engine.ts        # Layout detection + switching logic (v0.2.0)
    │   ├── message-bridge.ts       # postMessage wrapper + getState/setState
    │   ├── source-map.ts           # Scroll-to-line + scroll reporter (IntersectionObserver)
    │   ├── mermaid-renderer.ts     # Lazy mermaid diagram rendering
    │   ├── checkbox-handler.ts     # Click checkbox → edit source file
    │   └── collapsible-headings.ts # Click h2/h3 to collapse
    ├── stores/
    │   └── state.ts                # WebviewState persistence (scroll, TOC, mode, collapsed)
    └── styles/
        ├── theme-bridge.css        # VS Code CSS vars → semantic tokens + Shiki vars
        ├── markdown-body.css       # Typography, tables, code, blockquotes, images
        ├── animations.css          # Fade-in, hover effects, link underlines, reveal motion
        └── extensions.css          # Frontmatter, KaTeX, mermaid, checkboxes, collapsible
```

---

## Key Design Decisions

1. **Bi-directional Communication:** Typed `postMessage` protocol (`HostToWebviewMessage` / `WebviewToHostMessage`)
2. **Scroll Sync:** `data-source-line` attributes on block elements, binary search for nearest, 80ms ignore flag to prevent infinite loops
3. **Theme Sync:** CSS variables from VS Code auto-injected into webview, mapped to semantic tokens in `theme-bridge.css`
4. **State Persistence:** `retainContextWhenHidden: true` + `vscode.getState()/setState()` for scroll, TOC, mode
5. **Performance:** 200ms debounce on text changes, full re-parse for files < 5000 lines
6. **CSP Security:** Strict Content-Security-Policy with nonce for scripts
7. **Presentation Mode:** Separate `SlideView.svelte` component, slides split on `<hr>` tags from `---`
8. **Rich Layout Engine (v0.2.0):** Frontmatter `layout:` field hoặc auto-detect → Magazine / Docs / Story / Dashboard

---

## Commands

| Command | ID |
|---------|-----|
| Open Preview | `markdownWarrior.openPreview` |
| Toggle Presentation | `markdownWarrior.togglePresentation` |
| Export HTML | `markdownWarrior.exportHTML` |
| Export PDF | `markdownWarrior.exportPDF` |

---

## Build & Dev

```bash
npm run build              # Build both extension + webview
npm run build:extension    # esbuild → dist/extension/extension.js
npm run build:webview      # vite build → dist/webview/
npm test                   # vitest run
npx vsce package --no-dependencies   # Create .vsix
```

**Debug:** F5 → mở Extension Development Host → mở file `.md` → test

---

## Những gì đã làm trong session v0.2.0

### Phase: Rich Layout Engine
- Thêm 4 layout mới: **Magazine**, **Docs**, **Story**, **Dashboard**
- Layout switcher toolbar với persisted auto/manual selection
- Frontmatter-aware override (`layout: magazine`) + content-based auto-detection
- Shared reveal motion system với reduced-motion fallback
- Tests cho layout detection, reveal behavior, section structure

### Fixes
- Preserved source-line `0` mapping trong layout model
- Preserved pre-heading content trong section-based layouts
- Tránh duplicate section IDs bằng stable internal keys
- Hardened layout switching lifecycle cleanup
- Cải thiện dashboard accessibility (aria, collapsed body)

### Build & Packaging
- Tạo `markdown-warrior-preview-0.2.0.vsix` (2.7 MB, 71 files)
- Fix `.vscodeignore`: loại `.claude/`, `tests/`, `*.out`, `svelte.config.js` → giảm từ 4.97 MB xuống 2.7 MB
- Harden `activate()`: wrap Shiki `initialize()` bằng try/catch → tránh "command not found" nếu WASM lỗi

---

## Known Issues / Cần theo dõi

- **Shiki WASM trong esbuild bundle**: Nếu `createHighlighter()` fail, extension vẫn hoạt động nhưng không có syntax highlighting. Kiểm tra qua **Output → Extension Host** log `[MarkdownWarrior] ... failed:`.
- Extension chỉ activate khi mở file `.md` (`onLanguage:markdown`) — phải mở file `.md` trước khi dùng command.
- `activate()` tạo 2 `MarkdownEngine` (1 cho PreviewProvider, 1 cho Exporter) → Shiki load 2 lần.

---

## Mục tiêu session tiếp theo

- Kiểm tra log Extension Host để xác nhận Shiki WASM có load được không
- Push 27 commits lên GitHub / publish lên Marketplace nếu muốn
- Cải thiện tiếp layout hoặc thêm tính năng mới
