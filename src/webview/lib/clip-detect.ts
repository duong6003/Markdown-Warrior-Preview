export function clipDetect(
  node: HTMLElement,
  onUpdate: (needsClip: boolean) => void,
): { destroy: () => void } {
  const check = () => {
    const threshold = Math.max(globalThis.innerHeight * 0.65, 640);
    onUpdate(node.scrollHeight > threshold);
  };
  const ro = new ResizeObserver(check);
  ro.observe(node);
  globalThis.addEventListener('resize', check);
  check();
  return {
    destroy: () => {
      ro.disconnect();
      globalThis.removeEventListener('resize', check);
    },
  };
}
