/* V1.2.99: ordinary entry, comma line breaks, unchanged source text and controls. */
(() => {
 'use strict';
 // Run in <head>, before any business or former review-link boot code reads the URL.
 const url=new URL(location.href);
 if(url.searchParams.has('reviewWord')){
  url.searchParams.delete('reviewWord');url.hash='';history.replaceState(history.state,'',url.pathname+url.search);
 }
 let frame=0;const wrapped=new WeakSet();
 function wrap(){frame=0;document.querySelectorAll('#wordDetailDialog .v1287-derivation-stage').forEach(stage=>{
  if(wrapped.has(stage))return;wrapped.add(stage);const text=stage.textContent;if(text.length<20||!text.includes('，'))return;
  const walker=document.createTreeWalker(stage,NodeFilter.SHOW_TEXT);for(let node=walker.nextNode();node;node=walker.nextNode()){
   const index=node.textContent.indexOf('，');if(index<0)continue;
   const tail=node.splitText(index+1),br=document.createElement('br');br.className='v1299-comma-break';node.parentNode.insertBefore(br,tail);stage.dataset.v1299CommaWrapped='true';break;
  }
 });document.querySelectorAll('#wordDetailDialog .v1287-derivation-stage').forEach(stage=>{const arrow=stage.previousElementSibling;if(stage.parentElement.matches('.v1299-stage-group')||!arrow?.matches('.v1287-operator')||arrow.textContent!=='→')return;const group=document.createElement('div');group.className='v1299-stage-group';arrow.before(group);group.append(arrow,stage);});}
 function schedule(){if(!frame)frame=requestAnimationFrame(wrap);}
 function start(){new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});schedule();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.V1299DetailRepairs=Object.freeze({refresh:schedule});
})();
