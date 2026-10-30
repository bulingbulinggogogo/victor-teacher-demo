/* Keep the original grammar buttons, labels, click handlers and physical tool slots. */
(()=>{'use strict';
 const popover=document.getElementById('popover');if(!popover)return;
 let frame=0;const watched=new WeakSet();
 const resize=new ResizeObserver(schedule);
 function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;fit()})}
 function fit(){
  popover.querySelectorAll('.ke-g-structure').forEach(button=>{
   if(!watched.has(button)){resize.observe(button);watched.add(button)}
   if(!button.getClientRects().length)return;
   const s=getComputedStyle(button),base=parseFloat(s.getPropertyValue('--v106-tool-font'))||12;
   const signature=[button.clientWidth,button.clientHeight,base,s.fontFamily,s.fontWeight,s.letterSpacing,button.textContent].join('|');
   if(button.dataset.v116FitSignature!==signature){
    button.dataset.v116FitSignature=signature;
    const value=base+'px';if(button.style.getPropertyValue('--v116-fit-font')!==value)button.style.setProperty('--v116-fit-font',value);
   }
   let size=parseFloat(getComputedStyle(button).fontSize);
   while(size>6&&(button.scrollHeight>button.clientHeight+1||button.scrollWidth>button.clientWidth+1)){
    size-=0.25;button.style.setProperty('--v116-fit-font',size+'px');
   }
  });
 }
 new MutationObserver(schedule).observe(popover,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','style','hidden']});
 window.addEventListener('resize',schedule);document.fonts?.ready.then(schedule);schedule();
 window.V12116Reading=Object.freeze({refresh:schedule});
})();
