/* Polysemy reveal keys own only the currently visible teaching diagram. */
(() => {
  'use strict';
  if (window.V19PolysemyKeys) return;
  const dialogIds=new Set(['wordDetailDialog','lexicalChunkDialog','popover']);
  const editable='input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="slider"],video,audio';
  function visible(node) {
    if (!node || node.closest('.hidden,[hidden],[inert],[aria-hidden="true"]')) return false;
    const style=getComputedStyle(node),rect=node.getBoundingClientRect();
    return style.display!=='none' && style.visibility!=='hidden' && rect.width>0 && rect.height>0;
  }
  function topDialog() {
    const dialogs=[...document.querySelectorAll('[role="dialog"],[aria-modal="true"],#popover')].filter(visible);
    dialogs.sort((a,b)=>{
      if(a.contains(b)) return -1;
      if(b.contains(a)) return 1;
      const order=(parseInt(getComputedStyle(a).zIndex,10)||0)-(parseInt(getComputedStyle(b).zIndex,10)||0);
      return order || (a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    });
    return dialogs.at(-1) || null;
  }
  function activeRoot(event) {
    if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return null;
    const target=event.target instanceof Element ? event.target : document.activeElement;
    if(target?.closest(editable)) return null;
    const dialog=topDialog();
    if(!dialog || !dialogIds.has(dialog.id) || !visible(document.getElementById('fullscreenPage'))) return null;
    const owner=target?.closest('[role="dialog"],[aria-modal="true"],#popover');
    if(owner && owner!==dialog) return null;
    const fullscreen=document.fullscreenElement;
    if(fullscreen && (fullscreen.matches('video,.v15-video-player,.resource-image-frame') || fullscreen.closest('.resource-image-frame') || !fullscreen.contains(dialog))) return null;
    if([...document.querySelectorAll('.v15-video-fallback')].some(visible)) return null;
    if([...dialog.querySelectorAll('.tc-practice')].some(visible)) return null;
    return [...dialog.querySelectorAll('.pgi-module[data-graph-kind="polysemy"]')].some(visible) ? dialog : null;
  }
  // Window capture precedes the general popup pager and lecture handlers.
  window.addEventListener('keydown',event=>{
    if(event.key!=='ArrowUp' && event.key!=='ArrowDown') return;
    const root=activeRoot(event);if(!root) return;
    if(!window.V1213Illustrations?.step?.(root,event.key==='ArrowDown' ? 1 : -1)) return;
    event.preventDefault();event.stopImmediatePropagation();
  },true);
  window.V19PolysemyKeys={activeDialog:()=>topDialog()?.id || null};
})();
