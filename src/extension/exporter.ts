import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import type { ExportConfig } from '../shared/export-config';
import { getTheme } from '../shared/theme-registry';
import { MarkdownEngine } from './markdown-engine';
import { prepareFonts, type FontDialogChoice, type FontInlineResult } from './font-inliner';

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

export class Exporter {
  constructor(private engine: MarkdownEngine, private extensionUri: vscode.Uri) {}

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

  /**
   * Export markdown as PDF using print-to-PDF approach.
   * Opens HTML in external browser for printing.
   */
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
}
