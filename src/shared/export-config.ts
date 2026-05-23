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
    bg: '#1e1e2e', bgSecondary: '#313244', bgTertiary: '#313244',
    fg: '#cdd6f4', fgSecondary: '#a6adc8', fgMuted: '#a6adc8',
    accent: '#89b4fa', accentHover: '#cba6f7', border: '#45475a', codeBg: '#313244',
  },
  'catppuccin-latte': {
    bg: '#eff1f5', bgSecondary: '#e6e9ef', bgTertiary: '#e6e9ef',
    fg: '#4c4f69', fgSecondary: '#8c8fa1', fgMuted: '#8c8fa1',
    accent: '#1e66f5', accentHover: '#8839ef', border: '#ccd0da', codeBg: '#e6e9ef',
  },
  'github-dark': {
    bg: '#0d1117', bgSecondary: '#161b22', bgTertiary: '#161b22',
    fg: '#e6edf3', fgSecondary: '#8b949e', fgMuted: '#8b949e',
    accent: '#58a6ff', accentHover: '#79c0ff', border: '#30363d', codeBg: '#161b22',
  },
  'github-light': {
    bg: '#ffffff', bgSecondary: '#f6f8fa', bgTertiary: '#f6f8fa',
    fg: '#24292f', fgSecondary: '#57606a', fgMuted: '#57606a',
    accent: '#0969da', accentHover: '#24292f', border: '#d0d7de', codeBg: '#f6f8fa',
  },
  dracula: {
    bg: '#282a36', bgSecondary: '#44475a', bgTertiary: '#44475a',
    fg: '#f8f8f2', fgSecondary: '#6272a4', fgMuted: '#6272a4',
    accent: '#bd93f9', accentHover: '#ff79c6', border: '#44475a', codeBg: '#44475a',
  },
  'tokyo-night': {
    bg: '#1a1b26', bgSecondary: '#24283b', bgTertiary: '#24283b',
    fg: '#c0caf5', fgSecondary: '#565f89', fgMuted: '#565f89',
    accent: '#bb9af7', accentHover: '#7aa2f7', border: '#292e42', codeBg: '#24283b',
  },
  nord: {
    bg: '#2e3440', bgSecondary: '#3b4252', bgTertiary: '#3b4252',
    fg: '#eceff4', fgSecondary: '#9099aa', fgMuted: '#9099aa',
    accent: '#81a1c1', accentHover: '#88c0d0', border: '#4c566a', codeBg: '#3b4252',
  },
  'high-contrast-dark': {
    bg: '#000000', bgSecondary: '#0a0a0a', bgTertiary: '#0a0a0a',
    fg: '#ffffff', fgSecondary: '#aaaaaa', fgMuted: '#aaaaaa',
    accent: '#00ff00', accentHover: '#ffffff', border: '#ffffff', codeBg: '#0a0a0a',
  },
  vesper: {
    bg: '#101010', bgSecondary: '#1a1a1a', bgTertiary: '#1a1a1a',
    fg: '#ffffff', fgSecondary: '#8a8a8a', fgMuted: '#8a8a8a',
    accent: '#99ffe4', accentHover: '#ffc799', border: '#2a2a2a', codeBg: '#1a1a1a',
  },
  'pitch-black': {
    bg: '#000000', bgSecondary: '#0d0d0d', bgTertiary: '#0d0d0d',
    fg: '#e0e0e0', fgSecondary: '#888888', fgMuted: '#888888',
    accent: '#58a6ff', accentHover: '#e0e0e0', border: '#1a1a1a', codeBg: '#0d0d0d',
  },
  sepia: {
    bg: '#f4ecd8', bgSecondary: '#ede3cc', bgTertiary: '#ede3cc',
    fg: '#3d2b1f', fgSecondary: '#8b7355', fgMuted: '#8b7355',
    accent: '#8b6914', accentHover: '#5c3d2e', border: '#d4b896', codeBg: '#ede3cc',
  },
  'solarized-light': {
    bg: '#fdf6e3', bgSecondary: '#eee8d5', bgTertiary: '#eee8d5',
    fg: '#657b83', fgSecondary: '#93a1a1', fgMuted: '#93a1a1',
    accent: '#2aa198', accentHover: '#268bd2', border: '#d3cbb8', codeBg: '#eee8d5',
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
