import { balancedCardBodyId, balancedCardToggleLabel } from '../src/webview/lib/balanced-card';

describe('balanced-card helpers', () => {
  it('creates stable sanitized body IDs scoped by layout', () => {
    expect(balancedCardBodyId('docs', 'section 1/a')).toBe('docs-balanced-body-section-1-a');
    expect(balancedCardBodyId('magazine', 'A_B-2')).toBe('magazine-balanced-body-A_B-2');
    expect(balancedCardBodyId('story', 'intro.title')).toBe('story-balanced-body-intro-title');
    expect(balancedCardBodyId('dashboard', 'kế hoạch')).toBe('dashboard-balanced-body-k-ho-ch');
  });

  it('returns consistent toggle labels', () => {
    expect(balancedCardToggleLabel(false)).toBe('Show more');
    expect(balancedCardToggleLabel(true)).toBe('Show less');
  });
});
