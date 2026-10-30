/* 01 approved tab outline, presentation only. Native buttons, panels and events are retained. */
(()=>{
 const popup=document.getElementById('popover'),SVG='http://www.w3.org/2000/svg';let frame=0;
 const selector='body:has(#fullscreenPage:not(.hidden)) #popover.v148-vocabulary[data-knowledge-type="词汇"]:not(.ke-expanded):not(.v1263-interactive-fullscreen):not(.hidden):not([hidden])';
 const attr=(n,k,v)=>{v=String(v);if(n.getAttribute(k)!==v)n.setAttribute(k,v);};
 function silhouette(x,w,h,first,last){
  const r=h*.27,wing=h*.105,L=first?x:x-wing,R=last?x+w:x+w+wing,s=Math.min(h*.48,w*.26+wing);let p=`M ${L} ${h}`;
  if(first)p+=` V ${r} Q ${L} 0 ${L+r} 0`;
  else p+=` C ${L+s*.13} ${h} ${L+s*.28} ${h*.9675} ${L+s*.40} ${h*.75} C ${L+s*.56} ${h*.46} ${L+s*.53} 0 ${L+s} 0`;
  if(last)p+=` H ${R-r} Q ${R} 0 ${R} ${r} V ${h}`;
  else p+=` H ${R-s} C ${R-s*.53} 0 ${R-s*.56} ${h*.46} ${R-s*.40} ${h*.75} C ${R-s*.28} ${h*.9675} ${R-s*.13} ${h} ${R} ${h}`;
  return {edge:p,fill:p+` L ${L} ${h} Z`,left:L,right:R};
 }
 function svg(notes,kind){let n=notes.querySelector(':scope>.v151-'+kind);if(!n){n=document.createElementNS(SVG,'svg');n.classList.add('v151-'+kind);n.dataset.v151Visual='';n.setAttribute('aria-hidden','true');n.setAttribute('focusable','false');notes.append(n);}return n;}
 function path(parent,index,d,fill,stroke){let n=parent.children[index];if(!n){n=document.createElementNS(SVG,'path');parent.append(n);}attr(n,'d',d);attr(n,'fill',fill);if(stroke){attr(n,'stroke',stroke);attr(n,'stroke-width',1);attr(n,'stroke-linecap','round');attr(n,'stroke-linejoin','round');attr(n,'vector-effect','non-scaling-stroke');}return n;}
 function draw(notes){
  if(!popup.matches(selector))return;
  const bar=notes.querySelector('.v105-note-tabs'),panel=notes.querySelector('.v105-note-panels');if(!bar||!panel)return;const buttons=[...bar.querySelectorAll(':scope>button')];if(!buttons.length)return;
  notes.classList.add('v151-notes');
  buttons.forEach(b=>{if(!b.querySelector(':scope>.v151-tab-label')){let l=document.createElement('span');l.className='v151-tab-label';while(b.firstChild)l.append(b.firstChild);b.append(l);}});
  const bg=svg(notes,'backdrop'),outline=svg(notes,'outline');
  if(!popup.matches(selector)||!bar.clientWidth)return;
  const active=Math.max(0,buttons.findIndex(b=>b.getAttribute('aria-selected')==='true')),button=buttons[active],nr=notes.getBoundingClientRect(),rr=bar.getBoundingClientRect(),br=button.getBoundingClientRect(),pr=panel.getBoundingClientRect(),width=pr.width,top=pr.top-rr.top,height=pr.bottom-rr.top,x=br.left-rr.left,first=active===0,last=buttons.length>1&&active===buttons.length-1;
  const shape=silhouette(x,br.width,top,first,last),rise=top*.15,r=Math.min(10,top*.14),railWidth=Math.min(width,Math.max(0,buttons.at(-1).getBoundingClientRect().right-rr.left));
  attr(bg,'viewBox',`0 0 ${width} ${top}`);attr(outline,'viewBox',`0 0 ${width} ${height}`);
  for(const [n,h]of[[bg,top],[outline,height]]){const style={left:(pr.left-nr.left)+'px',top:(rr.top-nr.top)+'px',width:width+'px',height:h+'px'};for(const[k,v]of Object.entries(style))if(n.style[k]!==v)n.style[k]=v;}
  // Solo has no gray residual, but uses exactly the multi-first right shoulder.
  path(bg,0,`M0 ${top} V ${rise+r} Q0 ${rise} ${r} ${rise} H${Math.max(r,railWidth-r)} Q${railWidth} ${rise} ${railWidth} ${rise+r} V${top}Z`,buttons.length===1?'#fff':'#edf0f3');path(bg,1,shape.fill,'#fff');
  const topRight=Math.min(12,top*.2,Math.max(0,(width-shape.right)/2)),bottomRadius=Math.min(14,(height-top)*.23),topLeft=first?0:Math.min(3,Math.max(0,shape.left/2));
  let d=`M 0 ${height-bottomRadius} V ${first?top:top+topLeft}`;if(!first)d+=` Q 0 ${top} ${topLeft} ${top} H ${shape.left}`;d+=shape.edge.replace(/^M\s+\S+\s+\S+/,'');d+=` H ${width-topRight} Q ${width} ${top} ${width} ${top+topRight} V ${height-bottomRadius} Q ${width} ${height} ${width-bottomRadius} ${height} H ${bottomRadius} Q 0 ${height} 0 ${height-bottomRadius} Z`;
  path(outline,0,d,'none','#d8dce2');const radius=`0 ${topRight}px ${bottomRadius}px ${bottomRadius}px`;if(notes.style.getPropertyValue('--v151-panel-radius')!==radius)notes.style.setProperty('--v151-panel-radius',radius);
  notes.v151Metrics={active,count:buttons.length,width,top,height,x,tabWidth:br.width,first,last,left:shape.left,right:shape.right,topLeft,topRight,bottomRadius,railWidth,path:d,shape:shape.edge};
 }
 function restore(notes){
  notes.querySelectorAll(':scope>[data-v151-visual]').forEach(n=>n.remove());
  notes.querySelectorAll('.v151-tab-label').forEach(n=>n.replaceWith(...n.childNodes));
  notes.classList.remove('v151-notes');notes.style.removeProperty('--v151-panel-radius');if(!notes.getAttribute('style')?.trim())notes.removeAttribute('style');delete notes.v151Metrics;
 }
 function mount(){
  if(!popup.matches(selector)){popup.querySelectorAll('.v151-notes').forEach(restore);return;}
  popup.querySelectorAll('[data-v105-vocabulary]>.v105-notes').forEach(draw);
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;mount();});}
 new MutationObserver(records=>{if(records.some(r=>!r.target.closest?.('[data-v151-visual]')))schedule();}).observe(popup,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-selected']});
 new ResizeObserver(schedule).observe(popup);popup.addEventListener('scroll',schedule,true);new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['style']});addEventListener('resize',schedule,{passive:true});document.fonts?.ready.then(schedule);document.fonts?.addEventListener('loadingdone',schedule);
 new MutationObserver(schedule).observe(document.getElementById('fullscreenPage'),{attributes:true,attributeFilter:['class']});
 window.V151VocabularyTabs=Object.freeze({refresh:schedule,inspect:()=>[...popup.querySelectorAll('.v151-notes')].map(n=>n.v151Metrics||null)});mount();
})();
