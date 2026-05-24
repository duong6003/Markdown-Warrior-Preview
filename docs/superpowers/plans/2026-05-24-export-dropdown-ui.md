# Export Dropdown UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "⬇ Export ▾" dropdown button to the preview toolbar so users can export HTML or PDF without opening the Command Palette.

**Architecture:** The webview sends `exportHTML` / `exportPDF` messages via the existing message bridge; `preview-provider.ts` receives them and calls the existing `Exporter` methods. The dropdown UI lives in `LayoutToolbar.svelte` and closes on option-select or click-outside using `<svelte:window>`.

**Tech Stack:** Svelte 5 (`$state`, `$props`), TypeScript, Vitest (source-text tests + Svelte compile), CSS custom properties (BEM classes in `layouts.css`)

---

## File Map

| File | Change |
|------|--------|
| `src/shared/messages.ts` | Add `exportHTML` and `exportPDF` to `WebviewToHostMessage` union |
| `src/webview/styles/layouts.css` | Add CSS for `.layout-toolbar__export` and `.layout-toolbar__export-dropdown` |
| `src/webview/components/LayoutToolbar.svelte` | Add dropdown button, internal `exportOpen` state, `onExportHTML`/`onExportPDF` props |
| `src/webview/App.svelte` | Pass `onExportHTML`/`onExportPDF` callbacks to LayoutToolbar; call `postMessage` |
| `src/extension/preview-provider.ts` | Handle `exportHTML` and `exportPDF` in `handleWebviewMessage` |
| `tests/messages-export.test.ts` | New — verify new message types exist in `messages.ts` |
| `tests/layout-toolbar-export.test.ts` | New — verify dropdown markup, props, compile |
| `tests/app-export.test.ts` | New — verify App.svelte wires postMessage for both export types |
| `tests/preview-provider-export.test.ts` | New — verify preview-provider handles both message types |

---

## Task 1: Add export message types

**Files:**
- Modify: `src/shared/messages.ts`
- Create: `tests/messages-export.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/messages-export.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/shared/messages.ts', 'utf8');

describe('WebviewToHostMessage export types', () => {
  it('declares exportHTML message type', () => {
    expect(source).toContain("type: 'exportHTML'");
  });

  it('declares exportPDF message type', () => {
    expect(source).toContain("type: 'exportPDF'");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/messages-export.test.ts
```

Expected: FAIL — `type: 'exportHTML'` not found in source.

- [ ] **Step 3: Add the two new message types to `src/shared/messages.ts`**

In the `WebviewToHostMessage` union, add two new variants after `{ type: 'ready' }`:

```ts
// Messages from Webview → Extension Host
export type WebviewToHostMessage =
  | { type: 'openExternal'; url: string }
  | { type: 'openFile'; path: string }
  | { type: 'scrollSync'; line: number }
  | { type: 'checkboxToggle'; line: number; checked: boolean }
  | { type: 'setTheme'; themeId: string }
  | { type: 'setFont'; slot: 'body' | 'heading' | 'code'; id: string }
  | { type: 'syncFonts'; fontBody: string; fontHeading: string; fontCode: string }
  | { type: 'exportHTML' }
  | { type: 'exportPDF' }
  | { type: 'ready' };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/messages-export.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/shared/messages.ts tests/messages-export.test.ts
git commit -m "feat: add exportHTML and exportPDF webview message types"
```

---

## Task 2: Add Export dropdown to LayoutToolbar

**Files:**
- Modify: `src/webview/components/LayoutToolbar.svelte`
- Modify: `src/webview/styles/layouts.css`
- Create: `tests/layout-toolbar-export.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/layout-toolbar-export.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/webview/components/LayoutToolbar.svelte', 'utf8');

describe('LayoutToolbar export dropdown', () => {
  it('compiles without errors', () => {
    let result: ReturnType<typeof compile>;
    expect(() => {
      result = compile(source, { filename: 'LayoutToolbar.svelte', generate: 'client' });
    }).not.toThrow();
    const errors = result!.warnings.filter(w => !w.code?.startsWith('a11y'));
    expect(errors).toHaveLength(0);
  });

  it('declares onExportHTML and onExportPDF props', () => {
    expect(source).toContain('onExportHTML');
    expect(source).toContain('onExportPDF');
  });

  it('has an export toggle button', () => {
    expect(source).toContain('layout-toolbar__export-toggle');
  });

  it('has export dropdown items for HTML and PDF', () => {
    expect(source).toContain('Export as HTML');
    expect(source).toContain('Export as PDF');
  });

  it('uses exportOpen state to show/hide dropdown', () => {
    expect(source).toContain('exportOpen');
  });

  it('closes dropdown on window click outside', () => {
    expect(source).toContain('svelte:window');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/layout-toolbar-export.test.ts
```

Expected: FAIL — props and dropdown markup not found.

- [ ] **Step 3: Add CSS for the export dropdown to `src/webview/styles/layouts.css`**

Append at the end of the file (before any `@media` blocks if present, or at the very end):

```css
.layout-toolbar__export {
  position: relative;
  flex: 0 0 auto;
}

.layout-toolbar__export-toggle {
  all: unset;
  box-sizing: border-box;
  cursor: pointer;
  flex: 0 0 auto;
  min-height: var(--space-8);
  padding-inline: var(--space-3);
  border-radius: var(--radius-sm, 4px);
  font-size: var(--text-sm);
  color: var(--md-accent);
  white-space: nowrap;
}

.layout-toolbar__export-toggle:hover,
.layout-toolbar__export-toggle:focus-visible,
.layout-toolbar__export-toggle.active {
  background: color-mix(in srgb, var(--md-accent) 12%, transparent);
}

.layout-toolbar__export-toggle:focus-visible {
  outline: 1px solid var(--md-accent);
  outline-offset: -1px;
}

.layout-toolbar__export-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 160px;
  background: var(--md-bg-secondary);
  border: 1px solid var(--md-border);
  border-radius: var(--radius-sm, 4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  z-index: 100;
  padding: 4px;
}

.layout-toolbar__export-item {
  all: unset;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  box-sizing: border-box;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-sm, 3px);
  font-size: var(--text-sm, 0.8rem);
  color: var(--md-fg-primary);
  cursor: pointer;
  white-space: nowrap;
}

.layout-toolbar__export-item:hover,
.layout-toolbar__export-item:focus-visible {
  background: color-mix(in srgb, var(--md-accent) 10%, transparent);
  color: var(--md-accent);
}
```

- [ ] **Step 4: Update `src/webview/components/LayoutToolbar.svelte`**

Replace the entire file content with:

```svelte
<script lang="ts">
  import type { LayoutOverride, LayoutType } from '../types/layout';

  const labels: Record<LayoutType, string> = {
    article: 'Article',
    story: 'Story',
    dashboard: 'Dashboard',
  };

  const options: { value: LayoutOverride; label: string }[] = [
    { value: 'auto', label: 'Auto' },
    { value: 'article', label: 'Article' },
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
    onToggleThemePanel = () => {},
    onExportHTML = () => {},
    onExportPDF = () => {},
  }: {
    override?: LayoutOverride;
    detectedLayout: LayoutType;
    currentLayout: LayoutType;
    themePanelVisible?: boolean;
    onOverrideChange: (override: LayoutOverride) => void;
    onTogglePresentation: () => void;
    onToggleThemePanel?: () => void;
    onExportHTML?: () => void;
    onExportPDF?: () => void;
  } = $props();

  let exportOpen = $state(false);

  function handleWindowClick(e: MouseEvent) {
    if (exportOpen && !(e.target as Element).closest('.layout-toolbar__export')) {
      exportOpen = false;
    }
  }

  function selectExportHTML() {
    exportOpen = false;
    onExportHTML();
  }

  function selectExportPDF() {
    exportOpen = false;
    onExportPDF();
  }
</script>

<svelte:window onclick={handleWindowClick} />

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
    Themes
  </button>

  <button class="layout-toolbar__slides" type="button" onclick={onTogglePresentation} title="Presentation mode">
    ▶ Slides
  </button>

  <div class="layout-toolbar__export">
    <button
      class="layout-toolbar__export-toggle"
      class:active={exportOpen}
      type="button"
      aria-haspopup="true"
      aria-expanded={exportOpen}
      title="Export"
      onclick={() => { exportOpen = !exportOpen; }}
    >
      ⬇ Export ▾
    </button>

    {#if exportOpen}
      <div class="layout-toolbar__export-dropdown" role="menu">
        <button
          class="layout-toolbar__export-item"
          type="button"
          role="menuitem"
          onclick={selectExportHTML}
        >
          ⬇ Export as HTML
        </button>
        <button
          class="layout-toolbar__export-item"
          type="button"
          role="menuitem"
          onclick={selectExportPDF}
        >
          🖨 Export as PDF
        </button>
      </div>
    {/if}
  </div>
</nav>
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run tests/layout-toolbar-export.test.ts
```

Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add src/webview/components/LayoutToolbar.svelte src/webview/styles/layouts.css tests/layout-toolbar-export.test.ts
git commit -m "feat: add export dropdown to preview toolbar"
```

---

## Task 3: Wire App.svelte to postMessage on export

**Files:**
- Modify: `src/webview/App.svelte`
- Create: `tests/app-export.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/app-export.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/webview/App.svelte', 'utf8');

describe('App.svelte export messaging', () => {
  it('posts exportHTML message', () => {
    expect(source).toContain("postMessage({ type: 'exportHTML' })");
  });

  it('posts exportPDF message', () => {
    expect(source).toContain("postMessage({ type: 'exportPDF' })");
  });

  it('passes onExportHTML and onExportPDF to LayoutToolbar', () => {
    expect(source).toContain('onExportHTML');
    expect(source).toContain('onExportPDF');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/app-export.test.ts
```

Expected: FAIL — `postMessage({ type: 'exportHTML' })` not found.

- [ ] **Step 3: Update `src/webview/App.svelte`**

In the `<script>` block, add two export handler functions after `function toggleMode()`:

```ts
function handleExportHTML() {
  postMessage({ type: 'exportHTML' });
}

function handleExportPDF() {
  postMessage({ type: 'exportPDF' });
}
```

In the template, update the `<LayoutToolbar>` element to pass the new callbacks:

```svelte
<LayoutToolbar
  override={layoutOverride}
  detectedLayout={model.detectedLayout}
  currentLayout={selectedLayout}
  themePanelVisible={panelVisible}
  onOverrideChange={(v) => { layoutOverride = v; }}
  onTogglePresentation={toggleMode}
  onToggleThemePanel={() => { panelVisible = !panelVisible; }}
  onExportHTML={handleExportHTML}
  onExportPDF={handleExportPDF}
/>
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/app-export.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Run full test suite to catch regressions**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/webview/App.svelte tests/app-export.test.ts
git commit -m "feat: wire App.svelte export callbacks to postMessage"
```

---

## Task 4: Handle export messages in preview-provider

**Files:**
- Modify: `src/extension/preview-provider.ts`
- Create: `tests/preview-provider-export.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/preview-provider-export.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/extension/preview-provider.ts', 'utf8');

describe('PreviewProvider export message handling', () => {
  it('handles exportHTML webview message', () => {
    expect(source).toContain("case 'exportHTML'");
  });

  it('calls exporter.exportHTML with current editor and export config', () => {
    expect(source).toContain('this.exporter.exportHTML');
    expect(source).toContain('this.getExportConfig()');
  });

  it('handles exportPDF webview message', () => {
    expect(source).toContain("case 'exportPDF'");
  });

  it('calls exporter.exportPDF with current editor', () => {
    expect(source).toContain('this.exporter.exportPDF');
  });

  it('guards export calls with currentEditor check', () => {
    expect(source).toContain('this.currentEditor');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/preview-provider-export.test.ts
```

Expected: FAIL — `case 'exportHTML'` not found.

- [ ] **Step 3: Add `exporter` as a field in `PreviewProvider`**

In `src/extension/preview-provider.ts`, import `Exporter` and add it as a private field. Add the import at the top of the file:

```ts
import { Exporter } from './exporter';
```

Add the private field inside the class (after `private engine = new MarkdownEngine();`):

```ts
private exporter = new Exporter(this.engine);
```

- [ ] **Step 4: Add `exportHTML` and `exportPDF` cases to `handleWebviewMessage`**

In `handleWebviewMessage`, add two new cases inside the `switch` block, after the `syncFonts` case and before the closing `}`:

```ts
case 'exportHTML':
  if (this.currentEditor) {
    await this.exporter.exportHTML(this.currentEditor, this.getExportConfig());
  }
  break;
case 'exportPDF':
  if (this.currentEditor) {
    await this.exporter.exportPDF(this.currentEditor);
  }
  break;
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run tests/preview-provider-export.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 6: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/extension/preview-provider.ts tests/preview-provider-export.test.ts
git commit -m "feat: handle exportHTML and exportPDF messages in PreviewProvider"
```

---

## Task 5: Build and smoke test

**Files:** none (build + manual verification)

- [ ] **Step 1: Build the extension**

```bash
npm run build
```

Expected: exits 0, no errors in `dist/extension/extension.js` or `dist/webview/`.

- [ ] **Step 2: Open a markdown file in VSCode with the extension running**

Press `F5` (or use the Run Extension launch config) to open an Extension Development Host. Open any `.md` file and run "Markdown Warrior: Open Preview".

- [ ] **Step 3: Verify the Export button appears in the toolbar**

Confirm the toolbar shows: `[Auto: Article] … [Themes] [▶ Slides] [⬇ Export ▾]`

- [ ] **Step 4: Verify the dropdown opens and closes**

- Click "⬇ Export ▾" → dropdown shows "⬇ Export as HTML" and "🖨 Export as PDF"
- Click outside → dropdown closes
- Click "⬇ Export ▾" again → dropdown opens → click "⬇ Export as HTML" → save dialog appears → dropdown closed

- [ ] **Step 5: Commit (if any last-minute fixes were needed)**

```bash
git add -p
git commit -m "fix: <describe any fix>"
```
