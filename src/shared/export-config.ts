import { DEFAULT_THEME } from './theme-registry';

export interface ExportConfig {
  themeId: string;
  fontBody: string;
  fontHeading: string;
  fontCode: string;
}

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  themeId: DEFAULT_THEME,
  fontBody: 'system',
  fontHeading: 'inherit',
  fontCode: 'cascadia',
};

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
