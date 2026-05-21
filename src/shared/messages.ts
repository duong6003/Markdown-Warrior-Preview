// Messages from Extension Host → Webview
export type HostToWebviewMessage =
  | { type: 'update'; html: string; sourceMap: SourceMapEntry[]; frontmatter: Record<string, unknown> | null }
  | { type: 'scrollTo'; line: number }
  | { type: 'themeChanged' }
  | { type: 'configChanged'; config: PreviewConfig }
  | { type: 'togglePresentation' };

// Messages from Webview → Extension Host
export type WebviewToHostMessage =
  | { type: 'openExternal'; url: string }
  | { type: 'openFile'; path: string }
  | { type: 'scrollSync'; line: number }
  | { type: 'checkboxToggle'; line: number; checked: boolean }
  | { type: 'ready' };

export interface SourceMapEntry {
  line: number;
  offset: number;
}

export interface PreviewConfig {
  fontSize: number;
  lineHeight: number;
  scrollSync: boolean;
  showTOC: boolean;
}
