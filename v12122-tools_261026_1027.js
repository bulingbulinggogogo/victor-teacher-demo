/* V1.2.13: low classroom tools, using existing nodes and their existing events. */
(() => {
  'use strict';
  if (window.ClassroomTools) return;
  const page = document.getElementById('fullscreenPage');
  const dock = document.getElementById('classroomDock');
  if (!page || !dock) return;
  const dialogIds = ['popover','wordDetailDialog','lexicalChunkDialog','fullOptionStudentDialog'];
  const entries = new WeakMap();
  const live = new Set();
  const watchedAnimations = new WeakSet();
  let frame = 0;
  const active = () => !page.classList.contains('hidden');
  const side = () => dock.classList.contains('dock-right') ? 'right' : 'left';
  const visible = node => node && !node.hidden && !node.classList.contains('hidden');
  const setStyle = (node,key,value) => { if (node.style.getPropertyValue(key) !== value) node.style.setProperty(key,value); };
  const wordDetailIds = new Set(['wordDetailDialog','lexicalChunkDialog']);
  const toolIcons = {
    expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    collapse:'<path d="M3 8h5V3m13 5h-5V3M8 21v-5H3m13 5v-5h5"/>',
    previous:'<path d="m15 5-7 7 7 7"/>',
    next:'<path d="m9 5 7 7-7 7"/>',
    eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeClosed:'<path d="m3 3 18 18M10.6 5.1A11.5 11.5 0 0 1 12 5c6.5 0 10 7 10 7a19 19 0 0 1-3.1 4.1M6.2 6.2A20.7 20.7 0 0 0 2 12s3.5 7 10 7a11.6 11.6 0 0 0 5.8-1.8M10 10a3 3 0 0 0 4 4"/>'
  };
  function syncToolMetrics(node) {
    // The lecture owns the return-button palette even when a popup has a separate card border.
    const lectureStyle=getComputedStyle(page);
    for (const key of ['border','panel','primary','text']) {
      const value=lectureStyle.getPropertyValue('--lecture-'+key).trim();
      if (value) setStyle(node,'--v12122-return-'+key,value);
    }
    const reference=document.getElementById('analysisToggle') || dock.querySelector('#answerToggle,.dock-text-action');
    if (!reference) return;
    const style=getComputedStyle(reference);
    setStyle(node,'--v16-popup-tool-font-size',style.fontSize);
    setStyle(node,'--v16-popup-tool-font-family',style.fontFamily);
    setStyle(node,'--v16-popup-tool-font-weight',style.fontWeight);
    setStyle(node,'--v16-popup-tool-line-height',style.lineHeight);
    setStyle(node,'--v16-popup-tool-font-style',style.fontStyle);
    setStyle(node,'--v16-popup-tool-letter-spacing',style.letterSpacing);
    // offsetHeight also works when the main dock is temporarily collapsed.
    const height=reference.offsetHeight || parseFloat(style.height) || 40;
    setStyle(node,'--v16-popup-tool-height',height+'px');
  }
  function iconTool(button,label,kind) {
    if (!button) return;
    if(kind==='previous'||kind==='next'){const text=kind==='previous'?'上一条':'下一条';button.classList.remove('v16-icon-tool');if(button.textContent!==text)button.textContent=text;if(button.getAttribute('aria-label')!==text)button.setAttribute('aria-label',text);return;}
    if (!button.classList.contains('v16-icon-tool')) button.classList.add('v16-icon-tool');
    if (button.getAttribute('aria-label')!==label) button.setAttribute('aria-label',label);
    if (button.title!==label) button.title=label;
    if (button.dataset.v16IconKind!==kind || !button.querySelector(':scope > svg')) {
      let icon=button.querySelector(':scope > svg');
      if (!icon) { icon=document.createElementNS('http://www.w3.org/2000/svg','svg');button.prepend(icon); }
      icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');
      icon.innerHTML=toolIcons[kind];button.dataset.v16IconKind=kind;
    }
    // Keep the existing caption node: the original modal enhancer updates it.
  }

  function panelFor(dialog) {
    return dialog.id === 'fullOptionStudentDialog' ? dialog.querySelector('.full-option-student-panel') : dialog;
  }
  function ensure(dialog) {
    const panel = panelFor(dialog);
    if (!panel) return null;
    let entry = entries.get(dialog);
    if (!entry || !entry.footer.isConnected) {
      if (entry) {
        resizer.unobserve(entry.footer);
        entry.records.forEach(record=>resizer.unobserve(record.element));
      }
      entry = {dialog,panel,footer:null,strip:null,actions:null,navigation:null,expandHost:null,returnButton:null,moreButton:null,moreArticle:null,records:new Map()};
      entries.set(dialog,entry); live.add(dialog);
    }
    const custom = panel.querySelector(':scope > [data-classroom-footer]:not(.classroom-tools-generated)');
    if (!entry.footer || (custom && custom !== entry.footer)) {
      const old = entry.footer;
      const footer = custom || document.createElement('footer');
      footer.classList.add('classroom-modal-tools');
      footer.setAttribute('data-classroom-footer','');
      if (!custom) { footer.classList.add('classroom-tools-generated'); panel.append(footer); }
      let actions = footer.querySelector('[data-classroom-actions-host]');
      let navigation = footer.querySelector('[data-classroom-navigation-host]');
      if (!actions) { actions=document.createElement('div'); actions.setAttribute('data-classroom-actions-host',''); footer.append(actions); }
      if (!navigation) { navigation=document.createElement('div'); navigation.setAttribute('data-classroom-navigation-host',''); footer.append(navigation); }
      actions.classList.add('classroom-modal-actions'); navigation.classList.add('classroom-modal-navigation');
      // Keep the fullscreen/close group visible while longer teaching tools
      // share one horizontal strip. Existing controls retain their listeners.
      let strip=footer.querySelector(':scope > .classroom-modal-toolstrip');
      if (!strip) { strip=document.createElement('div');strip.className='classroom-modal-toolstrip';footer.append(strip); }
      strip.append(actions,navigation);
      let expandHost=footer.querySelector(':scope > .classroom-modal-expand-host');
      if (!expandHost) { expandHost=document.createElement('div'); expandHost.className='classroom-modal-expand-host'; footer.append(expandHost); }
      entry.footer=footer; entry.strip=strip; entry.actions=actions; entry.navigation=navigation; entry.expandHost=expandHost;
      if (!entry.returnButton || !entry.returnButton.isConnected) {
        // Reuse the student-list's original footer close so fullscreen has one close action.
        const nativeClose=dialog.id==='fullOptionStudentDialog'
          ? panel.querySelector(':scope > footer:not([data-classroom-footer]) [data-full-option-students-close]') : null;
        const back=nativeClose || document.createElement('button');back.type='button';back.classList.add('classroom-modal-back');back.hidden=!nativeClose;
        if (!nativeClose) {
          const originalIcon=document.querySelector('#returnToLecture [data-icon]')?.innerHTML;
          back.innerHTML='<span data-icon="return-lecture">'+(originalIcon || '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 3 11l6 6M3 11h11a6 6 0 0 0 6-6V3"/></svg>')+'</span><span>返回</span>';
          back.addEventListener('click',event=>{
            event.stopPropagation();
            const close=entry.panel.querySelector('[data-close-resource-popover],[data-word-detail-close],[data-lexical-chunk-close],[data-full-option-students-close]');
            if (close) close.click();
            else if (dialog.id === 'fullOptionStudentDialog') closeFullOptionStudentDialog();
            else dialog.querySelector('.ke-modal-expand')?.click();
          });
        }
        back.setAttribute('aria-label','返回上一层');back.title='返回上一层';
        entry.returnButton=back;
      }
      if (entry.returnButton.parentElement !== expandHost) expandHost.prepend(entry.returnButton);
      // A replaced custom footer can already contain an earlier generated
      // close. Keep the current bound action and remove only stale copies.
      expandHost.querySelectorAll(':scope > .classroom-modal-back').forEach(button=>{
        if (button !== entry.returnButton) button.remove();
      });
      resizer.observe(footer);
      if (old && old !== footer) {
        [...old.querySelectorAll('[data-classroom-actions-host] > *')].forEach(node=>actions.append(node));
        [...old.querySelectorAll('[data-classroom-navigation-host] > *')].forEach(node=>navigation.append(node));
        if (old.classList.contains('classroom-tools-generated')) { resizer.unobserve(old); old.remove(); }
      }
    }
    // A native student-list close or a replaced custom footer uses the same
    // exit wording while retaining its original close listener.
    if (entry.returnButton) {
      const back=entry.returnButton;
      let caption=back.querySelector(':scope > span:not([data-icon])');
      if (!caption) {
        [...back.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).forEach(node=>node.remove());
        caption=document.createElement('span');back.append(caption);
      }
      if (caption.textContent!=='返回') caption.textContent='返回';
      if (back.getAttribute('aria-label')!=='返回上一层') back.setAttribute('aria-label','返回上一层');
      if (back.title!=='返回上一层') back.title='返回上一层';
    }
    if (dialog.dataset.classroomToolsSide !== side()) dialog.dataset.classroomToolsSide=side();
    if (active() && !dialog.classList.contains('classroom-tools-dialog')) dialog.classList.add('classroom-tools-dialog');
    else if (!active() && dialog.classList.contains('classroom-tools-dialog')) dialog.classList.remove('classroom-tools-dialog');
    window.V12105Popup?.mountDock(entry);
    return entry;
  }
  function syncWordPOSLayout(entry) {
    if (window.V1223WordDock?.isMounted(entry.dialog)) return;
    const pos=entry.actions.querySelector('.vwn-pos-tabs');
    const meanings=entry.navigation.querySelector('[data-word-module="meanings"]');
    const diagramPOS=[...entry.actions.querySelectorAll('.vpi-pos-tabs')].find(node=>!node.closest('[hidden],.hidden') && node.querySelectorAll('[data-pgi-page]').length>1);
    const meaningsPOS=pos && !pos.hidden && pos.querySelectorAll('[data-vwn-pos]').length>2
      && meanings?.getAttribute('aria-selected')==='true';
    const latestSubnav=[...entry.actions.querySelectorAll('.v1220-secondary-tabs')].find(node=>!node.closest('[hidden],.hidden') && node.querySelectorAll('button').length>1);
    const stacked=entry.dialog.id==='wordDetailDialog' && (meaningsPOS || diagramPOS || latestSubnav);
    let stack=entry.strip.querySelector(':scope > .classroom-word-pos-stack');
    if (stacked) {
      if (!stack) {
        stack=document.createElement('div');stack.className='classroom-word-pos-stack';
        entry.strip.append(stack);stack.append(entry.actions,entry.navigation);
        // Both levels scroll together, keeping the POS group above meanings.
        entry.strip.scrollLeft=0;
        // A newly reparented custom nav settles after this frame. Measure the
        // module anchor again before keeping the subtab's final horizontal offset.
        schedule();
      }
      if (!entry.footer.classList.contains('classroom-word-pos-above')) entry.footer.classList.add('classroom-word-pos-above');
      const subnavFor=latestSubnav ? latestSubnav.dataset.v1220SubnavFor : (meaningsPOS ? 'meanings' : 'illustrations');
      if (entry.footer.dataset.classroomSubnavFor!==subnavFor) entry.footer.dataset.classroomSubnavFor=subnavFor;
    } else {
      if (stack) { entry.strip.append(entry.actions,entry.navigation);stack.remove(); }
      if (entry.footer.classList.contains('classroom-word-pos-above')) entry.footer.classList.remove('classroom-word-pos-above');
      if (entry.footer.hasAttribute('data-classroom-subnav-for')) delete entry.footer.dataset.classroomSubnavFor;
      if (entry.actions.style.getPropertyValue('--classroom-subnav-offset')) entry.actions.style.removeProperty('--classroom-subnav-offset');
    }
  }
  function visibleMoreEntries(entry) {
    // Resolve the current article on each refresh/click: collection paging
    // replaces the mother-popup content, so an old word's callback is never held.
    return [...entry.panel.querySelectorAll('.ke-word-more')].filter(button=>{
      if (button.closest('[hidden],.hidden,[inert],[aria-hidden="true"]')) return false;
      const style=getComputedStyle(button),rect=button.getBoundingClientRect();
      return style.display!=='none' && style.visibility!=='hidden' && rect.width>0 && rect.height>0;
    });
  }
  function currentMoreEntry(entry) {
    const buttons=visibleMoreEntries(entry);
    return buttons.find(button=>entry.moreArticle?.isConnected && entry.moreArticle.contains(button)) || buttons[0] || null;
  }
  function syncMoreEntry(entry) {
    // Keep the original in-body "更多单词详情" entry. The duplicated
    // bottom-toolbar "更多" control was explicitly removed in the meeting.
    entry.moreButton?.remove();
    entry.moreButton=null;
  }
  function sourceOwner(dialog,element,kind) {
    if (element.classroomMediaOwner) return element.classroomMediaOwner;
    if (kind === 'expand' || element.matches('[data-classroom-actions-host],[data-classroom-navigation-host]')) return null;
    const article = element.closest('.resource-popover-page > article');
    if (article) return article;
    if (element.matches('.resource-popover-pager')) return element.parentElement.querySelector(':scope > article') || null;
    return element.closest('.resource-popover-body,.ke-grammar-interactive') || null;
  }
  function attach(dialog,element,kind='actions') {
    if (typeof dialog === 'string') dialog=document.getElementById(dialog);
    if (!dialog || !element || !dialogIds.includes(dialog.id)) return element;
    if(element.closest('[data-v1266-inline-tools]'))return element;
    if (window.V1223WordDock?.isMounted(dialog) && ['word-navigation','word-tools'].includes(kind)) return element;
    const entry=ensure(dialog); if (!entry) return element;
    const navigation=kind.includes('navigation');
    const host=entry.sideActions && !navigation ? entry.sideActions : kind === 'expand' || kind === 'all' || kind === 'image-expand' || kind === 'media-play' || kind === 'topic-direction' ? entry.expandHost : navigation ? entry.navigation : entry.actions;
    if (element === host || element === entry.footer) return element;
    if (entry.records.has(element)) return element;
    const owner=sourceOwner(dialog,element,kind);
    const retained=kind === 'grammar' || kind === 'expand' || kind === 'all';
    const record={element,owner,kind,slot:null};
    if (retained) {
      const slot=document.createElement('div'); slot.className='classroom-tools-reservation';
      slot.dataset.classroomToolKind=kind; host.append(slot); record.slot=slot;
      element.classList.add('classroom-tools-floating');
      if (kind === 'expand') {
        // The original modal enhancer recognizes a direct child and will not
        // create another fullscreen button after a MutationObserver refresh.
        entry.panel.append(element);
      }
      // Grammar and all-show controls keep their original ancestors and event
      // delegation. Their real nodes occupy the footer slots without reparenting.
    } else if (element.parentElement !== host) {
      if(kind==='topic-direction' && entry.returnButton?.parentElement===host)entry.returnButton.after(element);else host.append(element);
    }
    if (element.dataset.classroomToolKind !== kind) element.dataset.classroomToolKind=kind;
    entry.records.set(element,record); if (retained) resizer.observe(element); schedule(); return element;
  }
  function detach(dialog,element) {
    const entry=entries.get(dialog),record=entry?.records.get(element);
    if(record){record.slot?.remove();resizer.unobserve(element);entry.records.delete(element);}
    element?.classList.remove('classroom-tools-floating','classroom-tools-all');
    element?.removeAttribute('data-classroom-tool-kind');
    return element;
  }
  function cleanup(entry) {
    entry.records.forEach((record,element)=>{
      if (!element.isConnected || (record.owner && !record.owner.isConnected)) {
        record.slot?.remove(); resizer.unobserve(element); if (element.isConnected) element.remove(); entry.records.delete(element);
      }
    });
  }
  function scan(dialog) {
    if (!active() || !visible(dialog)) {
      if (dialog.classList.contains('classroom-tools-dialog')) dialog.classList.remove('classroom-tools-dialog');
      return;
    }
    const entry=ensure(dialog); cleanup(entry);
    syncToolMetrics(entry.panel);
    dialog.querySelectorAll('[data-resource-page-prev]').forEach(button=>iconTool(button,'上一条','previous'));
    dialog.querySelectorAll('[data-resource-page-next]').forEach(button=>iconTool(button,'下一条','next'));
    dialog.querySelectorAll('.resource-image-fullscreen,[data-resource-image-fullscreen]').forEach(button=>{
      const imageExpanded=document.fullscreenElement===button.closest('.resource-image-frame');
      iconTool(button,imageExpanded?'退出图片全屏':'全屏查看图片',imageExpanded?'collapse':'expand');
    });

    dialog.querySelectorAll('.ke-modal-expand').forEach(element=>attach(dialog,element,'expand'));
    (dialog.id === 'popover' ? [] : dialog.querySelectorAll('[data-resource-image-fullscreen]')).forEach(element=>{
      if (entry.records.has(element)) return;
      const frame=element.closest('.resource-image-frame');
      if (!frame) return;
      element.classroomImageFrame=frame;
      element.classList.add('classroom-image-expand');
      const label=element.querySelector('span');
      if (label) label.textContent='配图全屏';
      element.addEventListener('click',event=>{
        event.preventDefault();event.stopImmediatePropagation();
        if(document.fullscreenElement === frame) { document.exitFullscreen?.();return; }
        resourceImageFullscreenActive=true;
        const request=frame.requestFullscreen || frame.webkitRequestFullscreen;
        if(request) Promise.resolve(request.call(frame)).catch(()=>{ resourceImageFullscreenActive=false; });
      },true);
      attach(dialog,element,'image-expand');
    });
    dialog.querySelectorAll('.resource-popover-pager').forEach(element=>attach(dialog,element,'pager-navigation'));
    dialog.querySelectorAll('.ke-topic-frozen-toolbar').forEach(element=>attach(dialog,element,'topic-actions'));
    dialog.querySelectorAll('.ke-g-toolbar').forEach(element=>attach(dialog,element,'grammar'));
    dialog.querySelectorAll('.vwn-main-nav').forEach(element=>attach(dialog,element,'word-navigation'));
    dialog.querySelectorAll('.vwn-secondary-tools').forEach(element=>attach(dialog,element,'word-tools'));
    // Footer close is an existing action; the right-upper close stays untouched.
    if (dialog.id === 'fullOptionStudentDialog') {
      const footer=entry.panel.querySelector(':scope > footer:not([data-classroom-footer])');
      if (footer && footer.childElementCount) attach(dialog,footer,'actions');
      else if (footer) footer.hidden=true;
    }
    syncWordPOSLayout(entry);
    syncMoreEntry(entry);
    syncAllTools(entry);
  }
  // Keep each all-show button under the original module's event delegate. Only
  // the active module gets a footer reservation beside fullscreen (or exit in
  // a word detail). Switching modules/pages can replace the original node.
  function syncAllTools(entry) {
    entry.panel.querySelectorAll('.ke-g-all,[data-pgi-all],[data-topic-all],[data-tc-all]').forEach(button=>attach(entry.dialog,button,'all'));
    const activeAll=[];
    entry.records.forEach(record=>{
      if(record.kind!=='all' || !record.element.isConnected)return;
      const {element,slot}=record;
      const inWordDock=window.V1223WordDock?.routeAllSlot?.(entry.dialog,element,slot)===true;
      const shown=!(inWordDock&&entry.dialog.classList.contains('v1223-word-dock-collapsed'))&&!element.closest('[hidden],.hidden,[inert],[aria-hidden="true"]')
        && getComputedStyle(element).display!=='none' && element.getClientRects().length>0;
      if(slot.hidden===shown)slot.hidden=!shown;
      if(shown&&!inWordDock)activeAll.push(slot);
      if(!element.classList.contains('classroom-tools-all'))element.classList.add('classroom-tools-all');
      // Keep the original state and event delegate; display the confirmed
      // text toggle using the original toolbar typography.
      const revealed=element.getAttribute('aria-pressed')==='true';
      const label=revealed ? '全部隐藏' : '全部展示';
      element.classList.remove('v16-icon-tool');
      element.querySelector(':scope > svg')?.remove();
      [...element.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).forEach(node=>node.remove());
      let caption=element.querySelector(':scope > span');
      if(!caption){caption=document.createElement('span');element.append(caption);}
      if(caption.textContent!==label)caption.textContent=label;
      if(element.getAttribute('aria-label')!==label)element.setAttribute('aria-label',label);
      if(element.title!==label)element.title=label;
    });
    if(entry.sideActions){activeAll.forEach(slot=>{if(slot.parentElement!==entry.sideActions)entry.sideActions.append(slot);});return;}
    const fullscreen=[...entry.expandHost.children].find(node=>node.dataset.classroomToolKind==='expand' && !node.hidden);
    let previous=entry.expandHost.querySelector(':scope > .tc-directions') || fullscreen || entry.returnButton;
    activeAll.forEach(slot=>{
      if(previous && previous.nextElementSibling!==slot)previous.after(slot);
      previous=slot;
    });
  }
  function followAnimations(entry) {
    let running = false;
    const animations = [...(entry.dialog.getAnimations?.() || []),
      ...(entry.panel !== entry.dialog ? entry.panel.getAnimations?.() || [] : [])];
    animations.forEach(animation => {
      if (animation.playState !== 'running' && !animation.pending) return;
      running = true;
      if (!watchedAnimations.has(animation)) {
        watchedAnimations.add(animation);
        // Transform animations do not resize the layout box. Always measure
        // again after finish/cancel, even when ResizeObserver stays silent.
        animation.finished.then(schedule, schedule);
      }
    });
    if (running) schedule();
  }
  function controlShown(element,entry) {
    if(!element?.isConnected)return false;
    // The empty-footer rule itself must not prevent the next resource from
    // restoring its real controls. Check their own state and source ancestors.
    for(let node=element;node && node!==entry.panel;node=node.parentElement){
      if(node===entry.footer)continue;
      if(node.hidden || node.inert || node.classList.contains('hidden') || node.getAttribute('aria-hidden')==='true')return false;
      const style=getComputedStyle(node);
      if(style.display==='none' || style.visibility==='hidden' || style.visibility==='collapse')return false;
    }
    return true;
  }
  function syncEmptyFooter(entry) {
    // Ordinary knowledge cards do not reserve a toolbar row without real
    // controls. Fullscreen return/navigation and detail-dialog tools retain
    // their existing footer; disabled pager buttons still count as controls.
    const applicable=entry.dialog.id==='popover' && !entry.dialog.classList.contains('ke-expanded');
    let hasControl=false;
    if(applicable){
      const selector='button,[role="button"],input:not([type="hidden"]),select,textarea,a[href],[role="link"]';
      const candidates=element=>[...(element.matches(selector)?[element]:[]),...element.querySelectorAll(selector)];
      hasControl=candidates(entry.footer).some(element=>controlShown(element,entry));
      if(!hasControl)entry.records.forEach(record=>{
        if(hasControl || !record.element.isConnected || (record.owner && !controlShown(record.owner,entry)) || (record.slot && !controlShown(record.slot,entry)))return;
        hasControl=candidates(record.element).some(element=>controlShown(element,entry));
      });
    }
    const empty=applicable && !hasControl;
    if(empty && entry.footer.dataset.classroomToolsEmpty!=='true'){entry.footer.dataset.classroomToolsEmpty='true';schedule();}
    else if(!empty && entry.footer.hasAttribute('data-classroom-tools-empty')){delete entry.footer.dataset.classroomToolsEmpty;schedule();}
  }
  function syncPopupFunctions(entry){
    if(entry.dialog.id!=='popover'||!entry.sideDock)return;
    const excluded=new Set(['expand','image-expand','media-play','pager-navigation']);
    let has=false;
    entry.records.forEach(record=>{
      if(has||excluded.has(record.kind)||!record.element.isConnected)return;
      if(record.owner&&!controlShown(record.owner,entry))return;
      const element=record.element,selector='button,input,select,[role="button"]';
      const candidates=[...(element.matches(selector)?[element]:[]),...element.querySelectorAll(selector)];
      has=candidates.some(control=>{
        for(let node=control;node&&node!==entry.panel;node=node.parentElement){
          // A collapsed/previously empty dock does not change the source module's capabilities.
          if(node===entry.sideDock||node.matches('.v105-dock-body'))continue;
          if(node.hidden||node.inert||node.classList.contains('hidden')||node.getAttribute('aria-hidden')==='true')return false;
          if(getComputedStyle(node).display==='none')return false;
        }
        return true;
      });
    });
    const value=String(has);if(entry.dialog.dataset.v109HasTools!==value)entry.dialog.dataset.v109HasTools=value;
    if(entry.sideDock.hidden===has)entry.sideDock.hidden=!has;
    const footer=entry.panel.querySelector(':scope > .classroom-modal-tools');
    if(footer)entry.panel.style.setProperty('--v109-popup-footer',Math.max(0,footer.getBoundingClientRect().height)+'px');
  }
  function position(entry) {
    if (!active() || !visible(entry.dialog) || !entry.footer.isConnected) return;
    if (entry.dialog.dataset.classroomToolsSide !== side()) entry.dialog.dataset.classroomToolsSide=side();
    syncPopupFunctions(entry);
    window.V12105Popup?.syncDock(entry);
    window.V15LectureMedia?.refresh();
    followAnimations(entry);
    const expanded=entry.dialog.classList.contains('ke-expanded');
    const showClose=expanded || entry.dialog.classList.contains('v1263-interactive-fullscreen');
    if (entry.returnButton.hidden === showClose) entry.returnButton.hidden=!showClose;
    const rect=entry.panel.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    if (entry.footer.classList.contains('classroom-word-pos-above')) {
      const module=entry.navigation.querySelector(`[data-word-module="${entry.footer.dataset.classroomSubnavFor}"]`);
      const nav=entry.navigation.matches('.vwn-main-nav') ? entry.navigation : entry.navigation.querySelector('.vwn-main-nav');
      if (module && nav) {
        const moduleRect=module.getBoundingClientRect(),navRect=nav.getBoundingClientRect();
        const offset=side()==='right' ? navRect.right-moduleRect.right : moduleRect.left-navRect.left;
        setStyle(entry.actions,'--classroom-subnav-offset',Math.max(0,offset)+'px');
      }
    }
    const panelStyle=getComputedStyle(entry.panel);
    const transformed=panelStyle.transform !== 'none';
    const scaleX=transformed ? rect.width / Math.max(1,entry.panel.offsetWidth) : 1;
    const scaleY=transformed ? rect.height / Math.max(1,entry.panel.offsetHeight) : 1;
    const borderLeft=transformed ? parseFloat(panelStyle.borderLeftWidth)||0 : 0;
    const borderTop=transformed ? parseFloat(panelStyle.borderTopWidth)||0 : 0;
    entry.records.forEach(({element,slot,kind})=>{
      if(kind === 'image-expand'){
        const imageExpanded=document.fullscreenElement === element.classroomImageFrame;
        const label=imageExpanded ? '退出配图全屏' : '配图全屏';
        iconTool(element,label,imageExpanded?'collapse':'expand');
        const caption=element.querySelector('span');
        if(caption && caption.textContent !== label) caption.textContent=label;
        element.setAttribute('aria-label',label);
      }
      if (!slot || !element.isConnected) return;
      if(kind==='all'){
        if(slot.hidden)return;
        setStyle(slot,'width',Math.ceil(element.offsetWidth || element.scrollWidth || 74)+'px');
        setStyle(slot,'height',Math.ceil(element.offsetHeight || 40)+'px');
      }
      if(kind==='grammar'){
        const roles=element.querySelector('.ke-g-buttons');
        const ideal=Math.max(80,roles?.scrollWidth||0);
        setStyle(slot,'--classroom-grammar-width',Math.min(Math.max(80,rect.width-220),ideal)+'px');
      }
      if (kind === 'expand') {
        const expanded=entry.dialog.classList.contains('ke-expanded');
        const hiddenExit=expanded && wordDetailIds.has(entry.dialog.id);
        if (element.hidden!==hiddenExit) element.hidden=hiddenExit;
        if (slot.hidden!==hiddenExit) slot.hidden=hiddenExit;
        if (hiddenExit) return;
        iconTool(element,expanded ? '退出弹框全屏' : '全屏查看弹框',expanded?'collapse':'expand');
        const label=expanded ? '退出全屏' : '全屏查看';
        const caption=element.querySelector('span');
        if (caption && caption.textContent !== label) caption.textContent=label;
        const pressed=String(expanded);
        if (element.getAttribute('aria-pressed') !== pressed) element.setAttribute('aria-pressed',pressed);
        const aria=expanded ? '退出弹框全屏' : '全屏查看弹框';
        if (element.getAttribute('aria-label') !== aria) element.setAttribute('aria-label',aria);
        setStyle(slot,'width',Math.ceil(element.offsetWidth || 112)+'px');
        setStyle(slot,'height',Math.ceil(element.offsetHeight || 36)+'px');
      }
      const target=slot.getBoundingClientRect();
      if (!target.width) return;
      setStyle(element,'--classroom-tool-left',((target.left-(transformed?rect.left:0))/scaleX-borderLeft)+'px');
      const centeredTop=target.top+(target.height-element.offsetHeight*scaleY)/2;
      setStyle(element,'--classroom-tool-top',((centeredTop-(transformed?rect.top:0))/scaleY-borderTop)+'px');
      setStyle(element,'--classroom-tool-width',(target.width/scaleX)+'px');
      if (kind === 'grammar') {setStyle(slot,'height',Math.ceil(element.offsetHeight)+'px');setStyle(slot,'--v105-tool-height',Math.ceil(element.offsetHeight)+'px');}
    });
    syncEmptyFooter(entry);
    const header=entry.panel.querySelector(':scope > .resource-popover-head,:scope > header');
    const limit=parseFloat(getComputedStyle(entry.panel).maxHeight) || innerHeight-24;
    const budget=Math.max(60,limit-(header?.getBoundingClientRect().height||0)-entry.footer.getBoundingClientRect().height-4);
    setStyle(entry.panel,'--classroom-body-budget',budget+'px');
  }
  function update() {
    frame=0;
    // Only teaching dialogs are adapted. Main dock, picker, swap and settings
    // retain the original V1.2.11 nodes, layout and listeners.
    syncToolMetrics(page);
    dialogIds.forEach(id=>{ const dialog=document.getElementById(id); if(dialog) scan(dialog); });
    live.forEach(dialog=>{ if (!dialog.isConnected) live.delete(dialog); else {const entry=entries.get(dialog);if(entry)position(entry);} });
    document.querySelectorAll('.v15-video-screen-tools').forEach(syncToolMetrics);
  }
  function schedule() { if (!frame) frame=requestAnimationFrame(update); }
  const resizer=typeof ResizeObserver==='function' ? new ResizeObserver(schedule) : {observe(){},unobserve(){}};
  const observer=new MutationObserver(records=>{
    if (records.some(record=>record.type==='childList' || (record.type==='attributes' && !['style','data-classroom-tools-side','data-classroom-tool-kind'].includes(record.attributeName)))) schedule();
  });
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','data-knowledge-type']});

  // Word and lexical-chunk details stay in their default expanded view.
  // Window capture runs before the older document handler which shrinks a modal.
  window.addEventListener('keydown',event=>{
    if (event.key!=='Escape' || !active() || document.querySelector('.v1278-guide-dialog[open],.sgp-backdrop:not([hidden]),#wordDetailDialog.v1263-interactive-fullscreen')) return;
    if (document.fullscreenElement?.matches('video,.resource-image-frame,.v15-video-player')) return;
    const detail=['lexicalChunkDialog','wordDetailDialog'].map(id=>document.getElementById(id)).find(visible);
    if (!detail) return;
    const close=detail.querySelector('[data-lexical-chunk-close],[data-word-detail-close]');
    if (!close) return;
    event.preventDefault();event.stopImmediatePropagation();close.click();
  },true);
  window.addEventListener('resize',schedule);
  window.addEventListener('load',schedule,true);
  document.addEventListener('fullscreenchange',schedule);
  document.addEventListener('scroll',schedule,true);
  document.fonts?.addEventListener('loadingdone',schedule);
  window.ClassroomTools={attach,detach,refresh:schedule};
  schedule();
})();
