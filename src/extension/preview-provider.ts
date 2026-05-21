import * as vscode from 'vscode';
import * as path from 'path';
import type { WebviewToHostMessage } from '../shared/messages';
import { MarkdownEngine } from './markdown-engine';

export class PreviewProvider {
  private panel: vscode.WebviewPanel | undefined;
  private currentEditor: vscode.TextEditor | undefined;
  private engine = new MarkdownEngine();

  constructor(private readonly extensionUri: vscode.Uri) {}

  public show(editor: vscode.TextEditor) {
    this.currentEditor = editor;
    const column = vscode.ViewColumn.Beside;

    if (this.panel) {
      this.panel.reveal(column);
      this.updateContent(editor);
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'markdownWarriorPreview',
        'Markdown Warrior Preview',
        column,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview'),
            vscode.Uri.file(path.dirname(editor.document.uri.fsPath)),
            ...(vscode.workspace.workspaceFolders?.map(f => f.uri) || []),
          ],
        }
      );

      // Handle messages from webview
      this.panel.webview.onDidReceiveMessage(
        (message: WebviewToHostMessage) => {
          this.handleWebviewMessage(message);
        },
        undefined,
        []
      );

      this.panel.onDidDispose(() => {
        this.panel = undefined;
        this.currentEditor = undefined;
      });

      this.panel.webview.html = this.getWebviewContent(this.panel.webview);
    }
  }

  private handleWebviewMessage(message: WebviewToHostMessage) {
    switch (message.type) {
      case 'ready':
        if (this.currentEditor) {
          this.updateContent(this.currentEditor);
        }
        break;
      case 'openExternal':
        if (message.url.startsWith('https://') || message.url.startsWith('http://')) {
          vscode.env.openExternal(vscode.Uri.parse(message.url));
        }
        break;
      case 'openFile': {
        const uri = vscode.Uri.file(message.path);
        vscode.workspace.openTextDocument(uri).then(doc => {
          vscode.window.showTextDocument(doc);
        });
        break;
      }
      case 'scrollSync':
        // Will be implemented in Phase v0.1
        break;
      case 'checkboxToggle':
        // Will be implemented in Phase v0.2
        break;
    }
  }

  private updateContent(editor: vscode.TextEditor) {
    if (!this.panel) return;
    const text = editor.document.getText();
    const { html, sourceMap } = this.engine.render(text);
    this.panel.webview.postMessage({
      type: 'update',
      html,
      sourceMap,
    });
  }

  private getWebviewContent(webview: vscode.Webview): string {
    const distPath = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview');

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(distPath, 'assets', 'main.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(distPath, 'assets', 'main.css')
    );

    const nonce = getNonce();

    const csp = [
      `default-src 'none'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${nonce}'`,
      `img-src ${webview.cspSource} https: data:`,
      `font-src ${webview.cspSource}`,
    ].join('; ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <link rel="stylesheet" href="${styleUri}" />
  <title>Markdown Warrior Preview</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
