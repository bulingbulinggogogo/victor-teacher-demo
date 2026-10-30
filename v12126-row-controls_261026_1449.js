/* Match the existing Up/Down reveal sequence with visible controls. */
(() => {
  'use strict';
  const api=window.V1213Illustrations;
  if(!api?.create||window.V1247PolysemyControls)return;
  const create=api.create;
  const models=new WeakMap(), live=new Set(), watched=new WeakSet();
  let frame=0;
  function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;live.forEach(model=>{if(model.module.isConnected)model.sync();else if(model.connected){model.controls.remove();model.observer.disconnect();model.toolsObserver.disconnect();live.delete(model);}});});}
  function watch(detail){
    if(watched.has(detail))return;
    watched.add(detail);
    // Navigation owns module selection; this adapter only follows its state.
    new MutationObserver(schedule).observe(detail,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','aria-selected','class']});
  }
  function mount(row){
    const module=row.content;
    if(!module?.matches('.pgi-module[data-graph-kind="polysemy"]')||models.has(module))return;
    const controls=document.createElement('nav');
    controls.className='v1247-polysemy-controls v1281-network-rail';controls.setAttribute('aria-label','一词多义逐项展示');
    const make=(label,key)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.v1247PolyAction=key;controls.append(b);return b;};
    const previous=make('上一个','previous'),next=make('下一个','next');
    const toggle=make('全部展示','toggle');toggle.setAttribute('aria-pressed','false');
    controls.hidden=true;
    // The original diagram remains the cleanup owner after the controls move.
    controls.classroomMediaOwner=module;
    function sync(){
      const copies=[...module.querySelectorAll('[data-pgi-copy]')].filter(copy=>!copy.closest('[hidden]')&&copy.dataset.v1297Maskable!=='false');
      const revealed=copies.filter(copy=>!copy.classList.contains('is-hidden')).length;
      const allVisible=copies.length>0&&revealed===copies.length;
      previous.disabled=revealed===0;
      next.disabled=!copies.length||allVisible;
      toggle.disabled=!copies.length;toggle.hidden=!copies.length;
      previous.hidden=next.hidden=!copies.length;
      const toggleLabel=allVisible?'全部隐藏':'全部展示';
      if(toggle.textContent!==toggleLabel)toggle.textContent=toggleLabel;
      toggle.setAttribute('aria-pressed',String(allVisible));
      // Preserve the original source toggle listener/delegate; the visible rail
      // uses that same reveal Set without leaving a duplicate control slot.
      row.tools?.querySelectorAll('[data-pgi-all]').forEach(button=>{if(!button.classList.contains('v1247-polysemy-source-all'))button.classList.add('v1247-polysemy-source-all');if(!button.hidden)button.hidden=true;});
      const detail=module.closest('#wordDetailDialog,#lexicalChunkDialog,#popover');
      if(!detail)return;
      model.connected=true;watch(detail);
      const selected=detail.querySelector('[data-word-module][aria-selected="true"]');
      const active=selected?.dataset.wordModule==='illustrations'&&!module.closest('[hidden],.hidden');
      if(controls.hidden===active)controls.hidden=!active;
      const dock=detail.querySelector('#classroomDock.v1223-word-dock');
      if(dock){
        if(controls.parentElement!==dock)dock.insertBefore(controls,dock.querySelector('.dock-footer-actions'));
        detail.dataset.v1281NetworkControls='rail';
      }else if(!controls.isConnected)window.ClassroomTools?.attach?.(detail,controls,'topic-direction');
    }
    const model={module,controls,sync,connected:false,observer:null,toolsObserver:null};
    models.set(module,model);live.add(model);
    controls.addEventListener('click',event=>{
      const button=event.target.closest('[data-v1247-poly-action]');
      if(!button||!controls.contains(button))return;
      sync();if(button.disabled)return;
      const action=button.dataset.v1247PolyAction;
      if(action==='previous'||action==='next')api.step(module,action==='next'?1:-1);
      else{
        const original=row.tools?.querySelector('[data-pgi-all]');
        const wantsVisible=toggle.getAttribute('aria-pressed')!=='true';
        if(original&&(original.getAttribute('aria-pressed')==='true')!==wantsVisible)original.click();
      }
      sync();
    });
    model.observer=new MutationObserver(schedule);model.observer.observe(module,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-pressed']});
    model.toolsObserver=new MutationObserver(schedule);if(row.tools)model.toolsObserver.observe(row.tools,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-pressed']});
    sync();schedule();
  }
  api.create=function visiblePolysemyControls(){const rows=create.apply(this,arguments);rows.forEach(mount);return rows;};
  const details=window.V1220WordDetail;
  if(details?.finish){const finish=details.finish;details.finish=function(){const result=finish.apply(this,arguments);live.forEach(model=>model.sync());schedule();return result;};}
  window.V1247PolysemyControls=Object.freeze({mount,refresh:schedule});
})();
