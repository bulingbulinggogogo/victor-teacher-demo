/* V1.2.13: route the added book to its own verified sources; retain V1.2.11 renderers. */
(() => {
  'use strict';
  const book = window.TEST_SINGLE_BOOK;
  const library = book?.knowledgeLibrary;
  if (!library || typeof libraryWordForEntry !== 'function') return;
  const key = book.bookKey || 'test-single-book';
  const real = value => value?.bookKey === key || value?.realOnly === true;
  const newQuestion = () => real(getQuestion(state.currentQuestionId));
  const newBook = () => newQuestion() || state.activeBookKey === key;
  const scoped = item => real(item) || newQuestion();
  const words = new Map((library.words || []).map(word => [Number(word.id), word]));
  const sourceWords = new Map((book.sourceOnlyWords || []).map(word => [Number(word.internalId || word.id), word]));
  const resources = new Map((library.analysisResources || []).map(item => [Number(item.analysisRow), item]));
  const records = new Map((library.analysisResources || []).map(item => [String(item.sourceRecordId || item.analysisRecordId || ''), item]));
  const contexts = new Map((library.contextMappings || []).map(item => [Number(item.analysisRow), item]));
  const original = { libraryWordForEntry, libraryContextForEntry, libraryResourceForItem,
    resourceSubtypeLabel, knowledgeAssetAvailable, knowledgeAssetUrl,
    resourceAnalysisAudioButton, knowledgeItemsForQuestion, decorateResourceHighlights, resourceItemDetail };

  function sourceResource(item) {
    if (!item || !scoped(item)) return null;
    const recordId = String(item.sourceRecordId || item.analysisRecordId || '');
    const row = Number(item.analysisRow || item.sourceAnalysisRow || 0);
    const source = recordId ? records.get(recordId) : resources.get(row);
    if (!source || !real(source) || (row && Number(source.analysisRow) !== row)) return null;
    return source;
  }
  function sourceContext(item) {
    const source = sourceResource(item);
    if (!source) return null;
    const mapping = contexts.get(Number(source.analysisRow));
    if (!mapping) return null;
    if (mapping.sourceRecordId && mapping.sourceRecordId !== source.sourceRecordId) return null;
    return mapping;
  }
  function assetUrl(group, filename) {
    if (!filename || !(library.assets?.[group] || []).includes(filename)) return '';
    return book.assetsURLs?.[group]?.[filename] || library.assetsURLs?.[group]?.[filename] || '';
  }

  libraryResourceForItem = function(item) {
    return scoped(item) ? sourceResource(item) : original.libraryResourceForItem(item);
  };
  libraryWordForEntry = function(entry, item) {
    if (!scoped(item)) return original.libraryWordForEntry(entry, item);
    const source = sourceResource(item);
    if (!source) return null;
    const mapping = sourceContext(source);
    const assignedId = Number(source.wordId || mapping?.wordId || 0);
    const requestedId = Number(entry?.word_id || entry?.wordId || 0);
    // Only the explicit, reviewed relation may select a full dictionary word.
    if (requestedId && assignedId && requestedId !== assignedId) return null;
    if (assignedId) {
      const word = words.get(assignedId) || null;
      return word && source.derivationText ? { ...word, derivation: source.derivationText } : word;
    }
    const word = source.sourceWord || sourceWords.get(Number(source.internalWordId || 0));
    const lookup = normalizeKnowledgeLookup(entry?.word || source.word);
    return word && normalizeKnowledgeLookup(word.word) === lookup
      ? (source.derivationText ? { ...word, derivation: source.derivationText } : word) : null;
  };
  libraryContextForEntry = function(entry, item) {
    if (!scoped(item)) return original.libraryContextForEntry(entry, item);
    const source = sourceResource(item);
    const word = libraryWordForEntry(entry, item);
    if (!source || !word) return null;
    const mapping = sourceContext(source);
    const partId = Number(entry?.part_id || entry?.partId || source.partId || mapping?.partId || 0);
    const senseId = Number(entry?.sense_id || entry?.senseId || source.contextSenseId || source.senseId || mapping?.senseId || 0);
    const wantedPos = knowledgePosFamily(entry?.part_of_speech || source.partOfSpeech);
    let part = (word.parts || []).find(candidate => partId && Number(candidate.id) === partId)
      || (word.parts || []).find(candidate => wantedPos && knowledgePosFamily(candidate.partOfSpeech) === wantedPos)
      || word.parts?.[0] || null;
    const allSenses = (word.parts || []).flatMap(candidate => (candidate.senses || []).map(sense => ({ ...sense, part: candidate })));
    const sourceEntry = Array.isArray(source.content) ? source.content.find(candidate => normalizeKnowledgeLookup(candidate.word) === normalizeKnowledgeLookup(entry?.word)) : null;
    const sourceMeaning = String(sourceEntry?.chinese ?? entry?.chinese ?? '');
    let selected = allSenses.find(sense => senseId && Number(sense.id) === senseId)
      || allSenses.find(sense => sourceMeaning && sense.chinese === sourceMeaning)
      || (word.isSourceContextEntry && allSenses.length === 1 ? allSenses[0] : null);
    if (selected?.part) part = selected.part;
    // The mother card uses Word's wording; allSenses and word.parts stay original.
    // Different Word wording is a display selection, so the unchanged renderer
    // must not exclude the dictionary's original sense from its expanded list.
    if (sourceMeaning) selected = { ...(selected || {}),
      dictionarySenseId: Number(selected?.id || 0),
      id: selected?.chinese === sourceMeaning ? selected.id : 0,
      chinese: sourceMeaning, part };
    return { word, part, selected, allSenses };
  };
  resourceSubtypeLabel = function(type, item) {
    if (!scoped(item)) return original.resourceSubtypeLabel(type, item);
    const source = sourceResource(item);
    return source?.resourceSubtypeLabel || source?.sourceSubtypeLabel || '';
  };
  knowledgeAssetAvailable = function(group, filename) {
    return newBook() ? Boolean(assetUrl(group, filename)) : original.knowledgeAssetAvailable(group, filename);
  };
  knowledgeAssetUrl = function(group, filename) {
    // This fixed portrait belongs to the unchanged guidance UI, not a word source.
    if (group === 'images' && filename === 'pronunciation-expert-yanling-v1.png') return original.knowledgeAssetUrl(group, filename);
    return newBook() ? assetUrl(group, filename) : original.knowledgeAssetUrl(group, filename);
  };
  resourceAnalysisAudioButton = function(filename, label) {
    if (!newBook()) return original.resourceAnalysisAudioButton(filename, label);
    const src = assetUrl('analysisAudio', filename);
    return src ? resourceInlineAudioButton(src, label) : '';
  };
  knowledgeItemsForQuestion = function(q, type) {
    if (!real(q)) return original.knowledgeItemsForQuestion(q, type);
    const resource = book.prototypeData?.textResources?.[`${q.setId}-${q.textNo}`];
    if (!resource || !real(resource)) return [];
    const number = Number(q.questionNo || 0);
    return (resource.categories?.[type] || []).filter(item => {
      if (!real(item) || !sourceResource(item) || Number(item.setId) !== Number(q.setId) || Number(item.textNo) !== Number(q.textNo)) return false;
      const target = String(item.targetArea || '录音稿');
      const itemNumber = Number(item.questionNumber || 0);
      // Explicit micro-skill question numbers take precedence over transcript sharing.
      if (type === '微技能') return itemNumber > 0 && itemNumber === number;
      return target === '录音稿' || !itemNumber || !number || itemNumber === number;
    });
  };

  // The user now requests every actual source paragraph, including the explanation
  // previously withheld for a formula mismatch. Restore the unchanged source text
  // only in the display copy; historical JSON and standard Word remain intact.
  resourceItemDetail = function(item) {
    const source = sourceResource(item);
    if (!source?.sourceOriginalExplanation || source.resourceType !== '语法') return original.resourceItemDetail(item);
    const display = { ...item, content: source.sourceContent,
      suppressExplanation: false, hiddenExplanationReason: '' };
    return original.resourceItemDetail(display);
  };

  // Standard Word uses “试题” for either the stem or an option. Keep that
  // source value intact and make it available only to question-area rendering.
  decorateResourceHighlights = function(text, q, targetAreas = '录音稿') {
    const areas = Array.isArray(targetAreas) ? [...targetAreas] : [targetAreas];
    if (real(q) && areas.some(area => area === '题干' || area === '答案' || /^选项/.test(area))) areas.push('试题');
    if (!real(q)) return original.decorateResourceHighlights(text, q, areas);
    const sourcePattern = resourceTargetPattern;
    resourceTargetPattern = function(target) {
      const matcher = sourcePattern(target);
      matcher.pattern = new RegExp(matcher.pattern.source, matcher.pattern.flags.includes('i') ? matcher.pattern.flags : matcher.pattern.flags + 'i');
      return matcher;
    };
    try { return original.decorateResourceHighlights(text, q, areas); }
    finally { resourceTargetPattern = sourcePattern; }
  };

  // Transcript rows may be retained across question switches by the baseline
  // renderer. Resolve a new-book highlight from its explicit question ID rather
  // than a retained sentence handler's previous question closure.
  function routeRealTranscriptHighlight(event) {
    if (state.maskTranscriptActive) return;
    const node = event.target.closest?.('[data-resource-highlight]');
    if (!node || !els.transcript.contains(node)) return;
    const question = getQuestion(node.dataset.resourceQuestionId);
    if (!real(question)) return;
    const type = node.dataset.resourceHighlight;
    const item = knowledgeItemsForQuestion(question, type)[Number(node.dataset.resourceIndex)];
    if (!item) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showResourcePopover(event, type, item);
  }
  els.transcript.addEventListener('click', routeRealTranscriptHighlight, true);
  els.transcript.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') routeRealTranscriptHighlight(event);
  }, true);

  const enhancements = window.DEMO_KNOWLEDGE_ENHANCEMENTS || {};
  const topics = enhancements.topicPairs || [];
  const topicIds = new Set(topics.map(item => item.analysisRecordId || item.sourceRecordId || String(item.analysisRow)));
  window.DEMO_KNOWLEDGE_ENHANCEMENTS = { ...enhancements,
    topicPairs: [...topics, ...(book.enhancements?.topicPairs || []).filter(item => {
      const id = item.analysisRecordId || item.sourceRecordId || String(item.analysisRow);
      return !topicIds.has(id) && resources.has(Number(item.analysisRow));
    })] };
  window.TEST_SINGLE_BOOK_RESOURCE_BRIDGE = Object.freeze({ bookKey: key,
    dataPolicy: 'real-only', dictionaryWords: words.size, sourceOnlyWords: sourceWords.size,
    analysisResources: resources.size, contextMappings: contexts.size,
    rendererBaseline: 'V1.2.11', sourceResource });
})();
