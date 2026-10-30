/* Mother popup presentation only. Existing business nodes and listeners are retained. */
(() => {
 const popup=document.getElementById('popover'),modules=new WeakMap(),mounted=new Set();let frame=0;
 const put=(n,k,v)=>{if(n.style.getPropertyValue(k)!==v)n.style.setProperty(k,v);};
 function cue(m){
  if(!m.notes.isConnected)return;
  const b=m.body,rail=m.rail,over=b.scrollHeight>b.clientHeight+2;
  if(rail.hidden!==!over)rail.hidden=!over;
  if(over){const r=b.getBoundingClientRect(),nr=m.notes.getBoundingClientRect(),s=parseFloat(getComputedStyle(popup).getPropertyValue('--full-dialog-scale'))/1.5||1;
   put(rail,'top',(r.top-nr.top)+'px');put(rail,'height',b.clientHeight+'px');
   const h=Math.min(b.clientHeight,Math.max(20*s,b.clientHeight*b.clientHeight/b.scrollHeight)),y=(b.clientHeight-h)*b.scrollTop/(b.scrollHeight-b.clientHeight);
   put(rail.firstElementChild,'height',h+'px');put(rail.firstElementChild,'transform','translateY('+y+'px)');
  }
 }
 function notesLayout(notes){
  const nav=notes.querySelector('.v105-note-tabs'),body=notes.querySelector('.v105-note-panels');
  if(!nav||!body)return;
  const tabs=[...nav.querySelectorAll(':scope>button')],panels=[...body.children];
  if(!tabs.length||!panels.length){notes.remove();return;}
  const count=tabs.length;if(notes.dataset.v148NoteCount!==String(count))notes.dataset.v148NoteCount=String(count);
  let m=modules.get(notes);
  if(!m){const rail=document.createElement('div');rail.className='v148-scroll-cue';rail.setAttribute('aria-hidden','true');rail.hidden=true;rail.append(document.createElement('i'));notes.append(rail);
   m={notes,body,nav,rail,signature:''};modules.set(notes,m);mounted.add(m);body.addEventListener('scroll',()=>cue(m),{passive:true});m.observer=new ResizeObserver(schedule);m.observer.observe(body);
  }
  if(count>1){
   const style=getComputedStyle(body),scale=(parseFloat(getComputedStyle(popup).getPropertyValue('--full-dialog-scale'))||1.5)*.5045045045;
   const signature=[body.clientWidth,style.fontSize,...panels.map(p=>p.textContent)].join('|');
   if(signature!==m.signature){m.signature=signature;let natural=0;
    panels.forEach(panel=>{const box=document.createElement('div');box.className='v105-note-panels v148-note-measure';box.dataset.v148Measure='true';box.setAttribute('aria-hidden','true');box.inert=true;
     for(const [k,v]of Object.entries({'position':'absolute','left':'-10000px','top':'0','visibility':'hidden','width':body.getBoundingClientRect().width+'px','height':'auto','min-height':'0','max-height':'none','overflow':'hidden'}))box.style.setProperty(k,v,'important');
     const clone=panel.cloneNode(true);clone.hidden=false;clone.removeAttribute('id');clone.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));box.append(clone);notes.append(box);natural=Math.max(natural,box.getBoundingClientRect().height);box.remove();
    });put(notes,'--v148-panel-height',Math.min(215*scale,Math.max(134*scale,natural))+'px');
   }
  }else{notes.style.removeProperty('--v148-panel-height');m.signature='';}
  cue(m);
 }
 function mount(){
  const articles=[...popup.querySelectorAll('[data-v105-vocabulary]')];popup.classList.toggle('v148-vocabulary',articles.length>0);
  articles.forEach(article=>{
   const header=article.querySelector('.v105-word-header'),line=article.querySelector('.v105-sense-heading');if(!header||!line)return;
   const nav=header.querySelector('.v145-word-navigation'),has=!!nav?.querySelector('button');header.classList.toggle('v148-has-resources',has);
   article.classList.toggle('v148-long-word',(header.querySelector('.knowledge-word')?.textContent.trim().length||0)>19);
   const more=line.querySelector('.ke-word-more');let copy=line.querySelector(':scope>.v148-meaning-copy');
   if(!copy){copy=document.createElement('div');copy.className='v148-meaning-copy';line.prepend(copy);}
   [...line.childNodes].forEach(n=>{if(n!==copy&&n!==more)copy.append(n);});
   line.classList.toggle('v148-has-more',!!more);article.querySelectorAll(':scope>.v105-notes').forEach(notesLayout);
  });
  for(const m of mounted)if(!m.notes.isConnected){m.observer.disconnect();mounted.delete(m);}
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;mount();});}
 const bind=bindResourcePopoverInteractions;bindResourcePopoverInteractions=function(){const r=bind.apply(this,arguments);mount();return r;};
 new MutationObserver(records=>{if(records.some(r=>!(r.target instanceof Element&&r.target.closest('[data-v148-measure]'))&&!(r.type==='childList'&&[...r.addedNodes,...r.removedNodes].length&&[...r.addedNodes,...r.removedNodes].every(n=>n.nodeType===1&&n.matches('[data-v148-measure]')))))schedule();}).observe(popup,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-selected']});
 new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['style']});new ResizeObserver(schedule).observe(popup);
 addEventListener('resize',schedule,{passive:true});document.fonts?.ready.then(schedule);document.fonts?.addEventListener('loadingdone',schedule);
 window.V148VocabularyLayout=Object.freeze({refresh:schedule,inspect:()=>[...mounted].filter(m=>m.notes.isConnected).map(m=>({count:Number(m.notes.dataset.v148NoteCount),height:m.body.clientHeight,scrollHeight:m.body.scrollHeight,scrollCue:!m.rail.hidden}))});mount();
})();
