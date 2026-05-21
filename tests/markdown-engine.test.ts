import { describe, it, expect, beforeAll } from 'vitest';
import { MarkdownEngine } from '../src/extension/markdown-engine';

describe('MarkdownEngine', () => {
  let engine: MarkdownEngine;

  beforeAll(async () => {
    engine = new MarkdownEngine();
    // Skip Shiki initialization in tests — it requires bundled themes
    // The engine works without it (falls back to plain code blocks)
  });

  describe('basic rendering', () => {
    it('renders headings with IDs', () => {
      const { html } = engine.render('# Hello World');
      expect(html).toContain('<h1');
      expect(html).toContain('id="hello-world"');
      expect(html).toContain('Hello World');
    });

    it('renders paragraphs', () => {
      const { html } = engine.render('This is a paragraph.');
      expect(html).toContain('<p');
      expect(html).toContain('This is a paragraph.');
    });

    it('renders links', () => {
      const { html } = engine.render('[Click](https://example.com)');
      expect(html).toContain('<a href="https://example.com"');
      expect(html).toContain('Click');
    });

    it('renders inline code', () => {
      const { html } = engine.render('Use `console.log`');
      expect(html).toContain('<code>console.log</code>');
    });

    it('renders blockquotes', () => {
      const { html } = engine.render('> This is a quote');
      expect(html).toContain('<blockquote');
      expect(html).toContain('This is a quote');
    });

    it('renders unordered lists', () => {
      const { html } = engine.render('- Item 1\n- Item 2');
      expect(html).toContain('<ul');
      expect(html).toContain('<li');
      expect(html).toContain('Item 1');
      expect(html).toContain('Item 2');
    });

    it('renders tables', () => {
      const md = '| A | B |\n|---|---|\n| 1 | 2 |';
      const { html } = engine.render(md);
      expect(html).toContain('<table');
      expect(html).toContain('<th');
      expect(html).toContain('<td');
    });
  });

  describe('source map', () => {
    it('generates source map entries for block elements', () => {
      const md = '# Title\n\nParagraph 1\n\nParagraph 2';
      const { sourceMap } = engine.render(md);
      expect(sourceMap.length).toBeGreaterThan(0);
      expect(sourceMap[0].line).toBe(0); // heading at line 0
    });

    it('adds data-source-line attributes', () => {
      const md = '# Title\n\nSome text';
      const { html } = engine.render(md);
      expect(html).toContain('data-source-line="0"');
      expect(html).toContain('data-source-line="2"');
    });
  });

  describe('KaTeX math', () => {
    it('renders inline math', () => {
      const { html } = engine.render('The formula $E = mc^2$ is famous.');
      expect(html).toContain('katex');
      expect(html).toContain('E');
    });

    it('renders block math', () => {
      const md = '$$\nx = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\n$$';
      const { html } = engine.render(md);
      expect(html).toContain('math-block');
      expect(html).toContain('katex');
    });

    it('handles invalid math gracefully', () => {
      const { html } = engine.render('$\\invalid{$');
      // Should not throw, should render something
      expect(html).toBeDefined();
    });
  });

  describe('frontmatter', () => {
    it('parses YAML frontmatter', () => {
      const md = '---\ntitle: Test\nauthor: Dev\n---\n\n# Content';
      const { html, frontmatter } = engine.render(md);
      expect(frontmatter).toEqual({ title: 'Test', author: 'Dev' });
      expect(html).toContain('frontmatter-block');
      expect(html).toContain('title');
      expect(html).toContain('Test');
    });

    it('returns null frontmatter when none present', () => {
      const { frontmatter } = engine.render('# Just a heading');
      expect(frontmatter).toBeNull();
    });
  });

  describe('mermaid blocks', () => {
    it('wraps mermaid code in mermaid-block div', () => {
      const md = '```mermaid\ngraph TD\n  A --> B\n```';
      const { html } = engine.render(md);
      expect(html).toContain('mermaid-block');
      expect(html).toContain('data-mermaid');
    });
  });

  describe('syntax highlighting', () => {
    it('renders code blocks (plain without Shiki in test env)', () => {
      const md = '```javascript\nconst x = 1;\n```';
      const { html } = engine.render(md);
      expect(html).toContain('const x = 1;');
    });

    it('handles unknown languages gracefully', () => {
      const md = '```unknownlang\nsome code\n```';
      const { html } = engine.render(md);
      expect(html).toContain('some code');
    });
  });

  describe('heading IDs', () => {
    it('generates slug IDs from heading text', () => {
      const { html } = engine.render('## My Cool Feature');
      expect(html).toContain('id="my-cool-feature"');
    });

    it('handles special characters in headings', () => {
      const { html } = engine.render('## Hello & World!');
      expect(html).toContain('id="hello-world"');
    });
  });
});
