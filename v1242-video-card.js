/* The approved D entry card reuses the original V15 trigger and duration.
   Playback, media sources, native events and the independent player stay V15-owned. */
(() => {
  'use strict';
  if (window.V1242VideoCard) return;
  const types = new Set(['词汇','语音','语法','微技能','百科知识','话题词汇','实用表达']);
  const selector = 'button.v15-video-thumbnail';
  let popup = null, observer = null, frame = 0;

  function enhance(button) {
    const preview = button.querySelector(':scope > .v15-video-preview');
    const info = button.querySelector(':scope > .v15-video-info');
    const duration = info?.querySelector(':scope > time');
    const play = button.querySelector('.v15-video-play-icon');
    if (!preview || !info || !duration || !play) return;
    let clock = info.querySelector(':scope > .v1242-video-clock');
    if (!clock) {
      clock = document.createElementNS('http://www.w3.org/2000/svg','svg');
      clock.classList.add('v1242-video-clock');
      clock.setAttribute('viewBox','0 0 20 20');
      clock.setAttribute('aria-hidden','true');
      clock.setAttribute('focusable','false');
      clock.innerHTML = '<circle cx="10" cy="10" r="7.25"/><path d="M10 5.8v4.5l3.1 1.8"/>';
      info.insertBefore(clock,duration);
    }
    if (play.parentElement !== info) info.append(play);
    if (!button.classList.contains('v1242-video-card')) button.classList.add('v1242-video-card');
  }

  function update() {
    frame = 0;
    if (!popup || !types.has(popup.dataset.knowledgeType)) return;
    popup.querySelectorAll(selector).forEach(enhance);
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  function attach() {
    const host = document.getElementById('popover');
    if (!host) return;
    if (host !== popup) {
      observer?.disconnect();
      popup = host;
      observer = new MutationObserver(records => {
        const relevant = records.some(record => record.type === 'attributes' ? record.target === popup :
          record.target.closest?.(selector) || [...record.addedNodes].some(node => node.nodeType === 1 &&
            (node.matches(selector) || node.querySelector(selector))));
        if (relevant) schedule();
      });
      observer.observe(popup,{childList:true,subtree:true,attributes:true,attributeFilter:['data-knowledge-type']});
    }
    schedule();
  }
  window.V1242VideoCard = Object.freeze({
    refresh:attach,
    inspect:() => [...(popup?.querySelectorAll(selector) || [])].map(button => ({
      type:popup.dataset.knowledgeType,
      applied:button.classList.contains('v1242-video-card'),
      width:button.getBoundingClientRect().width,
      height:button.getBoundingClientRect().height,
      clockCount:button.querySelectorAll('.v1242-video-clock').length,
      playInBar:button.querySelector('.v15-video-play-icon')?.parentElement === button.querySelector(':scope > .v15-video-info'),
      duration:button.querySelector(':scope > .v15-video-info > time')?.textContent || ''
    }))
  });
  attach();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',attach,{once:true});
})();
