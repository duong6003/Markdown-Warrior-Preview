# Theme Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 12-theme full-pack system with a side panel UI, CSS custom properties, Shiki integration, and global persistence — preceded by merging the `scroll-first-reading` branch and cleaning up technical debt.

**Architecture:** Each theme is a TypeScript object in `theme-registry.ts` + a CSS block in `themes.css`. Webview applies `data-theme` attribute instantly on click; extension re-renders markdown with the matching Shiki theme and saves the selection to `globalState`. Theme persists across all files and VS Code sessions.

**Tech Stack:** TypeScript, Svelte 5, CSS custom properties, Shiki bundled themes, VS Code `globalState`, Vitest.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/webview/lib/theme-registry.ts` | Create | 12 theme definitions, `DEFAULT_THEME`, `getTheme()` |
| `src/webview/styles/themes.css` | Create | CSS custom property blocks for all 12 themes |
| `src/webview/components/ThemePanel.svelte` | Create | Side panel: grouped theme list, swatches, active state |
| `src/shared/messages.ts` | Modify | Add `setTheme` to webview→host; add `themeId` to `update` |
| `src/extension/markdown-engine.ts` | Modify | Accept `shikiTheme` param; load all 11 Shiki themes at init |
| `src/extension/preview-provider.ts` | Modify | Accept `context`; handle `setTheme`; persist + pass theme |
| `src/extension/extension.ts` | Modify | Pass `context` to `PreviewProvider` constructor |
| `src/webview/App.svelte` | Modify | Mount ThemePanel; apply `data-theme`; `selectedTheme` state |
| `src/webview/components/LayoutToolbar.svelte` | Modify | Add 🎨 toggle button prop |
| `src/webview/main.ts` | Modify | Import `themes.css` |
| `src/webview/styles/layouts.css` | Modify | Add theme variable fallbacks on key color usages |
| `CHANGELOG.md` | Modify | Add 0.3.0, 0.4.0, 0.5.0 entries |
| `vite.config.ts` | Modify | Raise `chunkSizeWarningLimit` |
| `src/webview/svelte.config.js` | Rename → `.mjs` | Fix `MODULE_TYPELESS_PACKAGE_JSON` warning |
| `tests/theme-registry.test.ts` | Create | Registry field/shape/uniqueness tests |
| `tests/themes-css.test.ts` | Create | CSS file variable coverage tests |
| `tests/theme-panel.test.ts` | Create | Svelte component compile + content tests |
| `tests/markdown-engine.test.ts` | Modify | Add `shikiTheme` param tests |

---

## Task 0: Merge scroll-first-reading into master and clean up

**Files:** git operations only

- [ ] **Step 1: Verify worktree and branch state**

```powershell
git -c safe.directory='C:/Users/PC/Desktop/extention markdown/.worktrees/scroll-first-reading' log --oneline --decorate -5
git branch
git status --short --branch
```

Expected: worktree HEAD is `a47b809 Release scroll-first reading as 0.5.0`, main checkout is on `master`.

- [ ] **Step 2: Merge branch into master**

```powershell
git merge scroll-first-reading --no-ff -m "Merge scroll-first-reading: content-aware card clipping (v0.5.0)"
```

Expected: merge commit created, no conflicts (branches diverged from a clean base).

- [ ] **Step 3: Run tests and build to verify clean merge**

```powershell
npm test
npm run build
```

Expected: all 67 tests pass, build succeeds.

- [ ] **Step 4: Remove worktree and delete local branch**

```powershell
git worktree remove ".worktrees/scroll-first-reading" --force
git branch -d scroll-first-reading
git worktree prune
```

Expected: no error, `git branch` no longer shows `scroll-first-reading`.

---

## Task 1: CHANGELOG polish and build warning fixes

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `vite.config.ts`
- Rename: `src/webview/svelte.config.js` → `src/webview/svelte.config.mjs`

- [ ] **Step 1: Add missing CHANGELOG entries**

Open `CHANGELOG.md` and prepend after the opening `# Changelog` line:

```markdown
## [0.5.0] - 2026-05-22

### Changed
- Cards render at natural height by default — no longer clipped on every section.
- "Show more" toggle only appears when content genuinely exceeds 65 % of viewport height.
- Docs layout removes card clipping entirely for a continuous scroll reading experience.
- Dashboard, Magazine, and Story use a `ResizeObserver` + viewport resize listener to detect overflow.

## [0.4.0] - 2026-05-22

### Added
- Shared balanced-card behavior across Docs, Magazine, Story, and Dashboard.
- Consistent card min-widths and min-heights via shared CSS tokens.
- Expandable card bodies with "Show more / Show less" accessibility toggles.
- `balanced-card.ts` helper for sanitized body IDs and toggle labels.

## [0.3.0] - 2026-05-22

### Changed
- Rebuilt all rich layouts around a unified token-first visual system.
- Shared spacing scale, type scale, radius, and shadow tokens in `layouts.css`.
- Proportional grids and consistent card/header/nav interaction states across all layouts.

```

- [ ] **Step 2: Fix Vite chunk size warning**

In `vite.config.ts`, add `chunkSizeWarningLimit` to the `build` block:

```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  root: 'src/webview',
  build: {
    outDir: '../../dist/webview',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: resolve(__dirname, 'src/webview/index.html'),
      output: {
        entryFileNames: 'assets/main.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/main.[ext]',
      },
    },
    emptyOutDir: true,
  },
});
```

- [ ] **Step 3: Fix MODULE_TYPELESS_PACKAGE_JSON warning — rename svelte config**

```powershell
git mv src/webview/svelte.config.js src/webview/svelte.config.mjs
```

Then open `vite.config.ts` and verify `@sveltejs/vite-plugin-svelte` picks up `.mjs` automatically — it does by default, no change needed.

- [ ] **Step 4: Run build and verify both warnings are gone**

```powershell
npm run build 2>&1
```

Expected: build succeeds, no `MODULE_TYPELESS_PACKAGE_JSON` warning, no chunk size warning.

- [ ] **Step 5: Commit**

```powershell
git add CHANGELOG.md vite.config.ts src/webview/svelte.config.mjs
git rm src/webview/svelte.config.js
git commit -m "chore: add missing changelog entries and fix build warnings"
```

---

## Task 2: Update message protocol

**Files:**
- Modify: `src/shared/messages.ts`

- [ ] **Step 1: Update messages.ts**

Replace the entire file with:

```typescript
// Messages from Extension Host → Webview
export type HostToWebviewMessage =
  | { type: 'update'; html: string; sourceMap: SourceMapEntry[]; frontmatter: Record<string, unknown> | null; themeId: string }
  | { type: 'scrollTo'; line: number }
  | { type: 'configChanged'; config: PreviewConfig }
  | { type: 'togglePresentation' };

// Messages from Webview → Extension Host
export type WebviewToHostMessage =
  | { type: 'openExternal'; url: string }
  | { type: 'openFile'; path: string }
  | { type: 'scrollSync'; line: number }
  | { type: 'checkboxToggle'; line: number; checked: boolean }
  | { type: 'setTheme'; themeId: string }
  | { type: 'ready' };

export interface SourceMapEntry {
  line: number;
  offset: number;
}

export interface PreviewConfig {
  fontSize: number;
  lineHeight: number;
  scrollSync: boolean;
  showTOC: boolean;
}
```

- [ ] **Step 2: Run build to verify TypeScript accepts changes**

```powershell
npm run build 2>&1
```

Expected: build succeeds. TypeScript will surface any callers that pass the wrong shape — fix them if any appear (there will be one in `preview-provider.ts` since `update` now requires `themeId`; that's fixed in Task 4).

- [ ] **Step 3: Commit**

```powershell
git add src/shared/messages.ts
git commit -m "feat: add setTheme message and themeId to update payload"
```

---

## Task 3: Theme registry (TDD)

**Files:**
- Create: `tests/theme-registry.test.ts`
- Create: `src/webview/lib/theme-registry.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/theme-registry.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { THEMES, DEFAULT_THEME, getTheme } from '../src/webview/lib/theme-registry';

describe('theme-registry', () => {
  it('exports 12 themes', () => {
    expect(THEMES).toHaveLength(12);
  });

  it('all themes have required fields', () => {
    for (const theme of THEMES) {
      expect(theme.id, 'id').toBeTruthy();
      expect(theme.label, 'label').toBeTruthy();
      expect(['dark', 'light'], 'mode').toContain(theme.mode);
      expect(theme.shikiTheme, 'shikiTheme').toBeTruthy();
      expect(theme.swatches, 'swatches length').toHaveLength(5);
    }
  });

  it('all swatches are 6-digit hex colors', () => {
    const hex = /^#[0-9a-f]{6}$/i;
    for (const theme of THEMES) {
      for (const swatch of theme.swatches) {
        expect(swatch, `${theme.id} swatch ${swatch}`).toMatch(hex);
      }
    }
  });

  it('has no duplicate ids', () => {
    const ids = THEMES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('DEFAULT_THEME exists in registry', () => {
    expect(THEMES.find(t => t.id === DEFAULT_THEME)).toBeDefined();
  });

  it('getTheme returns correct definition for dracula', () => {
    const theme = getTheme('dracula');
    expect(theme.label).toBe('Dracula');
    expect(theme.mode).toBe('dark');
    expect(theme.shikiTheme).toBe('dracula');
  });

  it('getTheme throws on unknown id', () => {
    expect(() => getTheme('nonexistent')).toThrow('Unknown theme: nonexistent');
  });
});
```

- [ ] **Step 2: Run to verify failure**

```powershell
npx vitest run tests/theme-registry.test.ts 2>&1
```

Expected: FAIL — `Cannot find module '../src/webview/lib/theme-registry'`

- [ ] **Step 3: Create theme-registry.ts**

Create `src/webview/lib/theme-registry.ts`:

```typescript
export interface ThemeDefinition {
  id: string;
  label: string;
  mode: 'dark' | 'light';
  shikiTheme: string;
  swatches: [string, string, string, string, string];
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'catppuccin-mocha',
    label: 'Catppuccin Mocha',
    mode: 'dark',
    shikiTheme: 'catppuccin-mocha',
    swatches: ['#1e1e2e', '#cba6f7', '#89b4fa', '#a6e3a1', '#f38ba8'],
  },
  {
    id: 'catppuccin-latte',
    label: 'Catppuccin Latte',
    mode: 'light',
    shikiTheme: 'catppuccin-latte',
    swatches: ['#eff1f5', '#8839ef', '#1e66f5', '#40a02b', '#d20f39'],
  },
  {
    id: 'github-dark',
    label: 'GitHub Dark',
    mode: 'dark',
    shikiTheme: 'github-dark',
    swatches: ['#0d1117', '#58a6ff', '#7ee787', '#ff7b72', '#e3b341'],
  },
  {
    id: 'github-light',
    label: 'GitHub Light',
    mode: 'light',
    shikiTheme: 'github-light',
    swatches: ['#ffffff', '#0969da', '#1a7f37', '#cf222e', '#9a6700'],
  },
  {
    id: 'dracula',
    label: 'Dracula',
    mode: 'dark',
    shikiTheme: 'dracula',
    swatches: ['#282a36', '#ff79c6', '#bd93f9', '#50fa7b', '#ffb86c'],
  },
  {
    id: 'tokyo-night',
    label: 'Tokyo Night',
    mode: 'dark',
    shikiTheme: 'tokyo-night',
    swatches: ['#1a1b26', '#7aa2f7', '#bb9af7', '#9ece6a', '#f7768e'],
  },
  {
    id: 'nord',
    label: 'Nord',
    mode: 'dark',
    shikiTheme: 'nord',
    swatches: ['#2e3440', '#88c0d0', '#81a1c1', '#a3be8c', '#bf616a'],
  },
  {
    id: 'high-contrast-dark',
    label: 'High Contrast Dark',
    mode: 'dark',
    shikiTheme: 'min-dark',
    swatches: ['#000000', '#ffffff', '#00ff00', '#ffff00', '#ff6b6b'],
  },
  {
    id: 'vesper',
    label: 'Vesper',
    mode: 'dark',
    shikiTheme: 'vesper',
    swatches: ['#101010', '#ffc799', '#99ffe4', '#b8e466', '#ff6666'],
  },
  {
    id: 'pitch-black',
    label: 'Pitch Black (OLED)',
    mode: 'dark',
    shikiTheme: 'github-dark',
    swatches: ['#000000', '#e0e0e0', '#58a6ff', '#7ee787', '#ff7b72'],
  },
  {
    id: 'sepia',
    label: 'Sepia',
    mode: 'light',
    shikiTheme: 'min-light',
    swatches: ['#f4ecd8', '#8b6914', '#5c4a1e', '#7a9e3b', '#c0392b'],
  },
  {
    id: 'solarized-light',
    label: 'Solarized Light',
    mode: 'light',
    shikiTheme: 'solarized-light',
    swatches: ['#fdf6e3', '#268bd2', '#2aa198', '#859900', '#dc322f'],
  },
];

export const DEFAULT_THEME = 'catppuccin-mocha';

export function getTheme(id: string): ThemeDefinition {
  const theme = THEMES.find(t => t.id === id);
  if (!theme) throw new Error(`Unknown theme: ${id}`);
  return theme;
}
```

- [ ] **Step 4: Run tests to verify pass**

```powershell
npx vitest run tests/theme-registry.test.ts 2>&1
```

Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```powershell
git add tests/theme-registry.test.ts src/webview/lib/theme-registry.ts
git commit -m "feat: add theme registry with 12 built-in theme definitions"
```

---

## Task 4: Theme CSS (TDD)

**Files:**
- Create: `tests/themes-css.test.ts`
- Create: `src/webview/styles/themes.css`

- [ ] **Step 1: Write failing tests**

Create `tests/themes-css.test.ts`:

```typescript
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { THEMES } from '../src/webview/lib/theme-registry';

const source = readFileSync('src/webview/styles/themes.css', 'utf8');

const THEME_VARS = [
  '--theme-bg', '--theme-surface', '--theme-text', '--theme-text-muted',
  '--theme-heading', '--theme-accent', '--theme-border', '--theme-shadow',
  '--theme-font-body', '--theme-font-mono', '--theme-radius',
];

describe('themes.css', () => {
  it('defines a :root default block', () => {
    expect(source).toMatch(/:root\s*\{/);
  });

  it('defines all 12 data-theme blocks', () => {
    for (const theme of THEMES) {
      expect(source, `missing block for ${theme.id}`).toContain(`[data-theme="${theme.id}"]`);
    }
  });

  it(':root default block contains all 11 theme variables', () => {
    const rootBlock = source.match(/:root\s*\{([^}]+)\}/)?.[1] ?? '';
    for (const v of THEME_VARS) {
      expect(rootBlock, `root missing ${v}`).toContain(v);
    }
  });

  it('each theme block contains all 11 theme variables', () => {
    for (const theme of THEMES) {
      const pattern = new RegExp(`\\[data-theme="${theme.id}"\\]\\s*\\{([^}]+)\\}`);
      const block = source.match(pattern)?.[1] ?? '';
      for (const v of THEME_VARS) {
        expect(block, `${theme.id} missing ${v}`).toContain(v);
      }
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

```powershell
npx vitest run tests/themes-css.test.ts 2>&1
```

Expected: FAIL — `themes.css` not found.

- [ ] **Step 3: Create themes.css**

Create `src/webview/styles/themes.css`:

```css
/* Default = Catppuccin Mocha (applied when no data-theme is set) */
:root {
  --theme-bg: #1e1e2e;
  --theme-surface: #313244;
  --theme-text: #cdd6f4;
  --theme-text-muted: #a6adc8;
  --theme-heading: #cba6f7;
  --theme-accent: #89b4fa;
  --theme-border: #45475a;
  --theme-shadow: rgba(0, 0, 0, 0.4);
  --theme-font-body: system-ui, sans-serif;
  --theme-font-mono: 'Cascadia Code', 'JetBrains Mono', monospace;
  --theme-radius: 6px;
}

:root[data-theme="catppuccin-mocha"] {
  --theme-bg: #1e1e2e;
  --theme-surface: #313244;
  --theme-text: #cdd6f4;
  --theme-text-muted: #a6adc8;
  --theme-heading: #cba6f7;
  --theme-accent: #89b4fa;
  --theme-border: #45475a;
  --theme-shadow: rgba(0, 0, 0, 0.4);
  --theme-font-body: system-ui, sans-serif;
  --theme-font-mono: 'Cascadia Code', 'JetBrains Mono', monospace;
  --theme-radius: 6px;
}

:root[data-theme="catppuccin-latte"] {
  --theme-bg: #eff1f5;
  --theme-surface: #e6e9ef;
  --theme-text: #4c4f69;
  --theme-text-muted: #8c8fa1;
  --theme-heading: #8839ef;
  --theme-accent: #1e66f5;
  --theme-border: #ccd0da;
  --theme-shadow: rgba(76, 79, 105, 0.15);
  --theme-font-body: system-ui, sans-serif;
  --theme-font-mono: 'Cascadia Code', 'JetBrains Mono', monospace;
  --theme-radius: 6px;
}

:root[data-theme="github-dark"] {
  --theme-bg: #0d1117;
  --theme-surface: #161b22;
  --theme-text: #e6edf3;
  --theme-text-muted: #8b949e;
  --theme-heading: #79c0ff;
  --theme-accent: #58a6ff;
  --theme-border: #30363d;
  --theme-shadow: rgba(0, 0, 0, 0.5);
  --theme-font-body: system-ui, sans-serif;
  --theme-font-mono: 'Cascadia Code', 'JetBrains Mono', monospace;
  --theme-radius: 6px;
}

:root[data-theme="github-light"] {
  --theme-bg: #ffffff;
  --theme-surface: #f6f8fa;
  --theme-text: #24292f;
  --theme-text-muted: #57606a;
  --theme-heading: #24292f;
  --theme-accent: #0969da;
  --theme-border: #d0d7de;
  --theme-shadow: rgba(140, 149, 159, 0.2);
  --theme-font-body: system-ui, sans-serif;
  --theme-font-mono: 'Cascadia Code', 'JetBrains Mono', monospace;
  --theme-radius: 6px;
}

:root[data-theme="dracula"] {
  --theme-bg: #282a36;
  --theme-surface: #44475a;
  --theme-text: #f8f8f2;
  --theme-text-muted: #6272a4;
  --theme-heading: #ff79c6;
  --theme-accent: #bd93f9;
  --theme-border: #44475a;
  --theme-shadow: rgba(0, 0, 0, 0.4);
  --theme-font-body: system-ui, sans-serif;
  --theme-font-mono: 'Cascadia Code', 'JetBrains Mono', monospace;
  --theme-radius: 6px;
}

:root[data-theme="tokyo-night"] {
  --theme-bg: #1a1b26;
  --theme-surface: #24283b;
  --theme-text: #c0caf5;
  --theme-text-muted: #565f89;
  --theme-heading: #7aa2f7;
  --theme-accent: #bb9af7;
  --theme-border: #292e42;
  --theme-shadow: rgba(0, 0, 0, 0.5);
  --theme-font-body: system-ui, sans-serif;
  --theme-font-mono: 'Cascadia Code', 'JetBrains Mono', monospace;
  --theme-radius: 6px;
}

:root[data-theme="nord"] {
  --theme-bg: #2e3440;
  --theme-surface: #3b4252;
  --theme-text: #eceff4;
  --theme-text-muted: #9099aa;
  --theme-heading: #88c0d0;
  --theme-accent: #81a1c1;
  --theme-border: #4c566a;
  --theme-shadow: rgba(0, 0, 0, 0.4);
  --theme-font-body: system-ui, sans-serif;
  --theme-font-mono: 'Cascadia Code', 'JetBrains Mono', monospace;
  --theme-radius: 6px;
}

:root[data-theme="high-contrast-dark"] {
  --theme-bg: #000000;
  --theme-surface: #0a0a0a;
  --theme-text: #ffffff;
  --theme-text-muted: #aaaaaa;
  --theme-heading: #ffffff;
  --theme-accent: #00ff00;
  --theme-border: #ffffff;
  --theme-shadow: rgba(255, 255, 255, 0.1);
  --theme-font-body: system-ui, sans-serif;
  --theme-font-mono: 'Cascadia Code', 'JetBrains Mono', monospace;
  --theme-radius: 2px;
}

:root[data-theme="vesper"] {
  --theme-bg: #101010;
  --theme-surface: #1a1a1a;
  --theme-text: #ffffff;
  --theme-text-muted: #8a8a8a;
  --theme-heading: #ffc799;
  --theme-accent: #99ffe4;
  --theme-border: #2a2a2a;
  --theme-shadow: rgba(0, 0, 0, 0.6);
  --theme-font-body: system-ui, sans-serif;
  --theme-font-mono: 'Cascadia Code', 'JetBrains Mono', monospace;
  --theme-radius: 6px;
}

:root[data-theme="pitch-black"] {
  --theme-bg: #000000;
  --theme-surface: #0d0d0d;
  --theme-text: #e0e0e0;
  --theme-text-muted: #888888;
  --theme-heading: #e0e0e0;
  --theme-accent: #58a6ff;
  --theme-border: #1a1a1a;
  --theme-shadow: rgba(0, 0, 0, 0.8);
  --theme-font-body: system-ui, sans-serif;
  --theme-font-mono: 'Cascadia Code', 'JetBrains Mono', monospace;
  --theme-radius: 6px;
}

:root[data-theme="sepia"] {
  --theme-bg: #f4ecd8;
  --theme-surface: #ede3cc;
  --theme-text: #3d2b1f;
  --theme-text-muted: #8b7355;
  --theme-heading: #5c3d2e;
  --theme-accent: #8b6914;
  --theme-border: #d4b896;
  --theme-shadow: rgba(61, 43, 31, 0.15);
  --theme-font-body: Georgia, serif;
  --theme-font-mono: 'Cascadia Code', 'JetBrains Mono', monospace;
  --theme-radius: 4px;
}

:root[data-theme="solarized-light"] {
  --theme-bg: #fdf6e3;
  --theme-surface: #eee8d5;
  --theme-text: #657b83;
  --theme-text-muted: #93a1a1;
  --theme-heading: #268bd2;
  --theme-accent: #2aa198;
  --theme-border: #d3cbb8;
  --theme-shadow: rgba(101, 123, 131, 0.15);
  --theme-font-body: system-ui, sans-serif;
  --theme-font-mono: 'Cascadia Code', 'JetBrains Mono', monospace;
  --theme-radius: 6px;
}
```

- [ ] **Step 4: Run tests to verify pass**

```powershell
npx vitest run tests/themes-css.test.ts 2>&1
```

Expected: 4 tests pass.

- [ ] **Step 5: Import themes.css in main.ts**

In `src/webview/main.ts`, add the import after the existing imports:

```typescript
import './styles/theme-bridge.css';
import './styles/markdown-body.css';
import './styles/animations.css';
import './styles/extensions.css';
import './styles/layouts.css';
import './styles/themes.css';
import App from './App.svelte';
import { mount } from 'svelte';

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
```

- [ ] **Step 6: Commit**

```powershell
git add tests/themes-css.test.ts src/webview/styles/themes.css src/webview/main.ts
git commit -m "feat: add theme CSS custom properties for all 12 themes"
```

---

## Task 5: Markdown engine — shikiTheme param (TDD)

**Files:**
- Modify: `tests/markdown-engine.test.ts`
- Modify: `src/extension/markdown-engine.ts`

- [ ] **Step 1: Write failing tests**

Append to `tests/markdown-engine.test.ts` (inside the outermost `describe` block, after the existing tests):

```typescript
  describe('shikiTheme parameter', () => {
    it('render() accepts a shikiTheme parameter without error', () => {
      const { html } = engine.render('# Test', 'github-dark');
      expect(html).toContain('<h1');
    });

    it('render() accepts dracula theme without error', () => {
      const { html } = engine.render('```js\nconst x = 1\n```', 'dracula');
      expect(html).toBeTruthy();
    });

    it('render() uses catppuccin-mocha as default when no theme given', () => {
      const { html } = engine.render('# Default theme');
      expect(html).toContain('<h1');
    });
  });
```

- [ ] **Step 2: Run to verify failure**

```powershell
npx vitest run tests/markdown-engine.test.ts 2>&1
```

Expected: FAIL — `render()` doesn't accept a second argument yet (TypeScript will error).

- [ ] **Step 3: Update markdown-engine.ts**

Replace the top of `MarkdownEngine` class and `render()` / `initialize()` methods. The full updated file:

```typescript
import MarkdownIt from 'markdown-it';
import type { SourceMapEntry } from '../shared/messages';
import { createHighlighter, type Highlighter } from 'shiki';
import katex from 'katex';
import matter from 'gray-matter';

export const DEFAULT_SHIKI_THEME = 'catppuccin-mocha';

const SHIKI_THEMES = [
  'catppuccin-mocha', 'catppuccin-latte',
  'github-dark', 'github-light',
  'dracula', 'tokyo-night', 'nord',
  'min-dark', 'min-light',
  'vesper', 'solarized-light',
] as const;

export interface RenderResult {
  html: string;
  sourceMap: SourceMapEntry[];
  frontmatter: Record<string, unknown> | null;
}

export class MarkdownEngine {
  private md: MarkdownIt;
  private highlighter: Highlighter | null = null;
  private currentShikiTheme = DEFAULT_SHIKI_THEME;

  constructor() {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str, lang) => {
        if (lang === 'mermaid') {
          return `<div class="mermaid-block" data-mermaid="${this.escapeHtml(str)}">${this.escapeHtml(str)}</div>`;
        }

        if (this.highlighter && lang) {
          try {
            const loaded = this.highlighter.getLoadedLanguages();
            if (loaded.includes(lang as any)) {
              return this.highlighter.codeToHtml(str, {
                lang,
                theme: this.currentShikiTheme,
              });
            }
            this.loadLanguage(lang);
          } catch {
            // fallback to plain text
          }
        }
        return '';
      },
    });

    this.addSourceMapPlugin();
    this.addHeadingIds();
    this.addKaTeXPlugin();
    this.addTaskListPlugin();
  }

  public async initialize() {
    this.highlighter = await createHighlighter({
      themes: [...SHIKI_THEMES],
      langs: [
        'javascript', 'typescript', 'python', 'json',
        'html', 'css', 'bash', 'markdown',
      ],
    });
  }

  private async loadLanguage(lang: string): Promise<boolean> {
    if (!this.highlighter) return false;
    try {
      const loaded = this.highlighter.getLoadedLanguages();
      if (!loaded.includes(lang as any)) {
        await this.highlighter.loadLanguage(lang as any);
      }
      return true;
    } catch {
      return false;
    }
  }

  public render(content: string, shikiTheme = DEFAULT_SHIKI_THEME): RenderResult {
    this.currentShikiTheme = shikiTheme;

    let body = content;
    let frontmatter: Record<string, unknown> | null = null;

    try {
      const parsed = matter(content);
      body = parsed.content;
      if (Object.keys(parsed.data).length > 0) {
        frontmatter = parsed.data;
      }
    } catch {
      // If frontmatter parsing fails, use raw content
    }

    const sourceMap: SourceMapEntry[] = [];
    const env = { sourceMap };
    let html = this.md.render(body, env);

    if (frontmatter) {
      html = this.renderFrontmatter(frontmatter) + html;
    }

    return { html, sourceMap, frontmatter };
  }

  // private renderFrontmatter / addKaTeXPlugin / addTaskListPlugin /
  // addSourceMapPlugin / addHeadingIds / escapeHtml — UNCHANGED, keep as-is
}
```

**What changed vs the original file:**
- Added `DEFAULT_SHIKI_THEME` and `SHIKI_THEMES` constants (before the class)
- Added `private currentShikiTheme = DEFAULT_SHIKI_THEME` field inside the class
- `constructor` highlight callback: `theme: 'css-variables'` → `theme: this.currentShikiTheme`
- `initialize()`: `themes: ['css-variables']` → `themes: [...SHIKI_THEMES]`
- `render()`: added `shikiTheme = DEFAULT_SHIKI_THEME` param; added `this.currentShikiTheme = shikiTheme` as first line

All six private methods (`renderFrontmatter`, `addKaTeXPlugin`, `addTaskListPlugin`, `addSourceMapPlugin`, `addHeadingIds`, `escapeHtml`) remain byte-for-byte identical.

- [ ] **Step 4: Run tests to verify pass**

```powershell
npx vitest run tests/markdown-engine.test.ts 2>&1
```

Expected: all markdown-engine tests pass (existing + 3 new).

- [ ] **Step 5: Commit**

```powershell
git add tests/markdown-engine.test.ts src/extension/markdown-engine.ts
git commit -m "feat: accept shikiTheme param in render() and preload all 11 Shiki themes"
```

---

## Task 6: Extension host — persistence and message handling

**Files:**
- Modify: `src/extension/preview-provider.ts`
- Modify: `src/extension/extension.ts`

- [ ] **Step 1: Update PreviewProvider constructor to accept context**

In `src/extension/preview-provider.ts`, update the constructor signature and add the `setTheme` message handler. Changes to make:

**Constructor** (line 15):
```typescript
constructor(
  private readonly extensionUri: vscode.Uri,
  private readonly context: vscode.ExtensionContext,
) {}
```

**`handleWebviewMessage` switch** — add a new case after `checkboxToggle`:
```typescript
      case 'setTheme':
        this.context.globalState.update('selectedTheme', message.themeId);
        if (this.currentEditor) this.updateContent(this.currentEditor);
        break;
```

**`updateContent` method** — read saved theme and pass to engine + postMessage:
```typescript
  private updateContent(editor: vscode.TextEditor) {
    if (!this.panel) return;
    const text = editor.document.getText();
    const themeId = this.context.globalState.get<string>('selectedTheme', 'catppuccin-mocha');
    const { html, sourceMap, frontmatter } = this.engine.render(text, themeId);

    const resolver = new AssetResolver(this.panel.webview, editor.document.uri);
    const resolvedHtml = resolver.resolveAssets(html);

    this.panel.webview.postMessage({
      type: 'update',
      html: resolvedHtml,
      sourceMap,
      frontmatter,
      themeId,
    });
  }
```

- [ ] **Step 2: Update extension.ts to pass context**

In `src/extension/extension.ts`, line 7 — pass `context` as second argument:

```typescript
  const previewProvider = new PreviewProvider(context.extensionUri, context);
```

- [ ] **Step 3: Run build to verify TypeScript compiles cleanly**

```powershell
npm run build 2>&1
```

Expected: build succeeds with no type errors.

- [ ] **Step 4: Commit**

```powershell
git add src/extension/preview-provider.ts src/extension/extension.ts
git commit -m "feat: persist selected theme in globalState and pass shikiTheme to renderer"
```

---

## Task 7: ThemePanel component (TDD)

**Files:**
- Create: `tests/theme-panel.test.ts`
- Create: `src/webview/components/ThemePanel.svelte`

- [ ] **Step 1: Write failing tests**

Create `tests/theme-panel.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';
import { THEMES } from '../src/webview/lib/theme-registry';

const source = readFileSync('src/webview/components/ThemePanel.svelte', 'utf8');

describe('ThemePanel.svelte', () => {
  it('compiles without errors', () => {
    let result: ReturnType<typeof compile>;
    expect(() => {
      result = compile(source, { filename: 'ThemePanel.svelte', generate: 'client' });
    }).not.toThrow();
    const errors = result!.warnings.filter(w => !w.code?.startsWith('a11y'));
    expect(errors).toHaveLength(0);
  });

  it('source contains all 12 theme ids', () => {
    for (const theme of THEMES) {
      expect(source, `missing ${theme.id}`).toContain(theme.id);
    }
  });

  it('source contains dark and light group labels', () => {
    expect(source).toContain('Dark');
    expect(source).toContain('Light');
  });

  it('marks active theme — uses aria-pressed or class:active', () => {
    expect(source).toMatch(/aria-pressed|class:active/);
  });

  it('iterates themes with each block', () => {
    expect(source).toContain('{#each');
  });
});
```

- [ ] **Step 2: Run to verify failure**

```powershell
npx vitest run tests/theme-panel.test.ts 2>&1
```

Expected: FAIL — `ThemePanel.svelte` not found.

- [ ] **Step 3: Create ThemePanel.svelte**

Create `src/webview/components/ThemePanel.svelte`:

```svelte
<script lang="ts">
  import { THEMES } from '../lib/theme-registry';

  let {
    selectedTheme,
    onSelect,
  }: {
    selectedTheme: string;
    onSelect: (id: string) => void;
  } = $props();

  const darkThemes = THEMES.filter(t => t.mode === 'dark');
  const lightThemes = THEMES.filter(t => t.mode === 'light');
</script>

<aside class="theme-panel" aria-label="Theme selection">
  <div class="theme-panel__header">🎨 Themes</div>

  <div class="theme-panel__group">
    <div class="theme-panel__group-label">Dark</div>
    {#each darkThemes as theme (theme.id)}
      <button
        class="theme-panel__item"
        class:active={selectedTheme === theme.id}
        aria-pressed={selectedTheme === theme.id}
        type="button"
        onclick={() => onSelect(theme.id)}
      >
        <span class="theme-panel__label">{theme.label}</span>
        <span class="theme-panel__swatches" aria-hidden="true">
          {#each theme.swatches.slice(0, 3) as color (color)}
            <span class="theme-panel__swatch" style="background:{color}"></span>
          {/each}
        </span>
      </button>
    {/each}
  </div>

  <div class="theme-panel__group">
    <div class="theme-panel__group-label">Light</div>
    {#each lightThemes as theme (theme.id)}
      <button
        class="theme-panel__item"
        class:active={selectedTheme === theme.id}
        aria-pressed={selectedTheme === theme.id}
        type="button"
        onclick={() => onSelect(theme.id)}
      >
        <span class="theme-panel__label">{theme.label}</span>
        <span class="theme-panel__swatches" aria-hidden="true">
          {#each theme.swatches.slice(0, 3) as color (color)}
            <span class="theme-panel__swatch" style="background:{color}"></span>
          {/each}
        </span>
      </button>
    {/each}
  </div>
</aside>

<style>
  .theme-panel {
    width: 180px;
    background: var(--theme-surface, var(--md-bg-secondary));
    border-left: 1px solid var(--theme-border, var(--md-border));
    padding: 0.75rem 0.5rem;
    overflow-y: auto;
    flex-shrink: 0;
    height: 100%;
  }

  .theme-panel__header {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--theme-text-muted, var(--md-fg-secondary));
    padding: 0 0.5rem 0.5rem;
    border-bottom: 1px solid var(--theme-border, var(--md-border));
    margin-bottom: 0.5rem;
  }

  .theme-panel__group {
    margin-bottom: 0.75rem;
  }

  .theme-panel__group-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    color: var(--theme-text-muted, var(--md-fg-secondary));
    padding: 0 0.5rem 0.25rem;
  }

  .theme-panel__item {
    all: unset;
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 0.375rem 0.5rem;
    border-radius: var(--theme-radius, 4px);
    cursor: pointer;
    border-left: 3px solid transparent;
    box-sizing: border-box;
  }

  .theme-panel__item:hover {
    background: color-mix(in srgb, var(--theme-accent, var(--md-accent)) 8%, transparent);
  }

  .theme-panel__item.active {
    border-left-color: var(--theme-accent, var(--md-accent));
    background: color-mix(in srgb, var(--theme-accent, var(--md-accent)) 12%, transparent);
  }

  .theme-panel__label {
    font-size: 0.75rem;
    color: var(--theme-text, var(--md-fg-primary));
    margin-bottom: 0.25rem;
  }

  .theme-panel__swatches {
    display: flex;
    gap: 2px;
  }

  .theme-panel__swatch {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    display: inline-block;
    border: 1px solid rgba(128, 128, 128, 0.3);
  }
</style>
```

- [ ] **Step 4: Run tests to verify pass**

```powershell
npx vitest run tests/theme-panel.test.ts 2>&1
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```powershell
git add tests/theme-panel.test.ts src/webview/components/ThemePanel.svelte
git commit -m "feat: add ThemePanel side panel component with grouped theme list"
```

---

## Task 8: Wire LayoutToolbar toggle button

**Files:**
- Modify: `src/webview/components/LayoutToolbar.svelte`

- [ ] **Step 1: Add theme panel toggle props and button**

Replace the entire `LayoutToolbar.svelte` with:

```svelte
<script lang="ts">
  import type { LayoutOverride, LayoutType } from '../types/layout';

  const labels: Record<LayoutType, string> = {
    magazine: 'Magazine',
    docs: 'Docs',
    story: 'Story',
    dashboard: 'Dashboard',
  };

  const options: { value: LayoutOverride; label: string }[] = [
    { value: 'auto', label: 'Auto' },
    { value: 'magazine', label: 'Magazine' },
    { value: 'docs', label: 'Docs' },
    { value: 'story', label: 'Story' },
    { value: 'dashboard', label: 'Dashboard' },
  ];

  let {
    override = 'auto',
    detectedLayout,
    currentLayout,
    themePanelVisible = false,
    onOverrideChange,
    onTogglePresentation,
    onToggleThemePanel,
  }: {
    override?: LayoutOverride;
    detectedLayout: LayoutType;
    currentLayout: LayoutType;
    themePanelVisible?: boolean;
    onOverrideChange: (override: LayoutOverride) => void;
    onTogglePresentation: () => void;
    onToggleThemePanel: () => void;
  } = $props();
</script>

<nav class="layout-toolbar" aria-label="Preview layout controls">
  <div class="layout-toolbar__group" role="group" aria-label="Layout choices">
    {#each options as option (option.value)}
      <button
        class="layout-toolbar__pill"
        class:active={override === option.value}
        aria-pressed={override === option.value}
        type="button"
        title={option.value === 'auto' ? `Auto: ${labels[detectedLayout]}` : option.label}
        onclick={() => onOverrideChange(option.value)}
      >
        {#if option.value === 'auto'}
          Auto: {labels[detectedLayout]}
        {:else}
          {option.label}
        {/if}
      </button>
    {/each}
  </div>

  <div class="layout-toolbar__status" aria-label="Current layout">
    {labels[currentLayout]}
  </div>

  <button
    class="layout-toolbar__theme-toggle"
    class:active={themePanelVisible}
    type="button"
    aria-pressed={themePanelVisible}
    title="Theme panel"
    onclick={onToggleThemePanel}
  >
    🎨
  </button>

  <button class="layout-toolbar__slides" type="button" onclick={onTogglePresentation} title="Presentation mode">
    ▶ Slides
  </button>
</nav>
```

The toolbar has no `<style>` block — its styles live in `layouts.css`. The `.layout-toolbar__theme-toggle` CSS will be added in Task 10.

- [ ] **Step 2: Run build to verify no TypeScript errors**

```powershell
npm run build 2>&1
```

Expected: build succeeds (App.svelte will show a type error since it doesn't pass `onToggleThemePanel` yet — acceptable, will be fixed in Task 9).

- [ ] **Step 3: Commit**

```powershell
git add src/webview/components/LayoutToolbar.svelte
git commit -m "feat: add theme panel toggle button to layout toolbar"
```

---

## Task 9: App.svelte — wire ThemePanel and data-theme

**Files:**
- Modify: `src/webview/App.svelte`

- [ ] **Step 1: Update App.svelte**

Replace `src/webview/App.svelte` with:

```svelte
<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { onMessage, postMessage } from './lib/message-bridge';
  import { scrollToLine, setupScrollReporter } from './lib/source-map';
  import { renderMermaidBlocks } from './lib/mermaid-renderer';
  import { setupLayoutReveal, teardownLayoutReveal } from './lib/layout-reveal';
  import { setupCheckboxHandler } from './lib/checkbox-handler';
  import { setupCollapsibleHeadings, restoreCollapsedState } from './lib/collapsible-headings';
  import { createDocumentModel, resolveLayout } from './lib/layout-engine';
  import { loadState, saveState } from './stores/state';
  import { DEFAULT_THEME } from './lib/theme-registry';
  import type { LayoutOverride } from './types/layout';
  import LayoutToolbar from './components/LayoutToolbar.svelte';
  import ThemePanel from './components/ThemePanel.svelte';
  import SlideView from './components/SlideView.svelte';
  import MagazineLayout from './layouts/MagazineLayout.svelte';
  import DocsLayout from './layouts/DocsLayout.svelte';
  import StoryLayout from './layouts/StoryLayout.svelte';
  import DashboardLayout from './layouts/DashboardLayout.svelte';

  const initialState = loadState();

  let html = $state('<p>Loading preview...</p>');
  let frontmatter = $state<Record<string, unknown> | null>(null);
  let showTOC = $state(initialState.tocVisible);
  let mode = $state<'document' | 'presentation'>(initialState.mode);
  let layoutOverride = $state<LayoutOverride>(initialState.layoutOverride);
  let selectedTheme = $state(DEFAULT_THEME);
  let panelVisible = $state(false);

  let model = $derived(createDocumentModel(html, frontmatter));
  let selectedLayout = $derived(resolveLayout(model.detectedLayout, frontmatter, layoutOverride));

  let scrollRestored = false;
  let cleanupScrollSave: (() => void) | null = null;

  function clearScrollSaveListener() {
    cleanupScrollSave?.();
    cleanupScrollSave = null;
  }

  $effect(() => {
    saveState({ tocVisible: showTOC, mode, layoutOverride });
  });

  $effect(() => {
    let cancelled = false;

    if (!(html && mode === 'document' && selectedLayout)) {
      clearScrollSaveListener();
      teardownLayoutReveal();
      return;
    }

    tick().then(() => {
      if (cancelled) return;

      renderMermaidBlocks();
      restoreCollapsedState();
      setupLayoutReveal();

      const main = document.querySelector('main') as HTMLElement | null;
      if (!main) return;

      setupScrollReporter(main);

      if (!scrollRestored) {
        scrollRestored = true;
        if (initialState.scrollPosition > 0) {
          requestAnimationFrame(() => {
            if (!cancelled) {
              main.scrollTop = initialState.scrollPosition;
            }
          });
        }
      }

      clearScrollSaveListener();
      let saveTimeout: number | null = null;
      function onScrollSave() {
        if (saveTimeout !== null) clearTimeout(saveTimeout);
        saveTimeout = window.setTimeout(() => {
          if (!cancelled) saveState({ scrollPosition: main.scrollTop });
        }, 500);
      }
      main.addEventListener('scroll', onScrollSave);
      cleanupScrollSave = () => {
        if (saveTimeout !== null) { clearTimeout(saveTimeout); saveTimeout = null; }
        main.removeEventListener('scroll', onScrollSave);
      };
    });

    return () => {
      cancelled = true;
      clearScrollSaveListener();
      teardownLayoutReveal();
    };
  });

  onMessage((message) => {
    switch (message.type) {
      case 'update':
        html = message.html;
        frontmatter = message.frontmatter;
        selectedTheme = message.themeId;
        document.documentElement.dataset.theme = message.themeId;
        break;
      case 'scrollTo':
        if (mode === 'document') scrollToLine(message.line);
        break;
      case 'configChanged':
        showTOC = message.config.showTOC;
        break;
      case 'togglePresentation':
        toggleMode();
        break;
    }
  });

  function handleThemeSelect(themeId: string) {
    selectedTheme = themeId;
    document.documentElement.dataset.theme = themeId;
    postMessage({ type: 'setTheme', themeId });
  }

  function toggleMode() {
    mode = mode === 'document' ? 'presentation' : 'document';
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && mode === 'presentation') {
      e.preventDefault();
      mode = 'document';
    }
  }

  onMount(() => {
    setupCheckboxHandler();
    setupCollapsibleHeadings();
    document.documentElement.dataset.theme = selectedTheme;
  });

  postMessage({ type: 'ready' });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if mode === 'presentation'}
  <SlideView {html} transition="fade" />
  <button class="exit-presentation" onclick={toggleMode} title="Exit presentation (Esc)">
    ✕
  </button>
{:else}
  <div class="preview-root">
    <LayoutToolbar
      override={layoutOverride}
      detectedLayout={model.detectedLayout}
      currentLayout={selectedLayout}
      themePanelVisible={panelVisible}
      onOverrideChange={(v) => { layoutOverride = v; }}
      onTogglePresentation={toggleMode}
      onToggleThemePanel={() => { panelVisible = !panelVisible; }}
    />

    <div class="preview-body">
      <main class="layout-scroll-root" data-active-layout={selectedLayout}>
        {#if selectedLayout === 'magazine'}
          <MagazineLayout {model} {showTOC} />
        {:else if selectedLayout === 'docs'}
          <DocsLayout {model} {showTOC} />
        {:else if selectedLayout === 'story'}
          <StoryLayout {model} {showTOC} />
        {:else}
          <DashboardLayout {model} {showTOC} />
        {/if}
      </main>

      {#if panelVisible}
        <ThemePanel selectedTheme={selectedTheme} onSelect={handleThemeSelect} />
      {/if}
    </div>
  </div>
{/if}

<style>
  .preview-root {
    min-height: 100vh;
    background: var(--theme-bg, var(--md-bg-primary));
    display: flex;
    flex-direction: column;
  }

  .preview-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .layout-scroll-root {
    flex: 1;
    height: 100vh;
    overflow-y: auto;
    scroll-behavior: smooth;
    padding-top: 3.25rem;
  }

  .exit-presentation {
    all: unset;
    cursor: pointer;
    position: fixed;
    top: 1rem;
    right: 1rem;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--md-bg-secondary);
    border: 1px solid var(--md-border);
    border-radius: 50%;
    color: var(--md-fg-secondary);
    font-size: 1rem;
    z-index: 200;
    opacity: 0;
    transition: opacity 0.3s ease, color 0.2s ease;
  }

  .exit-presentation:hover {
    color: var(--md-accent);
    opacity: 1 !important;
  }

  :global(body:hover) .exit-presentation {
    opacity: 0.6;
  }
</style>
```

- [ ] **Step 2: Run full test suite + build**

```powershell
npm test
npm run build 2>&1
```

Expected: all tests pass, build succeeds.

- [ ] **Step 3: Commit**

```powershell
git add src/webview/App.svelte
git commit -m "feat: mount ThemePanel in App, apply data-theme on update and selection"
```

---

## Task 10: Apply theme variables in layouts.css

**Files:**
- Modify: `src/webview/styles/layouts.css`

- [ ] **Step 1: Add theme-toggle button styles and update toolbar colors**

In `layouts.css`, find the `.layout-toolbar` rule and update `background` and `border-bottom` to include theme fallbacks. Then append the new button rule after `.layout-toolbar`:

```css
.layout-toolbar__theme-toggle {
  all: unset;
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  opacity: 0.7;
  transition: opacity 0.15s ease;
}

.layout-toolbar__theme-toggle:hover,
.layout-toolbar__theme-toggle.active {
  opacity: 1;
}
```

Also update the `.layout-toolbar` background and border:

```css
.layout-toolbar {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 3.25rem;
  padding: var(--space-2) var(--space-section-xs);
  color: var(--md-fg-primary);
  background: color-mix(in srgb, var(--theme-bg, var(--md-bg-primary)) 90%, transparent);
  border-bottom: 1px solid var(--theme-border, var(--md-border));
  backdrop-filter: blur(14px);
}
```

- [ ] **Step 2: Run full test suite + build**

```powershell
npm test
npm run build 2>&1
```

Expected: all tests pass, build succeeds.

- [ ] **Step 3: Commit**

```powershell
git add src/webview/styles/layouts.css
git commit -m "feat: apply theme variables as fallbacks on toolbar colors"
```

---

## Task 11: Release v0.6.0

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Bump version to 0.6.0**

In `package.json`, update `"version"` from `"0.5.0"` to `"0.6.0"`.

Then regenerate `package-lock.json`:

```powershell
npm install --package-lock-only
```

- [ ] **Step 2: Add 0.6.0 changelog entry**

Prepend to `CHANGELOG.md` after `# Changelog`:

```markdown
## [0.6.0] - 2026-05-22

### Added
- 12 built-in full theme packs (color scheme + syntax highlighting + font + spacing).
- Theme side panel — toggle with 🎨 in the toolbar, grouped into Dark and Light sections.
- Per-theme Shiki syntax highlighting (Catppuccin, GitHub, Dracula, Tokyo Night, Nord, High Contrast, Vesper, Pitch Black, Sepia, Solarized Light).
- Theme persists globally across all files and VS Code sessions via `globalState`.

```

- [ ] **Step 3: Run all tests**

```powershell
npm test 2>&1
```

Expected: all ~89 tests pass across 14 test files.

- [ ] **Step 4: Run build**

```powershell
npm run build 2>&1
```

Expected: build succeeds, no blocking warnings.

- [ ] **Step 5: Package VSIX**

```powershell
npx vsce package 2>&1
```

Expected: `markdown-warrior-preview-0.6.0.vsix` created.

- [ ] **Step 6: Commit and tag**

```powershell
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release v0.6.0 — theme selection"
git tag v0.6.0
```
