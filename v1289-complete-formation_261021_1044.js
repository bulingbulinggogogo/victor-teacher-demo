/* Full formation diagrams: retain source nodes and render every original term and derivation. */
(() => {
  'use strict';
  const api = window.V1220WordDetail;
  if (!api?.finish) return;
  const make = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = text; return node; };
  function rich(node, text) {
    const pattern = /\b(?:adv|adj|vi|vt|v|n)\b/g;
    let last = 0;
    for (const match of text.matchAll(pattern)) { node.append(document.createTextNode(text.slice(last, match.index)), make('em', '', match[0])); last = match.index + match[0].length; }
    node.append(document.createTextNode(text.slice(last))); return node;
  }
  function splitOutside(text, separator) {
    let depth = 0, last = 0; const parts = [];
    [...text].forEach((char, index) => { if (char === '(') depth++; if (char === ')') depth--; if (char === separator && !depth) { parts.push(text.slice(last, index).trim()); last = index + 1; } });
    parts.push(text.slice(last).trim()); return parts;
  }
  function term(text) {
    const node = make('div', 'v1287-equation-term');
    const match = text.match(/^([a-zA-Z-]+)([\s\S]*)$/);
    if (!match) return rich(make('div', 'v1287-derivation-text'), text);
    node.append(make('strong', 'v1287-term-head', match[1]));
    if (match[2].trim()) node.append(rich(make('span', 'v1287-term-meaning'), match[2].trim()));
    return node;
  }
  function equation(text) {
    const equal = text.indexOf('='); if (equal < 0) return null;
    const left = text.slice(0, equal).trim(), stages = text.slice(equal + 1).split('→').map(s => s.trim());
    const formula = make('div', 'v1287-equation'); formula.append(term(left), make('span', 'v1287-operator', '='));
    splitOutside(stages.shift(), '+').forEach((part, index) => { if (index) formula.append(make('span', 'v1287-operator', '+')); formula.append(term(part)); });
    const diagram = make('div', 'v1287-full-equation'); diagram.dataset.v1287SourceText = text; diagram.append(formula);
    if (stages.length) {
      const chain = make('div', 'v1287-derivation-chain');
      stages.forEach((stage, index) => {
        chain.append(make('span', 'v1287-operator', '→'));
        const node = make('div', 'v1287-derivation-stage');
        // Keep the whole source phrase, including the qualification after the comma.
        const comma = stage.indexOf('，');
        if (index === stages.length - 1 && comma > 0) node.append(make('strong', 'v1287-result', stage.slice(0, comma)), make('span', 'v1287-result-detail', stage.slice(comma)));
        else rich(node, stage);
        if (index === stages.length - 1) node.classList.add('v1287-final-stage');
        chain.append(node);
      }); diagram.append(chain);
    }
    return diagram;
  }
  function mount(detail = document.getElementById('wordDetailDialog')) {
    if (!detail?.isConnected) return;
    detail.querySelectorAll('.v1282-topic-block[data-v1282-topic-kind="构词解析"]').forEach(card => {
      if (card.dataset.v1287Complete === 'true') return;
      const flow = card.querySelector(':scope > .v1282-formation-flow'); if (!flow) return;
      const source = card.querySelector(':scope > .v1281-formation-source-copy');
      const deep = flow.querySelector('.v1283-full-deep-equation');
      if (deep || source) {
        const original = deep || source, text = original.textContent.trim(), diagram = equation(text); if (!diagram) return;
        original.hidden = true; original.classList.add('v1287-source-original');
        flow.className = 'v1282-formation-flow v1287-complete-flow';
        flow.replaceChildren(diagram, original);
        if (deep && source) {
          // The source workbook also supplies a fuller variant; preserve it in the same diagram panel.
          source.hidden = true; source.classList.add('v1287-source-original'); const variant = equation(source.textContent.trim()); if (variant) { variant.classList.add('v1287-secondary-equation'); flow.append(variant, source); }
        }
      } else {
        const copy = card.querySelector('.v1267-construction-card p');
        if (copy) { flow.classList.add('v1287-compound-flow'); copy.classList.add('v1287-compound-note'); flow.append(copy.cloneNode(true)); card.querySelector(':scope > .v1267-construction-card')?.setAttribute('hidden', ''); }
      }
      card.dataset.v1287Complete = 'true';
    });
  }
  const finish = api.finish;
  api.finish = function(detail) { const result = finish.apply(this, arguments); mount(detail); queueMicrotask(() => mount(detail)); return result; };
  window.addEventListener('v1213-word-mounted', event => queueMicrotask(() => mount(event.detail)));
  window.V1287CompleteFormation = {mount}; mount();
})();
