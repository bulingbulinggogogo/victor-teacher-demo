/* Shared lecture labels: sidebar two lines; headings use a separating space. */
(() => {
  'use strict';
  let queued = false;
  function listeningLabel(target, count, sidebar, allExams = false) {
    const unit=allExams ? '条' : '次', title='高考真题';
    const signature = `${title}|${count}|${sidebar ? 'sidebar' : 'heading'}`;
    if (!target || (target.dataset.v1225ListeningLabel === signature && target.querySelector('.v1224-listening-count')?.textContent === `${count}${unit}`)) return;
    const name = document.createElement('span');
    name.className = 'v1225-listening-name'; name.textContent = title;
    const number = document.createElement('span');
    number.className = 'v1224-listening-count'; number.textContent = `${count}${unit}`;
    target.replaceChildren(name, document.createTextNode(sidebar ? '\n' : ' '), number);
    target.classList.toggle('v1225-listening-sidebar', sidebar);
    target.dataset.v1225ListeningLabel = signature;
  }
  function update() {
    queued = false;
    document.querySelectorAll('.v1223-word-dock-owner').forEach(detail => {
      const button = detail.querySelector('[data-word-module="cases"]');
      if (!button) return;
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      const count = panel?.querySelectorAll('.ke-exam-case').length || 0;
      if (!count) return;
      let label = button.querySelector(':scope > .v1223-word-label');
      if (!label) { label = document.createElement('span'); label.className = 'v1223-word-label'; button.replaceChildren(label); }
      button.querySelectorAll('.vwn-count').forEach(node => node.remove());
      const allExams=detail.dataset.v1227ExamScope === "all-gaokao";
      listeningLabel(label, count, Boolean(button.closest('#classroomDock')), allExams);
      const accessible = `${"高考真题"} ${count}${allExams ? "条" : "次"}`;
      if (button.getAttribute('aria-label') !== accessible) button.setAttribute('aria-label', accessible);
      panel.querySelectorAll(':scope > .vwn-panel-title,[data-case-module="cases"] > h3,.ke-exam-cases > .ke-section-title').forEach(title => listeningLabel(title, count, false, allExams));
    });
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  new MutationObserver(schedule).observe(document.body, {childList: true, subtree: true});
  window.addEventListener('v1213-word-mounted', schedule);
  window.addEventListener('resize', schedule);
  window.V1224Navigation = { refresh: update };
  schedule();
})();
