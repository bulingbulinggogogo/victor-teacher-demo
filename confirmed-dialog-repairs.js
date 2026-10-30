/* Preserve the test text column; larger fonts and media request added space. */
(() => {
  'use strict';
  let frame = 0;
  const targets = ['popover', 'wordDetailDialog', 'lexicalChunkDialog'];
  const shown = element => element && !element.classList.contains('hidden') && !element.hidden && getComputedStyle(element).display !== 'none';
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
  const number = value => Number.parseFloat(value) || 0;
  function setProperty(element, key, value) {
    if (element.style.getPropertyValue(key) !== value) element.style.setProperty(key, value);
  }
  function textWidth(text, style) {
    if (!ctx) return text.length * (number(style.fontSize) || 24) * .6;
    ctx.font = style.font || `${style.fontWeight || '400'} ${style.fontSize} ${style.fontFamily}`;
    return Math.max(...text.split('\n').map(line => ctx.measureText(line).width), 0);
  }
  function measureText(element) { return textWidth(element.textContent, getComputedStyle(element)); }
  function horizontalEdges(element) {
    if (!element) return 0;
    const style = getComputedStyle(element);
    return ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'].reduce((sum, key) => sum + number(style[key]), 0);
  }
  // Measure inline fragments in their own fonts, independent of current wrapping.
  // Only compact controls/definition rows are measured; prose remains free to wrap.
  function inlineWidth(element) {
    if (!element) return 0;
    const style = getComputedStyle(element);
    if (style.display === 'none' || element.hidden) return 0;
    const parts = [...element.childNodes].map(node => {
      if (node.nodeType === 3) {
        const text = node.textContent.replace(/\s+/g, ' ');
        return text.trim() ? textWidth(text, style) : 0;
      }
      return node.nodeType === 1 ? inlineWidth(node) : 0;
    }).filter(width => width > 0);
    const rows = style.display === 'grid' || element.classList.contains('resource-sense-list');
    const content = rows ? Math.max(...parts, 0) : parts.reduce((sum, width) => sum + width, 0) + Math.max(0, parts.length - 1) * number(style.columnGap || style.gap);
    return Math.max(content + horizontalEdges(element), number(style.minWidth));
  }
  function scaledTextWidth(dialog, originalWidth) {
    // At lecture font 50 the test dialog scale is 1.5625; never shrink its base.
    const scale = number(getComputedStyle(dialog).getPropertyValue('--full-dialog-scale')) || 1.5625;
    return (originalWidth - 58) * Math.max(1, scale / 1.5625) + 58;
  }
  function wordTextWidth(dialog) {
    const body = dialog.querySelector('.resource-popover-body');
    const bodyEdges = horizontalEdges(body) + horizontalEdges(dialog) + 16;
    let width = scaledTextWidth(dialog, 1040);
    dialog.querySelectorAll('.resource-current-summary').forEach(summary => {
      const style = getComputedStyle(summary);
      const copy = summary.querySelector('.resource-current-copy');
      const action = summary.querySelector('.ke-word-more');
      if (!copy || !action) return;
      let currentWidth;
      if (summary.classList.contains('has-part-pronunciations')) {
        const line = copy.querySelector('.resource-sense-list,.resource-sense-line');
        const heading = copy.querySelector('.resource-sense-heading');
        currentWidth = Math.max(inlineWidth(line) + number(style.columnGap) + inlineWidth(action), inlineWidth(heading));
      } else {
        currentWidth = inlineWidth(copy) + number(style.columnGap) + inlineWidth(action);
      }
      width = Math.max(width, Math.ceil(currentWidth + horizontalEdges(summary) + horizontalEdges(summary.parentElement) + bodyEdges + 2));
    });
    dialog.querySelectorAll('.knowledge-term,.resource-pronunciations').forEach(row => {
      width = Math.max(width, Math.ceil(inlineWidth(row) + bodyEdges + 2));
    });
    return width;
  }
  function grammarTextWidth(dialog) {
    const body = dialog.querySelector('.resource-popover-body');
    const edges = horizontalEdges(body) + horizontalEdges(dialog) + 18;
    let requested = 640;
    const head = dialog.querySelector(':scope>.resource-popover-head');
    if (head) requested = Math.max(requested, inlineWidth(head) + 40);
    dialog.querySelectorAll('.ke-grammar-pair').forEach(pair => {
      const source = pair.querySelector('.ke-grammar-source');
      const diagram = pair.querySelector('.ke-g-diagram');
      const translation = pair.querySelector('.ke-grammar-translation');
      const original = diagram?.closest('[data-grammar-sentence]')?.dataset.grammarSentence;
      const englishWidth = source ? measureText(source)
        : diagram && original ? textWidth(original, getComputedStyle(diagram)) + Math.max(28, number(getComputedStyle(diagram).getPropertyValue("--ke-g-gutter"))) : 0;
      requested = Math.max(requested, Math.ceil(Math.max(englishWidth, translation ? measureText(translation) : 0) + edges));
    });
    // Match the same-font encyclopedia text + 520px media + 32px gap budget.
    const maximum = scaledTextWidth(dialog, 1008) + 520 + 32;
    return Math.min(requested, maximum);
  }
  function resize(dialog) {
    if (!shown(dialog)) return;
    if (dialog.id === 'popover' && dialog.classList.contains('v1246-adaptive-knowledge') && !dialog.classList.contains('ke-expanded')) return;
    // These two kinds now use the extracted test-site WikiDialog CSS directly.
    // Do not reintroduce the older text-measurement or media-height sizing pass.
    if (dialog.id === "popover" && ["微技能", "百科知识"].includes(dialog.dataset.knowledgeType)) return;
    dialog.querySelectorAll('[data-grammar-type]').forEach(element => window.GrammarRolePalette?.apply(element, element.dataset.grammarType));
    const expanded = dialog.classList.contains('ke-expanded');
    const outerGap = expanded || innerWidth <= 720 ? 24 : 64;
    const available = Math.max(0, innerWidth - outerGap);
    const media = dialog.querySelector('.resource-media-panel');
    const vocabulary = Boolean(dialog.querySelector('.ke-vocabulary')) || dialog.classList.contains('ke-word-detail');
    let width = 640, mediaWidth = 0, layout = '';
    if (dialog.classList.contains('ke-grammar-modal')) {
      // English and Chinese each seek one line, within the Wiki/viewport cap.
      width = grammarTextWidth(dialog);
    } else if (dialog.classList.contains('ke-wiki-modal')) {
      const baseWidth = scaledTextWidth(dialog, 1008);
      mediaWidth = media ? number(getComputedStyle(media).getPropertyValue('--ke-media-width')) || (dialog.classList.contains('ke-encyclopedia-modal') ? 520 : 400) : 0;
      const mediaOnly = dialog.classList.contains('ke-media-only');
      const combined = baseWidth + (mediaWidth ? mediaWidth + 32 : 0);
      layout = mediaWidth ? mediaOnly || available >= combined ? 'side' : 'stack' : '';
      width = mediaOnly ? mediaWidth + 58 : layout === 'side' ? combined : baseWidth;
    } else if (vocabulary) {
      const baseWidth = wordTextWidth(dialog);
      mediaWidth = media ? 380 : 0;
      const combined = baseWidth + (mediaWidth ? mediaWidth + 28 : 0);
      layout = mediaWidth ? available >= combined ? 'side' : 'stack' : '';
      width = layout === 'side' ? combined : baseWidth;
    } else {
      const lines = [...dialog.querySelectorAll('.resource-sense-line,.wdc-sense-copy')];
      const intrinsic = lines.length ? Math.max(...lines.map(measureText)) : 640;
      const action = dialog.querySelector('.ke-word-more')?.getBoundingClientRect().width || 0;
      width = Math.max(640, intrinsic + action + 150);
      if (media) width /= .68;
    }
    if (layout) {
      if (dialog.dataset.repairMediaLayout !== layout) dialog.dataset.repairMediaLayout = layout;
      setProperty(dialog, '--repair-media-width', `${mediaWidth}px`);
    } else {
      delete dialog.dataset.repairMediaLayout;
      dialog.style.removeProperty('--repair-media-width');
    }
    if (!expanded) setProperty(dialog, '--repair-width', `${Math.round(Math.min(available, width))}px`);
    if (dialog.classList.contains('ke-wiki-modal') || dialog.classList.contains('ke-grammar-modal')) {
      const head = dialog.querySelector(':scope>.resource-popover-head');
      const footer = dialog.querySelector('.resource-popover-pager');
      const body = dialog.querySelector('.resource-popover-body');
      const name = body?.querySelector(':scope>.ke-wiki-name');
      const bodyStyle = body ? getComputedStyle(body) : null;
      const padding = bodyStyle ? number(bodyStyle.paddingTop) + number(bodyStyle.paddingBottom) : 56;
      const nameStyle = name ? getComputedStyle(name) : null;
      const nameHeight = name ? name.getBoundingClientRect().height + number(nameStyle.marginTop) + number(nameStyle.marginBottom) : 0;
      const controls = dialog.querySelector('.ke-topic-frozen-toolbar');
      const controlsStyle = controls ? getComputedStyle(controls) : null;
      const controlsHeight = controls ? controls.getBoundingClientRect().height + number(controlsStyle.marginTop) + number(controlsStyle.marginBottom) : 0;
      const normalHeightLimit = dialog.classList.contains('ke-grammar-modal') ? 820 : 1200;
      const dialogHeight = Math.max(0, expanded ? innerHeight - 24 : Math.min(normalHeightLimit, innerHeight - outerGap));
      const budget = Math.max(0, dialogHeight - (head?.getBoundingClientRect().height || 90) - (footer?.getBoundingClientRect().height || 0) - controlsHeight - 2);
      setProperty(dialog, '--repair-body-budget', `${budget}px`);
      setProperty(dialog, '--repair-copy-height', `${Math.max(0, budget - padding - nameHeight)}px`);
      dialog.style.removeProperty('--repair-body-height');
    }
  }
  function update() { frame = 0; targets.forEach(id => resize(document.getElementById(id))); }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  const observer = new MutationObserver(records => {
    if (records.some(record => record.type !== 'attributes' || record.attributeName !== 'style' || record.target.id === 'fullscreenPage' || record.target === document.documentElement)) schedule();
  });
  observer.observe(document.body, {subtree:true, childList:true, attributes:true, attributeFilter:['class','data-theme-kind','data-theme-scheme','style']});
  observer.observe(document.documentElement, {attributes:true, attributeFilter:['style','class']});
  addEventListener('resize', schedule, {passive:true});
  document.addEventListener('load', schedule, true);
  document.addEventListener('loadedmetadata', schedule, true);
  document.fonts?.ready.then(schedule);
  schedule();
})();
