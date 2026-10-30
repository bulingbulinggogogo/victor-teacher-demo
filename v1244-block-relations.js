/* Block relations retain their source block keys and independent visibility.
 * Meaning-level near/opposite words remain owned by the native feature tools. */
(() => {
  'use strict';
  const api = window.V1220WordDetail;
  if (!api?.finish || window.V1244BlockRelations) return;
  const models = new WeakMap();
  const fields = [['synonyms','同义表达'],['antonyms','反义表达']];
  const text = value => String(value ?? '').trim();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const pos = value => {
    const key = text(value).toLowerCase().match(/^(adj|adv|n|vt|vi|v)(?=[.\s\[(（]|$)/)?.[1];
    return /^v[ti]$/.test(key || '') ? 'v' : key || text(value).toLowerCase();
  };
  function rich(row, field) {
    const value = String(row[field] ?? '');
    const runs = row.sourceRichTextRuns?.[field] || row.richText?.[field] || row.sourceRichText?.[field];
    if (!Array.isArray(runs) || runs.map(run => run.text || '').join('') !== value) return escape(value);
    return runs.map(run => {
      let copy = escape(run.text || '');
      if (run.bold) copy = '<strong>' + copy + '</strong>';
      if (run.italic) copy = '<em>' + copy + '</em>';
      if (run.underline) copy = '<u>' + copy + '</u>';
      return run.isRed ? '<span class="v1220-source-red">' + copy + '</span>' : copy;
    }).join('');
  }
  function sourceRows(word) {
    const groups = new Map();
    (api.displayBlocks?.(word) || word.collocations || []).forEach(row => {
      const key = text(row.blockKey);
      if (!key) return;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });
    const rows = new Map();
    groups.forEach((entries,key) => {
      const identity = row => JSON.stringify([row.phrase,row.parentSenseKey,row.parentHead,row.synonyms,row.antonyms]);
      if (entries.every(row => identity(row) === identity(entries[0]))) rows.set(key,entries[0]);
    });
    return rows;
  }
  function mount(detail, result) {
    if (models.has(detail)) { models.get(detail).apply(); return true; }
    const word = result?.word || api.getModel?.(detail)?.word;
    const actions = detail.querySelector('.vwn-secondary-tools');
    const nav = detail.querySelector('.v1225-word-main-nav,.vwn-main-nav');
    if (!word || !actions || !nav) return false;
    const rows = sourceRows(word), records = [], groups = new Map();
    detail.querySelectorAll('[data-block-key],[data-sense-block]').forEach(block => {
      const key = block.dataset.blockKey || block.dataset.senseBlock;
      const row = rows.get(key);
      if (!row) return;
      const module = block.closest('[data-case-module]')?.dataset.caseModule;
      if (!['meanings','collocations'].includes(module)) return;
      fields.forEach(([field,label]) => {
        if (!text(row[field])) return;
        let line = [...block.querySelectorAll(':scope > .v1226-block-associated > .v1226-block-field,:scope > .v1226-block-field')].find(node =>
          text(node.querySelector('.v1226-block-field-label')?.textContent) === label);
        if (!line) {
          line = document.createElement('p');line.className = 'v1226-block-field';
          const caption = document.createElement('span');caption.className = 'v1226-block-field-label';caption.dataset.wordTagField = 'usage';caption.textContent = label;
          const copy = document.createElement('span');copy.innerHTML = rich(row,field);
          line.append(caption,copy);
          const associated = block.querySelector(':scope > .v1226-block-associated');
          if (associated) associated.prepend(line);
          else {
            const anchor = block.querySelector(':scope > .v1223-sense-block-usage') || block.querySelector(':scope > .v1223-sense-block-heading');
            if (anchor) anchor.after(line); else block.append(line);
          }
        } else {
          const copy = line.querySelector(':scope > span:not(.v1226-block-field-label)');
          if (copy) copy.innerHTML = rich(row,field);
        }
        line.dataset.v1244BlockRelationContent = field;line.dataset.v1244BlockKey = key;
        line.hidden = true;
        records.push({node:line,block,row,key,field,module});
      });
    });
    if (!records.length) return false;
    let changed = false, scheduled = false;
    const hidden = (node,value) => { if (node.hidden !== value) { node.hidden=value;changed=true; } };
    const attr = (node,name,value) => { if (node.getAttribute(name) !== value) { node.setAttribute(name,value);changed=true; } };
    function available(record) {
      if (record.module === 'meanings') {
        if (record.block.hidden) return false;
        const group = record.block.closest('[data-v1227-pos]');
        const selected = window.WordDetailNavigation?.getState?.(detail)?.pos || word.parts?.[0]?.partOfSpeech;
        return !group || (!group.hidden && pos(group.dataset.v1227Pos) === pos(selected));
      }
      return !record.block.hidden && !record.block.closest('[data-block-group][hidden]');
    }
    function apply() {
      scheduled=false;changed=false;
      const active = nav.querySelector('[data-word-module][aria-selected="true"]')?.dataset.wordModule;
      groups.forEach(group => {
        // Word-detail relations have one owner: the common meaning-feature state.
        // The old independent switch no longer drifts from the global toggle.
        const unified=group.module==='meanings' ? api.featureState?.(detail) : null;
        if(unified){group.state.synonyms=!!unified.relations;group.state.antonyms=!!unified.relations;}
        let hasContent = false;
        group.buttons.forEach((button,field) => {
          const hasField = records.some(record => record.module===group.module && record.field===field && available(record));
          hasContent ||= hasField;
          hidden(button,!hasField);button.disabled=!hasField;
          const selected = hasField && group.state[field];
          attr(button,'aria-pressed',String(selected));attr(button,'aria-selected',String(selected));
        });
        hidden(group.controls,group.module==='meanings' || active!==group.module || !hasContent);
      });
      records.forEach(record => hidden(record.node,!groups.get(record.module).state[record.field]));
      if (changed) window.V1223WordDock?.refresh?.(detail);
    }
    function schedule() { if (!scheduled) { scheduled=true;queueMicrotask(apply); } }
    for (const module of ['meanings','collocations']) {
      const matching = records.filter(record => record.module===module);
      if (!matching.length) continue;
      const controls = document.createElement('div');controls.className='v1220-secondary-tabs';
      controls.dataset.v1220SubnavFor=module;controls.dataset.v1244BlockRelationControls=module;controls.setAttribute('aria-label','词块表达开关');
      const group={module,controls,state:{synonyms:module==='meanings',antonyms:module==='meanings'},buttons:new Map()};
      fields.forEach(([field,label]) => {
        if (!matching.some(record=>record.field===field)) return;
        const button=document.createElement('button');button.type='button';button.dataset.v1244BlockRelation=field;button.textContent=label;
        button.setAttribute('aria-pressed','false');controls.append(button);group.buttons.set(field,button);
      });
      controls.addEventListener('click',event => {
        const button=event.target.closest('[data-v1244-block-relation]');
        if (!button || !controls.contains(button) || button.hidden || button.disabled) return;
        const field=button.dataset.v1244BlockRelation;group.state[field]=!group.state[field];apply();
      });
      groups.set(module,group);actions.append(controls);
    }
    function reveal(target) {
      if (!target || !detail.contains(target)) return false;
      const related=records.filter(record=>record.module==='meanings' && target.contains(record.block));
      related.forEach(record=>{groups.get(record.module).state[record.field]=true;});
      apply();return related.length>0;
    }
    const model={apply,reveal,records,groups};models.set(detail,model);
    nav.addEventListener('click',schedule);detail.addEventListener('word-pos-change',schedule);
    // The existing delegated tag jump uses its private, exact-sense method.
    // Observe only a successful explicit destination after that native handler.
    detail.addEventListener('click',event => {
      const link=event.target.closest('[data-v1241-sense-link]');
      if (!link || !detail.contains(link)) return;
      const key=link.dataset.v1241SenseLink;
      if (detail.dataset.v1241FocusedSense!==key) return;
      const matching=(word.parts || []).flatMap(part=>(part.senses || []).map(sense=>({part,sense}))).filter(({sense})=>String(sense.senseKey || sense.id)===key);
      if (matching.length!==1 || (link.dataset.v1241SensePos && pos(matching[0].part.partOfSpeech)!==pos(link.dataset.v1241SensePos))) return;
      const targets=[...detail.querySelectorAll('[data-latest-sense]')].filter(node=>node.dataset.latestSense===key);
      if (targets.length===1) reveal(targets[0]);
    });
    const observer=new MutationObserver(schedule);
    observer.observe(detail,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','aria-selected','aria-pressed']});
    if (document.body) {
      const connection=new MutationObserver(()=>{if (!detail.isConnected) {observer.disconnect();connection.disconnect();}});
      connection.observe(document.body,{childList:true,subtree:true});
    }
    apply();window.V1223WordDock?.refresh?.(detail);return true;
  }
  const finish=api.finish;
  api.finish=function(detail,result) {const value=finish.apply(this,arguments);if(result?.word)mount(detail,result);return value;};
  const revealSense=api.revealSense;
  if (revealSense) api.revealSense=function(detail,key,expectedPOS) {
    const success=revealSense.apply(this,arguments);
    if (success) {
      const targets=[...detail.querySelectorAll('[data-latest-sense]')].filter(node=>node.dataset.latestSense===text(key));
      if (targets.length===1) models.get(detail)?.reveal(targets[0]);
    }
    return success;
  };
  window.V1244BlockRelations={mount,refresh:detail=>models.get(detail)?.apply(),inspect(detail=document.getElementById('wordDetailDialog')) {
    const model=models.get(detail);if(!model)return null;
    return {groups:[...model.groups.values()].map(group=>({module:group.module,hidden:group.controls.hidden,state:{...group.state},buttons:[...group.buttons.values()].map(button=>({field:button.dataset.v1244BlockRelation,hidden:button.hidden,pressed:button.getAttribute('aria-pressed')}))})),records:model.records.map(record=>({module:record.module,blockKey:record.key,field:record.field,value:text(record.row[record.field]),hidden:record.node.hidden,parentSenseKey:record.row.parentSenseKey || null}))};
  }};
})();
