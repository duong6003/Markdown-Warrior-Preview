import * as vscode from 'vscode';
import { PreviewProvider } from './preview-provider';

export function activate(context: vscode.ExtensionContext) {
  const previewProvider = new PreviewProvider(context.extensionUri);

  const command = vscode.commands.registerCommand(
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

  context.subscriptions.push(command);
}

export function deactivate() {}
