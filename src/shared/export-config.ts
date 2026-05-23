import { DEFAULT_THEME } from './theme-registry';

export interface ExportConfig {
  themeId: string;
  fontBody: string;
  fontHeading: string;
  fontCode: string;
}

export interface ThemeExportColors {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  fg: string;
  fgSecondary: string;
  fgMuted: string;
  accent: string;
  accentHover: string;
  border: string;
  codeBg: string;
}

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  themeId: DEFAULT_THEME,
  fontBody: 'system',
  fontHeading: 'inherit',
  fontCode: 'cascadia',
};

export const THEME_EXPORT_COLORS: Record<string, ThemeExportColors> = {
  'catppuccin-mocha': {
    bg: '#1e1e2e', bgSecondary: '#181825', bgTertiary: '#313244',
    fg: '#cdd6f4', fgSecondary: '#bac2de', fgMuted: '#6c7086',
    accent: '#cba6f7', accentHover: '#89b4fa', border: '#45475a', codeBg: '#181825',
  },
  'catppuccin-latte': {
    bg: '#eff1f5', bgSecondary: '#e6e9ef', bgTertiary: '#dce0e8',
    fg: '#4c4f69', fgSecondary: '#5c5f77', fgMuted: '#9ca0b0',
    accent: '#8839ef', accentHover: '#1e66f5', border: '#bcc0cc', codeBg: '#e6e9ef',
  },
  'github-dark': {
    bg: '#0d1117', bgSecondary: '#161b22', bgTertiary: '#21262d',
    fg: '#c9d1d9', fgSecondary: '#8b949e', fgMuted: '#6e7681',
    accent: '#58a6ff', accentHover: '#79c0ff', border: '#30363d', codeBg: '#161b22',
  },
  'github-light': {
    bg: '#ffffff', bgSecondary: '#f6f8fa', bgTertiary: '#eef1f5',
    fg: '#24292f', fgSecondary: '#57606a', fgMuted: '#8b949e',
    accent: '#0969da', accentHover: '#0550ae', border: '#d0d7de', codeBg: '#f6f8fa',
  },
  dracula: {
    bg: '#282a36', bgSecondary: '#21222c', bgTertiary: '#343746',
    fg: '#f8f8f2', fgSecondary: '#bd93f9', fgMuted: '#6272a4',
    accent: '#ff79c6', accentHover: '#8be9fd', border: '#44475a', codeBg: '#21222c',
  },
  'tokyo-night': {
    bg: '#1a1b26', bgSecondary: '#16161e', bgTertiary: '#24283b',
    fg: '#c0caf5', fgSecondary: '#a9b1d6', fgMuted: '#565f89',
    accent: '#7aa2f7', accentHover: '#bb9af7', border: '#414868', codeBg: '#16161e',
  },
  nord: {
    bg: '#2e3440', bgSecondary: '#252a34', bgTertiary: '#3b4252',
    fg: '#d8dee9', fgSecondary: '#e5e9f0', fgMuted: '#4c566a',
    accent: '#88c0d0', accentHover: '#81a1c1', border: '#4c566a', codeBg: '#252a34',
  },
  'high-contrast-dark': {
    bg: '#000000', bgSecondary: '#111111', bgTertiary: '#1a1a1a',
    fg: '#ffffff', fgSecondary: '#d0d0d0', fgMuted: '#808080',
    accent: '#00ff00', accentHover: '#ffff00', border: '#ffffff', codeBg: '#111111',
  },
  vesper: {
    bg: '#101010', bgSecondary: '#171717', bgTertiary: '#222222',
    fg: '#ffffff', fgSecondary: '#a0a0a0', fgMuted: '#666666',
    accent: '#ffc799', accentHover: '#99ffe4', border: '#333333', codeBg: '#171717',
  },
  'pitch-black': {
    bg: '#000000', bgSecondary: '#050505', bgTertiary: '#101010',
    fg: '#e0e0e0', fgSecondary: '#b0b0b0', fgMuted: '#666666',
    accent: '#58a6ff', accentHover: '#7ee787', border: '#222222', codeBg: '#050505',
  },
  sepia: {
    bg: '#f4ecd8', bgSecondary: '#eadfca', bgTertiary: '#dfd0b5',
    fg: '#5c4a1e', fgSecondary: '#7b6330', fgMuted: '#a28b5f',
    accent: '#8b6914', accentHover: '#7a9e3b', border: '#d3bf91', codeBg: '#eadfca',
  },
  'solarized-light': {
    bg: '#fdf6e3', bgSecondary: '#eee8d5', bgTertiary: '#e5ddc7',
    fg: '#657b83', fgSecondary: '#586e75', fgMuted: '#93a1a1',
    accent: '#268bd2', accentHover: '#2aa198', border: '#d6cbb1', codeBg: '#eee8d5',
  },
};

export function getExportThemeColors(themeId: string): ThemeExportColors {
  return THEME_EXPORT_COLORS[themeId] ?? THEME_EXPORT_COLORS['github-dark'];
}

export function normalizeExportConfig(value: unknown): ExportConfig {
  const source = typeof value === 'object' && value !== null
    ? value as Partial<Record<keyof ExportConfig, unknown>>
    : {};

  return {
    themeId: typeof source.themeId === 'string' ? source.themeId : DEFAULT_EXPORT_CONFIG.themeId,
    fontBody: typeof source.fontBody === 'string' ? source.fontBody : DEFAULT_EXPORT_CONFIG.fontBody,
    fontHeading: typeof source.fontHeading === 'string' ? source.fontHeading : DEFAULT_EXPORT_CONFIG.fontHeading,
    fontCode: typeof source.fontCode === 'string' ? source.fontCode : DEFAULT_EXPORT_CONFIG.fontCode,
  };
}
