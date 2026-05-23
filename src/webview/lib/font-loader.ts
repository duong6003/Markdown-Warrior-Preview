export function isFontLoaded(family: string): boolean {
  return document.querySelector(`link[data-gfont="${family}"]`) !== null;
}

export function loadGoogleFont(family: string): void {
  if (isFontLoaded(family)) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.dataset.gfont = family;
  link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
  document.head.appendChild(link);
}
