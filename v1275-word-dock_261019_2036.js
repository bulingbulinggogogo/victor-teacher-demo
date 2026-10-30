/* Share the original lecture dock, with the same primary and indented child controls.
 * Existing buttons, event delegates, settings and preference storage stay intact. */
(() => {
  'use strict';
  const dock=document.getElementById('classroomDock');
  const layout=document.getElementById('dockLayoutSwitch');
  const page=document.getElementById('fullscreenPage');
  if(!dock || !layout || !page) return;
  const dockHome=document.createComment('shared lecture dock home'); dock.before(dockHome);
  const layoutHome=document.createComment('shared lecture layout switch home'); layout.before(layoutHome);
  const models=new Map(), layers=[];
  let owner=null, frame=0, paletteSignature='';
  const originalDockVars=new Map();
  const originalDockLineHeight=dock.style.lineHeight;
  const lectureControlLineHeight=getComputedStyle(document.getElementById('answerToggle')).lineHeight;
  const visible=element=>element && element.isConnected && !element.hidden && !element.classList.contains('hidden');
  const setClass=(element,name,on)=>{if(element.classList.contains(name)!==Boolean(on))element.classList.toggle(name,Boolean(on));};
  const setStyle=(element,name,value)=>{if(element.style.getPropertyValue(name)!==value)element.style.setProperty(name,value);};
  const mainPrimary=dock.querySelector(':scope > .dock-primary');
  const styleProperties=['font-family','font-size','font-weight','font-style','line-height','letter-spacing','width','height','min-height','padding','border-width','border-style','border-radius','border-color','background-color','color','text-align','white-space','box-shadow'];
  function restoreAt(node,anchor){if(anchor.parentNode && node.previousSibling!==anchor)anchor.after(node);}
  function syncPalette(){
    const signature=page.dataset.demoPalette+'|'+page.dataset.themeKind;
    if(signature===paletteSignature)return;
    paletteSignature=signature;
    const style=getComputedStyle(page);
    for(let i=0;i<style.length;i++){
      const key=style[i];if(!key.startsWith('--lecture-'))continue;
      if(!originalDockVars.has(key))originalDockVars.set(key,dock.style.getPropertyValue(key));
      dock.style.setProperty(key,style.getPropertyValue(key));
    }
  }
  function sampleControl(button){
    const before=button.classList.contains('active'), result={};
    for(const [name,active] of [['normal',false],['active',true]]){
      button.classList.toggle('active',active);
      const style=getComputedStyle(button);
      result[name]=Object.fromEntries(styleProperties.map(property=>[property,style.getPropertyValue(property)]));
    }
    button.classList.toggle('active',before);
    return result;
  }
  function referenceStyles(){
    let child=mainPrimary.querySelector('.dock-knowledge button'), probe=null;
    if(!child){
      // The lecture has no knowledge buttons before a question is selected. Use
      // the very same dock-knowledge rule in its original primary container.
      probe=document.createElement('div');probe.className='dock-knowledge visible';
      child=document.createElement('button');child.textContent='词汇';probe.append(child);mainPrimary.append(probe);
    }
    const result={main:sampleControl(document.getElementById('analysisToggle')),secondary:sampleControl(child)};
    probe?.remove();return result;
  }
  function syncSecondaryStyles(model){
    const samples=referenceStyles(),reference=samples.main;
    model.controlStyles=reference;
    for(const [state,styles] of Object.entries(reference))for(const [name,value] of Object.entries(styles))setStyle(model.tree,`--v1225-sub-${state}-${name}`,value);
    for(const [state,styles] of Object.entries(samples.secondary))for(const [name,value] of Object.entries(styles))setStyle(model.tree,`--v1267-child-${state}-${name}`,value);
  }
  function sourceShown(model,element){
    // The wrapper's hidden state is decided below. Do not let its previous
    // state prevent a source tool from making the wrapper visible again.
    for(let node=element;node&&node!==model.subnav;node=node.parentElement){
      if(node.hidden||node.classList.contains('hidden')||node.getAttribute('aria-hidden')==='true')return false;
      if(node===model.actions)break;
    }
    return true;
  }
  function revealModule(model,element){
    const source=element.closest('.vpi-tools');if(!source||!model.actions.contains(source))return '';
    const explicit=source.dataset.v1220SubnavFor||source.dataset.v1225SubnavFor;
    if(explicit)return explicit;
    const tools=[...model.actions.children].filter(node=>node.classList.contains('vpi-tools'));
    return model.visualModules[tools.indexOf(source)]||'';
  }
  function routeAllSlot(detail,element,slot){
    const model=models.get(detail);
    if(detail?.id!=='wordDetailDialog'||!model||!element.matches('[data-pgi-all]'))return false;
    const module=revealModule(model,element);if(!module)return false;
    const branch=branchFor(model,module);
    if(slot.parentElement!==branch)branch.append(slot);
    setClass(slot,'v1241-dock-all-reservation',true);
    setClass(element,'v1241-sidebar-all',true);
    const previous=model.revealSlots.get(element);
    if(!previous||previous.slot!==slot||previous.module!==module){model.revealSlots.set(element,{slot,module});refresh(detail);}
    for(const [state,styles] of Object.entries(model.controlStyles||{}))for(const [name,value] of Object.entries(styles))setStyle(element,`--v1241-reveal-${state}-${name}`,value);
    return true;
  }
  function syncSelection(model){
    model.nav.querySelectorAll('[data-word-module]').forEach(button=>{
      button.classList.remove('dock-text-action');
      setClass(button,'active',button.getAttribute('aria-selected')==='true');
      const textNodes=[...button.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE && node.textContent.trim());
      let label=button.querySelector(':scope > .v1223-word-label');
      if(textNodes.length){if(!label){label=document.createElement('span');label.className='v1223-word-label';button.prepend(label);}textNodes.forEach(node=>label.append(node));}
      // Listening labels own their nested spans; do not split or move those spans.
      const count=button.querySelector(':scope > .vwn-count');if(label && count)label.append(count);
    });
  }
  function branchFor(model,module){
    if(model.branches.has(module))return model.branches.get(module);
    const branch=document.createElement('div');branch.className='v1225-word-secondary';
    branch.dataset.wordParent=module;branch.setAttribute('aria-label','对应模块的内容显隐');
    model.tree.append(branch);model.branches.set(module,branch);return branch;
  }
  function syncBranches(model){
    model.revealSlots.forEach(({slot},element)=>{if(!element.isConnected){slot.remove();model.revealSlots.delete(element);}});
    // The network is a static content module and has no reveal branch.
    for(const [source,record] of model.sources){
      if(record.module!=='network')continue;
      source.remove();record.home.remove();model.sources.delete(source);
    }
    model.branches.get('network')?.remove();model.branches.delete('network');
    [...model.actions.children].forEach(source=>{
      if(source.dataset.v1220SubnavFor==='network' || source.dataset.v1225SubnavFor==='network' || source.querySelector('[data-network-action]')){source.remove();return;}
      if(model.sources.has(source))return;
      // Categorical navigation remains above the content. Only content reveal
      // controls use the original classroom dock.
      if(source.classList.contains('vwn-pos-tabs') || source.getAttribute('role')==='tablist' || source.classList.contains('vpi-tools'))return;
      let module=source.dataset.v1220SubnavFor || source.dataset.v1225SubnavFor;
      if(source.classList.contains('vwn-pos-tabs'))module='meanings';
      if(source.classList.contains('vpi-tools'))module=model.visualModules[model.visualIndex++];
      if(!module)return;
      const home=document.createComment('word secondary group home');source.before(home);
      const branch=branchFor(model,module);branch.append(source);model.sources.set(source,{module,source,home});
    });
    const buttons=[...model.nav.querySelectorAll(':scope > [data-word-module]')];
    const active=buttons.find(button=>button.getAttribute('aria-selected')==='true')?.dataset.wordModule;
    buttons.forEach((button,index)=>setStyle(button,'order',String(index*2)));
    for(const [module,branch]of model.branches){
      const index=buttons.findIndex(button=>button.dataset.wordModule===module);
      setStyle(branch,'order',String(index*2+1));
      const button=buttons[index];if(button && branch.getAttribute('aria-labelledby')!==button.id)branch.setAttribute('aria-labelledby',button.id);
      const sources=[...model.sources.values()].filter(record=>record.module===module && record.source.parentElement===branch).map(record=>record.source);
      const revealAvailable=[...model.revealSlots].some(([element,record])=>record.module===module&&sourceShown(model,element));
      const available=sources.some(source=>!source.hidden && !source.classList.contains('hidden'))||revealAvailable;
      const shown=active===module && index>=0 && available;
      if(branch.hidden===shown)branch.hidden=!shown;
      const tabs=sources.flatMap(source=>[...source.querySelectorAll('button:not(.classroom-tools-floating):not(.v16-icon-tool)')]).filter(control=>!control.closest('[hidden],.hidden'));
      setClass(branch,'v1225-no-flow',tabs.length===0&&!revealAvailable);
      sources.forEach(source=>source.querySelectorAll('button:not(.classroom-tools-floating):not(.v16-icon-tool)').forEach(control=>{
        control.classList.add('dock-text-action');
        setClass(control,'active',control.getAttribute('aria-selected')==='true' || control.getAttribute('aria-pressed')==='true');
        const textNodes=[...control.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE && node.textContent.trim());
        if(textNodes.length){
          let label=control.querySelector(':scope > .v1225-sub-label');
          if(!label){label=document.createElement('span');label.className='v1225-sub-label';control.prepend(label);}
          textNodes.forEach(node=>label.append(node));
        }
      }));
    }
    model.actions.querySelectorAll('[role="tablist"]').forEach(source=>{source.classList.remove('v1220-secondary-tabs');source.classList.add('book-unit-options');source.querySelectorAll('button').forEach(button=>setClass(button,'active',button.getAttribute('aria-selected')==='true'));});
    // The same word header stays visible while the content module changes.
    model.detail.classList.remove('v1225-word-hide-intro');
    model.active=active;
  }
  function update(){
    frame=0;if(!owner)return;
    const model=models.get(owner);if(!model || !visible(owner)){release(owner);return;}
    // V75 reading layout owns only the ordinary meaning panel's position.
    // The V74 controls, source state, events and independent full-screen modules keep their owners.
    const visualHost=owner.dataset.v1275Controls==='true'&&!owner.classList.contains('v1263-interactive-fullscreen')?owner.querySelector('.v1275-reading-layout'):null;
    const dockHost=visualHost||owner;
    if(dock.parentElement!==dockHost)dockHost.append(dock);
    restoreAt(model.nav,model.navHome);
    if(model.tree.parentElement!==dock)dock.insertBefore(model.tree,dock.querySelector('.dock-footer-actions'));
    if(layout.parentElement!==model.layoutHost)model.layoutHost.append(layout);
    const side=dock.classList.contains('dock-right')?'right':'left';
    if(owner.dataset.classroomToolsSide!==side)owner.dataset.classroomToolsSide=side;
    setClass(owner,'dock-right-layout',side==='right');setClass(owner,'dock-left-layout',side==='left');
    setClass(owner,'v1223-word-dock-collapsed',dock.classList.contains('collapsed'));
    if(dock.dataset.wordDockOwner!==owner.id)dock.dataset.wordDockOwner=owner.id;
    if(dock.getAttribute('aria-label')!=='单词详情工具栏')dock.setAttribute('aria-label','单词详情工具栏');
    syncSelection(model);syncPalette();syncSecondaryStyles(model);syncBranches(model);
    // The original dock's backdrop blur creates a fixed-position containing
    // block. Floating footer controls retain viewport coordinates from the
    // shared modal code, so translate only their coordinate origin here.
    const dockRect=dock.getBoundingClientRect();
    setStyle(model.tree,'--v1225-floating-origin-left',(dockRect.left+dock.clientLeft)+'px');
    setStyle(model.tree,'--v1225-floating-origin-top',(dockRect.top+dock.clientTop)+'px');
    // Preserve the original second-level groups above the active content.
    const hasCategories=[...model.actions.children].some(source=>sourceShown(model,source)&&[...source.querySelectorAll('button:not(.classroom-tools-floating),input,select')].some(control=>sourceShown(model,control)));
    const hasReveal=[...model.revealSlots.keys()].some(element=>element.isConnected&&sourceShown(model,element));
    const renderSource=hasCategories||hasReveal;
    if(model.subnav.hidden===renderSource)model.subnav.hidden=!renderSource;
    setClass(model.subnav,'v1241-reveal-only',hasReveal&&!hasCategories);
    window.ClassroomTools?.refresh?.();
  }
  function refresh(detail){if(detail && models.has(detail))syncSelection(models.get(detail));if(!frame)frame=requestAnimationFrame(update);}
  function mount(detail,{nav,actions,footer}){
    if(models.has(detail))return true;
    const body=detail.querySelector('.resource-popover-body'),workspace=body?.querySelector('.vwn-content');
    if(!body || !workspace || !nav || !actions)return false;
    detail.classList.add('v1223-word-dock-owner');detail.dataset.wordNavigation='shared-classroom-dock';
    const navHome=document.createComment('word module navigation home');workspace.before(navHome,nav);
    const subnav=document.createElement('div');subnav.className='v1223-word-subnav';
    workspace.before(subnav);subnav.append(actions);
    const tree=document.createElement('div');tree.className='dock-primary v1223-word-primary v1225-word-tree';
    nav.classList.add('v1225-word-main-nav');nav.setAttribute('aria-label','单词详情模块');
    const layoutHost=document.createElement('div');layoutHost.className='v1223-word-layout-host';footer.append(layoutHost);
    const visualModules=[...nav.querySelectorAll('[data-word-module]')].filter(button=>document.getElementById(button.getAttribute('aria-controls'))?.querySelector('.pgi-module') || workspace.querySelector(`[id="${button.getAttribute('aria-controls')}"] .pgi-module`)).map(button=>button.dataset.wordModule);
    const model={detail,nav,actions,footer,subnav,navHome,layoutHost,tree,branches:new Map(),sources:new Map(),revealSlots:new Map(),controlStyles:null,visualModules,visualIndex:0,active:''};models.set(detail,model);
    nav.addEventListener('click',()=>refresh(detail));
    const observer=new MutationObserver(()=>refresh(detail));
    observer.observe(tree,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-selected','aria-pressed','hidden']});
    observer.observe(nav,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-selected','hidden']});
    observer.observe(actions,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
    model.observer=observer;syncSelection(model);
    if(detail.isConnected)activate(detail);return true;
  }
  function activate(detail){
    const model=models.get(detail);if(!model || !detail.isConnected)return false;
    if(owner===detail){refresh(detail);return true;}
    if(owner){const old=models.get(owner);if(old){old.nav.classList.add('vwn-main-nav');restoreAt(old.nav,old.navHome);old.tree.remove();}}
    const i=layers.indexOf(detail);if(i>=0)layers.splice(i,1);layers.push(detail);owner=detail;
    dock.classList.add('v1223-word-dock');dock.style.lineHeight=lectureControlLineHeight;
    mainPrimary?.setAttribute('aria-hidden','true');if(mainPrimary)mainPrimary.inert=true;
    if(typeof closeInterfaceSettings==='function')closeInterfaceSettings();
    model.nav.classList.add('vwn-main-nav');
    restoreAt(model.nav,model.navHome);
    detail.append(dock);dock.insertBefore(model.tree,dock.querySelector('.dock-footer-actions'));
    model.layoutHost.append(layout);paletteSignature='';update();return true;
  }
  function release(detail){
    const model=models.get(detail);if(!model)return false;
    const i=layers.indexOf(detail);if(i>=0)layers.splice(i,1);
    model.observer.disconnect();
    model.sources.forEach(({source,home})=>restoreAt(source,home));
    model.nav.classList.add('vwn-main-nav');restoreAt(model.nav,model.navHome);model.tree.remove();models.delete(detail);
    if(owner!==detail)return true;
    owner=null;if(typeof closeInterfaceSettings==='function')closeInterfaceSettings();
    const parent=[...layers].reverse().find(node=>node.isConnected && models.has(node));if(parent){activate(parent);return true;}
    dock.classList.remove('v1223-word-dock');delete dock.dataset.wordDockOwner;dock.setAttribute('aria-label','课堂控制台');
    mainPrimary?.removeAttribute('aria-hidden');if(mainPrimary)mainPrimary.inert=false;
    restoreAt(dock,dockHome);restoreAt(layout,layoutHome);
    originalDockVars.forEach((value,key)=>value?dock.style.setProperty(key,value):dock.style.removeProperty(key));originalDockVars.clear();
    dock.style.lineHeight=originalDockLineHeight;paletteSignature='';window.ClassroomTools?.refresh?.();return true;
  }
  new MutationObserver(()=>{if(owner && !owner.isConnected)release(owner);}).observe(document.body,{childList:true,subtree:true});
  new MutationObserver(()=>refresh(owner)).observe(dock,{attributes:true,attributeFilter:['class']});
  new MutationObserver(()=>refresh(owner)).observe(page,{attributes:true,attributeFilter:['data-demo-palette','data-theme-kind','class']});
  window.addEventListener('resize',()=>refresh(owner));
  window.V1223WordDock={mount,activate,release,refresh,referenceStyles,routeAllSlot,controlHost:detail=>models.get(detail)?.tree || null,isMounted:detail=>models.has(detail),inspect:()=>({owner:owner?.id||null,layers:layers.map(x=>x.id),dockHome:dock.parentElement?.id||null,layoutHome:layout.parentElement?.className||null,sharedDockCount:document.querySelectorAll('#classroomDock').length,sharedSettingsCount:document.querySelectorAll('#interfaceSettingsPanel').length,active:models.get(owner)?.active||null,secondary:[...(models.get(owner)?.branches||[])].map(([module,branch])=>({module,shown:!branch.hidden,buttons:[...branch.querySelectorAll('button:not(.v16-icon-tool)')].map(button=>button.textContent.trim())}))})};
})();
