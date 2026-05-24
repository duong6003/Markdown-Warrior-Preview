# WYSIWYG Export (HTML & PDF) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-rolled CSS in the HTML exporter with the actual webview CSS files so the exported HTML exactly matches the preview, and fix PDF export to use the current theme/font config.

**Architecture:** A new pure exported function `buildExportHTML()` in `exporter.ts` takes CSS file contents as strings and assembles the final HTML document with `data-theme` set on `<html>` — exactly the same mechanism the webview uses. A build script copies `markdown-body.css`, `themes.css`, and `extensions.css` to `dist/export-styles/` so they are available inside the deployed VSIX. `exportPDF()` gains a `config` parameter and reuses the same pipeline as `exportHTML()` with extra `@media print` CSS.

**Tech Stack:** Node.js (build script), TypeScript, Vitest (source-text test pattern), esbuild + Vite, VS Code extension API.

---

### Task 1: Build script — copy CSS files to `dist/export-styles/`

**Files:**
- Create: `scripts/copy-export-styles.js`
- Modify: `package.json`

- [ ] **Step 1: Create `scripts/copy-export-styles.js`**

```js
// scripts/copy-export-styles.js
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'webview', 'styles');
const dest = path.join(__dirname, '..', 'dist', 'export-styles');

fs.mkdirSync(dest, { recursive: true });

for (const file of ['markdown-body.css', 'themes.css', 'extensions.css']) {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
}

console.log('Export styles copied to dist/export-styles/');
```

- [ ] **Step 2: Run the script standalone to verify it works**

```powershell
node scripts/copy-export-styles.js
```

Expected output:
```
Export styles copied to dist/export-styles/
```

Then verify files exist:
```powershell
Get-ChildItem dist/export-styles/
```

Expected: `extensions.css`, `markdown-body.css`, `themes.css` — all non-zero size.

- [ ] **Step 3: Update `package.json` to include the copy step in build**

In `package.json`, change the `scripts` block:

```json
"vscode:prepublish": "npm run build:export-styles && npm run build:extension && npm run build:webview",
"build": "npm run build:export-styles && npm run build:extension && npm run build:webview",
"build:export-styles": "node scripts/copy-export-styles.js",
```

(Only `vscode:prepublish`, `build`, and the new `build:export-styles` lines change. All other scripts are unchanged.)

- [ ] **Step 4: Run full build and verify**

```powershell
npm run build
```

Expected: no errors, `dist/export-styles/` contains three CSS files.

- [ ] **Step 5: Commit**

```powershell
git add scripts/copy-export-styles.js package.json dist/export-styles/
git commit -m "build: add script to copy webview CSS into dist/export-styles for HTML export"
```

---

### Task 2: `buildExportHTML` pure function (TDD)

**Files:**
- Create: `tests/exporter-css-embed.test.ts`
- Modify: `src/extension/exporter.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/exporter-css-embed.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { buildExportHTML } from '../src/extension/exporter';
import type { FontInlineResult } from '../src/extension/font-inliner';

const mockFont: FontInlineResult = {
  css: '',
  stacks: { body: 'system-ui, sans-serif', heading: 'system-ui, sans-serif', code: 'monospace' },
};

const mockCss = {
  markdown: '.markdown-body { color: red; }',
  themes: ':root[data-theme="github-dark"] { --theme-bg: #0d1117; }',
  extensions: '.frontmatter-block { border: 1px solid; }',
};

describe('buildExportHTML', () => {
  it('sets data-theme on html element', () => {
    const out = buildExportHTML('<p>Hi</p>', 'test', 'github-dark', mockFont, mockCss);
    expect(out).toContain('data-theme="github-dark"');
  });

  it('embeds themes CSS', () => {
    const out = buildExportHTML('<p>Hi</p>', 'test', 'catppuccin-mocha', mockFont, mockCss);
    expect(out).toContain(mockCss.themes);
  });

  it('embeds markdown-body CSS', () => {
    const out = buildExportHTML('<p>Hi</p>', 'test', 'catppuccin-mocha', mockFont, mockCss);
    expect(out).toContain(mockCss.markdown);
  });

  it('embeds extensions CSS', () => {
    const out = buildExportHTML('<p>Hi</p>', 'test', 'catppuccin-mocha', mockFont, mockCss);
    expect(out).toContain(mockCss.extensions);
  });

  it('includes font stack overrides in :root', () => {
    const fontResult: FontInlineResult = {
      css: '',
      stacks: { body: "'Inter', sans-serif", heading: "'Playfair Display', serif", code: "'Fira Code', monospace" },
    };
    const out = buildExportHTML('<p>Hi</p>', 'test', 'github-dark', fontResult, mockCss);
    expect(out).toContain("--md-font-body: 'Inter', sans-serif");
    expect(out).toContain("--md-font-heading: 'Playfair Display', serif");
    expect(out).toContain("--md-font-mono: 'Fira Code', monospace");
  });

  it('embeds Google Fonts CSS when fontResult.css is non-empty', () => {
    const fontResult: FontInlineResult = {
      css: '@font-face { font-family: Inter; }',
      stacks: mockFont.stacks,
    };
    const out = buildExportHTML('<p>Hi</p>', 'test', 'github-dark', fontResult, mockCss);
    expect(out).toContain('@font-face { font-family: Inter; }');
  });

  it('does not contain prefers-color-scheme', () => {
    const out = buildExportHTML('<p>Hi</p>', 'test', 'catppuccin-mocha', mockFont, mockCss);
    expect(out).not.toContain('prefers-color-scheme');
  });

  it('includes extraCss when provided', () => {
    const printCss = '@media print { body { background: white; } }';
    const out = buildExportHTML('<p>Hi</p>', 'test', 'catppuccin-mocha', mockFont, mockCss, printCss);
    expect(out).toContain('@media print');
  });

  it('includes body HTML content', () => {
    const out = buildExportHTML('<p>Hello World</p>', 'test', 'github-dark', mockFont, mockCss);
    expect(out).toContain('<p>Hello World</p>');
  });

  it('escapes title to prevent XSS', () => {
    const out = buildExportHTML('<p/>', 'My Doc <test>', 'github-dark', mockFont, mockCss);
    expect(out).toContain('<title>My Doc &lt;test&gt;</title>');
  });

  it('includes KaTeX stylesheet link', () => {
    const out = buildExportHTML('<p>Hi</p>', 'test', 'github-dark', mockFont, mockCss);
    expect(out).toContain('katex');
  });
});
```

- [ ] **Step 2: Run tests — verify they all FAIL**

```powershell
npm test -- exporter-css-embed
```

Expected: all tests FAIL with `buildExportHTML is not a function` or similar.

- [ ] **Step 3: Add `buildExportHTML` to `src/extension/exporter.ts`**

At the top of `src/extension/exporter.ts`, before the `Exporter` class, add a module-level `escapeHtml` helper and the exported `buildExportHTML` function. Also remove the private `escapeHtml` method from the class (it becomes the module-level one).

Add immediately after the import block and before the `export class Exporter` line:

```typescript
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function buildExportHTML(
  bodyHtml: string,
  title: string,
  themeId: string,
  fontResult: FontInlineResult,
  cssFiles: { markdown: string; themes: string; extensions: string },
  extraCss = '',
): string {
  const fontOverrides = `:root {
      --md-font-body: ${fontResult.stacks.body};
      --md-font-heading: ${fontResult.stacks.heading};
      --md-font-mono: ${fontResult.stacks.code};
      --md-font-size: 16px;
      --md-line-height: 1.6;
    }`;

  const resetCss = `* { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      min-height: 100%;
      background: var(--md-bg-primary);
      color: var(--md-fg-primary);
      font-family: var(--md-font-body);
      line-height: var(--md-line-height);
    }`;

  return `<!DOCTYPE html>
<html lang="en" data-theme="${themeId}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.css" crossorigin="anonymous" />
  <style>${cssFiles.themes}</style>
  <style>${cssFiles.markdown}</style>
  <style>${cssFiles.extensions}</style>
  <style>${resetCss}</style>
  <style>${fontOverrides}</style>${fontResult.css ? `\n  <style>${fontResult.css}</style>` : ''}${extraCss ? `\n  <style>${extraCss}</style>` : ''}
</head>
<body>
  <div class="markdown-body">
    ${bodyHtml}
  </div>
</body>
</html>`;
}
```

Also delete the `private escapeHtml(str: string): string` method from the `Exporter` class body (it's now the module-level function above).

- [ ] **Step 4: Run tests — verify they all PASS**

```powershell
npm test -- exporter-css-embed
```

Expected: 10 tests pass.

- [ ] **Step 5: Run full test suite — verify no regressions**

```powershell
npm test
```

Expected: all previously passing tests still pass.

- [ ] **Step 6: Commit**

```powershell
git add src/extension/exporter.ts tests/exporter-css-embed.test.ts
git commit -m "feat: add buildExportHTML pure function using embedded CSS files"
```

---

### Task 3: Update `Exporter` class — constructor, `readExportStyles()`, wire `exportHTML()`

**Files:**
- Modify: `src/extension/exporter.ts`
- Modify: `src/extension/extension.ts`
- Modify: `tests/exporter-config.test.ts`

- [ ] **Step 1: Update `exporter-config.test.ts` to reflect the new structure**

Replace the entire content of `tests/exporter-config.test.ts` with:

```typescript
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/extension/exporter.ts', 'utf8');

describe('Exporter HTML config support', () => {
  it('exports buildExportHTML as a standalone function', () => {
    expect(source).toContain('export function buildExportHTML(');
  });

  it('imports theme registry and font inliner', () => {
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

  it('sets data-theme attribute on exported HTML', () => {
    expect(source).toContain('data-theme="${themeId}"');
  });

  it('reads CSS from dist/export-styles', () => {
    expect(source).toContain("'dist', 'export-styles'");
    expect(source).toContain("'markdown-body.css'");
    expect(source).toContain("'themes.css'");
    expect(source).toContain("'extensions.css'");
  });

  it('does not contain prefers-color-scheme', () => {
    expect(source).not.toContain('prefers-color-scheme');
  });

  it('PDF export uses print-color-adjust: exact', () => {
    expect(source).toContain('print-color-adjust: exact');
  });

  it('does not contain old wrapper methods', () => {
    expect(source).not.toContain('wrapExportHTMLDocument');
    expect(source).not.toContain('wrapInHTMLDocument');
  });
});
```

- [ ] **Step 2: Run the updated test file — verify which tests fail**

```powershell
npm test -- exporter-config
```

Expected: several tests FAIL (`reads CSS from dist/export-styles`, `sets data-theme`, `does not contain old wrapper methods`, etc.) — these will pass after implementation.

- [ ] **Step 3: Update `Exporter` constructor to accept `extensionUri`**

In `src/extension/exporter.ts`, replace the class constructor:

```typescript
// Before:
constructor(private engine: MarkdownEngine) {}

// After:
constructor(private engine: MarkdownEngine, private extensionUri: vscode.Uri) {}
```

- [ ] **Step 4: Add `readExportStyles()` method to `Exporter`**

Add this private method inside the `Exporter` class, after `showFontEmbedDialog`:

```typescript
private readExportStyles(): { markdown: string; themes: string; extensions: string } {
  const dir = vscode.Uri.joinPath(this.extensionUri, 'dist', 'export-styles');
  const read = (name: string) =>
    fs.readFileSync(vscode.Uri.joinPath(dir, name).fsPath, 'utf-8');
  return {
    markdown: read('markdown-body.css'),
    themes: read('themes.css'),
    extensions: read('extensions.css'),
  };
}
```

- [ ] **Step 5: Rewrite `exportHTML()` to use the new flow**

Replace the entire `exportHTML` method body in `src/extension/exporter.ts`:

```typescript
public async exportHTML(editor: vscode.TextEditor, config: ExportConfig): Promise<void> {
  const fontResult = await prepareFonts(config, families => this.showFontEmbedDialog(families));
  if (!fontResult) return;

  const text = editor.document.getText();
  const shikiTheme = getTheme(config.themeId).shikiTheme;
  const { html } = this.engine.render(text, shikiTheme);
  const fileName = path.basename(editor.document.fileName, '.md');
  const cssFiles = this.readExportStyles();

  const htmlContent = buildExportHTML(html, fileName, config.themeId, fontResult, cssFiles);

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

- [ ] **Step 6: Remove the import of `getExportThemeColors` from `exporter.ts`**

The current import line in `exporter.ts`:
```typescript
import type { ExportConfig } from '../shared/export-config';
import { getExportThemeColors } from '../shared/export-config';
```

Replace with a single import (no `getExportThemeColors`):
```typescript
import type { ExportConfig } from '../shared/export-config';
```

- [ ] **Step 7: Update `extension.ts` — pass `extensionUri` to `Exporter`**

In `src/extension/extension.ts`, replace:
```typescript
const exporter = new Exporter(engine);
```
With:
```typescript
const exporter = new Exporter(engine, context.extensionUri);
```

- [ ] **Step 8: Run tests — verify exporter-config tests now pass**

```powershell
npm test -- exporter-config
```

Expected: all tests pass (the `does not contain old wrapper methods` test will still fail until Task 5 removes those methods — note this and continue).

- [ ] **Step 9: Run full test suite**

```powershell
npm test
```

Expected: existing tests pass. The `does not contain old wrapper methods` test fails — this is expected and will be fixed in Task 5.

- [ ] **Step 10: Commit**

```powershell
git add src/extension/exporter.ts src/extension/extension.ts tests/exporter-config.test.ts
git commit -m "feat: wire exportHTML to use CSS files via readExportStyles"
```

---

### Task 4: Fix `exportPDF()` — add config, use `buildExportHTML()` + print CSS

**Files:**
- Modify: `src/extension/exporter.ts`
- Modify: `src/extension/extension.ts`
- Modify: `tests/extension-export-config.test.ts`

- [ ] **Step 1: Update `extension-export-config.test.ts` to cover PDF config wiring**

Add one new test at the end of the describe block in `tests/extension-export-config.test.ts`:

```typescript
it('passes config into exporter.exportPDF and uses async handler', () => {
  expect(source).toContain('await exporter.exportPDF(editor, config)');
  expect(source).toMatch(/markdownWarrior\.exportPDF',[\s\S]*async \(\) =>/);
});
```

- [ ] **Step 2: Run the new test — verify it FAILS**

```powershell
npm test -- extension-export-config
```

Expected: the new test FAILS (`exportPDF` doesn't take `config` yet, handler isn't async).

- [ ] **Step 3: Replace `exportPDF()` method in `src/extension/exporter.ts`**

Replace the entire `exportPDF` method with:

```typescript
public async exportPDF(editor: vscode.TextEditor, config: ExportConfig): Promise<void> {
  const fontResult = await prepareFonts(config, families => this.showFontEmbedDialog(families));
  if (!fontResult) return;

  const text = editor.document.getText();
  const shikiTheme = getTheme(config.themeId).shikiTheme;
  const { html } = this.engine.render(text, shikiTheme);
  const fileName = path.basename(editor.document.fileName, '.md');
  const cssFiles = this.readExportStyles();

  const printCss = `@media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .markdown-body { max-width: none; padding: 1cm 2cm; }
    pre { white-space: pre-wrap; word-break: break-word; page-break-inside: avoid; }
    h1, h2, h3, h4 { page-break-after: avoid; }
    pre, blockquote, figure, table { page-break-inside: avoid; }
    img { max-width: 100%; }
    .task-checkbox { pointer-events: none; }
    a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 0.8em; }
  }`;

  const htmlContent = buildExportHTML(html, fileName, config.themeId, fontResult, cssFiles, printCss);

  const tempDir = path.join(path.dirname(editor.document.uri.fsPath), '.markdown-warrior-temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFile = path.join(tempDir, `${fileName}-print.html`);
  fs.writeFileSync(tempFile, htmlContent, 'utf-8');

  const uri = vscode.Uri.file(tempFile);
  await vscode.env.openExternal(uri);

  vscode.window.showInformationMessage(
    'HTML opened in browser. Use Ctrl+P / Cmd+P to print as PDF.',
    'OK'
  );

  setTimeout(() => {
    try {
      fs.unlinkSync(tempFile);
      fs.rmdirSync(tempDir);
    } catch {
      // Ignore cleanup errors
    }
  }, 30000);
}
```

- [ ] **Step 4: Update `exportPDF` command in `extension.ts` to pass config**

In `src/extension/extension.ts`, replace the `exportPDFCmd` registration:

```typescript
// Before:
const exportPDFCmd = vscode.commands.registerCommand(
  'markdownWarrior.exportPDF',
  () => {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'markdown') {
      exporter.exportPDF(editor);
    } else {
      vscode.window.showWarningMessage('Open a Markdown file first.');
    }
  }
);

// After:
const exportPDFCmd = vscode.commands.registerCommand(
  'markdownWarrior.exportPDF',
  async () => {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'markdown') {
      const config = previewProvider.getExportConfig();
      await exporter.exportPDF(editor, config);
    } else {
      vscode.window.showWarningMessage('Open a Markdown file first.');
    }
  }
);
```

- [ ] **Step 5: Run tests — verify they pass**

```powershell
npm test -- extension-export-config
```

Expected: all tests pass.

- [ ] **Step 6: Run full test suite**

```powershell
npm test
```

Expected: no new failures (the `does not contain old wrapper methods` test from Task 3 still fails — that's OK, fixed in Task 5).

- [ ] **Step 7: Commit**

```powershell
git add src/extension/exporter.ts src/extension/extension.ts tests/extension-export-config.test.ts
git commit -m "feat: fix exportPDF to use theme config and shared HTML builder"
```

---

### Task 5: Cleanup — remove `THEME_EXPORT_COLORS`, old wrapper methods, update tests

**Files:**
- Modify: `src/shared/export-config.ts`
- Modify: `src/extension/exporter.ts`
- Modify: `tests/export-config.test.ts`

- [ ] **Step 1: Rewrite `tests/export-config.test.ts` — remove THEME_EXPORT_COLORS tests**

Replace the entire file with:

```typescript
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EXPORT_CONFIG,
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

- [ ] **Step 2: Run updated export-config tests — verify they pass**

```powershell
npm test -- export-config
```

Expected: 3 tests pass (the old THEME_EXPORT_COLORS tests are gone, the remaining 3 still pass).

- [ ] **Step 3: Remove `THEME_EXPORT_COLORS`, `ThemeExportColors`, and `getExportThemeColors` from `src/shared/export-config.ts`**

Replace the entire file with:

```typescript
import { DEFAULT_THEME } from './theme-registry';

export interface ExportConfig {
  themeId: string;
  fontBody: string;
  fontHeading: string;
  fontCode: string;
}

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  themeId: DEFAULT_THEME,
  fontBody: 'system',
  fontHeading: 'inherit',
  fontCode: 'cascadia',
};

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

- [ ] **Step 4: Delete `wrapExportHTMLDocument` and `wrapInHTMLDocument` from `src/extension/exporter.ts`**

In `src/extension/exporter.ts`, delete the two private methods entirely:
- `private wrapExportHTMLDocument(...)` — the entire method block
- `private wrapInHTMLDocument(...)` — the entire method block

The `private escapeHtml` method should already be deleted (it was moved to module-level in Task 2). If it's still present in the class body, delete it now.

- [ ] **Step 5: Run full test suite — verify everything passes**

```powershell
npm test
```

Expected: all tests pass, including `does not contain old wrapper methods` from `exporter-config.test.ts`.

- [ ] **Step 6: Build to verify no TypeScript/esbuild errors**

```powershell
npm run build
```

Expected: no errors. `dist/export-styles/` has the three CSS files.

- [ ] **Step 7: Commit**

```powershell
git add src/shared/export-config.ts src/extension/exporter.ts tests/export-config.test.ts
git commit -m "refactor: remove THEME_EXPORT_COLORS and obsolete HTML wrapper methods"
```

---

## Final Checklist

After all tasks:

- [ ] `npm test` — all tests pass
- [ ] `npm run build` — no errors
- [ ] `dist/export-styles/markdown-body.css` exists and contains `.markdown-body`
- [ ] `dist/export-styles/themes.css` exists and contains `[data-theme="catppuccin-mocha"]`
- [ ] `dist/export-styles/extensions.css` exists and contains `.frontmatter-block`
- [ ] `src/shared/export-config.ts` does not contain `THEME_EXPORT_COLORS`
- [ ] `src/extension/exporter.ts` does not contain `wrapExportHTMLDocument` or `wrapInHTMLDocument`
- [ ] `src/extension/exporter.ts` does not contain `prefers-color-scheme`
- [ ] `src/extension/extension.ts` passes `context.extensionUri` to `new Exporter(...)`
- [ ] `src/extension/extension.ts` exportPDF command is `async` and calls `previewProvider.getExportConfig()`
