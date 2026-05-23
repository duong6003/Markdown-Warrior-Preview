import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';

const source = readFileSync('src/webview/lib/GhostNav.svelte', 'utf8');

describe('GhostNav', () => {
  it('compiles without errors', () => {
    expect(() =>
      compile(source, { filename: 'GhostNav.svelte', generate: 'client' })
    ).not.toThrow();
  });

  it('renders only when there are more than one section', () => {
    expect(source).toContain('sections.length > 1');
  });

  it('has an edge zone trigger at the left edge', () => {
    expect(source).toContain('class="ghost-edge-zone"');
    expect(source).toContain('onmouseenter={showNav}');
    expect(source).toContain('onmouseleave={scheduleHide}');
  });

  it('uses a fly transition for the nav panel', () => {
    expect(source).toContain('transition:fly=');
    expect(source).toContain('cubicOut');
    expect(source).toContain('transform: translateY(-50%);');
  });

  it('invokes onNavigate with section key and id', () => {
    expect(source).toContain('onNavigate(section.key, section.id)');
  });

  it('applies deep class for nested sections', () => {
    expect(source).toContain('class:deep={section.level > 2}');
  });

  it('uses debounce to prevent flicker on mouse handoff', () => {
    expect(source).toContain('let hideTimeout');
    expect(source).toContain('clearTimeout(hideTimeout)');
    expect(source).toContain('setTimeout');
  });

  it('hides via CSS on mobile', () => {
    expect(source).toContain('@media (max-width: 900px)');
    expect(source).toContain('display: none');
  });

  it('shows a gradient strip affordance at the left edge', () => {
    expect(source).toContain('class="ghost-strip"');
    expect(source).toContain('class:hidden={navVisible}');
    expect(source).toContain('.ghost-strip {');
    expect(source).toContain('width: 3px;');
    expect(source).toContain('linear-gradient(');
    expect(source).toContain('var(--md-accent)');
    expect(source).toContain('opacity: 0.4;');
    expect(source).toContain('.ghost-strip.hidden {');
    expect(source).toContain('opacity: 0;');
    expect(source).toContain('pointer-events: none;');
  });
});
