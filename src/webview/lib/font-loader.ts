export function isFontLoaded(family: string): boolean {
  return document.querySelector(`link[data-gfont="${family}"]`) !== null;
}

// `family` values must use `+` for spaces (e.g. "Playfair+Display") — Google Fonts CSS API v2 format.
export function loadGoogleFont(family: string): void {
  if (isFontLoaded(family)) return;

  const encoded = family.replace(/ /g, '+');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.dataset.gfont = family;
  link.href = `https://fonts.googleapis.com/css2?family=${encoded}&display=swap`;
  document.head.appendChild(link);
}
