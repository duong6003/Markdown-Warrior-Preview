import * as https from 'node:https';
import type { ExportConfig } from '../shared/export-config';
import {
  BODY_FONTS,
  CODE_FONTS,
  HEADING_FONTS,
  type FontEntry,
  getFontEntry,
} from '../shared/font-registry';

export type FontDialogChoice = 'embed' | 'fallback' | 'cancel';

export interface FontStacks {
  body: string;
  heading: string;
  code: string;
}

export interface FontInlineResult {
  css: string;
  stacks: FontStacks;
}

const SYSTEM_FALLBACK_STACKS: FontStacks = {
  body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  heading: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  code: "Consolas, 'Courier New', monospace",
};
const REQUEST_TIMEOUT_MS = 10000;

type FontEntries = {
  body: FontEntry;
  heading: FontEntry;
  code: FontEntry;
};

export async function prepareFonts(
  config: ExportConfig,
  showDialog: (families: string[]) => Promise<FontDialogChoice>,
): Promise<FontInlineResult | null> {
  const entries = resolveFontEntries(config);
  const families = uniqueFamilies(entries);

  if (families.length === 0) {
    return { css: '', stacks: entriesToStacks(entries) };
  }

  const choice = await showDialog(families);
  if (choice === 'cancel') return null;

  if (choice === 'fallback') {
    return { css: '', stacks: fallbackStacks(config) };
  }

  try {
    const css = await inlineGoogleFonts(families);
    return { css, stacks: entriesToStacks(entries) };
  } catch (err) {
    console.warn('[MarkdownWarrior] Google Fonts embedding failed:', err);
    return { css: '', stacks: fallbackStacks(config) };
  }
}

export function resolveFontStacks(config: ExportConfig): FontStacks {
  return entriesToStacks(resolveFontEntries(config));
}

function resolveFontEntries(config: ExportConfig): FontEntries {
  return {
    body: safeGetFontEntry(config.fontBody, BODY_FONTS, 'system'),
    heading: safeGetFontEntry(config.fontHeading, HEADING_FONTS, 'inherit'),
    code: safeGetFontEntry(config.fontCode, CODE_FONTS, 'cascadia'),
  };
}

function safeGetFontEntry(id: string, fonts: FontEntry[], fallbackId: string): FontEntry {
  try {
    return getFontEntry(id, fonts);
  } catch {
    return getFontEntry(fallbackId, fonts);
  }
}

function entriesToStacks(entries: FontEntries): FontStacks {
  return {
    body: entries.body.stack,
    heading: entries.heading.stack,
    code: entries.code.stack,
  };
}

function fallbackStacks(config: ExportConfig): FontStacks {
  return {
    body: SYSTEM_FALLBACK_STACKS.body,
    heading: config.fontHeading === 'inherit' ? 'inherit' : SYSTEM_FALLBACK_STACKS.heading,
    code: SYSTEM_FALLBACK_STACKS.code,
  };
}

function uniqueFamilies(entries: FontEntries): string[] {
  return [
    ...new Set([entries.body.googleFamily, entries.heading.googleFamily, entries.code.googleFamily]
      .filter((family): family is string => typeof family === 'string' && family.length > 0)),
  ];
}

async function inlineGoogleFonts(families: string[]): Promise<string> {
  const parts: string[] = [];

  for (const family of families) {
    const encoded = family.replace(/ /g, '+');
    const css = await getText(`https://fonts.googleapis.com/css2?family=${encoded}&display=swap`, {
      'User-Agent': 'Mozilla/5.0',
    });
    parts.push(await inlineFontUrls(css));
  }

  return parts.join('\n');
}

async function inlineFontUrls(css: string): Promise<string> {
  const urlRe = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g;
  let result = css;
  const urls = [...css.matchAll(urlRe)].map(match => match[1]);

  for (const url of urls) {
    try {
      const data = await getBuffer(url);
      result = result.replace(url, `data:font/woff2;base64,${data.toString('base64')}`);
    } catch (err) {
      console.warn('[MarkdownWarrior] Font binary fetch failed:', err);
    }
  }

  return result;
}

function getText(url: string, headers: Record<string, string> = {}): Promise<string> {
  return requestBuffer(url, headers).then(buffer => buffer.toString('utf8'));
}

function getBuffer(url: string): Promise<Buffer> {
  return requestBuffer(url);
}

function requestBuffer(url: string, headers: Record<string, string> = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      callback();
    };

    const fail = (error: Error) => settle(() => reject(error));
    const succeed = (buffer: Buffer) => settle(() => resolve(buffer));

    const req = https.request(url, { headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', chunk => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      res.on('error', fail);
      res.on('aborted', () => fail(new Error(`Request aborted: ${url}`)));
      res.on('end', () => {
        if ((res.statusCode ?? 0) < 200 || (res.statusCode ?? 0) >= 300) {
          fail(new Error(`Request failed with status ${res.statusCode}: ${url}`));
          return;
        }
        succeed(Buffer.concat(chunks));
      });
    });
    req.on('error', fail);
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy();
      fail(new Error(`Request timed out: ${url}`));
    });
    req.end();
  });
}
