import type { HostToWebviewMessage, WebviewToHostMessage } from '../../shared/messages';

interface VsCodeApi {
  postMessage(message: WebviewToHostMessage): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

const vscode = acquireVsCodeApi();

export function postMessage(message: WebviewToHostMessage): void {
  vscode.postMessage(message);
}

export function onMessage(handler: (message: HostToWebviewMessage) => void): void {
  window.addEventListener('message', (event: MessageEvent) => {
    handler(event.data as HostToWebviewMessage);
  });
}

export function getState<T>(): T | undefined {
  return vscode.getState() as T | undefined;
}

export function setState<T>(state: T): void {
  vscode.setState(state);
}
