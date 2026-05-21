import * as vscode from 'vscode';

export class ScrollSync {
  private ignoreNextScroll = false;
  private ignoreTimeout: NodeJS.Timeout | null = null;

  constructor(
    private sendScrollToWebview: (line: number) => void
  ) {}

  /** Called when editor visible ranges change (user scrolls editor) */
  public onEditorScroll(editor: vscode.TextEditor) {
    if (this.ignoreNextScroll) return;

    const topLine = editor.visibleRanges[0]?.start.line ?? 0;
    this.sendScrollToWebview(topLine);
  }

  /** Called when webview reports its scroll position */
  public onWebviewScroll(line: number, editor: vscode.TextEditor) {
    this.suppressEditorScroll();

    const range = new vscode.Range(line, 0, line, 0);
    editor.revealRange(range, vscode.TextEditorRevealType.AtTop);
  }

  private suppressEditorScroll() {
    this.ignoreNextScroll = true;
    if (this.ignoreTimeout) clearTimeout(this.ignoreTimeout);
    this.ignoreTimeout = setTimeout(() => {
      this.ignoreNextScroll = false;
    }, 80);
  }

  public dispose() {
    if (this.ignoreTimeout) clearTimeout(this.ignoreTimeout);
  }
}
