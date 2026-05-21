import { postMessage } from './message-bridge';

let ignoreScroll = false;
let ignoreTimeout: number | null = null;

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
 * Setup scroll listener to report visible line back to host.
 */
export function setupScrollReporter() {
  let ticking = false;

  const container = document.querySelector('main');
  if (!container) return;

  container.addEventListener('scroll', () => {
    if (ignoreScroll || ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const elements = container.querySelectorAll('[data-source-line]');
      const containerRect = container.getBoundingClientRect();

      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        // Find first element whose top is at or below the container top
        if (rect.top >= containerRect.top - 10 && rect.top <= containerRect.top + 60) {
          const line = parseInt(el.getAttribute('data-source-line') || '0');
          postMessage({ type: 'scrollSync', line });
          break;
        }
      }
      ticking = false;
    });
  });
}
