import { describe, expect, it, vi } from 'vitest';
import { setupLayoutReveal } from '../src/webview/lib/layout-reveal';

function createRoot() {
  const first = {
    classList: {
      added: [] as string[],
      add(value: string) {
        this.added.push(value);
      },
    },
  };
  const second = {
    classList: {
      added: [] as string[],
      add(value: string) {
        this.added.push(value);
      },
    },
  };
  const root = {
    querySelectorAll(selector: string) {
      return selector === '[data-reveal]' ? [first, second] : [];
    },
  } as unknown as ParentNode;

  return { root, first, second };
}

describe('layout reveal helper', () => {
  it('observes reveal elements and marks each visible when it intersects', () => {
    const { root, first, second } = createRoot();
    const observeSpy = vi.fn();
    const unobserveSpy = vi.fn();
    const disconnectSpy = vi.fn();
    let callback: IntersectionObserverCallback | undefined;
    let observerInstance: IntersectionObserver | undefined;

    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const observer = vi.fn(
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb;
          observerInstance = this as unknown as IntersectionObserver;
        }

        observe = observeSpy;
        unobserve = unobserveSpy;
        disconnect = disconnectSpy;
      },
    );
    vi.stubGlobal(
      'IntersectionObserver',
      observer,
    );

    setupLayoutReveal(root);

    expect(observeSpy).toHaveBeenCalledTimes(2);
    callback?.(
      [
        { isIntersecting: true, target: first as unknown as Element },
        { isIntersecting: false, target: second as unknown as Element },
      ] as IntersectionObserverEntry[],
      observerInstance!,
    );

    expect(first.classList.added).toEqual(['is-visible']);
    expect(second.classList.added).toEqual([]);
    expect(unobserveSpy).toHaveBeenCalledWith(first);
    expect(disconnectSpy).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('shows reveal elements immediately when reduced motion is requested', () => {
    const { root, first, second } = createRoot();
    const observer = vi.fn();

    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    vi.stubGlobal('IntersectionObserver', observer);

    setupLayoutReveal(root);

    expect(first.classList.added).toEqual(['is-visible']);
    expect(second.classList.added).toEqual(['is-visible']);
    expect(observer).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
