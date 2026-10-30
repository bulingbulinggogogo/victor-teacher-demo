/* Preserve the left-aligned native tree and all rows; reduce its type scale only if a full row needs it. */
(function(){
 'use strict';
 const seen=new WeakSet(),sizes=new WeakMap();
 let frame=0;
 function fit(tree){
  if(!tree.isConnected||!tree.getBoundingClientRect().width)return;
  const stage=tree.querySelector('.vft-stage');if(!stage)return;
  const available=tree.clientWidth;
  tree.style.setProperty('--v1282-family-scale','1');
  const natural=Math.max(stage.scrollWidth,stage.getBoundingClientRect().width);
  let scale=Math.min(1,Math.max(0.2,(available-2)/Math.max(1,natural)));
  if(scale<1){tree.style.setProperty('--v1282-family-scale',String(scale));
   const measured=Math.max(stage.scrollWidth,stage.getBoundingClientRect().width);
   if(measured>available)tree.style.setProperty('--v1282-family-scale',String(scale*Math.max(0.2,(available-2)/measured)));
  }
 }
 function refresh(){
  frame=0;document.querySelectorAll('#wordDetailDialog .v1278-family-content .v1222-family-tree').forEach(tree=>{
   if(!seen.has(tree)){seen.add(tree);
    if(typeof ResizeObserver==='function'){const ro=new ResizeObserver(entries=>{for(const e of entries){const width=e.contentRect.width;if(sizes.get(tree)!==width){sizes.set(tree,width);schedule();}}});ro.observe(tree);}
   }
   fit(tree);
  });
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(refresh);}
 function start(){new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','aria-selected']});window.addEventListener('resize',schedule);document.fonts?.ready.then(schedule);refresh();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.V1282FamilyLayout={refresh,inspect(){return [...document.querySelectorAll('#wordDetailDialog .v1278-family-content .v1222-family-tree')].map(tree=>({nodes:tree.querySelectorAll('.vft-node').length,scale:getComputedStyle(tree).getPropertyValue('--v1282-family-scale').trim(),width:tree.clientWidth,treeWidth:tree.querySelector('.vft-stage')?.getBoundingClientRect().width}));}};
})();
