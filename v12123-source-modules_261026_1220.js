/* Six source-defined illustration kinds use peer navigation modules.
 * Source words and sense/block records retain their original identities. */
(() => {
  'use strict';
  const api=window.V1220WordDetail;
  if (!api?.render || !api?.finish || window.V1246PeerModules) return;
  const text=value=>String(value??'').trim();
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const source=Object.freeze({
    presentation:'词库配图样例 v5.pptx',slide:21,example:'蛇',head:'snake',
    noun:'n. 蛇',verb:'v. 蛇行；蜿蜒前进',derivation:'像“蛇”一样运动',
    assets:[
      {role:'noun',url:'./assets/lexical-ppt/v1246-slide21-snake-noun_261017_1021.png',entry:'ppt/media/image75.png',sha256:'8f91abc0eedcd1e9d2aac4c74f907f8b48704819f1da2d81c010960cf44146b1'},
      {role:'verb',url:'./assets/lexical-ppt/v1246-slide21-snake-verb_261017_1021.gif',entry:'ppt/media/image74.GIF',sha256:'9c965c905665e63d822f99b88c1b1c06342bc5e51756522df459bebd2252b339'}
    ]
  });
  const mounted=new WeakSet();
  const present=word=>false;
  function nominalizationHTML() {
    const masked=(key,copy)=>`<div class="pgi-copy pgi-copy-mask is-hidden${key==='derivation'?' pgi-derivation':''}" data-v1246-conversion-copy="${key}" role="button" tabindex="0" aria-pressed="false"><span>${escape(copy)}</span></div>`;
    return `<section class="v1220-module" data-case-module="nominalization" data-case-title="名词动化" data-v1246-peer-source="ppt-slide-21"><p class="v1246-source-example">示例：蛇</p><section class="pgi-module vpi-module v1246-nominalization" data-graph-key="snake" data-graph-kind="nominalization" data-source-slide="21" data-v1246-source-presentation="${escape(source.presentation)}"><div class="pgi-scene"><div class="v1246-conversion-grid"><article class="pgi-card"><p class="pgi-copy pgi-static-copy"><span>${escape(source.noun)}</span></p><img src="${source.assets[0].url}" alt="蛇的名词静态图" decoding="async"></article><span class="pgi-formation-operator" aria-hidden="true">→</span><article class="pgi-card">${masked('verb',source.verb)}<img src="${source.assets[1].url}" alt="原稿中表示蛇行、蜿蜒前进的动图" decoding="async"></article></div>${masked('derivation',source.derivation)}</div></section></section>`;
  }
  function idiomRows(word) {
    const ownership=window.V1246BlockOwnership;
    const rows=ownership?.rows?.(word) || api.displayBlocks?.(word) || [];
    return rows.filter(row=>ownership?.isIdiom ? ownership.isIdiom(row) : text(row.category)==='习语');
  }
  function buildPeers(result) {
    if (!result?.word || !result.html) return result;
    const word=result.word,root=document.createElement('div');root.innerHTML=result.html;
    const byKey=new Map(idiomRows(word).map(row=>[String(row.blockKey),row]));
    const hasSourceExample=present(word) && window.V1213_PPT_SOURCE?.entries?.['come to light']?.single;
    let idioms=root.querySelector('[data-case-module="idioms"]');
    if (byKey.size || hasSourceExample) {
      if (!idioms) {idioms=document.createElement('section');idioms.className='v1220-module';idioms.dataset.caseModule='idioms';idioms.dataset.caseTitle='习语';root.append(idioms);}
      let blocks=idioms.querySelector('.v1246-idiom-blocks');
      if (!blocks) {blocks=document.createElement('div');blocks.className='v1226-block-groups v1246-idiom-blocks';const list=document.createElement('div');list.className='v1226-block-units';blocks.append(list);idioms.append(blocks);}
      const list=blocks.querySelector('.v1226-block-units');
      root.querySelectorAll('[data-case-module="collocations"] .v1226-block-unit[data-block-key]').forEach(node=>{
        const row=byKey.get(node.dataset.blockKey);if(!row)return;
        const heading=node.closest('[data-block-group]')?.querySelector(':scope > .v1226-block-group-heading');
        const context=[...(heading?.querySelectorAll('.v1226-block-pos,.v1226-block-parent-meaning') || [])];
        if(context.length && !node.querySelector(':scope > .v1235-block-source-context')) {const copy=document.createElement('p');copy.className='v1235-block-source-context';context.forEach(item=>copy.append(item.cloneNode(true)));node.prepend(copy);}
        node.dataset.v1246PeerModule='idioms';node.dataset.v1246BlockOwner=row.parentHead || row.parentWord || '';
        node.hidden=false;list.append(node);
      });
      root.querySelectorAll('[data-case-module="collocations"] [data-block-group]').forEach(group=>{if(!group.querySelector('.v1226-block-unit'))group.remove();});
      root.querySelectorAll('[data-case-module="collocations"] .v1226-block-groups').forEach(host=>{if(!host.querySelector('.v1226-block-unit'))host.remove();});
    }
    if (present(word) && !root.querySelector('[data-case-module="nominalization"]')) root.insertAdjacentHTML('beforeend',nominalizationHTML());
    return {...result,html:root.innerHTML};
  }
  function moveSourceIdiom(detail,result) {
    if (!present(result?.word)) return;
    const target=detail.querySelector('[data-case-module="idioms"]');if(!target)return;
    detail.querySelectorAll('[data-word-idiom-example]').forEach(node=>{
      if(node.closest('[data-case-module="idioms"]'))return;
      node.dataset.v1246SourceHead='light';node.dataset.v1246ForeignWord='true';node.dataset.v1246PeerModule='idioms';
      // The old attribute makes native collocation filters control this node
      // globally. The peer keeps its own identity and original content instead.
      node.dataset.v1246IdiomExample='come to light';node.removeAttribute('data-word-idiom-example');
      if(!node.querySelector(':scope > [data-v1246-source-example]')) {const label=document.createElement('p');label.className='v1246-source-example';label.dataset.v1246SourceExample='come to light';label.textContent='示例：come to light';node.prepend(label);}
      node.hidden=false;target.append(node);
    });
  }
  function labelModule(detail,id,label) {
    const button=detail.querySelector(`[data-word-module="${id}"]`);if(!button)return;
    const caption=button.querySelector(':scope > .v1223-word-label');if(caption)caption.textContent=label;else button.textContent=label;
    const panel=detail.querySelector(`[id="${button.getAttribute('aria-controls')}"]`);
    panel?.querySelectorAll(':scope > .vwn-panel-title,[data-case-module] > h3').forEach(node=>{node.textContent=label;});
    const content=panel?.querySelector(`[data-case-module="${id}"]`);if(content)content.dataset.caseTitle=label;
  }
  function alignNavigation(detail) {
    const nav=detail.querySelector('.v1225-word-main-nav,.vwn-main-nav');if(!nav)return;
    const original=[...nav.querySelectorAll(':scope > [data-word-module]')];
    const added=['nominalization','idioms'].map(id=>original.find(button=>button.dataset.wordModule===id)).filter(Boolean);
    const ordered=original.filter(button=>!added.includes(button));
    if (added.length) {const anchor=ordered.findIndex(button=>button.dataset.wordModule==='formation');ordered.splice(anchor<0?ordered.length:anchor+1,0,...added);}
    ordered.forEach(button=>{nav.append(button);const panel=detail.querySelector(`[id="${button.getAttribute('aria-controls')}"]`);if(panel)panel.parentElement.append(panel);});
    labelModule(detail,'formation','构词法');labelModule(detail,'nominalization','名词动化');labelModule(detail,'idioms','习语');
  }
  function mountNominalization(detail) {
    const module=detail.querySelector('.v1246-nominalization');
    if (!module || mounted.has(module)) return;
    const actions=detail.querySelector('.vwn-secondary-tools');if(!actions)return;
    const copies=[...module.querySelectorAll('[data-v1246-conversion-copy]')];
    const tools=document.createElement('div');tools.className='vpi-tools';tools.dataset.v1220SubnavFor='nominalization';
    const all=document.createElement('button');all.type='button';all.dataset.pgiAll='toggle';all.textContent='全部展示';all.setAttribute('aria-pressed','false');tools.append(all);actions.append(tools);
    const show=(copy,value)=>{copy.classList.toggle('is-hidden',!value);copy.setAttribute('aria-pressed',String(value));};
    const sync=()=>{const visible=copies.every(copy=>!copy.classList.contains('is-hidden'));all.textContent=visible?'全部隐藏':'全部展示';all.setAttribute('aria-pressed',String(visible));};
    const activate=event=>{const copy=event.target.closest('[data-v1246-conversion-copy]');if(copy&&module.contains(copy)){show(copy,copy.classList.contains('is-hidden'));sync();}};
    module.addEventListener('click',activate);
    module.addEventListener('keydown',event=>{if(!['Enter',' '].includes(event.key)||!event.target.closest('[data-v1246-conversion-copy]'))return;event.preventDefault();event.stopPropagation();activate(event);});
    all.addEventListener('click',()=>{const showAll=copies.some(copy=>copy.classList.contains('is-hidden'));copies.forEach(copy=>show(copy,showAll));sync();});
    const nav=detail.querySelector('.v1225-word-main-nav,.vwn-main-nav');
    const syncVisibility=()=>{tools.hidden=nav?.querySelector('[data-word-module][aria-selected="true"]')?.dataset.wordModule!=='nominalization';window.V1223WordDock?.refresh?.(detail);};
    nav?.addEventListener('click',()=>queueMicrotask(syncVisibility));
    const observer=new MutationObserver(syncVisibility);if(nav)observer.observe(nav,{subtree:true,attributes:true,attributeFilter:['aria-selected']});
    if(document.body){const connection=new MutationObserver(()=>{if(!detail.isConnected){observer.disconnect();connection.disconnect();}});connection.observe(document.body,{childList:true,subtree:true});}
    mounted.add(module);sync();syncVisibility();
  }
  const render=api.render;
  api.render=function(options){return buildPeers(render.apply(this,arguments));};
  const finish=api.finish;
  api.finish=function(detail,result){moveSourceIdiom(detail,result);const value=finish.apply(this,arguments);if(result?.word){alignNavigation(detail);mountNominalization(detail);window.V1223WordDock?.refresh?.(detail);}return value;};
  // Native single-source entries use the same peer IDs outside present too.
  const illustrations=window.V1213Illustrations;
  if(illustrations?.create){const create=illustrations.create;illustrations.create=function(options){return (create.apply(this,arguments)||[]).map(row=>{
    const kind=row.source?.single?.kind;
    if(row.content?.dataset.graphKind==='single' && kind==='idiom')return {...row,id:'idioms',title:'习语'};
    if(row.content?.dataset.graphKind==='single' && kind==='single-meaning')return {...row,id:'singleMeaning',title:'一词一义'};
    return row.id==='formation'?{...row,title:'构词法'}:row;
  });};}
  window.V1246PeerModules={source,buildPeers,inspect(detail=document.getElementById('wordDetailDialog')) {
    if(!detail)return null;
    return {navigation:[...detail.querySelectorAll('[data-word-module]')].map(button=>({id:button.dataset.wordModule,label:button.textContent.trim(),controls:button.getAttribute('aria-controls')})),idiomKeys:[...detail.querySelectorAll('[data-case-module="idioms"] [data-block-key]')].map(node=>node.dataset.blockKey),nestedIdioms:detail.querySelectorAll('[data-case-module="collocations"] [data-word-idiom-example],[data-case-module="collocations"] [data-block-category="习语"]').length,sourceExamples:[...detail.querySelectorAll('.v1246-source-example')].map(node=>node.textContent),nominalization:[...detail.querySelectorAll('.v1246-nominalization')].map(module=>({slide:module.dataset.sourceSlide,head:module.dataset.graphKey,insideSense:!!module.closest('[data-latest-sense]'),images:[...module.querySelectorAll('img')].map(image=>image.getAttribute('src'))}))};
  }};
})();
