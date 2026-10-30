/* V1.2.75 presentation adapter for the approved 07 style, preserving the V74 source model.
 * Reads existing states, decorates existing controls, derives display counts and measures sticky offsets.
 * No original data, handlers, feature state, source records or navigation order are replaced. */
(() => {
 'use strict';
 let frame=0, live=null, scrollHost=null, senseSequence=0;
 const wired=new WeakSet();
 const headerFields=".resource-sense-meta,.resource-sense-meaning,.v1227-word-tag,.v1228-sense-tag,.v1220-english-definition,[data-v1278-guidance]";
 const watched=new WeakSet();
 const put=(node,key,value)=>{if(node.style.getPropertyValue(key)!==value)node.style.setProperty(key,value);};
 const data=(node,key,value)=>{if(node.dataset[key]!==value)node.dataset[key]=value;};
 const visible=n=>n&&!n.hidden&&!n.closest('[hidden]')&&n.getClientRects().length;
 const resize=new ResizeObserver(()=>schedule());
 function position(d){
  const body=d.querySelector(':scope>.resource-popover-body'), nav=d.querySelector('.vwn-main-nav'), sub=d.querySelector('.v1223-word-subnav'),content=d.querySelector('.vwn-content');
  if(!body||!nav||!content)return;
  for(const button of nav.querySelectorAll('button')){const label=button.querySelector('.v1223-word-label');if(!label||!visible(button))continue;const a=button.getBoundingClientRect(),b=label.getBoundingClientRect();put(button,'--v12104-label-center',(b.left+b.width/2-a.left).toFixed(3)+'px');}
  const navHeight=nav.getBoundingClientRect().height,subHeight=visible(sub)?sub.getBoundingClientRect().height:0;
  put(d,'--v1275-nav-height',Math.round(navHeight)+'px');put(d,'--v1275-subnav-height',Math.round(subHeight)+'px');
  if(d.dataset.v1275Controls!=='true')return;
  put(d,'--v1275-panel-limit',Math.max(140,body.clientHeight-navHeight-subHeight-32)+'px');
 }
 function restoreLayout(d){
  const layout=d.querySelector('.v1275-reading-layout');if(!layout)return;
  const content=layout.querySelector(':scope>.vwn-content'),dock=layout.querySelector('#classroomDock');
  if(content)layout.before(content);if(dock)d.append(dock);layout.remove();window.V1223WordDock?.refresh(d);
 }
 function setSenseOpen(card,open){
  const body=card.querySelector(':scope>.resource-sense-copy>.v1275-sense-body'),button=card.querySelector(':scope>.v1275-sense-toggle');if(!body||!button)return;
  body.hidden=!open;data(card,'v1275SenseOpen',String(open));button.setAttribute('aria-expanded',String(open));
  const label=card.querySelector('.resource-sense-meaning')?.textContent.trim()||'';
  button.setAttribute('aria-label',(open?'收起释义：':'展开释义：')+label);
 }
 function decorateSense(card){
  const copy=card.querySelector(':scope>.resource-sense-copy');if(!copy)return;
  let body=copy.querySelector(':scope>.v1275-sense-body');
  if(!body){
   body=document.createElement('div');body.className='v1275-sense-body';body.id='v1275-sense-body-'+(++senseSequence);
   for(const node of [...copy.childNodes])if(node.nodeType!==1||!node.matches(headerFields))body.append(node);
   copy.append(body);
   const button=document.createElement('button');button.type='button';button.className='v1275-sense-toggle';button.setAttribute('aria-controls',body.id);card.append(button);
   button.addEventListener('click',()=>{setSenseOpen(card,button.getAttribute('aria-expanded')!=='true');schedule();});
   setSenseOpen(card,true);
  }
  // Late native source nodes retain their original order inside the same body.
  for(const node of [...copy.children])if(node!==body&&!node.matches(headerFields))body.append(node);
  const hasDetails=[...body.children].some(n=>!n.hidden&&!n.classList.contains('hidden')&&getComputedStyle(n).display!=='none');
  data(card,'v1275SenseDetails',String(hasDetails));
  const toggle=card.querySelector(':scope>.v1275-sense-toggle');if(toggle){if(toggle.hidden===hasDetails)toggle.hidden=!hasDetails;if(toggle.disabled===hasDetails)toggle.disabled=!hasDetails;}
  body.classList.toggle('v12103-empty-sense',!hasDetails);
 }
 function decorate(d){
  const nav=d.querySelector('.vwn-main-nav'),content=d.querySelector('.vwn-content'),dock=d.querySelector('#classroomDock'),tree=dock?.querySelector('.v1225-word-tree'),body=d.querySelector(':scope>.resource-popover-body');
  if(!nav||!body||!content)return;
  const module=nav.querySelector('[aria-selected="true"]')?.dataset.wordModule||'';data(d,'v1275Module',module);
  const controls=module==='meanings'&&!!tree&&!dock.classList.contains('collapsed');data(d,'v1275Controls',String(controls));
  data(d,'v1275Categories',String(Boolean(visible(d.querySelector('.v1223-word-subnav')))));
  if(!controls)restoreLayout(d);
  if(!wired.has(d)){wired.add(d);d.addEventListener('click',event=>{
   const all=event.target.closest?.('[data-word-feature="all"]');
   if(all&&all.getAttribute('aria-pressed')==='true')d.querySelectorAll('[data-latest-sense]').forEach(card=>setSenseOpen(card,true));
  });}
  if(controls&&!content.parentElement.classList.contains('v1275-reading-layout')){
   const layout=document.createElement('div');layout.className='v1275-reading-layout';content.before(layout);layout.append(content);
  }
  const dockHost=controls?content.closest('.v1275-reading-layout'):d;
  if(dock&&dockHost&&dock.parentElement!==dockHost){dockHost.append(dock);window.V1223WordDock?.refresh(d);}
  if(tree&&!tree.querySelector('.v1275-display-heading')){const h=document.createElement('h2');h.className='v1275-display-heading';h.textContent='内容展示';tree.prepend(h);}
  if(scrollHost!==body){scrollHost?.removeEventListener('scroll',onScroll);scrollHost=body;body.addEventListener('scroll',onScroll,{passive:true});}
  for(const node of [body,nav,d.querySelector('.v1223-word-subnav'),content,dock].filter(Boolean))if(!watched.has(node)){watched.add(node);resize.observe(node);}
  d.querySelectorAll('.v1227-meaning-group').forEach(group=>{
   const heading=group.querySelector(':scope>.v1227-group-heading');if(!heading)return;
   const total=group.querySelectorAll(':scope>.resource-sense-list>[data-latest-sense]').length;
   let caption=heading.querySelector('.v1275-sense-total');if(!caption){caption=document.createElement('span');caption.className='v1275-sense-total';heading.append(caption);}
   const value='共 '+total+' 个义项';if(caption.textContent!==value)caption.textContent=value;
   group.querySelectorAll('[data-latest-sense]').forEach(card=>{
    decorateSense(card);if(!visible(card))return;const copy=card.querySelector(':scope>.resource-sense-copy');if(!copy)return;
    const fields=[...copy.children].filter(n=>n.matches(headerFields)&&visible(n));
    const base=card.getBoundingClientRect();const bottom=Math.max(...fields.map(n=>n.getBoundingClientRect().bottom),base.top+48);
    put(card,'--v1275-sense-head',Math.round(bottom-base.top+16)+'px');
   });
  });
  d.querySelectorAll('.v1270-example-controls').forEach(box=>{if(!box.querySelector('.v1275-filter-heading')){const h=document.createElement('h2');h.className='v1275-filter-heading';h.textContent=box.getAttribute('aria-label')||'';box.prepend(h);}});
  d.querySelectorAll('.v1270-example-browser').forEach(output=>{
   const summary=output.querySelector(':scope>.v1270-result-summary'),actions=output.querySelector(':scope>.v1270-example-actions');
   if(summary&&actions){const frame=document.createElement('div');frame.className='v1275-result-frame';summary.before(frame);frame.append(summary,...actions.querySelectorAll('.v1270-export'));}
  });
  position(d);
 }
 function onScroll(){if(live?.isConnected)position(live);}
 function sync(){frame=0;const d=document.getElementById('wordDetailDialog');live=d;
  if(!d)return;if(d.classList.contains('v1263-interactive-fullscreen')){data(d,'v1275Controls','false');restoreLayout(d);return;}decorate(d);
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(sync);}
 new MutationObserver(records=>{if(records.some(r=>r.type==='childList'||['aria-selected','aria-pressed','hidden','class'].includes(r.attributeName)))schedule();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-selected','aria-pressed','hidden','class']});
 window.addEventListener('resize',schedule);document.fonts?.ready.then(schedule);schedule();
})();
