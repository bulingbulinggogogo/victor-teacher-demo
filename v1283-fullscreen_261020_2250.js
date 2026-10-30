/* One question heading follows the active functional fullscreen session.
 * Original panels, media, reveal models and the shared Back/settings dock stay mounted. */
(() => {
  'use strict';
  if (window.V1281Fullscreen) return;
  let frame = 0;
  function questionFor(detail) {
    const moduleId = detail.dataset.v1263InteractiveModule || detail.querySelector('[data-word-module][aria-selected="true"]')?.dataset.wordModule;
    const panel = detail.querySelector('.vwn-panel:not([hidden])');
    const graph = panel?.querySelector('[data-graph-key]');
    const word = graph?.dataset.graphKey || detail.dataset.latestWordHead?.replace(/\d+$/, '') || '这个词';
    if (moduleId === 'illustrations') {
      const basic = panel?.querySelector('.v1279-basic-meaning')?.textContent.trim();
      return basic ? `“${basic}”怎样串起 ${word} 的不同意思？` : `${word} 的不同意思是怎样联系起来的？`;
    }
    if (moduleId === 'nominalization') return `${word} 怎样从名词变成动词？`;
    if (moduleId === 'contrast') {
      if (word === 'hit') return '同样是“打”，beat、hit、strike 有什么不同？';
      const words = [...panel.querySelectorAll('.pgi-card')].map(card => card.querySelector('[data-pgi-line]')?.textContent.trim().split(/\s/)[0]).filter(Boolean);
      return words.length > 1 ? `${words.join('、')} 的用法有什么不同？` : `${word} 和近义词的用法有什么不同？`;
    }
    const questions = {formation:`${word} 的词形怎样帮助理解词义？`, etymology:`${word} 的词源里藏着什么线索？`, family:`${word} 的词族怎样联系起来？`, network:`${word} 的词义怎样联系起来？`, frequency:`${word} 在不同语境中有多常见？`, exam:`高考怎样考查 ${word}？`, textbook:`教材怎样使用 ${word}？`, meanings:`${word} 有哪些常见意思？`};
    return questions[moduleId] || `怎样理解和使用 ${word}？`;
  }
  function refresh() {
    frame = 0;
    document.querySelectorAll('#wordDetailDialog').forEach(detail => {
      const active = detail.classList.contains('v1263-interactive-fullscreen');
      let header = detail.querySelector(':scope > .v1281-fullscreen-heading');
      if (!active) { if (header && !header.hidden) header.hidden = true; return; }
      if (!header) {
        header = document.createElement('header'); header.className = 'v1281-fullscreen-heading';
        const heading = document.createElement('h2'); heading.id = 'v1281-fullscreen-question';
        header.append(heading); detail.insertBefore(header, detail.querySelector(':scope > .resource-popover-body'));
      }
      if (header.hidden) header.hidden = false;
      const heading = header.firstElementChild, text = questionFor(detail);
      if (heading.textContent !== text) heading.textContent = text;
      const moduleId = detail.dataset.v1263InteractiveModule || '';
      if (header.dataset.module !== moduleId) header.dataset.module = moduleId;
    });
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(refresh); }
  new MutationObserver(schedule).observe(document.body, {subtree:true, childList:true, attributes:true, attributeFilter:['class','hidden','aria-selected','data-v1263-interactive-module','data-latest-word-head']});
  window.addEventListener('resize', schedule);
  window.addEventListener('v1213-word-mounted', schedule);
  window.V1281Fullscreen = Object.freeze({refresh:schedule, questionFor});
  schedule();
})();
