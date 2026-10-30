/* Presentational cleanup only: source examples, bindings and toggles stay intact. */
(function(){
 'use strict';
 const LABEL='词块例句';
 let frame=0;
 function decorate(){
  frame=0;
  const detail=document.getElementById('wordDetailDialog');
  if(!detail)return;
  detail.querySelectorAll('.v1223-example-kind').forEach(label=>{
   if(label.textContent.replace(/\s+/g,'').trim()!==LABEL)return;
   const line=label.closest('.v1223-sense-example-line');
   if(line)line.classList.add('v1282-unlabelled-block-example');
   label.remove();
  });
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(decorate);}
 const observer=new MutationObserver(schedule);
 function start(){observer.observe(document.body,{childList:true,subtree:true});decorate();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.V1282BlockLabels={refresh:decorate,inspect(){const detail=document.getElementById('wordDetailDialog');return {removedLines:detail?.querySelectorAll('.v1282-unlabelled-block-example').length||0,remainingLabels:[...(detail?.querySelectorAll('.v1223-example-kind')||[])].filter(x=>x.textContent.replace(/\s+/g,'').trim()===LABEL).length};}};
})();
