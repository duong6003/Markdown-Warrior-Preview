import mermaid from 'mermaid';

let initialized = false;

function initMermaid() {
  if (initialized) return;

  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      primaryColor: '#4fc1ff',
      primaryTextColor: '#d4d4d4',
      primaryBorderColor: '#4fc1ff',
      lineColor: '#8b8b8b',
      secondaryColor: '#252526',
      tertiaryColor: '#2d2d30',
      background: '#1e1e1e',
      mainBkg: '#252526',
      nodeBorder: '#4fc1ff',
    },
    fontFamily: 'var(--md-font-body)',
    fontSize: 14,
  });

  initialized = true;
}

/**
 * Render all mermaid blocks in the document.
 * Called after HTML is injected into the DOM.
 */
export async function renderMermaidBlocks() {
  initMermaid();

  const blocks = document.querySelectorAll('.mermaid-block');

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i] as HTMLElement;
    const code = block.getAttribute('data-mermaid');

    if (!code || block.querySelector('svg')) continue; // already rendered

    try {
      const id = `mermaid-${i}-${Date.now()}`;
      const { svg } = await mermaid.render(id, code);
      block.innerHTML = svg;
    } catch (err) {
      block.innerHTML = `<div class="mermaid-loading">Mermaid diagram error: ${String(err)}</div>`;
    }
  }
}
