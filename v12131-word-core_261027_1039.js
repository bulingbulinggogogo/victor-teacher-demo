/* Latest supplied word material, scoped to the real single-set book. */
(() => {
  'use strict';
  const BOOK = 'test-single-book';
  const models = new WeakMap();
  let disclosureSequence = 0;
  const e = value => escapeHtml(String(value ?? ''));
  const text = value => String(value ?? '').trim();
  const norm = value => text(value).toLocaleLowerCase('en').replace(/’/g, "'").replace(/\s+/g, ' ');
  const family = value => { const match=norm(value).match(/^(adj|adv|n|vt|vi|v)(?=[.\s\[（(]|$)/); return match ? (/^v[ti]$/.test(match[1])?'v':match[1]) : typeof knowledgePosFamily === 'function' ? knowledgePosFamily(value) : norm(value).replace(/\./g, ''); };
  const sourceData = () => window.SINGLE_BOOK_LATEST_WORD_DATA;
  const markedWordNote = word => window.V1224_WORD_NOTES?.byHead?.[word?.head || word?.word];
  function detailNotes(word, module) {
    const marked = markedWordNote(word);
    if (!marked) return word?.[`${module}Notes`] || [];
    return marked.detailModule === module ? [marked] : [];
  }
  const currentQuestion = () => typeof getQuestion === 'function' && typeof state !== 'undefined' ? getQuestion(state.currentQuestionId) : null;
  function inScope(item) {
    return item?.bookKey === BOOK || currentQuestion()?.bookKey === BOOK;
  }
  function resolve(entry, item, context) {
    const data = sourceData();
    if (!data || !inScope(item)) return null;
    if (item?.v1220Head && data.wordsByHead?.[item.v1220Head]) return data.wordsByHead[item.v1220Head];
    const record = item?.sourceRecordId || item?.analysisRecordId;
    const bindings = data.bindingsByRecord?.[record] || data.bindings?.filter(row => Number(row.analysisRow) === Number(item?.analysisRow)) || [];
    const binding = bindings.find(row => norm(row.entryWord) === norm(entry?.word));
    if (binding && data.wordsByHead[binding.head]) return data.wordsByHead[binding.head];
    const id = entry?.word_id || entry?.wordId || context?.word?.id || item?.wordId;
    const mapped = data.wordsByCurrentId?.[String(id)];
    if (mapped && data.wordsByHead[mapped]) return data.wordsByHead[mapped];
    const head = text(entry?.word || context?.word?.word);
    if (data.wordsByHead?.[head]) return data.wordsByHead[head];
    const candidates = Object.values(data.wordsByHead || {}).filter(word => (word.aliases || []).some(alias => norm(alias) === norm(head)));
    return candidates.length === 1 ? candidates[0] : null;
  }
  function rich(record, field, fallback, options = {}) {
    const value = String(fallback ?? record?.[field] ?? '');
    const runs = record?.sourceRichTextRuns?.[field] || record?.richText?.[field] || record?.sourceRichText?.[field];
    if (!Array.isArray(runs) || runs.map(run => run.text || '').join('') !== value) return e(value);
    return runs.map(run => {
      let copy = e(run.text || '');
      if (run.bold) copy = `<strong>${copy}</strong>`;
      if (run.italic) copy = `<em>${copy}</em>`;
      if (run.underline) copy = `<u>${copy}</u>`;
      return run.isRed && !options.neutral ? `<span class="v1220-source-red">${copy}</span>` : copy;
    }).join('');
  }
  function safeAudio(word, record, accent) {
    const slot = {sourceHead:text(word.head || word.word),normalizedPOS:family(record.pos || record.partOfSpeech),accent,
      phonetic:record[`${accent}Phonetic`]};
    // Latest display-book pronunciation uses the user's one approved source batch.
    // No old AAC/M4A/MP3 or cross-head/POS fallback is evidence for a missing slot.
    if (window.V1230AAC?.blockedSlot?.(slot)) return '';
    return window.V1230AAC?.resolveSlot?.(slot)?.src || '';
  }
  function pronunciations(word, context, selectedPOS = '') {
    const parts = (word.parts || []).filter(part => (part.senses || []).some(sense => text(sense.chinese)));
    const supplied = word.pronunciations?.length ? word.pronunciations : parts.map(part => ({ ...part, pos: part.partOfSpeech }));
    const groups = new Map();
    supplied.forEach(source => {
      let pos = source.pos || source.partOfSpeech || source.audioDictionaryPOS || '';
      // A pronunciation-row abbreviation is not a new POS when the meaning table has one real POS.
      if (pos && !parts.some(part => family(part.partOfSpeech) === family(pos)) && parts.length === 1) pos = parts[0].partOfSpeech;
      if (selectedPOS && family(pos) !== family(selectedPOS)) return;
      const record = { ...source, pos };
      if (!record.ukPhonetic && !record.usPhonetic) return;
      const audioWord=window.V1225Present?.sourceWord(word,source)||word;
      // The merged display keeps each pronunciation's original source head.
      const uk = safeAudio(audioWord, record, 'uk'), us = safeAudio(audioWord, record, 'us');
      const signature = JSON.stringify([record.ukPhonetic || '', record.usPhonetic || '', uk, us]);
      if (!groups.has(signature)) groups.set(signature, { record, uk, us, labels: [] });
      if (pos && !groups.get(signature).labels.includes(pos)) groups.get(signature).labels.push(pos);
    });
    const allGroups=[...groups.values()];
    // Hide only a silent duplicate presentation row. Its blocked source slot
    // remains blocked; no recording is assigned or borrowed across source heads.
    const visibleGroups=allGroups.filter(group=>group.uk || group.us || !group.labels.length || !allGroups.some(other=>
      other!==group && (other.uk || other.us) && group.labels.every(pos=>other.labels.includes(pos)) &&
      (other.record.ukPhonetic || '')===(group.record.ukPhonetic || '') &&
      (other.record.usPhonetic || '')===(group.record.usPhonetic || '')));
    const labelParts = visibleGroups.length > 1;
    return visibleGroups.length ? `<div class="resource-pronunciation-groups">${visibleGroups.map(group => `<div class="resource-pronunciation-row${labelParts ? ' has-pos' : ''}" data-pronunciation-parts="${e(group.labels.join(','))}">${labelParts ? `<span class="resource-pronunciation-pos">${e(group.labels.join(' / '))}</span>` : ''}<div class="resource-pronunciations">${[['英','uk'],['美','us']].map(([label, accent]) => {
      const phonetic = group.record[`${accent}Phonetic`], audio = group[accent];
      return phonetic ? `<span class="resource-pronunciation-item" data-pronunciation-accent="${accent}"><b>${label}</b><em>${e(displayPhonetic(phonetic))}</em>${audio ? resourceInlineAudioButton(audio, `播放${label}音 ${displayPhonetic(phonetic)}`) : ''}</span>` : '';
    }).join('')}</div></div>`).join('')}</div>` : '';
  }
  function cases({ wordId, item, retained = [] }) {
    if (!inScope(item)) return retained;
    const rawWord = resolve({ word_id: wordId }, item, null);
    const word=window.V1225Present?.viewWord(rawWord)||rawWord;
    if (window.V1227ExamDistribution?.sourceRows) { const rows=window.V1227ExamDistribution.sourceRows(word,item,retained); return window.V1222SenseExamples?.orderedCases?.(rows) || rows; }
    const added = (word?.listeningExamples || []).filter(row => row.realOnly === true && text(row.english || row.sentence));
    const seen = new Set();
    return [...retained, ...added].filter(row => {
      const key = [norm(row.english || row.sentence), row.year || '', row.sourceName || row.paper || ''].join('|');
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).map((row,index)=>row.exampleKey ? row : {...row,exampleKey:`retained-listening:${rawWord?.head || wordId}:source${row.sourceWorkbookRow || index+1}`});
  }
  function enhanceArticle(article, entry, item, context) {
    const word = resolve(entry, item, context); if (!word) return;
    const pos = context?.selected?.part?.partOfSpeech || context?.part?.partOfSpeech || entry.part_of_speech || '';
    const markup = pronunciations(word, context, pos);
    article.querySelectorAll('.resource-pronunciation-groups,.resource-sense-heading > .resource-pronunciations,:scope > .resource-pronunciations').forEach(node => node.remove());
    if (markup) article.querySelector('.knowledge-term')?.insertAdjacentHTML('afterend', markup);
    // The latest pronunciation is above the card. An old part-pronunciation heading
    // must not leave a second, otherwise empty grid row inside the current meaning.
    article.querySelectorAll('.resource-sense-heading').forEach(heading => {
      if (heading.querySelector('.resource-pronunciations,.resource-pronunciation-groups')) return;
      const pos = heading.querySelector('.resource-sense-pos');
      if (pos) {
        pos.classList.replace('resource-sense-pos', 'resource-collapsed-pos');
        heading.replaceWith(pos);
      } else heading.remove();
    });
    article.querySelectorAll('.has-part-pronunciations').forEach(group => {
      if (!group.querySelector('.resource-pronunciations,.resource-pronunciation-groups')) group.classList.remove('has-part-pronunciations');
    });
    article.dataset.latestWordHead = word.head;
  }
  function finishMother(container, item) {
    if (!inScope(item) || container.closest('#wordDetailDialog')) return;
    const popupTitle = container.closest('#popover')?.querySelector('.resource-popover-head > div > span');
    if (popupTitle?.textContent.includes('构词法')) popupTitle.textContent = popupTitle.textContent.replace(/构词法/g,'构词点拨');
    const words = [...new Set([...container.querySelectorAll('[data-latest-word-head]')].map(article => article.dataset.latestWordHead))].map(head => sourceData()?.wordsByHead?.[head]).filter(Boolean);
    const notes = words.flatMap(word => markedWordNote(word) ? [] : word.semanticNotes || []);
    const plain = value => String(value || '').replace(/[\s\u200b]+/g, '');
    // Original Word explanation paragraphs and named resource-word-note cards stay
    // where their renderer put them. There is no extra generic “说明” wrapper.
    let existing = plain(container.textContent);
    notes.forEach(note => {
      if (!text(note.text) || existing.includes(plain(note.text))) return;
      const row = document.createElement('section');
      row.className = text(note.title) ? 'resource-word-note v1223-mother-note' : 'knowledge-explanation is-unlabeled v1223-mother-note';
      row.dataset.latestMotherNote = note.noteKey;
      row.innerHTML = `${text(note.title) ? `<h4>${e(note.title)}</h4>` : ''}<p>${rich(note,'text')}</p>`;
      container.append(row);
      existing += plain(note.text);
    });
    // The newly marked Word is the confirmed wording for these 14 notes. Replace
    // the previous note body instead of appending another explanation beside it.
    words.forEach(word => {
      const marked = markedWordNote(word); if (!marked) return;
      const superseded = [marked.text, marked.replaces?.legacyWordText,
        ...(marked.replaces?.existingDataNotes || []), item?.explainOne,
        item?.explainTwo, item?.derivationText].map(plain).filter(Boolean);
      [...container.querySelectorAll('.knowledge-explanation,.resource-word-note')].forEach(node => {
        if (node.dataset.v1224WordNote === marked.head) { node.remove(); return; }
        const paragraphs = [...node.querySelectorAll('p')];
        const body = plain(paragraphs.length ? paragraphs.map(p => p.textContent).join('\n') : node.textContent);
        if (body && superseded.includes(body)) node.remove();
      });
      container.querySelectorAll('.resource-word-notes').forEach(node => {
        if (!node.children.length && !text(node.textContent)) node.remove();
      });
      const row = document.createElement('section');
      row.className = marked.title ? 'resource-word-note v1224-marked-word-note' : 'knowledge-explanation is-unlabeled v1224-marked-word-note';
      row.dataset.v1224WordNote = marked.head;
      row.dataset.latestMotherNote = marked.noteKey;
      row.innerHTML = `${marked.title ? `<h4>${e(marked.title)}</h4>` : ''}<p>${rich(marked,'text')}</p>`;
      container.append(row);
    });
  }
  function hasSectionContent(content) {
    if (!text(content)) return false;
    const probe = document.createElement('div'); probe.innerHTML = content;
    // A caption alone is not a lesson. Hidden examples and reveal layers still
    // count: availability follows source content, never current visibility.
    probe.querySelectorAll('h1,h2,h3,h4,h5,h6,script,style,[data-empty-module]').forEach(node => node.remove());
    if (text(probe.textContent)) return true;
    if ([...probe.querySelectorAll('img[src],audio[src],video[src],source[src]')].some(node => text(node.getAttribute('src')))) return true;
    // These renderers have already checked their data before returning a mount
    // anchor; charts and source diagrams may finish their DOM after navigation.
    return Boolean(probe.querySelector('[data-v1227-word-statistics],.pgi-module[data-graph-key],[data-family-renderer]'));
  }
  const section = (id, title, content, attrs = '') => hasSectionContent(content) ? `<section data-case-module="${id}" class="v1220-module" data-case-title="${e(title)}" ${attrs}>${content}</section>` : '';
  const posLabels = {n:'n. 名词',v:'v. 动词',adj:'adj. 形容词',adv:'adv. 副词'};
  const formFields = {
    n:[['plural','复数']],
    adj:[['comparative','比较级'],['superlative','最高级']],
    v:[['thirdPerson','一般现在时-三单'],['pastBritish','一般过去式（英式）'],['pastAmerican','一般过去式（美式）'],['pastParticipleBritish','过去分词（英式）'],['pastParticipleAmerican','过去分词（美式）'],['presentParticipleBritish','现在分词（英式）'],['presentParticipleAmerican','现在分词（美式）']]
  };
  function inflectionRows(word, part) {
    const pos = family(part?.partOfSpeech || part?.pos), fields = formFields[pos] || [];
    const records = (word.inflections || []).filter(row => family(row.pos || row.partOfSpeech) === pos);
    return fields.flatMap(([field,label]) => {
      const seen = new Set();
      return records.flatMap(record => {
        const value = text(record.forms?.[field]);
        if (!value || seen.has(value)) return [];
        seen.add(value);
        return [{field,label,value,source:record.source,head:record.v1225OriginalHead || record.head || word.head}];
      });
    });
  }
  function inflectionsHTML(word, part) {
    const rows = inflectionRows(word, part);
    return rows.length ? `<dl class="v1227-inflections" aria-label="${e(posLabels[family(part.partOfSpeech)] || part.partOfSpeech)}变形">${rows.map(row => `<div class="v1227-inflection" data-v1227-form="${e(row.field)}" data-v1227-form-head="${e(row.head)}"${row.source?.row ? ` data-v1227-form-source-row="${e(row.source.row)}"` : ''}><dt>${e(row.label)}</dt><dd>${e(row.value)}</dd></div>`).join('')}</dl>` : '';
  }
  const foldArrow = '<svg class="v1227-fold-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  function foldButton(id, label, markup) {
    return `<button type="button" class="v1227-group-toggle" data-v1227-fold="${e(id)}" aria-controls="${e(id)}" aria-expanded="false" aria-label="展开${e(label)}"><span class="v1227-fold-label">${markup}</span>${foldArrow}</button>`;
  }
  function setFold(button, expanded) {
    const root = button.closest('#wordDetailDialog'), id = button.dataset.v1227Fold;
    const body = root?.querySelector(`[data-v1227-fold-body="${id}"]`);
    if (!body) return;
    button.setAttribute('aria-expanded',String(expanded));
    button.setAttribute('aria-label',`${expanded ? '收起' : '展开'}${button.querySelector('.v1227-fold-label')?.textContent.trim() || ''}`);
    body.hidden = !expanded;
    if (!expanded) body.querySelectorAll('audio,video').forEach(media => media.pause());
  }
  function setFolds(root, expanded) { root?.querySelectorAll('[data-v1227-fold]').forEach(button => setFold(button,expanded)); }
  function expandFolds(root) { setFolds(root,true); }
  function bindFolds(detail) {
    if (detail.dataset.v1227FoldsBound) return;
    detail.dataset.v1227FoldsBound = 'true';
    detail.addEventListener('click',event => {
      const button = event.target.closest('[data-v1227-fold]');
      if (!button || !detail.contains(button)) return;
      const expand=button.getAttribute('aria-expanded')!=='true';
      // Content disclosure only changes this group's body. Module/category
      // filtering belongs to the sidebar, and sibling groups keep their state.
      setFold(button,expand);
      window.V1222SenseExamples?.layoutCitations?.(detail);
      window.WordDetailNavigation?.fit?.();
    });
  }
  function meanings(word, examRows = []) {
    let number = 0;
    const senseCount = sense => examRows.filter(row => row.senseKey === sense.senseKey).length;
    return `<div class="ke-all-meanings"><div class="resource-meanings resource-sense-overview">${(word.parts || []).map(part => {
      const senses = (part.senses || []).filter(sense => text(sense.chinese));
      if (!senses.length) return '';
      const id = 'v1227-meanings-' + (++disclosureSequence), label = posLabels[family(part.partOfSpeech)] || part.partOfSpeech;
      return `<section class="v1227-meaning-group" data-v1227-pos="${e(part.partOfSpeech)}"><div class="resource-sense-pos v1227-group-heading">${foldButton(id,label,e(label) + ' <span class="v1227-word-tag" data-word-tag="pos-exam" data-word-tag-field="exam-count" title="当前词性在全部已收录高考例句中的次数">高考' + examRows.filter(row=>family(row.partOfSpeech)===family(part.partOfSpeech)).length + '</span>')}</div><div id="${id}" class="resource-sense-list" data-v1227-fold-body="${id}" hidden>${senses.map(sense => `<div class="resource-sense-line" data-latest-sense="${e(sense.senseKey || sense.id)}"${sense.v1225OriginalHead ? ` data-latest-original-head="${e(sense.v1225OriginalHead)}"` : ''}><span class="v1220-sense-number">${++number}</span><div class="resource-sense-copy"><span class="resource-sense-meta">${[sense.transitivity,sense.countability,sense.emphasis,sense.register].filter(Boolean).map(e).join(' ')}</span><span class="resource-sense-meaning">${rich(sense, 'chinese', undefined, {neutral:true})}</span><span class="v1227-word-tag" data-word-tag="sense-exam" data-word-tag-field="exam-count" title="该释义在全部已收录高考例句中的次数">高考${senseCount(sense)}</span>${sense.english ? `<span class="v1220-english-definition"><span class="v124-english-copy">${rich(sense,'english')}</span></span>` : ''}${sense.definitionPhraseEnglish ? `<span class="resource-sense-chunk">${rich(sense,'definitionPhraseEnglish')} ${rich(sense,'definitionPhraseChinese',undefined,{neutral:true})}</span>` : ''}${window.V1222SenseExamples?.render?.(window.V1225Present?.sourceWord(word,sense)||word,sense,part) || ''}</div></div>`).join('')}</div></section>`;
    }).join('')}</div></div>`;
  }
  function noteHTML(rows) {
    return (rows || []).filter(row => text(row.text)).map(row => `<article class="v1220-note${row.source?.marker === 'yellow' ? ' v1224-marked-word-note' : ''}" data-latest-note="${e(row.noteKey || row.formationKey)}"${row.source?.marker === 'yellow' ? ` data-v1224-word-note="${e(row.head)}"` : ''}>${row.title && !['释义','高考真题','一词多义','一词一义','语义网络图','辨析','词义辨析','词族树','词源故事','词源点拨','语义推导','语义点拨','构词点拨','构词法','拓展词块','词块','词频统计','说明'].includes(text(row.title)) ? `<h4>${e(row.title)}</h4>` : ''}<p>${rich(row,'text')}</p></article>`).join('');
  }
  function displayBlocks(word) {
    if (window.V1246BlockOwnership?.rows) return window.V1246BlockOwnership.rows(word);
    const supplied = (word.collocations || []).filter(row => text(row.phrase));
    const phrases = window.V1222SenseExamples?.phraseBlocks?.(word) || [];
    return [...supplied, ...phrases, ...(window.V1222SenseExamples?.displayOnlyBlocks?.(word) || [])];
  }
  function isWordBlock(row) { return !(text(row.parentSenseKey) && !row.unboundToSense) && (row.displayScope === 'word' || row.unboundToSense || /短语动词|习语/.test(row.category || '') || /^(phr[ .]?v|phrasal)/i.test(row.category || '')); }
  function blocks(word) {
    if(!displayBlocks(word).length)return '';
    const groups = new Map();
    displayBlocks(word).forEach(row => {
      const pos = text(row.parentPartOfSpeech), meaning = row.unboundToSense ? '' : text(row.parentMeaning);
      const key = JSON.stringify([pos,meaning]);
      if (!groups.has(key)) groups.set(key,{pos,meaning,rows:[]});
      groups.get(key).rows.push(row);
    });
    const labels = {n:'n. 名词',v:'v. 动词',adj:'adj. 形容词',adv:'adv. 副词'};
    const example = row => (row.example && window.V1222SenseExamples?.renderExample
      ? window.V1222SenseExamples.renderExample(row,'ordinary',`data-block-example="${e(row.blockKey)}"`,{label:'词块例句'}) : '') + (window.V1222SenseExamples?.renderBlockExamples?.(word,row) || '');
    return `<div class="v1226-block-groups">${[...groups.values()].map(group => {
      const id = 'v1227-blocks-' + (++disclosureSequence);
      const label = [labels[family(group.pos)] || group.pos,group.meaning].filter(Boolean).join(' · ') || '词块';
      const heading = `${group.pos ? `<span class="v1226-block-pos" data-word-tag-field="pos">${e(labels[family(group.pos)] || group.pos)}</span>` : ''}${group.meaning ? `<span class="v1226-block-parent-meaning">${e(group.meaning)}</span>` : ''}`;
      return `<section class="v1226-block-group" data-block-group data-v1228-block-pos="${e(family(group.pos))}"><header class="v1226-block-group-heading v1227-group-heading">${foldButton(id,label,heading || '词块')}</header><div id="${id}" class="v1226-block-units" data-v1227-fold-body="${id}" hidden>${group.rows.map(row => `<article class="v1220-block v1226-block-unit" data-block-key="${e(row.blockKey)}" data-block-category="${e(row.category)}" data-block-record-kind="${e(row.displayRecordKind || 'supplied-block')}"${row.sourceExampleKey ? ` data-source-example-key="${e(row.sourceExampleKey)}"` : ''}><div class="v1226-block-unit-head"><span class="v1226-block-category" data-word-tag-field="usage">${e(row.category || '词块')}</span>${row.subcategory ? `<span class="v1226-block-subcategory" data-word-tag-field="usage">${e(row.subcategory)}</span>` : ''}<h4><strong>${rich(row,'phrase')}</strong>${text(row.phraseChinese || row.chinese) ? `<span class="v1226-block-chinese">${rich(row,'chinese',row.phraseChinese || row.chinese,{neutral:true})}</span>` : ''}${row.audioUrl ? resourceInlineAudioButton(row.audioUrl,'播放词块：'+row.phrase) : ''}</h4></div>${row.usage || row.register || row.synonyms || row.antonyms || example(row) ? `<div class="v1226-block-associated">${row.usage || row.register ? `<p class="v1226-block-field"><span class="v1226-block-field-label" data-word-tag-field="usage">用法说明</span><span>${e([row.usage,row.register].filter(Boolean).join(' '))}</span></p>` : ''}${row.synonyms ? `<p class="v1226-block-field"><span class="v1226-block-field-label" data-word-tag-field="usage">同义表达</span><span>${e(row.synonyms)}</span></p>` : ''}${row.antonyms ? `<p class="v1226-block-field"><span class="v1226-block-field-label" data-word-tag-field="usage">反义表达</span><span>${e(row.antonyms)}</span></p>` : ''}${example(row)}</div>` : ''}${sourceData()?.wordsByHead?.[row.phrase] ? `<button type="button" class="v1220-related-link" data-latest-head="${e(row.phrase)}">更多 ${e(row.phrase)}</button>` : ''}</article>`).join('')}</div></section>`;
    }).join('')}</div>`;
  }
  function exampleHTML(rows, kind) {
    if(window.V1222SenseExamples?.renderPage)return window.V1222SenseExamples.renderPage(rows,kind);
    return '';
  }

  function render(options) {
    const { entry,item,context,originalContent,caseHTML } = options;
    const originalWordRecord = resolve(entry,item,context); if (!originalWordRecord) return null;
    const word=window.V1225Present?.viewWord(originalWordRecord)||originalWordRecord;
    const oldFragment = document.createElement('div'); oldFragment.innerHTML = originalContent || '';
    const guidance = oldFragment.querySelector('.resource-guidance-card')?.outerHTML || '';
    const oldNotes = [...oldFragment.querySelectorAll('.knowledge-explanation,.resource-word-note')].map(node => node.outerHTML).join('');
    const familyImage = window.V1220_MEDIA_SUPPLEMENT?.wordFamilies?.[word.head];
    const marked = markedWordNote(word);
    const formationRows = detailNotes(word,'formation'), semanticRows = detailNotes(word,'semantic');
    const formation = noteHTML(formationRows), familyHTML = (window.V1222FamilyTree?.render?.(word,familyImage) || '').replace(/<figcaption>[^<]*词族树<\/figcaption>/,'');
    const explanation = marked ? (marked.detailModule === 'explanation' ? noteHTML([marked]) : '') : (!word.semanticNotes?.length && !word.formationNotes?.length ? oldNotes : '');
    const sourceParent = word.parentHead && sourceData().wordsByHead[word.parentHead];
    const parentLink = sourceParent ? `<button type="button" class="v1220-related-link" data-latest-head="${e(word.parentHead)}">上一级单词 · ${e(sourceParent.displayWord || sourceParent.head)}</button>` : '';
    const hasMeanings = (word.parts || []).some(part => (part.senses || []).some(sense => text(sense.chinese)));
    const renderedCases=cases({wordId:context?.word?.id,item,retained:options.retainedCases || []});
    const html = `<article class="knowledge-entry"><div class="knowledge-term"><span class="knowledge-word is-library-word">${e(word.displayWord || word.word || word.head)}</span></div>${pronunciations(word,context)}${word.pronunciationPhenomenon ? `<section class="pronunciation-phenomenon"><p class="pronunciation-notes">${e(word.pronunciationPhenomenon)}</p></section>` : ''}${guidance}${word.displayVariants?.length ? `<dl class="v1227-inflections" data-word-variants>${word.displayVariants.map(row=>`<div class="v1227-inflection"><dt>${e(row.label)}</dt><dd>${e(row.value)}</dd></div>`).join('')}</dl>` : ''}</article>`
      + section('meanings','释义',hasMeanings ? parentLink + meanings(word,renderedCases) : '')
      + section('semantic','语义推导',noteHTML(semanticRows) + explanation)
      + section('etymology','词源故事',noteHTML(word.etymologyNotes))
      + section('contrast','辨析',noteHTML(word.comparisonNotes))
      + section('family','词族树',familyHTML)
      + section('formation','构词点拨',formation)
      + section('collocations','拓展词块',displayBlocks(word).some(row => text(row.phrase)) ? blocks(word) : '')
      + (renderedCases.length ? section('cases','高考真题',`<div id="ke-exam-cases" class="ke-exam-cases">${exampleHTML(renderedCases,'listening')}</div>`) : caseHTML || '')
      + section('textbookExamples','教材例句',exampleHTML(word.textbookExamples || [],'textbook'))
      + section('statistics','词频统计',window.V1227WordStatistics?.renderPlaceholder?.(word,item,options.retainedCases || []) || '');
    return { html, word, options };
  }
  function openHead(head, options, trigger) {
    const word = sourceData()?.wordsByHead?.[head]; if (!word || !inScope(options.item)) return;
    const candidate=typeof libraryWordForEntry==='function' ? libraryWordForEntry({word:word.displayWord || word.head,word_id:word.primaryCurrentWordId}, {bookKey:BOOK}) : null;
    const old=candidate && (word.primaryCurrentWordId ? Number(candidate.id)===Number(word.primaryCurrentWordId) : norm(candidate.word)===norm(word.displayWord || word.head)) ? candidate : null;
    const entry = { word: word.head, word_id: old?.id || word.primaryCurrentWordId || word.id || null };
    const item = { ...options.item, word:head, bookKey:BOOK, v1220Head:head, wordId:entry.word_id };
    const context = old ? {word:old,part:old.parts?.[0],selected:null} : {word:{id:word.primaryCurrentWordId || word.sourceBusinessWordId || null,word:word.head,parts:word.parts || []},part:word.parts?.[0],selected:null};
    const parentTrigger = options.trigger?.isConnected ? options.trigger : document.querySelector('#popover .ke-word-more');
    window.DemoKnowledgeEnhancements.openWordDetail(entry,item,context,'top',parentTrigger || trigger);
  }
  const featureStates = new WeakMap(), featureActions = new WeakMap();
  function revealSense(detail, senseKey, expectedPOS = '') {
    const model = models.get(detail), key = text(senseKey);
    if (!model || !key) return false;
    const candidates = (model.word.parts || []).flatMap(part =>
      (part.senses || []).map(sense => ({part,sense}))).filter(({sense}) =>
      String(sense.senseKey || sense.id) === key);
    const targets = [...detail.querySelectorAll('[data-latest-sense]')].filter(node => node.dataset.latestSense === key);
    if (candidates.length !== 1 || targets.length !== 1) return false;
    const pos = family(candidates[0].part.partOfSpeech);
    if (expectedPOS && family(expectedPOS) !== pos) return false;
    const buttons = [...detail.querySelectorAll('.vwn-pos-tabs [data-vwn-pos]')].filter(button => family(button.dataset.vwnPos) === pos);
    const action = featureActions.get(detail);
    if (buttons.length !== 1 || !action || !window.WordDetailNavigation?.select?.(detail,'meanings')) return false;
    buttons[0].click();
    action.revealAll(targets[0]);
    detail.dataset.v1241FocusedSense = key;
    requestAnimationFrame(() => {
      const target = targets[0], body = detail.querySelector(':scope > .resource-popover-body');
      if (!target.isConnected || !body || target.closest('[hidden],.hidden')) return;
      const box = body.getBoundingClientRect(), row = target.getBoundingClientRect();
      body.scrollTop += row.top - box.top - 16;
      if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
      target.focus({preventScroll:true});
      window.V1222SenseExamples?.layoutCitations?.(detail);
    });
    return true;
  }
  function refreshFeatures(detail) {
    const action = featureActions.get(detail);
    if (!action) return false;
    action.refresh();
    return true;
  }
  function mountFeatures(detail, result) {
    if (featureStates.has(detail)) return;
    const word=result.word, nav=detail.querySelector('.v1225-word-main-nav,.vwn-main-nav'),actions=detail.querySelector('.vwn-secondary-tools');
    if (!nav || !actions) return;
    const state={forms:true,english:false,attributes:true,synonyms:false,antonyms:false,difficulty:true,relations:false,blocks:false,blockCategories:new Set(),examples:false,ordinary:false,textbook:false,exam:false,construction:false,sort:'frequency'};
    featureStates.set(detail,state);
    const controls=document.createElement('div');controls.className='v1220-secondary-tabs';controls.dataset.v1220SubnavFor='meanings';controls.setAttribute('aria-label','释义内容开关');
    const choices=[['english','英文释义'],['blocks','词块'],['examples','例句'],['ordinary','单词例句'],['textbook','教材例句'],['exam','高考例句'],['relations','近反义词']];
    controls.innerHTML=choices.map(([key,label])=>`<button type="button" data-word-feature="${key}" aria-pressed="false">${e(label)}</button>`).join('');actions.append(controls);
    const allToggle=document.createElement('button');allToggle.type='button';allToggle.dataset.wordFeature='all';allToggle.dataset.v1265AllFeatures='';
    allToggle.textContent='全部显示';allToggle.setAttribute('aria-pressed','false');controls.prepend(allToggle);
    const exampleParent = controls.querySelector('[data-word-feature="examples"]');
    const exampleChildren = ['ordinary','textbook','exam'].map(key => {
      const button = controls.querySelector(`[data-word-feature="${key}"]`);
      button.dataset.wordFeatureParent = 'examples';
      button.id = 'v1241-example-control-' + key + '-' + (++disclosureSequence);
      return button;
    });
    exampleParent.setAttribute('aria-controls',exampleChildren.map(button => button.id).join(' '));
    exampleParent.setAttribute('aria-expanded','false');
    const blockParent=controls.querySelector('[data-word-feature="blocks"]');
    const categoryControls=document.createElement('div');categoryControls.className='v1267-block-category-controls';categoryControls.dataset.v1267BlockCategories='';
    categoryControls.setAttribute('role','group');categoryControls.setAttribute('aria-label','词块分类');categoryControls.hidden=true;
    categoryControls.innerHTML=['all','短语动词','固定搭配','习语'].map(value=>`<button type="button" data-word-block-category="${e(value)}" data-v1267-dock-level="2" aria-pressed="false">${value==='all'?'全部':e(value)}</button>`).join('');
    categoryControls.id='v1267-category-controls-'+(++disclosureSequence);blockParent.setAttribute('aria-controls',categoryControls.id);blockParent.setAttribute('aria-expanded','false');blockParent.after(categoryControls);
    controls.querySelectorAll('[data-word-feature]').forEach(button=>button.dataset.v1267DockLevel=button.dataset.wordFeatureParent?'2':'1');

    const meanings=detail.querySelector('.vwn-panel[aria-labelledby$="-tab-meanings"]');
    const ownedBlocks=displayBlocks(word),ownedBlockKeys=new Set(ownedBlocks.map(row=>row.blockKey));
    const wordBlocks=ownedBlocks.filter(isWordBlock),wordBlockKeys=new Set(wordBlocks.map(row=>row.blockKey));
    // Rendering and category availability must use the same approved ownership.
    meanings?.querySelectorAll('[data-sense-block]').forEach(node=>{if(!ownedBlockKeys.has(node.dataset.senseBlock)||wordBlockKeys.has(node.dataset.senseBlock))node.remove();});
    if(wordBlocks.length && window.V1267BlockCategories?.renderWordBlocks){
      const host=document.createElement('section');host.className='v1267-word-blocks';host.dataset.v1267WordBlocks='';
      host.innerHTML=window.V1267BlockCategories.renderWordBlocks(wordBlocks);meanings.querySelector('.resource-sense-overview')?.before(host);
    }
    meanings?.querySelectorAll('[data-latest-sense]').forEach(line=>{
      const sense=(word.parts || []).flatMap(part=>part.senses || []).find(row=>String(row.senseKey || row.id)===line.dataset.latestSense);if(!sense)return;
      const copy=line.querySelector('.resource-sense-copy');
      const additions=[['synonyms',text(sense.synonyms)&&'近义词：'+text(sense.synonyms)],['antonyms',text(sense.antonyms)&&'反义词：'+text(sense.antonyms)],['construction',(word.senseConstructionNotes || []).filter(row=>row.senseKey===sense.senseKey).map(row=>row.text).join('\n')]];
      additions.forEach(([feature,value])=>{if(value){const node=document.createElement('article');node.className=feature==='construction'?'resource-word-note v1267-construction-card':'v1220-note';
         if(feature==='construction'){const title=document.createElement('h4');title.textContent='构词法';node.append(title);}else node.dataset.senseFeature=feature;
         const p=document.createElement('p');p.textContent=value;node.append(p);copy.append(node);}});
      // Difficulty belongs to this exact meaning, beside its exam annotation.
      // Move any earlier helper tag out before removing the obsolete shells.
      const oldDifficulty=[...copy.querySelectorAll(':scope > [data-sense-feature="difficulty"]')];
      const difficultyTags=[...copy.querySelectorAll(':scope > [data-word-tag-field="difficulty"],:scope > [data-sense-feature="difficulty"] [data-word-tag-field="difficulty"]')];
      const difficultyField=text(sense.cefr)?'cefr':'readingLevel',difficulty=text(sense[difficultyField]);
      if(difficulty){
        const tag=difficultyTags.shift() || document.createElement('span');
        tag.className='v1228-sense-tag';tag.dataset.wordTagField='difficulty';
        tag.dataset.senseDifficulty=line.dataset.latestSense;tag.dataset.senseDifficultyField=difficultyField;
        tag.textContent='难度 '+difficulty;tag.hidden=false;
        const anchor=copy.querySelector(':scope > [data-word-tag="sense-exam"]') || copy.querySelector(':scope > .resource-sense-meaning');
        if(anchor)anchor.after(tag);else copy.prepend(tag);
      }
      difficultyTags.forEach(tag=>tag.remove());oldDifficulty.forEach(node=>node.remove());
    });
    const sort=document.createElement('div');sort.className='book-question-filter-options';sort.setAttribute('role','radiogroup');sort.setAttribute('aria-label','释义排序');sort.dataset.wordSenseSort='';
    const sortName='sense-sort-'+disclosureSequence;sort.innerHTML=`<label><input type="radio" name="${sortName}" data-sense-sort="frequency" value="frequency" checked><span>考频降序</span></label><label><input type="radio" name="${sortName}" data-sense-sort="difficulty" value="difficulty"><span>难度升序</span></label>`;
    sort.dataset.v1241SortSlot='';
    actions.append(sort);
    const rows=cases({wordId:result.options.context?.word?.id,item:result.options.item,retained:result.options.retainedCases || []});
    const senseCount=key=>rows.filter(row=>row.senseKey===key).length;
    function order() {
      meanings?.querySelectorAll('.v1227-meaning-group').forEach(group=>{
        const list=group.querySelector('.resource-sense-list'),nodes=[...list.querySelectorAll(':scope > [data-latest-sense]')];
        nodes.forEach((node,index)=>{if(node.dataset.dictionaryOrder===undefined)node.dataset.dictionaryOrder=String(index);});
        const levels=['A1','A2','B1','B2','C1','C2'],senses=new Map((word.parts||[]).flatMap(part=>part.senses||[]).map(sense=>[String(sense.senseKey||sense.id),sense]));
        const difficulty=node=>{const level=text(senses.get(node.dataset.latestSense)?.cefr||senses.get(node.dataset.latestSense)?.readingLevel).toUpperCase(),rank=levels.indexOf(level);return rank<0?levels.length:rank;};
        nodes.sort((a,b)=>(state.sort==='frequency'?senseCount(b.dataset.latestSense)-senseCount(a.dataset.latestSense):difficulty(a)-difficulty(b))||Number(a.dataset.dictionaryOrder)-Number(b.dataset.dictionaryOrder));
        nodes.forEach((node,index)=>{list.append(node);node.querySelector('.v1220-sense-number').textContent=String(index+1);});
      });
      sort.querySelectorAll('[data-sense-sort]').forEach(input=>input.checked=input.dataset.senseSort===state.sort);
    }
    const noteCards = new Map(), noteButtons = new Map();
    const noteSelector = '.resource-word-note,.knowledge-explanation,.v1220-note';
    function syncNoteChoices() {
      noteCards.clear();
      meanings?.querySelectorAll(noteSelector).forEach(node => {
        // Only cards inside a real sense belong to the meaning controls. The
        // generated near-synonym/difficulty rows and word-level tabs do not.
        if (!node.closest('[data-latest-sense]') || node.closest('[data-sense-feature]') || node.parentElement?.closest(noteSelector)) return;
        const heading = node.querySelector(':scope > h4,:scope > .resource-word-note-copy > h4');
        const title = text(heading?.textContent).replace(/\s+/g,' '), body = text(node.textContent);
        const hasMedia = [...node.querySelectorAll('img,audio,video')].some(media =>
          text(media.currentSrc || media.getAttribute('src')) || media.querySelector('source[src]'));
        if ((!body || (title && body === title)) && !hasMedia) return;
        const label = title || '说明', key = 'note:' + label;
        node.dataset.wordNoteFeature = key;
        if (!noteCards.has(key)) noteCards.set(key,{label,nodes:[]});
        noteCards.get(key).nodes.push(node);
      });
      noteCards.forEach(({label},key) => {
        if (!Object.prototype.hasOwnProperty.call(state,key)) state[key] = false;
        if (noteButtons.has(key)) return;
        const button = document.createElement('button');
        button.type = 'button';button.dataset.wordFeature = key;button.dataset.v1267DockLevel='1';button.dataset.wordNoteCategory = label;
        button.textContent = label;button.setAttribute('aria-pressed',String(state[key]));
        controls.append(button);noteButtons.set(key,button);
      });
      noteButtons.forEach((button,key) => {
        if (noteCards.has(key)) return;
        button.remove();noteButtons.delete(key);
      });
      // Late source notes use the same order without repeatedly moving stable nodes.
      const preferred=['english','blocks','examples','ordinary','textbook','exam','all','relations','note:语义点拨','note:一词一义','note:语义推导','note:词族树','note:构词法','note:名词动化'];
      const rank=key=>preferred.includes(key)?preferred.indexOf(key):preferred.length;
      const buttons=[...controls.querySelectorAll(':scope > button[data-word-feature]')].sort((a,b)=>rank(a.dataset.wordFeature)-rank(b.dataset.wordFeature));
      const ordered=buttons.flatMap(button=>button===blockParent?[button,categoryControls]:[button]);
      ordered.forEach((node,index)=>{if(controls.children[index]!==node)controls.insertBefore(node,controls.children[index]||null);});
    }
    function currentNodes(selector){
      const selected=window.WordDetailNavigation?.getState?.(detail)?.pos || word.parts?.[0]?.partOfSpeech;
      return [...(meanings?.querySelectorAll(selector) || [])].filter(node=>{const group=node.closest('[data-v1227-pos]');return !group || family(group.dataset.v1227Pos)===family(selected);});
    }
    function contentFor(key){
      if(noteCards.has(key))return currentNodes('[data-word-note-feature]').filter(node=>node.dataset.wordNoteFeature===key);
      if(key==='english')return currentNodes('.v124-english-copy').filter(node=>text(node.textContent));
      if(key==='blocks')return currentNodes('[data-sense-block],[data-v1267-word-block]');
      if(key==='relations')return [...currentNodes('[data-sense-feature]').filter(node=>['synonyms','antonyms'].includes(node.dataset.senseFeature)),...currentNodes('[data-v1244-block-relation-content]')];
      if(['construction','synonyms','antonyms'].includes(key))return currentNodes('[data-sense-feature]').filter(node=>node.dataset.senseFeature===key);
      if(key==='examples')return [...new Set(['ordinary','textbook','exam'].flatMap(contentFor))];
      const kind=key==='exam'?'listening':key;
      return currentNodes('[data-sense-example-kind]').filter(node=>!node.closest('[data-sense-block]') && node.dataset.senseExampleKind===kind);
    }
    function availableLeaves(){
      return ['blocks','ordinary','textbook','exam','relations',...[...noteCards.keys()].filter(key=>key!=='note:习语')].filter(key=>contentFor(key).length>0);
    }
    const exampleKinds=['ordinary','textbook','exam'];
    // The selection set is authoritative. 'All' is derived from only the
    // categories available for the current POS, never a fourth filter choice.
    function availableBlockCategories(nodes=contentFor('blocks')){
      return [...new Set([...nodes].map(node=>node.dataset.blockCategory).filter(Boolean))];
    }
    function selectBlockCategories(show){
      availableBlockCategories().forEach(category=>show?state.blockCategories.add(category):state.blockCategories.delete(category));
    }
    function allBlockCategoriesSelected(){
      const available=availableBlockCategories();
      return available.length>0&&available.every(category=>state.blockCategories.has(category));
    }
    function selectedLeaf(key){return !!state[key]&&(!exampleKinds.includes(key)||state.examples)&&(key!=='blocks'||allBlockCategoriesSelected());}
    function restoreBlockFocus(button,wasFocused){
      // The shared dock can move this group while applying source controls.
      // Wait for adapter microtasks; never take focus from another control.
      if(!wasFocused)return;
      requestAnimationFrame(()=>{
        if(!detail.isConnected||![document.body,button].includes(document.activeElement))return;
        const target=categoryControls.hidden?blockParent:button;
        if(!target.disabled&&!target.closest('[hidden],.hidden')&&target.getClientRects().length)target.focus({preventScroll:true});
      });
    }
    function apply() {
      syncNoteChoices();
      const currentBlocks=new Set(contentFor('blocks'));
      // Changing POS cannot silently turn an unselected category back on.
      // Previously chosen categories remain selected only where they exist.
      const currentCategories=availableBlockCategories(currentBlocks);
      state.blocks=currentCategories.some(category=>state.blockCategories.has(category));
      state['note:习语']=state.blocks && currentCategories.includes('习语') && state.blockCategories.has('习语');
      const examplesAvailable = contentFor('examples').length > 0;
      controls.querySelectorAll('button[data-word-feature]').forEach(button => {
        const key = button.dataset.wordFeature, child = button.dataset.wordFeatureParent === 'examples';
        if(key==='all')return;
        if(key==='note:习语'){button.hidden=true;button.disabled=true;return;}
        const available = contentFor(key).length > 0, selected = available && state[key] && (!child || state.examples);
        button.hidden = !available || (child && !state.examples);
        button.disabled = !available;
        button.title = available ? '' : ('当前词性暂无' + button.textContent.trim());
        button.setAttribute('aria-pressed',String(selected));
        button.setAttribute('aria-selected',String(selected));
      });
      const leaves=availableLeaves(),all=leaves.length>0&&leaves.every(selectedLeaf),some=leaves.some(key=>key==='blocks'?state.blocks:selectedLeaf(key));
      allToggle.hidden=!leaves.length;allToggle.disabled=!leaves.length;
      allToggle.textContent=all?'全部隐藏':'全部显示';
      allToggle.setAttribute('aria-pressed',all?'true':some?'mixed':'false');
      allToggle.setAttribute('aria-selected',String(all));
      exampleParent.setAttribute('aria-expanded',String(examplesAvailable && state.examples));
      meanings?.querySelectorAll('.v124-english-copy').forEach(node=>node.hidden=!state.english);
      meanings?.querySelectorAll('.resource-sense-meta,.resource-sense-chunk').forEach(node=>node.hidden=!state.attributes);
      meanings?.querySelectorAll('[data-sense-feature]').forEach(node=>node.hidden=['synonyms','antonyms'].includes(node.dataset.senseFeature)?!state.relations:!state[node.dataset.senseFeature]);
      meanings?.querySelectorAll('[data-sense-block],[data-v1267-word-block]').forEach(node=>node.hidden=!state.blocks || !currentBlocks.has(node) || !state.blockCategories.has(node.dataset.blockCategory));
      meanings?.querySelectorAll('[data-v1267-word-block-group]').forEach(group=>group.hidden=![...group.querySelectorAll('[data-v1267-word-block]')].some(node=>!node.hidden));
      categoryControls.hidden=!state.blocks || !currentBlocks.size;blockParent.setAttribute('aria-expanded',String(!categoryControls.hidden));
      categoryControls.querySelectorAll('button').forEach(button=>{
        const category=button.dataset.wordBlockCategory,available=[...currentBlocks].filter(node=>category==='all'||node.dataset.blockCategory===category).length;
        const selected=available>0&&state.blocks&&(category==='all'?allBlockCategoriesSelected():state.blockCategories.has(category));
        button.hidden=!available;button.disabled=!available;button.dataset.categoryCount=String(available);button.setAttribute('aria-pressed',String(selected));button.setAttribute('aria-selected',String(selected));
        button.title=available?`${category==='all'?'全部':category} · ${available}条`:`当前词性暂无${category}`;
      });
      meanings?.querySelectorAll('[data-word-note-feature]').forEach(node=>node.hidden=!state[node.dataset.wordNoteFeature]);
      meanings?.querySelectorAll('[data-sense-example-kind]').forEach(node=>{if(node.closest('[data-sense-block]'))return;const kind=node.dataset.senseExampleKind;node.hidden=!state.examples || !state[kind==='listening'?'exam':kind];});
      meanings?.querySelectorAll('[data-sense-examples]').forEach(group=>group.hidden=![...group.children].some(child=>!child.hidden));
      window.V1244BlockRelations?.refresh?.(detail);
      window.V1222SenseExamples?.layoutCitations?.(meanings);
      controls.hidden=nav.querySelector('[aria-selected="true"]')?.dataset.wordModule!=='meanings';
      window.V1223WordDock?.refresh?.(detail);
    }
    featureActions.set(detail,{refresh:apply,revealAll(target){
      syncNoteChoices();
      noteCards.forEach((_record,key) => state[key] = true);
      ['forms','english','attributes','relations','synonyms','antonyms','difficulty','blocks','examples','ordinary','textbook','exam','construction'].forEach(key => state[key] = true);selectBlockCategories(true);
      window.V1220WordDetail?.setFolds?.(target.closest('.v1227-meaning-group'),true);
      apply();
    }});
    controls.addEventListener('click',event => {
      const button = event.target.closest('[data-word-feature]');
      if (!button || button.disabled || button.hidden) return;
      const key = button.dataset.wordFeature,keepBlockFocus=key==='blocks'&&document.activeElement===button;
      if(key==='all'){
        syncNoteChoices();const leaves=availableLeaves(),show=!leaves.every(selectedLeaf);
        leaves.forEach(name=>state[name]=show);selectBlockCategories(show);
        state.examples=exampleKinds.some(name=>contentFor(name).length>0&&state[name]);
        if(show)leaves.forEach(name=>contentFor(name).forEach(node=>window.V1220WordDetail?.setFolds?.(node.closest('.v1227-meaning-group'),true)));
        apply();return;
      }
      state[key] = !state[key];
      if(key==='blocks')selectBlockCategories(state.blocks);
      if(key==='examples'){
        const available=exampleKinds.filter(name=>contentFor(name).length>0);
        if(!state.examples)available.forEach(name=>state[name]=false);
        else if(!available.some(name=>state[name]))state[available.includes('ordinary')?'ordinary':available[0]]=true;
      }else if(exampleKinds.includes(key))state.examples=exampleKinds.some(name=>contentFor(name).length>0&&state[name]);
      if (state[key]) contentFor(key).forEach(node => window.V1220WordDetail?.setFolds?.(node.closest('.v1227-meaning-group'),true));
      apply();restoreBlockFocus(button,keepBlockFocus);
    });
    categoryControls.addEventListener('click',event=>{
      const button=event.target.closest('[data-word-block-category]');if(!button||button.disabled)return;
      const keepFocus=document.activeElement===button,category=button.dataset.wordBlockCategory;
      if(category==='all')selectBlockCategories(!allBlockCategoriesSelected());
      else if(state.blockCategories.has(category))state.blockCategories.delete(category);
      else state.blockCategories.add(category);
      apply();restoreBlockFocus(button,keepFocus);
    });
    categoryControls.addEventListener('keydown',event=>{
      if(!['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
      const buttons=[...categoryControls.querySelectorAll('button:not(:disabled)')],i=buttons.indexOf(event.target);if(i<0)return;
      event.preventDefault();event.stopPropagation();const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(i+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;
      // Arrow/Home/End navigation moves focus; native Enter/Space toggles.
      buttons[next].focus({preventScroll:true});
    });
    sort.addEventListener('change',event=>{const input=event.target.closest('[data-sense-sort]');if(input){state.sort=input.dataset.senseSort;order();}});
    detail.addEventListener('word-pos-change',()=>{apply();window.V1227WordMetadata?.enhanceDetail?.(detail,result);});
    nav.addEventListener('click',()=>queueMicrotask(apply));
    window.V1220WordDetail?.setFolds?.(meanings,true);
    order();apply();
    detail.querySelectorAll('.vwn-panel').forEach(panel=>{if(panel.querySelector('.pgi-module'))panel.querySelectorAll('[data-empty-module]').forEach(node=>node.remove());});
  }
  function finish(detail, result) {
    if (!result) return;
    detail.classList.add('v1220-dialog'); detail.dataset.latestWordHead = result.word.head;
    bindFolds(detail);
    // The shared dock now holds a detached navigation tree until activation.
    // Mount it before finding the actual nav; the tree wrapper is not a nav.
    window.V1223WordDock?.activate?.(detail);
    const nav = detail.querySelector('.v1225-word-main-nav') || detail.querySelector('.vwn-main-nav,.v1223-word-primary'), actions = detail.querySelector('.vwn-secondary-tools');
    if (!nav || !actions) return;
    const order = ['meanings','cases','illustrations','singleMeaning','network','contrast','family','etymology','semantic','formation','collocations','statistics'];
    [...nav.querySelectorAll('[data-word-module]')].sort((a,b) => order.indexOf(a.dataset.wordModule)-order.indexOf(b.dataset.wordModule)).forEach(node => { nav.append(node); const panel=detail.querySelector(`[aria-labelledby="${node.id}"]`); if(panel)panel.parentElement.append(panel); });
    const labels = {meanings:'释义',cases:'高考真题',collocations:'拓展词块',semantic:'语义推导',etymology:'词源故事',contrast:'辨析',family:'词族树',formation:'构词点拨',singleMeaning:'一词一义',network:'语义网络图',statistics:'词频统计'};
    Object.entries(labels).forEach(([id,label]) => {
      const button=nav.querySelector(`[data-word-module="${id}"]`);if(button)button.textContent=label;
      const heading=detail.querySelector(`.vwn-panel[aria-labelledby$="-tab-${id}"] > .vwn-panel-title`);if(heading)heading.textContent=label;
    });
    const subnavs=[];
    function subnav(module, label, choices, attr, apply) {
      if (!nav.querySelector(`[data-word-module="${module}"]`)) return;
      choices = choices.filter((choice,index,rows) => text(choice.value) && text(choice.label) && rows.findIndex(row => row.value === choice.value) === index);
      if (choices.length < 2) return;
      const tabs=document.createElement('div');tabs.className='v1220-secondary-tabs';tabs.dataset.v1220SubnavFor=module;tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label',label);
      tabs.innerHTML=choices.map((choice,index)=>`<button type="button" role="tab" ${attr}="${e(choice.value)}" aria-selected="${index===0}" tabindex="${index===0?0:-1}">${e(choice.label)}</button>`).join('');
      tabs.addEventListener('click',event=>{const button=event.target.closest(`[${attr}]`);if(!button)return;tabs.querySelectorAll('button').forEach(node=>{const selected=node===button;node.setAttribute('aria-selected',String(selected));node.tabIndex=selected?0:-1;});apply(button.getAttribute(attr));});
      tabs.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const buttons=[...tabs.querySelectorAll('button')].sort((a,b)=>a.getBoundingClientRect().left-b.getBoundingClientRect().left),i=buttons.indexOf(event.target);if(i<0)return;event.preventDefault();event.stopPropagation();const j=event.key==='Home'?0:event.key==='End'?buttons.length-1:(i+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[j].click();buttons[j].focus({preventScroll:true});});
      actions.append(tabs);subnavs.push({module,tabs});
    }
    const blockRows=displayBlocks(result.word),categories=[...new Set(blockRows.map(row=>row.category).filter(Boolean))];
    const blockChoices=[...categories.map(value=>({value,label:value})),...(detail.querySelector('[data-word-idiom-example]')?[{value:'idiom-illustration',label:'习语图解'}]:[])];
    let blockCategory=blockChoices[0]?.value || '';
    function filterBlocks(){
      detail.querySelectorAll('[data-block-group]').forEach(group=>{
        group.querySelectorAll('.v1220-block').forEach(row=>row.hidden=row.dataset.blockCategory!==blockCategory);
        group.hidden=blockCategory==='idiom-illustration'||![...group.querySelectorAll('.v1220-block')].some(row=>!row.hidden);
        setFolds(group,true);
      });detail.querySelectorAll('[data-word-idiom-example]').forEach(node=>node.hidden=blockCategory!=='idiom-illustration');window.V1222SenseExamples?.layoutCitations?.(detail);
    }
    subnav('collocations','词块分类',blockChoices,'data-latest-block-category',category=>{blockCategory=category;filterBlocks();});
    filterBlocks();
    ['examples','cases','textbookExamples'].forEach(module=>{
      const panel=detail.querySelector(`.vwn-panel[aria-labelledby$="-tab-${module}"]`);if(!panel)return;
      const entries=[...panel.querySelectorAll('.v1220-example')];
      const field=module==='examples'?'examples':module==='cases'?'listeningExamples':'textbookExamples';
      const sourceRows=module==='cases' ? cases({wordId:result.options.context?.word?.id,item:result.options.item,retained:result.options.retainedCases||[]}) : result.word[field]||[];
      const sourceByKey=new Map(sourceRows.map(row=>[row.exampleKey,row]));
      if(module==='textbookExamples'){
        const editionValue=row=>text(row?.edition || row?.textbookVersion || row?.version);
        const versions=[...new Set(entries.map(node=>editionValue(sourceByKey.get(node.dataset.latestExample))).filter(Boolean))];
        entries.forEach(node=>{node.dataset.latestTextbookVersion=editionValue(sourceByKey.get(node.dataset.latestExample));});
        subnav(module,'教材例句版本',[{value:'all',label:'全部'},...versions.map(value=>({value,label:value}))],'data-latest-textbook-version',version=>{
          entries.forEach(node=>{node.hidden=version!=='all'&&node.dataset.latestTextbookVersion!==version;});
          window.V1222SenseExamples?.updateVisibleGroups?.(panel);
          window.V1222SenseExamples?.layoutCitations?.(panel);
        });
        return;
      }
      const posValue=raw=>result.word.v1225MergedHeads ? (norm(raw).match(/^(adj|adv|n|v)(?=[.\s\[(]|$)/)?.[1] || family(raw)) : raw;
      const posLabels={n:'n. 名词',v:'v. 动词',adj:'adj. 形容词'};
      const choices=[...new Set(entries.map(node=>posValue(sourceByKey.get(node.dataset.latestExample)?.partOfSpeech)).filter(Boolean))];
      subnav(module,`${module==='textbookExamples'?'教材':module==='cases'?'高考听力':'单词'}例句词性`,[{value:'all',label:'全部'},...choices.map(value=>({value,label:result.word.v1225MergedHeads ? posLabels[value]||value:value}))],'data-latest-example-pos',pos=>{entries.forEach(node=>{const source=sourceByKey.get(node.dataset.latestExample);node.hidden=pos!=='all'&&posValue(source?.partOfSpeech)!==pos;});window.V1222SenseExamples?.updateVisibleGroups?.(panel);});
    });
    if (!result.word.v1225MergedHeads && result.word.relatedHeads?.length>1) {
      const choices=result.word.relatedHeads.filter(row => (sourceData()?.wordsByHead?.[row.head]?.parts || []).some(part => (part.senses || []).some(sense => text(sense.chinese)))).map(row=>({value:row.head,label:row.label}));
      subnav('meanings','同形词条',choices,'data-latest-related-head',head=>{if(head!==result.word.head)openHead(head,result.options,detail.querySelector(`[data-latest-related-head="${head}"]`));});
      const related=subnavs.find(row=>row.module==='meanings');related?.tabs.querySelectorAll('button').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.latestRelatedHead===result.word.head)));
    }
    function sync(){
      let selected=nav.querySelector('[data-word-module][aria-selected="true"]');
      if (!selected || selected.hidden || selected.disabled) {
        const first=[...nav.querySelectorAll('[data-word-module]')].find(button => !button.hidden && !button.disabled);
        if (first) window.WordDetailNavigation?.select?.(detail,first.dataset.wordModule);
        selected=nav.querySelector('[data-word-module][aria-selected="true"]');
      }
      const active=selected?.dataset.wordModule;subnavs.forEach(row=>row.tabs.hidden=row.module!==active);const sort=detail.querySelector('[data-v1241-sort-slot]');if(sort)sort.hidden=active!=='meanings';window.ClassroomTools?.refresh?.();
    }
    nav.addEventListener('click',()=>queueMicrotask(sync));
    const selectionObserver=new MutationObserver(sync);
    selectionObserver.observe(nav,{subtree:true,attributes:true,attributeFilter:['aria-selected']});
    const connectionObserver=new MutationObserver(()=>{if(!detail.isConnected){selectionObserver.disconnect();connectionObserver.disconnect();}});
    connectionObserver.observe(document.body,{childList:true,subtree:true});
    detail.addEventListener('click',event => {
      const destination = event.target.closest('[data-v1241-sense-link]');
      if (destination && detail.contains(destination)) {
        event.preventDefault();
        revealSense(detail,destination.dataset.v1241SenseLink,destination.dataset.v1241SensePos);
        return;
      }
      const button = event.target.closest('[data-latest-head]');
      if (button) openHead(button.dataset.latestHead,result.options,button);
    });
    models.set(detail,result);
    mountFeatures(detail,result);
    sync();
    // New prose and existing PPT must each remain visible, including at large lecture font.
    const formationPanel=detail.querySelector('.vwn-panel[aria-labelledby$="-tab-formation"]');
    if(formationPanel?.querySelector('.v1220-note,.v1220-family')) formationPanel.classList.add('v1220-prose-and-figure');
    // Only a generic note caption duplicates this module's own title. Preserve
    // specific note headings, PPT source titles and the word-family caption.
    if(formationPanel?.querySelector(':scope > .vwn-panel-title')?.textContent.trim()==='构词点拨') {
      formationPanel.querySelectorAll('.v1220-note > h4').forEach(heading=>{
        if(['构词法','构词点拨'].includes(heading.textContent.trim())) heading.remove();
      });
    }
    window.WordDetailNavigation?.fit?.();
  }
  window.V1220WordDetail={resolve,cases,enhanceArticle,finishMother,render,finish,displayBlocks,inflectionRows,expandFolds,setFolds,noteHTML,revealSense,refreshFeatures,
    // Consumers read this snapshot; mounting and selection remain owned by this module.
    getModel:detail=>{const model=models.get(detail || document.getElementById('wordDetailDialog'));return model ? Object.freeze({...model,options:Object.freeze({...model.options})}) : null;},
    isWordBlock,featureState:detail=>featureStates.get(detail || document.getElementById('wordDetailDialog')) || null,
    markedWordNote:head=>window.V1224_WORD_NOTES?.byHead?.[head] || null,
    openHead:head=>{const detail=document.getElementById('wordDetailDialog'),model=models.get(detail);if(model)openHead(head,model.options,detail);},
    inspect:()=>{const detail=document.getElementById('wordDetailDialog'),model=models.get(detail);return model?{
      head:model.word.head,
      mergedHeads:model.word.v1225MergedHeads || null,entryHead:model.word.v1225EntryHead || model.word.head,
      meaningCount:detail.querySelectorAll('[data-latest-sense]').length,
      sourceSenseCount:(model.word.parts||[]).reduce((n,part)=>n+(part.senses||[]).filter(sense=>text(sense.chinese)).length,0),
      blockCount:detail.querySelectorAll('[data-block-key]').length,
      exampleCount:detail.querySelectorAll('[data-latest-example]').length,
      modules:window.WordDetailNavigation?.getState?.(detail)?.modules
    }:null;}
  };
})();
