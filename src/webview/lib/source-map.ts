import { postMessage } from './message-bridge';

let ignoreScroll = false;
let ignoreTimeout: number | null = null;
let cleanupScrollReporter: (() => void) | null = null;

/**
 * Find the DOM element closest to the given source line
 * and scroll it into view.
 */
export function scrollToLine(line: number) {
  ignoreScroll = true;
  if (ignoreTimeout) clearTimeout(ignoreTimeout);
  ignoreTimeout = window.setTimeout(() => { ignoreScroll = false; }, 80);

  const container = document.querySelector('main');
  if (!container) return;

  const elements = container.querySelectorAll('[data-source-line]');
  let closest: Element | null = null;
  let closestDiff = Infinity;

  for (const el of elements) {
    const elLine = parseInt(el.getAttribute('data-source-line') || '0');
    const diff = Math.abs(elLine - line);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = el;
    }
  }

  if (closest) {
    closest.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Attach scroll-sync reporter to containerEl, replacing any previous listener.
 * Falls back to document.querySelector('main') when no element is provided.
 */
export function setupScrollReporter(containerEl?: HTMLElement) {
  cleanupScrollReporter?.();
  cleanupScrollReporter = null;

  const container = containerEl ?? (document.querySelector('main') as HTMLElement | null);
  if (!container) return;

  let ticking = false;

  function onScroll() {
    if (ignoreScroll || ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const elements = container.querySelectorAll('[data-source-line]');
      const containerRect = container.getBoundingClientRect();

      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.top >= containerRect.top - 10 && rect.top <= containerRect.top + 60) {
          const line = parseInt(el.getAttribute('data-source-line') || '0');
          postMessage({ type: 'scrollSync', line });
          break;
        }
      }
      ticking = false;
    });
  }

  container.addEventListener('scroll', onScroll);
  cleanupScrollReporter = () => container.removeEventListener('scroll', onScroll);
}
