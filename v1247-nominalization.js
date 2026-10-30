/* V47: reveal the noun-to-verb reasoning in order, with the original PPT art.
 * This adapter owns only the added snake source example and its all-show action. */
(() => {
  'use strict';
  const api = window.V1220WordDetail;
  if (!api?.finish || window.V1247Nominalization) return;
  const models = new WeakMap();
  const watched = new WeakSet();
  const text = value => String(value ?? '');
  const escape = value => text(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const captions = ['第 1 步 · 观察名词含义', '第 2 步 · 找到动作特征', '第 3 步 · 得出动词含义'];
  const nextCaptions = ['下一步：推导动作', '下一步：揭示动词', '已完成推导'];
  function stageFor(stage, action) {
    const current = Math.max(0, Math.min(2, Number(stage) || 0));
    if (action === 'previous') return Math.max(0, current - 1);
    if (action === 'next') return Math.min(2, current + 1);
    if (action === 'reset') return 0;
    if (action === 'all') return current === 2 ? 0 : 2;
    return current;
  }
  function markup(nounImage, verbImage, source) {
    return `<div class="pgi-scene v1247-reasoning-scene">
      <div class="v1247-reasoning-grid" aria-label="snake 从名词到动词的推导">
        <figure class="v1247-reasoning-noun" data-v1247-reason-step="noun">
          <img src="${escape(nounImage)}" alt="蛇的名词静态图" decoding="async">
          <figcaption class="v1247-conversion-label"><i class="pgi-source-red">n.</i> 蛇</figcaption>
        </figure>
        <button type="button" class="v1247-reasoning-bridge" data-v1247-reason-action="next" aria-label="显示动作推导" aria-expanded="false">
          <span class="v1247-reasoning-question" data-v1247-bridge-prompt>它怎样运动？</span>
          <span class="v1247-reasoning-bridge-copy" data-v1247-bridge-reveal hidden>${escape(source.derivation || '像“蛇”一样运动')}</span>
          <svg class="v1247-reasoning-arrow" data-v1247-bridge-arrow hidden viewBox="0 0 240 48" aria-hidden="true" focusable="false"><path d="M8 24H226M201 5L228 24L201 43"/></svg>
        </button>
        <figure class="v1247-reasoning-result" data-v1247-reason-step="verb">
          <button type="button" class="v1247-reasoning-result-prompt" data-v1247-reason-action="result" disabled aria-label="先完成动作推导"><span aria-hidden="true">?</span><span>动词含义待推导</span></button>
          <div class="v1247-reasoning-result-copy" data-v1247-result-reveal hidden>
            <img data-v1247-source-src="${escape(verbImage)}" alt="原稿中表示蛇行、蜿蜒前进的动图" decoding="async">
            <p class="v1247-conversion-label"><i class="pgi-source-red">v.</i> 蛇行；蜿蜒前进</p>
          </div>
        </figure>
      </div>
      <div class="vpi-tools v1247-reasoning-controls" aria-label="名词动化推导步骤">
        <button type="button" data-v1247-reason-action="previous" disabled>上一步</button>
        <button type="button" data-v1247-reason-action="next" data-v1247-next-step>${nextCaptions[0]}</button>
      </div>
    </div>`;
  }
  function syncAllButton(model) {
    const all = model.all;
    if (!all) return;
    const label = model.stage === 2 ? '全部隐藏' : '全部展示';
    const caption = all.querySelector(':scope > span');
    if (caption) caption.textContent = label;
    else all.textContent = label;
    all.setAttribute('aria-pressed', String(model.stage === 2));
    all.setAttribute('aria-label', label);
    all.title = label;
  }
  function setStage(model, nextStage) {
    const {module} = model;
    const previous = model.stage;
    model.stage = Math.max(0, Math.min(2, nextStage));
    const bridgeShown = model.stage >= 1;
    const resultShown = model.stage === 2;
    module.dataset.v1247ReasoningStage = String(model.stage);
    module.dataset.v1247ReasoningDirection = model.stage > previous ? 'forward' : 'backward';
    module.querySelector('[data-v1247-bridge-prompt]').hidden = bridgeShown;
    module.querySelector('[data-v1247-bridge-reveal]').hidden = !bridgeShown;
    module.querySelector('[data-v1247-bridge-arrow]').toggleAttribute('hidden', !bridgeShown);
    const bridge = module.querySelector('.v1247-reasoning-bridge');
    bridge.setAttribute('aria-expanded', String(bridgeShown));
    bridge.setAttribute('aria-label', model.stage === 0 ? '显示动作推导' : model.stage === 1 ? '继续推导动词含义' : '已完成动作推导');
    bridge.disabled = resultShown;
    const placeholder = module.querySelector('.v1247-reasoning-result-prompt');
    placeholder.hidden = resultShown;
    placeholder.disabled = !bridgeShown;
    placeholder.setAttribute('aria-label', bridgeShown ? '显示动词结果' : '先完成动作推导');
    module.querySelector('[data-v1247-result-reveal]').hidden = !resultShown;
    const image = module.querySelector('[data-v1247-source-src]');
    // Loading the unchanged GIF at the result step also starts its visual clue
    // with the reveal; the motion must not give away the answer at stage zero.
    if (resultShown && !image.hasAttribute('src')) image.src = image.dataset.v1247SourceSrc;
    if (!resultShown && image.hasAttribute('src')) image.removeAttribute('src');
    model.controls.querySelector('[data-v1247-reason-action="previous"]').disabled = model.stage === 0;
    model.controls.querySelector('[data-v1247-next-step]').disabled = resultShown;
    model.controls.querySelector('[data-v1247-next-step]').textContent = nextCaptions[model.stage];
    syncAllButton(model);
    window.V1223WordDock?.refresh?.(model.detail);
  }
  function syncFooter(model) {
    const {detail,module,controls}=model;
    if(!module.isConnected){controls.remove();return;}
    if(model.inlineCard){
      if(controls.parentElement!==module)module.append(controls);
      if(controls.hidden)controls.hidden=false;
      return;
    }
    const selected=detail.querySelector('[data-word-module][aria-selected="true"]');
    const active=selected?.dataset.wordModule==='nominalization'&&!module.closest('[hidden],.hidden');
    if(controls.hidden===active)controls.hidden=!active;
    if(!controls.isConnected || module.contains(controls))window.ClassroomTools?.attach?.(detail,controls,'topic-direction');
  }
  function mount(detail) {
    const module = detail?.querySelector('.v1246-nominalization[data-graph-key="snake"]');
    if (!module || models.has(module)) return;
    const source = window.V1246PeerModules?.source;
    const originals = [...module.querySelectorAll('img')];
    const nounImage = originals[0]?.getAttribute('src') || source?.assets?.find(asset => asset.role === 'noun')?.url;
    const verbImage = originals[1]?.getAttribute('src') || source?.assets?.find(asset => asset.role === 'verb')?.url;
    if (!nounImage || !verbImage) return;
    const all = detail.querySelector('.vpi-tools[data-v1220-subnav-for="nominalization"] [data-pgi-all]');
    module.classList.add('v1247-nominalization');
    module.innerHTML = markup(nounImage, verbImage, source || {});
    const controls=module.querySelector('.v1247-reasoning-controls');
    const model = {detail, module, all, controls, stage: 0};
    models.set(module, model);
    const activate=event => {
      const action = event.target.closest('[data-v1247-reason-action]');
      if (!action || (!module.contains(action)&&!controls.contains(action)) || action.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      const kind = action.dataset.v1247ReasonAction;
      setStage(model, kind === 'result' ? Math.max(model.stage, 2) : stageFor(model.stage, kind));
    };
    module.addEventListener('click',activate);
    controls.addEventListener('click',activate);
    if (all) {
      const sourceTools=all.closest('.vpi-tools');
      all.dataset.v1247NominalizationAll = 'true';
      // This source button has a direct listener below. Retire only the old
      // generic floating-slot marker before the first classroom-tools scan;
      // moving the very same node keeps both its existing listeners and state.
      all.removeAttribute('data-pgi-all');
      all.classList.remove('classroom-tools-floating','classroom-tools-all','v1241-sidebar-all');
      controls.append(all);
      if(sourceTools&&!sourceTools.children.length)sourceTools.remove();
      // V46 has a direct bubble listener holding detached answer fields.
      // Keep the existing button/dock slot, but intercept only this button's
      // native click before that obsolete handler can alter its own state.
      all.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        setStage(model, stageFor(model.stage, 'all'));
      }, true);
    }
    controls.classroomMediaOwner=module;
    controls.hidden=true;
    syncFooter(model);
    if(!watched.has(detail)){
      watched.add(detail);
      let pending=false;
      const observer=new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;const current=detail.querySelector('.v1247-nominalization');const activeModel=current&&models.get(current);if(activeModel)syncFooter(activeModel);});});
      observer.observe(detail,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','aria-selected']});
    }
    setStage(model, 0);
  }
  const finish = api.finish;
  api.finish = function(detail, result) {
    const value = finish.apply(this, arguments);
    if (result?.word) mount(detail);
    return value;
  };
  const blockedKeyTarget = 'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="slider"],video,audio';
  function visible(element) {
    if (!element || element.closest('.hidden,[hidden],[inert],[aria-hidden="true"]')) return false;
    const style = getComputedStyle(element), rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && style.visibility !== 'collapse' && rect.width > 0 && rect.height > 0;
  }
  function topDialog() {
    return [...document.querySelectorAll('[role="dialog"],[aria-modal="true"],#popover')].filter(visible).sort((a, b) => {
      if (a.contains(b)) return -1;
      if (b.contains(a)) return 1;
      const order = (parseInt(getComputedStyle(a).zIndex, 10) || 0) - (parseInt(getComputedStyle(b).zIndex, 10) || 0);
      return order || (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    }).at(-1) || null;
  }
  function activeKeyModel(event) {
    if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return null;
    const target = event.target instanceof Element ? event.target : document.activeElement;
    if (target?.closest(blockedKeyTarget)) return null;
    const detail = document.getElementById('wordDetailDialog');
    if (!visible(detail) || topDialog() !== detail || !visible(document.getElementById('fullscreenPage'))) return null;
    const owner = target?.closest('[role="dialog"],[aria-modal="true"],#popover');
    if (owner && owner !== detail) return null;
    const module = detail.querySelector('.v1247-nominalization');
    const model = module && models.get(module);
    if (!model || !visible(module)) return null;
    const selected=detail.querySelector('[data-word-module][aria-selected="true"]')?.dataset.wordModule;
    // Inline reasoning only owns keys while focus is inside its own card.
    if(model.inlineCard ? selected!=='meanings' || !model.inlineCard.contains(target) : selected!=='nominalization')return null;
    const fullscreen = document.fullscreenElement;
    if (fullscreen && (fullscreen.matches('video,.v15-video-player,.resource-image-frame') || fullscreen.closest('.resource-image-frame') || !fullscreen.contains(detail))) return null;
    if ([...document.querySelectorAll('.v15-video-fallback')].some(visible)) return null;
    return model;
  }
  // Window capture precedes the document pager and question navigation. Consume
  // boundary keys too, so one key can affect only this three-stage derivation.
  window.addEventListener('keydown', event => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    const model = activeKeyModel(event);
    if (!model) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setStage(model, stageFor(model.stage, event.key === 'ArrowDown' ? 'next' : 'previous'));
  }, true);
  window.V1247Nominalization = {mount, stageFor, embed(detail,card) {
    const module=card?.querySelector('.v1247-nominalization'),model=module&&models.get(module);
    if(!model)return false;
    model.inlineCard=card;model.controls.removeAttribute('data-classroom-tool-kind');
    syncFooter(model);return true;
  }, inspect(detail = document.getElementById('wordDetailDialog')) {
    const module = detail?.querySelector('.v1247-nominalization');
    const model = module && models.get(module);
    if (!model) return null;
    const visible = selector => !module.querySelector(selector)?.hidden;
    return {sourceHead: module.dataset.graphKey, sourceSlide: module.dataset.sourceSlide,
      stage: model.stage, status: captions[model.stage],
      bridgeRevealed: visible('[data-v1247-bridge-reveal]'), resultRevealed: visible('[data-v1247-result-reveal]'),
      resultImageLoaded: module.querySelector('[data-v1247-source-src]').hasAttribute('src'),
      allPressed: model.all?.getAttribute('aria-pressed') || null,
      previousDisabled: model.controls.querySelector('[data-v1247-reason-action="previous"]').disabled,
      nextDisabled: model.controls.querySelector('[data-v1247-next-step]').disabled,
      sourceImages: [module.querySelector('.v1247-reasoning-noun img').getAttribute('src'), module.querySelector('[data-v1247-source-src]').dataset.v1247SourceSrc]};
  }};
  mount(document.getElementById('wordDetailDialog'));
})();
