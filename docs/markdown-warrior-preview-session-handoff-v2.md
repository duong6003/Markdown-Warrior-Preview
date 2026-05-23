# Markdown Warrior Preview — Session Handoff v2

> Mục đích: chuyển đầy đủ ngữ cảnh sang session mới để thực thi plan v0.6.0 không cần hỏi lại.
> Paste toàn bộ document này vào đầu session mới.

---

## 1. Bối cảnh & Mục tiêu

**Project:** `MarkdownWarriorPreview` — VS Code extension, markdown preview với rich layouts.

**Repo:** `https://github.com/duong6003/Markdown-Warrior-Preview.git`  
**Publisher:** `Dng`  
**Main checkout:** `C:\Users\PC\Desktop\extention markdown`

**Session này đã làm:**
- Brainstorm + thiết kế feature **theme selection cho v0.6.0**.
- Viết design spec: `docs/superpowers/specs/2026-05-22-theme-selection-design.md`.
- Viết implementation plan: `docs/superpowers/plans/2026-05-22-theme-selection.md`.

**Mục tiêu session tới:**
- Thực thi plan `docs/superpowers/plans/2026-05-22-theme-selection.md` từ đầu đến cuối.
- Kết thúc với VSIX `markdown-warrior-preview-0.6.0.vsix` và tag `v0.6.0`.

---

## 2. Tech Stack & Architecture

- **Extension host:** TypeScript, esbuild
- **Webview:** Svelte 5, Vite
- **Markdown:** markdown-it, Shiki (syntax), KaTeX (math), Mermaid (diagrams)
- **Tests:** Vitest
- **Package:** `@vscode/vsce`

**Key paths:**
- `src/extension/extension.ts` — activation, command registration
- `src/extension/preview-provider.ts` — WebviewPanel, message handling, file watcher
- `src/extension/markdown-engine.ts` — markdown-it + Shiki render
- `src/shared/messages.ts` — typed message contracts (host↔webview)
- `src/webview/App.svelte` — root webview app
- `src/webview/components/LayoutToolbar.svelte` — toolbar (styles in `layouts.css`, no `<style>` block)
- `src/webview/components/` — SlideView, LayoutToolbar (existing); ThemePanel (to create)
- `src/webview/lib/` — layout-engine, balanced-card, clip-detect, message-bridge, source-map, …
- `src/webview/styles/layouts.css` — shared CSS tokens + toolbar styles
- `src/webview/main.ts` — webview entry, CSS imports
- `tests/` — Vitest tests (currently 10 files; after merge: 11 files, 67 tests)

**Commands:**

| Purpose | Command |
|---------|---------|
| Test | `npm test` |
| Build | `npm run build` |
| Package VSIX | `npx vsce package` |

---

## 3. Trang Thái Git Hiện Tại

**Branch:** `master`  
**HEAD:** `2422db1 Add theme selection implementation plan for v0.6.0`  
**Ahead of remote:** 22 commits (chưa push)

**Branch `scroll-first-reading` chưa merge:**
- Worktree tại: `C:\Users\PC\Desktop\extention markdown\.worktrees\scroll-first-reading`
- HEAD: `a47b809 Release scroll-first reading as 0.5.0`
- Tag `v0.5.0` đã tạo trên branch đó
- VSIX `markdown-warrior-preview-0.5.0.vsix` đã có trên disk (ignored by git)
- **Chưa merge vào master** — Task 0 của plan sẽ làm việc này

**Untracked files (không xóa):**
- `docs/SESSION-SUMMARY.md` (modified)
- `docs/markdown-warrior-preview-session-handoff-v1.md`
- `.claude/`, `.superpowers/`, `build-extension.out`, `prepublish.out`
- Various `docs/superpowers/plans/` và `specs/` files

---

## 4. Design Decisions Đã Chốt (v0.6.0)

| Quyết định | Chi tiết |
|-----------|---------|
| Theme scope | Full theme pack: color + syntax + font + spacing |
| Số themes | 12 built-in (xem danh sách bên dưới) |
| Customization | Không — built-in only cho v0.6.0 |
| UI placement | Side panel bên phải, toggle bằng 🎨 trong toolbar |
| Persistence | VS Code `globalState` — global, độc lập với VS Code theme |
| Architecture | CSS custom properties (`data-theme` attribute) + Shiki theme map |

**12 Themes:**

| id | Label | Mode | Shiki theme |
|----|-------|------|-------------|
| `catppuccin-mocha` | Catppuccin Mocha | dark | `catppuccin-mocha` |
| `github-dark` | GitHub Dark | dark | `github-dark` |
| `dracula` | Dracula | dark | `dracula` |
| `tokyo-night` | Tokyo Night | dark | `tokyo-night` |
| `nord` | Nord | dark | `nord` |
| `high-contrast-dark` | High Contrast Dark | dark | `min-dark` |
| `vesper` | Vesper | dark | `vesper` |
| `pitch-black` | Pitch Black (OLED) | dark | `github-dark` *(fallback)* |
| `catppuccin-latte` | Catppuccin Latte | light | `catppuccin-latte` |
| `github-light` | GitHub Light | light | `github-light` |
| `sepia` | Sepia | light | `min-light` |
| `solarized-light` | Solarized Light | light | `solarized-light` |

**Default theme:** `catppuccin-mocha`

---

## 5. Plan Summary (11 Tasks)

Plan đầy đủ tại: `docs/superpowers/plans/2026-05-22-theme-selection.md`

| Task | Mô tả |
|------|-------|
| **Task 0** | Merge `scroll-first-reading` → master, run tests, cleanup worktree + branch |
| **Task 1** | CHANGELOG 0.3/0.4/0.5, fix Vite chunk warning, rename svelte.config → .mjs |
| **Task 2** | Update `src/shared/messages.ts` — thêm `setTheme`, thêm `themeId` vào `update` |
| **Task 3** | Create `src/webview/lib/theme-registry.ts` (TDD, 7 tests) |
| **Task 4** | Create `src/webview/styles/themes.css` (TDD, 4 tests) + import trong `main.ts` |
| **Task 5** | Update `src/extension/markdown-engine.ts` — `shikiTheme` param + load 11 themes (TDD, 3 tests) |
| **Task 6** | Update `preview-provider.ts` + `extension.ts` — `globalState` persistence, `setTheme` handler |
| **Task 7** | Create `src/webview/components/ThemePanel.svelte` (TDD, 5 tests) |
| **Task 8** | Update `src/webview/components/LayoutToolbar.svelte` — thêm 🎨 toggle button |
| **Task 9** | Update `src/webview/App.svelte` — mount ThemePanel, `data-theme`, `handleThemeSelect` |
| **Task 10** | Update `src/webview/styles/layouts.css` — theme variable fallbacks + toggle button CSS |
| **Task 11** | Release v0.6.0 — version bump, CHANGELOG entry, VSIX, tag `v0.6.0` |

**Expected sau khi done:** ~89 tests pass, `markdown-warrior-preview-0.6.0.vsix` tạo thành công.

---

## 6. Insights & Constraints Quan Trọng

**LayoutToolbar.svelte KHÔNG có `<style>` block**
- Tất cả toolbar styles ở trong `src/webview/styles/layouts.css`
- Style cho `.layout-toolbar__theme-toggle` phải thêm vào `layouts.css` (Task 10), không phải trong component

**markdown-engine.ts: chỉ thay đổi 5 thứ, không đụng private methods**
- Thêm `DEFAULT_SHIKI_THEME` + `SHIKI_THEMES` constants trước class
- Thêm `private currentShikiTheme` field trong class
- Sửa `constructor` highlight callback: `theme: 'css-variables'` → `theme: this.currentShikiTheme`
- Sửa `initialize()`: load tất cả SHIKI_THEMES thay vì chỉ `'css-variables'`
- Sửa `render()`: thêm `shikiTheme = DEFAULT_SHIKI_THEME` param, set `this.currentShikiTheme`
- `renderFrontmatter`, `addKaTeXPlugin`, `addTaskListPlugin`, `addSourceMapPlugin`, `addHeadingIds`, `escapeHtml` — GIỮ NGUYÊN

**PreviewProvider cần thêm context param**
- Constructor hiện tại: `constructor(private readonly extensionUri: vscode.Uri)`
- Sau: `constructor(private readonly extensionUri: vscode.Uri, private readonly context: vscode.ExtensionContext)`
- `extension.ts` phải pass: `new PreviewProvider(context.extensionUri, context)`

**Test environment: Shiki không được initialize**
- Các tests trong `markdown-engine.test.ts` skip `engine.initialize()` vì Shiki requires bundled themes
- Tests cho `shikiTheme` param chỉ verify function accepts param, không verify actual Shiki output

**Worktree merge — dùng safe.directory nếu cần**
- Nếu git báo safe.directory error: `git -c safe.directory='C:/Users/PC/Desktop/extention markdown/.worktrees/scroll-first-reading' ...`

**Two-step theme update (CSS instant + Shiki async)**
- Khi user click theme: `document.documentElement.dataset.theme = themeId` → CSS thay đổi ngay
- Sau đó gửi `postMessage({ type: 'setTheme', themeId })` → extension re-render → syntax highlighting cập nhật
- Đây là UX intentional: prose layer instant, code blocks sau round-trip

---

## 7. Cách Thực Thi Trong Session Mới

**Recommended:** Dùng subagent-driven-development skill.

Prompt để bắt đầu session mới:

```
Đọc docs/markdown-warrior-preview-session-handoff-v2.md để hiểu context.

Sau đó thực thi plan tại docs/superpowers/plans/2026-05-22-theme-selection.md.
Dùng superpowers:subagent-driven-development để dispatch từng task.
Bắt đầu từ Task 0.
```

Hoặc nếu muốn inline:

```
Đọc docs/markdown-warrior-preview-session-handoff-v2.md để hiểu context.

Sau đó thực thi plan tại docs/superpowers/plans/2026-05-22-theme-selection.md.
Dùng superpowers:executing-plans để chạy từng task với checkpoints.
Bắt đầu từ Task 0.
```

---

## 8. Out of Scope / Chưa Làm

- Push commits/tags lên remote (master ahead 22, v0.5.0 tag chưa push)
- Publish lên VS Code Marketplace
- Cleanup untracked files cũ (build-extension.out, prepublish.out, docs cũ)
- Custom theme authoring (v0.7.0 nếu user cần)
- Per-file theme override via frontmatter (out of scope v0.6.0)
