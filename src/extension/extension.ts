import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand(
    'markdownWarrior.openPreview',
    () => {
      vscode.window.showInformationMessage('MarkdownWarriorPreview activated!');
    }
  );

  context.subscriptions.push(command);
}

export function deactivate() {}
