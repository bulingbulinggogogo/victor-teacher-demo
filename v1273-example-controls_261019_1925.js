/* V73: local example-source All remains in the native source-controls group.
 * V72 filtering/export behavior and label-only facets are retained.
 * Source availability/state and all filtering/export data retain their owners. */
(() => {
  'use strict';
  const api=window.V1220WordDetail;
  if(!api?.finish||window.V1273ExampleControls)return;
  const kinds=['ordinary','textbook','exam'],models=new WeakMap();let sequence=0;
  const controlsFor=detail=>detail?.querySelector('[data-v1220-subnav-for="meanings"][aria-label="释义内容开关"]');
  const available=(controls)=>kinds.filter(kind=>{const button=controls.querySelector('[data-word-feature="'+kind+'"]');return button&&!button.disabled;});
  function assign(node,name,value){if(node.getAttribute(name)===value)return false;node.setAttribute(name,value);return true;}
  function labelOnlyFacets(detail){
    let changed=0;
    detail.querySelectorAll('.v1270-example-controls [data-v1270-filter]').forEach(button=>{
      // The option value is authoritative; a unit/year's own digits are part of
      // this label. No numeral is guessed or stripped from the option itself.
      const label=button.dataset.v1270Value||'全部';
      if(button.textContent!==label||button.querySelector('.count,.facet-count,.filter-count,.v1270-filter-count,[data-facet-count],[data-filter-count],small')){
        button.replaceChildren(document.createTextNode(label));changed++;
      }
    });return changed;
  }
  function sync(detail){
    const model=models.get(detail);if(!model)return;
    const controls=controlsFor(detail),state=api.featureState?.(detail);if(!controls||!state)return;
    if(model.controls!==controls){mount(detail);return;}
    const parent=controls.querySelector('[data-word-feature="examples"]');if(!parent)return;
    const choices=available(controls),all=model.all,pressed=Boolean(state.examples&&choices.length&&choices.every(kind=>state[kind]));let changed=false;
    // Native dock refresh moves the whole controls group. Keep this child in
    // that same group, immediately before the native source children.
    if(all.parentElement!==controls||parent.nextElementSibling!==all){parent.after(all);changed=true;}
    const hidden=!state.examples||!choices.length||parent.hidden||controls.hidden,disabled=!choices.length;
    if(all.hidden!==hidden){all.hidden=hidden;changed=true;}
    if(all.disabled!==disabled){all.disabled=disabled;changed=true;}
    changed=assign(all,'aria-pressed',String(pressed))||changed;
    changed=assign(all,'aria-selected',String(pressed))||changed;
    const targets=(parent.getAttribute('aria-controls')||'').split(/\s+/).filter(Boolean);
    if(!targets.includes(all.id)){targets.unshift(all.id);parent.setAttribute('aria-controls',targets.join(' '));changed=true;}
    labelOnlyFacets(detail);
    if(changed)window.V1223WordDock?.refresh?.(detail);
  }
  function mount(detail){
    if(detail?.id!=='wordDetailDialog')return null;
    const controls=controlsFor(detail),parent=controls?.querySelector('[data-word-feature="examples"]');if(!controls||!parent)return null;
    let model=models.get(detail);
    if(model?.controls===controls){sync(detail);return model;}
    model?.observer.disconnect();model?.all.remove();
    const all=document.createElement('button');all.type='button';all.className='dock-text-action';
    const label=document.createElement('span');label.className='v1225-sub-label';label.textContent='全部';all.append(label);
    all.id='v1273-example-source-all-'+(++sequence);all.dataset.v1272ExampleAll='';all.dataset.v1273ExampleAll='';
    all.dataset.wordFeatureParent='examples';all.dataset.v1267DockLevel='2';
    all.setAttribute('aria-label','全部例句来源');all.setAttribute('aria-pressed','false');all.hidden=true;
    // No data-word-feature attribute: the independent global All must never
    // receive this click, nor may its private apply loop reinterpret this node.
    parent.after(all);
    model={controls,all,observer:null,queued:false};models.set(detail,model);
    all.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();
      const state=api.featureState?.(detail),choices=available(controls);if(!state||!choices.length)return;
      const show=!(state.examples&&choices.every(kind=>state[kind]));
      kinds.forEach(kind=>state[kind]=show&&choices.includes(kind));state.examples=show;
      api.refreshFeatures(detail);sync(detail);
    });
    const schedule=()=>{if(!model.queued){model.queued=true;queueMicrotask(()=>{model.queued=false;if(detail.isConnected)sync(detail);});}};
    model.observer=new MutationObserver(records=>{
      // An option rerender and native source/feature updates only refresh this
      // small UI adapter. They never rewrite any source selection/export data.
      if(records.some(record=>record.type==='childList'||record.oldValue!==record.target.getAttribute(record.attributeName)))schedule();
    });
    model.observer.observe(detail,{subtree:true,childList:true,attributes:true,attributeOldValue:true,attributeFilter:['aria-pressed','aria-expanded','hidden','disabled']});
    detail.addEventListener('word-pos-change',schedule);
    sync(detail);return model;
  }
  const finish=api.finish;
  api.finish=function(detail,result){const value=finish.apply(this,arguments);mount(detail);return value;};
  window.V1273ExampleControls=window.V1272ExampleControls=Object.freeze({refresh:mount,inspect(detail=document.getElementById('wordDetailDialog')){
    const model=models.get(detail),state=api.featureState?.(detail),controls=controlsFor(detail);if(!model||!state||!controls)return null;
    return {parent:state.examples,all:model.all.getAttribute('aria-pressed')==='true',allHidden:model.all.hidden,allInControls:model.all.parentElement===controls,
      allInDock:!!model.all.closest('#classroomDock'),allRendered:!!model.all.getClientRects().length,
      sources:kinds.map(kind=>{const button=controls.querySelector('[data-word-feature="'+kind+'"]');return {kind,selected:!!state[kind],hidden:button?.hidden??true,available:!!button&&!button.disabled};}),
      facets:[...detail.querySelectorAll('.v1270-example-controls [data-v1270-filter]')].map(button=>({value:button.dataset.v1270Value||'',label:button.textContent}))};
  }});
  queueMicrotask(()=>mount(document.getElementById('wordDetailDialog')));
})();
