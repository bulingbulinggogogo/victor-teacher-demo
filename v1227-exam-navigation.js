/* The current word's exam examples and a single 100% question-type bar share one page. */
(() => {
  'use strict';
  const api = window.V1220WordDetail;
  if (!api?.finish) return;
  const esc = value => escapeHtml(String(value ?? ''));
  const models = new WeakMap();
  const typeLabel = value => value === '阅读' ? '阅读理解' : value;
  const starredExampleKeys = Object.freeze(['latest-example:present高考例句:14','latest-example:present高考例句:15']);
  const starredExamples = new Set(starredExampleKeys);
  function exampleEndMark(row, kind, attributes = '') {
    if (kind !== 'listening' || !/(?:^|\s)data-latest-example=/.test(attributes) || !starredExamples.has(String(row?.exampleKey || ''))) return '';
    return `<svg class="v1238-exam-example-star" data-v1238-exam-star="${esc(row.exampleKey)}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m12 2.4 2.97 6.02 6.64.96-4.8 4.68 1.13 6.61L12 17.55l-5.94 3.12 1.13-6.61-4.8-4.68 6.64-.96Z"/></svg>`;
  }
  function mount(detail, model) {
    if (!model?.word || models.has(detail)) return;
    const main = detail.querySelector('[data-word-module="cases"]');
    const panel = main && document.getElementById(main.getAttribute('aria-controls'));
    const list = panel?.querySelector('.ke-exam-cases');
    const charts = window.V1227ExamDistribution;
    if (!list || !charts) return;
    const records = charts.sourceRows(model.word, model.options?.item, model.options?.retainedCases || []);
    if (!records.length) return;
    const byKey = new Map(records.map(row => [String(row.exampleKey || ''), row]));
    const typeOrder = charts.questionTypes;
    // Only categories with source records are shown; counts never change the teaching order.
    const rank = label => { const index = typeOrder.indexOf(label); return index < 0 ? typeOrder.length : index; };
    const entries = charts.grouped(records, 'questionType').sort((a,b) => rank(a.label)-rank(b.label));
    const denominator = records.length;
    const percentage = count => Number((count / denominator * 100).toFixed(1)) + '%';
    const distribution = document.createElement('section');
    distribution.className = 'v1227-exam-distribution v1228-chart-group';
    distribution.dataset.v1227ExamView = 'distribution';
    distribution.dataset.examDenominator = String(denominator);
    const proportionStrip = `<div class="v1263-exam-proportion-strip" aria-hidden="true">${entries.map((entry,index) => `<span data-v1263-exam-proportion="${esc(entry.label)}" style="flex:0 0 ${entry.count / denominator * 100}%;--v1227-slice-color:var(--v1227-chart-color-${index%10})"></span>`).join('')}</div>`;
    distribution.innerHTML = `<header class="v1228-chart-heading"><h4>题型分布</h4><span class="v1228-chart-source-count">已收录 ${denominator} 条例句</span></header>${proportionStrip}<div class="v1227-exam-type-stack" role="tablist" aria-label="全部已收录例句的题型占比">${entries.map((entry,index) => `<button type="button" role="tab" class="v1227-stat-bar-row v1227-exam-type-segment" data-v1227-exam-type="${esc(entry.label)}" aria-controls="${esc(panel.id)}" aria-selected="false" aria-pressed="false" tabindex="${index===0?0:-1}" aria-label="${esc(typeLabel(entry.label))}，${entry.count}条，占${percentage(entry.count)}" style="flex:0 0 ${entry.count / denominator * 100}%;--v1227-slice-color:var(--v1227-chart-color-${index%10})"><span>${esc(typeLabel(entry.label))}</span><span>${entry.count}</span></button>`).join('')}</div><span class="v1229-chart-accessible-summary" data-v1227-exam-current role="status" aria-live="polite"></span>`;
    panel.querySelectorAll('.v1228-exam-flat-distributions,[data-v1227-exam-view="distribution"]').forEach(node => node.remove());
    list.before(distribution);
    // The distribution itself is the sole question-type filter. Remove the
    // superseded cases controls, including any earlier generated type rail.
    detail.querySelectorAll('[data-v1220-subnav-for="cases"],[data-v1225-subnav-for="cases"],.v1227-exam-type-tabs').forEach(node => node.remove());
    detail.dataset.v1228ExamFlat = 'true'; detail.dataset.v1227ExamScope = 'all-gaokao';
    list.dataset.v1227ExamView = 'list'; list.hidden = false;
    const state = { selected:entries[0].label, denominator, records, entries };
    models.set(detail, state);
    function select(type) {
      state.selected = type;
      list.querySelectorAll('.ke-exam-case').forEach(node => {
        const row = byKey.get(String(node.dataset.latestExample || ''));
        node.hidden = type !== 'all' && (!row || charts.questionType(row.questionType) !== type);
      });
      window.V1222SenseExamples?.updateVisibleGroups?.(list);
      distribution.querySelectorAll('[data-v1227-exam-type]').forEach((button,index) => {
        const active = button.dataset.v1227ExamType === type;
        button.setAttribute('aria-pressed', String(active)); button.classList.toggle('active', active);
        if (button.getAttribute('role') === 'tab') {
          button.setAttribute('aria-selected', String(active));
          button.tabIndex = active || (type === 'all' && index === 0) ? 0 : -1;
        }
      });
      distribution.querySelectorAll('[data-v1263-exam-proportion]').forEach(segment => {
        segment.classList.toggle('is-selected', segment.dataset.v1263ExamProportion === type);
      });
      const count = type === 'all' ? denominator : entries.find(entry => entry.label === type)?.count || 0;
      distribution.querySelector('[data-v1227-exam-current]').textContent = `${type === 'all' ? '全部题型' : typeLabel(type)} · ${count}条`;
      window.V1222SenseExamples?.layoutCitations?.(list);
      window.V1223WordDock?.refresh?.(detail);
    }
    distribution.addEventListener('click', event => {
      const button = event.target.closest('[data-v1227-exam-type]');
      if (!button) return;
      event.preventDefault(); event.stopPropagation(); select(button.dataset.v1227ExamType);
    });
    function typeKeys(event, root, selector) {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      const buttons = [...root.querySelectorAll(selector)], index = buttons.indexOf(event.target);
      if (index < 0) return;
      event.preventDefault(); event.stopPropagation();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length-1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      select(buttons[next].dataset.v1227ExamType);
      buttons[next].focus({preventScroll:true});
    }
    distribution.addEventListener('keydown',event => typeKeys(event,distribution,'.v1227-exam-type-segment'));
    // Keep the exact proportional buttons while a glyph fits each segment.
    // On narrower content, the same buttons become a grid below a true-scale strip.
    let layoutFrame = 0;
    let sizeObserver;
    function layoutTypes() {
      layoutFrame = 0;
      if (!distribution.isConnected) { sizeObserver?.disconnect(); return; }
      const width = Math.max(0, distribution.clientWidth - 2);
      const fontSize = parseFloat(getComputedStyle(distribution).fontSize);
      const minimum = fontSize * 1.25 + 1; // One glyph, original side padding and separator.
      const narrow = width > 0 && entries.some(entry => width * entry.count / denominator < minimum);
      distribution.classList.toggle('v1263-exam-type-narrow', narrow);
    }
    function scheduleTypes() { if (!layoutFrame) layoutFrame = requestAnimationFrame(layoutTypes); }
    sizeObserver = new ResizeObserver(scheduleTypes);
    sizeObserver.observe(distribution);
    scheduleTypes();
    select(entries[0].label);
  }
  const original = api.finish;
  api.finish = function(detail, result) {
    original.call(this, detail, result); mount(detail, result); window.V1227WordStatistics?.mount?.(detail, result);
  };
  window.V1227ExamNavigation = { mount, exampleEndMark, starredExampleKeys, inspect:detail => {
    const state = models.get(detail || document.getElementById('wordDetailDialog'));
    return state ? { selected:state.selected, denominator:state.denominator, entries:state.entries.map(({label,count}) => ({label,count})) } : null;
  } };
})();
