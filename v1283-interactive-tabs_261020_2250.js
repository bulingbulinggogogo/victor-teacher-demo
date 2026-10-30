/* Functional word tabs use the existing expanded detail and shared classroom
 * dock. Only presentation is owned here; original module nodes and reveal models
 * remain mounted, including when returning to the selected word tab. */
(() => {
  'use strict';
  const navigation = window.WordDetailNavigation;
  if (!navigation?.select || window.V1263InteractiveTabs) return;

  const fullClass = 'v1263-interactive-fullscreen';
  const functional = Object.freeze({ illustrations: '[data-graph-kind="polysemy"]', nominalization: '[data-graph-kind="nominalization"]', contrast: '[data-graph-kind="contrast"]' });
  const sessions = new WeakMap();
  let active = null;
  const detailFor = node => node?.closest?.('#wordDetailDialog');
  const tabFor = (detail, id) => [...detail.querySelectorAll('[data-word-module]')].find(button => button.dataset.wordModule === id);
  const panelFor = (detail, button) => {
    const id = button?.getAttribute('aria-controls');
    return id ? [...detail.querySelectorAll('.vwn-panel')].find(panel => panel.id === id) : null;
  };
  function available(detail, button) {
    const selector = functional[button?.dataset.wordModule];
    const panel = panelFor(detail, button);
    return selector && panel?.querySelector(selector) ? panel : null;
  }
  function refresh(detail) {
    window.WordDetailNavigation?.fit?.();
    window.V1247PolysemyControls?.refresh?.();
    window.V1223WordDock?.refresh?.(detail);
    window.ClassroomTools?.refresh?.();
  }
  function classify(detail) {
    if (!detail) return;
    detail.querySelectorAll('[data-word-module]').forEach(button => {
      const isFunctional = Boolean(available(detail, button));
      if (isFunctional) button.dataset.v1263FunctionalTab = 'true';
      else if (button.hasAttribute('data-v1263-functional-tab')) button.removeAttribute('data-v1263-functional-tab');
    });
  }
  function visible(node) {
    if (!node?.isConnected || node.closest('[hidden],.hidden,[inert],[aria-hidden="true"]')) return false;
    const style = getComputedStyle(node);
    return style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length > 0;
  }
  function topDialog() {
    return [...document.querySelectorAll('[role="dialog"],[aria-modal="true"],#popover')].filter(visible).sort((a, b) => {
      if (a.contains(b)) return -1;
      if (b.contains(a)) return 1;
      return (parseInt(getComputedStyle(a).zIndex, 10) || 0) - (parseInt(getComputedStyle(b).zIndex, 10) || 0)
        || (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    }).at(-1) || null;
  }
  function focusModule(session) {
    if (active !== session || !session.detail.isConnected) return;
    const target = [...session.panel.querySelectorAll('button:not(:disabled),[tabindex="0"]')].find(visible);
    if (target) target.focus({preventScroll:true});
    else {
      session.panel.tabIndex = -1;
      session.panel.focus({preventScroll:true});
    }
  }
  function enter(detail, button) {
    if (!detail?.isConnected || !button || button.hidden || button.disabled) return false;
    const panel = available(detail, button);
    if (!panel || button.getAttribute('aria-selected') !== 'true') return false;
    if (active?.detail === detail && active.button === button) return true;
    if (active) leave(active.detail, false);
    const body = detail.querySelector(':scope > .resource-popover-body');
    const session = {detail, button, panel, body, scrollTop:body?.scrollTop || 0, scrollLeft:body?.scrollLeft || 0,
      wasExpanded:detail.classList.contains('ke-expanded'), panelTabIndex:panel.getAttribute('tabindex')};
    sessions.set(detail, session); active = session;
    detail.classList.add('ke-expanded', fullClass);
    detail.dataset.v1263InteractiveModule = button.dataset.wordModule;
    if (body) { body.scrollTop = 0; body.scrollLeft = 0; }
    refresh(detail);
    requestAnimationFrame(() => focusModule(session));
    return true;
  }
  function leave(detail = active?.detail, restoreFocus = true) {
    const session = detail && sessions.get(detail);
    if (!session) return false;
    sessions.delete(detail);
    if (active === session) active = null;
    detail.classList.remove(fullClass);
    detail.classList.toggle('ke-expanded', session.wasExpanded);
    delete detail.dataset.v1263InteractiveModule;
    if (session.panelTabIndex === null) session.panel.removeAttribute('tabindex');
    else session.panel.setAttribute('tabindex', session.panelTabIndex);
    refresh(detail);
    requestAnimationFrame(() => {
      if (!detail.isConnected || sessions.has(detail)) return;
      if (session.body) { session.body.scrollTop = session.scrollTop; session.body.scrollLeft = session.scrollLeft; }
      if (restoreFocus && visible(session.button)) session.button.focus({preventScroll:true});
    });
    return true;
  }

  // Capture sees native pointer/Enter/Space clicks and the existing tablist's
  // Arrow/Home/End .click(). Enter only after the original select has completed.
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-word-module]');
    const detail = detailFor(button);
    if (!detail || !functional[button.dataset.wordModule]) return;
    requestAnimationFrame(() => { classify(detail); enter(detail, button); });
  }, true);
  // Existing return and close controls first return to the underlying selected
  // tab. They keep their original handlers for the following ordinary close.
  window.addEventListener('click', event => {
    const session = active;
    if (!session || !session.detail.contains(event.target)) return;
    const back = event.target.closest?.('.classroom-modal-back,[data-word-detail-close]');
    if (!back) return;
    event.preventDefault(); event.stopImmediatePropagation();
    leave(session.detail);
  }, true);
  window.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing || !active) return;
    if (!visible(active.detail) || topDialog() !== active.detail) return;
    // Media expansion keeps its original Escape owner above the module view.
    if (document.fullscreenElement || [...document.querySelectorAll('.v15-video-fallback')].some(visible)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    leave(active.detail);
  }, true);

  window.addEventListener('v1213-word-mounted', event => classify(event.detail));
  const details = window.V1220WordDetail;
  if (details?.finish) {
    const finish = details.finish;
    details.finish = function(detail) {
      const result = finish.apply(this, arguments);
      classify(detail);
      return result;
    };
  }
  new MutationObserver(() => {
    if (active && (!active.detail.isConnected || !active.button.isConnected || active.button.getAttribute('aria-selected') !== 'true')) leave(active.detail, false);
  }).observe(document.body, {subtree:true,childList:true,attributes:true,attributeFilter:['aria-selected']});
  classify(document.getElementById('wordDetailDialog'));
  window.V1263InteractiveTabs = Object.freeze({
    enter: (detail, id) => enter(detail, tabFor(detail, id)), leave,
    inspect: (detail = document.getElementById('wordDetailDialog')) => {
      if (!detail) return null;
      const session = sessions.get(detail);
      return {active:Boolean(session), module:session?.button.dataset.wordModule || null,
        selected:detail.querySelector('[data-word-module][aria-selected="true"]')?.dataset.wordModule || null,
        functionalTabs:[...detail.querySelectorAll('[data-v1263-functional-tab="true"]')].map(button => button.dataset.wordModule),
        samePanel:session ? panelFor(detail, session.button) === session.panel : null,
        sharedDockCount:document.querySelectorAll('#classroomDock').length,
        side:detail.dataset.classroomToolsSide || null};
    }
  });
})();
