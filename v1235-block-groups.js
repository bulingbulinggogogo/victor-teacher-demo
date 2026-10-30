/* Block categories own both the sidebar filter and the content disclosure.
 * Existing source blocks, examples, audio buttons and keys move intact. */
(() => {
  'use strict';
  const api=window.V1220WordDetail;
  if(!api?.finish || window.V1235BlockGroups)return;
  const bound=new WeakSet();
  let sequence=0;
  const text=value=>String(value??'').trim();
  const arrow='<svg class="v1227-fold-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  const groupNodes=detail=>[...detail.querySelectorAll('.v1235-block-category-group')];
  const categoryLabel=(category,rows)=>category==='短语动词' && rows.length===1 && rows[0].dataset.blockKey==='demo-present-related-phrasal'?'关联短语动词':category;
  function regroup(detail){
    const panel=detail.querySelector('[data-case-module="collocations"]');
    const idioms=[...(panel?.querySelectorAll('[data-word-idiom-example]') || [])];
    let host=panel?.querySelector('.v1226-block-groups');
    if(!host&&idioms.length){host=document.createElement('div');host.className='v1226-block-groups';panel.prepend(host);}
    if(!host)return [];
    if(host.dataset.v1235CategoryGrouped==='true')return groupNodes(detail);
    const rows=[...host.querySelectorAll('.v1226-block-unit[data-block-key]')];
    if(!rows.length&&!idioms.length)return [];
    const groups=new Map();
    rows.forEach(row=>{
      const related=row.dataset.blockKey==='demo-present-related-phrasal';
      const category=related?'短语动词':text(row.dataset.blockCategory)||text(row.querySelector('.v1226-block-category')?.textContent)||'词块';
      row.dataset.blockCategory=category;
      if(related){const tag=row.querySelector('.v1226-block-category');if(tag)tag.textContent='关联短语动词';}
      const sourceHeading=row.closest('[data-block-group]')?.querySelector(':scope > .v1226-block-group-heading');
      const context=[...(sourceHeading?.querySelectorAll('.v1226-block-pos,.v1226-block-parent-meaning')||[])];
      if(context.length&&!row.querySelector(':scope > .v1235-block-source-context')){
        const source=document.createElement('p');source.className='v1235-block-source-context';
        context.forEach(node=>source.append(node.cloneNode(true)));
        row.prepend(source);
      }
      if(!groups.has(category))groups.set(category,[]);
      groups.get(category).push(row);
    });
    if(idioms.length){if(!groups.has('习语'))groups.set('习语',[]);idioms.forEach(node=>{node.hidden=false;groups.get('习语').push(node);});}
    const fragment=document.createDocumentFragment();
    groups.forEach((entries,category)=>{
      const caption=categoryLabel(category,entries);
      const section=document.createElement('section');section.className='v1226-block-group v1235-block-category-group';
      section.dataset.blockGroup='';section.dataset.v1235BlockCategory=category;
      const id='v1235-block-category-'+(++sequence);
      const heading=document.createElement('header');heading.className='v1226-block-group-heading v1227-group-heading';
      const button=document.createElement('button');button.type='button';button.className='v1227-group-toggle';
      button.dataset.v1227Fold=id;button.setAttribute('aria-controls',id);button.setAttribute('aria-expanded','true');button.setAttribute('aria-label','收起'+caption);
      const label=document.createElement('span');label.className='v1227-fold-label';label.textContent=caption;button.append(label);button.insertAdjacentHTML('beforeend',arrow);heading.append(button);
      const body=document.createElement('div');body.id=id;body.className='v1226-block-units';body.dataset.v1227FoldBody=id;
      entries.forEach(row=>body.append(row));section.append(heading,body);fragment.append(section);
    });
    host.replaceChildren(fragment);host.dataset.v1235CategoryGrouped='true';
    return groupNodes(detail);
  }
  function mountNavigation(detail){
    const groups=groupNodes(detail);if(!groups.length||bound.has(detail))return;
    const nav=detail.querySelector('.v1225-word-main-nav,.vwn-main-nav');
    const actions=detail.querySelector('.vwn-secondary-tools');if(!nav||!actions)return;
    const existing=detail.querySelector('[data-v1220-subnav-for="collocations"]');
    const tabs=existing||document.createElement('div');
    if(!existing){tabs.className='v1220-secondary-tabs';tabs.dataset.v1220SubnavFor='collocations';actions.append(tabs);}
    tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','词块分类');
    const categories=groups.map(group=>group.dataset.v1235BlockCategory);
    const buttons=groups.map(group=>[group.dataset.v1235BlockCategory,categoryLabel(group.dataset.v1235BlockCategory,[...group.querySelectorAll('.v1226-block-unit[data-block-key]')])]).map(([value,label],index)=>{
      const button=document.createElement('button');button.type='button';button.setAttribute('role','tab');button.dataset.latestBlockCategory=value;
      button.textContent=label;button.setAttribute('aria-selected',String(index===0));button.tabIndex=index===0?0:-1;return button;
    });
    tabs.replaceChildren(...buttons);
    let selected=categories[0] || '';
    function apply(category){
      selected=category==='idiom-illustration'?'习语':category;
      groups.forEach(group=>{
        const visible=group.dataset.v1235BlockCategory===selected;
        group.hidden=!visible;
        group.querySelectorAll('.v1226-block-unit').forEach(row=>{row.hidden=!visible;});
        if(visible)api.setFolds(group,true);
      });
      detail.querySelectorAll('[data-word-idiom-example]').forEach(node=>node.hidden=selected!=='习语');
      buttons.forEach(button=>{const active=button.dataset.latestBlockCategory===selected;button.setAttribute('aria-selected',String(active));button.classList.toggle('active',active);button.tabIndex=active?0:-1;});
      window.V1222SenseExamples?.layoutCitations?.(detail);window.WordDetailNavigation?.fit?.();window.V1223WordDock?.refresh?.(detail);
    }
    // A reused tablist retains the original filter listener. This listener runs
    // after it, selecting the concrete category in the regrouped source content.
    tabs.addEventListener('click',event=>{const button=event.target.closest('button[data-latest-block-category]');if(button&&tabs.contains(button))apply(button.dataset.latestBlockCategory);});
    if(!existing)tabs.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      const index=buttons.indexOf(event.target);if(index<0)return;
      event.preventDefault();event.stopPropagation();
      const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
      buttons[next].click();buttons[next].focus({preventScroll:true});
    });
    function syncVisibility(){
      tabs.hidden=nav.querySelector('[data-word-module][aria-selected="true"]')?.dataset.wordModule!=='collocations';
      window.V1223WordDock?.refresh?.(detail);
    }
    nav.addEventListener('click',()=>queueMicrotask(syncVisibility));
    new MutationObserver(syncVisibility).observe(nav,{subtree:true,attributes:true,attributeFilter:['aria-selected']});
    bound.add(detail);apply(selected);syncVisibility();
  }
  const originalFinish=api.finish;
  api.finish=function(detail,result){
    if(result?.word)regroup(detail);
    const value=originalFinish.apply(this,arguments);
    if(result?.word)mountNavigation(detail);
    return value;
  };
  window.V1235BlockGroups={inspect(detail=document.getElementById('wordDetailDialog')){
    if(!detail)return null;
    return {groups:groupNodes(detail).map(group=>({category:group.dataset.v1235BlockCategory,hidden:group.hidden,expanded:group.querySelector('[data-v1227-fold]')?.getAttribute('aria-expanded')==='true',keys:[...group.querySelectorAll('[data-block-key]')].map(row=>row.dataset.blockKey)})),selected:detail.querySelector('[data-latest-block-category][aria-selected="true"]')?.dataset.latestBlockCategory||null};
  }};
})();
