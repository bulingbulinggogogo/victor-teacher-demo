/* V1.2.81: preserve original reveal Set and step API; reveal each column derivation then meaning. */
/* Original PPT copy and ZIP artwork: source emphasis and diagrams above restrained artwork. */
(() => {
  'use strict';
  const data = window.V1213_PPT_SOURCE;
  if (!data) return;
  const esc = value => escapeHtml(String(value ?? ''));
  const mounted = new Set();
  const measure = document.createElement('canvas').getContext('2d');
  // Presentation copy is kept local to the renderer; supplied dictionary and
  // PPT data files are unchanged, including the source's spelling anomalies.
  const sourceTitles = {
    14: '2.2 动作丨hit、beat、strike',
    27: '合成词——deep-fry',
    32: '习语——come to light 暴露',
    37: '一词一义——ground n 渣滓；沉淀物'
  };
  let sequence = 0;
  // Only explicit red PPT runs are marked red. Orange source headings are not red runs.
  // Slide 6 uses C00000 for the formation glosses; slide 14 uses FF0000.
  function sourceCopy(text, slide, kind = '') {
    if (Number(slide) !== 14) return esc(text);
    if (kind === 'contrast-heading') return `<span class="pgi-source-red" data-pgi-source-red="FF0000">${esc(text)}</span>`;
    if (kind === 'contrast-example') {
      const needle = /^He beat /.test(text) ? 'beat' : /^The ball hit /.test(text) ? 'hit' : / had been struck /.test(text) ? 'struck' : '';
      if (needle) {
        const index = text.indexOf(needle);
        return esc(text.slice(0, index)) + `<span class="pgi-source-red" data-pgi-source-red="FF0000">${esc(needle)}</span>` + esc(text.slice(index + needle.length));
      }
    }
    return esc(text);
  }
  function sourceEntry(options) {
    if (![options?.item, options?.context?.word].some(row => row?.bookKey === data.bookKey)) return null;
    const id = Number(options.context?.word?.id || options.entry?.word_id || options.item?.wordId || 0);
    const heads = [options.entry?.word, options.context?.word?.word, options.item?.word].filter(Boolean).map(value => String(value).trim().toLowerCase());
    return Object.entries(data.entries || {}).find(([, entry]) => entry.wordIds.length
      ? entry.wordIds.includes(id)
      : entry.sourceHeads.some(head => heads.includes(head))) || null;
  }
  function branchMarkup(count, width, centers) {
    const xs = centers || Array.from({ length: count }, (_, index) => width * (index + .5) / count);
    const children = xs.map(x => `M ${x} 12 V 24 M ${x - 4} 18 L ${x} 24 L ${x + 4} 18`).join(' ');
    return `<svg class="pgi-branches" viewBox="0 0 ${width} 24" preserveAspectRatio="none" aria-hidden="true"><path d="M ${width / 2} 0 V 12 M ${xs[0]} 12 H ${xs.at(-1)} ${children}"/></svg>`;
  }
  function baseMarkup(entry, page, key) {
    const source = entry.polysemy;
    const image = `<img src="${esc(source.basicImage)}" alt="${esc(key)}基本义" decoding="async"/>`;
    const root = `<p>${source.formation?.length ? '' : esc(key)+' '+esc(page.pos)+'<br>'}基本义：${esc(source.basicMeaning)}</p>`;
    const basicNode = `<div class="pgi-basic-node">${image}${root}</div>`;
    if (!source.formation?.length) return `<div class="pgi-base">${basicNode}</div>`;
    const boxes = source.formation.map((row, index) => `<div class="pgi-formation-box" data-pgi-source-shape="${20 + index}"><strong>${esc(row.form)}</strong><span class="pgi-source-red" data-pgi-source-red="C00000">${esc(row.meaning)}</span></div>`);
    const formation = `<div class="pgi-present-root"><div class="pgi-formation-row">${boxes[0]}<span class="pgi-formation-operator" aria-label="加">＋</span>${boxes[1]}<span class="pgi-formation-operator" aria-label="推导为">→</span>${boxes[2]}</div><svg class="pgi-formation-result-arrow" viewBox="0 0 1000 24" preserveAspectRatio="none" aria-label="使在前面推导出基本义呈上"><path d="M 868 0 V 12 H 500 V 24 M 495 18 L 500 24 L 505 18"/></svg></div>`;
    return `<div class="pgi-base is-present">${formation}${basicNode}</div>`;
  }
  function copyMarkup(token, text, label, className = '') {
    return `<button type="button" class="pgi-copy pgi-copy-mask is-hidden ${className}" data-pgi-copy="${esc(token)}" data-pgi-label="${esc(label)}" aria-pressed="false" aria-label="显示${esc(label)}"><span>${esc(text)}</span></button>`;
  }
  function staticCopy(text, className = '') {
    return `<div class="pgi-copy pgi-static-copy ${className}"><span>${esc(text)}</span></div>`;
  }
  function currentTokens(module) {
    if (module.kind !== 'polysemy') return [];
    return module.entry.polysemy.pages[module.page].branches.flatMap((branch, index) => ['derivation','meaning'].filter(kind => !module.displaySettings || module.displaySettings[kind].show).map(kind => `${module.page}:${index}:${kind}`));
  }
  function fit(module) {
    if (!module.element.isConnected) return;
    const host = module.element.querySelector('.pgi-scene-slot'), scene = host?.querySelector('.pgi-scene');
    if (!host?.clientWidth || !host.clientHeight || !scene) return;
    const style = getComputedStyle(scene);
    const lectureScale = parseFloat(style.getPropertyValue('--full-dialog-scale')) || 1.5;
    // In word details, readable source copy uses the same live font setting as
    // the general resource popup body. Columns wrap instead of shrinking text.
    if (module.element.closest('#wordDetailDialog,#lexicalChunkDialog')) {
      const bodyFont = 24 * lectureScale;
      module.element.style.setProperty('--pgi-title-font', bodyFont + 'px');
      scene.style.setProperty('--pgi-base-font', bodyFont + 'px');
      scene.style.setProperty('--pgi-copy-font', bodyFont + 'px');
      host.dataset.fitScale = '1';
      const visuals = [...scene.querySelectorAll('.pgi-visual-row img,.pgi-single-image,.pgi-contrast-grid img')];
      // A single common height preserves each original aspect ratio. Column
      // widths follow the artwork; every image (including the basic node) uses
      // that same height, rather than letterboxing unlike pictures in equal boxes.
      const ratios = visuals.map(image => image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : 4 / 3);
      const gap = module.kind === 'contrast' ? 24 : 12;
      const available = Math.max(1, host.clientWidth - gap * Math.max(0, visuals.length - 1));
      const imageHeight = Math.min(200, available / Math.max(1, ratios.reduce((sum, ratio) => sum + ratio, 0)));
      module.element.style.setProperty('--v1226-diagram-image-height', imageHeight.toFixed(3) + 'px');
      if (module.kind === 'polysemy') {
        const count = ratios.length;
        const spare = Math.max(0, available - imageHeight * ratios.reduce((sum, ratio) => sum + ratio, 0));
        const columns = ratios.map(ratio => imageHeight * ratio + spare / count);
        scene.style.setProperty('--pgi-columns', columns.map(width => width.toFixed(3) + 'px').join(' '));
        let left = 0;
        const centers = columns.map(width => { const center = left + width / 2; left += width + gap; return center; });
        scene.querySelector('.pgi-connectors').innerHTML = branchMarkup(count, host.clientWidth, centers);
      } else if (module.kind === 'contrast') {
        const spare = Math.max(0, available - imageHeight * ratios.reduce((sum, ratio) => sum + ratio, 0));
        scene.querySelector('.pgi-contrast-grid').style.gridTemplateColumns = ratios.map(ratio => (imageHeight * ratio + spare / ratios.length).toFixed(3) + 'px').join(' ');
      }
      host.dataset.copyFont = bodyFont.toFixed(3);
      host.dataset.requestedCopyFont = bodyFont.toFixed(3);
      host.dataset.copyLimited = 'false';
      host.dataset.visualHeight = (scene.querySelector('.pgi-visual-row img,.pgi-single-image,.pgi-contrast-grid img')?.getBoundingClientRect().height || 0).toFixed(3);
      host.dataset.layoutOverflow = String(host.scrollWidth > host.clientWidth + 1);
      return;
    }
    const desired = 30 * lectureScale / 1.5;
    module.element.style.setProperty('--pgi-title-font', desired + 'px');
    scene.style.setProperty('--pgi-base-font', desired + 'px');
    scene.style.setProperty('--pgi-copy-font', desired + 'px');
    host.dataset.fitScale = '1';
    let fitted = desired;
    if (module.kind === 'polysemy') {
      const page = module.entry.polysemy.pages[module.page], count = page.branches.length, gap = 12, padding = 18;
      measure.font = `400 ${desired}px ${style.fontFamily}`;
      const widths = page.branches.map(branch => Math.max(measure.measureText(branch.meaning).width, measure.measureText(branch.derivation).width));
      const available = host.clientWidth - gap * (count - 1) - padding * count;
      fitted = Math.min(desired, desired * available / widths.reduce((sum, width) => sum + width, 0));
      // All diagram copy shares this fitted size, including the basic meaning and formation glosses.
      scene.style.setProperty('--pgi-copy-font', fitted.toFixed(3) + 'px');
      const raw = widths.map(width => width * fitted / desired + padding);
      const extra = Math.max(0, host.clientWidth - gap * (count - 1) - raw.reduce((sum, width) => sum + width, 0));
      const columns = raw.map(width => width + extra / count);
      scene.style.setProperty('--pgi-columns', columns.map(width => width.toFixed(3) + 'px').join(' '));
      let left = 0;
      const centers = columns.map(width => { const center = left + width / 2; left += width + gap; return center; });
      scene.querySelector('.pgi-connectors').innerHTML = branchMarkup(count, host.clientWidth, centers);
      // Reconstruct the V18 image band at the same viewport. The new upper tab row
      // removes 48 px from this scene for diagrams with multiple types; restore it
      // only in the reference calculation, then use exactly half the old band.
      const footer = module.tools.closest('.classroom-modal-tools');
      const footerDelta = footer?.classList.contains('classroom-word-pos-above') ? Math.max(0, footer.getBoundingClientRect().height - 57) : 0;
      const legacyHostHeight = host.getBoundingClientRect().height + (page && module.entry.polysemy.pages.length > 1 ? footerDelta : 0);
      const legacyBaseHeight = Math.max(64, Math.min(90, legacyHostHeight * .18));
      scene.style.setProperty('--pgi-base-image-height', Math.max(80, Math.min(120, desired * 3.4)).toFixed(3) + 'px');
      const copyHeight = [...scene.querySelectorAll('.pgi-copy-row')].reduce((sum, row) => sum + row.getBoundingClientRect().height + 8, 0);
      const legacyImageHeight = Math.max(48, legacyHostHeight - legacyBaseHeight - 24 - copyHeight);
      const requestedImageHeight = legacyImageHeight / 2;
      const availableImageHeight = Math.max(24, host.clientHeight - scene.querySelector('.pgi-base').getBoundingClientRect().height - 24 - copyHeight - 8);
      const imageHeight = Math.min(requestedImageHeight, availableImageHeight);
      scene.style.setProperty('--pgi-image-height', imageHeight.toFixed(3) + 'px');
      host.dataset.referenceImageHeight = legacyImageHeight.toFixed(3);
      host.dataset.requestedImageHeight = requestedImageHeight.toFixed(3);
      host.dataset.imageHeightLimited = String(imageHeight + 1 < requestedImageHeight);
    } else {
      const copies = [...scene.querySelectorAll('.pgi-copy')];
      // Single diagrams and contrast retain all original rows. Fit their copy directly, never the scene.
      copies.forEach(copy => {
        const lines = [...copy.querySelectorAll('[data-pgi-line]')];
        const texts = lines.length ? lines.filter(line=>!line.classList.contains('pgi-wrap-line')).map(line => line.textContent) : [copy.textContent];
        measure.font = `400 ${desired}px ${getComputedStyle(copy).fontFamily}`;
        const widest = Math.max(...texts.map(text => measure.measureText(text).width), 1);
        fitted = Math.min(fitted, desired * Math.max(1, copy.clientWidth - 16) / widest);
      });
      const maxLines = Math.max(1, ...copies.map(copy => Math.max(1, copy.querySelectorAll('[data-pgi-line]').length)));
      const copyRows = module.kind === 'single' ? copies.length : 1;
      const heightBound = (host.clientHeight - 100 - 32) / Math.max(1, maxLines * copyRows * 1.35);
      fitted = Math.max(1, Math.min(fitted, heightBound));
      scene.style.setProperty('--pgi-copy-font', fitted.toFixed(3) + 'px');
      const copiesHeight = [...scene.querySelectorAll('.pgi-copy')].reduce((sum, copy) => module.kind === 'single' ? sum + copy.getBoundingClientRect().height : Math.max(sum, copy.getBoundingClientRect().height), 0);
      const legacyImageHeight = Math.max(24, host.getBoundingClientRect().height - copiesHeight - (module.kind === 'single' ? copies.length * 12 : 10));
      scene.style.setProperty('--pgi-image-height', (legacyImageHeight / 2).toFixed(3) + 'px');
      host.dataset.referenceImageHeight = legacyImageHeight.toFixed(3);
      host.dataset.requestedImageHeight = (legacyImageHeight / 2).toFixed(3);
      host.dataset.imageHeightLimited = 'false';
    }
    host.dataset.copyFont = fitted.toFixed(3);
    host.dataset.requestedCopyFont = desired.toFixed(3);
    host.dataset.copyLimited = fitted + .02 < desired ? 'true' : 'false';
    host.dataset.visualHeight = (scene.querySelector('.pgi-visual-row img')?.getBoundingClientRect().height || scene.querySelector('.pgi-single-image')?.getBoundingClientRect().height || 0).toFixed(3);
    const bounds = host.getBoundingClientRect();
    const overflow = [...scene.querySelectorAll('img,.pgi-copy,.pgi-base,.pgi-card-label')].some(node => {
      const box = node.getBoundingClientRect();
      return box.left < bounds.left - 1 || box.right > bounds.right + 1 || box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1 || (node.matches('.pgi-copy') && node.scrollWidth > node.clientWidth + 1);
    });
    host.dataset.layoutOverflow = String(overflow);
  }
  function sync(module) {
    if(module.displaySettings){for(const kind of ['derivation','meaning']){const row=module.element.querySelector('[data-pgi-row="'+kind+'"]');if(row)row.hidden=!module.displaySettings[kind].show;}const images=module.element.querySelector('.pgi-visual-row');if(images)images.hidden=!module.displaySettings.images;}
    module.element.querySelectorAll('[data-pgi-copy]').forEach(copy => {
      const setting=module.displaySettings?.[copy.dataset.pgiCopy.split(':').at(-1)];
      const visible = module.reveals.has(copy.dataset.pgiCopy);
      copy.disabled=false;
      copy.dataset.v1297Maskable='true';
      copy.classList.toggle('is-hidden', !visible);
      copy.setAttribute('aria-pressed', String(visible));
      copy.setAttribute('aria-label', `${visible ? '隐藏' : '显示'}${copy.dataset.pgiLabel}`);
      copy.querySelector('span').setAttribute('aria-hidden', String(!visible));
    });
    module.tools.querySelectorAll('[data-pgi-page]').forEach(button => button.setAttribute('aria-selected', String(Number(button.dataset.pgiPage) === module.page)));
    const all = module.tools.querySelector('[data-pgi-all]');
    if (all) {
      const tokens = currentTokens(module), visible = tokens.length > 0 && tokens.every(token => module.reveals.has(token));
      all.textContent = visible ? '全部隐藏' : '全部展示';
      all.setAttribute('aria-pressed', String(visible));
    }
  }
  function render(module) {
    const { entry, key, kind } = module, scene = module.element.querySelector('.pgi-scene');
    const page = kind === 'polysemy' ? entry.polysemy.pages[module.page] : null;
    module.element.dataset.sourceSlide=String(page?.sourceSlide || entry[kind]?.sourceSlide || entry.single?.sourceSlide || '');
    scene.className = `pgi-scene pgi-scene-${kind}`;
    module.tools.replaceChildren();
    if (kind === 'single') {
      const source = entry.single;
      // The sidebar-matching module title sits outside the scene. The single
      // meaning slide's word/POS/meaning remains ordinary body content.
      const singleMeaningCopy = source.kind === 'single-meaning'
        ? source.title.replace(/^一词一义\s*[—－-]+\s*/, '').replace(/\bground n(?=\s)/, 'ground n.') : '';
      scene.innerHTML = `${singleMeaningCopy ? `<p class="pgi-single-body-copy">${esc(singleMeaningCopy)}</p>` : ''}${source.formula ? staticCopy(source.formula) : ''}${source.caption ? staticCopy(source.caption) : ''}<img class="pgi-single-image" src="${esc(source.image)}" alt="${esc(source.title)}" decoding="async"/>`;
    } else if (kind === 'contrast') {
      scene.innerHTML = `<div class="pgi-contrast-grid">${entry.contrast.columns.map(column => `<article class="pgi-card"><div class="pgi-copy pgi-static-copy"><span>${[`${column.word} ${column.pos} ${column.meaning}`, column.note, column.english, column.translation].map((line,index) => `<span data-pgi-line${index===2?' class="pgi-wrap-line"':''}>${sourceCopy(line, entry.contrast.sourceSlide, index === 0 ? 'contrast-heading' : index === 2 ? 'contrast-example' : '')}</span>`).join('')}</span></div><img src="${esc(column.image)}" alt="${esc(column.canonicalWord || column.word)}图解" decoding="async"/></article>`).join('')}</div>`;
    } else {
      scene.innerHTML = `${baseMarkup(entry, page, key)}<div class="pgi-connectors"></div><div class="pgi-copy-row pgi-row" data-pgi-row="meaning">${page.branches.map((branch, index) => copyMarkup(`${module.page}:${index}:meaning`, branch.meaning, `第${index + 1}个义项释义`)).join('')}</div><div class="pgi-copy-row pgi-row" data-pgi-row="derivation">${page.branches.map((branch, index) => copyMarkup(`${module.page}:${index}:derivation`, branch.derivation, `第${index + 1}个义项推导`, 'pgi-derivation')).join('')}</div><div class="pgi-visual-row pgi-row">${page.branches.map(branch => `<article class="pgi-card"><img src="${esc(branch.image)}" alt="${esc(branch.meaning)}图解" decoding="async"/></article>`).join('')}</div>`;
      const pages = entry.polysemy.pages.length > 1 ? `<div class="vpi-pos-tabs" role="tablist" aria-label="图示词性">${entry.polysemy.pages.map((candidate, index) => `<button type="button" role="tab" data-pgi-page="${index}" aria-selected="${index === module.page}">${esc(candidate.pos)} 图示</button>`).join('')}</div>` : '';
      module.tools.innerHTML = `${pages}<button type="button" data-pgi-all="toggle">全部展示</button>`;
    }
    sync(module);
    scene.querySelectorAll('img').forEach(image => image.addEventListener('load', () => fit(module), { once: true }));
    requestAnimationFrame(() => fit(module));
    document.fonts?.ready.then(() => fit(module));
  }
  function toggle(module, token) {
    const setting=module.displaySettings?.[token.split(':').at(-1)];if(setting&&!setting.show)return;
    module.reveals.has(token) ? module.reveals.delete(token) : module.reveals.add(token);
    sync(module);
  }
  function create(options) {
    const match = sourceEntry(options); if (!match) return [];
    const [key, entry] = match;
    const singleTitle = {formation:'构词点拨',idiom:'习语','single-meaning':'一词一义'};
    // A formation slide and its latest explanation belong to the same tab.
    // The shared module ID lets navigation keep both the original artwork and copy.
    const singleId = entry.single?.kind === 'formation' ? 'formation' : 'illustrations';
    const kinds = [entry.polysemy && ['illustrations', '一词多义', 'polysemy'], entry.contrast && ['contrast', '辨析', 'contrast'], entry.single && [singleId, singleTitle[entry.single.kind] || '一词一义', 'single']].filter(Boolean);
    return kinds.map(([id, title, kind]) => {
      const element = document.createElement('section'); element.className = 'pgi-module vpi-module'; element.dataset.graphKey = key; element.dataset.graphKind = kind;
      const slide = kind==='single' ? entry.single.sourceSlide : kind==='contrast' ? entry.contrast.sourceSlide : entry.polysemy.pages[0].sourceSlide;
      element.dataset.sourceSlide=String(slide);
      const standaloneTitle = kind === 'single' && ['formation','single-meaning','idiom'].includes(entry.single.kind);
      const omitSourceTitle = standaloneTitle || (key === 'hit' && kind === 'contrast' && Number(slide) === 14);
      element.innerHTML = `${omitSourceTitle ? '' : `<header class="pgi-module-head"><h3>${esc(sourceTitles[slide] || title+' · '+key)}</h3></header>`}<div class="pgi-scene-slot"><div class="pgi-scene"></div></div>`;
      const tools = document.createElement('div'); tools.className = 'vpi-tools';
      const module = { id: ++sequence, key, entry, kind, element, tools, page: 0, reveals: new Set() };
      element.addEventListener('click', event => { const copy = event.target.closest('[data-pgi-copy]'); if (copy) toggle(module, copy.dataset.pgiCopy); });
      tools.addEventListener('click', event => {
        const button = event.target.closest('button'); if (!button) return;
        if (button.dataset.pgiPage !== undefined) { module.page = Number(button.dataset.pgiPage); render(module); }
        else if (button.dataset.pgiAll) {
          const tokens = currentTokens(module), hide = tokens.every(token => module.reveals.has(token));
          tokens.forEach(token => hide ? module.reveals.delete(token) : module.reveals.add(token));
          sync(module);
        }
        window.WordDetailNavigation?.fit?.();
      });
      module.observer = new ResizeObserver(() => fit(module)); module.observer.observe(element); mounted.add(module);
      render(module);
      return { id, title, content: element, tools, visual: true, source: entry, refresh: () => fit(module) };
    });
  }
  function fitAll() { mounted.forEach(module => { if (!module.element.isConnected) { module.observer.disconnect(); mounted.delete(module); } else fit(module); }); }
  function step(root, direction) {
    const module = [...mounted].find(candidate => candidate.kind === 'polysemy' && candidate.element.isConnected && root?.contains(candidate.element) && candidate.element.getBoundingClientRect().height > 0 && getComputedStyle(candidate.element).visibility !== 'hidden');
    if (!module) return false;
    const tokens = currentTokens(module);
    const token = direction > 0 ? tokens.find(value => !module.reveals.has(value)) : tokens.slice().reverse().find(value => module.reveals.has(value));
    if (token) {
      direction > 0 ? module.reveals.add(token) : module.reveals.delete(token);
      sync(module);
    }
    return true;
  }
  window.addEventListener('resize', fitAll); document.addEventListener('fullscreenchange', fitAll);
  document.fonts?.addEventListener('loadingdone', fitAll);
  function configure(root, settings) {
    if(!settings || (!settings.derivation.show&&!settings.meaning.show&&!settings.images))return false;
    let found=false;mounted.forEach(module=>{if(module.kind!=='polysemy'||!root?.contains(module.element))return;module.displaySettings={derivation:{...settings.derivation},meaning:{...settings.meaning},images:settings.images};module.reveals.clear();module.entry.polysemy.pages.forEach((page,pageIndex)=>page.branches.forEach((branch,index)=>['derivation','meaning'].forEach(kind=>{if(settings[kind].show&&!settings[kind].mask)module.reveals.add(`${pageIndex}:${index}:${kind}`);})));sync(module);found=true;});fitAll();return found;
  }
  function toggleRow(root,kind){
    if(!['derivation','meaning','images'].includes(kind))return false;
    const module=[...mounted].find(m=>m.kind==='polysemy'&&(m.element===root||root?.contains(m.element)));if(!module)return false;
    if(!module.displaySettings)module.displaySettings={derivation:{show:true,mask:true},meaning:{show:true,mask:true},images:true};
    if(kind==='images')module.displaySettings.images=!module.displaySettings.images;else module.displaySettings[kind].show=!module.displaySettings[kind].show;
    sync(module);fit(module);return true;
  }
  window.V1213Illustrations = { create, sourceEntry, fit: fitAll, branchMarkup, step, configure, toggleRow };
})();
