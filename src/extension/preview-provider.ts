import * as vscode from 'vscode';
import * as path from 'path';
import type { HostToWebviewMessage, WebviewToHostMessage } from '../shared/messages';
import { MarkdownEngine } from './markdown-engine';
import { ScrollSync } from './scroll-sync';
import { AssetResolver } from './asset-resolver';
import { DEFAULT_THEME, getTheme } from '../shared/theme-registry';

const THEME_GLOBAL_STATE_KEY = 'markdownWarrior.selectedTheme';

export class PreviewProvider {
  private panel: vscode.WebviewPanel | undefined;
  private currentEditor: vscode.TextEditor | undefined;
  private engine = new MarkdownEngine();
  private scrollSync: ScrollSync | undefined;
  private disposables: vscode.Disposable[] = [];
  private selectedThemeId = DEFAULT_THEME;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly context: vscode.ExtensionContext
  ) {}

  public async initialize() {
    this.selectedThemeId = await this.readSelectedThemeId();
    await this.engine.initialize();
  }

  public togglePresentation() {
    if (this.panel) {
      this.panel.webview.postMessage({ type: 'togglePresentation' });
    }
  }

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

      // Setup scroll sync
      this.scrollSync = new ScrollSync((line) => {
        this.panel?.webview.postMessage({ type: 'scrollTo', line });
      });

      // Listen for editor scroll
      const scrollDisposable = vscode.window.onDidChangeTextEditorVisibleRanges((e) => {
        if (e.textEditor === this.currentEditor) {
          this.scrollSync?.onEditorScroll(e.textEditor);
        }
      });
      this.disposables.push(scrollDisposable);

      // Debounced content update on text change
      let updateTimeout: NodeJS.Timeout | null = null;
      const docChangeDisposable = vscode.workspace.onDidChangeTextDocument((e) => {
        if (this.currentEditor && e.document === this.currentEditor.document) {
          if (updateTimeout) clearTimeout(updateTimeout);
          updateTimeout = setTimeout(() => {
            if (this.currentEditor) this.updateContent(this.currentEditor);
          }, 200);
        }
      });
      this.disposables.push(docChangeDisposable);

      // Immediate update on save
      const saveDisposable = vscode.workspace.onDidSaveTextDocument((doc) => {
        if (this.currentEditor && doc === this.currentEditor.document) {
          if (updateTimeout) clearTimeout(updateTimeout);
          this.updateContent(this.currentEditor);
        }
      });
      this.disposables.push(saveDisposable);

      // Handle messages from webview
      this.panel.webview.onDidReceiveMessage(
        (message: WebviewToHostMessage) => {
          void this.handleWebviewMessage(message).catch((err) => {
            console.error('[MarkdownWarrior] webview message handling failed:', err);
          });
        },
        undefined,
        []
      );

      this.panel.onDidDispose(() => {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        this.scrollSync?.dispose();
        this.scrollSync = undefined;
        if (updateTimeout) clearTimeout(updateTimeout);
        this.panel = undefined;
        this.currentEditor = undefined;
      });

      this.panel.webview.html = this.getWebviewContent(this.panel.webview);
    }
  }

  private async handleWebviewMessage(message: WebviewToHostMessage) {
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
        if (this.currentEditor && this.scrollSync) {
          this.scrollSync.onWebviewScroll(message.line, this.currentEditor);
        }
        break;
      case 'checkboxToggle':
        this.toggleCheckbox(message.line, message.checked);
        break;
      case 'setTheme':
        await this.setTheme(message.themeId);
        break;
    }
  }

  private updateContent(editor: vscode.TextEditor) {
    if (!this.panel) return;
    const text = editor.document.getText();
    const selectedThemeId = this.selectedThemeId;
    const shikiTheme = getTheme(selectedThemeId).shikiTheme;
    const { html, sourceMap, frontmatter } = this.engine.render(text, shikiTheme);

    // Resolve local asset paths to webview URIs
    const resolver = new AssetResolver(this.panel.webview, editor.document.uri);
    const resolvedHtml = resolver.resolveAssets(html);

    const message = {
      type: 'update',
      html: resolvedHtml,
      sourceMap,
      frontmatter,
      themeId: selectedThemeId,
    } satisfies HostToWebviewMessage;

    this.panel.webview.postMessage(message);
  }

  private async readSelectedThemeId(): Promise<string> {
    const themeId = this.context.globalState.get<string>(THEME_GLOBAL_STATE_KEY, DEFAULT_THEME);
    try {
      getTheme(themeId);
      return themeId;
    } catch {
      await this.context.globalState.update(THEME_GLOBAL_STATE_KEY, DEFAULT_THEME);
      return DEFAULT_THEME;
    }
  }

  private async setTheme(themeId: string) {
    getTheme(themeId);
    this.selectedThemeId = themeId;
    if (this.currentEditor) {
      this.updateContent(this.currentEditor);
    }
    await this.context.globalState.update(THEME_GLOBAL_STATE_KEY, themeId);
  }

  /**
   * Toggle a checkbox in the markdown source file.
   */
  private async toggleCheckbox(line: number, checked: boolean) {
    if (!this.currentEditor) return;

    const doc = this.currentEditor.document;
    const lineText = doc.lineAt(line).text;

    // Replace [ ] with [x] or vice versa
    const newText = checked
      ? lineText.replace(/\[ \]/, '[x]')
      : lineText.replace(/\[x\]/i, '[ ]');

    if (newText !== lineText) {
      const edit = new vscode.WorkspaceEdit();
      edit.replace(
        doc.uri,
        new vscode.Range(line, 0, line, lineText.length),
        newText
      );
      await vscode.workspace.applyEdit(edit);
    }
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
      `style-src ${webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com`,
      `script-src 'nonce-${nonce}'`,
      `img-src ${webview.cspSource} https: data:`,
      `font-src ${webview.cspSource} https://fonts.gstatic.com`,
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
