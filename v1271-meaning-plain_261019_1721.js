/* V71: reuse native example/source nodes, replace only the obsolete inline
 * citation with field tags, and leave source rows, audio and disclosures intact. */
(() => {
  'use strict';
  if(window.V1271ExampleSources)return;
  const api=window.V1220WordDetail,examples=window.V1222SenseExamples;
  if(!api?.finish||!examples?.renderExample)return;
  const text=value=>String(value??'').trim();
  const clean=value=>['','—','-'].includes(text(value))?'':text(value);
  const first=(row,fields)=>{for(const field of fields){const value=clean(row?.[field]);if(value)return value;}return '';};
  const sourceNodes=example=>[...example.querySelectorAll('[data-v1224-citation]')].filter(node=>node.closest('.v1222-sense-example')===example);
  function tag(field,value,label=''){
    const node=document.createElement('span');node.className='v1225-example-topic-badge v1271-source-chip';node.dataset.wordTagField=field;node.textContent=value;
    if(label)node.setAttribute('aria-label',label+'：'+value);return node;
  }
  function fieldKey(node){return node.dataset.v1271SourceField||node.dataset.wordTagField||'';}
  function decorate(example,row,kind=''){
    if(!example?.matches?.('.v1222-sense-example'))return example;
    const line=example.querySelector(':scope > .v1223-sense-example-line');if(!line)return example;
    const citations=sourceNodes(example),citationText=citations.map(node=>text(node.textContent)).filter(Boolean).join(' · ');
    let footer=[...example.querySelectorAll('.v1225-example-topic-line')].find(node=>node.closest('.v1222-sense-example')===example);
    const existing=footer?[...footer.querySelectorAll('.v1225-example-topic-badge[data-word-tag-field]')]:[];
    const supplied=row&&typeof row==='object'?row:null;
    const hasFields=supplied&&['year','paper','sourceName','questionType','edition','textbookVersion','version','bookTitle','bookName','bookVolume','volume','unit','section','textNo','topic','主题','话题'].some(field=>clean(supplied[field]));
    if(!footer&&!citationText&&!hasFields){example.dataset.v1271Sources='true';return example;}
    if(!footer){footer=document.createElement('div');footer.className='v1225-example-topic-line';const folded=[...line.children].find(node=>node.classList.contains('v1266-example-children'));(folded||line).append(footer);}
    footer.classList.add('v1271-example-sources');
    const provenance=citations.map(node=>text(node.title)).filter(Boolean);if(!footer.title&&provenance.length)footer.title=provenance.join(' · ');
    function add(field,value,label=''){
      if(!clean(value))return;
      const present=[...footer.querySelectorAll('.v1225-example-topic-badge[data-word-tag-field]')].some(node=>fieldKey(node)===field&&text(node.textContent)===text(value));
      if(present)return;
      const node=tag(field,text(value),label),topic=footer.querySelector('[data-word-tag-field="topic"]');
      if(topic&&field!=='topic')topic.before(node);else footer.append(node);
    }
    if(supplied){
      const year=first(supplied,['year','examYear']);
      add('source-year',year?(/年$/.test(year)?year:year+'年'):'','年份');
      add('source-paper',first(supplied,['paper','sourceName','examPaper']),'试卷');
      add('source-question-type',clean(supplied.questionType),'题型');
      add('source-edition',first(supplied,['edition','textbookVersion','version']),'教材版本');
      add('source-book-title',first(supplied,['bookTitle','bookName']),'书名');
      add('source-book-volume',first(supplied,['bookVolume','volume']),'册别');
      add('source-unit',clean(supplied.unit),'单元');
      const textNo=clean(supplied.textNo),section=clean(supplied.section),nativeSection=existing.find(node=>node.dataset.wordTagField==='source-section');
      // Native exam tags may show textNo plus its existing question-option marker
      // as one source-section badge. Preserve that node/value and its marker.
      if(textNo&&nativeSection&&text(nativeSection.textContent).includes(textNo))nativeSection.dataset.v1271SourceField='source-text-no';
      if(textNo&&(!nativeSection||!text(nativeSection.textContent).includes(textNo)))add('source-text-no',textNo,'篇章');
      if(section)add('source-section',section,'篇章');
      add('topic',first(supplied,['topic','主题','话题']),'话题');
    }
    const usefulSource=[...footer.querySelectorAll('.v1225-example-topic-badge[data-word-tag-field]')].some(node=>node.dataset.wordTagField.startsWith('source'));
    // A source suffix without structured row fields is kept verbatim in one tag;
    // no year/paper/book classification is guessed from its punctuation.
    if(citationText&&!usefulSource)add('source',citationText,'来源');
    // Deduplicate only the same field and same value. Equal text in edition,
    // bookVolume, section etc. remains when it belongs to different fields.
    const seen=new Set();
    footer.querySelectorAll('.v1225-example-topic-badge[data-word-tag-field]').forEach(node=>{const key=fieldKey(node)+'\u0000'+text(node.textContent);if(seen.has(key))node.remove();else{seen.add(key);node.classList.add('v1271-source-chip');}});
    citations.forEach(node=>{
      const links=node.matches('a[href]')?[node]:[...node.querySelectorAll('a[href]')];
      links.forEach(link=>{link.removeAttribute('data-v1224-citation');link.classList.remove('v1222-sense-example-source','is-own-line');link.classList.add('v1225-example-topic-badge','v1271-source-chip');if(!link.dataset.wordTagField)link.dataset.wordTagField='source';footer.append(link);});
      if(!links.includes(node))node.remove();
    });
    example.querySelectorAll('.v1224-source-anchor').forEach(node=>{if(node.closest('.v1222-sense-example')===example&&!node.matches('a[href]')&&!node.querySelector('a[href]'))node.remove();});
    example.dataset.v1271Sources='true';return example;
  }
  function rowIndex(result){
    const index=new Map(),word=result?.word,options=result?.options||{};if(!word)return index;
    const add=(row,kind)=>{if(!row)return;for(const key of [row.exampleKey,row.recordKey,row.id,row.blockKey])if(text(key)&&!index.has(text(key)))index.set(text(key),{row,kind});};
    const words=[word,...(word.v1225OriginalWords||[])];
    words.forEach(sourceWord=>{
      [['examples','ordinary'],['listeningExamples','listening'],['textbookExamples','textbook']].forEach(([field,kind])=>(sourceWord[field]||[]).forEach(row=>add(row,kind)));
      (sourceWord.collocations||[]).forEach(row=>add(row,'ordinary'));
      examples.phraseBlocks?.(sourceWord)?.forEach(row=>add(row,'ordinary'));
    });
    api.displayBlocks?.(word)?.forEach(row=>add(row,'ordinary'));
    // The native sense API includes its exact retained listening ID bridges.
    (word.parts||[]).forEach(part=>(part.senses||[]).forEach(sense=>{
      const owner=window.V1225Present?.sourceWord?.(word,sense)||word;
      (examples.entries?.(owner,sense,part)||[]).forEach(entry=>add(entry.row,entry.kind));
    }));
    (api.cases?.({wordId:options.context?.word?.id,item:options.item,retained:options.retainedCases||[]})||[]).forEach(row=>add(row,'listening'));
    return index;
  }
  function refresh(detail=document.getElementById('wordDetailDialog'),result=detail&&api.getModel?.(detail)){
    if(detail?.id!=='wordDetailDialog')return;
    const index=rowIndex(result);
    detail.querySelectorAll('.v1222-sense-example').forEach(example=>{
      if(example.dataset.v1271Sources==='true')return;
      const key=example.dataset.senseExample||example.dataset.latestExample||example.dataset.blockExample||'',entry=index.get(key);
      decorate(example,entry?.row,entry?.kind||example.dataset.senseExampleKind||'');
    });
  }
  const finish=api.finish;
  api.finish=function(detail,result){const value=finish.apply(this,arguments);refresh(detail,result);return value;};
  let queued=false;
  const observer=new MutationObserver(records=>{
    const relevant=records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1&&(node.matches?.('.v1222-sense-example')||node.querySelector?.('.v1222-sense-example'))));
    if(relevant&&!queued){queued=true;queueMicrotask(()=>{queued=false;refresh();});}
  });
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  window.V1271ExampleSources=Object.freeze({decorate,refresh});
  queueMicrotask(()=>refresh());
})();
