export type BalancedCardLayout = 'dashboard' | 'docs' | 'magazine' | 'story';

export function balancedCardBodyId(layout: BalancedCardLayout, sectionKey: string): string {
  return `${layout}-balanced-body-${sectionKey.replace(/[^A-Za-z0-9_-]+/g, '-')}`;
}

export function balancedCardToggleLabel(expanded: boolean): string {
  return expanded ? 'Show less' : 'Show more';
}
