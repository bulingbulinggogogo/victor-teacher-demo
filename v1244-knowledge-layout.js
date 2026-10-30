/* V49: encyclopedia, micro-skill and speech prose is directly visible.
   Native paging, expansion, close and media handlers keep their owners. */
(() => {
  'use strict';
  if (window.V1244KnowledgeLayout) return;
  const popup = document.getElementById('popover');
  if (!popup) return;
  const directTypes = new Set(['百科知识','微技能','语音']);
  const resourceSelector = '.ke-resource-content[data-knowledge-type]';
  const copySelector = '.resource-markup-copy,.knowledge-explanation,.pronunciation-notes';
  const allSelector = '[data-knowledge-all]';
  let pending = false;

  function ownerFor(node) {
    const resource = node?.closest?.(resourceSelector);
    if (resource) return directTypes.has(resource.dataset.knowledgeType) ? resource : null;
    return node && popup.contains(node) && directTypes.has(popup.dataset.knowledgeType) ? popup : null;
  }
  function resources() {
    const rows = [...popup.querySelectorAll(resourceSelector)];
    return rows.length ? rows.filter(row => directTypes.has(row.dataset.knowledgeType)) :
      directTypes.has(popup.dataset.knowledgeType) ? [popup] : [];
  }
  function showDirectly(resource) {
    let changed = false;
    resource.querySelectorAll(copySelector).forEach(node => {
      if (ownerFor(node) === resource && node.hidden) { node.hidden = false; changed = true; }
    });
    resource.querySelectorAll(allSelector).forEach(button => {
      if (ownerFor(button) !== resource) return;
      // Disable before detaching, so an old focused node or retained reference
      // cannot activate its original hidden-state callback with Enter/Space.
      button.disabled = true;
      button.tabIndex = -1;
      button.remove();
      changed = true;
    });
    return changed;
  }
  function refresh() {
    let changed = false;
    resources().forEach(resource => { if (showDirectly(resource)) changed = true; });
    // The original cleanup removes reservations for detached controls and then
    // measures the surviving pager/close/media footer, without an empty slot.
    if (changed) window.ClassroomTools?.refresh?.();
    return changed;
  }
  function schedule() {
    if (pending) return;
    pending = true;
    queueMicrotask(() => { pending = false; refresh(); });
  }
  function blockRemovedAction(event) {
    const button = event.target?.closest?.(allSelector);
    const owner = button && ownerFor(button);
    if (!owner) return;
    if (event.type === 'keydown' && !['Enter',' ','Spacebar'].includes(event.key)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (showDirectly(owner)) window.ClassroomTools?.refresh?.();
  }
  // Most controls disappear synchronously after native binding. Capture also
  // covers a newly inserted legacy control before the mutation callback runs.
  popup.addEventListener('click',blockRemovedAction,true);
  popup.addEventListener('keydown',blockRemovedAction,true);
  if (typeof bindResourcePopoverInteractions === 'function') {
    const originalBind = bindResourcePopoverInteractions;
    bindResourcePopoverInteractions = function knowledgeDirectVisibility() {
      const result = originalBind.apply(this,arguments);
      refresh();
      return result;
    };
  }
  new MutationObserver(schedule).observe(popup,{
    subtree:true,childList:true,attributes:true,
    attributeFilter:['hidden','data-knowledge-type']
  });
  window.V1244KnowledgeLayout = Object.freeze({
    refresh,
    inspect:() => resources().map(resource => ({
      type:resource.dataset.knowledgeType || popup.dataset.knowledgeType,
      expanded:popup.classList.contains('ke-expanded'),
      hiddenCopy:[...resource.querySelectorAll(copySelector)].filter(node => ownerFor(node) === resource && node.hidden).length,
      allControls:[...resource.querySelectorAll(allSelector)].filter(node => ownerFor(node) === resource).length
    }))
  });
  refresh();
})();
