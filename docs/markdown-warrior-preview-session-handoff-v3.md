# Markdown Warrior Preview - Session Handoff v3

> Muc dich: chuyen day du ngu canh sang session moi de tiep tuc cong viec tren Markdown Warrior Preview khong phai hoi lai.
> Paste toan bo document nay vao dau session moi.

---

## 1. Boi Canh & Muc Tieu

Project: Markdown Warrior Preview - VS Code extension cho markdown preview.

Working directory:

```text
C:\Users\PC\Desktop\extention markdown
```

Tech stack:
- VS Code extension host: TypeScript, esbuild.
- Webview: Svelte 5, TypeScript, Vite.
- Tests: Vitest.
- Current test style for layout/component source checks: `readFileSync` + `toContain` / `not.toContain` assertions in `tests/`.

User request in this session:

```text
Execute the implementation plan at docs/superpowers/plans/2026-05-23-ghost-nav.md.
Use the superpowers:subagent-driven-development skill to implement it task-by-task.
```

Plan goal:
- Replace permanent Docs sidebar and Magazine rail with `GhostNav.svelte`.
- GhostNav is a hover-triggered overlay nav.
- Trigger zone: fixed 20px left edge of viewport.
- Panel appears via Svelte `fly` transition from left.
- Content gets full width instead of losing space to permanent nav.

Design spec reference:

```text
docs/superpowers/specs/2026-05-23-ghost-nav-design.md
```

Implementation plan reference:

```text
docs/superpowers/plans/2026-05-23-ghost-nav.md
```

---

## 2. Domain Knowledge & Constraints

Repo/project constraints:
- Follow AGENTS.md in workspace root.
- Work autonomously; ask only for destructive/ambiguous actions.
- Use `superpowers:subagent-driven-development` when requested.
- Use source-text tests in this repo for layout/component structural assertions.
- Keep changes small and scoped.
- Do not revert unrelated dirty files.

GhostNav behavior contract:
- Render only when `sections.length > 1`.
- Edge zone is left fixed hover target, width `20px`.
- `showNav()` clears pending hide timeout and sets visible.
- `scheduleHide()` hides after `150ms`.
- Edge zone and panel both use `mouseenter`/`mouseleave` handoff.
- Panel uses `transition:fly={{ x: -220, duration: 180, easing: cubicOut }}`.
- Panel centered vertically with `top: 50%` and `transform: translateY(-50%)`.
- Nested/deep sections use `class:deep={section.level > 2}`.
- Button click calls `onNavigate(section.key, section.id)`.
- Mobile CSS hides GhostNav at `@media (max-width: 900px)`.

Layout-specific contract:
- Docs layout still respects `showTOC`; when `showTOC` is false, navigation must not render.
- Magazine layout keeps `showTOC` prop for API compatibility, but GhostNav is independent of `showTOC` per spec.
- Magazine balanced-card and `clipDetect` behavior must remain intact.
- No keyboard navigation feature required in this phase; design spec lists keyboard navigation out of scope.

Git constraints:
- Git requires safe directory override in this environment:

```powershell
git -c safe.directory='C:/Users/PC/Desktop/extention markdown' status --short
```

---

## 3. Insights & Clarifications Da Verify

**Source-text test pattern is accepted**
- Truoc: Spec mentioned possible behavior tests, but user explicitly said tests use source-text pattern.
- Sau khi clarify: Keep tests as `readFileSync` + `toContain` style, matching existing `tests/`.
- Bang chung: All new/updated tests compile source and assert strings; full suite passed.

**Docs `showTOC` remains a real contract**
- Truoc: Initial Docs implementation rendered GhostNav unconditionally.
- Review found bug: disabling TOC would still show GhostNav because GhostNav only gates on `sections.length > 1`.
- Sau khi fix: Docs wraps GhostNav in `{#if showTOC}`.
- Test added: `tests/docs-layout.test.ts` asserts `{#if showTOC}` near GhostNav expectations.

**Magazine `showTOC` must not gate GhostNav**
- Truoc: Old Magazine rail used `{#if showTOC && model.sections.length > 1}`.
- Sau khi implement: Magazine renders `<GhostNav sections={model.sections} onNavigate={scrollToSection} />` unconditionally.
- Test added: `tests/magazine-layout.test.ts` rejects any `{#if ... showTOC` gate.
- Ly do: Design spec says Magazine GhostNav independent of `showTOC` because it is non-intrusive hover overlay.

**Timer cleanup was added for quality**
- Truoc: Task plan did not include cleanup.
- Review found risk: timeout could fire after component unmount/layout switch.
- Sau khi fix: `GhostNav.svelte` imports `onDestroy` and clears `hideTimeout`.

**Keyboard accessibility remains out of scope**
- Review suggested keyboard reveal.
- Decision: Not implemented because design spec explicitly says keyboard navigation out of scope for this phase.
- Alternative rejected: Expand scope to focus/focusout keyboard nav now.

---

## 4. Current State

### Completed

Implemented GhostNav plan and committed it.

Commit:

```text
4a92cf0 Give reading layouts full width with hover navigation
```

Commit changed 6 files:
- `src/webview/lib/GhostNav.svelte` - new overlay nav component.
- `tests/ghost-nav.test.ts` - new source-text tests for GhostNav.
- `src/webview/layouts/DocsLayout.svelte` - sidebar removed, GhostNav added, single-column full-width layout.
- `tests/docs-layout.test.ts` - sidebar assertions replaced with GhostNav/full-width assertions.
- `src/webview/layouts/MagazineLayout.svelte` - rail/grid removed, GhostNav added, Magazine content single-column.
- `tests/magazine-layout.test.ts` - rail assertions replaced with GhostNav/no-showTOC-gate assertions.

Implemented details:
- GhostNav uses Svelte 5 `$props`, `$state`.
- Imports `fly`, `cubicOut`, `onDestroy`.
- Uses hover edge zone + panel handoff.
- Uses `lc-card--flat` panel styling, blur, border, shadow.
- Docs layout content max width changed from `72ch` to `80ch`.
- Docs sidebar CSS and mobile sidebar strip removed.
- Magazine rail CSS and mobile rail strip removed.
- Magazine balanced-card/clipDetect logic preserved.

Subagent-driven workflow:
- Task 1: GhostNav failing test added; failure confirmed because component missing.
- Task 2: GhostNav component added; tests passed; spec + quality reviews approved after centering and timeout cleanup fixes.
- Tasks 3-4: Docs tests + implementation added; review found `showTOC` contract gap; fixed and approved.
- Tasks 5-6: Magazine tests + implementation added; review found weak source test for `showTOC` independence; test strengthened and approved.
- Task 7: Full verification done.

Validation evidence:

```powershell
npm test
```

Result:

```text
15 test files passed
97 tests passed
```

Build:

```powershell
npm run build
```

Result:
- Extension bundle built.
- Webview Vite build passed.
- Existing large bundle warning for `dist\extension\extension.js 10.3mb` remains non-blocking.

### Current Git Status

After commit, working tree still has unrelated pre-existing dirty docs files:

```text
 M docs/SESSION-SUMMARY.md
?? docs/markdown-warrior-preview-session-handoff-v1.md
?? docs/markdown-warrior-preview-session-handoff-v2.md
?? docs/superpowers/plans/2026-05-22-balanced-layout-cards.md
?? docs/superpowers/plans/2026-05-22-layout-optimization.md
?? docs/superpowers/plans/2026-05-22-rich-layout-engine.md
?? docs/superpowers/specs/2026-05-22-balanced-layout-cards-design.md
?? docs/markdown-warrior-preview-session-handoff-v3.md
```

Important:
- These were not reverted.
- New file `docs/markdown-warrior-preview-session-handoff-v3.md` is this handoff.
- GhostNav implementation files are committed.

### Open Questions / Hot Spots

- Runtime hover behavior has not been manually tested inside real VS Code webview.
- No Playwright/browser visual verification was run.
- The build warning about extension bundle size remains existing/non-blocking.
- Dirty docs files remain outside committed GhostNav change.

---

## 5. Next Steps

If continuing from this point:

1. Read this handoff.
2. Run status:

```powershell
git -c safe.directory='C:/Users/PC/Desktop/extention markdown' status --short
```

3. Decide what to do with unrelated docs dirty files.
4. Optional runtime smoke test in VS Code:
   - Open markdown preview.
   - Select Docs layout and Magazine layout.
   - Move cursor to left 20px edge.
   - Confirm GhostNav appears, stays during panel hover, hides after leave.
   - Confirm Docs respects `showTOC = false`.
   - Confirm Magazine GhostNav still appears even though `showTOC` prop exists.
5. If preparing release/package, run:

```powershell
npm test
npm run build
npx vsce package
```

Suggested prompt for next session:

```text
Read docs/markdown-warrior-preview-session-handoff-v3.md.
Continue from current repo state. First inspect git status, then handle remaining dirty docs files or perform VS Code runtime smoke test for GhostNav.
```
