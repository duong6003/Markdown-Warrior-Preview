import { postMessage } from './message-bridge';

/**
 * Setup click handler for interactive task checkboxes.
 * Delegates to the extension host to modify the source file.
 */
export function setupCheckboxHandler() {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    if (target.classList.contains('task-checkbox')) {
      e.preventDefault();
      const line = parseInt(target.getAttribute('data-line') || '0');
      const checked = !(target as HTMLInputElement).checked;

      postMessage({
        type: 'checkboxToggle',
        line,
        checked,
      });
    }
  });
}
