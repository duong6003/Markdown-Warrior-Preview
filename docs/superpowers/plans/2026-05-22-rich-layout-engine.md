# Rich Layout Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automatic rich layout rendering with Magazine, Docs, Story, and Dashboard modes for MarkdownWarriorPreview.

**Architecture:** Keep markdown rendering in the extension host, then perform layout analysis and layout selection in the Svelte webview. A pure TypeScript layout engine turns rendered HTML plus frontmatter into a `DocumentModel`; `App.svelte` picks a layout and delegates rendering to focused layout components.

**Tech Stack:** TypeScript, Svelte 5, Vite, Vitest, markdown-it-rendered HTML, VS Code webview state.

---

## File structure

Create:
- `src/webview/types/layout.ts` — layout types, document model, detection signal interfaces.
- `src/webview/lib/layout-engine.ts` — pure HTML analysis, auto detection, frontmatter/toolbar selection logic.
- `src/webview/lib/layout-reveal.ts` — IntersectionObserver reveal helper for rich layout animations.
- `src/webview/components/LayoutToolbar.svelte` — layout switcher and presentation button.
- `src/webview/layouts/MagazineLayout.svelte` — editorial article layout.
- `src/webview/layouts/DocsLayout.svelte` — documentation app layout.
- `src/webview/layouts/StoryLayout.svelte` — scroll-snapped story layout.
- `src/webview/layouts/DashboardLayout.svelte` — grid/card dashboard layout.
- `src/webview/styles/layouts.css` — shared layout variables, reduced-motion rules, reveal primitives.
- `tests/layout-engine.test.ts` — detector and override tests.

Modify:
- `src/webview/App.svelte` — replace single document render with layout selector and components.
- `src/webview/stores/state.ts` — persist `layoutOverride`.
- `src/webview/main.ts` — import shared layout CSS.

Do not modify:
- `src/extension/exporter.ts` — exports stay on current document-mode rendering for V1.
- `src/webview/components/SlideView.svelte` — presentation mode remains separate.

---

### Task 1: Layout types and detector

**Files:**
- Create: `src/webview/types/layout.ts`
- Create: `src/webview/lib/layout-engine.ts`
- Test: `tests/layout-engine.test.ts`

- [ ] **Step 1: Write failing detector tests**

Create `tests/layout-engine.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createDocumentModel, resolveLayout } from '../src/webview/lib/layout-engine';

const articleHtml = `
<h1 id="beautiful-markdown" data-source-line="0">Beautiful Markdown</h1>
<p data-source-line="2">A long intro paragraph about writing better project notes and making them pleasant to read.</p>
<p data-source-line="4">Another paragraph with enough text to look like a normal article body.</p>
<img src="hero.png" alt="Hero" data-source-line="6">
<h2 id="section-one" data-source-line="8">Section One</h2>
<p data-source-line="10">More article content for the first section.</p>
`;

describe('layout engine', () => {
  it('falls back to magazine for article-like content', () => {
    const model = createDocumentModel(articleHtml, null);

    expect(model.detectedLayout).toBe('magazine');
    expect(model.title).toBe('Beautiful Markdown');
    expect(model.description).toContain('long intro paragraph');
    expect(model.sections.length).toBeGreaterThan(0);
  });

  it('detects story layout from repeated horizontal-rule sections', () => {
    const html = `
<h1 id="launch" data-source-line="0">Launch</h1>
<p data-source-line="2">A short hero.</p>
<hr data-source-line="4">
<h2 id="problem" data-source-line="5">Problem</h2>
<p data-source-line="6">Short section.</p>
<hr data-source-line="8">
<h2 id="solution" data-source-line="9">Solution</h2>
<p data-source-line="10">Short section.</p>
<hr data-source-line="12">
<h2 id="result" data-source-line="13">Result</h2>
<p data-source-line="14">Short section.</p>
`;

    const model = createDocumentModel(html, null);

    expect(model.detectedLayout).toBe('story');
    expect(model.signals.hrCount).toBe(3);
  });

  it('detects dashboard layout from tables, tasks, lists, and numbers', () => {
    const html = `
<h1 id="release-status" data-source-line="0">Release Status</h1>
<p data-source-line="2">Progress 75% with 12 checks complete.</p>
<ul data-source-line="4">
  <li><input type="checkbox" class="task-checkbox" data-line="4" checked> Build</li>
  <li><input type="checkbox" class="task-checkbox" data-line="5"> Publish</li>
  <li><input type="checkbox" class="task-checkbox" data-line="6"> Verify</li>
</ul>
<table data-source-line="8"><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody><tr><td>Tests</td><td>24</td></tr></tbody></table>
`;

    const model = createDocumentModel(html, null);

    expect(model.detectedLayout).toBe('dashboard');
    expect(model.stats.taskCount).toBe(3);
    expect(model.stats.completedTaskCount).toBe(1);
  });

  it('detects docs layout from deep headings and code blocks', () => {
    const html = `
<h1 id="api-guide" data-source-line="0">API Guide</h1>
<h2 id="install" data-source-line="2">Install</h2>
<pre data-source-line="4"><code>npm install package</code></pre>
<h2 id="usage" data-source-line="8">Usage</h2>
<h3 id="options" data-source-line="10">Options</h3>
<ul data-source-line="12"><li>One</li><li>Two</li></ul>
<h3 id="examples" data-source-line="15">Examples</h3>
<pre data-source-line="17"><code>const x = 1;</code></pre>
`;

    const model = createDocumentModel(html, null);

    expect(model.detectedLayout).toBe('docs');
    expect(model.signals.codeBlockCount).toBe(2);
    expect(model.signals.h3PlusCount).toBe(2);
  });

  it('uses valid frontmatter layout before auto detection', () => {
    const model = createDocumentModel(articleHtml, { layout: 'docs' });

    expect(model.detectedLayout).toBe('magazine');
    expect(resolveLayout(model.detectedLayout, { layout: 'docs' }, 'auto')).toBe('docs');
  });

  it('uses toolbar override when frontmatter has no valid layout', () => {
    const model = createDocumentModel(articleHtml, { layout: 'unknown' });

    expect(resolveLayout(model.detectedLayout, { layout: 'unknown' }, 'dashboard')).toBe('dashboard');
  });

  it('strips rendered frontmatter block from layout content', () => {
    const html = `
<div class="frontmatter-block" data-source-line="0">
  <div class="frontmatter-header">Frontmatter</div>
  <table class="frontmatter-table"><tr><td class="fm-key">layout</td><td class="fm-value">docs</td></tr></table>
</div>
<h1 id="content" data-source-line="3">Content</h1>
<p data-source-line="5">Body text.</p>
`;

    const model = createDocumentModel(html, { layout: 'docs' });

    expect(model.contentHtml).not.toContain('frontmatter-block');
    expect(model.contentHtml).toContain('<h1');
  });
});
```

- [ ] **Step 2: Run detector tests and verify failure**

Run:

```bash
npm run test -- tests/layout-engine.test.ts
```

Expected: FAIL because `src/webview/lib/layout-engine.ts` does not exist.

- [ ] **Step 3: Create webview type/lib directories if missing**

Run:

```powershell
if (-not (Test-Path "src\webview\types")) { New-Item -ItemType Directory "src\webview\types" }
if (-not (Test-Path "src\webview\layouts")) { New-Item -ItemType Directory "src\webview\layouts" }
```

Expected: directories exist.

- [ ] **Step 4: Create layout types**

Create `src/webview/types/layout.ts`:

```ts
export const LAYOUT_TYPES = ['magazine', 'docs', 'story', 'dashboard'] as const;

export type LayoutType = typeof LAYOUT_TYPES[number];
export type LayoutOverride = LayoutType | 'auto';

export interface DocumentStats {
  wordCount: number;
  headingCount: number;
  sectionCount: number;
  codeBlockCount: number;
  tableCount: number;
  taskCount: number;
  completedTaskCount: number;
  imageCount: number;
}

export interface LayoutSignals extends DocumentStats {
  h1Count: number;
  h2Count: number;
  h3PlusCount: number;
  paragraphCount: number;
  listCount: number;
  blockquoteCount: number;
  hrCount: number;
  numberCount: number;
  shortSectionCount: number;
}

export interface DocumentSection {
  id: string;
  title: string;
  level: number;
  html: string;
  sourceLine?: number;
  blockTypes: string[];
}

export interface DocumentModel {
  html: string;
  contentHtml: string;
  title: string;
  description: string;
  sections: DocumentSection[];
  stats: DocumentStats;
  signals: LayoutSignals;
  detectedLayout: LayoutType;
}
```

- [ ] **Step 5: Create layout engine**

Create `src/webview/lib/layout-engine.ts`:

```ts
import { LAYOUT_TYPES, type DocumentModel, type DocumentSection, type DocumentStats, type LayoutOverride, type LayoutSignals, type LayoutType } from '../types/layout';

const FRONTMATTER_BLOCK_RE = /\s*<div class="frontmatter-block"[\s\S]*?<table class="frontmatter-table">[\s\S]*?<\/table>\s*<\/div>\s*/i;
const LAYOUT_PRIORITY: LayoutType[] = ['story', 'dashboard', 'docs', 'magazine'];

export function createDocumentModel(html: string, frontmatter: Record<string, unknown> | null = null): DocumentModel {
  const contentHtml = stripFrontmatterBlock(html);
  const text = stripTags(contentHtml);
  const signals = createSignals(contentHtml, text);
  const sections = extractSections(contentHtml);
  const stats: DocumentStats = {
    wordCount: signals.wordCount,
    headingCount: signals.headingCount,
    sectionCount: sections.length,
    codeBlockCount: signals.codeBlockCount,
    tableCount: signals.tableCount,
    taskCount: signals.taskCount,
    completedTaskCount: countCompletedTasks(contentHtml),
    imageCount: signals.imageCount,
  };

  return {
    html,
    contentHtml,
    title: extractTitle(contentHtml, frontmatter),
    description: extractDescription(contentHtml, frontmatter),
    sections,
    stats,
    signals: { ...signals, sectionCount: sections.length },
    detectedLayout: detectLayout({ ...signals, sectionCount: sections.length }),
  };
}

export function resolveLayout(
  detectedLayout: LayoutType,
  frontmatter: Record<string, unknown> | null,
  override: LayoutOverride
): LayoutType {
  const frontmatterLayout = frontmatter?.layout;
  if (typeof frontmatterLayout === 'string' && isLayoutType(frontmatterLayout)) {
    return frontmatterLayout;
  }

  if (override !== 'auto') {
    return override;
  }

  return detectedLayout;
}

export function isLayoutType(value: string): value is LayoutType {
  return (LAYOUT_TYPES as readonly string[]).includes(value);
}

function stripFrontmatterBlock(html: string): string {
  return html.replace(FRONTMATTER_BLOCK_RE, '').trim();
}

function createSignals(html: string, text: string): LayoutSignals {
  const headingCount = countMatches(html, /<h[1-6]\b/gi);
  const paragraphCount = countMatches(html, /<p\b/gi);
  const h2Count = countMatches(html, /<h2\b/gi);
  const sectionCount = Math.max(1, h2Count || countMatches(html, /<hr\b/gi) + 1);

  const signals: LayoutSignals = {
    wordCount: countWords(text),
    headingCount,
    sectionCount,
    codeBlockCount: countMatches(html, /<pre\b/gi),
    tableCount: countMatches(html, /<table\b/gi),
    taskCount: countMatches(html, /class="task-checkbox"/gi),
    completedTaskCount: countCompletedTasks(html),
    imageCount: countMatches(html, /<img\b/gi),
    h1Count: countMatches(html, /<h1\b/gi),
    h2Count,
    h3PlusCount: countMatches(html, /<h[3-6]\b/gi),
    paragraphCount,
    listCount: countMatches(html, /<(ul|ol)\b/gi),
    blockquoteCount: countMatches(html, /<blockquote\b/gi),
    hrCount: countMatches(html, /<hr\b/gi),
    numberCount: countMatches(text, /\b\d+(?:[.,]\d+)?%?\b/g),
    shortSectionCount: countShortSections(html),
  };

  return signals;
}

function detectLayout(signals: LayoutSignals): LayoutType {
  const scores: Record<LayoutType, number> = {
    story: signals.hrCount * 5 + signals.shortSectionCount * 2 + (signals.sectionCount >= 4 ? 2 : 0),
    dashboard: signals.tableCount * 5 + signals.taskCount * 4 + signals.listCount * 2 + Math.min(signals.numberCount, 6),
    docs: signals.codeBlockCount * 4 + signals.h3PlusCount * 2 + signals.listCount + (signals.headingCount >= 5 ? 2 : 0),
    magazine: signals.paragraphCount + signals.imageCount * 2 + signals.blockquoteCount + 2,
  };

  let best: LayoutType = 'magazine';
  let bestScore = scores.magazine;

  for (const layout of LAYOUT_PRIORITY) {
    const score = scores[layout];
    if (score > bestScore || (score === bestScore && LAYOUT_PRIORITY.indexOf(layout) < LAYOUT_PRIORITY.indexOf(best))) {
      best = layout;
      bestScore = score;
    }
  }

  return best;
}

function extractSections(html: string): DocumentSection[] {
  const headingRe = /<h([1-3])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
  const headings = [...html.matchAll(headingRe)];

  if (headings.length === 0) {
    return [{
      id: 'document',
      title: 'Document',
      level: 1,
      html,
      blockTypes: extractBlockTypes(html),
    }];
  }

  return headings.map((match, index) => {
    const next = headings[index + 1];
    const start = match.index ?? 0;
    const end = next?.index ?? html.length;
    const sectionHtml = html.slice(start, end).trim();
    const attrs = match[2] ?? '';

    return {
      id: extractAttribute(attrs, 'id') || `section-${index + 1}`,
      title: stripTags(match[3]).trim() || `Section ${index + 1}`,
      level: Number(match[1]),
      html: sectionHtml,
      sourceLine: Number(extractAttribute(attrs, 'data-source-line')) || undefined,
      blockTypes: extractBlockTypes(sectionHtml),
    };
  });
}

function extractBlockTypes(html: string): string[] {
  const types = new Set<string>();
  if (/<h[1-6]\b/i.test(html)) types.add('heading');
  if (/<p\b/i.test(html)) types.add('paragraph');
  if (/<pre\b/i.test(html)) types.add('code');
  if (/<table\b/i.test(html)) types.add('table');
  if (/<blockquote\b/i.test(html)) types.add('quote');
  if (/<img\b/i.test(html)) types.add('image');
  if (/<(ul|ol)\b/i.test(html)) types.add('list');
  if (/class="task-checkbox"/i.test(html)) types.add('tasks');
  return [...types];
}

function extractTitle(html: string, frontmatter: Record<string, unknown> | null): string {
  if (typeof frontmatter?.title === 'string' && frontmatter.title.trim()) {
    return frontmatter.title.trim();
  }

  return extractFirstTagText(html, 'h1') || extractFirstTagText(html, 'h2') || 'Untitled document';
}

function extractDescription(html: string, frontmatter: Record<string, unknown> | null): string {
  if (typeof frontmatter?.description === 'string' && frontmatter.description.trim()) {
    return frontmatter.description.trim();
  }

  return extractFirstTagText(html, 'p').slice(0, 180);
}

function extractFirstTagText(html: string, tag: string): string {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? stripTags(match[1]).trim() : '';
}

function extractAttribute(attrs: string, name: string): string {
  const match = attrs.match(new RegExp(`${name}="([^"]*)"`, 'i'));
  return match?.[1] ?? '';
}

function countShortSections(html: string): number {
  const parts = html.split(/<hr\b[^>]*>|<h2\b[^>]*>/gi).filter(Boolean);
  return parts.filter(part => countWords(stripTags(part)) > 0 && countWords(stripTags(part)) <= 45).length;
}

function countCompletedTasks(html: string): number {
  return countMatches(html, /class="task-checkbox"[^>]*checked/gi);
}

function countWords(text: string): number {
  return (text.match(/[\p{L}\p{N}_-]+/gu) ?? []).length;
}

function countMatches(input: string, regex: RegExp): number {
  return input.match(regex)?.length ?? 0;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
```

- [ ] **Step 6: Run detector tests and verify pass**

Run:

```bash
npm run test -- tests/layout-engine.test.ts
```

Expected: PASS for 7 tests in `layout-engine.test.ts`.

- [ ] **Step 7: Run full tests**

Run:

```bash
npm run test
```

Expected: all existing tests plus layout engine tests pass.

- [ ] **Step 8: Commit detector**

```bash
git add tests/layout-engine.test.ts src/webview/types/layout.ts src/webview/lib/layout-engine.ts
git commit -m "feat: add rich layout detector"
```

---

### Task 2: Persist layout override and add toolbar

**Files:**
- Modify: `src/webview/stores/state.ts`
- Create: `src/webview/components/LayoutToolbar.svelte`

- [ ] **Step 1: Update persisted webview state**

Replace `src/webview/stores/state.ts` with:

```ts
import { getState, setState } from '../lib/message-bridge';
import { LAYOUT_TYPES, type LayoutOverride } from '../types/layout';

export interface WebviewState {
  scrollPosition: number;
  collapsedHeadings: string[];
  tocVisible: boolean;
  mode: 'document' | 'presentation';
  layoutOverride: LayoutOverride;
}

const DEFAULT_STATE: WebviewState = {
  scrollPosition: 0,
  collapsedHeadings: [],
  tocVisible: true,
  mode: 'document',
  layoutOverride: 'auto',
};

export function loadState(): WebviewState {
  const state = getState<Partial<WebviewState>>() || {};
  return {
    ...DEFAULT_STATE,
    ...state,
    layoutOverride: normalizeLayoutOverride(state.layoutOverride),
    mode: state.mode === 'presentation' ? 'presentation' : 'document',
    collapsedHeadings: Array.isArray(state.collapsedHeadings) ? state.collapsedHeadings : [],
    tocVisible: typeof state.tocVisible === 'boolean' ? state.tocVisible : DEFAULT_STATE.tocVisible,
    scrollPosition: typeof state.scrollPosition === 'number' ? state.scrollPosition : 0,
  };
}

export function saveState(state: Partial<WebviewState>) {
  const current = loadState();
  const updated = { ...current, ...state };
  setState(updated);
}

function normalizeLayoutOverride(value: unknown): LayoutOverride {
  if (value === 'auto') return 'auto';
  if (typeof value === 'string' && (LAYOUT_TYPES as readonly string[]).includes(value)) {
    return value as LayoutOverride;
  }
  return 'auto';
}
```

- [ ] **Step 2: Create layout toolbar component**

Create `src/webview/components/LayoutToolbar.svelte`:

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
    detectedLayout = 'magazine',
    currentLayout = 'magazine',
    onOverrideChange,
    onTogglePresentation,
  }: {
    override: LayoutOverride;
    detectedLayout: LayoutType;
    currentLayout: LayoutType;
    onOverrideChange: (override: LayoutOverride) => void;
    onTogglePresentation: () => void;
  } = $props();
</script>

<nav class="layout-toolbar" aria-label="Preview layout controls">
  <div class="layout-toolbar__group" role="group" aria-label="Layout choices">
    {#each options as option (option.value)}
      <button
        class="layout-toolbar__pill"
        class:active={override === option.value}
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

  <button class="layout-toolbar__slides" type="button" onclick={onTogglePresentation} title="Presentation mode">
    ▶ Slides
  </button>
</nav>
```

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: FAIL or PASS depending on whether Svelte checks unused files during bundle. If it fails, only fix syntax errors in `LayoutToolbar.svelte` or `state.ts`.

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 5: Commit state and toolbar**

```bash
git add src/webview/stores/state.ts src/webview/components/LayoutToolbar.svelte
git commit -m "feat: add layout override state and toolbar"
```

---

### Task 3: Wire App.svelte to layout selection with minimal layout shells

**Files:**
- Create: `src/webview/layouts/MagazineLayout.svelte`
- Create: `src/webview/layouts/DocsLayout.svelte`
- Create: `src/webview/layouts/StoryLayout.svelte`
- Create: `src/webview/layouts/DashboardLayout.svelte`
- Modify: `src/webview/App.svelte`

- [ ] **Step 1: Create minimal Magazine layout shell**

Create `src/webview/layouts/MagazineLayout.svelte`:

```svelte
<script lang="ts">
  import type { DocumentModel } from '../types/layout';

  let { model }: { model: DocumentModel; showTOC: boolean } = $props();
</script>

<article class="magazine-layout markdown-body" data-layout="magazine">
  {@html model.contentHtml}
</article>
```

- [ ] **Step 2: Create minimal Docs layout shell**

Create `src/webview/layouts/DocsLayout.svelte`:

```svelte
<script lang="ts">
  import type { DocumentModel } from '../types/layout';

  let { model }: { model: DocumentModel; showTOC: boolean } = $props();
</script>

<article class="docs-layout markdown-body" data-layout="docs">
  {@html model.contentHtml}
</article>
```

- [ ] **Step 3: Create minimal Story layout shell**

Create `src/webview/layouts/StoryLayout.svelte`:

```svelte
<script lang="ts">
  import type { DocumentModel } from '../types/layout';

  let { model }: { model: DocumentModel; showTOC: boolean } = $props();
</script>

<article class="story-layout markdown-body" data-layout="story">
  {@html model.contentHtml}
</article>
```

- [ ] **Step 4: Create minimal Dashboard layout shell**

Create `src/webview/layouts/DashboardLayout.svelte`:

```svelte
<script lang="ts">
  import type { DocumentModel } from '../types/layout';

  let { model }: { model: DocumentModel; showTOC: boolean } = $props();
</script>

<article class="dashboard-layout markdown-body" data-layout="dashboard">
  {@html model.contentHtml}
</article>
```

- [ ] **Step 5: Replace App.svelte with layout selection coordinator**

Replace `src/webview/App.svelte` with:

```svelte
<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { onMessage, postMessage } from './lib/message-bridge';
  import { scrollToLine, setupScrollReporter } from './lib/source-map';
  import { renderMermaidBlocks } from './lib/mermaid-renderer';
  import { setupCheckboxHandler } from './lib/checkbox-handler';
  import { setupCollapsibleHeadings, restoreCollapsedState } from './lib/collapsible-headings';
  import { createDocumentModel, resolveLayout } from './lib/layout-engine';
  import { loadState, saveState } from './stores/state';
  import type { LayoutOverride } from './types/layout';
  import LayoutToolbar from './components/LayoutToolbar.svelte';
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
  let model = $derived(createDocumentModel(html, frontmatter));
  let selectedLayout = $derived(resolveLayout(model.detectedLayout, frontmatter, layoutOverride));

  $effect(() => {
    saveState({ tocVisible: showTOC, mode, layoutOverride });
  });

  $effect(() => {
    if (html && mode === 'document') {
      selectedLayout;
      tick().then(() => {
        renderMermaidBlocks();
        restoreCollapsedState();
      });
    }
  });

  onMessage((message) => {
    switch (message.type) {
      case 'update':
        html = message.html;
        frontmatter = message.frontmatter;
        break;
      case 'scrollTo':
        if (mode === 'document') {
          scrollToLine(message.line);
        }
        break;
      case 'configChanged':
        showTOC = message.config.showTOC;
        break;
      case 'themeChanged':
        break;
      case 'togglePresentation':
        toggleMode();
        break;
    }
  });

  function toggleMode() {
    mode = mode === 'document' ? 'presentation' : 'document';
  }

  function setLayoutOverride(next: LayoutOverride) {
    layoutOverride = next;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && mode === 'presentation') {
      e.preventDefault();
      mode = 'document';
    }
  }

  onMount(() => {
    setupScrollReporter();
    setupCheckboxHandler();
    setupCollapsibleHeadings();

    const main = document.querySelector('main');
    if (main && initialState.scrollPosition > 0) {
      requestAnimationFrame(() => {
        main.scrollTop = initialState.scrollPosition;
      });
    }

    let saveTimeout: number;
    main?.addEventListener('scroll', () => {
      clearTimeout(saveTimeout);
      saveTimeout = window.setTimeout(() => {
        if (main) {
          saveState({ scrollPosition: main.scrollTop });
        }
      }, 500);
    });
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
      onOverrideChange={setLayoutOverride}
      onTogglePresentation={toggleMode}
    />

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
  </div>
{/if}

<style>
  .preview-root {
    min-height: 100vh;
    background: var(--md-bg-primary);
  }

  .layout-scroll-root {
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

- [ ] **Step 6: Run build**

Run:

```bash
npm run build
```

Expected: PASS. If Svelte reports an unused prop in minimal layout shells, destructure `showTOC` and render a `data-toc-visible={showTOC}` attribute on the root element.

- [ ] **Step 7: Run tests**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 8: Commit App integration**

```bash
git add src/webview/App.svelte src/webview/layouts/MagazineLayout.svelte src/webview/layouts/DocsLayout.svelte src/webview/layouts/StoryLayout.svelte src/webview/layouts/DashboardLayout.svelte
git commit -m "feat: route preview through rich layouts"
```

---

### Task 4: Shared layout CSS and reveal helper

**Files:**
- Create: `src/webview/styles/layouts.css`
- Create: `src/webview/lib/layout-reveal.ts`
- Modify: `src/webview/main.ts`
- Modify: `src/webview/App.svelte`

- [ ] **Step 1: Create shared layout CSS**

Create `src/webview/styles/layouts.css`:

```css
:root {
  --layout-page-max: 1120px;
  --layout-wide-max: 1280px;
  --layout-gap: 1.25rem;
  --layout-card-radius: 18px;
  --layout-card-border: 1px solid color-mix(in srgb, var(--md-border), transparent 12%);
  --layout-card-bg: color-mix(in srgb, var(--md-bg-secondary), transparent 10%);
  --layout-card-glow: 0 18px 50px rgba(0, 0, 0, 0.18);
}

.layout-toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.8rem;
  border-bottom: 1px solid var(--md-border);
  background: color-mix(in srgb, var(--md-bg-primary), transparent 8%);
  backdrop-filter: blur(18px);
}

.layout-toolbar__group {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
}

.layout-toolbar__pill,
.layout-toolbar__slides,
.layout-toolbar__status {
  border: 1px solid var(--md-border);
  border-radius: 999px;
  color: var(--md-fg-secondary);
  background: var(--md-bg-secondary);
  font-size: 0.74rem;
  line-height: 1;
  white-space: nowrap;
}

.layout-toolbar__pill,
.layout-toolbar__slides {
  cursor: pointer;
  padding: 0.45rem 0.75rem;
  transition: transform 0.2s ease, border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.layout-toolbar__pill:hover,
.layout-toolbar__slides:hover,
.layout-toolbar__pill.active {
  color: var(--md-accent);
  border-color: var(--md-accent);
  background: color-mix(in srgb, var(--md-accent), transparent 88%);
  transform: translateY(-1px);
}

.layout-toolbar__status {
  padding: 0.45rem 0.7rem;
  color: var(--md-fg-muted);
  font-family: var(--md-font-mono);
}

.rich-layout {
  max-width: var(--layout-page-max);
  margin: 0 auto;
  padding: 2rem;
}

.layout-card {
  background: var(--layout-card-bg);
  border: var(--layout-card-border);
  border-radius: var(--layout-card-radius);
  box-shadow: var(--md-shadow);
  transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
}

.layout-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--layout-card-glow);
  border-color: color-mix(in srgb, var(--md-accent), var(--md-border) 45%);
}

[data-reveal] {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.45s ease, transform 0.45s ease;
}

[data-reveal].is-visible {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }

  [data-reveal] {
    opacity: 1;
    transform: none;
  }

  .layout-card:hover,
  .layout-toolbar__pill:hover,
  .layout-toolbar__slides:hover,
  .layout-toolbar__pill.active {
    transform: none;
  }
}
```

- [ ] **Step 2: Import shared layout CSS**

Modify `src/webview/main.ts` so imports are:

```ts
import './styles/theme-bridge.css';
import './styles/markdown-body.css';
import './styles/animations.css';
import './styles/extensions.css';
import './styles/layouts.css';
import App from './App.svelte';
import { mount } from 'svelte';

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
```

- [ ] **Step 3: Create reveal helper**

Create `src/webview/lib/layout-reveal.ts`:

```ts
let revealObserver: IntersectionObserver | null = null;

export function setupLayoutReveal(root: ParentNode = document): void {
  revealObserver?.disconnect();
  revealObserver = null;

  const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (targets.length === 0) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof IntersectionObserver === 'undefined') {
    targets.forEach(target => target.classList.add('is-visible'));
    return;
  }

  revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver?.unobserve(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

  targets.forEach(target => revealObserver?.observe(target));
}
```

- [ ] **Step 4: Run reveal helper after layout updates**

In `src/webview/App.svelte`, add import:

```ts
import { setupLayoutReveal } from './lib/layout-reveal';
```

Then replace the document-mode `$effect` body with:

```ts
  $effect(() => {
    if (html && mode === 'document') {
      selectedLayout;
      tick().then(() => {
        renderMermaidBlocks();
        restoreCollapsedState();
        setupLayoutReveal();
      });
    }
  });
```

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 6: Run tests**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 7: Commit shared layout styles**

```bash
git add src/webview/main.ts src/webview/styles/layouts.css src/webview/lib/layout-reveal.ts src/webview/App.svelte
git commit -m "feat: add shared layout motion system"
```

---

### Task 5: Magazine layout

**Files:**
- Modify: `src/webview/layouts/MagazineLayout.svelte`

- [ ] **Step 1: Replace Magazine layout shell**

Replace `src/webview/layouts/MagazineLayout.svelte` with:

```svelte
<script lang="ts">
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC = true }: { model: DocumentModel; showTOC: boolean } = $props();

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<div class="magazine-layout rich-layout" data-layout="magazine">
  <header class="magazine-hero layout-card" data-reveal>
    <div class="magazine-kicker">Markdown Warrior</div>
    <h1>{model.title}</h1>
    {#if model.description}
      <p>{model.description}</p>
    {/if}
  </header>

  <div class="magazine-grid">
    <article class="magazine-content">
      {#each model.sections as section (section.id)}
        <section class="magazine-section layout-card markdown-body" id={section.id} data-reveal data-source-line={section.sourceLine}>
          {@html section.html}
        </section>
      {/each}
    </article>

    {#if showTOC && model.sections.length > 1}
      <aside class="magazine-rail" data-reveal>
        <div class="magazine-rail__title">Sections</div>
        {#each model.sections as section (section.id)}
          <button type="button" onclick={() => scrollToSection(section.id)}>
            {section.title}
          </button>
        {/each}
      </aside>
    {/if}
  </div>
</div>

<style>
  .magazine-layout {
    max-width: var(--layout-wide-max);
  }

  .magazine-hero {
    position: relative;
    overflow: hidden;
    padding: clamp(2rem, 5vw, 4.5rem);
    margin-bottom: 1.5rem;
    background:
      radial-gradient(circle at top left, color-mix(in srgb, var(--md-accent), transparent 70%), transparent 38%),
      linear-gradient(135deg, var(--md-bg-secondary), var(--md-bg-primary));
  }

  .magazine-kicker {
    margin-bottom: 0.8rem;
    color: var(--md-accent);
    font-family: var(--md-font-mono);
    font-size: 0.78rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .magazine-hero h1 {
    max-width: 850px;
    margin: 0;
    color: var(--md-fg-primary);
    font-size: clamp(2.4rem, 7vw, 5.4rem);
    line-height: 0.95;
    letter-spacing: -0.06em;
  }

  .magazine-hero p {
    max-width: 720px;
    margin: 1.25rem 0 0;
    color: var(--md-fg-secondary);
    font-size: clamp(1rem, 2vw, 1.3rem);
    line-height: 1.55;
  }

  .magazine-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 220px;
    gap: var(--layout-gap);
    align-items: start;
  }

  .magazine-content {
    display: grid;
    gap: 1.1rem;
  }

  .magazine-section {
    max-width: none;
    margin: 0;
    padding: clamp(1.2rem, 3vw, 2.2rem);
  }

  .magazine-section :global(h1),
  .magazine-section :global(h2) {
    border-bottom: none;
  }

  .magazine-section :global(blockquote) {
    border-left: none;
    border-radius: 14px;
    padding: 1rem 1.2rem;
    background: color-mix(in srgb, var(--md-accent), transparent 90%);
  }

  .magazine-section :global(img) {
    width: 100%;
    margin: 1.2rem 0;
    border-radius: 16px;
  }

  .magazine-rail {
    position: sticky;
    top: 4.25rem;
    display: grid;
    gap: 0.4rem;
    padding: 1rem;
    border-left: 1px solid var(--md-border);
  }

  .magazine-rail__title {
    margin-bottom: 0.3rem;
    color: var(--md-fg-muted);
    font-family: var(--md-font-mono);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .magazine-rail button {
    all: unset;
    cursor: pointer;
    padding: 0.35rem 0;
    color: var(--md-fg-secondary);
    font-size: 0.83rem;
    line-height: 1.35;
    transition: color 0.2s ease, transform 0.2s ease;
  }

  .magazine-rail button:hover {
    color: var(--md-accent);
    transform: translateX(3px);
  }

  @media (max-width: 900px) {
    .magazine-grid {
      grid-template-columns: 1fr;
    }

    .magazine-rail {
      position: static;
      grid-row: 1;
      border-left: none;
      border-bottom: 1px solid var(--md-border);
    }
  }
</style>
```

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Run tests**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 4: Commit Magazine layout**

```bash
git add src/webview/layouts/MagazineLayout.svelte
git commit -m "feat: add magazine preview layout"
```

---

### Task 6: Docs layout

**Files:**
- Modify: `src/webview/layouts/DocsLayout.svelte`

- [ ] **Step 1: Replace Docs layout shell**

Replace `src/webview/layouts/DocsLayout.svelte` with:

```svelte
<script lang="ts">
  import type { DocumentModel } from '../types/layout';

  let { model, showTOC = true }: { model: DocumentModel; showTOC: boolean } = $props();

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<div class="docs-layout" data-layout="docs">
  {#if showTOC && model.sections.length > 1}
    <aside class="docs-sidebar" data-reveal>
      <div class="docs-sidebar__eyebrow">Docs</div>
      <div class="docs-sidebar__title">{model.title}</div>
      <nav aria-label="Document sections">
        {#each model.sections as section (section.id)}
          <button class:deep={section.level > 2} type="button" onclick={() => scrollToSection(section.id)}>
            {section.title}
          </button>
        {/each}
      </nav>
    </aside>
  {/if}

  <article class="docs-content rich-layout">
    <header class="docs-header layout-card" data-reveal>
      <span>Documentation</span>
      <h1>{model.title}</h1>
      {#if model.description}
        <p>{model.description}</p>
      {/if}
    </header>

    <div class="docs-sections">
      {#each model.sections as section (section.id)}
        <section class="docs-section layout-card markdown-body" id={section.id} data-reveal data-source-line={section.sourceLine}>
          {@html section.html}
        </section>
      {/each}
    </div>
  </article>
</div>

<style>
  .docs-layout {
    display: grid;
    grid-template-columns: minmax(210px, 260px) minmax(0, 1fr);
    min-height: calc(100vh - 3.25rem);
  }

  .docs-sidebar {
    position: sticky;
    top: 3.25rem;
    align-self: start;
    height: calc(100vh - 3.25rem);
    overflow-y: auto;
    padding: 1.25rem 1rem;
    border-right: 1px solid var(--md-border);
    background: var(--md-bg-secondary);
  }

  .docs-sidebar__eyebrow {
    color: var(--md-accent);
    font-family: var(--md-font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .docs-sidebar__title {
    margin: 0.4rem 0 1rem;
    color: var(--md-fg-primary);
    font-weight: 700;
    line-height: 1.2;
  }

  .docs-sidebar nav {
    display: grid;
    gap: 0.2rem;
  }

  .docs-sidebar button {
    all: unset;
    cursor: pointer;
    border-radius: 8px;
    padding: 0.45rem 0.55rem;
    color: var(--md-fg-secondary);
    font-size: 0.84rem;
    line-height: 1.35;
    transition: background 0.2s ease, color 0.2s ease, padding-left 0.2s ease;
  }

  .docs-sidebar button.deep {
    padding-left: 1rem;
    font-size: 0.78rem;
  }

  .docs-sidebar button:hover {
    color: var(--md-accent);
    background: color-mix(in srgb, var(--md-accent), transparent 90%);
    padding-left: 0.85rem;
  }

  .docs-content {
    max-width: 980px;
  }

  .docs-header {
    padding: clamp(1.4rem, 4vw, 2.5rem);
    margin-bottom: 1rem;
    background: linear-gradient(135deg, var(--md-bg-secondary), color-mix(in srgb, var(--md-accent), transparent 92%));
  }

  .docs-header span {
    color: var(--md-accent);
    font-family: var(--md-font-mono);
    font-size: 0.74rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .docs-header h1 {
    margin: 0.55rem 0 0;
    font-size: clamp(2rem, 4vw, 3.4rem);
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .docs-header p {
    max-width: 720px;
    margin: 0.9rem 0 0;
    color: var(--md-fg-secondary);
    font-size: 1.05rem;
    line-height: 1.55;
  }

  .docs-sections {
    display: grid;
    gap: 0.9rem;
  }

  .docs-section {
    max-width: none;
    margin: 0;
    padding: 1.35rem 1.5rem;
  }

  .docs-section :global(h1),
  .docs-section :global(h2) {
    border-bottom: 1px solid var(--md-border);
  }

  .docs-section :global(blockquote) {
    border-left: 4px solid var(--md-accent);
    border-radius: 12px;
    background: color-mix(in srgb, var(--md-accent), transparent 92%);
  }

  .docs-section :global(pre) {
    border-radius: 14px;
  }

  @media (max-width: 860px) {
    .docs-layout {
      grid-template-columns: 1fr;
    }

    .docs-sidebar {
      position: static;
      height: auto;
      border-right: none;
      border-bottom: 1px solid var(--md-border);
    }
  }
</style>
```

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Run tests**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 4: Commit Docs layout**

```bash
git add src/webview/layouts/DocsLayout.svelte
git commit -m "feat: add docs preview layout"
```

---

### Task 7: Story layout

**Files:**
- Modify: `src/webview/layouts/StoryLayout.svelte`

- [ ] **Step 1: Replace Story layout shell**

Replace `src/webview/layouts/StoryLayout.svelte` with:

```svelte
<script lang="ts">
  import type { DocumentModel } from '../types/layout';

  let { model }: { model: DocumentModel; showTOC: boolean } = $props();

  function scrollToSection(id: string) {
    document.getElementById(`story-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<div class="story-layout" data-layout="story">
  <nav class="story-dots" aria-label="Story sections">
    {#each model.sections as section, index (section.id)}
      <button type="button" title={section.title} onclick={() => scrollToSection(section.id)}>
        <span>{index + 1}</span>
      </button>
    {/each}
  </nav>

  <div class="story-sections">
    {#each model.sections as section, index (section.id)}
      <section class="story-section" id={`story-${section.id}`} data-reveal data-source-line={section.sourceLine}>
        <div class="story-section__number">{String(index + 1).padStart(2, '0')}</div>
        <div class="story-section__content markdown-body layout-card">
          {@html section.html}
        </div>
      </section>
    {/each}
  </div>
</div>

<style>
  .story-layout {
    position: relative;
  }

  .story-sections {
    scroll-snap-type: y proximity;
  }

  .story-section {
    min-height: calc(100vh - 3.25rem);
    display: grid;
    grid-template-columns: minmax(56px, 0.15fr) minmax(0, 1fr);
    align-items: center;
    gap: clamp(1rem, 4vw, 3rem);
    max-width: var(--layout-wide-max);
    margin: 0 auto;
    padding: clamp(1.5rem, 5vw, 4rem);
    scroll-snap-align: start;
  }

  .story-section__number {
    color: color-mix(in srgb, var(--md-accent), transparent 35%);
    font-family: var(--md-font-mono);
    font-size: clamp(1.6rem, 6vw, 4.5rem);
    font-weight: 800;
    letter-spacing: -0.08em;
    writing-mode: vertical-rl;
  }

  .story-section__content {
    max-width: 920px;
    margin: 0;
    padding: clamp(1.5rem, 4vw, 3rem);
    background:
      radial-gradient(circle at top right, color-mix(in srgb, var(--md-accent), transparent 82%), transparent 36%),
      var(--layout-card-bg);
  }

  .story-section__content :global(h1),
  .story-section__content :global(h2) {
    border: none;
    font-size: clamp(2rem, 6vw, 4.2rem);
    line-height: 0.98;
    letter-spacing: -0.06em;
  }

  .story-section__content :global(p),
  .story-section__content :global(li) {
    font-size: clamp(1rem, 2vw, 1.24rem);
  }

  .story-section__content :global(hr) {
    display: none;
  }

  .story-dots {
    position: fixed;
    top: 50%;
    right: 1rem;
    z-index: 30;
    display: grid;
    gap: 0.45rem;
    transform: translateY(-50%);
  }

  .story-dots button {
    all: unset;
    cursor: pointer;
    width: 1.8rem;
    height: 1.8rem;
    display: grid;
    place-items: center;
    border: 1px solid var(--md-border);
    border-radius: 999px;
    background: var(--md-bg-secondary);
    color: var(--md-fg-muted);
    font-family: var(--md-font-mono);
    font-size: 0.68rem;
    transition: border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
  }

  .story-dots button:hover {
    color: var(--md-accent);
    border-color: var(--md-accent);
    transform: scale(1.08);
  }

  @media (max-width: 760px) {
    .story-section {
      grid-template-columns: 1fr;
      min-height: auto;
      padding-right: 3.5rem;
    }

    .story-section__number {
      writing-mode: initial;
    }
  }
</style>
```

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Run tests**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 4: Commit Story layout**

```bash
git add src/webview/layouts/StoryLayout.svelte
git commit -m "feat: add story preview layout"
```

---

### Task 8: Dashboard layout

**Files:**
- Modify: `src/webview/layouts/DashboardLayout.svelte`

- [ ] **Step 1: Replace Dashboard layout shell**

Replace `src/webview/layouts/DashboardLayout.svelte` with:

```svelte
<script lang="ts">
  import type { DocumentModel } from '../types/layout';

  let { model }: { model: DocumentModel; showTOC: boolean } = $props();
  let expanded = $state<Record<string, boolean>>({});

  let taskPercent = $derived(model.stats.taskCount === 0 ? 0 : Math.round((model.stats.completedTaskCount / model.stats.taskCount) * 100));

  function toggle(id: string) {
    expanded = { ...expanded, [id]: !expanded[id] };
  }
</script>

<div class="dashboard-layout rich-layout" data-layout="dashboard">
  <header class="dashboard-header layout-card" data-reveal>
    <div>
      <span>Dashboard</span>
      <h1>{model.title}</h1>
      {#if model.description}
        <p>{model.description}</p>
      {/if}
    </div>
  </header>

  <section class="dashboard-stats" aria-label="Document stats">
    <div class="stat-card layout-card" data-reveal>
      <span>Words</span>
      <strong>{model.stats.wordCount}</strong>
    </div>
    <div class="stat-card layout-card" data-reveal>
      <span>Sections</span>
      <strong>{model.stats.sectionCount}</strong>
    </div>
    <div class="stat-card layout-card" data-reveal>
      <span>Code</span>
      <strong>{model.stats.codeBlockCount}</strong>
    </div>
    <div class="stat-card layout-card" data-reveal>
      <span>Tasks</span>
      <strong>{model.stats.taskCount === 0 ? '—' : `${taskPercent}%`}</strong>
    </div>
  </section>

  <section class="dashboard-grid" aria-label="Dashboard sections">
    {#each model.sections as section (section.id)}
      <article class="dashboard-card layout-card" class:expanded={expanded[section.id]} data-reveal data-source-line={section.sourceLine}>
        <button type="button" class="dashboard-card__header" onclick={() => toggle(section.id)}>
          <span>{section.title}</span>
          <small>{section.blockTypes.join(' · ')}</small>
        </button>
        <div class="dashboard-card__body markdown-body">
          {@html section.html}
        </div>
      </article>
    {/each}
  </section>
</div>

<style>
  .dashboard-layout {
    max-width: var(--layout-wide-max);
  }

  .dashboard-header {
    padding: clamp(1.4rem, 4vw, 2.8rem);
    margin-bottom: 1rem;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--md-accent), transparent 86%), transparent),
      var(--layout-card-bg);
  }

  .dashboard-header span {
    color: var(--md-accent);
    font-family: var(--md-font-mono);
    font-size: 0.74rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .dashboard-header h1 {
    margin: 0.55rem 0 0;
    font-size: clamp(2.1rem, 5vw, 4rem);
    line-height: 0.98;
    letter-spacing: -0.05em;
  }

  .dashboard-header p {
    max-width: 740px;
    margin: 0.9rem 0 0;
    color: var(--md-fg-secondary);
    font-size: 1.05rem;
  }

  .dashboard-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--layout-gap);
    margin-bottom: 1rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-card span {
    color: var(--md-fg-muted);
    font-family: var(--md-font-mono);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .stat-card strong {
    display: block;
    margin-top: 0.35rem;
    color: var(--md-fg-primary);
    font-size: clamp(1.6rem, 4vw, 2.4rem);
    line-height: 1;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--layout-gap);
  }

  .dashboard-card {
    overflow: hidden;
  }

  .dashboard-card__header {
    all: unset;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
    padding: 1rem 1.1rem;
    border-bottom: 1px solid var(--md-border);
    background: color-mix(in srgb, var(--md-bg-tertiary), transparent 38%);
  }

  .dashboard-card__header span {
    color: var(--md-fg-primary);
    font-weight: 700;
  }

  .dashboard-card__header small {
    color: var(--md-fg-muted);
    font-family: var(--md-font-mono);
    font-size: 0.68rem;
    text-align: right;
  }

  .dashboard-card__body {
    max-width: none;
    max-height: 320px;
    margin: 0;
    overflow: hidden;
    padding: 1rem 1.1rem;
  }

  .dashboard-card.expanded .dashboard-card__body {
    max-height: none;
  }

  .dashboard-card__body :global(h1),
  .dashboard-card__body :global(h2),
  .dashboard-card__body :global(h3) {
    border: none;
    margin-top: 0.4rem;
  }

  .dashboard-card__body :global(table) {
    display: block;
    overflow-x: auto;
    border-radius: 12px;
  }

  .dashboard-card__body :global(pre) {
    border-radius: 12px;
  }

  @media (max-width: 900px) {
    .dashboard-stats,
    .dashboard-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
```

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Run tests**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 4: Commit Dashboard layout**

```bash
git add src/webview/layouts/DashboardLayout.svelte
git commit -m "feat: add dashboard preview layout"
```

---

### Task 9: Final compatibility checks and manual verification

**Files:**
- Modify only if build/manual checks reveal a concrete issue in files touched above.

- [ ] **Step 1: Run full build**

Run:

```bash
npm run build
```

Expected: PASS. Output should include extension bundle and webview build.

- [ ] **Step 2: Run full test suite**

Run:

```bash
npm run test
```

Expected: PASS for all tests.

- [ ] **Step 3: Launch extension host for manual UI verification**

Open project in VS Code and press `F5`, or run Extension Development Host from VS Code debug UI.

Create or open a markdown file with this sample content:

```markdown
---
layout: auto
title: Layout Demo
description: Demo for rich layouts.
---

# Layout Demo

This markdown should feel like a designed page.

## Overview

> Important note with callout styling.

- Item one
- Item two
- Item three

## Code

```ts
const hello = 'world';
console.log(hello);
```

## Status

- [x] Build
- [ ] Verify

| Metric | Value |
| --- | --- |
| Tests | 24 |
| Coverage | 80% |

---

## Story Section

Short section for story mode.
```

Run command: `Markdown Warrior: Open Preview`.

Expected:
- Preview opens.
- Toolbar shows `Auto: <layout>` and layout buttons.
- Clicking `Magazine`, `Docs`, `Story`, `Dashboard`, then `Auto` changes layout without editing markdown.
- `layout: auto` does not force a specific layout.
- Changing frontmatter to `layout: docs` forces Docs layout even if toolbar is set to another layout.
- Scroll sync still follows source lines in at least Magazine and Docs.
- Task checkbox click still updates markdown source.
- Mermaid and KaTeX still render if sample includes those blocks.

- [ ] **Step 4: Verify reduced motion behavior**

In browser/devtools or OS accessibility settings, enable reduced motion if available and reload preview.

Expected:
- Cards and reveal elements appear without translate/long animation.
- Layout remains readable.

- [ ] **Step 5: Verify presentation mode is unchanged**

Click `▶ Slides` in the toolbar.

Expected:
- Existing `SlideView.svelte` presentation appears.
- Arrow keys navigate slides.
- Escape exits presentation back to rich document layout.

- [ ] **Step 6: Inspect git diff**

Run:

```bash
git status --short
git diff
```

Expected:
- Only files from this plan are modified.
- Existing untracked `docs/SESSION-SUMMARY.md` remains uncommitted unless user explicitly asks.

- [ ] **Step 7: Final commit**

If Step 6 shows only intended changes:

```bash
git add src/webview/App.svelte src/webview/main.ts src/webview/stores/state.ts src/webview/types/layout.ts src/webview/lib/layout-engine.ts src/webview/lib/layout-reveal.ts src/webview/components/LayoutToolbar.svelte src/webview/layouts/MagazineLayout.svelte src/webview/layouts/DocsLayout.svelte src/webview/layouts/StoryLayout.svelte src/webview/layouts/DashboardLayout.svelte src/webview/styles/layouts.css tests/layout-engine.test.ts
git commit -m "test: verify rich layout engine integration"
```

Expected: commit created if verification fixes changed files. If there are no changes after earlier task commits, skip this commit.
