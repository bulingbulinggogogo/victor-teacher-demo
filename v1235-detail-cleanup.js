/* Measure label text at the current lecture face/size instead of reserving a
   fixed 10em rail. One rail is shared by every inflection pair in each dl. */
(() => {
 'use strict';
 const canvas=document.createElement('canvas'),context=canvas.getContext('2d');
 const tracked=new Set();let frame=0;
 const resize=typeof ResizeObserver==='function'?new ResizeObserver(schedule):null;
 const number=value=>parseFloat(value)||0;
 function naturalWidth(element){
  const style=getComputedStyle(element),copy=element.textContent.trim();
  if(!context)return copy.length*number(style.fontSize);
  context.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  if('fontKerning' in context)context.fontKerning=style.fontKerning;
  if('letterSpacing' in context)context.letterSpacing=style.letterSpacing==='normal'?'0px':style.letterSpacing;
  if('wordSpacing' in context)context.wordSpacing=style.wordSpacing==='normal'?'0px':style.wordSpacing;
  return context.measureText(copy).width;
 }
 function measure(){
  frame=0;
  tracked.forEach(dl=>{if(!dl.isConnected){resize?.unobserve(dl);tracked.delete(dl);}});
  document.querySelectorAll('#wordDetailDialog .v1227-inflections').forEach(dl=>{
   if(!tracked.has(dl)){tracked.add(dl);resize?.observe(dl);}
   if(dl.closest('[hidden],.hidden')||!dl.getClientRects().length)return;
   const labels=[...dl.querySelectorAll(':scope > .v1227-inflection > dt')];
   if(!labels.length)return;
   const width=Math.ceil(Math.max(...labels.map(naturalWidth))*100)/100;
   const value=width+'px';
   if(dl.style.getPropertyValue('--v1235-form-label-width')!==value)dl.style.setProperty('--v1235-form-label-width',value);
  });
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(measure);}
 function relevant(record){
  const target=record.target;
  if(target===document.documentElement||target.id==='fullscreenPage'||target.closest?.('#wordDetailDialog'))return true;
  return record.type==='childList'&&[...record.addedNodes].some(node=>node.nodeType===1&&(node.id==='wordDetailDialog'||node.querySelector?.('#wordDetailDialog')));
 }
 new MutationObserver(records=>{if(records.some(relevant))schedule();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden']});
 new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['class','style']});
 addEventListener('resize',schedule,{passive:true});document.fonts?.ready.then(schedule);document.fonts?.addEventListener?.('loadingdone',schedule);
 function snapshot(){
  const owner=document.getElementById('wordDetailDialog');if(!owner)return [];
  return [...owner.querySelectorAll('.v1227-inflections')].filter(dl=>!dl.closest('[hidden],.hidden')).map(dl=>({
   head:owner.dataset.latestWordHead,labelRail:dl.style.getPropertyValue('--v1235-form-label-width'),
   outerColumns:getComputedStyle(dl).gridTemplateColumns,
   pairs:[...dl.querySelectorAll(':scope > .v1227-inflection')].map(pair=>{
    const dt=pair.querySelector('dt'),dd=pair.querySelector('dd'),range=document.createRange();range.selectNodeContents(dt);
    const label=range.getBoundingClientRect(),value=dd.getBoundingClientRect(),style=getComputedStyle(pair);
    return {label:dt.textContent,value:dd.textContent,labelTextWidth:label.width,labelTrackWidth:dt.getBoundingClientRect().width,valueLeft:value.left,textToValueGap:value.left-label.right,columnGap:number(style.columnGap),tracks:style.gridTemplateColumns};
   })
  }));
 }
 window.V1235DetailCleanup={refresh:schedule,snapshot};schedule();
})();
