import MarkdownIt from 'markdown-it';
import type { SourceMapEntry } from '../shared/messages';
import { createHighlighter, type Highlighter } from 'shiki';
import katex from 'katex';
import matter from 'gray-matter';

export interface RenderResult {
  html: string;
  sourceMap: SourceMapEntry[];
  frontmatter: Record<string, unknown> | null;
}

export class MarkdownEngine {
  private md: MarkdownIt;
  private highlighter: Highlighter | null = null;

  constructor() {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str, lang) => {
        // Mermaid blocks are handled separately in webview
        if (lang === 'mermaid') {
          return `<div class="mermaid-block" data-mermaid="${this.escapeHtml(str)}">${this.escapeHtml(str)}</div>`;
        }

        if (this.highlighter && lang) {
          try {
            return this.highlighter.codeToHtml(str, {
              lang,
              theme: 'css-variables',
            });
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
      themes: ['css-variables'],
      langs: [
        'javascript', 'typescript', 'python', 'rust',
        'html', 'css', 'json', 'bash', 'markdown',
        'java', 'go', 'c', 'cpp', 'yaml', 'toml',
        'jsx', 'tsx', 'sql', 'shell', 'php', 'ruby',
        'swift', 'kotlin', 'dart', 'svelte', 'vue',
      ],
    });
  }

  public render(content: string): RenderResult {
    // Parse frontmatter
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

    // Prepend frontmatter display if present
    if (frontmatter) {
      html = this.renderFrontmatter(frontmatter) + html;
    }

    return { html, sourceMap, frontmatter };
  }

  private renderFrontmatter(data: Record<string, unknown>): string {
    const rows = Object.entries(data)
      .map(([key, value]) => {
        const val = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return `<tr><td class="fm-key">${this.escapeHtml(key)}</td><td class="fm-value">${this.escapeHtml(val)}</td></tr>`;
      })
      .join('');

    return `<div class="frontmatter-block" data-source-line="0">
      <div class="frontmatter-header">Frontmatter</div>
      <table class="frontmatter-table">${rows}</table>
    </div>`;
  }

  /**
   * KaTeX math rendering plugin.
   * Supports $inline$ and $$block$$ math.
   */
  private addKaTeXPlugin() {
    // Inline math: $...$
    this.md.inline.ruler.after('escape', 'math_inline', (state, silent) => {
      if (state.src[state.pos] !== '$') return false;
      if (state.src[state.pos + 1] === '$') return false; // skip block

      const start = state.pos + 1;
      let end = start;

      while (end < state.src.length) {
        if (state.src[end] === '$' && state.src[end - 1] !== '\\') break;
        end++;
      }

      if (end >= state.src.length) return false;

      if (!silent) {
        const token = state.push('math_inline', 'math', 0);
        token.content = state.src.slice(start, end);
        token.markup = '$';
      }

      state.pos = end + 1;
      return true;
    });

    this.md.renderer.rules['math_inline'] = (tokens, idx) => {
      try {
        return katex.renderToString(tokens[idx].content, {
          throwOnError: false,
          displayMode: false,
        });
      } catch {
        return `<code class="math-error">${this.escapeHtml(tokens[idx].content)}</code>`;
      }
    };

    // Block math: $$...$$
    this.md.block.ruler.after('fence', 'math_block', (state, startLine, endLine, silent) => {
      const startPos = state.bMarks[startLine] + state.tShift[startLine];
      const lineText = state.src.slice(startPos, state.eMarks[startLine]);

      if (!lineText.startsWith('$$')) return false;

      if (silent) return true;

      let nextLine = startLine + 1;
      while (nextLine < endLine) {
        const pos = state.bMarks[nextLine] + state.tShift[nextLine];
        const line = state.src.slice(pos, state.eMarks[nextLine]);
        if (line.trim() === '$$') break;
        nextLine++;
      }

      const content = state.src.slice(
        state.eMarks[startLine] + 1,
        state.bMarks[nextLine]
      ).trim();

      const token = state.push('math_block', 'div', 0);
      token.content = content;
      token.map = [startLine, nextLine + 1];
      token.markup = '$$';

      state.line = nextLine + 1;
      return true;
    });

    this.md.renderer.rules['math_block'] = (tokens, idx) => {
      try {
        const rendered = katex.renderToString(tokens[idx].content, {
          throwOnError: false,
          displayMode: true,
        });
        return `<div class="math-block" data-source-line="${tokens[idx].map?.[0] ?? ''}">${rendered}</div>`;
      } catch {
        return `<pre class="math-error">${this.escapeHtml(tokens[idx].content)}</pre>`;
      }
    };
  }

  /**
   * Interactive task list plugin.
   * Renders checkboxes with data-line attribute for click handling.
   */
  private addTaskListPlugin() {
    this.md.core.ruler.after('inline', 'task_list', (state) => {
      const tokens = state.tokens;

      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type !== 'inline') continue;

        const content = tokens[i].content;
        const match = content.match(/^\[([ xX])\]\s/);
        if (!match) continue;

        // Find parent list_item
        let listItemIdx = i - 1;
        while (listItemIdx >= 0 && tokens[listItemIdx].type !== 'list_item_open') {
          listItemIdx--;
        }

        if (listItemIdx >= 0) {
          const checked = match[1] !== ' ';
          const line = tokens[listItemIdx].map?.[0] ?? 0;

          tokens[i].content = content.slice(match[0].length);
          tokens[i].children = this.md.parseInline(tokens[i].content, state.env)[0]?.children || [];

          // Insert checkbox token
          const checkToken = new state.Token('task_checkbox', '', 0);
          checkToken.content = String(checked);
          checkToken.meta = { line, checked };
          tokens[i].children.unshift(checkToken);
        }
      }
    });

    this.md.renderer.rules['task_checkbox'] = (tokens, idx) => {
      const { line, checked } = tokens[idx].meta;
      const checkedAttr = checked ? ' checked' : '';
      return `<input type="checkbox" class="task-checkbox" data-line="${line}"${checkedAttr} />`;
    };
  }

  /**
   * Inject data-source-line attributes on block-level elements.
   */
  private addSourceMapPlugin() {
    const defaultRender = (
      tokens: MarkdownIt.Token[],
      idx: number,
      options: MarkdownIt.Options,
      env: { sourceMap?: SourceMapEntry[] },
      self: { renderToken: (tokens: MarkdownIt.Token[], idx: number, options: MarkdownIt.Options) => string }
    ) => {
      return self.renderToken(tokens, idx, options);
    };

    const blockTypes = [
      'paragraph_open', 'heading_open', 'blockquote_open',
      'bullet_list_open', 'ordered_list_open', 'table_open',
      'fence', 'code_block', 'hr',
    ];

    for (const type of blockTypes) {
      const original = this.md.renderer.rules[type] || defaultRender;
      this.md.renderer.rules[type] = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        if (token.map && token.map[0] !== null) {
          const line = token.map[0];
          token.attrSet('data-source-line', String(line));
          if (env.sourceMap) {
            env.sourceMap.push({ line, offset: 0 });
          }
        }
        return original(tokens, idx, options, env, self);
      };
    }
  }

  /**
   * Add id attributes to headings for TOC navigation.
   */
  private addHeadingIds() {
    const original = this.md.renderer.rules['heading_open'] ||
      ((tokens: MarkdownIt.Token[], idx: number, options: MarkdownIt.Options, _env: unknown, self: { renderToken: (tokens: MarkdownIt.Token[], idx: number, options: MarkdownIt.Options) => string }) => {
        return self.renderToken(tokens, idx, options);
      });

    this.md.renderer.rules['heading_open'] = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const inlineToken = tokens[idx + 1];
      if (inlineToken && inlineToken.type === 'inline' && inlineToken.content) {
        const id = inlineToken.content
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim();
        token.attrSet('id', id);
      }
      return original(tokens, idx, options, env, self);
    };
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
