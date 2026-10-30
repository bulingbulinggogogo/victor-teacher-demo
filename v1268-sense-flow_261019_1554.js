/* V68: exact sense ownership, one ordered content flow, and shared text-aligned disclosures. */
(() => {
 'use strict';
 const api=window.V1220WordDetail;if(!api?.finish)return;
 const text=v=>String(v??'').trim(),meaning=v=>text(v).replace(/[；;]/g,';').replace(/\s+/g,''),pos=v=>text(v).replace(/\..*$/,'').replace(/^(vt|vi)$/,'v');
 const cards=['语义点拨','一词一义','语义推导','词族树','构词法','名词动化'];let sequence=0;
 function senseFor(row,word){
   const allowed=new Set(word.v1225MergedHeads||[word.head||word.word]);
   if(!allowed.has(row.parentHead||row.parentWord)||row.unboundToSense)return null;
   const senses=(word.parts||[]).flatMap(part=>(part.senses||[]).map(sense=>({part,sense})));
   if(row.parentSenseKey)return senses.find(({sense})=>text(sense.senseKey||sense.id)===text(row.parentSenseKey))||null;
   const matches=senses.filter(({part,sense})=>meaning(sense.chinese)===meaning(row.parentMeaning)&&pos(part.partOfSpeech)===pos(row.parentPartOfSpeech));
   return matches.length===1?matches[0]:null;
 }
 function idioms(detail,word){
   const rows=api.displayBlocks(word).filter(r=>window.V1267BlockCategories.categoryFor(r)==='习语');
   const original=[...detail.querySelectorAll('[data-v1264-sense-card="idioms"]')],bySense=new Map();
   const allowed=new Set(word.v1225MergedHeads||[word.head||word.word]);
   // A labelled illustration from light is not present's sense data. Its source asset remains unchanged.
   original.forEach(card=>card.querySelectorAll('[data-v1246-foreign-word]').forEach(node=>{if(!allowed.has(node.dataset.v1246SourceHead))node.remove();}));
   rows.forEach(row=>{
     const target=senseFor(row,word);
     if(!target){
       // An explicitly unbound source row cannot acquire the first sense merely
       // because a legacy peer card was placed there. Keep one word-level copy.
       const copies=[...detail.querySelectorAll('[data-block-key],[data-sense-block],[data-v1267-word-block]')].filter(n=>(n.dataset.blockKey||n.dataset.senseBlock||n.dataset.v1267WordBlock)===row.blockKey);
       const keep=copies.find(n=>n.hasAttribute('data-v1267-word-block'));
       if(keep)copies.filter(n=>n!==keep).forEach(n=>n.remove());
       return;
     }
     const key=text(target.sense.senseKey||target.sense.id),line=[...detail.querySelectorAll('[data-latest-sense]')].find(n=>n.dataset.latestSense===key),copy=line?.querySelector('.resource-sense-copy');if(!copy)return;
     const duplicates=[...detail.querySelectorAll('[data-block-key],[data-sense-block],[data-v1267-word-block]')].filter(n=>(n.dataset.blockKey||n.dataset.senseBlock||n.dataset.v1267WordBlock)===row.blockKey);
     const node=duplicates.find(n=>n.matches('.v1226-block-unit'))||duplicates[0];if(!node)return;
     let card=bySense.get(key);
     if(!card){card=document.createElement('article');card.className='resource-word-note v1264-sense-card v1268-idiom-card';card.dataset.v1264SenseCard='idioms';card.dataset.v1264SenseKey=key;card.dataset.v1264AnchorFinalized='true';card.dataset.v1268IdiomSense=key;card.innerHTML='<h4>习语</h4><div class="v1264-sense-card-body"><div class="v1226-block-units"></div></div>';copy.append(card);bySense.set(key,card);}
     duplicates.filter(n=>n!==node).forEach(n=>n.remove());
     node.classList.add('v1223-sense-block');node.dataset.senseBlock=row.blockKey;node.removeAttribute('data-v1267-word-block');node.dataset.blockCategory='习语';node.dataset.v1246ParentSenseKey=key;node.dataset.v1246BindingScope='sense';node.dataset.v1268ResolvedSense=key;
     // POS and meaning are already printed by this exact parent sense.
     node.querySelector(':scope > .v1235-block-source-context')?.remove();card.querySelector('.v1226-block-units').append(node);
   });
   original.forEach(card=>{
     // Keep any native illustration whose own head matches this word, inside its exact idiom card.
     const native=[...card.querySelectorAll('[data-graph-key]')].filter(n=>allowed.has(n.dataset.graphKey));
     if(native.length&&bySense.size===1){const target=[...bySense.values()][0];native.forEach(n=>target.querySelector('.v1264-sense-card-body').append(n));}
     if(!card.querySelector('[data-block-key],[data-sense-block]'))card.remove();
   });
   detail.querySelectorAll('[data-v1267-word-block-group]').forEach(n=>{if(!n.querySelector('[data-v1267-word-block]'))n.remove();});
   detail.querySelectorAll('[data-v1267-word-blocks]').forEach(n=>{
     if(!n.children.length){n.remove();return;}
     const overview=detail.querySelector('.vwn-panel[aria-labelledby$="-tab-meanings"] .resource-sense-overview');if(overview)overview.after(n);
   });
 }
 function arrange(detail){
   detail.querySelectorAll('[data-latest-sense]').forEach(sense=>{
     const copy=sense.querySelector('.resource-sense-copy');if(!copy)return;
     const relations=[...copy.querySelectorAll(':scope > [data-sense-feature="synonyms"],:scope > [data-sense-feature="antonyms"]')];
     const examples=[...copy.querySelectorAll('[data-sense-example-kind]')].filter(n=>!n.closest('[data-sense-block],[data-v1267-word-block],.resource-word-note'));
     const blocks=[...copy.querySelectorAll('[data-sense-block]')].filter(n=>!n.closest('.v1268-idiom-card'));
     const idiomCards=[...copy.querySelectorAll(':scope > .v1268-idiom-card')];
     // Reuse source nodes and their listeners, not re-rendered copies.
     const old=[...copy.querySelectorAll(':scope > [data-sense-examples]')];
     const exampleHost=document.createElement('div');exampleHost.className='v1222-sense-examples v1268-word-examples';exampleHost.dataset.senseExamples=sense.dataset.latestSense;
     examples.sort((a,b)=>['ordinary','textbook','listening'].indexOf(a.dataset.senseExampleKind)-['ordinary','textbook','listening'].indexOf(b.dataset.senseExampleKind)).forEach(n=>exampleHost.append(n));
     const blockHost=document.createElement('div');blockHost.className='v1222-sense-examples v1268-sense-blocks';blockHost.dataset.senseExamples=sense.dataset.latestSense;
     blocks.sort((a,b)=>window.V1267BlockCategories.categoryOrder.indexOf(a.dataset.blockCategory)-window.V1267BlockCategories.categoryOrder.indexOf(b.dataset.blockCategory)).forEach(n=>blockHost.append(n));idiomCards.forEach(n=>blockHost.append(n));
     old.forEach(n=>n.remove());
     const notes=[...copy.children].filter(n=>n.matches('.resource-word-note,.knowledge-explanation,.v1220-note')&&!n.hasAttribute('data-sense-feature'));
     const rank=n=>{const label=text(n.querySelector(':scope > h4,:scope > .resource-word-note-copy > h4')?.textContent);return cards.includes(label)?cards.indexOf(label):cards.length;};notes.sort((a,b)=>rank(a)-rank(b));
     relations.forEach(n=>copy.append(n));if(exampleHost.children.length)copy.append(exampleHost);if(blockHost.children.length)copy.append(blockHost);notes.forEach(n=>copy.append(n));
   });
 }
 function disclose(heading,body,label){
   if(!heading||!body||!body.childNodes.length||heading.querySelector(':scope > [data-v1227-fold]'))return;
   const id=body.id||'v1268-branch-'+(++sequence);body.id=id;body.dataset.v1227FoldBody=id;
   const button=document.createElement('button');button.type='button';button.className='v1266-branch-toggle v1268-branch-toggle';button.dataset.v1227Fold=id;button.setAttribute('aria-controls',id);button.setAttribute('aria-expanded',String(!body.hidden));button.setAttribute('aria-label',(body.hidden?'展开':'收起')+label);
   const caption=document.createElement('span');caption.className='v1227-fold-label v1266-visually-hidden';caption.textContent=label;button.append(caption);heading.classList.add('v1266-branch-heading');heading.prepend(button);
 }
 function mountBranches(detail){
   detail.querySelectorAll('[data-v1228-example-group]').forEach(group=>{
     const h=group.querySelector(':scope > .v1228-example-group-heading'),body=group.querySelector(':scope > .v1228-example-group-body');if(h)disclose(h,body,text(h.textContent)+'例句');
   });
   detail.querySelectorAll('[data-sense-block],[data-v1267-word-block]').forEach(block=>{
     const heading=block.querySelector(':scope > .v1223-sense-block-heading,:scope > .v1226-block-unit-head');if(!heading||heading.querySelector(':scope > [data-v1227-fold]'))return;
     const body=document.createElement('div');body.className='v1266-block-children';[...block.children].filter(n=>n!==heading).forEach(n=>body.append(n));if(!body.children.length)return;block.append(body);disclose(heading,body,text(heading.querySelector('strong')?.textContent)||'词块内容');
   });
   detail.querySelectorAll('.v1222-sense-example').forEach(example=>{
     const line=example.querySelector(':scope > .v1223-sense-example-line');if(!line||line.querySelector(':scope > [data-v1227-fold]'))return;
     const body=document.createElement('div');body.className='v1266-example-children';[...line.children].filter(n=>n.matches('.v1222-sense-example-translation,.v1225-example-topic-line')).forEach(n=>body.append(n));if(!body.children.length)return;line.append(body);disclose(line,body,(text(line.querySelector('.v1223-example-kind')?.textContent)||'例句')+'译文与来源');
   });
   detail.querySelectorAll('.v1226-block-associated > .v1226-block-field').forEach(field=>{
     const body=field.querySelector(':scope > span:last-child');if(body)disclose(field,body,text(field.querySelector('.v1226-block-field-label')?.textContent)||'词块说明');
   });
   // A terminal family word still has meaning/affix children, so it gets a small disclosure too.
   detail.querySelectorAll('.vft-node').forEach(node=>{
     const content=node.querySelector(':scope > .vft-node-content'),heading=content?.querySelector(':scope > .vft-word');if(!heading)return;
     const native=heading.querySelector('[data-vft-toggle]');if(native){const label=native.querySelector('.vft-toggle-label');native.replaceWith(...label.childNodes);}
     const body=document.createElement('div');body.className='v1268-family-body';[...content.children].filter(n=>n!==heading).forEach(n=>body.append(n));const children=node.querySelector(':scope > .vft-children');if(children)body.append(children);if(!body.children.length)return;node.append(body);disclose(heading,body,node.dataset.vftNode+'词族内容');
   });
 }
 function watchGuides(detail){
   const entries=[];let frame=0;
   const add=(node,heading,anchor)=>{if(!heading)return;entries.push({node,heading,anchor:anchor||heading});heading.classList.add('v1268-guide-heading');};
   detail.querySelectorAll('.v1223-sense-block,.v1226-block-unit').forEach(n=>{const h=n.querySelector(':scope > .v1223-sense-block-heading,:scope > .v1226-block-unit-head');add(n,h,h?.querySelector('strong'));});
   detail.querySelectorAll('.v1222-sense-example').forEach(n=>{const h=n.querySelector(':scope > .v1223-sense-example-line');add(n,h,h?.querySelector('.v1223-example-copy'));});
   detail.querySelectorAll('[data-v1228-example-group]').forEach(n=>{const h=n.querySelector(':scope > .v1228-example-group-heading');add(n,h);});
   detail.querySelectorAll('.v1226-block-associated > .v1226-block-field').forEach(n=>add(n,n,n.querySelector(':scope > span:last-child')));
   detail.querySelectorAll('.vft-node').forEach(n=>{const h=n.querySelector(':scope > .vft-node-content > .vft-word');add(n,h,h?.querySelector('strong'));});
   function update(){frame=0;if(!detail.isConnected){observer.disconnect();window.removeEventListener('resize',schedule);return;}
     entries.forEach(({node,heading,anchor})=>{
       if(heading.closest('[hidden],.hidden')||!heading.getClientRects().length)return;
       // The first visible text run stays correct when a heading wraps at a larger font.
       const walk=document.createTreeWalker(anchor,NodeFilter.SHOW_TEXT),range=document.createRange();let leaf,printed;
       while(leaf=walk.nextNode()){if(!text(leaf.textContent)||leaf.parentElement.closest('button[data-v1227-fold],[hidden],.v1266-visually-hidden'))continue;range.selectNodeContents(leaf);printed=[...range.getClientRects()].find(r=>r.width>0&&r.height>0);if(printed)break;}
       if(!printed)return;const center=printed.top+printed.height/2;
       for(const target of new Set([node,heading])){const value=(Math.round((center-target.getBoundingClientRect().top)*2)/2)+'px';if(target.style.getPropertyValue('--v1268-guide-y')!==value)target.style.setProperty('--v1268-guide-y',value);}
     });
   }
   function schedule(){if(!frame)frame=requestAnimationFrame(update);}
   const observer=new ResizeObserver(schedule);entries.forEach(({heading})=>observer.observe(heading));
   detail.addEventListener('click',schedule);detail.addEventListener('word-pos-change',schedule);window.addEventListener('resize',schedule);document.fonts?.ready.then(schedule);schedule();
   detail.v1268Guides=entries;
 }
 const finish=api.finish;
 api.finish=function(detail,result){
   const value=finish.apply(this,arguments);if(detail?.id!=='wordDetailDialog'||!result?.word||detail.dataset.v1268SenseFlow)return value;
   detail.dataset.v1268SenseFlow='true';idioms(detail,result.word);arrange(detail);mountBranches(detail);api.refreshFeatures(detail);watchGuides(detail);window.V1223WordDock?.refresh?.(detail);window.WordDetailNavigation?.fit?.();return value;
 };
 window.V1268SenseFlow={senseFor,cards};
})();
