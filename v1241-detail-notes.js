/* V41: display an authorized memory cue within its original gift sense.
   Moving/sorting that sense retains the one note; no source record is changed. */
(() => {
  'use strict';
  const giftSenseKey = 'latest-sense:present2:5';
  const paragraphText = 'present 作名词表示“礼物”时，可以把它想象成“送到对方面前、表达心意的一件东西”，这样更容易把单词和赠礼的场景联系起来。birthday present 是“生日礼物”，Christmas present 是“圣诞礼物”；注意与 the present 表示的“目前；现在”区分。';
  function mount(detail, options = {}) {
    if (detail?.id !== 'wordDetailDialog') return false;
    const head = String(options.word?.head || detail.dataset.latestWordHead || '');
    if (head !== 'present1' && head !== 'present2') return false;
    const gift = detail.querySelector(`[data-latest-sense="${giftSenseKey}"]`);
    const copy = gift?.querySelector('.resource-sense-copy');
    if (!copy) return false;
    let note = copy.querySelector('[data-v1241-semantic-note="present-gift"]');
    if (!note) {
      note = document.createElement('section');
      note.className = 'resource-word-note';
      note.dataset.v1241SemanticNote = 'present-gift';
      const heading = document.createElement('h4');
      heading.textContent = '语义点拨';
      const paragraph = document.createElement('p');
      paragraph.textContent = paragraphText;
      note.append(heading,paragraph);
    }
    const preceding = copy.querySelector(':scope > .v1220-english-definition')
      || copy.querySelector(':scope > [data-word-tag="sense-exam"]')
      || copy.querySelector(':scope > .resource-sense-meaning');
    if(detail.dataset.v1268SenseFlow){
      const next=[...copy.children].find(node=>node!==note && node.matches('.resource-word-note,.knowledge-explanation,.v1220-note') && !node.hasAttribute('data-sense-feature'));
      if(next)next.before(note);else copy.append(note);
    }else if (preceding) preceding.after(note); else copy.prepend(note);
    window.V1220WordDetail?.refreshFeatures?.(detail);
    return true;
  }
  window.V1241DetailNotes = Object.freeze({ mount, giftSenseKey, version:'V1.2.41' });
})();
