/* V1.2.4: one shared vertical scroll for the complete lexical example (open, 3202). */
(() => {
  'use strict';
  const sample = () => window.WORD_DETAIL_CASE;
  const html = (value) => escapeHtml(String(value ?? ''));
  const modes = Array.from({ length: 8 }, (_, index) => ({ id: index + 1, grouped: index < 4, tabs: Math.floor(index / 2) % 2 === 1, pinned: index % 2 === 1 }));
  const saved = { mode: 1, activeTab: 'meanings', expanded: new Set([3115]), scrolls: {} };
  let activeMount = null;
  let childAbort = null;
  let childFocus = null;
  let childScrolls = [];
  const audio = (url, label) => url ? resourceInlineAudioButton(url, label) : '';
  const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg>';
  const byWord = (context, entry, item) => Number(context?.word?.id || entry?.word_id || entry?.wordId || item?.wordId) === Number(sample()?.wordId);
  function stopDetachedAudio(root) {
    if (activeResourceAudioButton && root.contains(activeResourceAudioButton)) {
      window.DemoResourceAudio?.pause?.();
      if (typeof restoreMainAudioAfterResource === 'function') restoreMainAudioAfterResource();
    }
  }
  function noteList(rows) {
    return (rows || []).map((row) => `<span class="wdc-related-term"><strong>${html(row.word)}</strong>${row.translation ? `<span>${html(row.translation)}</span>` : ''}</span>`).join('');
  }
  function sentenceExample(example, label) {
    if (!example) return '';
    return `<div class="wdc-example"><div class="wdc-example-english"><p>${html(example.english)}</p>${audio(example.audioUrl, label)}</div>${example.translation ? `<p class="wdc-translation">${html(example.translation)}</p>` : ''}</div>`;
  }
  function senseLabel(sense) {
    const source = sense.sourceSense || {};
    if (!source.chinese && source.chunk) return `${source.chunk} · ${source.chunkChinese || sense.displayChinese || ''}`;
    return sense.displayChinese || sense.chinese || source.chinese || '';
  }
  function senseHeader(sense, index) {
    const current = Number(sense.senseId) === Number(sample().contextSenseId);
    const tags = resourceUsageTags(sense.sourceSense || {});
    return `<span class="wdc-sense-number">${index + 1}</span><span class="resource-sense-pos">${html(sense.pos || '')}</span><span class="wdc-sense-copy">${tags ? `<span class="resource-sense-meta">${tags}</span>` : ''}<span class="resource-sense-meaning">${html(senseLabel(sense))}</span></span>${current ? '<b class="wdc-context-tag">当前语境</b>' : ''}`;
  }
  function senseContent(sense) {
    return `<div class="wdc-sense-associated">${sentenceExample(sense.example, `播放${senseLabel(sense)}的例句`)}<div class="wdc-relation-row"><h4>近义词</h4><div>${noteList(sense.synonyms)}</div></div><div class="wdc-relation-row"><h4>反义词</h4><div>${noteList(sense.antonyms)}</div></div>${sense.relationNote ? `<p class="wdc-usage-note">${html(sense.relationNote)}</p>` : ''}</div>`;
  }
  function meanings(grouped) {
    const senses = sample().senses;
    return `<section class="wdc-module wdc-meanings-module" data-case-module="meanings"><div class="wdc-module-heading"><h3>所有释义</h3>${grouped ? '<div class="wdc-sense-actions"><button type="button" data-case-expand-senses>展开各义项</button><button type="button" data-case-collapse-senses>收起各义项</button></div>' : ''}</div><div class="wdc-senses">${senses.map((sense, index) => {
      const current = Number(sense.senseId) === Number(sample().contextSenseId);
      if (!grouped) return `<article class="wdc-sense ${current ? 'is-context' : ''}" data-case-sense="${sense.senseId}"><div class="wdc-sense-header">${senseHeader(sense, index)}</div></article>`;
      const expanded = saved.expanded.has(Number(sense.senseId));
      return `<article class="wdc-sense ${current ? 'is-context' : ''} ${expanded ? 'is-expanded' : ''}" data-case-sense="${sense.senseId}"><button type="button" class="wdc-sense-header wdc-sense-toggle" data-case-toggle-sense="${sense.senseId}" aria-expanded="${expanded}">${senseHeader(sense, index)}<span class="wdc-sense-chevron">${arrow}</span></button><div class="wdc-sense-content" ${expanded ? '' : 'hidden'}>${senseContent(sense)}</div></article>`;
    }).join('')}</div></section>`;
  }
  function moduleSection(id, title, content) {
    return { id, title, content: `<section class="wdc-module" data-case-module="${id}"><h3>${title}</h3>${content}</section>` };
  }
  function groupedModuleRows(kind) {
    return sample().senses.map((sense, index) => `<article class="wdc-meaning-group" data-related-sense="${sense.senseId}"><h4><span>${index + 1}</span>${html(sense.pos)} · ${html(senseLabel(sense))}</h4>${kind === 'examples' ? sentenceExample(sense.example, `播放第${index + 1}个义项的例句`) : `<div class="wdc-relation-row"><h4>近义词</h4><div>${noteList(sense.synonyms)}</div></div><div class="wdc-relation-row"><h4>反义词</h4><div>${noteList(sense.antonyms)}</div></div>${sense.relationNote ? `<p class="wdc-usage-note">${html(sense.relationNote)}</p>` : ''}`}</article>`).join('');
  }
  function remainingModules(mode) {
    const d = sample();
    const rows = [];
    if (!mode.grouped) rows.push(moduleSection('examples', '例句', groupedModuleRows('examples')), moduleSection('relations', '近义词 · 反义词', groupedModuleRows('relations')));
    rows.push(moduleSection('explanation', '用法与说明', `<p>${renderResourceMarkup(d.fullExplanation || d.originalExplanation || '')}</p>`));
    rows.push(moduleSection('formation', '构词点拨', `<p>${html(d.formation?.content)}</p>${d.formation?.items?.length ? `<dl class="wdc-definition-list">${d.formation.items.map((row) => `<div><dt>${html(row.form)}</dt><dd>${html(row.meaning)}</dd></div>`).join('')}</dl>` : ''}`));
    rows.push(moduleSection('etymology', '词源点拨', `<p>${html(d.etymology?.content)}</p>${d.etymology?.sourceLinks?.length ? `<div class="wdc-source-links">${d.etymology.sourceLinks.map((link) => `<a href="${html(link.url)}" target="_blank" rel="noopener noreferrer">${html(link.title || link.label || '词源参考')}</a>`).join('')}</div>` : ''}`));
    rows.push(moduleSection('collocations', '固定搭配', d.collocations.map((row, index) => `<article class="wdc-collocation"><button type="button" class="wdc-word-link" data-case-collocation="${index}">${html(row.term)}<span aria-hidden="true">↗</span></button><p>${html(row.translation)}</p>${row.note ? `<p class="wdc-usage-note">${html(row.note)}</p>` : ''}</article>`).join('')));
    rows.push(moduleSection('derivatives', '派生词', `<dl class="wdc-definition-list">${d.derivatives.map((row) => `<div><dt>${html(row.word)} <i>${html(row.pos)}</i></dt><dd>${html(row.translation)}${row.formation ? `<small>${html(row.formation)}</small>` : ''}</dd></div>`).join('')}</dl>`));
    rows.push(moduleSection('roots', '词根', d.roots.map((row) => `<article class="wdc-root"><h4>${html(row.word)}${row.translation ? ` · ${html(row.translation)}` : ''}</h4><p>${html(row.note)}</p>${row.family?.length ? `<div class="wdc-root-family">${row.family.map((item) => typeof item === 'string' ? `<span>${html(item)}</span>` : `<span><strong>${html(item.word)}</strong> ${html(item.translation || '')}</span>`).join('')}</div>` : ''}</article>`).join('')));
    rows.push(moduleSection('cases', '高考听力案例 · 3次', `<div id="ke-exam-cases" class="wdc-exam-cases">${d.cases.map((row, index) => `<article class="ke-exam-case" data-case-listening="${row.id}"><div class="ke-case-source"><b>${index + 1}</b><span>${html(row.sourceName)}</span></div>${sentenceExample({ english: row.english, translation: row.translation, audioUrl: row.audioUrl }, `播放第${index + 1}个听力案例`)}</article>`).join('')}</div>`));
    return rows;
  }
  function controlsHTML() {
    return `<div class="wdc-mode-switch" role="group" aria-label="单词详情展示方案"><div class="wdc-mode-heading"><strong>展示方案</strong><span>同一份完整内容，切换排版比较</span></div><div class="wdc-mode-buttons">${modes.map((mode) => `<button type="button" data-case-mode="${mode.id}" aria-pressed="${saved.mode === mode.id}"><b>${mode.id}</b><span>${mode.grouped ? '随义项' : '独立模块'} · ${mode.tabs ? `导航 · ${mode.pinned ? '释义置于导航上方' : '所有模块分别导航'}` : mode.pinned ? '铺开（铺开模式重复）' : '铺开'}</span></button>`).join('')}</div></div>`;
  }
  function tabHTML(rows, active) {
    return `<div class="wdc-tabs" role="tablist" aria-label="单词详情模块">${rows.map((row) => `<button type="button" role="tab" id="wdc-tab-${row.id}" aria-controls="wdc-panel-${row.id}" aria-selected="${active === row.id}" tabindex="${active === row.id ? '0' : '-1'}" data-case-tab="${row.id}">${row.title.replace(' · 3次', '')}</button>`).join('')}</div><div class="wdc-tab-panels">${rows.map((row) => `<div role="tabpanel" id="wdc-panel-${row.id}" aria-labelledby="wdc-tab-${row.id}" data-case-panel="${row.id}" ${active === row.id ? '' : 'hidden'}>${row.content}</div>`).join('')}</div>`;
  }
  function saveScrolls() {
    const detail = activeMount?.detail;
    if (!detail) return;
    detail.querySelectorAll('[data-case-scroll]').forEach((element) => { saved.scrolls[`${saved.mode}:${saved.activeTab}:${element.dataset.caseScroll}`] = element.scrollTop; });
  }
  function restoreScrolls() {
    const detail = activeMount?.detail;
    if (!detail) return;
    requestAnimationFrame(() => detail.querySelectorAll('[data-case-scroll]').forEach((element) => { element.scrollTo({ top: saved.scrolls[`${saved.mode}:${saved.activeTab}:${element.dataset.caseScroll}`] || 0, behavior: 'instant' }); }));
  }
  function renderBody() {
    const { detail, intro } = activeMount;
    const mode = modes[saved.mode - 1];
    const body = detail.querySelector('.resource-popover-body');
    stopDetachedAudio(body);
    detail.dataset.caseLayout = String(mode.id);
    detail.dataset.caseGrouping = mode.grouped ? 'meanings' : 'modules';
    detail.dataset.casePresentation = mode.tabs ? 'tabs' : 'flow';
    detail.dataset.casePinned = String(mode.tabs && mode.pinned);
    body.dataset.caseScroll = 'document';
    const senseRow = { id: 'meanings', title: '所有释义', content: meanings(mode.grouped) };
    const otherRows = remainingModules(mode);
    let layout;
    if (mode.tabs) {
      const rows = mode.pinned ? otherRows : [senseRow, ...otherRows];
      if (!rows.some((row) => row.id === saved.activeTab)) saved.activeTab = rows[0].id;
      const tabs = tabHTML(rows, saved.activeTab);
      layout = mode.pinned ? `<div class="wdc-layout wdc-layout-tabs"><div class="wdc-meanings-above-navigation">${senseRow.content}</div>${tabs}</div>` : `<div class="wdc-layout wdc-layout-tabs">${tabs}</div>`;
    } else {
      layout = `<div class="wdc-layout wdc-layout-flow wdc-flow-modules">${senseRow.content}${otherRows.map((row) => row.content).join('')}</div>`;
    }
    body.innerHTML = `<div class="wdc-word-intro ke-vocabulary">${intro}</div>${layout}`;
    bindBody(detail);
    if (detail.isConnected) window.DemoKnowledgeEnhancements?.rebindDetailMedia?.(detail);
    restoreScrolls();
  }
  function bindBody(detail) {
    detail.querySelectorAll('[data-case-toggle-sense]').forEach((button) => button.addEventListener('click', () => {
      const id = Number(button.dataset.caseToggleSense);
      if (saved.expanded.has(id)) saved.expanded.delete(id); else saved.expanded.add(id);
      const article = button.closest('.wdc-sense');
      const panel = article.querySelector('.wdc-sense-content');
      const expanded = saved.expanded.has(id);
      if (!expanded) stopDetachedAudio(panel);
      article.classList.toggle('is-expanded', expanded);
      button.setAttribute('aria-expanded', String(expanded));
      panel.hidden = !expanded;
      if (expanded && !matchMedia('(prefers-reduced-motion: reduce)').matches) panel.animate([{ opacity: 0, transform: 'translateY(-5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 210, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }));
    detail.querySelector('[data-case-expand-senses]')?.addEventListener('click', () => { saveScrolls(); sample().senses.forEach((row) => saved.expanded.add(Number(row.senseId))); renderBody(); });
    detail.querySelector('[data-case-collapse-senses]')?.addEventListener('click', () => { saveScrolls(); saved.expanded.clear(); renderBody(); });
    detail.querySelectorAll('[data-case-tab]').forEach((button) => {
      button.addEventListener('click', () => selectTab(button.dataset.caseTab));
      button.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault(); event.stopPropagation();
        const tabs = [...detail.querySelectorAll('[data-case-tab]')];
        const index = tabs.indexOf(button);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        selectTab(tabs[next].dataset.caseTab);
        detail.querySelector(`[data-case-tab="${tabs[next].dataset.caseTab}"]`)?.focus();
      });
    });
    detail.querySelectorAll('[data-case-collocation]').forEach((button) => button.addEventListener('click', () => openChunk(Number(button.dataset.caseCollocation), button)));
  }
  function selectTab(id) {
    const detail = activeMount?.detail;
    if (!detail || saved.activeTab === id) return;
    const body = detail.querySelector('.resource-popover-body');
    const documentTop = body.scrollTop;
    saveScrolls();
    const current = detail.querySelector('[data-case-panel]:not([hidden])');
    if (current) stopDetachedAudio(current);
    saved.activeTab = id;
    detail.querySelectorAll('[data-case-tab]').forEach((button) => { const active = button.dataset.caseTab === id; button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; });
    detail.querySelectorAll('[data-case-panel]').forEach((panel) => { panel.hidden = panel.dataset.casePanel !== id; });
    body.scrollTo({ top: documentTop, behavior: 'instant' });
    saved.scrolls[`${saved.mode}:${saved.activeTab}:document`] = body.scrollTop;
  }
  function mount(detail, options) {
    if (!byWord(options.context, options.entry, options.item)) return false;
    const original = detail.querySelector('.ke-original-word-content .knowledge-entry');
    const intro = original ? [...original.children].filter((node) => node.matches('.knowledge-term,.resource-pronunciations,.resource-pronunciation-groups,.resource-guidance-card')).map((node) => node.outerHTML).join('') : `<div class="knowledge-term"><span class="knowledge-word">${html(sample().word)}</span></div>`;
    detail.classList.add('wdc-dialog');
    detail.dataset.wordCaseId = String(sample().wordId);
    detail.querySelector('.resource-popover-head').insertAdjacentHTML('afterend', controlsHTML());
    activeMount = { detail, ...options, intro: `<article class="knowledge-entry">${intro}</article>` };
    if (options.destination === 'cases') saved.activeTab = 'cases';
    detail.querySelectorAll('[data-case-mode]').forEach((button) => button.addEventListener('click', () => {
      const value = Number(button.dataset.caseMode);
      if (value === saved.mode) return;
      saveScrolls(); saved.mode = value;
      detail.querySelectorAll('[data-case-mode]').forEach((control) => control.setAttribute('aria-pressed', String(Number(control.dataset.caseMode) === value)));
      renderBody();
    }));
    renderBody();
    if (options.destination === 'cases') requestAnimationFrame(() => {
      const mode = modes[saved.mode - 1];
      if (mode.tabs) selectTab('cases');
      else detail.querySelector('[data-case-module="cases"]')?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
    return true;
  }
  function enhanceVocabularyArticle(article, entry, item, context) {
    if (!byWord(context, entry, item)) return;
    const container = article.closest('[data-knowledge-record]') || article;
    if (!container.querySelector('.wdc-case-supplement')) {
      const explanation = document.createElement('section');
      explanation.className = 'knowledge-explanation is-unlabeled wdc-case-supplement';
      explanation.innerHTML = `<p>${renderResourceMarkup(sample().explanationSupplement || '')}</p>`;
      const sourceNotes = [...container.querySelectorAll('.knowledge-explanation')];
      if (sourceNotes.length) sourceNotes.at(-1).after(explanation); else container.append(explanation);
    }
  }
  function closeNested() {
    const child = document.getElementById('lexicalChunkDialog');
    if (!child) return false;
    window.V1223WordDock?.release(child);
    stopDetachedAudio(child);
    childAbort?.abort(); childAbort = null;
    child.remove(); document.getElementById('lexicalChunkBackdrop')?.remove();
    const parent = document.getElementById('wordDetailDialog');
    parent?.removeAttribute('aria-hidden');
    if (parent) parent.inert = false;
    childScrolls.forEach(({ element, top, left }) => { element.scrollTop = top; element.scrollLeft = left; });
    childFocus?.focus({ preventScroll: true }); childFocus = null;
    return true;
  }
  function openChunk(index, trigger) {
    closeNested();
    const row = sample().collocations[index];
    if (!row?.detail) return;
    const d = row.detail;
    const parent = document.getElementById('wordDetailDialog');
    childFocus = trigger;
    childScrolls = [parent, ...parent.querySelectorAll('*')].filter((element) => element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth).map((element) => ({ element, top: element.scrollTop, left: element.scrollLeft }));
    const backdrop = document.createElement('div');
    backdrop.id = 'lexicalChunkBackdrop'; backdrop.className = 'ke-word-detail-backdrop wdc-chunk-backdrop';
    backdrop.addEventListener('click', (event) => { event.stopPropagation(); closeNested(); });
    const dialog = document.createElement('div');
    dialog.id = 'lexicalChunkDialog'; dialog.className = 'resource-popover ke-word-detail wdc-chunk-dialog';
    dialog.dataset.knowledgeType = '词汇'; dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true'); dialog.setAttribute('aria-labelledby', 'wdcChunkTitle');
    dialog.addEventListener('click', (event) => event.stopPropagation());
    dialog.innerHTML = `<div class="resource-popover-head"><div><span id="wdcChunkTitle">单词详情 · ${html(d.word || row.term)}</span></div><button type="button" data-lexical-chunk-close aria-label="关闭词块详情">${icons.x}</button></div><div class="resource-popover-body ke-vocabulary"><article class="knowledge-entry"><div class="knowledge-term"><span class="knowledge-word">${html(d.word || row.term)}</span></div><section class="ke-all-meanings ke-integrated-meanings"><h3>所有释义</h3><div class="wdc-senses">${(d.senses || []).map((sense) => `<article class="wdc-sense is-context"><div class="wdc-sense-header"><span class="resource-sense-pos">${html(sense.pos || '词块')}</span><span class="wdc-sense-copy">${html(sense.chinese)}</span><b class="wdc-context-tag">当前语境</b></div>${sense.example ? senseContent({ ...sense, synonyms: sense.synonyms || [], antonyms: sense.antonyms || [] }) : ''}</article>`).join('')}</div></section>${d.introduction ? `<section class="knowledge-explanation is-unlabeled"><p>${html(d.introduction)}</p></section>` : ''}</article></div>`;
    window.DemoKnowledgeEnhancements?.syncModalTheme?.(dialog);
    window.DemoKnowledgeEnhancements?.enhanceModal?.(dialog);
    dialog.querySelector('[data-lexical-chunk-close]').addEventListener('click', closeNested);
    childAbort = new AbortController();
    dialog.querySelectorAll('[data-resource-audio]').forEach((button) => button.addEventListener('click', () => {
      if (activeResourceAudioButton === button && !resourceDetailAudio.paused) { resourceDetailAudio.pause(); updateResourceAudioButton(button, false); return; }
      window.DemoResourceAudio?.play(button.dataset.resourceAudio, button);
    }, { signal: childAbort.signal }));
    const syncAudio = () => dialog.querySelectorAll('[data-resource-audio]').forEach((button) => updateResourceAudioButton(button, activeResourceAudioButton === button && !resourceDetailAudio.paused));
    ['play', 'pause', 'ended'].forEach((type) => resourceDetailAudio.addEventListener(type, syncAudio, { signal: childAbort.signal }));
    parent.setAttribute('aria-hidden', 'true'); parent.inert = true;
    document.body.append(backdrop, dialog);
    window.V1223WordDock?.activate(dialog);
    dialog.querySelector('[data-lexical-chunk-close]').focus({ preventScroll: true });
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) dialog.animate([{ opacity: 0, transform: 'translate(-50%, calc(-50% + 10px)) scale(.985)' }, { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }], { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  window.WordDetailCaseUI = { mount, enhanceVocabularyArticle, closeNested, getState: () => ({ mode: saved.mode, activeTab: saved.activeTab, expanded: [...saved.expanded] }), modes };
})();
