/* Cross-word examples read from the existing source objects. They are examples
 * of construction types, never new formation records for the current word. */
(() => {
  'use strict';
  const api = window.V1220WordDetail;
  if (!api?.finish || window.V1281FormationGallery) return;
  const selections = Object.freeze([
    {head:'entitle', type:'前缀派生', signal:'en-'},
    {head:'trainer', type:'后缀派生', signal:'-er'},
    {head:'deep-fry', type:'合成词', signal:'deep'}
  ]);
  const mounted = new WeakMap();
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function sources() {
    const data = window.SINGLE_BOOK_LATEST_WORD_DATA;
    if (!data?.wordsByHead) return [];
    return selections.flatMap(selection => {
      const word = data.wordsByHead[selection.head];
      const note = word?.formationNotes?.find(row => !row.mock && typeof row.text === 'string' && row.text.includes(selection.signal));
      if (!note) return [];
      const single = window.V1213_PPT_SOURCE?.entries?.[selection.head]?.single;
      return [{...selection, word, note, single:single?.kind === 'formation' ? single : null}];
    });
  }
  function cardFor(source) {
    const {head, type, word, note, single} = source;
    const article = make('article', 'v1281-formation-example');
    article.dataset.v1281GalleryHead = head;
    article.dataset.v1281GalleryType = type;
    article.dataset.v1281FormationKey = String(note.formationKey || '');
    article.dataset.v1281SourceWordIds = JSON.stringify(word.currentWordIds || []);
    if (note.source) article.dataset.v1281FormationSource = JSON.stringify(note.source);
    const header = make('header', 'v1281-formation-example-head');
    const kind = make('p', 'v1281-formation-type', type);
    const title = make('h4', 'v1281-formation-word', word.displayWord || word.word || head);
    header.append(kind, title); article.append(header);
    const label = make('p', 'v1281-formation-original-label', note.title || '构词点拨');
    const copy = make('p', 'v1281-formation-source-copy', note.text);
    article.append(label, copy);
    if (single?.image) {
      const figure = make('figure', 'v1281-formation-source-figure');
      figure.dataset.v1281SourceSlide = String(single.sourceSlide || '');
      const image = make('img'); image.src = single.image;
      image.alt = single.title || `${head} 构词原图`;
      image.decoding = 'async'; figure.append(image);
      if (single.formula || single.caption) figure.append(make('figcaption', '', single.formula || single.caption));
      article.append(figure);
    }
    return article;
  }
  function mount(detail = document.getElementById('wordDetailDialog')) {
    if (!detail?.matches('#wordDetailDialog') || !detail.isConnected) return false;
    const panel = detail.querySelector('.vwn-panel[aria-labelledby$="-tab-formation"]');
    const host = panel?.querySelector('.vwn-panel-scroll');
    if (!host) return false;
    let gallery = mounted.get(detail);
    if (!gallery) {
      const rows = sources(); if (rows.length < 3) return false;
      gallery = make('section', 'v1281-formation-gallery');
      gallery.dataset.v1281FormationGallery = 'true';
      gallery.setAttribute('aria-label', '构词类型示例');
      const heading = make('header', 'v1281-formation-gallery-head');
      heading.append(make('h3', '', '构词类型示例'), make('p', '', '以下示例来自不同词条，展示不同的构词方式。'));
      const grid = make('div', 'v1281-formation-examples');
      rows.forEach(source => grid.append(cardFor(source)));
      gallery.append(heading, grid); mounted.set(detail, gallery);
    }
    if (gallery.parentElement !== host) host.append(gallery);
    return true;
  }
  const finish = api.finish;
  api.finish = function(detail) {
    const result = finish.apply(this, arguments);
    mount(detail);
    queueMicrotask(() => mount(detail));
    return result;
  };
  window.addEventListener('v1213-word-mounted', event => queueMicrotask(() => mount(event.detail)));
  window.V1281FormationGallery = Object.freeze({mount, sources, inspect(detail = document.getElementById('wordDetailDialog')) {
    return [...(detail?.querySelectorAll('[data-v1281-gallery-head]') || [])].map(card => ({
      head:card.dataset.v1281GalleryHead, type:card.dataset.v1281GalleryType,
      formationKey:card.dataset.v1281FormationKey, wordIds:JSON.parse(card.dataset.v1281SourceWordIds || '[]'),
      text:card.querySelector('.v1281-formation-source-copy')?.textContent,
      images:[...card.querySelectorAll('img')].map(image => image.getAttribute('src'))
    }));
  }});
  mount();
})();
