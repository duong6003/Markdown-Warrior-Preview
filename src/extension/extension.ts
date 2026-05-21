import * as vscode from 'vscode';
import { PreviewProvider } from './preview-provider';
import { Exporter } from './exporter';
import { MarkdownEngine } from './markdown-engine';

export async function activate(context: vscode.ExtensionContext) {
  const previewProvider = new PreviewProvider(context.extensionUri);
  await previewProvider.initialize();

  const engine = new MarkdownEngine();
  await engine.initialize();
  const exporter = new Exporter(engine);

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
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'markdown') {
        exporter.exportHTML(editor);
      } else {
        vscode.window.showWarningMessage('Open a Markdown file first.');
      }
    }
  );

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

  context.subscriptions.push(
    openPreviewCmd,
    togglePresentationCmd,
    exportHTMLCmd,
    exportPDFCmd
  );
}

export function deactivate() {}
