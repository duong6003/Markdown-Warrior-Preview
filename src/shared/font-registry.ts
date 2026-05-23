export interface FontEntry {
  id: string;
  label: string;
  stack: string;
  googleFamily?: string;
}

export const BODY_FONTS: FontEntry[] = [
  { id: 'system',       label: 'System UI',      stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', sans-serif" },
  { id: 'georgia',      label: 'Georgia',         stack: "Georgia, 'Times New Roman', serif" },
  { id: 'inter',        label: 'Inter',           stack: "'Inter', sans-serif",               googleFamily: 'Inter' },
  { id: 'lato',         label: 'Lato',            stack: "'Lato', sans-serif",                googleFamily: 'Lato' },
  { id: 'merriweather', label: 'Merriweather',    stack: "'Merriweather', serif",             googleFamily: 'Merriweather' },
  { id: 'nunito',       label: 'Nunito',          stack: "'Nunito', sans-serif",              googleFamily: 'Nunito' },
];

export const HEADING_FONTS: FontEntry[] = [
  { id: 'inherit',  label: 'Same as body',      stack: 'inherit' },
  { id: 'georgia',  label: 'Georgia',           stack: "Georgia, 'Times New Roman', serif" },
  { id: 'playfair', label: 'Playfair Display',  stack: "'Playfair Display', serif",          googleFamily: 'Playfair+Display' },
  { id: 'raleway',  label: 'Raleway',           stack: "'Raleway', sans-serif",              googleFamily: 'Raleway' },
  { id: 'poppins',  label: 'Poppins',           stack: "'Poppins', sans-serif",              googleFamily: 'Poppins' },
];

export const CODE_FONTS: FontEntry[] = [
  { id: 'cascadia',  label: 'Cascadia Code',   stack: "'Cascadia Code', Consolas, 'Courier New', monospace" },
  { id: 'jetbrains', label: 'JetBrains Mono',  stack: "'JetBrains Mono', monospace",         googleFamily: 'JetBrains+Mono' },
  { id: 'fira',      label: 'Fira Code',       stack: "'Fira Code', monospace",              googleFamily: 'Fira+Code' },
];

export function getFontEntry(id: string, fonts: FontEntry[]): FontEntry {
  const entry = fonts.find(f => f.id === id);
  if (!entry) throw new Error(`Unknown font: ${id}`);
  return entry;
}
