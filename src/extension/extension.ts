import * as vscode from 'vscode';
import { PreviewProvider } from './preview-provider';

export async function activate(context: vscode.ExtensionContext) {
  const previewProvider = new PreviewProvider(context.extensionUri);
  await previewProvider.initialize();

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

  context.subscriptions.push(openPreviewCmd, togglePresentationCmd);
}

export function deactivate() {}
