/* The current word's block examples share one native sidebar switch.
 * Source block ownership, examples, translations and citations stay intact. */
(() => {
  'use strict';
  const api = window.V1220WordDetail;
  if (!api?.render || !api?.finish || window.V1250BlockExampleToggle) return;
  const models = new WeakMap();
  const moduleName = 'collocations';
  const text = value => String(value ?? '').trim();
  function ownedKeys(word) {
    const ownership = window.V1246BlockOwnership;
    const rows = ownership?.rows?.(word) || api.displayBlocks?.(word) || word?.collocations || [];
    return new Set(rows.filter(row => !ownership || ownership.belongsToWord(row,word)).map(row => text(row.blockKey)).filter(Boolean));
  }
  function recordsIn(root,word) {
    const keys = ownedKeys(word), records = [], seen = new Set();
    root.querySelectorAll('[data-case-module="collocations"] [data-block-key]').forEach(block => {
      const key = text(block.dataset.blockKey);
      if (!keys.has(key)) return;
      block.querySelectorAll('article[data-block-example],article[data-v1228-block-target]').forEach(node => {
        const target = text(node.dataset.blockExample || node.dataset.v1228BlockTarget);
        if (target !== key || node.closest('[data-block-key]') !== block || seen.has(node)) return;
        seen.add(node);records.push({node,block,key});
      });
    });
    return records;
  }
  function prepare(result) {
    if (!result?.word || !result.html) return result;
    const root = document.createElement('div');root.innerHTML = result.html;
    const records = recordsIn(root,result.word);
    if (!records.length) return result;
    // Mark before insertion so a new word cannot flash its default-off examples.
    records.forEach(({node,key}) => {node.dataset.v1250BlockExample=key;node.hidden=true;});
    return {...result,html:root.innerHTML};
  }
  function mount(detail,result) {
    if (detail?.id !== 'wordDetailDialog') return false;
    if (models.has(detail)) {models.get(detail).apply();return true;}
    const word = result?.word || api.getModel?.(detail)?.word;
    const nav = detail.querySelector('.v1225-word-main-nav,.vwn-main-nav');
    const actions = detail.querySelector('.vwn-secondary-tools');
    if (!word || !nav || !actions) return false;
    const records = recordsIn(detail,word);
    if (!records.length) return false;
    records.forEach(({node,key}) => {node.dataset.v1250BlockExample=key;node.hidden=true;});
    const controls = document.createElement('div');controls.className='v1220-secondary-tabs';
    controls.dataset.v1220SubnavFor=moduleName;controls.dataset.v1250BlockExampleControls='';
    controls.setAttribute('aria-label','词块例句显隐');controls.hidden=true;
    const button = document.createElement('button');button.type='button';button.textContent='词块例句';
    button.dataset.v1250BlockExampleToggle='';button.setAttribute('aria-pressed','false');button.setAttribute('aria-selected','false');
    controls.append(button);actions.append(controls);
    let enabled=false, scheduled=false;
    const available = record => record.node.isConnected && !record.block.hidden && !record.block.closest('[data-block-group][hidden]');
    function apply() {
      scheduled=false;
      const active=nav.querySelector('[data-word-module][aria-selected="true"]')?.dataset.wordModule;
      const hasExamples=records.some(available);
      const off=active!==moduleName || !hasExamples;
      let changed=false;
      if (controls.hidden!==off) {controls.hidden=off;changed=true;}
      for (const name of ['aria-pressed','aria-selected']) {
        const value=String(enabled && hasExamples);
        if (button.getAttribute(name)!==value) {button.setAttribute(name,value);changed=true;}
      }
      records.forEach(({node}) => {if(node.hidden===enabled){node.hidden=!enabled;changed=true;}});
      if (changed) {
        window.V1223WordDock?.refresh?.(detail);
        window.V1222SenseExamples?.layoutCitations?.(detail);
      }
    }
    function schedule() {if (!scheduled) {scheduled=true;queueMicrotask(apply);}}
    controls.addEventListener('click',event => {
      if (!event.target.closest('[data-v1250-block-example-toggle]') || controls.hidden || button.disabled) return;
      enabled=!enabled;apply();
    });
    nav.addEventListener('click',schedule);
    const observer=new MutationObserver(schedule);
    observer.observe(detail,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','aria-selected']});
    const connection=new MutationObserver(() => {
      if (!detail.isConnected) {observer.disconnect();connection.disconnect();nav.removeEventListener('click',schedule);}
    });
    connection.observe(document.body,{childList:true,subtree:true});
    models.set(detail,{apply,records,controls,button,get enabled(){return enabled;}});
    apply();window.V1223WordDock?.refresh?.(detail);return true;
  }
  const render=api.render;
  api.render=function() {return prepare(render.apply(this,arguments));};
  const finish=api.finish;
  api.finish=function(detail,result) {const value=finish.apply(this,arguments);if(result?.word)mount(detail,result);return value;};
  window.V1250BlockExampleToggle=Object.freeze({mount,prepare,inspect(detail=document.getElementById('wordDetailDialog')) {
    const model=models.get(detail);if(!model)return null;
    return {enabled:model.enabled,controlsHidden:model.controls.hidden,pressed:model.button.getAttribute('aria-pressed'),
      records:model.records.map(({node,block,key})=>({blockKey:key,hidden:node.hidden,category:block.dataset.blockCategory,
        hasTranslation:!!node.querySelector('.v1222-sense-example-translation'),module:node.closest('[data-case-module]')?.dataset.caseModule}))};
  }});
})();
