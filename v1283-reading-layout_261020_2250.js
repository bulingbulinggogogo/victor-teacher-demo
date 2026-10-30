/* V1.2.79: a shared page inset and a narrow floating meaning-controls dock.
 * The original dock, checkbox nodes and manual collapse event handlers stay mounted.
 * New word-detail openings start expanded; natural control height never becomes an inner scroller. */
(() => {
  'use strict';
  if (window.V1279ReadingLayout) return;
  const models = new WeakMap(), live = new Set();
  let frame = 0;
  const put = (node,key,value) => { if (node.style.getPropertyValue(key) !== value) node.style.setProperty(key,value); };
  function schedule() { if (!frame) frame = requestAnimationFrame(refresh); }
  function sync(model) {
    const {detail,body} = model;
    const selected = detail.querySelector('[data-word-module][aria-selected="true"]')?.dataset.wordModule || '';
    if (detail.dataset.v1279ReadingModule !== selected) detail.dataset.v1279ReadingModule = selected;
    const dock = detail.querySelector('#classroomDock');
    if (!dock) return;
    if (!dock.hasAttribute('data-v1279-reading-dock')) dock.dataset.v1279ReadingDock = 'true';
    if (detail.classList.contains('v1263-interactive-fullscreen')) return;
    if (selected === 'meanings' && model.expandOnMount) {
      // Reset the live presentation state without clearing or rewriting saved
      // lecture preferences. Manual clicks must then toggle from this same state.
      if(typeof state==='object'&&state)state.classroomDockCollapsed=false;
      if(typeof applyClassroomDockCollapsed==='function')applyClassroomDockCollapsed();
      dock.classList.remove('collapsed');
      const toggle=dock.querySelector('#classroomDockToggle');
      if(toggle){
        toggle.setAttribute('aria-expanded','true');toggle.title='收起课堂工具';toggle.setAttribute('aria-label','收起课堂工具');
        const icon=toggle.querySelector('span');
        if(icon&&!icon.querySelector('path[d="M19 12H5"]'))icon.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5"></path><path d="m11 18-6-6 6-6"></path></svg>';
      }
      model.expandOnMount=false;
    }
    if(model.dock !== dock){if(model.dock)model.resize.unobserve(model.dock);model.dock=dock;model.resize.observe(dock);} 
    const bounds = body.getBoundingClientRect();
    const footer = detail.querySelector(':scope>.classroom-modal-tools')?.getBoundingClientRect();
    const bottom = Math.min(bounds.bottom,footer?.top || innerHeight) - 12;
    const nav=detail.querySelector('.vwn-main-nav'),sub=detail.querySelector('.v1223-word-subnav:not([hidden])');
    const tabBottom=Math.max(nav?.getBoundingClientRect().bottom||bounds.top,sub?.getBoundingClientRect().bottom||bounds.top);
    // The rail keeps its complete natural height. When the tabs sit low on the
    // initial page, lift only the floating rail enough to keep every control
    // above the footer. The reading column and its margins never move.
    const naturalHeight=dock.getBoundingClientRect().height;
    const preferredTop=Math.max(bounds.top,tabBottom);
    const top=Math.max(bounds.top+8,Math.min(preferredTop,bottom-naturalHeight));
    put(detail,'--v1279-reading-dock-top',Math.round(top) + 'px');
    put(detail,'--v1279-reading-dock-room',Math.max(0,Math.floor(bottom - top)) + 'px');
    model.preferredTop=preferredTop;model.naturalHeight=naturalHeight;
    put(detail,'--v1279-reading-scrollbar',Math.max(0,body.offsetWidth - body.clientWidth) + 'px');
  }
  function refresh() {
    frame = 0;
    live.forEach(model => {
      if (!model.detail.isConnected) {
        model.observer.disconnect(); model.resize.disconnect(); model.body.removeEventListener('scroll',schedule); live.delete(model); return;
      }
      sync(model);
    });
  }
  function mount(detail,resetExpanded=false) {
    if (detail?.id !== 'wordDetailDialog') return;
    if(models.has(detail)){if(resetExpanded)models.get(detail).expandOnMount=true;return;}
    const body = detail.querySelector(':scope>.resource-popover-body'); if (!body) return;
    detail.dataset.v1279ReadingLayout = 'true';
    const model = {detail,body,observer:null,resize:null,dock:null,expandOnMount:true,preferredTop:0,naturalHeight:0};
    model.observer = new MutationObserver(records => {
      if (records.some(record => record.type === 'childList' || record.target === detail || record.target.id === 'classroomDock' || record.target.closest?.('#classroomDock') || record.target.hasAttribute('data-word-module'))) schedule();
    });
    // Only original state changes are observed. Our data markers and measured
    // custom properties are outside the attribute filter, so writes cannot loop.
    model.observer.observe(detail,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-selected','aria-pressed']});
    model.resize = new ResizeObserver(schedule); model.resize.observe(body);
    const nav = detail.querySelector('.vwn-main-nav'); if (nav) model.resize.observe(nav);
    body.addEventListener('scroll',schedule,{passive:true});
    models.set(detail,model); live.add(model); sync(model); schedule();
  }
  const api = window.V1220WordDetail;
  if (api?.finish) { const finish = api.finish; api.finish = function(detail) { const value = finish.apply(this,arguments); mount(detail,true); schedule(); return value; }; }
  window.addEventListener('click',event=>{
    const toggle=event.target.closest?.('#classroomDockToggle'),detail=toggle?.closest('#wordDetailDialog');
    if(!detail||detail.classList.contains('v1263-interactive-fullscreen')||detail.dataset.v1279ReadingModule!=='meanings')return;
    const body=detail.querySelector(':scope>.resource-popover-body'),top=body?.scrollTop||0;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{if(body?.isConnected){body.scrollTop=top;schedule();}}));
  },true);
  window.addEventListener('resize',schedule);
  document.addEventListener('fullscreenchange',schedule);
  mount(document.getElementById('wordDetailDialog'),true);
  window.V1279ReadingLayout = Object.freeze({mount,refresh:schedule,inspect(detail=document.getElementById('wordDetailDialog')) {
    if (!detail?.hasAttribute('data-v1279-reading-layout')) return null;
    const box = node => { if (!node) return null; const b = node.getBoundingClientRect(); return {left:+b.left.toFixed(2),right:+b.right.toFixed(2),top:+b.top.toFixed(2),width:+b.width.toFixed(2),height:+b.height.toFixed(2)}; };
    const dock = detail.querySelector('#classroomDock'),content = detail.querySelector('.vwn-content'),body = detail.querySelector(':scope>.resource-popover-body');
    return {preferredTop:models.get(detail)?.preferredTop,naturalHeight:models.get(detail)?.naturalHeight,module:detail.dataset.v1279ReadingModule,fullscreen:detail.classList.contains('v1263-interactive-fullscreen'),dockVisible:!!dock&&getComputedStyle(dock).display!=='none',collapsed:!!dock?.classList.contains('collapsed'),dock:box(dock),upper:box(detail.querySelector('.v1270-word-upper')),nav:box(detail.querySelector('.vwn-main-nav')),content:box(content),readingLayoutDisplay:detail.querySelector('.v1275-reading-layout')?getComputedStyle(detail.querySelector('.v1275-reading-layout')).display:null,bodyOverflow:body?{width:body.clientWidth,scroll:body.scrollWidth}:null};
  }});
})();
