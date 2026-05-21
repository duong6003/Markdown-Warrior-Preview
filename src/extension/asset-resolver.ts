import * as vscode from 'vscode';
import * as path from 'path';

export class AssetResolver {
  constructor(
    private webview: vscode.Webview,
    private documentUri: vscode.Uri
  ) {}

  /**
   * Replace local image/asset paths in HTML with webview-safe URIs.
   */
  public resolveAssets(html: string): string {
    const docDir = path.dirname(this.documentUri.fsPath);

    // Replace src="..." for images
    html = html.replace(
      /(<img[^>]+src=")([^"]+)(")/gi,
      (match, prefix, src, suffix) => {
        const resolved = this.resolveUri(src, docDir);
        if (resolved) {
          return `${prefix}${resolved}${suffix}`;
        }
        return match;
      }
    );

    // Replace src="..." for video/audio
    html = html.replace(
      /(<(?:video|audio|source)[^>]+src=")([^"]+)(")/gi,
      (match, prefix, src, suffix) => {
        const resolved = this.resolveUri(src, docDir);
        if (resolved) {
          return `${prefix}${resolved}${suffix}`;
        }
        return match;
      }
    );

    return html;
  }

  private resolveUri(src: string, docDir: string): string | null {
    // Skip already-resolved URIs, data URIs, and remote URLs
    if (
      src.startsWith('https://') ||
      src.startsWith('http://') ||
      src.startsWith('data:') ||
      src.startsWith('vscode-webview-resource:')
    ) {
      return null;
    }

    // Resolve relative or absolute path
    const absolutePath = path.isAbsolute(src)
      ? src
      : path.resolve(docDir, src);

    try {
      const uri = this.webview.asWebviewUri(vscode.Uri.file(absolutePath));
      return uri.toString();
    } catch {
      return null;
    }
  }
}
