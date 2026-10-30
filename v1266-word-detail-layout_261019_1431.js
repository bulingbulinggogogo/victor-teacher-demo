/* V66: peer content stays with one exact sense; original live lesson nodes survive. */
(() => {
 'use strict';
 const api=window.V1220WordDetail;if(!api?.finish)return;
 let sequence=0;
 const order=['meanings','etymology','illustrations','contrast','statistics','cases'];
 function disclosure(heading,body,label){
   if(!heading || !body || !body.childNodes.length)return;
   const id='v1266-branch-'+(++sequence);body.id=id;body.dataset.v1227FoldBody=id;
   const button=document.createElement('button');button.type='button';button.className='v1266-branch-toggle';
   button.dataset.v1227Fold=id;button.setAttribute('aria-controls',id);button.setAttribute('aria-expanded','true');
   button.setAttribute('aria-label','收起'+label);
   const caption=document.createElement('span');caption.className='v1227-fold-label v1266-visually-hidden';caption.textContent=label;button.append(caption);
   heading.classList.add('v1266-branch-heading');heading.prepend(button);
 }
 function mountBranches(detail){
   const meanings=detail.querySelector('.vwn-panel[aria-labelledby$="-tab-meanings"]');if(!meanings)return;
   meanings.querySelectorAll('[data-sense-block],[data-v1267-word-block]').forEach(block=>{
     const heading=block.querySelector(':scope > .v1223-sense-block-heading');if(!heading)return;
     const body=document.createElement('div');body.className='v1266-block-children';
     [...block.children].filter(node=>node!==heading).forEach(node=>body.append(node));
     if(!body.children.length)return;
     block.append(body);disclosure(heading,body,heading.querySelector('strong')?.textContent || '词块内容');
   });
   meanings.querySelectorAll('.v1222-sense-example').forEach(example=>{
     const line=example.querySelector(':scope > .v1223-sense-example-line');if(!line)return;
     const secondary=[...line.children].filter(node=>node.matches('.v1222-sense-example-translation,.v1225-example-topic-line'));
     if(!secondary.length)return;
     const body=document.createElement('div');body.className='v1266-example-children';secondary.forEach(node=>body.append(node));line.append(body);
     disclosure(line,body,(line.querySelector('.v1223-example-kind')?.textContent || '例句')+'译文与来源');
   });
 }
 function watchGuides(detail){
   let frame=0;
   function update(){frame=0;if(!detail.isConnected){observer.disconnect();return;}
     detail.querySelectorAll('.v1223-sense-block,.v1222-sense-example,.vft-node').forEach(node=>{
       const heading=node.matches('.vft-node')?node.querySelector(':scope > .vft-node-content > .vft-word'):node.querySelector(':scope > .v1223-sense-block-heading,:scope > .v1223-sense-example-line');
       if(!heading || heading.closest('[hidden],.hidden'))return;
       const anchor=heading.querySelector('strong,.v1223-example-copy') || heading;
       const range=document.createRange();range.selectNodeContents(anchor);const printed=[...range.getClientRects()].find(rect=>rect.height>0&&rect.width>0);if(!printed)return;
       const center=printed.top+printed.height/2;
       for(const [target,top] of [[node,node.getBoundingClientRect().top],[heading,heading.getBoundingClientRect().top]]){
         const value=(Math.round((center-top)*2)/2)+'px';if(target.style.getPropertyValue('--v1266-guide-y')!==value)target.style.setProperty('--v1266-guide-y',value);
       }
     });
   }
   const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
   const observer=new ResizeObserver(schedule);detail.querySelectorAll('.v1266-branch-heading,.vft-word').forEach(node=>observer.observe(node));
   // Feature/POS changes reveal headings which have not been measurable yet.
   detail.addEventListener('click',schedule);detail.addEventListener('word-pos-change',schedule);document.fonts?.ready.then(schedule);schedule();
 }
 const finish=api.finish;
 api.finish=function(detail,result){
   const value=finish.apply(this,arguments);
   if(detail?.id!=='wordDetailDialog' || !result?.word || detail.dataset.v1266Layout)return value;
   detail.dataset.v1266Layout='true';
   const cards=window.WordDetailNavigation.arrangeSenseModules(detail,{
     cards:[['family','词族树'],['formation','构词法'],['nominalization','名词动化'],['idioms','习语']],remove:['collocations'],order
   });
   Object.values(cards).forEach(card=>{
     card.dataset.v1266InlineTools='';
     card.querySelectorAll('[data-classroom-tool-kind],.classroom-tools-floating').forEach(control=>window.ClassroomTools?.detach?.(detail,control));
   });
   window.V1247Nominalization?.embed?.(detail,cards.nominalization);
   // Retire only controls of the deleted standalone block module.
   detail.querySelectorAll('[data-v1220-subnav-for="collocations"]').forEach(node=>node.remove());
   mountBranches(detail);api.refreshFeatures(detail);watchGuides(detail);
   window.V1223WordDock?.refresh?.(detail);window.ClassroomTools?.refresh?.();
   return value;
 };
 window.V1266WordLayout={order};
})();
