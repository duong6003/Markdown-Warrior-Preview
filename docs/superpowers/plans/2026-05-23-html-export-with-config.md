# HTML Export with Current Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export standalone HTML that matches the currently selected preview theme, font choices, and Shiki syntax highlighting, with optional offline embedding for Google Fonts.

**Architecture:** Sync browser-side font state from the webview into `PreviewProvider` globalState, then pass an `ExportConfig` into `Exporter.exportHTML()`. Shared registries define theme export palettes and font choices; extension-side `font-inliner.ts` resolves Google Fonts into optional base64 `@font-face` CSS before HTML is written.

**Tech Stack:** VS Code Extension API, TypeScript, Svelte 5, Vitest, Node.js `https`, existing `MarkdownEngine`/Shiki render pipeline.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/shared/export-config.ts` | Shared export config types, default config, baked-in color palettes for all themes, safe config normalization helpers |
| `tests/export-config.test.ts` | Tests for default export config, theme coverage, fallback behavior |
| `src/shared/font-registry.ts` | Shared source of font options for both webview and extension host |
| `src/webview/lib/font-registry.ts` | Compatibility re-export for existing webview imports |
| `tests/font-registry.test.ts` | Updated import coverage proving both shared and webview paths expose same registry |
| `src/extension/font-inliner.ts` | Extension-side Google Fonts CSS/woff2 fetching, base64 embedding, fallback stack resolution |
| `tests/font-inliner.test.ts` | Unit tests for no-Google-font, embed, fallback, cancel, and fetch-error paths |
| `src/shared/messages.ts` | Adds `syncFonts` and `setFont` webview-to-host message types |
| `src/webview/App.svelte` | Sends initial font sync and per-change font messages to extension host |
| `tests/app-font-sync.test.ts` | Source-based tests proving `App.svelte` posts `syncFonts` and `setFont` |
| `src/extension/preview-provider.ts` | Persists font slots in globalState and exposes `getExportConfig()` |
| `tests/preview-provider-fonts.test.ts` | Source-based tests for font globalState keys, message cases, and export config method |
| `src/extension/exporter.ts` | Accepts `ExportConfig`, renders with selected Shiki theme, injects baked theme CSS and font CSS into HTML export |
| `tests/exporter-config.test.ts` | Source-based tests for exporter config wiring, baked CSS variables, no `prefers-color-scheme` in HTML export path |
| `src/extension/extension.ts` | Passes `previewProvider.getExportConfig()` into HTML export command |
| `tests/extension-export-config.test.ts` | Source-based test for command wiring |

---

## Task 1: Add shared export config and theme palettes

**Files:**
- Create: `src/shared/export-config.ts`
- Create: `tests/export-config.test.ts`

- [ ] **Step 1: Write failing tests for export config**

Create `tests/export-config.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { THEMES } from '../src/shared/theme-registry';
import {
  DEFAULT_EXPORT_CONFIG,
  THEME_EXPORT_COLORS,
  getExportThemeColors,
  normalizeExportConfig,
} from '../src/shared/export-config';

describe('export-config', () => {
  it('defines defaults matching preview defaults', () => {
    expect(DEFAULT_EXPORT_CONFIG).toEqual({
      themeId: 'catppuccin-mocha',
      fontBody: 'system',
      fontHeading: 'inherit',
      fontCode: 'cascadia',
    });
  });

  it('has export colors for every registered theme', () => {
    for (const theme of THEMES) {
      expect(THEME_EXPORT_COLORS[theme.id], theme.id).toBeTruthy();
    }
  });

  it('each theme color entry has all required CSS variables', () => {
    for (const [id, colors] of Object.entries(THEME_EXPORT_COLORS)) {
      expect(colors.bg, `${id}.bg`).toMatch(/^#/);
      expect(colors.bgSecondary, `${id}.bgSecondary`).toMatch(/^#/);
      expect(colors.bgTertiary, `${id}.bgTertiary`).toMatch(/^#/);
      expect(colors.fg, `${id}.fg`).toMatch(/^#/);
      expect(colors.fgSecondary, `${id}.fgSecondary`).toMatch(/^#/);
      expect(colors.fgMuted, `${id}.fgMuted`).toMatch(/^#/);
      expect(colors.accent, `${id}.accent`).toMatch(/^#/);
      expect(colors.accentHover, `${id}.accentHover`).toMatch(/^#/);
      expect(colors.border, `${id}.border`).toMatch(/^#/);
      expect(colors.codeBg, `${id}.codeBg`).toMatch(/^#/);
    }
  });

  it('returns github-dark colors for unknown theme ids', () => {
    expect(getExportThemeColors('missing-theme')).toBe(THEME_EXPORT_COLORS['github-dark']);
  });

  it('normalizes invalid config fields to defaults', () => {
    expect(normalizeExportConfig({ themeId: 7, fontBody: null, fontHeading: [], fontCode: {} })).toEqual(DEFAULT_EXPORT_CONFIG);
  });

  it('preserves valid string config fields', () => {
    expect(normalizeExportConfig({
      themeId: 'github-light',
      fontBody: 'inter',
      fontHeading: 'playfair',
      fontCode: 'fira',
    })).toEqual({
      themeId: 'github-light',
      fontBody: 'inter',
      fontHeading: 'playfair',
      fontCode: 'fira',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run tests/export-config.test.ts
```

Expected: FAIL with import error similar to `Cannot find module '../src/shared/export-config'`.

- [ ] **Step 3: Implement shared export config**

Create `src/shared/export-config.ts`:

```ts
import { DEFAULT_THEME } from './theme-registry';

export interface ExportConfig {
  themeId: string;
  fontBody: string;
  fontHeading: string;
  fontCode: string;
}

export interface ThemeExportColors {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  fg: string;
  fgSecondary: string;
  fgMuted: string;
  accent: string;
  accentHover: string;
  border: string;
  codeBg: string;
}

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  themeId: DEFAULT_THEME,
  fontBody: 'system',
  fontHeading: 'inherit',
  fontCode: 'cascadia',
};

export const THEME_EXPORT_COLORS: Record<string, ThemeExportColors> = {
  'catppuccin-mocha': {
    bg: '#1e1e2e', bgSecondary: '#181825', bgTertiary: '#313244',
    fg: '#cdd6f4', fgSecondary: '#bac2de', fgMuted: '#6c7086',
    accent: '#cba6f7', accentHover: '#89b4fa', border: '#45475a', codeBg: '#181825',
  },
  'catppuccin-latte': {
    bg: '#eff1f5', bgSecondary: '#e6e9ef', bgTertiary: '#dce0e8',
    fg: '#4c4f69', fgSecondary: '#5c5f77', fgMuted: '#9ca0b0',
    accent: '#8839ef', accentHover: '#1e66f5', border: '#bcc0cc', codeBg: '#e6e9ef',
  },
  'github-dark': {
    bg: '#0d1117', bgSecondary: '#161b22', bgTertiary: '#21262d',
    fg: '#c9d1d9', fgSecondary: '#8b949e', fgMuted: '#6e7681',
    accent: '#58a6ff', accentHover: '#79c0ff', border: '#30363d', codeBg: '#161b22',
  },
  'github-light': {
    bg: '#ffffff', bgSecondary: '#f6f8fa', bgTertiary: '#eef1f5',
    fg: '#24292f', fgSecondary: '#57606a', fgMuted: '#8b949e',
    accent: '#0969da', accentHover: '#0550ae', border: '#d0d7de', codeBg: '#f6f8fa',
  },
  dracula: {
    bg: '#282a36', bgSecondary: '#21222c', bgTertiary: '#343746',
    fg: '#f8f8f2', fgSecondary: '#bd93f9', fgMuted: '#6272a4',
    accent: '#ff79c6', accentHover: '#8be9fd', border: '#44475a', codeBg: '#21222c',
  },
  'tokyo-night': {
    bg: '#1a1b26', bgSecondary: '#16161e', bgTertiary: '#24283b',
    fg: '#c0caf5', fgSecondary: '#a9b1d6', fgMuted: '#565f89',
    accent: '#7aa2f7', accentHover: '#bb9af7', border: '#414868', codeBg: '#16161e',
  },
  nord: {
    bg: '#2e3440', bgSecondary: '#252a34', bgTertiary: '#3b4252',
    fg: '#d8dee9', fgSecondary: '#e5e9f0', fgMuted: '#4c566a',
    accent: '#88c0d0', accentHover: '#81a1c1', border: '#4c566a', codeBg: '#252a34',
  },
  'high-contrast-dark': {
    bg: '#000000', bgSecondary: '#111111', bgTertiary: '#1a1a1a',
    fg: '#ffffff', fgSecondary: '#d0d0d0', fgMuted: '#808080',
    accent: '#00ff00', accentHover: '#ffff00', border: '#ffffff', codeBg: '#111111',
  },
  vesper: {
    bg: '#101010', bgSecondary: '#171717', bgTertiary: '#222222',
    fg: '#ffffff', fgSecondary: '#a0a0a0', fgMuted: '#666666',
    accent: '#ffc799', accentHover: '#99ffe4', border: '#333333', codeBg: '#171717',
  },
  'pitch-black': {
    bg: '#000000', bgSecondary: '#050505', bgTertiary: '#101010',
    fg: '#e0e0e0', fgSecondary: '#b0b0b0', fgMuted: '#666666',
    accent: '#58a6ff', accentHover: '#7ee787', border: '#222222', codeBg: '#050505',
  },
  sepia: {
    bg: '#f4ecd8', bgSecondary: '#eadfca', bgTertiary: '#dfd0b5',
    fg: '#5c4a1e', fgSecondary: '#7b6330', fgMuted: '#a28b5f',
    accent: '#8b6914', accentHover: '#7a9e3b', border: '#d3bf91', codeBg: '#eadfca',
  },
  'solarized-light': {
    bg: '#fdf6e3', bgSecondary: '#eee8d5', bgTertiary: '#e5ddc7',
    fg: '#657b83', fgSecondary: '#586e75', fgMuted: '#93a1a1',
    accent: '#268bd2', accentHover: '#2aa198', border: '#d6cbb1', codeBg: '#eee8d5',
  },
};

export function getExportThemeColors(themeId: string): ThemeExportColors {
  return THEME_EXPORT_COLORS[themeId] ?? THEME_EXPORT_COLORS['github-dark'];
}

export function normalizeExportConfig(value: unknown): ExportConfig {
  const source = typeof value === 'object' && value !== null
    ? value as Partial<Record<keyof ExportConfig, unknown>>
    : {};

  return {
    themeId: typeof source.themeId === 'string' ? source.themeId : DEFAULT_EXPORT_CONFIG.themeId,
    fontBody: typeof source.fontBody === 'string' ? source.fontBody : DEFAULT_EXPORT_CONFIG.fontBody,
    fontHeading: typeof source.fontHeading === 'string' ? source.fontHeading : DEFAULT_EXPORT_CONFIG.fontHeading,
    fontCode: typeof source.fontCode === 'string' ? source.fontCode : DEFAULT_EXPORT_CONFIG.fontCode,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run tests/export-config.test.ts
```

Expected: PASS, 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/shared/export-config.ts tests/export-config.test.ts
git commit -m "feat: add export config theme palettes"
```

---

## Task 2: Move font registry to shared module with compatibility re-export

**Files:**
- Create: `src/shared/font-registry.ts`
- Modify: `src/webview/lib/font-registry.ts`
- Modify: `tests/font-registry.test.ts`

- [ ] **Step 1: Update tests to require both import paths**

Replace `tests/font-registry.test.ts` with:

```ts
import { describe, it, expect } from 'vitest';
import {
  BODY_FONTS,
  HEADING_FONTS,
  CODE_FONTS,
  getFontEntry,
  type FontEntry,
} from '../src/shared/font-registry';
import * as webviewRegistry from '../src/webview/lib/font-registry';

describe('font-registry', () => {
  it('webview registry re-exports the shared registry', () => {
    expect(webviewRegistry.BODY_FONTS).toBe(BODY_FONTS);
    expect(webviewRegistry.HEADING_FONTS).toBe(HEADING_FONTS);
    expect(webviewRegistry.CODE_FONTS).toBe(CODE_FONTS);
    expect(webviewRegistry.getFontEntry).toBe(getFontEntry);
  });

  it('BODY_FONTS has at least 4 entries', () => {
    expect(BODY_FONTS.length).toBeGreaterThanOrEqual(4);
  });

  it('HEADING_FONTS has at least 4 entries', () => {
    expect(HEADING_FONTS.length).toBeGreaterThanOrEqual(4);
  });

  it('CODE_FONTS has at least 3 entries', () => {
    expect(CODE_FONTS.length).toBeGreaterThanOrEqual(3);
  });

  it('all entries have required fields', () => {
    const all: FontEntry[] = [...BODY_FONTS, ...HEADING_FONTS, ...CODE_FONTS];
    for (const f of all) {
      expect(f.id, 'id').toBeTruthy();
      expect(f.label, 'label').toBeTruthy();
      expect(f.stack, 'stack').toBeTruthy();
    }
  });

  it('no duplicate ids within BODY_FONTS', () => {
    const ids = BODY_FONTS.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no duplicate ids within HEADING_FONTS', () => {
    const ids = HEADING_FONTS.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no duplicate ids within CODE_FONTS', () => {
    const ids = CODE_FONTS.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('first BODY_FONTS entry is system (no googleFamily)', () => {
    expect(BODY_FONTS[0].id).toBe('system');
    expect(BODY_FONTS[0].googleFamily).toBeUndefined();
  });

  it('first HEADING_FONTS entry is inherit (no googleFamily)', () => {
    expect(HEADING_FONTS[0].id).toBe('inherit');
    expect(HEADING_FONTS[0].googleFamily).toBeUndefined();
  });

  it('first CODE_FONTS entry is cascadia (no googleFamily)', () => {
    expect(CODE_FONTS[0].id).toBe('cascadia');
    expect(CODE_FONTS[0].googleFamily).toBeUndefined();
  });

  it('getFontEntry returns the correct entry', () => {
    const entry = getFontEntry('inter', BODY_FONTS);
    expect(entry.label).toBe('Inter');
    expect(entry.googleFamily).toBe('Inter');
  });

  it('getFontEntry throws on unknown id', () => {
    expect(() => getFontEntry('nonexistent', BODY_FONTS)).toThrow('Unknown font: nonexistent');
  });

  it('Google Font entries have googleFamily set', () => {
    const jetbrains = getFontEntry('jetbrains', CODE_FONTS);
    expect(jetbrains.googleFamily).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run tests/font-registry.test.ts
```

Expected: FAIL with import error for `../src/shared/font-registry`.

- [ ] **Step 3: Move registry content to shared file**

Create `src/shared/font-registry.ts`:

```ts
export interface FontEntry {
  id: string;
  label: string;
  stack: string;
  googleFamily?: string;
}

export const BODY_FONTS: FontEntry[] = [
  { id: 'system',       label: 'System UI',      stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', sans-serif" },
  { id: 'georgia',      label: 'Georgia',         stack: "Georgia, 'Times New Roman', serif" },
  { id: 'inter',        label: 'Inter',           stack: "'Inter', sans-serif",               googleFamily: 'Inter' },
  { id: 'lato',         label: 'Lato',            stack: "'Lato', sans-serif",                googleFamily: 'Lato' },
  { id: 'merriweather', label: 'Merriweather',    stack: "'Merriweather', serif",             googleFamily: 'Merriweather' },
  { id: 'nunito',       label: 'Nunito',          stack: "'Nunito', sans-serif",              googleFamily: 'Nunito' },
];

export const HEADING_FONTS: FontEntry[] = [
  { id: 'inherit',  label: 'Same as body',      stack: 'inherit' },
  { id: 'georgia',  label: 'Georgia',           stack: "Georgia, 'Times New Roman', serif" },
  { id: 'playfair', label: 'Playfair Display',  stack: "'Playfair Display', serif",          googleFamily: 'Playfair+Display' },
  { id: 'raleway',  label: 'Raleway',           stack: "'Raleway', sans-serif",              googleFamily: 'Raleway' },
  { id: 'poppins',  label: 'Poppins',           stack: "'Poppins', sans-serif",              googleFamily: 'Poppins' },
];

export const CODE_FONTS: FontEntry[] = [
  { id: 'cascadia',  label: 'Cascadia Code',   stack: "'Cascadia Code', Consolas, 'Courier New', monospace" },
  { id: 'jetbrains', label: 'JetBrains Mono',  stack: "'JetBrains Mono', monospace",         googleFamily: 'JetBrains+Mono' },
  { id: 'fira',      label: 'Fira Code',       stack: "'Fira Code', monospace",              googleFamily: 'Fira+Code' },
];

export function getFontEntry(id: string, fonts: FontEntry[]): FontEntry {
  const entry = fonts.find(f => f.id === id);
  if (!entry) throw new Error(`Unknown font: ${id}`);
  return entry;
}
```

Replace `src/webview/lib/font-registry.ts` with:

```ts
export * from '../../shared/font-registry';
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run tests/font-registry.test.ts
```

Expected: PASS, 14 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/shared/font-registry.ts src/webview/lib/font-registry.ts tests/font-registry.test.ts
git commit -m "refactor: share font registry with extension host"
```

---

## Task 3: Add font inliner module

**Files:**
- Create: `src/extension/font-inliner.ts`
- Create: `tests/font-inliner.test.ts`

- [ ] **Step 1: Write failing tests for font inliner**

Create `tests/font-inliner.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import type { ExportConfig } from '../src/shared/export-config';

vi.mock('node:https', () => ({
  request: vi.fn(),
}));

const { request } = await import('node:https');
const { prepareFonts, resolveFontStacks } = await import('../src/extension/font-inliner');

function createConfig(overrides: Partial<ExportConfig> = {}): ExportConfig {
  return {
    themeId: 'github-dark',
    fontBody: 'system',
    fontHeading: 'inherit',
    fontCode: 'cascadia',
    ...overrides,
  };
}

function mockHttpsResponses(responses: Array<{ body: string | Buffer; statusCode?: number }>) {
  let index = 0;
  vi.mocked(request).mockImplementation((url: string | URL, optionsOrCallback: unknown, callbackMaybe?: unknown) => {
    const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : callbackMaybe;
    const response = responses[index++] ?? { body: '', statusCode: 404 };
    const handlers: Record<string, (chunk?: unknown) => void> = {};
    const res = {
      statusCode: response.statusCode ?? 200,
      on: (event: string, handler: (chunk?: unknown) => void) => {
        handlers[event] = handler;
        return res;
      },
    };
    const req = {
      on: vi.fn(),
      end: vi.fn(() => {
        (callback as (res: typeof res) => void)(res);
        handlers.data?.(response.body);
        handlers.end?.();
      }),
    };
    return req as never;
  });
}

describe('font-inliner', () => {
  it('resolves configured font stacks without prompting when no Google fonts are selected', async () => {
    const showDialog = vi.fn();
    const result = await prepareFonts(createConfig(), showDialog);

    expect(result).toEqual({
      css: '',
      stacks: {
        body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', sans-serif",
        heading: 'inherit',
        code: "'Cascadia Code', Consolas, 'Courier New', monospace",
      },
    });
    expect(showDialog).not.toHaveBeenCalled();
  });

  it('deduplicates Google font families before prompting', async () => {
    const showDialog = vi.fn().mockResolvedValue('fallback');
    const result = await prepareFonts(
      createConfig({ fontBody: 'inter', fontHeading: 'inherit', fontCode: 'cascadia' }),
      showDialog,
    );

    expect(showDialog).toHaveBeenCalledWith(['Inter']);
    expect(result?.css).toBe('');
  });

  it('returns system fallback stacks when user chooses fallback', async () => {
    const showDialog = vi.fn().mockResolvedValue('fallback');
    const result = await prepareFonts(
      createConfig({ fontBody: 'inter', fontHeading: 'playfair', fontCode: 'fira' }),
      showDialog,
    );

    expect(result).toEqual({
      css: '',
      stacks: {
        body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        heading: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        code: "Consolas, 'Courier New', monospace",
      },
    });
  });

  it('preserves inherit heading when fallback is selected and heading config is inherit', async () => {
    const showDialog = vi.fn().mockResolvedValue('fallback');
    const result = await prepareFonts(
      createConfig({ fontBody: 'inter', fontHeading: 'inherit', fontCode: 'cascadia' }),
      showDialog,
    );

    expect(result?.stacks.heading).toBe('inherit');
  });

  it('returns null when user cancels font dialog', async () => {
    const showDialog = vi.fn().mockResolvedValue('cancel');
    await expect(prepareFonts(createConfig({ fontBody: 'inter' }), showDialog)).resolves.toBeNull();
  });

  it('embeds fetched woff2 font data as base64 CSS', async () => {
    mockHttpsResponses([
      {
        body: "@font-face { font-family: 'Inter'; src: url(https://fonts.gstatic.com/inter.woff2) format('woff2'); }",
      },
      { body: Buffer.from('woff2-data') },
    ]);
    const showDialog = vi.fn().mockResolvedValue('embed');

    const result = await prepareFonts(createConfig({ fontBody: 'inter' }), showDialog);

    expect(result?.css).toContain("font-family: 'Inter'");
    expect(result?.css).toContain('data:font/woff2;base64,d29mZjItZGF0YQ==');
    expect(result?.stacks.body).toBe("'Inter', sans-serif");
  });

  it('skips failed individual font binary fetches and continues', async () => {
    mockHttpsResponses([
      {
        body: "@font-face { font-family: 'Inter'; src: url(https://fonts.gstatic.com/inter.woff2) format('woff2'); }",
      },
      { body: 'missing', statusCode: 404 },
    ]);
    const showDialog = vi.fn().mockResolvedValue('embed');

    const result = await prepareFonts(createConfig({ fontBody: 'inter' }), showDialog);

    expect(result?.css).toContain("font-family: 'Inter'");
    expect(result?.css).toContain('https://fonts.gstatic.com/inter.woff2');
  });

  it('falls back to system stacks when Google CSS fetch fails', async () => {
    mockHttpsResponses([{ body: 'missing', statusCode: 500 }]);
    const showDialog = vi.fn().mockResolvedValue('embed');

    const result = await prepareFonts(createConfig({ fontBody: 'inter' }), showDialog);

    expect(result).toEqual({
      css: '',
      stacks: {
        body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        heading: 'inherit',
        code: "Consolas, 'Courier New', monospace",
      },
    });
  });

  it('resolveFontStacks falls back unknown ids to defaults', () => {
    expect(resolveFontStacks(createConfig({ fontBody: 'missing', fontHeading: 'missing', fontCode: 'missing' }))).toEqual({
      body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', sans-serif",
      heading: 'inherit',
      code: "'Cascadia Code', Consolas, 'Courier New', monospace",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run tests/font-inliner.test.ts
```

Expected: FAIL with import error for `../src/extension/font-inliner`.

- [ ] **Step 3: Implement font inliner**

Create `src/extension/font-inliner.ts`:

```ts
import * as https from 'node:https';
import type { ExportConfig } from '../shared/export-config';
import {
  BODY_FONTS,
  CODE_FONTS,
  HEADING_FONTS,
  type FontEntry,
  getFontEntry,
} from '../shared/font-registry';

export type FontDialogChoice = 'embed' | 'fallback' | 'cancel';

export interface FontStacks {
  body: string;
  heading: string;
  code: string;
}

export interface FontInlineResult {
  css: string;
  stacks: FontStacks;
}

const SYSTEM_FALLBACK_STACKS: FontStacks = {
  body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  heading: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  code: "Consolas, 'Courier New', monospace",
};

export async function prepareFonts(
  config: ExportConfig,
  showDialog: (families: string[]) => Promise<FontDialogChoice>,
): Promise<FontInlineResult | null> {
  const entries = resolveFontEntries(config);
  const families = uniqueFamilies(entries);

  if (families.length === 0) {
    return { css: '', stacks: entriesToStacks(entries) };
  }

  const choice = await showDialog(families);
  if (choice === 'cancel') return null;

  if (choice === 'fallback') {
    return { css: '', stacks: fallbackStacks(config) };
  }

  try {
    const css = await inlineGoogleFonts(families);
    return { css, stacks: entriesToStacks(entries) };
  } catch (err) {
    console.warn('[MarkdownWarrior] Google Fonts embedding failed:', err);
    return { css: '', stacks: fallbackStacks(config) };
  }
}

export function resolveFontStacks(config: ExportConfig): FontStacks {
  return entriesToStacks(resolveFontEntries(config));
}

function resolveFontEntries(config: ExportConfig): { body: FontEntry; heading: FontEntry; code: FontEntry } {
  return {
    body: safeGetFontEntry(config.fontBody, BODY_FONTS, 'system'),
    heading: safeGetFontEntry(config.fontHeading, HEADING_FONTS, 'inherit'),
    code: safeGetFontEntry(config.fontCode, CODE_FONTS, 'cascadia'),
  };
}

function safeGetFontEntry(id: string, fonts: FontEntry[], fallbackId: string): FontEntry {
  try {
    return getFontEntry(id, fonts);
  } catch {
    return getFontEntry(fallbackId, fonts);
  }
}

function entriesToStacks(entries: { body: FontEntry; heading: FontEntry; code: FontEntry }): FontStacks {
  return {
    body: entries.body.stack,
    heading: entries.heading.stack,
    code: entries.code.stack,
  };
}

function fallbackStacks(config: ExportConfig): FontStacks {
  return {
    body: SYSTEM_FALLBACK_STACKS.body,
    heading: config.fontHeading === 'inherit' ? 'inherit' : SYSTEM_FALLBACK_STACKS.heading,
    code: SYSTEM_FALLBACK_STACKS.code,
  };
}

function uniqueFamilies(entries: { body: FontEntry; heading: FontEntry; code: FontEntry }): string[] {
  return [...new Set([entries.body.googleFamily, entries.heading.googleFamily, entries.code.googleFamily]
    .filter((family): family is string => typeof family === 'string' && family.length > 0))];
}

async function inlineGoogleFonts(families: string[]): Promise<string> {
  const parts: string[] = [];

  for (const family of families) {
    const encoded = family.replace(/ /g, '+');
    const css = await getText(`https://fonts.googleapis.com/css2?family=${encoded}&display=swap`, {
      'User-Agent': 'Mozilla/5.0',
    });
    parts.push(await inlineFontUrls(css));
  }

  return parts.join('\n');
}

async function inlineFontUrls(css: string): Promise<string> {
  const urlRe = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g;
  let result = css;
  const urls = [...css.matchAll(urlRe)].map(match => match[1]);

  for (const url of urls) {
    try {
      const data = await getBuffer(url);
      result = result.replace(url, `data:font/woff2;base64,${data.toString('base64')}`);
    } catch (err) {
      console.warn('[MarkdownWarrior] Font binary fetch failed:', err);
    }
  }

  return result;
}

function getText(url: string, headers: Record<string, string> = {}): Promise<string> {
  return requestBuffer(url, headers).then(buffer => buffer.toString('utf8'));
}

function getBuffer(url: string): Promise<Buffer> {
  return requestBuffer(url);
}

function requestBuffer(url: string, headers: Record<string, string> = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', chunk => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      res.on('end', () => {
        if ((res.statusCode ?? 0) < 200 || (res.statusCode ?? 0) >= 300) {
          reject(new Error(`Request failed with status ${res.statusCode}: ${url}`));
          return;
        }
        resolve(Buffer.concat(chunks));
      });
    });
    req.on('error', reject);
    req.end();
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run tests/font-inliner.test.ts
```

Expected: PASS, 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/extension/font-inliner.ts tests/font-inliner.test.ts
git commit -m "feat: add Google Fonts inliner for HTML export"
```

---

## Task 4: Add font sync message types and webview posting

**Files:**
- Modify: `src/shared/messages.ts`
- Modify: `src/webview/App.svelte`
- Create: `tests/app-font-sync.test.ts`

- [ ] **Step 1: Write source-based failing tests**

Create `tests/app-font-sync.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync('src/webview/App.svelte', 'utf8');
const messagesSource = readFileSync('src/shared/messages.ts', 'utf8');

describe('App.svelte font sync messaging', () => {
  it('declares syncFonts message type', () => {
    expect(messagesSource).toContain("type: 'syncFonts'");
    expect(messagesSource).toContain('fontBody: string');
    expect(messagesSource).toContain('fontHeading: string');
    expect(messagesSource).toContain('fontCode: string');
  });

  it('declares setFont message type', () => {
    expect(messagesSource).toContain("type: 'setFont'");
    expect(messagesSource).toContain("slot: 'body' | 'heading' | 'code'");
    expect(messagesSource).toContain('id: string');
  });

  it('posts syncFonts on mount with current font state', () => {
    expect(appSource).toContain("postMessage({ type: 'syncFonts', fontBody, fontHeading, fontCode })");
  });

  it('posts setFont from handleFontChange', () => {
    expect(appSource).toContain("postMessage({ type: 'setFont', slot, id })");
  });

  it('keeps existing ready message', () => {
    expect(appSource).toContain("postMessage({ type: 'ready' })");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npx vitest run tests/app-font-sync.test.ts
```

Expected: FAIL because `syncFonts` and `setFont` are not in source yet.

- [ ] **Step 3: Update message union**

Modify `src/shared/messages.ts` so `WebviewToHostMessage` becomes:

```ts
export type WebviewToHostMessage =
  | { type: 'openExternal'; url: string }
  | { type: 'openFile'; path: string }
  | { type: 'scrollSync'; line: number }
  | { type: 'checkboxToggle'; line: number; checked: boolean }
  | { type: 'setTheme'; themeId: string }
  | { type: 'setFont'; slot: 'body' | 'heading' | 'code'; id: string }
  | { type: 'syncFonts'; fontBody: string; fontHeading: string; fontCode: string }
  | { type: 'ready' };
```

- [ ] **Step 4: Post font messages from App.svelte**

In `src/webview/App.svelte`, modify `handleFontChange` to:

```ts
  function handleFontChange(slot: 'body' | 'heading' | 'code', id: string) {
    if (slot === 'body') fontBody = id;
    else if (slot === 'heading') fontHeading = id;
    else fontCode = id;
    postMessage({ type: 'setFont', slot, id });
  }
```

Modify `onMount` to include font sync:

```ts
  onMount(() => {
    setupCheckboxHandler();
    setupCollapsibleHeadings();
    document.documentElement.dataset.theme = selectedTheme;
    postMessage({ type: 'syncFonts', fontBody, fontHeading, fontCode });
  });
```

- [ ] **Step 5: Run tests to verify they pass**

Run:

```bash
npx vitest run tests/app-font-sync.test.ts
```

Expected: PASS, 5 tests pass.

- [ ] **Step 6: Run TypeScript build for message type correctness**

Run:

```bash
npm run build
```

Expected: PASS, both extension and webview builds complete.

- [ ] **Step 7: Commit**

```bash
git add src/shared/messages.ts src/webview/App.svelte tests/app-font-sync.test.ts
git commit -m "feat: sync font selections to extension host"
```

---

## Task 5: Persist fonts in PreviewProvider and expose export config

**Files:**
- Modify: `src/extension/preview-provider.ts`
- Create: `tests/preview-provider-fonts.test.ts`

- [ ] **Step 1: Write source-based failing tests**

Create `tests/preview-provider-fonts.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/extension/preview-provider.ts', 'utf8');

describe('PreviewProvider export font config', () => {
  it('defines globalState keys for font slots', () => {
    expect(source).toContain("const FONT_BODY_KEY = 'markdownWarrior.fontBody'");
    expect(source).toContain("const FONT_HEADING_KEY = 'markdownWarrior.fontHeading'");
    expect(source).toContain("const FONT_CODE_KEY = 'markdownWarrior.fontCode'");
  });

  it('handles setFont webview messages', () => {
    expect(source).toContain("case 'setFont'");
    expect(source).toContain('message.slot === \'body\'');
    expect(source).toContain('message.slot === \'heading\'');
    expect(source).toContain('this.context.globalState.update(key, message.id)');
  });

  it('handles syncFonts webview messages', () => {
    expect(source).toContain("case 'syncFonts'");
    expect(source).toContain('message.fontBody');
    expect(source).toContain('message.fontHeading');
    expect(source).toContain('message.fontCode');
  });

  it('exposes getExportConfig with selected theme and persisted fonts', () => {
    expect(source).toContain('public getExportConfig()');
    expect(source).toContain('themeId: this.selectedThemeId');
    expect(source).toContain("this.context.globalState.get<string>(FONT_BODY_KEY, 'system')");
    expect(source).toContain("this.context.globalState.get<string>(FONT_HEADING_KEY, 'inherit')");
    expect(source).toContain("this.context.globalState.get<string>(FONT_CODE_KEY, 'cascadia')");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run tests/preview-provider-fonts.test.ts
```

Expected: FAIL because keys, message cases, and `getExportConfig()` do not exist.

- [ ] **Step 3: Add imports and constants**

At top of `src/extension/preview-provider.ts`, add import:

```ts
import type { ExportConfig } from '../shared/export-config';
```

After `THEME_GLOBAL_STATE_KEY`, add:

```ts
const FONT_BODY_KEY = 'markdownWarrior.fontBody';
const FONT_HEADING_KEY = 'markdownWarrior.fontHeading';
const FONT_CODE_KEY = 'markdownWarrior.fontCode';
```

- [ ] **Step 4: Add getExportConfig method**

Add public method after `togglePresentation()`:

```ts
  public getExportConfig(): ExportConfig {
    return {
      themeId: this.selectedThemeId,
      fontBody: this.context.globalState.get<string>(FONT_BODY_KEY, 'system'),
      fontHeading: this.context.globalState.get<string>(FONT_HEADING_KEY, 'inherit'),
      fontCode: this.context.globalState.get<string>(FONT_CODE_KEY, 'cascadia'),
    };
  }
```

- [ ] **Step 5: Add message handlers**

In `handleWebviewMessage`, after `case 'setTheme':`, add:

```ts
      case 'setFont': {
        const key = message.slot === 'body'
          ? FONT_BODY_KEY
          : message.slot === 'heading'
            ? FONT_HEADING_KEY
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

The final switch section should include `break` after `setTheme`, then the new cases:

```ts
      case 'setTheme':
        await this.setTheme(message.themeId);
        break;
      case 'setFont': {
        const key = message.slot === 'body'
          ? FONT_BODY_KEY
          : message.slot === 'heading'
            ? FONT_HEADING_KEY
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

- [ ] **Step 6: Run tests and build**

Run:

```bash
npx vitest run tests/preview-provider-fonts.test.ts
npm run build
```

Expected: test PASS, build PASS.

- [ ] **Step 7: Commit**

```bash
git add src/extension/preview-provider.ts tests/preview-provider-fonts.test.ts
git commit -m "feat: persist font selections for export"
```

---

## Task 6: Update extension command to pass export config

**Files:**
- Modify: `src/extension/extension.ts`
- Create: `tests/extension-export-config.test.ts`

- [ ] **Step 1: Write source-based failing test**

Create `tests/extension-export-config.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/extension/extension.ts', 'utf8');

describe('extension exportHTML command config wiring', () => {
  it('passes PreviewProvider export config into exporter.exportHTML', () => {
    expect(source).toContain('const config = previewProvider.getExportConfig()');
    expect(source).toContain('await exporter.exportHTML(editor, config)');
  });

  it('uses async command handler for HTML export', () => {
    expect(source).toMatch(/markdownWarrior\.exportHTML',[\s\S]*async \(\) =>/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run tests/extension-export-config.test.ts
```

Expected: FAIL because command does not pass config yet.

- [ ] **Step 3: Update command handler**

In `src/extension/extension.ts`, replace the `exportHTMLCmd` registration with:

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

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run tests/extension-export-config.test.ts
```

Expected: PASS, 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/extension/extension.ts tests/extension-export-config.test.ts
git commit -m "feat: pass preview config to HTML export command"
```

---

## Task 7: Refactor exporter to use theme config, Shiki theme, and prepared fonts

**Files:**
- Modify: `src/extension/exporter.ts`
- Create: `tests/exporter-config.test.ts`

- [ ] **Step 1: Write source-based failing tests**

Create `tests/exporter-config.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/extension/exporter.ts', 'utf8');

describe('Exporter HTML config support', () => {
  it('imports export config, theme colors, theme registry, and font inliner', () => {
    expect(source).toContain("from '../shared/export-config'");
    expect(source).toContain("from '../shared/theme-registry'");
    expect(source).toContain("from './font-inliner'");
  });

  it('exportHTML accepts config argument', () => {
    expect(source).toContain('public async exportHTML(editor: vscode.TextEditor, config: ExportConfig)');
  });

  it('renders markdown with selected Shiki theme', () => {
    expect(source).toContain('const shikiTheme = getTheme(config.themeId).shikiTheme');
    expect(source).toContain('this.engine.render(text, shikiTheme)');
  });

  it('prepares fonts before writing HTML', () => {
    expect(source).toContain('const fontResult = await prepareFonts(config');
    expect(source).toContain('if (!fontResult) return');
  });

  it('shows Embed, Use system fallbacks, and Cancel options', () => {
    expect(source).toContain("'Embed'");
    expect(source).toContain("'Use system fallbacks'");
    expect(source).toContain("'Cancel'");
  });

  it('wraps exported HTML with baked theme variables and font CSS', () => {
    expect(source).toContain('getExportThemeColors(config.themeId)');
    expect(source).toContain('--md-bg-primary: ${colors.bg};');
    expect(source).toContain('--md-font-heading: ${fontResult.stacks.heading};');
    expect(source).toContain('${fontResult.css}');
  });

  it('does not use prefers-color-scheme in HTML export wrapper', () => {
    const wrapperIndex = source.indexOf('private wrapExportHTMLDocument');
    expect(wrapperIndex).toBeGreaterThanOrEqual(0);
    const exportHtmlSection = source.slice(wrapperIndex);
    expect(exportHtmlSection).not.toContain('prefers-color-scheme');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run tests/exporter-config.test.ts
```

Expected: FAIL because exporter has no config support yet.

- [ ] **Step 3: Add imports**

At top of `src/extension/exporter.ts`, add:

```ts
import type { ExportConfig } from '../shared/export-config';
import { getExportThemeColors } from '../shared/export-config';
import { getTheme } from '../shared/theme-registry';
import { prepareFonts, type FontDialogChoice, type FontInlineResult } from './font-inliner';
```

- [ ] **Step 4: Update exportHTML method**

Replace existing `exportHTML` method with:

```ts
  public async exportHTML(editor: vscode.TextEditor, config: ExportConfig): Promise<void> {
    const fontResult = await prepareFonts(config, families => this.showFontEmbedDialog(families));
    if (!fontResult) return;

    const text = editor.document.getText();
    const shikiTheme = getTheme(config.themeId).shikiTheme;
    const { html } = this.engine.render(text, shikiTheme);
    const fileName = path.basename(editor.document.fileName, '.md');

    const htmlContent = this.wrapExportHTMLDocument(html, fileName, config, fontResult);

    const defaultUri = vscode.Uri.file(
      path.join(path.dirname(editor.document.uri.fsPath), `${fileName}.html`)
    );

    const saveUri = await vscode.window.showSaveDialog({
      defaultUri,
      filters: { 'HTML Files': ['html'] },
    });

    if (saveUri) {
      fs.writeFileSync(saveUri.fsPath, htmlContent, 'utf-8');
      vscode.window.showInformationMessage(`Exported to ${saveUri.fsPath}`);
    }
  }
```

- [ ] **Step 5: Add font dialog helper**

Add method inside `Exporter` class before `exportPDF`:

```ts
  private async showFontEmbedDialog(families: string[]): Promise<FontDialogChoice> {
    const choice = await vscode.window.showInformationMessage(
      `Export uses Google Fonts (${families.join(', ')}). Embed fonts for offline use? This can make the HTML file larger.`,
      { modal: true },
      'Embed',
      'Use system fallbacks',
      'Cancel'
    );

    if (choice === 'Embed') return 'embed';
    if (choice === 'Use system fallbacks') return 'fallback';
    return 'cancel';
  }
```

- [ ] **Step 6: Add export wrapper method without changing exportPDF**

Keep existing `wrapInHTMLDocument(bodyHtml, title, forPrint = false)` exactly for `exportPDF`.

Add new method before existing `wrapInHTMLDocument`:

```ts
  private wrapExportHTMLDocument(
    bodyHtml: string,
    title: string,
    config: ExportConfig,
    fontResult: FontInlineResult,
  ): string {
    const colors = getExportThemeColors(config.themeId);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.escapeHtml(title)}</title>
  <style>
    ${fontResult.css}

    :root {
      --md-bg-primary: ${colors.bg};
      --md-bg-secondary: ${colors.bgSecondary};
      --md-bg-tertiary: ${colors.bgTertiary};
      --md-fg-primary: ${colors.fg};
      --md-fg-secondary: ${colors.fgSecondary};
      --md-fg-muted: ${colors.fgMuted};
      --md-accent: ${colors.accent};
      --md-accent-hover: ${colors.accentHover};
      --md-border: ${colors.border};
      --md-code-bg: ${colors.codeBg};
      --md-font-body: ${fontResult.stacks.body};
      --md-font-heading: ${fontResult.stacks.heading};
      --md-font-mono: ${fontResult.stacks.code};
      --md-font-size: 16px;
      --md-line-height: 1.6;
      --md-radius: 6px;
      --md-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--md-font-body);
      background: var(--md-bg-primary);
      color: var(--md-fg-primary);
      line-height: var(--md-line-height);
    }

    .markdown-body {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 2.5rem;
      font-size: var(--md-font-size);
    }

    .markdown-body h1, .markdown-body h2, .markdown-body h3,
    .markdown-body h4, .markdown-body h5, .markdown-body h6 {
      font-family: var(--md-font-heading);
      margin-top: 1.5em; margin-bottom: 0.5em;
      font-weight: 600; line-height: 1.3;
    }
    .markdown-body h1 { font-size: 2.2em; border-bottom: 1px solid var(--md-border); padding-bottom: 0.3em; }
    .markdown-body h2 { font-size: 1.6em; border-bottom: 1px solid var(--md-border); padding-bottom: 0.3em; }
    .markdown-body h3 { font-size: 1.3em; }
    .markdown-body p { margin: 0.8em 0; }
    .markdown-body a { color: var(--md-accent); text-decoration: none; }
    .markdown-body a:hover { text-decoration: underline; }
    .markdown-body code {
      font-family: var(--md-font-mono);
      background: var(--md-code-bg);
      padding: 0.2em 0.4em;
      border-radius: 4px;
      font-size: 0.88em;
    }
    .markdown-body pre {
      background: var(--md-code-bg);
      border-radius: var(--md-radius);
      padding: 1.2em 1.4em;
      overflow-x: auto;
      border: 1px solid var(--md-border);
      margin: 1.2em 0;
    }
    .markdown-body pre code { background: none; padding: 0; font-size: 0.875em; }
    .markdown-body blockquote {
      border-left: 4px solid var(--md-accent);
      margin: 1.2em 0; padding: 0.6em 1.2em;
      color: var(--md-fg-secondary);
      background: var(--md-bg-secondary);
      border-radius: 0 var(--md-radius) var(--md-radius) 0;
    }
    .markdown-body ul, .markdown-body ol { padding-left: 2em; margin: 0.8em 0; }
    .markdown-body li { margin: 0.3em 0; }
    .markdown-body table { border-collapse: collapse; width: 100%; margin: 1.2em 0; }
    .markdown-body th, .markdown-body td { border: 1px solid var(--md-border); padding: 0.6em 1em; }
    .markdown-body th { background: var(--md-bg-secondary); font-weight: 600; }
    .markdown-body img { max-width: 100%; height: auto; border-radius: var(--md-radius); }
    .markdown-body hr { border: none; border-top: 2px solid var(--md-border); margin: 2.5em 0; }
  </style>
</head>
<body>
  <div class="markdown-body">
    ${bodyHtml}
  </div>
</body>
</html>`;
  }
```

- [ ] **Step 7: Run exporter tests**

Run:

```bash
npx vitest run tests/exporter-config.test.ts
```

Expected: PASS, 7 tests pass.

- [ ] **Step 8: Run build**

Run:

```bash
npm run build
```

Expected: PASS. If TypeScript reports `exportHTML` call mismatch, verify Task 6 was completed and committed.

- [ ] **Step 9: Commit**

```bash
git add src/extension/exporter.ts tests/exporter-config.test.ts
git commit -m "feat: export HTML with selected theme and fonts"
```

---

## Task 8: Integration verification and full regression suite

**Files:**
- No new files expected
- May modify test files if exact string formatting differs after implementation

- [ ] **Step 1: Run targeted feature tests**

Run:

```bash
npx vitest run tests/export-config.test.ts tests/font-registry.test.ts tests/font-inliner.test.ts tests/app-font-sync.test.ts tests/preview-provider-fonts.test.ts tests/extension-export-config.test.ts tests/exporter-config.test.ts
```

Expected: PASS, all new/updated tests pass.

- [ ] **Step 2: Run full test suite**

Run:

```bash
npx vitest run
```

Expected: PASS. Baseline before this feature was 127 tests; final count should be higher because this plan adds new tests.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS. Both `build:extension` and `build:webview` complete without TypeScript/Vite errors.

- [ ] **Step 4: Inspect final diff**

Run:

```bash
git diff --stat HEAD~7..HEAD
git diff HEAD~7..HEAD -- src/extension/exporter.ts src/extension/font-inliner.ts src/extension/preview-provider.ts src/webview/App.svelte src/shared/export-config.ts src/shared/font-registry.ts src/shared/messages.ts
```

Expected: diff includes only planned files and test files.

- [ ] **Step 5: Commit any verification-only test adjustments if needed**

If Step 1-3 required changes to tests or code after Task 7, commit them:

```bash
git add src tests
git commit -m "test: verify configured HTML export flow"
```

If no files changed, skip commit.

---

## Task 9: Manual VS Code verification

**Files:**
- No source changes expected

- [ ] **Step 1: Launch Extension Development Host**

Open VS Code command palette and run:

```text
Developer: Reload Window
```

Then press `F5` in the extension workspace to launch Extension Development Host.

Expected: Extension Development Host opens with Markdown Warrior Preview extension loaded.

- [ ] **Step 2: Create or open markdown sample**

Use a markdown file containing headings, paragraphs, and code:

````md
# Export Test

This paragraph should use body font.

## Heading Test

```ts
const message: string = 'syntax colors should match selected theme';
console.log(message);
```
````

Expected: Markdown file opens as normal.

- [ ] **Step 3: Open preview and set config**

Run command:

```text
Markdown Warrior: Open Preview
```

In preview ThemePanel:
- Select theme: `GitHub Dark`
- Body font: `Inter`
- Heading font: `Playfair Display`
- Code font: `Fira Code`

Expected: preview updates visually with selected theme and fonts.

- [ ] **Step 4: Export HTML with embed option**

Run command:

```text
Markdown Warrior: Export as HTML
```

When dialog appears, choose:

```text
Embed
```

Save as `export-test.html`.

Expected: file is written.

- [ ] **Step 5: Inspect exported HTML file**

Open `export-test.html` in a browser and inspect page source.

Expected source contains:

```text
data:font/woff2;base64,
--md-bg-primary: #0d1117;
--md-font-body: 'Inter', sans-serif;
--md-font-heading: 'Playfair Display', serif;
--md-font-mono: 'Fira Code', monospace;
```

Expected source does not contain:

```text
prefers-color-scheme
```

- [ ] **Step 6: Export HTML with fallback option**

Run export again and choose:

```text
Use system fallbacks
```

Expected source contains no `data:font/woff2;base64,` and includes:

```text
--md-font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--md-font-mono: Consolas, 'Courier New', monospace;
```

- [ ] **Step 7: Export HTML with cancel option**

Run export again and choose:

```text
Cancel
```

Expected: no save dialog appears and no file is written.

---

## Self-Review Checklist

- [ ] Spec coverage: Tasks cover export config, shared font registry, font inliner, font sync messages, PreviewProvider persistence, command wiring, exporter HTML wrapper, tests, and manual verification.
- [ ] Placeholder scan: No `TBD`, `TODO`, `implement later`, or vague unimplemented steps remain.
- [ ] Type consistency: `ExportConfig`, `FontInlineResult`, `FontStacks`, `FontDialogChoice`, `prepareFonts`, `getExportThemeColors`, and `getExportConfig` names match across tasks.
- [ ] Scope check: `exportPDF` remains out of scope and existing `wrapInHTMLDocument` remains for PDF/browser-print flow.
