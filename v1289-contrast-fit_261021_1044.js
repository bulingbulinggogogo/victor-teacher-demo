/* Fit the complete approved three-column lesson into the available viewport. */
(() => {
 'use strict';let frame=0;const observed=new WeakSet();
 function fit(){
  frame=0;
  const detail=document.querySelector('#wordDetailDialog.v1263-interactive-fullscreen[data-v1263-interactive-module="contrast"]');
  const body=detail?.querySelector(':scope>.resource-popover-body'),root=detail?.querySelector('[data-v1283-contrast]'),lecture=root?.querySelector('.lecture');
  if(!body||!root||!lecture)return;
  if(!observed.has(body)){observed.add(body);new ResizeObserver(schedule).observe(body);}
  root.style.setProperty('--v1285-contrast-fit','1');
  const available=detail.querySelector('.vwn-content').clientHeight;
  const columns=root.querySelector('.pgi-contrast-grid');if(columns){columns.style.setProperty('width','100%','important');columns.style.setProperty('max-width',available<620?((available*.44*4/3)*3+72)+'px':'none','important');columns.style.setProperty('margin','0 auto','important');}
  const cards=[...root.querySelectorAll('.word-card')];
  let imageHeight=320;
  for(const card of cards){const img=card.querySelector('img'),ratio=img?.naturalWidth&&img.naturalHeight?img.naturalWidth/img.naturalHeight:4/3;card.style.setProperty('--v1285-image-ratio',String(ratio));imageHeight=Math.min(imageHeight,card.clientWidth/ratio);if(img&&!observed.has(img)){observed.add(img);img.addEventListener('load',schedule);}}
  root.style.setProperty('--v1285-contrast-image',imageHeight+'px');
  const natural=lecture.getBoundingClientRect().height;
  let scale=Math.min(1,Math.max(.1,(available-4)/Math.max(1,natural)));
  root.style.setProperty('--v1285-contrast-fit',String(scale));
  for(let pass=0;pass<16;pass++){const height=lecture.getBoundingClientRect().height;if(height<=available-2)break;scale*=Math.max(.1,(available-4)/height);root.style.setProperty('--v1285-contrast-fit',String(scale));}
  detail.dataset.v1285ContrastFitted='true';
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(fit);}
 new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','data-v1263-interactive-module']});
 window.addEventListener('resize',schedule);document.fonts?.ready.then(schedule);schedule();
 window.V1285ContrastFit={refresh:schedule};
})();
