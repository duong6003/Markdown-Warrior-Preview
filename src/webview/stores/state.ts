import { getState, setState } from '../lib/message-bridge';
import { LAYOUT_TYPES, type LayoutOverride } from '../types/layout';

export interface WebviewState {
  scrollPosition: number;
  collapsedHeadings: string[];
  tocVisible: boolean;
  mode: 'document' | 'presentation';
  layoutOverride: LayoutOverride;
  fontBody: string;
  fontHeading: string;
  fontCode: string;
}

const DEFAULT_STATE: WebviewState = {
  scrollPosition: 0,
  collapsedHeadings: [],
  tocVisible: true,
  mode: 'document',
  layoutOverride: 'auto',
  fontBody: 'system',
  fontHeading: 'inherit',
  fontCode: 'cascadia',
};

export function loadState(): WebviewState {
  const state = getState<Partial<WebviewState>>() || {};
  return {
    ...DEFAULT_STATE,
    ...state,
    layoutOverride: normalizeLayoutOverride(state.layoutOverride),
    mode: state.mode === 'presentation' ? 'presentation' : 'document',
    collapsedHeadings: Array.isArray(state.collapsedHeadings)
      ? state.collapsedHeadings.filter((item): item is string => typeof item === 'string')
      : [],
    tocVisible: typeof state.tocVisible === 'boolean' ? state.tocVisible : DEFAULT_STATE.tocVisible,
    scrollPosition: typeof state.scrollPosition === 'number' ? state.scrollPosition : 0,
    fontBody: typeof state.fontBody === 'string' ? state.fontBody : DEFAULT_STATE.fontBody,
    fontHeading: typeof state.fontHeading === 'string' ? state.fontHeading : DEFAULT_STATE.fontHeading,
    fontCode: typeof state.fontCode === 'string' ? state.fontCode : DEFAULT_STATE.fontCode,
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
