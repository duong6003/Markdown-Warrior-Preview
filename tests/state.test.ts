import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockState: Record<string, unknown> = {};

vi.mock('../src/webview/lib/message-bridge', () => ({
  getState: <T>() => (Object.keys(mockState).length > 0 ? (mockState as T) : null),
  setState: (s: unknown) => Object.assign(mockState, s),
}));

const { loadState, saveState } = await import('../src/webview/stores/state');

describe('state — font fields', () => {
  beforeEach(() => {
    Object.keys(mockState).forEach(k => delete mockState[k]);
  });

  it('defaults fontBody to "system"', () => {
    expect(loadState().fontBody).toBe('system');
  });

  it('defaults fontHeading to "inherit"', () => {
    expect(loadState().fontHeading).toBe('inherit');
  });

  it('defaults fontCode to "cascadia"', () => {
    expect(loadState().fontCode).toBe('cascadia');
  });

  it('persists fontBody via saveState/loadState', () => {
    saveState({ fontBody: 'inter' });
    expect(loadState().fontBody).toBe('inter');
  });

  it('persists fontHeading via saveState/loadState', () => {
    saveState({ fontHeading: 'playfair' });
    expect(loadState().fontHeading).toBe('playfair');
  });

  it('persists fontCode via saveState/loadState', () => {
    saveState({ fontCode: 'fira' });
    expect(loadState().fontCode).toBe('fira');
  });
});
