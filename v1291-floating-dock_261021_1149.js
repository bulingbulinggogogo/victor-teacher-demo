/* V1.2.83: modal-background-aware empty-dock presentation and a settings overlay above sticky tabs.
 * Native buttons, handlers and stored lecture preferences retain their owners. */
(() => {
 'use strict';
 const dock=document.getElementById('classroomDock'),panel=document.getElementById('interfaceSettingsPanel');
 if(!dock||!panel)return;
 let frame=0,live=null,scrollHost=null;
 const put=(node,key,value)=>{if(node.style.getPropertyValue(key)!==value)node.style.setProperty(key,value);};
 // Availability ignores the dock's collapsed display, so a real branch can reopen.
 // A modal popup inerts its background. That prevents interaction but does
 // not mean the word-detail's controls disappeared or should auto-collapse.
 const shown=node=>{
  if(!node||node.closest('[hidden],.hidden,[aria-hidden="true"]'))return false;
  const inert=node.closest('[inert]');
  if(!inert)return true;
  return inert.id==='wordDetailDialog'&&!!document.querySelector('.sgp-backdrop:not([hidden]) .sgp-panel[aria-modal="true"]');
 };
 function restore(){
  if(panel.dataset.v1276Popup){
   delete panel.dataset.v1276Popup;
   for(const key of ['left','top','max-height','max-width'])panel.style.removeProperty(key);
   dock.append(panel);
  }
  if(live)delete live.dataset.v1276EmptyDock;
 }
 function sync(){
  frame=0;
  const d=document.getElementById('wordDetailDialog');
  if(!d||!d.isConnected||d.classList.contains('v1263-interactive-fullscreen')){restore();live=null;return;}
  if(live&&live!==d)restore();live=d;
  const module=d.querySelector('[data-word-module][aria-selected="true"]')?.dataset.wordModule||'';
  const noSwitches=![...dock.querySelectorAll('.v1225-word-secondary [data-word-feature],.v1225-word-secondary [role="switch"]')].some(shown);
  if(d.dataset.v1276EmptyDock!==String(noSwitches))d.dataset.v1276EmptyDock=String(noSwitches);
  // Empty tabs keep the native dock and its manually selected expanded state.
  if(panel.parentElement!==d){d.append(panel);panel.dataset.v1276Popup='true';}
  if(scrollHost!==d.querySelector(':scope>.resource-popover-body')){
   scrollHost?.removeEventListener('scroll',schedule);scrollHost=d.querySelector(':scope>.resource-popover-body');scrollHost?.addEventListener('scroll',schedule,{passive:true});
  }
  if(!panel.classList.contains('hidden')){
   const bounds=d.getBoundingClientRect(),footer=d.querySelector(':scope>.classroom-modal-tools')?.getBoundingClientRect();
   put(panel,'max-height',Math.max(120,(footer?.top||bounds.bottom)-bounds.top-24)+'px');
   put(panel,'max-width',Math.max(180,bounds.width-24)+'px');
   const anchor=dock.getBoundingClientRect(),size=panel.getBoundingClientRect(),right=dock.classList.contains('dock-right');
   const x=right?anchor.left-size.width-10:anchor.right+10;
   const y=Math.min(anchor.bottom,(footer?.top||bounds.bottom)-8)-size.height;
   put(panel,'left',Math.max(bounds.left+12,Math.min(x,bounds.right-size.width-12))+'px');
   put(panel,'top',Math.max(bounds.top+12,y)+'px');
  }
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(sync);}
 new MutationObserver(records=>{if(records.some(record=>record.type==='childList'||record.oldValue!==record.target.getAttribute(record.attributeName)))schedule();})
  .observe(document.body,{subtree:true,childList:true,attributes:true,attributeOldValue:true,attributeFilter:['hidden','class','aria-selected','aria-pressed']});
 new ResizeObserver(schedule).observe(dock);new ResizeObserver(schedule).observe(panel);
 window.addEventListener('resize',schedule);schedule();
})();
