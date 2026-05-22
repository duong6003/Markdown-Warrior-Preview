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
    expect(model.sections[0].sourceLine).toBe(0);
  });

  it('preserves content before the first section heading as an intro section', () => {
    const html = `
<p data-source-line="2">Lead text before any heading.</p>
<blockquote data-source-line="4">Important framing quote.</blockquote>
<h1 id="article-title" data-source-line="8">Article Title</h1>
<p data-source-line="10">Article body.</p>
`;

    const model = createDocumentModel(html, null);

    expect(model.sections[0]).toMatchObject({
      id: 'document-intro',
      title: 'Introduction',
      level: 1,
      sourceLine: 2,
    });
    expect(model.sections[0].html).toContain('Lead text before any heading.');
    expect(model.sections[0].html).toContain('Important framing quote.');
    expect(model.sections[0].blockTypes).toEqual(['paragraph', 'quote']);
    expect(model.sections[1].id).toBe('article-title');
  });

  it('does not add an intro section when pre-heading content is empty whitespace', () => {
    const html = `

<h1 id="article-title" data-source-line="8">Article Title</h1>
<p data-source-line="10">Article body.</p>
`;

    const model = createDocumentModel(html, null);

    expect(model.sections[0].id).toBe('article-title');
    expect(model.sections).toHaveLength(1);
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
