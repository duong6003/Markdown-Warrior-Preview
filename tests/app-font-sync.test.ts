import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync('src/webview/App.svelte', 'utf8');
const messagesSource = readFileSync('src/shared/messages.ts', 'utf8');

describe('App.svelte font sync messaging', () => {
  it('declares syncFonts message type', () => {
    expect(messagesSource).toContain("type: 'syncFonts'");
    expect(messagesSource).toContain('fontBody: string');
    expect(messagesSource).toContain('fontHeading: string');
    expect(messagesSource).toContain('fontCode: string');
  });

  it('declares setFont message type', () => {
    expect(messagesSource).toContain("type: 'setFont'");
    expect(messagesSource).toContain("slot: 'body' | 'heading' | 'code'");
    expect(messagesSource).toContain('id: string');
  });

  it('posts syncFonts on mount with current font state', () => {
    expect(appSource).toContain("postMessage({ type: 'syncFonts', fontBody, fontHeading, fontCode })");
  });

  it('posts setFont from handleFontChange', () => {
    expect(appSource).toContain("postMessage({ type: 'setFont', slot, id })");
  });

  it('keeps existing ready message', () => {
    expect(appSource).toContain("postMessage({ type: 'ready' })");
  });
});
