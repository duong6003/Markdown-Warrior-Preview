import {
  LAYOUT_TYPES,
  type DocumentModel,
  type DocumentSection,
  type DocumentStats,
  type LayoutOverride,
  type LayoutSignals,
  type LayoutType,
} from '../types/layout';

const FRONTMATTER_BLOCK_RE =
  /\s*<div class="frontmatter-block"[\s\S]*?<table class="frontmatter-table">[\s\S]*?<\/table>\s*<\/div>\s*/i;

const LAYOUT_PRIORITY: LayoutType[] = ['story', 'dashboard'];

let _lastHtml = '';
let _lastFrontmatter: Record<string, unknown> | null = null;
let _lastModel: DocumentModel | null = null;

export function createDocumentModel(
  html: string,
  frontmatter: Record<string, unknown> | null = null,
): DocumentModel {
  if (html === _lastHtml && frontmatter === _lastFrontmatter && _lastModel !== null) return _lastModel;

  _lastHtml = html;
  _lastFrontmatter = frontmatter;
  _lastModel = _buildDocumentModel(html, frontmatter);
  return _lastModel;
}

function _buildDocumentModel(
  html: string,
  frontmatter: Record<string, unknown> | null = null,
): DocumentModel {
  const contentHtml = stripFrontmatterBlock(html);
  const text = stripTags(contentHtml);
  const rawSignals = createSignals(contentHtml, text);
  const sections = extractSections(contentHtml);
  const finalSignals: LayoutSignals = { ...rawSignals, sectionCount: sections.length };
  const stats: DocumentStats = {
    wordCount: finalSignals.wordCount,
    headingCount: finalSignals.headingCount,
    sectionCount: sections.length,
    codeBlockCount: finalSignals.codeBlockCount,
    tableCount: finalSignals.tableCount,
    taskCount: finalSignals.taskCount,
    completedTaskCount: finalSignals.completedTaskCount,
    imageCount: finalSignals.imageCount,
  };

  return {
    html,
    contentHtml,
    title: extractTitle(contentHtml, frontmatter),
    description: extractDescription(contentHtml, frontmatter),
    sections,
    stats,
    signals: finalSignals,
    detectedLayout: detectLayout(finalSignals),
  };
}

export function resolveLayout(
  detectedLayout: LayoutType,
  frontmatter: Record<string, unknown> | null,
  override: LayoutOverride,
): LayoutType {
  const frontmatterLayout = frontmatter?.layout;
  if (typeof frontmatterLayout === 'string' && isLayoutType(frontmatterLayout)) {
    return frontmatterLayout;
  }

  if (override !== 'auto') {
    return override;
  }

  return detectedLayout;
}

export function isLayoutType(value: string): value is LayoutType {
  return (LAYOUT_TYPES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type RawLayoutSignals = Omit<LayoutSignals, 'sectionCount'>;

function stripFrontmatterBlock(html: string): string {
  return html.replace(FRONTMATTER_BLOCK_RE, '').trim();
}

function createSignals(html: string, text: string): RawLayoutSignals {
  const headingCount = countMatches(html, /<h[1-6]\b/gi);
  const paragraphCount = countMatches(html, /<p\b/gi);
  const h2Count = countMatches(html, /<h2\b/gi);
  const hrCount = countMatches(html, /<hr\b/gi);

  const signals: RawLayoutSignals = {
    wordCount: countWords(text),
    headingCount,
    codeBlockCount: countMatches(html, /<pre\b/gi),
    tableCount: countMatches(html, /<table\b/gi),
    taskCount: countMatches(html, /class="task-checkbox"/gi),
    completedTaskCount: countCompletedTasks(html),
    imageCount: countMatches(html, /<img\b/gi),
    h1Count: countMatches(html, /<h1\b/gi),
    h2Count,
    h3PlusCount: countMatches(html, /<h[3-6]\b/gi),
    paragraphCount,
    listCount: countMatches(html, /<(?:ul|ol)\b/gi),
    blockquoteCount: countMatches(html, /<blockquote\b/gi),
    hrCount,
    numberCount: countMatches(text, /\b\d+(?:[.,]\d+)?%?\b/g),
    shortSectionCount: countShortSections(html),
  };

  return signals;
}

function detectLayout(signals: LayoutSignals): LayoutType {
  const scores: Record<LayoutType, number> = {
    story:
      signals.hrCount * 5 +
      signals.shortSectionCount * 2 +
      (signals.sectionCount >= 4 ? 2 : 0),
    dashboard:
      signals.tableCount * 5 +
      signals.taskCount * 4 +
      signals.listCount * 2 +
      Math.min(signals.numberCount, 6),
    article:
      signals.paragraphCount + signals.imageCount * 2 + signals.blockquoteCount + 2,
  };

  let best: LayoutType = 'article';
  let bestScore = scores.article;

  for (const layout of LAYOUT_PRIORITY) {
    const score = scores[layout];
    if (
      score > bestScore ||
      (score === bestScore &&
        LAYOUT_PRIORITY.indexOf(layout) < LAYOUT_PRIORITY.indexOf(best))
    ) {
      best = layout;
      bestScore = score;
    }
  }

  return best;
}

function extractSections(html: string): DocumentSection[] {
  const headingRe = /<h([1-3])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
  const headings = [...html.matchAll(headingRe)];

  if (headings.length === 0) {
    return [
      {
        key: 'document-0',
        id: 'document',
        title: 'Document',
        level: 1,
        html,
        blockTypes: extractBlockTypes(html),
      },
    ];
  }

  const sections: DocumentSection[] = [];
  const firstHeadingStart = headings[0].index ?? 0;
  const introHtml = html.slice(0, firstHeadingStart).trim();

  if (introHtml) {
    sections.push({
      key: 'intro-0',
      id: 'document-intro',
      title: 'Introduction',
      level: 1,
      html: introHtml,
      sourceLine: extractFirstSourceLine(introHtml),
      blockTypes: extractBlockTypes(introHtml),
    });
  }

  sections.push(...headings.map((match, index) => {
    const next = headings[index + 1];
    const start = match.index ?? 0;
    const end = next?.index ?? html.length;
    const sectionHtml = html.slice(start, end).trim();
    const attrs = match[2] ?? '';

    return {
      key: `section-${index}`,
      id: extractAttribute(attrs, 'id') || `section-${index + 1}`,
      title: stripTags(match[3]).trim() || `Section ${index + 1}`,
      level: Number(match[1]),
      html: sectionHtml,
      sourceLine: parseOptionalNumber(extractAttribute(attrs, 'data-source-line')),
      blockTypes: extractBlockTypes(sectionHtml),
    };
  }));

  return sections;
}

function extractBlockTypes(html: string): string[] {
  const types = new Set<string>();
  if (/<h[1-6]\b/i.test(html)) types.add('heading');
  if (/<p\b/i.test(html)) types.add('paragraph');
  if (/<pre\b/i.test(html)) types.add('code');
  if (/<table\b/i.test(html)) types.add('table');
  if (/<blockquote\b/i.test(html)) types.add('quote');
  if (/<img\b/i.test(html)) types.add('image');
  if (/<(?:ul|ol)\b/i.test(html)) types.add('list');
  if (/class="task-checkbox"/i.test(html)) types.add('tasks');
  return [...types];
}

function extractTitle(
  html: string,
  frontmatter: Record<string, unknown> | null,
): string {
  if (typeof frontmatter?.title === 'string' && frontmatter.title.trim()) {
    return frontmatter.title.trim();
  }
  return (
    extractFirstTagText(html, 'h1') ||
    extractFirstTagText(html, 'h2') ||
    'Untitled document'
  );
}

function extractDescription(
  html: string,
  frontmatter: Record<string, unknown> | null,
): string {
  if (typeof frontmatter?.description === 'string' && frontmatter.description.trim()) {
    return frontmatter.description.trim();
  }
  return extractFirstTagText(html, 'p').slice(0, 180);
}

function extractFirstTagText(html: string, tag: string): string {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? stripTags(match[1]).trim() : '';
}

function extractAttribute(attrs: string, name: string): string {
  const match = attrs.match(new RegExp(`${name}="([^"]*)"`, 'i'));
  return match?.[1] ?? '';
}

function extractFirstSourceLine(html: string): number | undefined {
  const match = html.match(/\bdata-source-line="([^"]*)"/i);
  return parseOptionalNumber(match?.[1] ?? '');
}

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function countShortSections(html: string): number {
  const parts = html.split(/<hr\b[^>]*>|<h2\b[^>]*>/gi).filter(Boolean);
  return parts.filter((part) => {
    const words = countWords(stripTags(part));
    return words > 0 && words <= 45;
  }).length;
}

function countCompletedTasks(html: string): number {
  return countMatches(html, /class="task-checkbox"[^>]*checked/gi);
}

function countWords(text: string): number {
  return (text.match(/[\p{L}\p{N}_-]+/gu) ?? []).length;
}

function countMatches(input: string, regex: RegExp): number {
  return input.match(regex)?.length ?? 0;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
