/* Sense-linked examples from the latest supplied single-set workbook. */
(() => {
  'use strict';
  const BOOK = 'test-single-book';
  const kinds = [
    { field: 'examples', kind: 'ordinary', label: '单词例句' },
    { field: 'listeningExamples', kind: 'listening', label: '高考听力例句' },
    { field: 'textbookExamples', kind: 'textbook', label: '教材例句' }
  ];
  const text = value => String(value ?? '').trim();
  const esc = value => typeof escapeHtml === 'function' ? escapeHtml(String(value ?? '')) : String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const headKey = value => text(value).normalize('NFC').toLocaleLowerCase('en').replace(/’/g, "'").replace(/\s+/g, ' ');
  const meaningKey = value => text(value).normalize('NFC').replace(/\s+/g, ' ');
  // The workbook writes n, n., and n. [C]. A countability suffix is not a different POS.
  const posKey = value => {
    const match = text(value).toLocaleLowerCase('en').match(/^(adj|adv|pron|prep|conj|num|interj|det|aux|modal|n|vt|vi|v)(?=[.\s\[（(]|$)/);
    return match ? (/^v[ti]$/.test(match[1]) ? 'v' : match[1]) : text(value).toLocaleLowerCase('en');
  };
  const paperOrder = new Intl.Collator('zh-CN',{numeric:true,sensitivity:'base'});
  function orderedCases(rows) {
    const year = row => {
      const match = text(row?.year).match(/(?:19|20)\d{2}/);
      return match ? Number(match[0]) : -1;
    };
    const paper = row => text(row?.paper || row?.sourceName);
    return (rows || []).map((row,index)=>({row,index})).sort((a,b)=>{
      const years = year(b.row) - year(a.row);
      if (years) return years;
      const left=paper(a.row),right=paper(b.row);
      return (!left - !right) || paperOrder.compare(left,right) || a.index-b.index;
    }).map(entry=>entry.row);
  }
  function allSenses(word) {
    return (word?.parts || []).flatMap(part => (part.senses || []).map(sense => ({ sense, part })));
  }
  const retainedHitMappings = [
    { row:2, sense:63, meaning:'撞击；碰撞', english:'A lorry {hit} a car.' },
    { row:3, sense:67, meaning:'达到（某水平）', english:'The temperature in the south will {hit} 23 degrees in the early afternoon, but lower in the north, around 20 degrees.' },
    { row:4, sense:63, meaning:'撞击；碰撞', english:'Gosh, a train is coming soon. It’s going to {hit} it. Let’s move it away.' },
    { row:5, sense:71, meaning:'轰动一时/很受欢迎的人（或事物）', english:'They even made a video which has already become a {hit} on the Internet!' },
    { row:7, sense:71, meaning:'轰动一时/很受欢迎的人（或事物）', english:'Introduced two years ago, the policy has proved a huge {hit}.' },
    { row:8, sense:66, meaning:'到达（某地）', english:'Well, I usually {hit} the gym and exercise.' },
    { row:9, sense:64, meaning:'打击；侵袭；使受害', english:'Sydney and the New South Wales coast have been {hit}by heavy rains.' },
    { row:10, sense:71, meaning:'轰动一时/很受欢迎的人（或事物）', english:'Now, let’s play one of her greatest {hit} — **Show Me Your Love**.' }
  ];
  function retainedRows(word, kind) {
    if (kind !== 'listening' || word?.head !== 'hit') return [];
    const cases = window.TEST_SINGLE_BOOK?.enhancements?.examCasesByWordId?.['2555'] || [];
    return retainedHitMappings.flatMap(mapping => {
      const matches = cases.filter(row => row.realOnly === true && row.sourceWorkbookRow === mapping.row && text(row.english) === mapping.english);
      const expected = allSenses(word).filter(({sense}) => sense.senseKey === 'latest-sense:hit:' + mapping.sense && meaningKey(sense.chinese) === mapping.meaning);
      if (matches.length !== 1 || expected.length !== 1) return [];
      // Row 8: exact 0938 解析!K6988:M6988 -> 释义!E3395:J3395,
      // with the same complete sentence in official 录音稿!G1046.
      // Other seven bridges were explicitly confirmed by the user on 2026-10-15.
      // Row 6 (brain) has no safe meaning bridge and stays in the existing case list only.
      const mappingSource = mapping.row === 8
        ? { file:'听力一期一批_听力解析_260929_1459.xlsx', sheet:'解析', range:'K6988:M6988', senseId:2363, dictionaryRange:'释义!E3395:J3395', transcriptRange:'录音稿!G1046' }
        : { decision:'用户确认7条逐句释义对应；brain仅留案例列表', confirmedDate:'2026-10-15', sourceWorkbookRow:mapping.row };
      return [{ ...matches[0], exampleKey:'retained-listening:hit:source' + mapping.row, head:'hit', partOfSpeech:expected[0].part.partOfSpeech, meaning:mapping.meaning, senseKey:expected[0].sense.senseKey, mappingSource }];
    });
  }
  function sourceRows(word, group) {
    if (group.kind === 'listening' && window.V1227ExamDistribution) {
      return orderedCases(window.V1227ExamDistribution.sourceRows(word,{bookKey:BOOK},retainedRows(word,group.kind)));
    }
    const rows = [...(word?.[group.field] || []), ...retainedRows(word,group.kind)];
    return group.kind === 'listening' ? orderedCases(rows) : rows;
  }
  function resolveSense(word, row) {
    if (!word || headKey(word.head || word.word) !== headKey(row.head)) return null;
    const targetKey = text(row.senseKey || row.meaningKey);
    const targetId = row.senseId ?? row.meaningId;
    const senses = allSenses(word);
    if (targetKey) {
      const explicit = senses.filter(({sense}) => text(sense.senseKey) === targetKey);
      return explicit.length === 1 ? explicit[0] : null;
    }
    if (targetId !== undefined && targetId !== null && targetId !== '') {
      const explicit = senses.filter(({sense}) => String(sense.id ?? sense.senseId) === String(targetId));
      return explicit.length === 1 ? explicit[0] : null;
    }
    // No substring matching, semantic guesses, or first-result fallback.
    if (!text(row.meaning) || !text(row.partOfSpeech)) return null;
    const exact = senses.filter(({sense,part}) =>
      meaningKey(sense.chinese) === meaningKey(row.meaning) &&
      posKey(part.partOfSpeech || sense.partOfSpeech) === posKey(row.partOfSpeech));
    return exact.length === 1 ? exact[0] : null;
  }
  function entries(word, sense, part) {
    if (!word || !sense) return [];
    const key = text(sense.senseKey || sense.id);
    return kinds.flatMap(group => sourceRows(word,group).filter(row => {
      if (!text(row.sentence || row.english)) return false;
      if (group.kind === 'listening' && row.realOnly !== true && row.mock !== true) return false;
      const match = resolveSense(word,row);
      return match && text(match.sense.senseKey || match.sense.id) === key &&
        posKey(match.part.partOfSpeech) === posKey(part?.partOfSpeech || sense.partOfSpeech);
    }).map(row => ({ ...group, row })));
  }
  function rich(row, field, fallback, options = {}) {
    const value = String(fallback ?? row?.[field] ?? '');
    const runs = row?.sourceRichTextRuns?.[field] || row?.richText?.[field] || row?.sourceRichText?.[field];
    if (Array.isArray(runs) && runs.map(run => run.text || '').join('') === value) {
      return runs.map(run => {
        let copy = esc(run.text || '');
        if (run.bold) copy = '<strong>' + copy + '</strong>';
        if (run.italic) copy = '<em>' + copy + '</em>';
        if (run.underline) copy = '<u>' + copy + '</u>';
        return run.isRed && !options.neutral ? '<span class="v1220-source-red">' + copy + '</span>' : copy;
      }).join('');
    }
    return typeof renderResourceMarkup === 'function' ? renderResourceMarkup(value) : esc(value);
  }
  function supplementFor(row, kind) {
    return kind === 'listening' ? window.V1220_MEDIA_SUPPLEMENT?.listening?.[row.exampleKey] : null;
  }
  function exampleAudioDecision(row, supplement) {
    if(window.V12137ExampleAudio?.owns(row)&&window.V12137ExampleAudio.decide(row).status!=='exact-file')return {url:'',status:'blocked',reason:'新增例句录音身份未通过统一校验'};
    const direct=text(row.audioUrl),candidate=direct?row:supplement,url=text(candidate?.audioUrl);
    if(!url)return {url:'',status:'not-supplied',reason:'未提供例句音频'};
    const exactRecord=Boolean(text(row.exampleKey||row.blockKey) && row.source?.file && row.source?.sheet && Number(row.source?.row)>0);
    const identity=direct ? exactRecord : exactRecord && supplement.exampleKey===row.exampleKey &&
      headKey(supplement.head)===headKey(row.head) &&
      headKey(supplement.english||supplement.sentence)===headKey(row.english||row.sentence) &&
      String(supplement.year||'')===String(row.year||'') &&
      headKey(supplement.paper||supplement.sourceName)===headKey(row.paper||row.sourceName);
    const single=candidate.isSingleSentenceAudio===true && candidate.optionIsSpokenInRecording!==false;
    if(!identity || !single)return {url:'',originalURL:url,status:'blocked',reason:!identity?'缺少精确例句来源身份支持':candidate.optionIsSpokenInRecording===false?'题目选项未在所关联录音中朗读':'仅相关整段录音或未证明为本句单独音频'};
    return {url,status:'exact-sentence',reason:'精确例句身份及单句音频证明'};
  }
  function exactExampleAudio(row, supplement) { return exampleAudioDecision(row,supplement).url; }
  function sourceLabel(row, kind, supplement) {
    const option = ['option','question-option'].includes(row.sourceType) || supplement?.sourceType === 'option';
    const source = kind === 'textbook'
      ? [row.edition || row.textbookVersion || row.version, row.bookVolume || row.volume, row.unit, row.section]
      : kind === 'listening'
        ? [row.year ? row.year + '年' : '', row.paper || row.sourceName, row.questionType && row.questionType !== '听力' ? row.questionType : '', row.textNo && row.textNo !== '—' ? row.textNo : (supplement?.textNo ? 'Text ' + supplement.textNo : ''), option ? '题目选项' : '']
        : [];
    return source.filter(Boolean).join(' · ');
  }
  function sourceTags(row,kind,supplement,fallback='') {
    if(kind!=='listening')return '';
    const clean=value=>['','—','-'].includes(text(value))?'':text(value);
    const year=clean(row.year),option=['option','question-option'].includes(row.sourceType)||supplement?.sourceType==='option';
    const section=clean(row.textNo)||clean(row.section)||(clean(supplement?.textNo)?'Text '+clean(supplement.textNo):'');
    const fields=[
      ['source-year',year?(/年$/.test(year)?year:year+'年'):'','年份'],
      ['source-paper',clean(row.paper)||clean(row.sourceName),'试卷'],
      ['source-question-type',clean(row.questionType),'题型'],
      ['source-section',[section,option?'题目选项':''].filter(Boolean).join(' · '),'篇章']
    ].filter(([,value])=>value);
    if(!fields.length&&clean(fallback))fields.push(['source',clean(fallback),'来源']);
    return fields.map(([field,value,label])=>'<span class="v1225-example-topic-badge" data-word-tag-field="'+field+'" aria-label="'+label+'：'+esc(value)+'">'+esc(value)+'</span>').join(' ');
  }
  function blockMatchesSense(row, word, sense, part) {
      if (row.unboundToSense || !text(row.parentMeaning) || !text(row.phrase)) return false;
      if (headKey(row.parentHead) !== headKey(word.head || word.word)) return false;
      const key = text(sense.senseKey || sense.id);
      if (text(row.parentSenseKey)) return text(row.parentSenseKey) === key;
      const matches = allSenses(word).filter(({sense:target,part:targetPart}) =>
        meaningKey(target.chinese) === meaningKey(row.parentMeaning) &&
        posKey(targetPart.partOfSpeech) === posKey(row.parentPartOfSpeech));
      return matches.length === 1 && text(matches[0].sense.senseKey || matches[0].sense.id) === key &&
        posKey(part?.partOfSpeech || sense.partOfSpeech) === posKey(row.parentPartOfSpeech);
  }
  function blocks(word, sense, part) {
    return [...(word?.collocations || []),...phraseBlocks(word),...displayOnlyBlocks(word)].filter(row=>blockMatchesSense(row,word,sense,part)).map(row=>window.V1267BlockCategories?.normalize(row) || row);
  }
  // Only move citations which are explicitly printed at the end of the source sentence.
  // The underlying sentence and rich-text records remain unchanged.
  function sentenceAndCitation(row, field, kind) {
    const value = String(row[field] ?? row.sentence ?? row.english ?? '');
    if (kind !== 'ordinary') return { value, citation:'', end:value.length };
    const match = value.match(/\s*[(（]([^()（）]*(?:(?:19|20)\d{2}|牛津词典|外研\d)[^()（）]*)[)）]\s*$/);
    return match ? { value:value.slice(0,match.index), citation:match[1].trim(), end:match.index } : { value, citation:'', end:value.length };
  }
  function sentenceRich(row, field, split) {
    const original = String(row[field] ?? row.sentence ?? row.english ?? '');
    if (split.end === original.length) return rich(row,field,original);
    const source = row?.sourceRichTextRuns?.[field] || row?.richText?.[field] || row?.sourceRichText?.[field];
    if (!Array.isArray(source) || source.map(run=>run.text || '').join('') !== original) {
      return typeof renderResourceMarkup === 'function' ? renderResourceMarkup(split.value) : esc(split.value);
    }
    let remaining = split.end;
    const sliced = source.flatMap(run => {
      if (remaining <= 0) return [];
      const value = String(run.text || '').slice(0,remaining); remaining -= value.length;
      return [{ ...run, text:value }];
    });
    return rich({ [field]:split.value, sourceRichTextRuns:{ [field]:sliced } },field,split.value);
  }
  // Word-example records remain word examples, even when their text contains a
  // known phrase. Only the block record's own example belongs under a block.
  function isPhraseRecord() { return false; }
  function phraseBlocks() { return []; }
  function isWordExample(row) { return !!sentenceValue(row); }
  const sentenceValue = row => text(row?.sentence ?? row?.english ?? row?.example);
  function boldSpans(row) {
    const field = row?.sentence !== undefined ? 'sentence' : row?.english !== undefined ? 'english' : 'example';
    const value = String(row?.[field] ?? '');
    const runs = row?.sourceRichTextRuns?.[field] || row?.richText?.[field] || row?.sourceRichText?.[field];
    if (!Array.isArray(runs) || runs.map(run=>run.text || '').join('') !== value) return [];
    const spans=[];let current='';
    runs.forEach(run=>{if(run.bold)current+=run.text || '';else if(current){spans.push(text(current));current='';}});
    if(current)spans.push(text(current));
    return spans.filter(Boolean);
  }
  function sourceWordFor(row, word) {
    const allowed = word ? word.v1225MergedHeads || [word.head || word.word] : null;
    if (allowed && !allowed.some(head=>headKey(head)===headKey(row?.head))) return null;
    const raw = window.SINGLE_BOOK_LATEST_WORD_DATA?.wordsByHead?.[row?.head];
    return raw || (word && headKey(word.head || word.word)===headKey(row?.head) ? word : null);
  }
  function blockExampleBinding() { return null; }
  function displayOnlyBlocks() { return []; }
  function blockEntries(word, block) {
    const original=window.SINGLE_BOOK_LATEST_WORD_DATA?.wordsByHead?.[block?.parentHead] || word;
    if(!original || !block?.blockKey)return [];
    return kinds.flatMap(group=>sourceRows(original,group).flatMap(row=>{
      const binding=blockExampleBinding(row,word);
      return binding?.targetBlockKey===block.blockKey ? [{row,kind:group.kind,binding}] : [];
    }));
  }
  function renderBlockExamples(word, block) {
    return blockEntries(word,block).map(({row,kind,binding})=>renderExample(row,kind,
      `data-sense-example="${esc(row.exampleKey)}" data-sense-example-kind="${esc(kind)}" data-v1228-block-target="${esc(binding.targetBlockKey)}"`,
      kind==='ordinary' ? {label:'词块例句',inlineSense:true} : {inlineSense:true})).join('');
  }
  function exampleLabel(row,kind) {
    return kind === 'ordinary' && isPhraseRecord(row) ? '词块' : kind === 'ordinary' && blockExampleBinding(row) ? '词块例句' : kind === 'textbook' ? '教材例句' : kind === 'listening' ? '高考例句' : '单词例句';
  }

function sentenceWithInlineAudio(html,audio){
 const root=document.createElement('span');root.innerHTML=html;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node,last;
 while(node=walker.nextNode())if(node.textContent.trim())last=node;
 if(!last)return html+audio;
 const match=/\S+\s*$/.exec(last.textContent),range=document.createRange();
 range.setStart(last,match.index);range.setEnd(root,root.childNodes.length);
 const tail=document.createElement('span');tail.className='v134-sentence-tail';tail.append(range.extractContents());
 tail.insertAdjacentHTML('beforeend','&nbsp;'+audio);root.append(tail);return root.innerHTML;
}
  function renderExample(row, kind, attributes = '', display = {}) {
    if(row.blockKey)row={...row,audioUrl:row.exampleAudioUrl||'',audioSource:row.exampleAudioSource,isSingleSentenceAudio:!!row.exampleAudioUrl,optionIsSpokenInRecording:true};
    const supplement = supplementFor(row,kind);
    const url = exactExampleAudio(row,supplement);
    const audioLabel = supplement?.label || '播放例句';
    const field = row.sentence !== undefined ? 'sentence' : row.english !== undefined ? 'english' : 'example';
    const split = sentenceAndCitation(row,field,kind);
    const endMark = window.V1227ExamNavigation?.exampleEndMark?.(row,kind,attributes) || '';
    const source = sourceLabel(row,kind,supplement) || split.citation;
    const label = text(display.label) || exampleLabel(row,kind);
    const sourceRef = row.source ? [row.source.file,row.source.sheet,row.source.row ? '第' + row.source.row + '行' : row.source.range].filter(Boolean).join(' · ') : source;
    const owned=window.V12137ExampleAudio?.owns(row)===true;
    const policyAudio=window.V12137ExampleAudio?.button(row)||'';
    const audio=policyAudio||(!owned&&url&&typeof resourceInlineAudioButton==='function'?resourceInlineAudioButton(url,audioLabel):'');
    const joinedSentenceAudio=!!policyAudio;
    const englishContent=joinedSentenceAudio?sentenceWithInlineAudio(sentenceRich(row,field,split)+endMark,audio):sentenceRich(row,field,split)+endMark;
    const topic = text(row.topic || row['主题'] || row['话题']);
    const sourcePOS = display.inlineSense ? '' : text(display.partOfSpeech);
    const target=kind==='listening'&&!display.inlineSense?resolveSense(sourceWordFor(row),row):null;
    const targetKey=target?text(target.sense.senseKey || target.sense.id):'';
    const meaningTag=targetKey?'<button type="button" class="v1227-word-tag" data-word-tag="exam-meaning" data-word-tag-field="usage" data-v1241-sense-link="'+esc(targetKey)+'" data-v1241-sense-pos="'+esc(target.part.partOfSpeech)+'" title="查看该释义及全部内容">'+esc(row.meaning)+'</button>':'<span class="v1227-word-tag" data-word-tag="exam-meaning" data-word-tag-field="usage">'+esc(row.meaning)+'</span>';
    const meaningMetadata=kind==='listening' && !display.inlineSense && text(row.meaning) ? '<div class="resource-sense-meta" data-exam-sense><span class="v1229-example-pos" data-word-tag-field="pos" aria-label="词性">'+esc(row.partOfSpeech || '')+'</span>'+meaningTag+'</div>' : '';
    const kindBadge = '<span class="v1223-example-kind" data-word-tag-field="source">' + esc(label) + '</span>';
    const sourceTag=sourceTags(row,kind,supplement,source);
    const topicTag=['listening','textbook'].includes(kind) && topic ? '<span class="v1225-example-topic-badge" data-word-tag-field="topic" aria-label="话题：'+esc(topic)+'">'+esc(topic)+'</span>' : '';
    const metadataLine=sourceTag || topicTag ? '<div class="v1225-example-topic-line">'+sourceTag+(sourceTag&&topicTag?' ':'')+topicTag+'</div>' : '';
    const labels = sourcePOS ? '<span class="v1229-example-labels">' + kindBadge + '<span class="v1229-example-pos" data-word-tag-field="pos" data-v1229-source-pos="' + esc(sourcePOS) + '" aria-label="词性：' + esc(sourcePOS) + '">' + esc(sourcePOS) + '</span></span>' : kindBadge;
    return '<article class="v1222-sense-example" ' + attributes + '>'+meaningMetadata+'<div class="v1223-sense-example-line">' + labels + '<div class="v1223-example-text"><span class="v1223-example-copy">' + englishContent + '</span>' + (!joinedSentenceAudio && audio ? ' ' + audio : '') + (source ? '<span class="v1224-source-anchor" aria-hidden="true"></span><span class="v1222-sense-example-source" data-v1224-citation title="' + esc(sourceRef) + '">' + esc(source) + '</span>' : '') + '</div>' + (row.translation ? '<p class="v1222-sense-example-translation">' + rich(row,'translation') + '</p>' : '') + metadataLine + '</div></article>';
  }
  function standaloneExample(row,kind) {
    const attrs='data-latest-example="'+esc(row.exampleKey||'')+'"';
    let html=renderExample(row,kind,attrs,kind==='ordinary' ? {partOfSpeech:row.partOfSpeech} : {});
    html=html.replace('class="v1222-sense-example"','class="v1222-sense-example v1220-example'+(kind==='listening'?' ke-exam-case':'')+'"');
    if(row.topic && !['listening','textbook'].includes(kind))html=html.replace('</article>','<p class="v1220-example-topic">'+esc(row.topic)+'</p></article>');
    return html;
  }
  function groupedExamplePage(rows,kind) {
    const groups=new Map();
    const group=(label,children,level=0)=>`<section class="v1228-example-group v1228-example-group-level-${level}" data-v1228-example-group="${kind}"${label ? ` aria-label="${esc(label)}"` : ''}>${label ? `<h${level?5:4} class="v1228-example-group-heading">${esc(label)}</h${level?5:4}>` : ''}<div class="v1228-example-group-body">${children}</div></section>`;
    if(kind==='listening'){
      rows.forEach(row=>{const year=text(row.year).match(/(?:19|20)\d{2}/)?.[0] || '';if(!groups.has(year))groups.set(year,[]);groups.get(year).push(row);});
      return [...groups].map(([year,entries])=>group(year ? year+'年' : '',entries.map(row=>standaloneExample(row,kind)).join(''))).join('');
    }
    rows.forEach(row=>{
      const edition=text(row.edition || row.textbookVersion || row.version),book=text(row.bookTitle || row.bookName || row.bookVolume || row.volume);
      if(!groups.has(edition))groups.set(edition,new Map());
      const books=groups.get(edition);if(!books.has(book))books.set(book,[]);books.get(book).push(row);
    });
    return [...groups].map(([edition,books])=>group(edition,[...books].map(([book,entries])=>group(book,entries.map(row=>standaloneExample(row,kind)).join(''),1)).join(''))).join('');
  }
  function updateVisibleGroups(root=document) {
    const groups=[...root.querySelectorAll('[data-v1228-example-group]')].reverse();
    groups.forEach(group=>{const show=[...group.querySelectorAll('.v1220-example')].some(row=>!row.hidden);if(group.hidden===show)group.hidden=!show;});
    return {total:groups.length,visible:groups.filter(group=>!group.hidden).length};
  }
  function renderPage(rows,kind) {
    const ordered=kind==='listening' ? orderedCases(rows) : rows || [];
    const visibleRows=ordered.filter(row=>isWordExample(row,kind));
    const grouped=['listening','textbook'].includes(kind);
    const body=grouped ? groupedExamplePage(visibleRows,kind) : visibleRows.map(row=>standaloneExample(row,kind)).join('');
    return body ? '<div class="v1222-sense-examples v1225-example-page'+(grouped?' v1228-example-groups':'')+'" data-example-page-kind="'+esc(kind)+'">'+body+'</div>' : '';
  }
  function render(word, sense, part) {
    const rows = entries(word,sense,part);
    const linkedBlocks = blocks(word,sense,part);
    if (!rows.length && !linkedBlocks.length) return '';
    const attached=new Set(linkedBlocks.flatMap(block=>blockEntries(word,block).map(entry=>entry.row.exampleKey)));
    const blockHTML = linkedBlocks.map(row => '<article class="v1223-sense-block" data-sense-block="' + esc(row.blockKey) + '" data-block-category="' + esc(row.category) + '"><p class="v1223-sense-block-heading"><span class="v1223-block-kind" data-word-tag-field="usage">' + '词块' + '</span>' + (row.category ? '<span class="v1224-block-category" data-word-tag-field="usage">' + esc(row.category) + '</span> ' : '') + '<strong>' + rich(row,'phrase') + '</strong>' + (text(row.phraseChinese || row.chinese) ? ' <span class="v1223-block-meaning">' + rich(row,'chinese',row.phraseChinese || row.chinese,{neutral:true}) + '</span>' : '') + (row.audioUrl ? ' '+resourceInlineAudioButton(row.audioUrl,'播放词块：'+row.phrase) : '') + '</p>' + (row.usage || row.register ? '<p class="v1223-sense-block-usage">' + esc([row.usage,row.register].filter(Boolean).join(' ')) + '</p>' : '') + (row.example ? renderExample(row,'ordinary','data-block-example="' + esc(row.blockKey) + '"',{label:'词块例句'}) : '') + renderBlockExamples(word,row) + '</article>').join('');
    return '<div class="v1222-sense-examples" data-sense-examples="' + esc(sense.senseKey || sense.id) + '">' + blockHTML + rows.filter(({row,kind})=>!attached.has(row.exampleKey) && isWordExample(row,kind,word)).map(({row,kind}) => renderExample(row,kind,'data-sense-example="' + esc(row.exampleKey) + '" data-sense-example-kind="' + kind + '"',{inlineSense:true})).join('') + '</div>';
  }
  function audit() {
    const data = window.SINGLE_BOOK_LATEST_WORD_DATA;
    const workbookRows = group => group.kind === 'listening' && window.V1227_GAOKAO_DATA?.records ? window.V1227_GAOKAO_DATA.records : data?.[group.field] || [];
    const rows = kinds.flatMap(group => [...workbookRows(group), ...retainedRows(data?.wordsByHead?.hit,group.kind)].map(row => {
      const word = data?.wordsByHead?.[row.head];
      const match = resolveSense(word,row);
      return { exampleKey:row.exampleKey, kind:group.kind, head:row.head, pos:row.partOfSpeech, meaning:row.meaning, source:row.source, mappingSource:row.mappingSource || null, senseKey:match?.sense?.senseKey || null, matched:!!match };
    }));
    return { bookKey:BOOK, latestWorkbookTotal:kinds.reduce((n,group)=>n+workbookRows(group).length,0), retainedWithExplicitMapping:rows.filter(row=>row.exampleKey.startsWith('retained-listening:')).length, total:rows.length, matched:rows.filter(row=>row.matched).length, unmatched:rows.filter(row=>!row.matched), byKind:Object.fromEntries(kinds.map(group=>[group.kind,rows.filter(row=>row.kind===group.kind).length])), rows };
  }
  let citationFrame = 0;
  const measuredWidths = new WeakMap(), observedFlows = new Set();
  function layoutCitations(root = document) {
    const sources = root.querySelectorAll('[data-v1224-citation]');
    sources.forEach(source => {
      const flow = source.parentElement, anchor = flow?.querySelector('.v1224-source-anchor');
      if (!flow || !anchor || !flow.getClientRects().length || flow.getBoundingClientRect().width < 1) return;
      // Range measures the printed citation text without taking it out of flow.
      // This avoids temporary class/style mutations awakening the shared dialog observers.
      const range=document.createRange();range.selectNodeContents(source);
      const printed=[...range.getClientRects()].filter(rect=>rect.width>.1 && rect.height>.1);
      const naturalWidth=Math.max(0,...printed.map(rect=>rect.width));
      const flowRect = flow.getBoundingClientRect(), anchorRect = anchor.getBoundingClientRect();
      const gap = parseFloat(getComputedStyle(flow).fontSize) * .4;
      const room = flowRect.right - anchorRect.left;
      const fits = printed.length<=1 && naturalWidth + gap <= room + .25;
      if(source.classList.contains('is-own-line')===fits)source.classList.toggle('is-own-line',!fits);
      const margin=fits ? Math.max(gap,Math.floor((room-naturalWidth)*2)/2)+'px' : '';
      if(source.style.marginInlineStart!==margin)margin?source.style.marginInlineStart=margin:source.style.removeProperty('margin-inline-start');
      const layout=fits?'inline':'new-line';
      if(source.dataset.citationLayout!==layout)source.dataset.citationLayout=layout;
    });
    return [...sources].filter(source=>source.getClientRects().length).map(source=>({
      text:source.textContent,layout:source.dataset.citationLayout,
      sourceRect:source.getBoundingClientRect().toJSON(),flowRect:source.parentElement.getBoundingClientRect().toJSON()
    }));
  }
  function scheduleCitations() {
    if (!citationFrame) citationFrame = requestAnimationFrame(() => {citationFrame=0;layoutCitations();});
  }
  const citationResize = typeof ResizeObserver === 'function' ? new ResizeObserver(entries => {
    let changed=false;
    entries.forEach(entry=>{const width=Math.round(entry.contentRect.width*2)/2;if(measuredWidths.get(entry.target)!==width){measuredWidths.set(entry.target,width);changed=true;}});
    if(changed)scheduleCitations();
  }) : null;
  function observeCitations(root=document) {
    observedFlows.forEach(flow=>{if(!flow.isConnected){citationResize?.unobserve(flow);observedFlows.delete(flow);}});
    root.querySelectorAll('.v1223-example-text').forEach(flow=>{if(!observedFlows.has(flow)){citationResize?.observe(flow);observedFlows.add(flow);}});
    scheduleCitations();
  }
  if(document.body) {
    new MutationObserver(records=>{
      const relevant=records.some(record=>!record.target.closest?.('[data-v1224-citation]') &&
        (record.type!=='childList' || [...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===Node.ELEMENT_NODE)));
      if(relevant)observeCitations();
    }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','style','data-font-size','data-demo-palette','data-theme-kind']});
    observeCitations();
  }
  window.addEventListener('resize',scheduleCitations);
  document.fonts?.addEventListener?.('loadingdone',scheduleCitations);
  window.V1222SenseExamples = { exactExampleAudio, exampleAudioDecision, render, entries, resolveSense, blocks, audit, layoutCitations, exampleLabel, isPhraseRecord, renderExample, renderPage,
    orderedCases,blockExampleBinding,displayOnlyBlocks,phraseBlocks,isWordExample,blockEntries,renderBlockExamples,boldSpans,updateVisibleGroups,sourceTags };
})();

