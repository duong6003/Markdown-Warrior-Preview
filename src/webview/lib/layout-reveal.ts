let activeObserver: IntersectionObserver | null = null;

export function setupLayoutReveal(root: ParentNode = document): void {
  activeObserver?.disconnect();
  activeObserver = null;

  const revealElements = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (revealElements.length === 0) {
    return;
  }

  const prefersReducedMotion =
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canObserve = typeof globalThis.IntersectionObserver !== 'undefined';

  if (prefersReducedMotion || !canObserve) {
    for (const element of revealElements) {
      element.classList.add('is-visible');
    }
    return;
  }

  activeObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }

        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    {
      root: typeof Element !== 'undefined' && root instanceof Element ? root : null,
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08,
    },
  );

  for (const element of revealElements) {
    activeObserver.observe(element);
  }
}
