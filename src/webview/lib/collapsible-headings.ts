import { loadState, saveState } from '../stores/state';

/**
 * Setup collapsible headings.
 * Click on h2/h3 to collapse/expand content until next heading of same or higher level.
 */
export function setupCollapsibleHeadings() {
  const state = loadState();
  const collapsed = new Set(state.collapsedHeadings);

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // Only h2 and h3 are collapsible
    if (!target.matches('.markdown-body h2, .markdown-body h3')) return;

    const id = target.id;
    if (!id) return;

    const isCollapsed = target.classList.contains('collapsed');

    if (isCollapsed) {
      // Expand
      target.classList.remove('collapsed');
      collapsed.delete(id);
      toggleSiblings(target, false);
    } else {
      // Collapse
      target.classList.add('collapsed');
      collapsed.add(id);
      toggleSiblings(target, true);
    }

    saveState({ collapsedHeadings: Array.from(collapsed) });
  });

  // Restore collapsed state after content update
  restoreCollapsedState(collapsed);
}

/**
 * Restore collapsed state after HTML update.
 */
export function restoreCollapsedState(collapsedIds?: Set<string>) {
  const state = loadState();
  const collapsed = collapsedIds || new Set(state.collapsedHeadings);

  for (const id of collapsed) {
    const heading = document.getElementById(id);
    if (heading) {
      heading.classList.add('collapsed');
      toggleSiblings(heading, true);
    }
  }
}

function toggleSiblings(heading: HTMLElement, hide: boolean) {
  const level = parseInt(heading.tagName[1]);
  let sibling = heading.nextElementSibling;

  while (sibling) {
    // Stop at same or higher level heading
    if (sibling.matches('h1, h2, h3, h4, h5, h6')) {
      const sibLevel = parseInt(sibling.tagName[1]);
      if (sibLevel <= level) break;
    }

    if (hide) {
      (sibling as HTMLElement).style.display = 'none';
    } else {
      (sibling as HTMLElement).style.display = '';
    }

    sibling = sibling.nextElementSibling;
  }
}
