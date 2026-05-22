import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupLayoutReveal, teardownLayoutReveal } from '../src/webview/lib/layout-reveal';

function createRoot(hasRevealElements = true) {
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
      return selector === '[data-reveal]' && hasRevealElements ? [first, second] : [];
    },
  } as unknown as ParentNode;

  return { root, first, second };
}

function installIntersectionObserverMock() {
  const instances: Array<{
    callback: IntersectionObserverCallback;
    observe: ReturnType<typeof vi.fn>;
    unobserve: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    observer: IntersectionObserver;
  }> = [];

  const observer = vi.fn(
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();

      constructor(callback: IntersectionObserverCallback) {
        const instance = {
          callback,
          observe: this.observe,
          unobserve: this.unobserve,
          disconnect: this.disconnect,
          observer: this as unknown as IntersectionObserver,
        };
        instances.push(instance);
      }
    },
  );

  vi.stubGlobal('IntersectionObserver', observer);

  return { observer, instances };
}

describe('layout reveal helper', () => {
  afterEach(() => {
    teardownLayoutReveal();
    vi.unstubAllGlobals();
  });

  it('observes reveal elements and marks each visible when it intersects', () => {
    const { root, first, second } = createRoot();

    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const { instances } = installIntersectionObserverMock();

    setupLayoutReveal(root);

    expect(instances[0].observe).toHaveBeenCalledTimes(2);
    instances[0].callback(
      [
        { isIntersecting: true, target: first as unknown as Element },
        { isIntersecting: false, target: second as unknown as Element },
      ] as IntersectionObserverEntry[],
      instances[0].observer,
    );

    expect(first.classList.added).toEqual(['is-visible']);
    expect(second.classList.added).toEqual([]);
    expect(instances[0].unobserve).toHaveBeenCalledWith(first);
    expect(instances[0].disconnect).not.toHaveBeenCalled();
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
  });

  it('disconnects the previous observer before repeated setup', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const { instances } = installIntersectionObserverMock();

    setupLayoutReveal(createRoot().root);
    setupLayoutReveal(createRoot().root);

    expect(instances).toHaveLength(2);
    expect(instances[0].disconnect).toHaveBeenCalledTimes(1);
    expect(instances[1].disconnect).not.toHaveBeenCalled();
  });

  it('disconnects the previous observer when no reveal elements are found', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const { instances } = installIntersectionObserverMock();

    setupLayoutReveal(createRoot().root);
    setupLayoutReveal(createRoot(false).root);

    expect(instances).toHaveLength(1);
    expect(instances[0].disconnect).toHaveBeenCalledTimes(1);
  });

  it('shows reveal elements immediately when IntersectionObserver is missing', () => {
    const { root, first, second } = createRoot();

    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal('IntersectionObserver', undefined);

    setupLayoutReveal(root);

    expect(first.classList.added).toEqual(['is-visible']);
    expect(second.classList.added).toEqual(['is-visible']);
  });

  it('disconnects the active observer during teardown', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const { instances } = installIntersectionObserverMock();

    setupLayoutReveal(createRoot().root);
    teardownLayoutReveal();
    teardownLayoutReveal();

    expect(instances[0].disconnect).toHaveBeenCalledTimes(1);
  });
});
