/* Restore formation cards in vocabulary mother popups only. Source notes and
 * their rich text stay intact; word-detail modules retain their own renderer. */
(() => {
  'use strict';
  const api = window.V1220WordDetail;
  if (!api?.finishMother || window.V1263FormationCard) return;

  const CARD = 'v1263-formation-card';
  const TITLE = 'v1263-formation-title';
  const norm = value => String(value ?? '').normalize('NFC').replace(/[\s\u200b\u200c\u200d\ufeff\u00ad]+/g, '').toLowerCase();
  const headingFor = node => node.querySelector(':scope > h4,:scope > .resource-word-note-copy > h4');
  function bodyKey(node) {
    const copy = node.cloneNode(true);
    copy.querySelectorAll(':scope > h4,:scope > .resource-word-note-copy > h4').forEach(heading => heading.remove());
    return norm(copy.textContent);
  }
  function entryHead(entry, item, index) {
    return entry.dataset.latestWordHead || entry.querySelector('.knowledge-word')?.textContent || item?.content?.[index]?.word || '';
  }
  function noteHead(note) {
    return note.dataset.v1263FormationHead || note.dataset.v1235NoteHead || note.dataset.v1224WordNote || note.closest('[data-latest-word-head]')?.dataset.latestWordHead || '';
  }
  function prepareCard(note, head) {
    note.classList.remove('knowledge-explanation', 'resource-word-note', 'is-unlabeled');
    note.classList.add(CARD);
    note.dataset.v1263FormationHead = head;
    let heading = headingFor(note);
    if (!heading) {
      heading = document.createElement('h4');
      note.prepend(heading);
    }
    heading.classList.add(TITLE);
    heading.textContent = '构词点拨';
    return note;
  }
  function isMessyReference(item) {
    return item?.bookKey !== 'test-single-book' && Number(item?.resourceSubtype) === 5
      && Number(item?.wordId || item?.content?.[0]?.word_id) === 3034 && Number(item?.id) === 18;
  }
  function restore(container, item) {
    const popup = container?.closest('#popover');
    if (!popup || popup.dataset.knowledgeType !== '词汇' || container.closest('#wordDetailDialog')) return;
    const entries = [...container.querySelectorAll('.knowledge-entry')];
    if (!entries.length) return;
    const rows = entries.map((entry, index) => ({ entry, head: entryHead(entry, item, index), cards: [], keys: new Set() }));
    const targetFor = (note, head) => rows.find(row => row.entry.contains(note))
      || rows.find(row => head && norm(row.head) === norm(head)) || (rows.length === 1 ? rows[0] : null);
    const add = note => {
      const head = noteHead(note), row = targetFor(note, head);
      if (!row || !row.entry.querySelector('.resource-meanings')) return;
      const key = bodyKey(note);
      if (!key) return;
      if (row.keys.has(key)) { note.remove(); return; }
      row.keys.add(key);
      row.cards.push(prepareCard(note, head || row.head));
    };
    // Keep earlier cards first when a repeated enhancement recreates a source
    // note. Comparing body text prevents duplicates without rebuilding rich text.
    container.querySelectorAll('.' + CARD).forEach(add);
    container.querySelectorAll('[data-v1235-note-module="formation"],.resource-word-note').forEach(note => {
      if (note.classList.contains(CARD) || note.closest('.' + CARD)) return;
      if (note.dataset.v1235NoteModule === 'formation' || /^构词(?:点拨|法)/.test(headingFor(note)?.textContent.trim() || '')) add(note);
    });
    if (isMessyReference(item)) {
      const row = rows.find(candidate => norm(candidate.head) === 'messy') || (rows.length === 1 ? rows[0] : null);
      if (row && !row.cards.length && row.entry.querySelector('.resource-meanings')) {
        const card = document.createElement('section');
        card.dataset.v1263FormationHead = 'messy';
        card.dataset.v1263FormationSource = 'user-reference';
        const paragraph = document.createElement('p');
        paragraph.textContent = 'mess+-y(……的状态/事物)';
        card.append(paragraph);
        row.cards.push(prepareCard(card, 'messy'));
      }
    }
    rows.forEach(row => {
      let anchor = row.entry.querySelector('.resource-meanings');
      if (!anchor) return;
      row.cards.forEach(card => { anchor.after(card); anchor = card; });
    });
    container.querySelectorAll('.resource-word-notes').forEach(holder => {
      if (!holder.children.length && !holder.textContent.trim()) holder.remove();
    });
  }

  const original = api.finishMother;
  api.finishMother = function(container, item) {
    const result = original.apply(this, arguments);
    restore(container, item);
    return result;
  };
  window.V1263FormationCard = {
    inspect(container = document.getElementById('popover')) {
      return container ? [...container.querySelectorAll('.' + CARD)].map(card => ({
        head: card.dataset.v1263FormationHead || '',
        source: card.dataset.v1263FormationSource || 'existing-note',
        title: headingFor(card)?.textContent || '',
        text: [...card.querySelectorAll('p')].map(paragraph => paragraph.textContent).join('\n'),
        sourceKeys: card.dataset.v1235NoteKeys || card.dataset.latestMotherNote || '',
        inWordDetail: Boolean(card.closest('#wordDetailDialog')),
        belowMeaning: card.previousElementSibling?.matches('.resource-meanings,.' + CARD) || false
      })) : [];
    }
  };
})();
