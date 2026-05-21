import { getState, setState } from '../lib/message-bridge';
import { LAYOUT_TYPES, type LayoutOverride } from '../types/layout';

export interface WebviewState {
  scrollPosition: number;
  collapsedHeadings: string[];
  tocVisible: boolean;
  mode: 'document' | 'presentation';
  layoutOverride: LayoutOverride;
}

const DEFAULT_STATE: WebviewState = {
  scrollPosition: 0,
  collapsedHeadings: [],
  tocVisible: true,
  mode: 'document',
  layoutOverride: 'auto',
};

export function loadState(): WebviewState {
  const state = getState<Partial<WebviewState>>() || {};
  return {
    ...DEFAULT_STATE,
    ...state,
    layoutOverride: normalizeLayoutOverride(state.layoutOverride),
    mode: state.mode === 'presentation' ? 'presentation' : 'document',
    collapsedHeadings: Array.isArray(state.collapsedHeadings) ? state.collapsedHeadings.filter((item): item is string => typeof item === 'string') : [],
    tocVisible: typeof state.tocVisible === 'boolean' ? state.tocVisible : DEFAULT_STATE.tocVisible,
    scrollPosition: typeof state.scrollPosition === 'number' ? state.scrollPosition : 0,
  };
}

export function saveState(state: Partial<WebviewState>) {
  const current = loadState();
  const updated = { ...current, ...state };
  setState(updated);
}

const LAYOUT_TYPE_SET = new Set<string>(LAYOUT_TYPES);

function normalizeLayoutOverride(value: unknown): LayoutOverride {
  if (value === 'auto') return 'auto';
  if (typeof value === 'string' && LAYOUT_TYPE_SET.has(value)) {
    return value as LayoutOverride;
  }
  return 'auto';
}
