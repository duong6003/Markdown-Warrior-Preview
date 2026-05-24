import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/shared/messages.ts', 'utf8');

describe('WebviewToHostMessage export types', () => {
  it('declares exportHTML message type', () => {
    expect(source).toContain("type: 'exportHTML'");
  });

  it('declares exportPDF message type', () => {
    expect(source).toContain("type: 'exportPDF'");
  });
});
