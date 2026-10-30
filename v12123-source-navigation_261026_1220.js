/* Move the original classroom contents into two bottom navigation levels. */
(() => {
  'use strict';
  const mounted = new WeakMap(), dialogs = new Set();
  let sequence = 0;
  const esc = value => escapeHtml(String(value ?? ''));
  const labels = { n: 'n. 名词', v: 'v. 动词', vt: 'vt. 及物动词', vi: 'vi. 不及物动词', adj: 'adj. 形容词', adv: 'adv. 副词', prep: 'prep. 介词', pron: 'pron. 代词', conj: 'conj. 连词', interj: 'interj. 感叹词', num: 'num. 数词', art: 'art. 冠词' };
  const specs = [['meanings', '释义'], ['explanation', '说明'], ['illustrations', '图解讲解'], ['contrast', '词义辨析'], ['examples', '例句'], ['formation', '构词点拨'], ['semantic', '说明'], ['etymology', '词源点拨'], ['collocations', '固定搭配'], ['derivatives', '派生词'], ['roots', '词根'], ['cases', '高考听力案例'], ['media', '配图']];
  const posKey = value => String(value || '').trim().replace(/[.。]$/, '').toLowerCase() || 'unclassified';
  function pauseHidden(root) {
    root.querySelectorAll('audio,video').forEach(media => media.pause());
    if (typeof activeResourceAudioButton !== 'undefined' && activeResourceAudioButton && root.contains(activeResourceAudioButton)) window.DemoResourceAudio?.pause?.();
  }
  function fitBar(nav) {
    if (!nav) return;
    // The primary/POS tabs keep hit's typography; wider lists wrap in this level.
    nav.style.removeProperty('--vwn-nav-size');
  }
  function attach(detail, model) {
    if (window.V1223WordDock?.isMounted(detail)) { window.V1223WordDock.refresh(detail); return; }
    if (!window.ClassroomTools?.attach) return;
    window.ClassroomTools.attach(detail, model.actions, 'word-tools');
    window.ClassroomTools.attach(detail, model.nav, 'word-navigation');
  }
  function fit() {
    dialogs.forEach(detail => {
      if (!detail.isConnected) { dialogs.delete(detail); return; }
      const model = mounted.get(detail); if (!model) return;
      attach(detail, model); fitBar(model.nav);
      if (!model.posTabs.hidden) fitBar(model.posTabs);
    });
    window.V1213Illustrations?.fit?.();
  }
  function select(detail, id, focus = false) {
    const model = mounted.get(detail); if (!model) return false;
    const selected = model.rows.find(row => row.id === id); if (!selected) return false;
    const previous = model.rows.find(row => row.id === model.active);
    if (previous && previous !== selected) pauseHidden(previous.panel);
    model.rows.forEach(row => { const active = row === selected; row.panel.hidden = !active; row.button.setAttribute('aria-selected', String(active)); row.button.tabIndex = active ? 0 : -1; if (row.tools) row.tools.hidden = !active; });
    detail.dataset.v1228View='single';
    if(previous && previous!==selected && id!=='cases'){const body=detail.querySelector(':scope > .resource-popover-body');if(body)body.scrollTop=0;}
    model.active = id; model.posTabs.hidden = id !== 'meanings' || !model.hasMultiplePOS;
    if (focus) selected.button.focus({ preventScroll: true });
    
    selected.refresh?.(); requestAnimationFrame(fit);
    return true;
  }
  function showAll(detail, {preserveFolds=false} = {}) {
    const model=mounted.get(detail);if(!model)return false;
    const folds=preserveFolds?[...detail.querySelectorAll('[data-v1227-fold]')].map(button=>({button,expanded:button.getAttribute('aria-expanded')==='true'})):[];
    detail.dataset.v1228View='all';model.active='all';
    model.rows.forEach(row=>{row.panel.hidden=false;row.button.setAttribute('aria-selected','false');row.button.tabIndex=0;if(row.tools)row.tools.hidden=true;row.scroll.scrollTop=0;});
    model.posTabs.hidden=true;
    detail.querySelectorAll('[data-vwn-pos="all"],[data-latest-block-category="all"],[data-latest-example-pos="all"],[data-latest-textbook-version="all"]').forEach(button=>{if(button.getAttribute('aria-selected')!=='true')button.click();});
    if(preserveFolds)folds.forEach(({button,expanded})=>window.V1220WordDetail?.setFolds?.(button.parentElement,expanded));
    else window.V1220WordDetail?.setFolds?.(detail,true);
    const body=detail.querySelector('.resource-popover-body');if(body)body.scrollTop=0;
    requestAnimationFrame(fit);window.V1223WordDock?.refresh?.(detail);return true;
  }
  function addNodes(rows, id, title, nodes, visual = false) {
    const unique = [...new Set(nodes)].filter(Boolean);
    if (!unique.length) return;
    let row = rows.find(candidate => candidate.id === id);
    if (!row) { const content = document.createElement('section'); row = { id, title, content, visual }; rows.push(row); }
    unique.forEach(node => row.content.append(node));
  }
  function attachSenseCards(rows) {
    const first=rows.find(row=>row.id==='meanings')?.content.querySelector('[data-latest-sense],.resource-sense-line,.wdc-sense');
    const copy=first?.querySelector('.resource-sense-copy,.wdc-sense-copy') || first;
    if(!copy)return rows;
    const moved=new Set();
    for(const [id,title]of [['singleMeaning','一词一义'],['semantic','语义推导']]){
      const row=rows.find(candidate=>candidate.id===id);if(!row)continue;
      const card=document.createElement('article'),heading=document.createElement('h4'),body=document.createElement('div');
      card.className='resource-word-note v1264-sense-card';card.dataset.v1264SenseCard=id;
      card.dataset.v1264SenseKey=first.dataset.latestSense || first.dataset.senseId || '';
      heading.textContent=title;body.className='v1264-sense-card-body';
      // Move the live source nodes. Media, source keys and event listeners stay intact.
      row.content.querySelectorAll(':scope > h3,.pgi-module-head').forEach(node=>node.remove());
      row.content.removeAttribute('data-case-module');row.content.removeAttribute('data-case-title');
      row.content.dataset.v1264SourceModule=id;
      body.append(row.content);if(row.tools?.children.length)body.append(row.tools);
      card.append(heading,body);copy.append(card);moved.add(row);
    }
    return rows.filter(row=>!moved.has(row));
  }
  function gather(detail, options) {
    const body = detail.querySelector('.resource-popover-body');
    const rows = [];
    body.querySelectorAll('[data-case-module="relations"],.wdc-relation-row').forEach(node => node.remove());
    const oldModules = [...body.querySelectorAll('[data-case-module]')];
    oldModules.forEach(content => rows.push({ id: content.dataset.caseModule, title: specs.find(spec => spec[0] === content.dataset.caseModule)?.[1] || content.dataset.caseTitle || content.querySelector('h3')?.textContent || '', content }));
    if (!rows.some(row => row.id === 'meanings')) addNodes(rows, 'meanings', '全部释义', [body.querySelector('.ke-all-meanings') || body.querySelector('.resource-meanings')]);
    if (options.caseData) {
      const meanings = rows.find(row => row.id === 'meanings')?.content;
      addNodes(rows, 'examples', '例句', [...(meanings?.querySelectorAll('.wdc-example') || [])]);
    }
    const owned = node => !node.closest('[data-case-module]');
    addNodes(rows, 'explanation', '说明', [...body.querySelectorAll('.knowledge-explanation')].filter(owned).filter(node => node.textContent.trim()));
    addNodes(rows, 'examples', '例句', [...body.querySelectorAll('.resource-examples')].filter(owned).filter(node => node.textContent.trim()));
    body.querySelectorAll('.resource-word-note').forEach(node => {
      if (!owned(node) || !node.textContent.trim()) return;
      const title = node.querySelector('h4')?.textContent.trim() || '';
      const id = { '构词点拨': 'formation', '语义点拨': 'semantic', '词源点拨': 'etymology', '词义辨析': 'contrast' }[title] || 'explanation';
      addNodes(rows, id, specs.find(spec => spec[0] === id)[1], [node]);
    });
    if (!rows.some(row => row.id === 'cases')) { const cases = body.querySelector('.ke-exam-cases'); if (cases?.querySelector('.ke-exam-case')) addNodes(rows, 'cases', '高考听力案例', [cases]); }
    addNodes(rows, 'media', '配图', [...body.querySelectorAll('.resource-media-panel')].filter(owned), true);
    (window.V1213Illustrations?.create?.(options) || []).forEach(row => {
      const previous = rows.find(candidate => candidate.id === row.id);
      if (previous) { previous.title = row.title; previous.content.append(row.content); previous.tools = row.tools; previous.visual = true; previous.refresh = row.refresh; }
      else rows.push(row);
    });
    const retained=detail.id==='wordDetailDialog'?attachSenseCards(rows.filter(row=>row.id!=='network')):rows;
    retained.sort((a, b) => specs.findIndex(spec => spec[0] === a.id) - specs.findIndex(spec => spec[0] === b.id));
    return retained;
  }
  function wordIntro(body) {
    const intro = document.createElement('header'); intro.className = 'vwn-word-intro ke-vocabulary';
    const sourceEntry = body.querySelector('.knowledge-entry');
    const entry = document.createElement('article'); entry.className = sourceEntry?.className || 'knowledge-entry';
    const term = body.querySelector('.knowledge-term'); if (term) entry.append(term);
    const topPronunciations = sourceEntry ? [...sourceEntry.children].filter(node => node.matches('.resource-pronunciations,.resource-pronunciation-groups')) : [];
    topPronunciations.forEach(node => entry.append(node));
    // Different real pronunciation groups originally live in the sense headings.
    // Move their existing audio nodes into the same mother-popup markup under the word.
    const byPronunciation = new Map();
    body.querySelectorAll('.resource-sense-heading').forEach(heading => {
      const pronunciation = heading.querySelector('.resource-pronunciations'); if (!pronunciation) return;
      const key = [...pronunciation.querySelectorAll('.resource-pronunciation-item')].map(item => [item.textContent.replace(/\s+/g, ' ').trim(), item.querySelector('[data-resource-audio]')?.dataset.resourceAudio || '']);
      const signature = JSON.stringify(key);
      const raw = heading.querySelector('.resource-sense-pos')?.textContent.trim() || '';
      const existing = byPronunciation.get(signature);
      if (existing) {
        if (raw && !existing.labels.includes(raw)) existing.labels.push(raw);
        pronunciation.hidden = true;
      } else byPronunciation.set(signature, { pronunciation, labels: raw ? [raw] : [] });
    });
    if (byPronunciation.size) {
      const groups = document.createElement('div'); groups.className = 'resource-pronunciation-groups';
      byPronunciation.forEach(({ pronunciation, labels: partLabels }) => {
        const row = document.createElement('div'); row.className = 'resource-pronunciation-row' + (byPronunciation.size > 1 ? ' has-pos' : '');
        if (byPronunciation.size > 1 && partLabels.length) { const label = document.createElement('span'); label.className = 'resource-pronunciation-pos'; label.textContent = partLabels.join(' / '); row.append(label); }
        row.append(pronunciation); groups.append(row);
      });
      entry.append(groups);
    }
    sourceEntry && [...sourceEntry.children].filter(node => node.matches('.resource-guidance-card,.pronunciation-phenomenon,[data-word-variants]')).forEach(node => entry.append(node));
    intro.append(entry); return intro;
  }
  function definitions(model, row, options) {
    let overview = row.content.querySelector('.resource-sense-overview');
    let sections = overview ? [...overview.children].filter(node => node.tagName === 'SECTION') : [...row.content.querySelectorAll('.wdc-sense')];
    if (!sections.length) sections = [...row.content.querySelectorAll('.resource-sense-line')];
    const sourceSenses = options?.caseData?.senses || (options?.context?.word?.id === window.WORD_DETAIL_CASE?.wordId || Number(options?.entry?.word_id) === Number(window.WORD_DETAIL_CASE?.wordId) ? window.WORD_DETAIL_CASE.senses : null);
    let groups = sections.map((element, index) => {
      const source = sourceSenses?.find(sense => String(sense.senseId) === element.dataset.caseSense) || sourceSenses?.[index];
      const raw = source?.pos ?? element.dataset.v1227Pos ?? element.querySelector('.resource-sense-pos')?.textContent.trim() ?? '';
      return { element, key: posKey(raw), raw };
    });
    if (!overview && groups.length) {
      const parent = sections[0].parentElement;
      overview = document.createElement('div'); overview.className = 'resource-meanings resource-sense-overview vwn-grouped-senses';
      parent.insertBefore(overview, sections[0]);
      const grouped = new Map();
      groups.forEach(group => {
        let target = grouped.get(group.key);
        if (!target) {
          const element = document.createElement('section'), pos = document.createElement('div'), list = document.createElement('div');
          pos.className = 'resource-sense-pos'; pos.textContent = group.raw;
          list.className = 'resource-sense-list'; element.append(pos, list); overview.append(element);
          target = { element, key: group.key, raw: group.raw, list }; grouped.set(group.key, target);
        }
        // Only suppress the repeated prefix. Original sense cards, audio and listeners move intact.
        group.element.querySelectorAll('.resource-sense-pos').forEach(pos => { pos.hidden = true; });
        target.list.append(group.element);
      });
      groups = [...grouped.values()];
    }
    const keys = [...new Set(groups.map(group => group.key))].filter(key => key !== 'unclassified');
    model.hasMultiplePOS = keys.length > 0;
    model.posTabs.setAttribute('role', 'tablist'); model.posTabs.setAttribute('aria-label', '全部释义词性');
    model.posTabs.innerHTML = `${keys.map(key => `<button type="button" role="tab" data-vwn-pos="${esc(key)}" aria-selected="false" tabindex="-1">${esc(key === 'unclassified' ? '未标注' : labels[key] || groups.find(group => group.key === key).raw)}</button>`).join('')}`;
    model.posTabs.addEventListener('click', event => {
      const button = event.target.closest('[data-vwn-pos]'); if (!button) return;
      const wanted = button.dataset.vwnPos; groups.forEach(group => { group.element.hidden = wanted !== 'all' && group.key !== wanted && group.key !== 'unclassified'; if(!group.element.hidden)window.V1220WordDetail?.setFolds?.(group.element,wanted!=='all'); });
      model.posTabs.querySelectorAll('button').forEach(node => { const active = node === button; node.setAttribute('aria-selected', String(active)); node.tabIndex = active ? 0 : -1; });
      model.pos = wanted; const body=row.panel.closest('#wordDetailDialog')?.querySelector(':scope > .resource-popover-body');if(body)body.scrollTop=0;
      row.panel.closest('#wordDetailDialog')?.dispatchEvent(new CustomEvent('word-pos-change',{detail:{pos:wanted}}));
      window.V1222SenseExamples?.layoutCitations?.(row.content);
    });
    model.pos = keys[0]; if (!keys.length) groups.forEach(group => { group.element.hidden = false; });
    model.posTabs.querySelector('button')?.click();
  }
  function keyboard(nav) {
    nav.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      // Follow logical flex order across wrapped rows; x-only sorting interleaves rows.
      const buttons = [...nav.querySelectorAll(':scope > button[role="tab"]')].filter(button => !button.hidden && !button.disabled && button.getClientRects().length).sort((a,b) => (Number(getComputedStyle(a).order) || 0) - (Number(getComputedStyle(b).order) || 0)), index = buttons.indexOf(event.target); if (index < 0) return;
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      event.preventDefault(); event.stopPropagation(); buttons[next].click(); buttons[next].focus({ preventScroll: true });
    });
  }
  function mount(detail, options = {}) {
    if (!detail || mounted.has(detail)) return mounted.has(detail);
    const body = detail.querySelector('.resource-popover-body'); if (!body) return false;
    const intro = wordIntro(body);
    const rows = gather(detail, options); if (!rows.length) return false;
    const footer = document.createElement('footer'); footer.className = 'vwn-footer'; footer.dataset.classroomFooter = '';
    const actions = document.createElement('div'); actions.className = 'vwn-secondary-tools'; actions.dataset.classroomActionsHost = '';
    const posTabs = document.createElement('div'); posTabs.className = 'vwn-pos-tabs book-unit-options'; actions.append(posTabs);
    const nav = document.createElement('nav'); nav.className = 'vwn-main-nav book-question-mode-tabs'; nav.dataset.classroomNavigationHost = ''; nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', '单词详情模块');
    const workspace = document.createElement('main'); workspace.className = 'vwn-content';
    const prefix = 'vwn-' + (++sequence);
    const model = { rows, footer, actions, posTabs, nav, active: '', options };
    rows.forEach(row => {
      const button = document.createElement('button'); button.type = 'button'; button.id = `${prefix}-tab-${row.id}`; button.setAttribute('role', 'tab'); button.dataset.wordModule = row.id; button.textContent = row.title;
      const count = row.id === 'cases' ? row.content.querySelectorAll('.ke-exam-case').length : 0;
      if (count) { const badge = document.createElement('span'); badge.className = 'vwn-count'; badge.textContent = count; button.append(badge); }
      const panel = document.createElement('section'); panel.className = 'vwn-panel'; panel.id = `${prefix}-panel-${row.id}`; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', button.id); button.setAttribute('aria-controls', panel.id);
      row.content.querySelectorAll('.pgi-module-head').forEach(heading => heading.remove());
      const scroll = document.createElement('div'); scroll.className = 'vwn-panel-scroll' + (row.visual ? ' is-visual' : ''); scroll.append(row.content); panel.append(scroll);
      row.panel = panel; row.scroll = scroll; row.button = button;
      if (row.id === 'meanings') definitions(model, row, options);
      if (row.tools) actions.append(row.tools);
      nav.append(button); workspace.append(panel); button.addEventListener('click', () => select(detail, row.id));
    });
    body.replaceChildren(intro, workspace);
    detail.querySelectorAll('.wdc-mode-switch,.wdc-tabs').forEach(node => node.remove());
    footer.append(actions, nav); detail.append(footer); detail.classList.add('vwn-dialog', 'ke-expanded'); detail.dataset.wordNavigation = 'bottom-modules-with-pos';
    detail.querySelectorAll('.wdc-context-tag,.pgi-context-label').forEach(node => node.remove());
    detail.querySelectorAll('.resource-sense-line > b').forEach(node => { if (node.textContent.trim() === '当前语境') node.remove(); });
    detail.querySelectorAll('.resource-sense-line.is-context,.wdc-sense.is-context').forEach(node => node.classList.remove('is-context'));
    mounted.set(detail, model); dialogs.add(detail); keyboard(nav); keyboard(posTabs);
    window.V1223WordDock?.mount(detail, {nav, actions, footer});
    attach(detail, model); if(options.destination==='cases'&&rows.some(row=>row.id==='cases'))select(detail,'cases');else select(detail,'meanings');
    requestAnimationFrame(fit); window.dispatchEvent(new CustomEvent('v1213-word-mounted', { detail }));
    // Original word/chunk entrance animations start after their mount callback.
    // Reposition the real tool nodes after those transforms have finished.
    requestAnimationFrame(() => Promise.all(detail.getAnimations().map(animation => animation.finished.catch(() => {}))).then(() => {
      if (!detail.isConnected) return;
      window.ClassroomTools?.refresh?.(); fit();
    }));
    return true;
  }
  function arrangeSenseModules(detail, {cards=[],remove=[],order=[]}={}) {
    const model=mounted.get(detail), result={};
    if(!model || detail.id!=='wordDetailDialog')return result;
    const first=model.rows.find(row=>row.id==='meanings')?.content.querySelector('[data-latest-sense]');
    const copy=first?.querySelector('.resource-sense-copy') || first;
    if(!copy)return result;
    const moved=new Set();
    cards.forEach(([id,title])=>{
      const row=model.rows.find(candidate=>candidate.id===id);if(!row)return;
      const card=document.createElement('article'),heading=document.createElement('h4'),body=document.createElement('div');
      card.className='resource-word-note v1264-sense-card';card.dataset.v1264SenseCard=id;
      card.dataset.v1264SenseKey=first.dataset.latestSense;card.dataset.v1264AnchorFinalized='true';
      heading.textContent=title;body.className='v1264-sense-card-body';
      row.content.querySelectorAll(':scope > h3,.pgi-module-head').forEach(node=>node.remove());
      row.content.removeAttribute('data-case-module');row.content.removeAttribute('data-case-title');
      row.content.dataset.v1264SourceModule=id;
      body.append(row.content);if(row.tools?.children.length){row.tools.hidden=false;body.append(row.tools);}
      card.append(heading,body);copy.append(card);row.panel.remove();row.button.remove();
      moved.add(row);result[id]=card;
    });
    model.rows=model.rows.filter(row=>{
      if(moved.has(row))return false;
      if(!remove.includes(row.id))return true;
      row.panel.remove();row.button.remove();row.tools?.remove();return false;
    });
    model.rows.sort((a,b)=>{
      const index=id=>order.includes(id)?order.indexOf(id):order.length;
      return index(a.id)-index(b.id);
    });
    model.rows.forEach(row=>{model.nav.append(row.button);row.panel.parentElement?.append(row.panel);row.button.style.removeProperty('order');});
    if(!model.rows.some(row=>row.id===model.active))select(detail,'meanings');
    requestAnimationFrame(fit);return result;
  }
  // V78: reconcile primary modules without reimplementing selection or POS state.
  function reconfigure(detail, specs) {
    const model=mounted.get(detail);if(!model)return false;
    const workspace=detail.querySelector('.vwn-content');if(!workspace)return false;
    const keep=new Set(specs.map(spec=>spec.id)),next=[];
    for(const spec of specs){
      let row=model.rows.find(candidate=>candidate.id===spec.id);
      if(!row){
        if(!spec.nodes?.length)continue;
        const content=document.createElement('section');content.className='v1278-primary-content';
        spec.nodes.forEach(node=>content.append(node));
        const button=document.createElement('button');button.type='button';button.id=model.nav.querySelector('[data-word-module]')?.id.replace(/-tab-.+$/,'-tab-'+spec.id)||'v1278-tab-'+spec.id;
        button.dataset.wordModule=spec.id;button.setAttribute('role','tab');
        const panel=document.createElement('section');panel.className='vwn-panel';panel.id=button.id.replace('-tab-','-panel-');panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);button.setAttribute('aria-controls',panel.id);
        const scroll=document.createElement('div');scroll.className='vwn-panel-scroll';scroll.append(content);panel.append(scroll);
        row={id:spec.id,title:spec.title,content,button,panel,scroll};
        button.addEventListener('click',()=>select(detail,spec.id));
      }else if(spec.nodes){row.content.replaceChildren(...spec.nodes);row.tools?.remove();row.tools=null;row.refresh=null;}
      row.title=spec.title;row.button.textContent=spec.title;row.button.style.removeProperty('order');next.push(row);
    }
    model.rows.filter(row=>!keep.has(row.id)).forEach(row=>{pauseHidden(row.panel);row.panel.remove();row.button.remove();row.tools?.remove();});
    model.rows=next;next.forEach(row=>{model.nav.append(row.button);workspace.append(row.panel);});
    select(detail,next.some(row=>row.id===model.active)?model.active:'meanings');
    window.V1223WordDock?.refresh?.(detail);return true;
  }
  const originalUI = window.WordDetailCaseUI;
  if (originalUI?.mount) {
    const originalMount = originalUI.mount;
    originalUI.mount = function(detail, options = {}) {
      const handled = originalMount.call(this, detail, options);
      // Obtain every original open module, preserving its source templates and listeners.
      if (handled) detail.querySelector('[data-case-mode="5"]')?.click();
      return mount(detail, options) || handled;
    };
  }
  new MutationObserver(() => {
    const chunk = document.getElementById('lexicalChunkDialog');
    if (chunk && !mounted.has(chunk)) {
      const word = chunk.querySelector('.knowledge-word')?.textContent.trim();
      const row = window.WORD_DETAIL_CASE?.collocations?.find(candidate => candidate.detail?.word === word || candidate.term === word);
      mount(chunk, { caseData: row?.detail });
    }
  }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('resize', fit); document.addEventListener('fullscreenchange', fit);
  window.WordDetailNavigation = { mount, select, showAll, fit, arrangeSenseModules, reconfigure, isMounted: detail => mounted.has(detail), getState: detail => { const model = mounted.get(detail || document.getElementById('wordDetailDialog')); return model ? { active: model.active, pos: model.pos, modules: model.rows.map(row => row.id), sourceSenseCount: model.rows.find(row => row.id === 'meanings')?.content.querySelectorAll('.resource-sense-line,.wdc-sense').length || 0 } : null; } };
})();
