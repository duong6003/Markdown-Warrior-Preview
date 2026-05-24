import * as vscode from 'vscode';
import { PreviewProvider } from './preview-provider';
import { Exporter } from './exporter';
import { MarkdownEngine } from './markdown-engine';

export async function activate(context: vscode.ExtensionContext) {
  const previewProvider = new PreviewProvider(context.extensionUri, context);
  try {
    await previewProvider.initialize();
  } catch (err) {
    console.error('[MarkdownWarrior] previewProvider.initialize failed:', err);
  }

  const engine = new MarkdownEngine();
  try {
    await engine.initialize();
  } catch (err) {
    console.error('[MarkdownWarrior] engine.initialize failed:', err);
  }
  const exporter = new Exporter(engine, context.extensionUri);

  const openPreviewCmd = vscode.commands.registerCommand(
    'markdownWarrior.openPreview',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'markdown') {
        previewProvider.show(editor);
      } else {
        vscode.window.showWarningMessage('Open a Markdown file first.');
      }
    }
  );

  const togglePresentationCmd = vscode.commands.registerCommand(
    'markdownWarrior.togglePresentation',
    () => {
      previewProvider.togglePresentation();
    }
  );

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

  context.subscriptions.push(
    openPreviewCmd,
    togglePresentationCmd,
    exportHTMLCmd,
    exportPDFCmd
  );
}

export function deactivate() {}
