import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/extension/preview-provider.ts', 'utf8');

describe('PreviewProvider export font config', () => {
  it('defines globalState keys for font slots', () => {
    expect(source).toContain("const FONT_BODY_KEY = 'markdownWarrior.fontBody'");
    expect(source).toContain("const FONT_HEADING_KEY = 'markdownWarrior.fontHeading'");
    expect(source).toContain("const FONT_CODE_KEY = 'markdownWarrior.fontCode'");
  });

  it('handles setFont webview messages', () => {
    expect(source).toContain("case 'setFont'");
    expect(source).toContain('message.slot === \'body\'');
    expect(source).toContain('message.slot === \'heading\'');
    expect(source).toContain('this.context.globalState.update(key, message.id)');
  });

  it('handles syncFonts webview messages', () => {
    expect(source).toContain("case 'syncFonts'");
    expect(source).toContain('message.fontBody');
    expect(source).toContain('message.fontHeading');
    expect(source).toContain('message.fontCode');
  });

  it('exposes getExportConfig with selected theme and persisted fonts', () => {
    expect(source).toContain('public getExportConfig()');
    expect(source).toContain('themeId: this.selectedThemeId');
    expect(source).toContain("this.context.globalState.get<string>(FONT_BODY_KEY, 'system')");
    expect(source).toContain("this.context.globalState.get<string>(FONT_HEADING_KEY, 'inherit')");
    expect(source).toContain("this.context.globalState.get<string>(FONT_CODE_KEY, 'cascadia')");
  });
});
