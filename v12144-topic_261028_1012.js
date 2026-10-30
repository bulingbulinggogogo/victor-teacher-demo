/* Topic practice keeps all source groups visible at the original teaching size. */
(() => {
  'use strict';
  const dialog = document.getElementById('popover');
  if (!dialog || typeof resourceItemDetail !== 'function') return;
  const sources = new Map(), mounted = new Set(), practiceStates = new Map();
  const widthContext = document.createElement('canvas').getContext('2d');
  let sequence = 0, frame = 0;
  const esc = value => escapeHtml(String(value ?? ''));
  const matchRecord = item => (window.DEMO_KNOWLEDGE_ENHANCEMENTS?.topicPairs || []).find(record =>
    Number(record.analysisRow) === Number(item.analysisRow || item.sourceAnalysisRow)
    || (record.analysisRecordId && String(record.analysisRecordId) === String(item.analysisRecordId || item.id)));
  const originalDetail = resourceItemDetail;
  resourceItemDetail = function compactTopicDetail(item) {
    const html = originalDetail(item), record = matchRecord(item);
    if (!record || !Array.isArray(record.groups)) return html;
    const template = document.createElement('template'); template.innerHTML = html;
    const root = template.content.querySelector('.ke-topic-practice');
    if (!root) return html;
    const key = String(++sequence); sources.set(key, record); root.dataset.compactTopicKey = key;
    return template.innerHTML;
  };
  function putTools(module) {
    const api = window.ClassroomTools;
    if (api?.attach) {
      if (module.attachedApi === api && module.actions.isConnected && module.directions.isConnected && (!module.navigation || module.navigation.isConnected)) return;
      api.attach(dialog, module.actions, 'topic-actions');
      api.attach(dialog, module.directions, 'topic-direction');
      if (module.navigation) api.attach(dialog, module.navigation, 'topic-navigation');
      module.attachedApi = api; module.fallback?.remove(); module.fallback = null;
      return;
    }
    const article = module.root.closest('.resource-popover-page > article');
    if (!article) return;
    if (!module.fallback) {
      module.fallback = document.createElement('footer'); module.fallback.className = 'tc-bottom-tools';
      article.append(module.fallback);
    }
    if (module.actions.parentElement !== module.fallback) module.fallback.append(module.actions);
    if (module.navigation && module.navigation.parentElement !== module.fallback) module.fallback.append(module.navigation);
  }
  const number = value => parseFloat(value) || 0;
  const orderedRows = module => { const byButton=new Map(module.rows.map(row=>[row.button,row])); return [...module.grid.querySelectorAll('.tc-term')].map(button=>byButton.get(button)).filter(Boolean); };
  function fit(module) {
    const grid=module.grid,body=dialog.querySelector('.resource-popover-body');
    if(!module.root.isConnected||!body||dialog.classList.contains('hidden'))return;
    const cards=[...grid.querySelectorAll('.tc-term')],groups=[...grid.querySelectorAll('.single-group')];
    const first=cards[0],items=groups[0]?.querySelector('.single-items');if(!first||!items)return;
    const textStyle=getComputedStyle(first.querySelector('.tc-prompt')),cardStyle=getComputedStyle(first);
    widthContext.font=textStyle.font;
    const textWidth=Math.max(...module.terms.flatMap(term=>[term.chinese,term.english]).map(text=>widthContext.measureText(text||'').width));
    const gap=number(getComputedStyle(items).columnGap),padding=number(cardStyle.paddingLeft)+number(cardStyle.paddingRight)+number(cardStyle.borderLeftWidth)+number(cardStyle.borderRightWidth);
    const required=Math.ceil(textWidth+padding+4),available=items.clientWidth;
    const columns=Math.max(1,Math.min(Math.max(...module.groups.map(g=>g.items.length)),Math.floor((available+gap)/(required+gap))));
    const font=number(textStyle.fontSize),lineHeight=number(textStyle.lineHeight);
    const cardHeight=Math.ceil(2*lineHeight+number(cardStyle.rowGap)+number(cardStyle.paddingTop)+number(cardStyle.paddingBottom)+number(cardStyle.borderTopWidth)+number(cardStyle.borderBottomWidth));
    const set=(key,value)=>{if(dialog.style.getPropertyValue(key)!==value)dialog.style.setProperty(key,value);};
    set('--single-columns',String(columns));set('--single-card-height',cardHeight+'px');
    grid.dataset.tcColumns=String(columns);
    module.metrics={columns,font,answerFont:font,cardHeight,requiredWidth:required,availableWidth:available,cards:cards.length,groups:groups.length,scrollHeight:body.scrollHeight,clientHeight:body.clientHeight};
    module.rows.forEach(({button,term})=>{button.dataset.baseFont=String(font);button.dataset.fittedFont=String(font);button.dataset.fitRatio='1';button.dataset.requiredWidth=String(required);button.dataset.availableWidth=String(button.clientWidth);button.dataset.sourceEnglish=term.english||'';button.dataset.sourceChinese=term.chinese||'';});
  }
  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      mounted.forEach(module => {
        if (!module.root.isConnected) {
          module.observer.disconnect(); module.actions.remove(); module.directions.remove(); module.navigation?.remove(); module.fallback?.remove(); mounted.delete(module);
        } else { putTools(module); fit(module); }
      });
    });
  }
  function mount(oldRoot) {
    const sourceKey = oldRoot.dataset.compactTopicKey;
    const record = sources.get(sourceKey);
    if (!record) return;
    const groups = record.groups.filter(group => Array.isArray(group.items) && group.items.length);
    if (!groups.length) return;
    const terms = groups.flatMap(group => group.items), offsets = []; let count = 0;
    groups.forEach(group => { offsets.push(count); count += group.items.length; });
    const root = document.createElement('div'); root.className = 'ke-topic-practice tc-practice'; root.dataset.bound = 'true';
    root.dataset.compactTopicMounted = 'true'; root.dataset.topicTitle = record.title || '';
    root.dataset.topicTermCount = String(terms.length);
    const grid = document.createElement('div'); grid.className = 'tc-grid';
    const status = document.createElement('span'); status.className = 'ke-sr-only'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div'); actions.className = 'tc-actions'; actions.setAttribute('role', 'toolbar'); actions.setAttribute('aria-label', '话题词汇练习');
    actions.innerHTML = '<button type="button" data-tc-step="previous" disabled>上一个</button><div class="tc-directions"><button type="button" data-tc-direction aria-label="切换汉译英或英译汉">汉译英</button></div><button type="button" data-tc-step="next">下一个</button><button type="button" data-tc-all>全部显示</button>';
    const directions=actions.querySelector('.tc-directions');directions.classroomMediaOwner=root;
    const navigation = null;
    root.append(grid, status, actions);
    dialog.querySelectorAll('.ke-topic-frozen-toolbar').forEach(toolbar => toolbar.remove());
    oldRoot.replaceWith(root); dialog.classList.add('tc-topic-dialog');dialog.scrollTop=0;dialog.scrollLeft=0;
    let saved = practiceStates.get(record);
    if (!saved) {
      saved = { direction:'zh-en', revealed:new Set(), cursor:-1 };
      practiceStates.set(record, saved);
    }
    const module = { record, root, grid, status, actions, directions, navigation, groups, terms, offsets, direction: saved.direction, revealed: saved.revealed, cursor:saved.cursor ?? -1, rows: [], fallback: null };
    function draw() {
      grid.replaceChildren(); module.rows = [];
      groups.forEach((group, groupIndex) => {
        const section=document.createElement('section');section.className='single-group';section.dataset.groupIndex=String(groupIndex);const items=document.createElement('div');items.className='single-items';section.append(items);grid.append(section);
        if (String(group.title || '').trim()) {
          const title = document.createElement('h3'); title.className = 'tc-stage-title';
          title.textContent = group.title; section.prepend(title);
        }
        group.items.forEach((term, index) => {
          const key = offsets[groupIndex] + index;
          const button = document.createElement('button'); button.type = 'button'; button.className = 'tc-term'; button.dataset.tcTerm = String(key);
          button.innerHTML = '<span class="tc-prompt"></span><strong class="tc-answer"></strong>';
          module.rows.push({button, term, key}); items.append(button);
        });
      });
      sync(); schedule();
    }
    function sync() {
      saved.direction = module.direction; saved.cursor = module.cursor;
      module.rows.forEach(({button, term, key}) => {
        const front = module.direction === 'zh-en' ? term.chinese : term.english;
        const answer = module.direction === 'zh-en' ? term.english : term.chinese;
        button.querySelector('.tc-prompt').textContent = front || '';
        button.querySelector('.tc-answer').textContent = answer || '';
        button.querySelector('.tc-prompt').dataset.previewLanguage=module.direction==='zh-en'?'zh':'en';
        button.querySelector('.tc-answer').dataset.previewLanguage=module.direction==='zh-en'?'en':'zh';
        const revealed = module.revealed.has(key);
        button.classList.toggle('tc-current',key===module.cursor);if(key===module.cursor)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');
        button.classList.toggle('tc-revealed', revealed); button.setAttribute('aria-pressed', String(revealed));
        button.querySelector('.tc-answer').setAttribute('aria-hidden', String(!revealed));
        button.setAttribute('aria-label', `${front || ''}，${revealed ? '隐藏答案' : '显示答案'}`);
      });
      const direction = directions.querySelector('[data-tc-direction]');
      direction.dataset.tcDirection = module.direction;
      direction.textContent = module.direction === 'zh-en' ? '英译汉' : '汉译英';
      direction.setAttribute('aria-label', '当前' + (module.direction === 'zh-en' ? '汉译英，切换为英译汉' : '英译汉，切换为汉译英'));
      const all = module.revealed.size === terms.length;
      const allButton = actions.querySelector('[data-tc-all]'); allButton.textContent = all ? '全部隐藏' : '全部显示'; allButton.setAttribute('aria-pressed', String(all));
      const order=orderedRows(module), position=order.findIndex(row=>row.key===module.cursor);
      actions.querySelector('[data-tc-step="previous"]').disabled = position <= 0;
      actions.querySelector('[data-tc-step="next"]').disabled = position >= order.length - 1;
      status.textContent = `当前第${Math.max(0,position+1)}项，已显示${module.revealed.size}项答案，共${terms.length}项`;
    }
    function handle(event) {
      const direction = event.target.closest('[data-tc-direction]'), all = event.target.closest('[data-tc-all]'), term = event.target.closest('[data-tc-term]'), stepButton = event.target.closest('[data-tc-step]');
      if (!direction && !all && !term && !stepButton) return;
      event.stopPropagation();
      if (stepButton) { if (!stepButton.disabled) step(stepButton.dataset.tcStep === 'next'); return; }
      if (direction) { module.direction = module.direction === 'zh-en' ? 'en-zh' : 'zh-en'; module.revealed.clear(); module.cursor=-1; }
      if (term) { const key = Number(term.dataset.tcTerm); module.cursor=key; module.revealed.has(key) ? module.revealed.delete(key) : module.revealed.add(key); }
      if (all) { if (module.revealed.size === terms.length){module.revealed.clear();module.cursor=-1;}else{terms.forEach((_,key)=>module.revealed.add(key));module.cursor=terms.length-1;} }
      sync(); schedule();
    }
    root.addEventListener('click', handle); actions.addEventListener('click', handle); directions.addEventListener('click', handle);
    function keepRowVisible(button) {
      const body = root.closest('.resource-popover-body');
      if (!body || body.scrollHeight <= body.clientHeight + 1) return;
      const row = button.getBoundingClientRect(), box = body.getBoundingClientRect();
      if (row.bottom > box.bottom - 2) body.scrollTop += row.bottom - box.bottom + 2;
      else if (row.top < box.top + 2) body.scrollTop -= box.top - row.top + 2;
    }
    function step(down) {
      const order=orderedRows(module),position=order.findIndex(row=>row.key===module.cursor);
      if(down ? position>=order.length-1 : position<=0)return;
      if(!down)module.revealed.delete(module.cursor);
      const row=order[position+(down?1:-1)];
      if(row){module.cursor=row.key;module.revealed.add(row.key);sync();schedule();requestAnimationFrame(()=>keepRowVisible(row.button));}
    }

    module.stepKey = event => step(event.key === 'ArrowDown');
    module.observer = new ResizeObserver(schedule); module.observer.observe(root); mounted.add(module); module.syncNavigation=sync; draw(); putTools(module);
  }
  function scan() {
    dialog.querySelectorAll('.ke-topic-practice[data-compact-topic-key]').forEach(mount);
    if (!dialog.querySelector('.tc-practice')) dialog.classList.remove('tc-topic-dialog');
    else if (!dialog.classList.contains('hidden') && !dialog.classList.contains('ke-expanded')) {
      dialog.classList.add('ke-expanded');
      window.ClassroomTools?.refresh?.();
    }
    schedule();
  }
  const oldBind = bindResourcePopoverInteractions;
  bindResourcePopoverInteractions = function compactTopicBind() { oldBind(); scan(); };
  const oldClose = closeResourcePopover;
  closeResourcePopover = function compactTopicClose() { oldClose(); sources.clear(); practiceStates.clear(); scan(); };
  function visible(element) {
    return !!element && !element.closest('.hidden,[hidden],[inert],[aria-hidden="true"]') && getComputedStyle(element).visibility !== 'hidden' && element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0;
  }
  function activeTopic(event) {
    const target = event.target instanceof Element ? event.target : document.activeElement;
    if (!visible(dialog) || dialog.inert || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return null;
    if (target?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="slider"]')) return null;
    const targetDialog = target?.closest('[role="dialog"],[aria-modal="true"]');
    if (targetDialog && targetDialog !== dialog) return null;
    const z = number(getComputedStyle(dialog).zIndex);
    if ([...document.querySelectorAll('[role="dialog"],[aria-modal="true"]')].some(other => other !== dialog && visible(other) && !other.contains(dialog) && number(getComputedStyle(other).zIndex) >= z)) return null;
    const module = [...mounted].find(candidate => visible(candidate.root));
    if (!module || (document.fullscreenElement && !document.fullscreenElement.contains(module.root))) return null;
    return module;
  }
  // Share the modal capture surface. A topic arrow cannot reach question navigation or native scrolling.
  document.addEventListener('keydown', event => {
    const module = activeTopic(event);
    if (!module) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); event.stopImmediatePropagation(); module.stepKey(event);
    }
  }, true);
  new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&!n.matches('[data-topic-measure]')&&!n.closest('[data-topic-measure]'))))scan();}).observe(dialog,{childList:true,subtree:true});
  new MutationObserver(schedule).observe(document.documentElement, {attributes:true,attributeFilter:['style','class']});
  addEventListener('resize', schedule, {passive:true}); document.fonts?.ready.then(schedule);
  document.fonts?.addEventListener('loadingdone', schedule);

  window.TopicCompact = { scan, fit: schedule, metrics:()=>[...mounted].filter(m=>m.root.isConnected).map(m=>m.metrics), refreshNavigation:()=>{for(const module of mounted)if(module.root.isConnected)module.syncNavigation?.();}, inspect: () => [...mounted].filter(module => module.root.isConnected).map(module => ({title:module.root.dataset.topicTitle,stage:null,cursor:module.cursor,displayOrder:orderedRows(module).map(row=>row.key),direction:module.direction,total:module.terms.length,columns:Number(module.grid.dataset.tcColumns),rows:module.rows.map(({button,term,key})=>({key,english:term.english,chinese:term.chinese,baseFont:Number(button.dataset.baseFont),font:Number(button.dataset.fittedFont),ratio:Number(button.dataset.fitRatio),requiredWidth:Number(button.dataset.requiredWidth),availableWidth:Number(button.dataset.availableWidth),wide:button.classList.contains('tc-wide'),wraps:button.dataset.wraps==='true',revealed:module.revealed.has(key)}))})) };
})();
