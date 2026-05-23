import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExportConfig } from '../src/shared/export-config';

vi.mock('node:https', () => ({
  request: vi.fn(),
}));

const { request } = await import('node:https');
const { prepareFonts, resolveFontStacks } = await import('../src/extension/font-inliner');

beforeEach(() => {
  vi.mocked(request).mockReset();
});

function createConfig(overrides: Partial<ExportConfig> = {}): ExportConfig {
  return {
    themeId: 'github-dark',
    fontBody: 'system',
    fontHeading: 'inherit',
    fontCode: 'cascadia',
    ...overrides,
  };
}

function mockHttpsResponses(responses: Array<{ body: string | Buffer; statusCode?: number }>) {
  let index = 0;
  vi.mocked(request).mockImplementation((url: string | URL, optionsOrCallback: unknown, callbackMaybe?: unknown) => {
    const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : callbackMaybe;
    const response = responses[index++] ?? { body: '', statusCode: 404 };
    const handlers: Record<string, (chunk?: unknown) => void> = {};
    const res = {
      statusCode: response.statusCode ?? 200,
      on: (event: string, handler: (chunk?: unknown) => void) => {
        handlers[event] = handler;
        return res;
      },
    };
    const req = {
      on: vi.fn(),
      setTimeout: vi.fn(),
      destroy: vi.fn(),
      end: vi.fn(() => {
        (callback as (res: typeof res) => void)(res);
        handlers.data?.(response.body);
        handlers.end?.();
      }),
    };
    return req as never;
  });
}

describe('font-inliner', () => {
  it('resolves configured font stacks without prompting when no Google fonts are selected', async () => {
    const showDialog = vi.fn();
    const result = await prepareFonts(createConfig(), showDialog);

    expect(result).toEqual({
      css: '',
      stacks: {
        body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', sans-serif",
        heading: 'inherit',
        code: "'Cascadia Code', Consolas, 'Courier New', monospace",
      },
    });
    expect(showDialog).not.toHaveBeenCalled();
  });

  it('deduplicates Google font families before prompting', async () => {
    const showDialog = vi.fn().mockResolvedValue('fallback');
    const result = await prepareFonts(
      createConfig({ fontBody: 'inter', fontHeading: 'inherit', fontCode: 'cascadia' }),
      showDialog,
    );

    expect(showDialog).toHaveBeenCalledWith(['Inter']);
    expect(result?.css).toBe('');
  });

  it('returns system fallback stacks when user chooses fallback', async () => {
    const showDialog = vi.fn().mockResolvedValue('fallback');
    const result = await prepareFonts(
      createConfig({ fontBody: 'inter', fontHeading: 'playfair', fontCode: 'fira' }),
      showDialog,
    );

    expect(result).toEqual({
      css: '',
      stacks: {
        body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        heading: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        code: "Consolas, 'Courier New', monospace",
      },
    });
  });

  it('preserves inherit heading when fallback is selected and heading config is inherit', async () => {
    const showDialog = vi.fn().mockResolvedValue('fallback');
    const result = await prepareFonts(
      createConfig({ fontBody: 'inter', fontHeading: 'inherit', fontCode: 'cascadia' }),
      showDialog,
    );

    expect(result?.stacks.heading).toBe('inherit');
  });

  it('returns null when user cancels font dialog', async () => {
    const showDialog = vi.fn().mockResolvedValue('cancel');
    await expect(prepareFonts(createConfig({ fontBody: 'inter' }), showDialog)).resolves.toBeNull();
  });

  it('embeds fetched woff2 font data as base64 CSS', async () => {
    mockHttpsResponses([
      {
        body: "@font-face { font-family: 'Inter'; src: url(https://fonts.gstatic.com/inter.woff2) format('woff2'); }",
      },
      { body: Buffer.from('woff2-data') },
    ]);
    const showDialog = vi.fn().mockResolvedValue('embed');

    const result = await prepareFonts(createConfig({ fontBody: 'inter' }), showDialog);

    expect(result?.css).toContain("font-family: 'Inter'");
    expect(result?.css).toContain('data:font/woff2;base64,d29mZjItZGF0YQ==');
    expect(result?.stacks.body).toBe("'Inter', sans-serif");
  });

  it('skips failed individual font binary fetches and continues', async () => {
    mockHttpsResponses([
      {
        body: "@font-face { font-family: 'Inter'; src: url(https://fonts.gstatic.com/inter.woff2) format('woff2'); }",
      },
      { body: 'missing', statusCode: 404 },
    ]);
    const showDialog = vi.fn().mockResolvedValue('embed');

    const result = await prepareFonts(createConfig({ fontBody: 'inter' }), showDialog);

    expect(result?.css).toContain("font-family: 'Inter'");
    expect(result?.css).toContain('https://fonts.gstatic.com/inter.woff2');
  });

  it('falls back to system stacks when Google CSS fetch fails', async () => {
    mockHttpsResponses([{ body: 'missing', statusCode: 500 }]);
    const showDialog = vi.fn().mockResolvedValue('embed');

    const result = await prepareFonts(createConfig({ fontBody: 'inter' }), showDialog);

    expect(result).toEqual({
      css: '',
      stacks: {
        body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        heading: 'inherit',
        code: "Consolas, 'Courier New', monospace",
      },
    });
  });

  it('falls back to system stacks when Google CSS request times out', async () => {
    vi.mocked(request).mockImplementation((_url: string | URL, optionsOrCallback: unknown, callbackMaybe?: unknown) => {
      const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : callbackMaybe;
      const req = {
        on: vi.fn(),
        setTimeout: vi.fn((_timeout: number, handler: () => void) => handler()),
        destroy: vi.fn(),
        end: vi.fn(() => {
          expect(callback).toBeTypeOf('function');
        }),
      };
      return req as never;
    });
    const showDialog = vi.fn().mockResolvedValue('embed');

    const result = await prepareFonts(createConfig({ fontBody: 'inter' }), showDialog);

    expect(result).toEqual({
      css: '',
      stacks: {
        body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        heading: 'inherit',
        code: "Consolas, 'Courier New', monospace",
      },
    });
  });

  it('resolveFontStacks falls back unknown ids to defaults', () => {
    expect(resolveFontStacks(createConfig({ fontBody: 'missing', fontHeading: 'missing', fontCode: 'missing' }))).toEqual({
      body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', sans-serif",
      heading: 'inherit',
      code: "'Cascadia Code', Consolas, 'Courier New', monospace",
    });
  });
});
