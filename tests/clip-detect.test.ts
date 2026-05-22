import { clipDetect } from '../src/webview/lib/clip-detect';

describe('clipDetect action', () => {
  let observeCallback: (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;
  let observe: ReturnType<typeof vi.fn>;
  let resizeCallback: () => void;
  let removeResizeCallback: () => void;
  let disconnected: boolean;

  beforeEach(() => {
    observe = vi.fn();
    resizeCallback = vi.fn();
    removeResizeCallback = vi.fn();
    disconnected = false;
    vi.stubGlobal('ResizeObserver', class {
      constructor(cb: typeof observeCallback) {
        observeCallback = cb;
      }
      observe = observe;
      disconnect() {
        disconnected = true;
      }
    });
    vi.stubGlobal('innerHeight', 1000);
    vi.stubGlobal('addEventListener', vi.fn((event: string, cb: () => void) => {
      if (event === 'resize') {
        resizeCallback = cb;
      }
    }));
    vi.stubGlobal('removeEventListener', vi.fn((event: string, cb: () => void) => {
      if (event === 'resize') {
        removeResizeCallback = cb;
      }
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls onUpdate(false) immediately when scrollHeight is below threshold', () => {
    const node = { scrollHeight: 300 } as HTMLElement;
    const onUpdate = vi.fn();
    clipDetect(node, onUpdate);
    expect(observe).toHaveBeenCalledWith(node);
    expect(onUpdate).toHaveBeenCalledWith(false);
  });

  it('calls onUpdate(true) immediately when scrollHeight exceeds threshold', () => {
    // innerHeight=1000 -> threshold = max(650, 640) = 650
    const node = { scrollHeight: 700 } as HTMLElement;
    const onUpdate = vi.fn();
    clipDetect(node, onUpdate);
    expect(onUpdate).toHaveBeenCalledWith(true);
  });

  it('uses 640px minimum threshold when 65vh is smaller', () => {
    vi.stubGlobal('innerHeight', 800); // 65% = 520 < 640 -> threshold = 640
    const node = { scrollHeight: 620 } as HTMLElement;
    const onUpdate = vi.fn();
    clipDetect(node, onUpdate);
    expect(onUpdate).toHaveBeenCalledWith(false); // 620 <= 640
  });

  it('re-evaluates on resize and calls onUpdate with updated verdict', () => {
    const node = { scrollHeight: 300 } as HTMLElement;
    const onUpdate = vi.fn();
    clipDetect(node, onUpdate);
    onUpdate.mockClear();

    (node as any).scrollHeight = 700;
    observeCallback([], {} as ResizeObserver);

    expect(onUpdate).toHaveBeenCalledWith(true);
  });

  it('uses current viewport height when re-evaluating on resize', () => {
    const node = { scrollHeight: 700 } as HTMLElement;
    const onUpdate = vi.fn();
    clipDetect(node, onUpdate);
    onUpdate.mockClear();

    vi.stubGlobal('innerHeight', 1200); // 65% = 780, so 700 no longer needs clipping
    observeCallback([], {} as ResizeObserver);

    expect(onUpdate).toHaveBeenCalledWith(false);
  });

  it('re-evaluates on viewport resize when the element size is unchanged', () => {
    const node = { scrollHeight: 700 } as HTMLElement;
    const onUpdate = vi.fn();
    clipDetect(node, onUpdate);
    onUpdate.mockClear();

    vi.stubGlobal('innerHeight', 1200); // 65% = 780, so 700 no longer needs clipping
    resizeCallback();

    expect(onUpdate).toHaveBeenCalledWith(false);
  });

  it('returns a destroy function that disconnects the observer', () => {
    const node = { scrollHeight: 100 } as HTMLElement;
    const { destroy } = clipDetect(node, vi.fn());
    destroy();
    expect(disconnected).toBe(true);
    expect(removeResizeCallback).toBe(resizeCallback);
  });
});
