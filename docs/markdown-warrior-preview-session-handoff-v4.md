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
- Tests: Vitest — source-text pattern (`readFileSync` + `toContain`).
- Packaging: `npx vsce package` → `.vsix`.

---

## 2. Trạng Thái Hiện Tại

### Phiên bản

**v0.3.0** — đã commit, tag, đóng gói, đẩy lên remote.

```text
VSIX: markdown-warrior-view-0.3.0.vsix
Git tag: v0.3.0
Remote: https://github.com/duong6003/Markdown-Warrior-Preview.git
Branch: master
HEAD: b832eba Prepare release 0.3.0 package
```

### Test suite

```
14 test files, 93 tests — tất cả pass
```

### Build

Extension bundle + Vite webview build: thành công.
Warning không blocking: `dist\extension\extension.js 10.3mb` (tồn tại từ trước).

---

## 3. Những Gì Đã Làm Trong Session Này

### Phase: Display Experience Optimization

**v0.2.0 — Ghost Nav (session trước)**
- Xoá sidebar cố định của Docs, xoá rail cố định của Magazine.
- Thêm `GhostNav.svelte`: hover-triggered overlay nav, trigger zone 20 px cạnh trái, fly transition (`x: -220`, 180 ms, `cubicOut`), debounce 150 ms.
- Content full-width thay vì mất không gian cho sidebar/rail.

**v0.3.0 — Article Layout Consolidation + Ghost Strip (session này)**

1. **Xoá `docs` layout** — `DocsLayout.svelte` deleted.
2. **Đổi tên `magazine` → `article`** — `MagazineLayout.svelte` → `ArticleLayout.svelte`, toàn bộ CSS class `magazine-*` → `article-*`, kicker text `"Markdown Warrior"` → `"Article"`.
3. **Type system**: `LAYOUT_TYPES = ['article', 'story', 'dashboard']` (bỏ `docs`, `magazine`).
4. **Layout engine**: `LAYOUT_PRIORITY = ['story', 'dashboard']`, score key `magazine` → `article`.
5. **App.svelte + LayoutToolbar**: cập nhật imports, render branch, labels, options.
6. **CSS cleanup**: xoá dead selectors `.docs-sidebar` và `.magazine-rail` khỏi `layouts.css`; xoá `BalancedCardLayout` dead values `'docs' | 'magazine'` khỏi `balanced-card.ts`.
7. **Ghost strip affordance**: thêm `<div class="ghost-strip">` trong `GhostNav.svelte` — dải gradient 3 px cạnh trái, opacity 0.4, fade out khi panel mở (`class:hidden={navVisible}`).

---

## 4. Cấu Trúc File Quan Trọng

```
src/
  webview/
    layouts/
      ArticleLayout.svelte   ← layout duy nhất cho long-form content
      StoryLayout.svelte
      DashboardLayout.svelte
    lib/
      GhostNav.svelte        ← overlay nav dùng chung (có ghost-strip)
      layout-engine.ts       ← LAYOUT_TYPES, LAYOUT_PRIORITY, detectLayout
      balanced-card.ts       ← BalancedCardLayout = 'article' | 'dashboard' | 'story'
    types/
      layout.ts              ← LAYOUT_TYPES = ['article', 'story', 'dashboard']
    components/
      LayoutToolbar.svelte
    App.svelte
  styles/
    layouts.css

tests/
  article-layout.test.ts
  ghost-nav.test.ts
  layout-engine.test.ts
  layout-styles.test.ts
  ... (14 files total)
```

---

## 5. Domain Knowledge & Constraints

Git requires safe directory override:
```powershell
git -c safe.directory='C:/Users/PC/Desktop/extention markdown' <command>
```

Layout detection priority: `story` > `dashboard` > `article` (article là baseline fallback, có `+ 2` constant).

GhostNav behavior contract:
- Render chỉ khi `sections.length > 1`.
- Edge zone: fixed 20 px cạnh trái.
- `showNav()` clears pending hide timeout, sets visible.
- `scheduleHide()` hides sau 150 ms.
- `onDestroy` clears hideTimeout.
- Mobile: hidden via `@media (max-width: 900px)`.

Ghost strip:
- 3 px wide, `var(--md-accent)` gradient fade ở hai đầu, opacity 0.4.
- `class:hidden={navVisible}` → opacity 0 khi panel mở.
- `pointer-events: none` — không chặn edge zone hover.

Saved `layoutOverride: 'docs'` hoặc `'magazine'` từ bản cũ: `isLayoutType()` trả về false, `resolveLayout()` fallback to auto — graceful degradation, không cần migration.

Source-text test pattern:
```typescript
const source = readFileSync('src/webview/...', 'utf8');
expect(source).toContain('...');
```

---

## 6. Open Items / Hot Spots

- Runtime smoke test trong VS Code thực chưa được chạy (chưa verify hover behavior trong webview thật).
- Extension bundle size 10.3 MB là tồn tại từ trước — non-blocking nhưng cần xem xét tree-shaking trong tương lai.
- `layouts.css` vẫn còn `.docs-sidebar button:focus-visible, .magazine-rail button:focus-visible` và `.docs-sidebar button.active, .magazine-rail button.active` — dead CSS nhưng không gây lỗi. Có thể dọn tiếp nếu muốn.

---

## 7. Next Steps Gợi Ý

Những hướng tiếp theo có thể làm:

1. **Runtime smoke test** — cài `.vsix`, mở markdown trong VS Code, verify ghost nav và ghost strip hoạt động đúng.
2. **Dọn nốt dead CSS** — xoá `.docs-sidebar` và `.magazine-rail` khỏi base rule, focus-visible rule, active rule trong `layouts.css`.
3. **Feature mới** — keyboard navigation cho ghost nav panel (hiện đang out of scope).
4. **Bundle size** — investigate tree-shaking Mermaid/KaTeX để giảm extension bundle từ 10.3 MB.

---

## 8. Lệnh Tiếp Tục

```powershell
# Kiểm tra trạng thái
git -c safe.directory='C:/Users/PC/Desktop/extention markdown' log --oneline -5
npm test

# Build
npm run build

# Đóng gói phiên bản tiếp theo
npx vsce package
```

Suggested prompt for next session:

```text
Read docs/markdown-warrior-preview-session-handoff-v4.md.
Continue from current repo state.
```
