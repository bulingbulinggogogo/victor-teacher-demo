/* V74: paint real multi-selected categories; retain completed meaning cards and original animated media together.
 * The source filter state, source media, sense ownership and independent
 * polysemy teaching tab keep their original owners. */
(() => {
  'use strict';
  const api=window.V1220WordDetail;
  if(!api?.finish||window.V1274DockCards)return;
  const models=new WeakMap();
  const meaningsFor=detail=>detail?.querySelector('.vwn-panel[aria-labelledby$="-tab-meanings"]');
  const assign=(node,name,value)=>{if(node.getAttribute(name)!==value)node.setAttribute(name,value);};
  function syncCategoryHighlights(detail){
    const state=api.featureState?.(detail);
    if(!state)return;
    const selected=state.blockCategories,buttons=[...detail.querySelectorAll('[data-word-block-category]')];
    const available=buttons.filter(node=>node.dataset.wordBlockCategory!=='all'&&!node.hidden&&!node.disabled&&Number(node.dataset.categoryCount)>0);
    buttons.forEach(button=>{
      const category=button.dataset.wordBlockCategory,count=Number(button.dataset.categoryCount)||0;
      const displayed=Boolean(state.blocks&&!button.hidden&&!button.disabled&&count>0&&selected instanceof Set&&
        (category==='all'?available.length>0&&available.every(node=>selected.has(node.dataset.wordBlockCategory)):selected.has(category)));
      // Paint follows the same selected set as content and accessible state.
      assign(button,'data-v1271-category-displayed',String(displayed));
    });
  }
  function staticElement(button){
    if(button.tagName!=='BUTTON'){
      button.removeAttribute('role');button.removeAttribute('tabindex');
      return button;
    }
    const element=document.createElement('div');
    for(const attribute of [...button.attributes]){
      if(['type','disabled','tabindex','role','aria-pressed','aria-expanded','aria-label'].includes(attribute.name)||
        attribute.name==='data-pgi-copy'||attribute.name==='data-v1247-reason-action')continue;
      element.setAttribute(attribute.name,attribute.value);
    }
    while(button.firstChild)element.append(button.firstChild);
    button.replaceWith(element);return element;
  }
  function finishNominalization(detail,module){
    if(module.dataset.v1271StaticFinal)return;
    const all=module.querySelector('[data-v1247-nominalization-all]');
    if(all&&all.getAttribute('aria-pressed')!=='true')all.click();
    // Use the original final-stage callback first, including its source image
    // assignment. This fallback covers a late source instance without an all
    // control, using its already-supplied reveal fields and source URL only.
    module.querySelectorAll('[data-v1247-bridge-prompt],.v1247-reasoning-result-prompt').forEach(node=>node.hidden=true);
    module.querySelectorAll('[data-v1247-bridge-reveal],[data-v1247-bridge-arrow],[data-v1247-result-reveal]').forEach(node=>node.hidden=false);
    module.querySelectorAll('[data-v1247-source-src]').forEach(image=>{
      if(!image.hasAttribute('src')&&image.dataset.v1247SourceSrc)image.src=image.dataset.v1247SourceSrc;
    });
    module.dataset.v1247ReasoningStage='2';
    // The old module is controlled by a private, keyboard-aware stage model.
    // Retire that exact instance after rendering its real completed contents;
    // the meaning card itself and its feature/disclosure listeners stay live.
    const final=module.cloneNode(true);
    final.dataset.v1271StaticFinal='true';final.removeAttribute('data-v1247-reasoning-direction');
    final.querySelectorAll('.v1247-reasoning-controls,.v1247-reasoning-result-prompt').forEach(node=>node.remove());
    final.querySelectorAll('[data-v1247-bridge-prompt]').forEach(node=>node.remove());
    final.querySelectorAll('[data-v1247-reason-action]').forEach(node=>{
      const plain=staticElement(node);plain.removeAttribute('data-v1247-reason-action');
      plain.removeAttribute('aria-expanded');plain.removeAttribute('aria-pressed');plain.removeAttribute('tabindex');
    });
    module.replaceWith(final);
  }
  function restoreSourceImage(image){
    const source=image.dataset.v1271SourceImage;
    if(source&&image.getAttribute('src')!==source)image.setAttribute('src',source);
    // “Static card” refers to completed copy without step interaction. Media
    // stays on the supplied original URL, including every GIF frame.
    if(source)image.dataset.v1272RestoredSource=source;
    image.removeAttribute('data-v1271-static-frame');
  }
  function finishCards(detail){
    const meanings=meaningsFor(detail);if(!meanings)return;
    const cards=[...meanings.querySelectorAll('.resource-word-note,[data-v1264-sense-card]')];
    cards.forEach(card=>{
      card.querySelectorAll('img').forEach(restoreSourceImage);
      if(card.dataset.v1271StaticCard)return;
      card.querySelectorAll('.v1247-nominalization').forEach(module=>finishNominalization(detail,module));
      card.querySelectorAll('img').forEach(restoreSourceImage);
      card.querySelectorAll('[data-pgi-copy],[data-v1246-conversion-copy]').forEach(copy=>{
        copy.classList.remove('is-hidden');copy.hidden=false;
        copy.querySelectorAll('[aria-hidden="true"]').forEach(node=>node.removeAttribute('aria-hidden'));
        const plain=staticElement(copy);
        plain.removeAttribute('data-pgi-copy');plain.removeAttribute('data-v1246-conversion-copy');
        plain.removeAttribute('aria-pressed');plain.removeAttribute('aria-label');
      });
      card.querySelectorAll('.vpi-tools,.v1247-polysemy-controls,.v1247-reasoning-controls').forEach(tools=>{
        window.ClassroomTools?.detach?.(detail,tools);tools.remove();
      });
      card.querySelectorAll('.pgi-module[data-graph-kind="polysemy"]').forEach(module=>{
        module.dataset.v1271SourceGraphKind='polysemy';module.dataset.graphKind='static-polysemy';
      });
      // Initial completeness does not remove the user's ordinary tree/card
      // disclosure controls: subsequent clicks continue to use those owners.
      api.setFolds?.(card,true);
      card.querySelectorAll('[data-vft-toggle][aria-expanded="false"]').forEach(button=>button.click());
      card.getAnimations?.({subtree:true}).forEach(animation=>animation.cancel());
      card.dataset.v1271StaticCard='true';
    });
  }
  function sync(detail){
    syncCategoryHighlights(detail);finishCards(detail);
  }
  function mount(detail){
    if(detail?.id!=='wordDetailDialog')return;
    let model=models.get(detail);
    if(!model){
      model={frame:0,observer:null};models.set(detail,model);
      const schedule=()=>{if(!model.frame)model.frame=requestAnimationFrame(()=>{model.frame=0;if(detail.isConnected)sync(detail);});};
      model.observer=new MutationObserver(records=>{
        if(records.some(record=>record.type!=='attributes'||record.oldValue!==record.target.getAttribute(record.attributeName)))schedule();
      });
      model.observer.observe(detail,{subtree:true,childList:true,attributes:true,attributeOldValue:true,
        attributeFilter:['hidden','aria-pressed','aria-selected','class','src','data-v1271-static-frame']});
      detail.addEventListener('word-pos-change',schedule);
    }
    sync(detail);
  }
  const finish=api.finish;
  api.finish=function(detail,result){const value=finish.apply(this,arguments);mount(detail);return value;};
  const controller={refresh:mount,inspect(detail=document.getElementById('wordDetailDialog')){
    const meanings=meaningsFor(detail);return {
      categories:[...(detail?.querySelectorAll('[data-word-block-category]')||[])].map(button=>({
        category:button.dataset.wordBlockCategory,filterPressed:button.getAttribute('aria-pressed'),
        displayed:button.dataset.v1271CategoryDisplayed==='true',hidden:button.hidden,count:Number(button.dataset.categoryCount)||0})),
      cards:[...(meanings?.querySelectorAll('[data-v1271-static-card]')||[])].map(card=>({
        type:card.dataset.v1264SenseCard||card.dataset.wordNoteFeature||card.querySelector('h4')?.textContent.trim(),
        sense:card.closest('[data-latest-sense]')?.dataset.latestSense,
        pendingCopies:card.querySelectorAll('[data-pgi-copy].is-hidden,[data-v1247-result-reveal][hidden]').length,
        stepControls:card.querySelectorAll('[data-v1247-reason-action],[data-v1247-poly-action],[data-pgi-all]').length,
        staticFinal:!!card.querySelector('[data-v1271-static-final="true"]'),
        originalImages:[...card.querySelectorAll('img')].map(image=>({source:image.getAttribute('src')||'',restored:image.dataset.v1272RestoredSource||'',alt:image.alt}))}))};
  }};
  window.V1274DockCards=controller;
  window.V1272DockCards=controller;
  window.V1271DockCards=controller; // Preserve existing diagnostic callers.
  mount(document.getElementById('wordDetailDialog'));
})();
