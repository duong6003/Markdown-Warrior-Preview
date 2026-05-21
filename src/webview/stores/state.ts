import { getState, setState } from '../lib/message-bridge';

export interface WebviewState {
  scrollPosition: number;
  collapsedHeadings: string[];
  tocVisible: boolean;
  mode: 'document' | 'presentation';
}

const DEFAULT_STATE: WebviewState = {
  scrollPosition: 0,
  collapsedHeadings: [],
  tocVisible: true,
  mode: 'document',
};

export function loadState(): WebviewState {
  return getState<WebviewState>() || { ...DEFAULT_STATE };
}

export function saveState(state: Partial<WebviewState>) {
  const current = loadState();
  const updated = { ...current, ...state };
  setState(updated);
}
