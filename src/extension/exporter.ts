import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import type { ExportConfig } from '../shared/export-config';
import { getExportThemeColors } from '../shared/export-config';
import { getTheme } from '../shared/theme-registry';
import { MarkdownEngine } from './markdown-engine';
import { prepareFonts, type FontDialogChoice, type FontInlineResult } from './font-inliner';

export class Exporter {
  constructor(private engine: MarkdownEngine) {}

  /**
   * Export markdown as standalone HTML file.
   */
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

  /**
   * Export markdown as PDF using print-to-PDF approach.
   * Opens HTML in external browser for printing.
   */
  public async exportPDF(editor: vscode.TextEditor): Promise<void> {
    const text = editor.document.getText();
    const { html } = this.engine.render(text);
    const fileName = path.basename(editor.document.fileName, '.md');

    const htmlContent = this.wrapInHTMLDocument(html, fileName, true);

    // Write temp HTML file and open in browser for print
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

    // Clean up temp file after a delay
    setTimeout(() => {
      try {
        fs.unlinkSync(tempFile);
        fs.rmdirSync(tempDir);
      } catch {
        // Ignore cleanup errors
      }
    }, 30000);
  }

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

  private wrapInHTMLDocument(bodyHtml: string, title: string, forPrint = false): string {
    const printStyles = forPrint ? `
    @media print {
      body { background: white; color: black; }
      .markdown-body { max-width: none; padding: 0; }
      pre { white-space: pre-wrap; word-wrap: break-word; }
      a { color: #0366d6; }
      img { max-width: 100%; page-break-inside: avoid; }
      h1, h2, h3, h4 { page-break-after: avoid; }
      pre, blockquote { page-break-inside: avoid; }
    }` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.escapeHtml(title)}</title>
  <style>
    :root {
      --md-bg-primary: #ffffff;
      --md-bg-secondary: #f6f8fa;
      --md-bg-tertiary: #eef1f5;
      --md-fg-primary: #24292f;
      --md-fg-secondary: #57606a;
      --md-fg-muted: #8b949e;
      --md-accent: #0969da;
      --md-accent-hover: #0550ae;
      --md-border: #d0d7de;
      --md-code-bg: #f6f8fa;
      --md-font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', sans-serif;
      --md-font-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      --md-font-size: 16px;
      --md-line-height: 1.6;
      --md-radius: 6px;
      --md-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --md-bg-primary: #0d1117;
        --md-bg-secondary: #161b22;
        --md-bg-tertiary: #21262d;
        --md-fg-primary: #c9d1d9;
        --md-fg-secondary: #8b949e;
        --md-fg-muted: #6e7681;
        --md-accent: #58a6ff;
        --md-accent-hover: #79c0ff;
        --md-border: #30363d;
        --md-code-bg: #161b22;
      }
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

    ${printStyles}
  </style>
</head>
<body>
  <div class="markdown-body">
    ${bodyHtml}
  </div>
</body>
</html>`;
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
