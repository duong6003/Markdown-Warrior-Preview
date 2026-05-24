# Markdown Warrior Preview - Session Handoff v5

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

**v0.5.0** — đã commit, tag, đóng gói, và push remote.

```text
VSIX: markdown-warrior-view-0.5.0.vsix
Git tag: v0.5.0
Branch: master
HEAD: cd0a2aa chore: release v0.5.0
Previous release tag: v0.4.1
Remote: https://github.com/duong6003/Markdown-Warrior-Preview.git
Remote status: master và tag v0.5.0 đã push lên remote
```

### Test suite

```text
npm test
28 test files, 191 tests — tất cả pass
```

### Build & Package

```text
npm run build
build:export-styles + build:extension + build:webview — tất cả pass

npm exec -- vsce package
Packaged: markdown-warrior-view-0.5.0.vsix (77 files, 2.72 MB)
```

Warning không blocking: `dist\extension\extension.js 10.3mb` — tồn tại từ trước.

---

## 3. Những Gì Đã Làm Trong Session Này

### Phase: WYSIWYG Export (HTML & PDF)

**Vấn đề:** Export feature không khớp với preview vì CSS viết tay trong `wrapExportHTMLDocument()` bị drift so với webview CSS thực tế. `exportPDF()` dùng `wrapInHTMLDocument()` cũ — không apply theme/fonts gì hết.

**Giải pháp:** Nhúng trực tiếp các CSS file của webview (`themes.css`, `markdown-body.css`, `extensions.css`) vào exported HTML. Thay vì duplicate CSS bằng tay, export đặt `data-theme` trên `<html>` để trigger đúng CSS rules — giống hệt cách webview làm.

Design + plan docs:

```text
docs/superpowers/specs/2026-05-24-wysiwyg-export-design.md
docs/superpowers/plans/2026-05-24-wysiwyg-export.md
```

Implementation commits:

```text
0429340 Unify export rendering with preview CSS
cd0a2aa chore: release v0.5.0
```

---

## 4. Cấu Trúc File Quan Trọng

```text
src/
  extension/
    extension.ts             ← exportPDF command: async, lấy config, pass vào exporter
    exporter.ts              ← buildExportHTML() pure function; readExportStyles(); exportHTML/exportPDF dùng CSS files
    font-inliner.ts          ← Google Fonts CSS/woff2 fetch + base64 inline + fallback stacks (không đổi)
    preview-provider.ts      ← persists selected theme + font slots, exposes getExportConfig()
  shared/
    export-config.ts         ← ExportConfig, DEFAULT_EXPORT_CONFIG, normalizeExportConfig (THEME_EXPORT_COLORS đã xóa)
    font-registry.ts         ← shared body/heading/code font registry
    messages.ts              ← setFont + syncFonts webview-to-host messages
    theme-registry.ts        ← preview themes + Shiki themes
  webview/
    App.svelte               ← sends syncFonts on mount and setFont on font change
    styles/
      themes.css             ← nguồn gốc theme colors — được copy vào dist/export-styles/ khi build
      markdown-body.css      ← content typography — được copy vào dist/export-styles/ khi build
      extensions.css         ← frontmatter, KaTeX, mermaid shells — được copy vào dist/export-styles/ khi build

dist/
  export-styles/             ← CSS files được copy từ src/webview/styles/ bởi build:export-styles step
    themes.css
    markdown-body.css
    extensions.css
  extension/                 ← esbuild output
  webview/                   ← Vite output

scripts/
  copy-export-styles.js      ← copy 3 CSS files từ src/ vào dist/export-styles/

tests/
  exporter-css-embed.test.ts ← tests cho buildExportHTML pure function
  exporter-config.test.ts    ← source-text tests cho exporter wiring
  export-config.test.ts      ← tests cho normalizeExportConfig (THEME_EXPORT_COLORS tests đã xóa)
  extension-export-config.test.ts ← tests cho exportHTML + exportPDF config wiring
  ... (28 files total)
```

---

## 5. Domain Knowledge & Constraints

Git may require safe directory override in some shells:

```powershell
git -c safe.directory='C:/Users/PC/Desktop/extention markdown' <command>
```

### Export flow (v0.5.0)

```text
exportHTML / exportPDF command:
  → previewProvider.getExportConfig()        ← theme + font selections từ globalState
  → exporter.exportHTML/exportPDF(editor, config)
  → prepareFonts(config, showDialog)         ← Google Fonts dialog nếu cần
  → engine.render(text, shikiTheme)          ← named Shiki theme, inline hex colors
  → readExportStyles()                       ← đọc CSS từ dist/export-styles/
  → buildExportHTML(html, fileName, themeId, fontResult, cssFiles, [printCss])
     └─ <html data-theme="themeId">
        ├─ themes.css          ← sets --md-* vars per theme
        ├─ markdown-body.css   ← content typography
        ├─ extensions.css      ← frontmatter, KaTeX, mermaid
        ├─ font overrides      ← --md-font-body/heading/mono từ config
        └─ Google Fonts CSS    ← embedded hoặc fallback
  → save dialog / open in browser
```

PDF-only: thêm `@media print` với `print-color-adjust: exact`, page break rules.

### CSS architecture

- `themes.css`: mỗi `[data-theme="id"]` block set `--theme-*` vars → mapped sang `--md-*` vars ở dưới cùng
- `markdown-body.css`: tất cả content styles dùng `--md-*` vars
- `extensions.css`: frontmatter block, KaTeX, mermaid shell, collapsible headings, task checkboxes
- `theme-bridge.css`: **không include trong export** — chỉ dùng cho `--vscode-*` vars trong webview context

### Điểm quan trọng

- `THEME_EXPORT_COLORS` đã xóa hoàn toàn — không còn parallel color table
- `buildExportHTML` là pure exported function, dễ test (không depend vào vscode)
- `Exporter` constructor: `new Exporter(engine, context.extensionUri)`
- Build step `build:export-styles` phải chạy trước `build:extension` và `build:webview`
- `vscode:prepublish` cũng include `build:export-styles`
- Shiki vẫn dùng named themes (inline hex), không dùng css-variables — không liên quan đến `--shiki-*` vars trong theme-bridge.css

### Source-text test pattern

```typescript
const source = readFileSync('src/extension/exporter.ts', 'utf8');
expect(source).toContain('export function buildExportHTML(');
```

---

## 6. Open Items / Hot Spots

- **Không publish Marketplace:** VSIX và tag `v0.5.0` đã push remote; `vsce publish` chưa chạy.
- **Runtime smoke test chưa làm:** Chưa mở VS Code Extension Development Host sau v0.5.0 để test export thủ công.
- **Bundle size:** extension bundle vẫn ~10.3 MB; non-blocking nhưng đáng investigate sau.
- **Mermaid trong export:** Mermaid diagrams xuất hiện dạng code block trong exported HTML (không render SVG). Acceptable hiện tại, có thể cải thiện sau.
- **KaTeX offline:** Export dùng KaTeX CDN link — cần internet để render math. Fully offline là future option.

---

## 7. Next Steps Gợi Ý

1. **Manual smoke test** — install VSIX, mở markdown file, export HTML + PDF, kiểm tra output khớp preview

```powershell
code --install-extension markdown-warrior-view-0.5.0.vsix
```

Verify:
- Export HTML có `data-theme` đúng với theme đang chọn
- Colors khớp preview
- Fonts khớp
- Frontmatter block xuất hiện trong HTML export
- PDF mở trong browser với đúng theme, `Ctrl+P` → print as PDF hoạt động

2. **Publish VS Code Marketplace** (requires token/login)

```powershell
npm exec -- vsce publish
```

3. **Tính năng tiếp theo** có thể xem xét:
- Mermaid render trong export (snapshot SVG từ webview sau khi render)
- Export offline-first (embed KaTeX CSS, embed Google Fonts mặc định)
- Bundle size investigation (~10.3 MB extension.js)

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
Read docs/markdown-warrior-preview-session-handoff-v5.md.
Continue from current repo state.
```
