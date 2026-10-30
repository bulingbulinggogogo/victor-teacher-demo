/* V1.2.80 semantic-network presentation adapter.
 * Live source nodes, media, source metadata and V1213/V1247 reveal ownership remain intact. */
(() => {
  'use strict';
  const api = window.V1213Illustrations;
  if (!api?.create || window.V1279SemanticNetwork) return;
  const models = new WeakMap(), live = new Set();
  let frame = 0;
  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      live.forEach(model => {
        if (model.module.isConnected) { model.connected = true; decorate(model); refreshLinks(model); }
        else if (model.connected) { model.observer.disconnect(); model.resize.disconnect(); live.delete(model); }
      });
    });
  }
  // Wrap only existing text nodes. The source copy, reveal token and outer span
  // (which owns aria-hidden) retain their original identity and behavior.
  function emphasize(node, needle, className) {
    if (!node || !needle || node.querySelector('.' + className)) return;
    const walker = document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
    const targets = [];
    for (let child = walker.nextNode(); child; child = walker.nextNode()) if (child.textContent.includes(needle)) targets.push(child);
    targets.forEach(child => {
      const parts = child.textContent.split(needle), fragment = document.createDocumentFragment();
      parts.forEach((part,index) => {
        if (index) { const strong = document.createElement('strong'); strong.className = className; strong.textContent = needle; fragment.append(strong); }
        fragment.append(document.createTextNode(part));
      });
      child.replaceWith(fragment);
    });
  }
  function observe(model) { model.observer.observe(model.scene,{childList:true}); }
  function decorate(model) {
    const {module,scene} = model;
    model.observer.disconnect();
    try {
      if (!module.hasAttribute('data-v1279-semantic-network')) module.dataset.v1279SemanticNetwork = 'true';
      // The three formation boxes belong to 构词解析; the semantic network starts
      // with the existing basic-meaning image and its original caption.
      scene.querySelector('.pgi-present-root')?.remove();
      const basic = scene.querySelector('.pgi-basic-node>p');
      emphasize(basic,model.basicMeaning,'v1279-basic-meaning');
      const derivation = scene.querySelector('[data-pgi-row="derivation"]'), meaning = scene.querySelector('[data-pgi-row="meaning"]');
      if (derivation && meaning && (meaning.compareDocumentPosition(derivation) & Node.DOCUMENT_POSITION_FOLLOWING)) scene.insertBefore(derivation,meaning);
      derivation?.querySelectorAll('.pgi-copy>span').forEach(copy => emphasize(copy,'呈上','v1279-derivation-key'));
    } finally { observe(model); }
  }
  function refreshLinks(model) {
    const {module,scene} = model;
    if (!module.isConnected) return;
    const connector = scene.querySelector('.pgi-connectors'), row = [...scene.querySelectorAll('.pgi-copy-row,.pgi-visual-row')].find(node=>!node.hidden&&node.getBoundingClientRect().height>0);
    if (!connector || !row || !row.children.length) return;
    const bounds = connector.getBoundingClientRect(), width = bounds.width, height = bounds.height;
    if (width < 1 || !row.getBoundingClientRect().height) return;
    const centers = [...row.children].map(node => { const box = node.getBoundingClientRect(); return Math.max(0,Math.min(width,box.left + box.width / 2 - bounds.left)); });
    const left = Math.min(...centers), right = Math.max(...centers), middle = height / 2;
    const arrow = Math.min(6,height * .09);
    const number = value => value.toFixed(2);
    const branches = centers.map(x => 'M ' + number(x) + ' ' + number(middle) + ' V ' + number(height) + ' M ' + number(x - arrow) + ' ' + number(height - arrow) + ' L ' + number(x) + ' ' + number(height) + ' L ' + number(x + arrow) + ' ' + number(height - arrow)).join(' ');
    // The horizontal bar terminates at the outer branch centers. The longer
    // upper/lower stems belong to the measured connector box at every scale.
    const path = 'M ' + number(left) + ' ' + number(middle) + ' H ' + number(right) + ' ' + branches;
    const current = connector.querySelector('svg[data-v1279-network-links] path');
    if (current?.getAttribute('d') === path && connector.firstElementChild.getAttribute('viewBox') === '0 0 ' + number(width) + ' ' + number(height)) return;
    const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns,'svg'), line = document.createElementNS(ns,'path');
    svg.classList.add('pgi-branches'); svg.dataset.v1279NetworkLinks = 'true';
    svg.setAttribute('viewBox','0 0 ' + number(width) + ' ' + number(height)); svg.setAttribute('preserveAspectRatio','none'); svg.setAttribute('aria-hidden','true');
    line.setAttribute('d',path); svg.append(line); connector.replaceChildren(svg);
    module.dataset.v1279BranchCount = String(centers.length);
  }
  function mount(row) {
    const module = row?.content;
    if (!module?.matches('.pgi-module[data-graph-kind="polysemy"]') || models.has(module)) return row;
    const scene = module.querySelector('.pgi-scene'); if (!scene) return row;
    const model = {module,scene,basicMeaning:String(row.source?.polysemy?.basicMeaning || ''),connected:false,observer:null,resize:null};
    // This observer watches scene replacement only. It does not watch nested
    // connector writes or attribute changes, so refreshing cannot feed itself.
    model.observer = new MutationObserver(schedule);
    model.resize = new ResizeObserver(schedule); model.resize.observe(module);
    models.set(module,model); live.add(model); decorate(model);
    module.addEventListener('load',schedule,true);
    const refresh = row.refresh;
    row.refresh = function() { const value = refresh?.apply(this,arguments); schedule(); return value; };
    schedule(); return row;
  }
  const create = api.create;
  api.create = function() { return (create.apply(this,arguments) || []).map(mount); };
  const fit = api.fit;
  api.fit = function() { const value = fit?.apply(this,arguments); schedule(); return value; };
  const finish = window.V1220WordDetail?.finish;
  if (finish) window.V1220WordDetail.finish = function() { const value = finish.apply(this,arguments); schedule(); return value; };
  window.addEventListener('resize',schedule); document.addEventListener('fullscreenchange',schedule);
  document.fonts?.addEventListener('loadingdone',schedule);
  document.querySelectorAll('.pgi-module[data-graph-kind="polysemy"]').forEach(module => mount({content:module,source:window.V1213_PPT_SOURCE?.entries?.[module.dataset.graphKey]}));
  window.V1279SemanticNetwork = Object.freeze({refresh:schedule,inspect(root=document.getElementById('wordDetailDialog')) {
    return [...(root?.querySelectorAll('[data-v1279-semantic-network]') || [])].map(module => ({
      head:module.dataset.graphKey,sourceSlide:module.dataset.sourceSlide,
      formationBoxes:module.querySelectorAll('.pgi-formation-box').length,
      rows:[...module.querySelectorAll('[data-pgi-row]')].map(row => row.dataset.pgiRow),
      branchCount:Number(module.dataset.v1279BranchCount || 0),
      emphasizedDerivations:module.querySelectorAll('.v1279-derivation-key').length,
      basicMeaning:module.querySelector('.v1279-basic-meaning')?.textContent || '',
      hiddenCopies:module.querySelectorAll('[data-pgi-copy].is-hidden').length,
      images:[...module.querySelectorAll('img')].map(image => image.getAttribute('src'))
    }));
  }});
})();
