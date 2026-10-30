/* Preserve the native scrollbar and balance its occupied inline space. Notes body only. */
(()=>{
 const popup=document.getElementById('popover'),full=document.getElementById('fullscreenPage'),scope='body:has(#fullscreenPage:not(.hidden)) #popover.v148-vocabulary[data-knowledge-type="词汇"]:not(.ke-expanded):not(.v1263-interactive-fullscreen):not(.hidden):not([hidden])',tracked=new Map();let frame=0;
 function clear(p){p.style.removeProperty('--v152-scrollbar-inline');if(!p.getAttribute('style')?.trim())p.removeAttribute('style');}
 function mount(){
  if(!popup.matches(scope)){for(const[p,o]of tracked){clear(p);o.disconnect();}tracked.clear();return;}
  const panels=[...popup.querySelectorAll('[data-v105-vocabulary]>.v105-notes>.v105-note-panels:not([data-v148-measure])')];
  for(const[p,o]of tracked)if(!panels.includes(p)){clear(p);o.disconnect();tracked.delete(p);}
  for(const p of panels){if(!tracked.has(p)){const o=new ResizeObserver(schedule);o.observe(p);tracked.set(p,o);}const c=getComputedStyle(p),gutter=Math.max(0,p.offsetWidth-p.clientWidth-(parseFloat(c.borderLeftWidth)||0)-(parseFloat(c.borderRightWidth)||0));
   if(gutter>0){const value=gutter+'px';if(p.style.getPropertyValue('--v152-scrollbar-inline')!==value)p.style.setProperty('--v152-scrollbar-inline',value);}else clear(p);
  }
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;mount();});}
 new MutationObserver(records=>{if(records.some(r=>!r.target.closest?.('[data-v148-measure]')&&!(r.type==='childList'&&[...r.addedNodes,...r.removedNodes].length&&[...r.addedNodes,...r.removedNodes].every(n=>n.nodeType===1&&n.matches('[data-v148-measure]')))))schedule();}).observe(popup,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-selected']});
 new MutationObserver(schedule).observe(full,{attributes:true,attributeFilter:['class']});new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['style']});new ResizeObserver(schedule).observe(popup);addEventListener('resize',schedule,{passive:true});document.fonts?.ready.then(schedule);document.fonts?.addEventListener('loadingdone',schedule);
 window.V152NotesBody=Object.freeze({refresh:schedule});mount();
})();
