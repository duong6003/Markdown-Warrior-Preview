export interface ThemeDefinition {
  readonly id: string;
  readonly label: string;
  readonly mode: 'dark' | 'light';
  readonly shikiTheme: string;
  readonly swatches: readonly [string, string, string, string, string];
}

export const THEMES = [
  {
    id: 'catppuccin-mocha',
    label: 'Catppuccin Mocha',
    mode: 'dark',
    shikiTheme: 'catppuccin-mocha',
    swatches: ['#1e1e2e', '#cba6f7', '#89b4fa', '#a6e3a1', '#f38ba8'],
  },
  {
    id: 'catppuccin-latte',
    label: 'Catppuccin Latte',
    mode: 'light',
    shikiTheme: 'catppuccin-latte',
    swatches: ['#eff1f5', '#8839ef', '#1e66f5', '#40a02b', '#d20f39'],
  },
  {
    id: 'github-dark',
    label: 'GitHub Dark',
    mode: 'dark',
    shikiTheme: 'github-dark',
    swatches: ['#0d1117', '#58a6ff', '#7ee787', '#ff7b72', '#e3b341'],
  },
  {
    id: 'github-light',
    label: 'GitHub Light',
    mode: 'light',
    shikiTheme: 'github-light',
    swatches: ['#ffffff', '#0969da', '#1a7f37', '#cf222e', '#9a6700'],
  },
  {
    id: 'dracula',
    label: 'Dracula',
    mode: 'dark',
    shikiTheme: 'dracula',
    swatches: ['#282a36', '#ff79c6', '#bd93f9', '#50fa7b', '#ffb86c'],
  },
  {
    id: 'tokyo-night',
    label: 'Tokyo Night',
    mode: 'dark',
    shikiTheme: 'tokyo-night',
    swatches: ['#1a1b26', '#7aa2f7', '#bb9af7', '#9ece6a', '#f7768e'],
  },
  {
    id: 'nord',
    label: 'Nord',
    mode: 'dark',
    shikiTheme: 'nord',
    swatches: ['#2e3440', '#88c0d0', '#81a1c1', '#a3be8c', '#bf616a'],
  },
  {
    id: 'high-contrast-dark',
    label: 'High Contrast Dark',
    mode: 'dark',
    shikiTheme: 'min-dark',
    swatches: ['#000000', '#ffffff', '#00ff00', '#ffff00', '#ff6b6b'],
  },
  {
    id: 'vesper',
    label: 'Vesper',
    mode: 'dark',
    shikiTheme: 'vesper',
    swatches: ['#101010', '#ffc799', '#99ffe4', '#b8e466', '#ff6666'],
  },
  {
    id: 'pitch-black',
    label: 'Pitch Black (OLED)',
    mode: 'dark',
    shikiTheme: 'github-dark',
    swatches: ['#000000', '#e0e0e0', '#58a6ff', '#7ee787', '#ff7b72'],
  },
  {
    id: 'sepia',
    label: 'Sepia',
    mode: 'light',
    shikiTheme: 'min-light',
    swatches: ['#f4ecd8', '#8b6914', '#5c4a1e', '#7a9e3b', '#c0392b'],
  },
  {
    id: 'solarized-light',
    label: 'Solarized Light',
    mode: 'light',
    shikiTheme: 'solarized-light',
    swatches: ['#fdf6e3', '#268bd2', '#2aa198', '#859900', '#dc322f'],
  },
] as const satisfies readonly ThemeDefinition[];

export const DEFAULT_THEME = 'catppuccin-mocha';

export function getTheme(id: string): ThemeDefinition {
  const theme = THEMES.find(t => t.id === id);
  if (!theme) throw new Error(`Unknown theme: ${id}`);
  return theme;
}
