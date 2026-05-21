export const LAYOUT_TYPES = ['magazine', 'docs', 'story', 'dashboard'] as const;

export type LayoutType = typeof LAYOUT_TYPES[number];
export type LayoutOverride = LayoutType | 'auto';

export interface DocumentStats {
  wordCount: number;
  headingCount: number;
  sectionCount: number;
  codeBlockCount: number;
  tableCount: number;
  taskCount: number;
  completedTaskCount: number;
  imageCount: number;
}

export interface LayoutSignals extends DocumentStats {
  h1Count: number;
  h2Count: number;
  h3PlusCount: number;
  paragraphCount: number;
  listCount: number;
  blockquoteCount: number;
  hrCount: number;
  numberCount: number;
  shortSectionCount: number;
}

export interface DocumentSection {
  id: string;
  title: string;
  level: number;
  html: string;
  sourceLine?: number;
  blockTypes: string[];
}

export interface DocumentModel {
  html: string;
  contentHtml: string;
  title: string;
  description: string;
  sections: DocumentSection[];
  stats: DocumentStats;
  signals: LayoutSignals;
  detectedLayout: LayoutType;
}
