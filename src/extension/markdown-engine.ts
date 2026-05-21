import MarkdownIt from 'markdown-it';
import type { SourceMapEntry } from '../shared/messages';
import { createHighlighter, type Highlighter } from 'shiki';

export class MarkdownEngine {
  private md: MarkdownIt;
  private highlighter: Highlighter | null = null;

  constructor() {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str, lang) => {
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

  public render(content: string): { html: string; sourceMap: SourceMapEntry[] } {
    const sourceMap: SourceMapEntry[] = [];
    const env = { sourceMap };
    const html = this.md.render(content, env);
    return { html, sourceMap };
  }

  /**
   * Inject data-source-line attributes on block-level elements
   * for scroll sync mapping.
   */
  private addSourceMapPlugin() {
    // Override paragraph_open, heading_open, etc. to add data-source-line
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
      // Get heading text from next inline token
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
}
