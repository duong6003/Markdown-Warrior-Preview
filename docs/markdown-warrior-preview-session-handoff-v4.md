# Markdown Warrior Preview - Session Handoff v4

> Mục đích: chuyển đầy đủ ngữ cảnh sang session mới.
> Paste toàn bộ document này vào đầu session mới.

---

## 1. Bối Cảnh & Mục Tiêu

Project: Markdown Warrior Preview - VS Code extension cho markdown preview.

Working directory:

```text
C:\Users\PC\Desktop\extention markdown
```

Tech stack:
- VS Code extension host: TypeScript, esbuild.
- Webview: Svelte 5, TypeScript, Vite.
- Tests: Vitest — phần lớn dùng source-text pattern (`readFileSync` + `toContain`) cho wiring/extension behavior.
- Packaging: `npm exec -- vsce package` → `.vsix`.

---

## 2. Trạng Thái Hiện Tại

### Phiên bản

**v0.4.0** — đã commit, tag local, đóng gói local. Chưa push remote, chưa publish Marketplace.

```text
VSIX: markdown-warrior-view-0.4.0.vsix
Git tag: v0.4.0
Branch: master
HEAD: b7867ea docs: add v0.4.0 release notes
Previous release tag: v0.3.0
Remote: https://github.com/duong6003/Markdown-Warrior-Preview.git
Remote status: master ahead origin/master by 24 commits
```

### Test suite

Fresh verification trong release session:

```text
npm test
23 test files, 163 tests — tất cả pass
```

### Build & Package

```text
npm run build
extension + webview build pass

npm exec -- vsce package
Packaged: markdown-warrior-view-0.4.0.vsix (73 files, 2.72 MB)
```

Warning không blocking: `dist\extension\extension.js 10.3mb` tồn tại từ trước.

---

## 3. Những Gì Đã Làm Trong Session Này

### Phase: UX polish + font options + performance fixes

Trước khi làm export HTML, đã review/fix các thay đổi UI/font/perf:

1. **Ghost Nav affordance** — chevron/strip rõ hơn; chevron vị trí đúng `left: -3px`.
2. **Context menu command** — preview command có trong editor context menu cho markdown.
3. **App icon** — icon mới đã dùng trong package.
4. **Font options** — ThemePanel có body/heading/code font selection.
5. **Google Fonts loader** — encode family spaces theo Google Fonts API (`Playfair+Display`, `Fira+Code`, ...).
6. **CSP** — cho phép `fonts.googleapis.com` và `fonts.gstatic.com` trong webview.
7. **Font CSS vars** — thêm `--md-font-heading`, body/code font vars.
8. **Performance** — `createDocumentModel()` có same-input memo cache và `resetDocumentModelCache()` cho tests.
9. **Review fixes** — gỡ dependency thừa `sharp`, `@vitest/browser`; không swallow error trong `applyFont` ngoại trừ unknown font.

Commit liên quan:

```text
65c0e67 fix: address code review findings — font encoding, chevron position, error logging, cache reset
8f72ece perf: add same-input memo cache to createDocumentModel
e3f6477 feat: add font selection UI in ThemePanel with body, heading, code slots
4f1e416 fix: allow Google Fonts domains in webview CSP
4990cad feat: add --md-font-heading CSS variable and apply to headings
c7f8c88 feat: extend WebviewState with fontBody, fontHeading, fontCode
```

### Phase: HTML Export with Current Configuration

Goal: `Export as HTML` tạo standalone HTML khớp preview config hiện tại:
- selected theme colors baked-in, không dùng `prefers-color-scheme`.
- body / heading / code font choices.
- Shiki syntax highlight theme theo selected theme.
- Google Fonts optional inline base64 `woff2` cho offline; fallback system fonts nếu user chọn fallback.
- `exportPDF` out of scope, giữ behavior cũ.

Design + plan docs:

```text
docs/superpowers/specs/2026-05-23-html-export-with-config-design.md
docs/superpowers/plans/2026-05-23-html-export-with-config.md
```

Implementation commits:

```text
0f70258 feat: add export config theme palettes
5611381 fix: align export palettes with preview tokens
0cfd799 refactor: share font registry with extension host
554416b feat: add Google Fonts inliner for HTML export
8122107 feat: sync font selections to extension host
12ef119 feat: persist font selections for export
113532b feat: export HTML with preview config
```

Release commits:

```text
d92cde0 chore: release v0.4.0
b7867ea docs: add v0.4.0 release notes
```

---

## 4. Cấu Trúc File Quan Trọng

```text
src/
  extension/
    extension.ts             ← exportHTML command lấy previewProvider.getExportConfig()
    exporter.ts              ← exportHTML(editor, config), Shiki theme, font dialog, baked HTML wrapper
    font-inliner.ts          ← Google Fonts CSS/woff2 fetch + base64 inline + fallback stacks
    preview-provider.ts      ← persists selected theme + font slots, exposes getExportConfig()
  shared/
    export-config.ts         ← ExportConfig, theme export colors, defaults, normalization
    font-registry.ts         ← shared body/heading/code font registry
    messages.ts              ← setFont + syncFonts webview-to-host messages
    theme-registry.ts        ← preview themes + Shiki themes
  webview/
    App.svelte               ← sends syncFonts on mount and setFont on font change
    lib/
      font-registry.ts       ← re-export from shared/font-registry
      font-loader.ts         ← Google Fonts loader for preview
      layout-engine.ts       ← memoized document model
      GhostNav.svelte        ← overlay nav affordance
    components/
      ThemePanel.svelte      ← theme + font UI

tests/
  export-config.test.ts
  font-registry.test.ts
  font-inliner.test.ts
  app-font-sync.test.ts
  preview-provider-fonts.test.ts
  extension-export-config.test.ts
  exporter-config.test.ts
  ... (23 files total)
```

---

## 5. Domain Knowledge & Constraints

Git may require safe directory override in some shells:

```powershell
git -c safe.directory='C:/Users/PC/Desktop/extention markdown' <command>
```

HTML export config flow:

```text
markdownWarrior.exportHTML command
  → previewProvider.getExportConfig()
  → exporter.exportHTML(editor, config)
  → prepareFonts(config, showDialog)
  → getTheme(config.themeId).shikiTheme
  → engine.render(text, shikiTheme)
  → wrapExportHTMLDocument(html, fileName, config, fontResult)
```

Font state constraints:
- Font UI state originates in webview/browser state.
- `App.svelte` sends `syncFonts` on mount and `setFont` on each change.
- `PreviewProvider` persists font slots into `context.globalState`.
- Export command reads persisted values with defaults: body `system`, heading `inherit`, code `cascadia`.

Google Fonts export behavior:
- If no selected font uses Google Fonts → no dialog, use resolved configured stacks.
- If Google Fonts present → modal prompt:
  - `Embed` → fetch Google CSS + woff2, inline as base64.
  - `Use system fallbacks` → no external font CSS, use system stacks.
  - `Cancel` → abort export silently before save dialog.
- Individual woff2 fetch failures keep original URL in CSS and log warning.
- Google CSS fetch failure falls back to system stacks.

Theme export behavior:
- Uses `THEME_EXPORT_COLORS` from `src/shared/export-config.ts`.
- Unknown theme falls back to `github-dark` colors.
- Exported HTML wrapper must not contain `prefers-color-scheme`.
- `exportPDF` remains on old `wrapInHTMLDocument()` path.

Source-text test pattern:

```typescript
const source = readFileSync('src/extension/exporter.ts', 'utf8');
expect(source).toContain('public async exportHTML(editor: vscode.TextEditor, config: ExportConfig)');
```

---

## 6. Open Items / Hot Spots

- **Not pushed:** `master` and tag `v0.4.0` are local only.
- **Not marketplace-published:** VSIX exists locally; `vsce publish` not run.
- **Runtime smoke test:** Not manually verified in VS Code Extension Development Host after v0.4.0.
- **Bundle size:** extension bundle remains ~10.3 MB; non-blocking but worth investigating later.
- **Old VSIX artifacts:** multiple older `.vsix` files remain in repo root; not tracked by git unless explicitly added.
- **Claude local config:** `.claude/settings.local.json` remains untracked local config; do not commit unless intentional.

---

## 7. Next Steps Gợi Ý

1. **Push release to remote**

```powershell
git push origin master
git push origin v0.4.0
```

2. **Publish VS Code Marketplace** (requires token/login)

```powershell
npm exec -- vsce publish
```

3. **Manual install smoke test**

```powershell
code --install-extension markdown-warrior-view-0.4.0.vsix
```

Then verify in VS Code:
- Open markdown file.
- Open Markdown Warrior preview.
- Select theme + fonts in ThemePanel.
- Run `Markdown Warrior: Export as HTML`.
- Test `Embed`, `Use system fallbacks`, and `Cancel` flows.
- Inspect exported HTML for:
  - `--md-bg-primary` matching selected theme.
  - `--md-font-body`, `--md-font-heading`, `--md-font-mono` matching selected/fallback stacks.
  - Shiki code colors matching selected theme.
  - no `prefers-color-scheme`.

4. **Clean old artifacts** if desired:
- Keep latest `markdown-warrior-view-0.4.0.vsix`.
- Delete old local `.vsix` files only if no longer needed.

---

## 8. Lệnh Tiếp Tục

```powershell
# Kiểm tra trạng thái
git status --short --branch
git log --oneline -8
git tag --list --sort=-version:refname

# Verify
npm test
npm run build

# Package lại nếu cần
npm exec -- vsce package
```

Suggested prompt for next session:

```text
Read docs/markdown-warrior-preview-session-handoff-v4.md.
Continue from current repo state.
```
