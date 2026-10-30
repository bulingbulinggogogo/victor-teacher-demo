/* Display ownership follows the supplied head, block key and sense binding.
   The underlying workbook records, supplements and media remain untouched. */
(() => {
  'use strict';
  const api = window.V1220WordDetail;
  if (!api?.finish || window.V1246BlockOwnership) return;
  const text = value => String(value ?? '').trim();
  const head = value => text(value).toLocaleLowerCase('en').replace(/’/g,"'").replace(/\s+/g,' ');
  const own = (object,key) => Object.prototype.hasOwnProperty.call(object,key);
  const source = () => window.SINGLE_BOOK_LATEST_WORD_DATA;
  const heads = word => new Set((word?.v1225MergedHeads?.length ? word.v1225MergedHeads : [word?.head || word?.word]).map(head).filter(Boolean));
  const isIdiom = row => text(row?.category) === '习语';
  function belongsToWord(row,word) {
    const allowed = heads(word);
    if (!allowed.has(head(row?.parentHead || row?.parentWord))) return false;
    // This reviewed display supplement is a different head's phrasal verb.
    // Retain its record in the original data, outside present's own block list.
    return !(row?.blockKey === 'demo-present-related-phrasal' && (allowed.has('present1') || allowed.has('present2')));
  }
  function sourceRows(word) {
    return (source()?.collocations || []).filter(row => belongsToWord(row,word));
  }
  function rows(word) {
    if (!word) return [];
    const original = sourceRows(word), byKey = new Map(original.map(row => [text(row.blockKey),row]));
    const candidates = [...(word.collocations || []),...original,
      ...(window.V1222SenseExamples?.phraseBlocks?.(word) || []),
      ...(window.V1222SenseExamples?.displayOnlyBlocks?.(word) || [])];
    const result = [], seen = new Set();
    candidates.forEach(candidate => {
      const key = text(candidate?.blockKey);
      if (!key || !text(candidate.phrase) || seen.has(key) || !belongsToWord(candidate,word)) return;
      const supplied = byKey.get(key);
      const row = supplied ? {...candidate,...supplied} : {...candidate};
      // Runtime scope is presentation metadata. It cannot erase a workbook's
      // valid parentSenseKey or change the source record into an unbound block.
      if (supplied && !own(supplied,'displayScope')) delete row.displayScope;
      if(window.V1267BlockCategories){row.sourceCategory=row.sourceCategory || row.category;row.category=window.V1267BlockCategories.categoryFor(row);}
      row.v1246BlockOwner = text(row.parentHead || row.parentWord);
      row.v1246BindingScope = text(row.parentSenseKey) && !row.unboundToSense ? 'sense' : 'word';
      result.push(row);seen.add(key);
    });
    return result;
  }
  function markForeignIllustrations(detail,result) {
    const word = result?.word || api.getModel?.(detail)?.word;
    const allowed = heads(word);
    if (!(allowed.has('present1') || allowed.has('present2'))) return;
    // The native navigation explicitly mounts this source example from light.
    // A peer-module adapter moves the existing node to its labelled example page.
    detail.querySelectorAll('[data-word-idiom-example]').forEach(node => {
      node.dataset.v1246SourceHead = 'light';
      node.dataset.v1246ForeignWord = 'true';
    });
  }
  function annotateOwnership(detail,result) {
    const word = result?.word || api.getModel?.(detail)?.word;
    if (!word) return;
    const byKey = new Map(rows(word).map(row => [row.blockKey,row]));
    detail.querySelectorAll('[data-block-key],[data-sense-block]').forEach(node => {
      const row = byKey.get(node.dataset.blockKey || node.dataset.senseBlock);
      if (!row) return;
      node.dataset.v1246ParentHead = text(row.parentHead || row.parentWord);
      node.dataset.v1246ParentSenseKey = text(row.parentSenseKey);
      node.dataset.v1246BindingScope = row.v1246BindingScope;
      if (row.source?.file) node.dataset.v1246SourceFile = row.source.file;
      if (row.source?.sheet) node.dataset.v1246SourceSheet = row.source.sheet;
      if (row.source?.row !== undefined) node.dataset.v1246SourceRow = String(row.source.row);
    });
  }
  const finish = api.finish;
  api.finish = function(detail,result) {
    markForeignIllustrations(detail,result);
    annotateOwnership(detail,result);
    return finish.apply(this,arguments);
  };
  window.V1246BlockOwnership = Object.freeze({
    rows,isIdiom,belongsToWord,
    inspect(word) {
      const current = word || api.getModel?.()?.word;
      if (!current) return null;
      const allowed = [...heads(current)], selected = rows(current);
      const candidates = [...(current.collocations || []),
        ...(window.V1222SenseExamples?.phraseBlocks?.(current) || []),
        ...(window.V1222SenseExamples?.displayOnlyBlocks?.(current) || [])];
      return {heads:allowed,rows:selected.map(row => ({
        blockKey:row.blockKey,parentHead:row.parentHead,parentSenseKey:row.parentSenseKey || null,
        bindingScope:row.v1246BindingScope,phrase:row.phrase,category:row.category,
        source:row.source,example:row.example || '',translation:row.translation || '',
        synonyms:row.synonyms || '',antonyms:row.antonyms || ''
      })),excluded:candidates.filter(row=>!belongsToWord(row,current)).map(row=>({blockKey:row.blockKey,parentHead:row.parentHead,phrase:row.phrase}))};
    }
  });
})();
