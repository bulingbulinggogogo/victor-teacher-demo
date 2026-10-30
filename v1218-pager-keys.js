/* V1.2.18: Up/Down reuse the active teaching popup's existing page controls. */
(() => {
  'use strict';
  if (window.V18PopupPagerKeys) return;
  const teachingDialogs = new Set(['popover', 'wordDetailDialog', 'lexicalChunkDialog']);
  const blockedTarget = 'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="slider"],video,audio';
  function visible(element) {
    if (!element || element.closest('.hidden,[hidden],[inert],[aria-hidden="true"]')) return false;
    const style = getComputedStyle(element), rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  }
  function topDialog() {
    const candidates = [...document.querySelectorAll('[role="dialog"],[aria-modal="true"],#popover')].filter(visible);
    candidates.sort((a, b) => {
      if (a.contains(b)) return -1;
      if (b.contains(a)) return 1;
      const aZ = Number.parseInt(getComputedStyle(a).zIndex, 10) || 0;
      const bZ = Number.parseInt(getComputedStyle(b).zIndex, 10) || 0;
      return aZ - bZ || (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    });
    return candidates.at(-1) || null;
  }
  function activePager(event) {
    if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return null;
    const target = event.target instanceof Element ? event.target : document.activeElement;
    if (target?.closest(blockedTarget)) return null;
    const dialog = topDialog();
    if (!dialog || !teachingDialogs.has(dialog.id)) return null;
    const targetDialog = target?.closest('[role="dialog"],[aria-modal="true"],#popover');
    if (targetDialog && targetDialog !== dialog) return null;
    // Topic practice owns Up/Down: reveal items first, then advance its real stage/page.
    if ([...dialog.querySelectorAll('.tc-practice')].some(visible)) return null;
    const fullscreen = document.fullscreenElement;
    if (fullscreen && (fullscreen.matches('video,.v15-video-player,.resource-image-frame') || fullscreen.closest('.resource-image-frame') || !fullscreen.contains(dialog))) return null;
    // Dormant thumbnail video players remain in the DOM; only an active fallback blocks paging.
    if ([...document.querySelectorAll('.v15-video-fallback')].some(visible)) return null;
    return [...dialog.querySelectorAll('.resource-popover-pager')].find(visible) || null;
  }
  document.addEventListener('keydown', event => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    const pager = activePager(event);
    if (!pager) return;
    const button = pager.querySelector(event.key === 'ArrowDown' ? '[data-resource-page-next]' : '[data-resource-page-prev]');
    if (!visible(button)) return;
    // Also consume the first/last boundary key so the underlying question never advances.
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!button.disabled && button.getAttribute('aria-disabled') !== 'true') button.click();
  }, true);
  window.V18PopupPagerKeys = { activeDialog: () => topDialog()?.id || null };
})();
