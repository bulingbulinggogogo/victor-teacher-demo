/* Word labels and supplied syllable text. This module never infers missing fields. */
(() => {
  'use strict';
  const syllableControls=new WeakMap(), labelStates=new WeakMap();
  const text = value => String(value ?? '').trim();
  const posFamily = value => {
    if (typeof knowledgePosFamily === 'function') return knowledgePosFamily(value);
    const pos = text(value).toLowerCase().replace(/\./g, '');
    return /^(v|vt|vi)(?:$|[&/])/.test(pos) ? 'v' : pos;
  };
  const posLabel = value => ({n:'n. 名词',v:'v. 动词',adj:'adj. 形容词',adv:'adv. 副词',abbr:'缩写'}[posFamily(value)] || text(value));
  const validLevel = (value,prefix) => {
    const match = text(value).match(new RegExp('^'+prefix+'([1-9][0-9]*)$','i'));
    return match ? Number(match[1]) : null;
  };
  function describe(word, options = {}) {
    const tags = {...(word?.labels || {}),...(word?.tags || {})};
    const suppliedFrequency = tags.sourceFrequency ?? word?.frequency;
    const frequency = text(suppliedFrequency) !== '' ? Number(suppliedFrequency) : null;
    const signal = Number.isInteger(frequency) && frequency >= 1 && frequency <= 5 ? frequency : null;
    const count = Number(options.caseCount);
    const examCount = options.caseCount !== null && options.caseCount !== undefined && Number.isInteger(count) && count > 0 ? count : null;
    const academic = /^AWL_[1-9][0-9]*$/i.test(text(tags.academicLevel)) ? text(tags.academicLevel).toUpperCase() : '';
    const curriculumValue = options.labelState?.curriculum || text(tags.juniorCurriculumStatus) || text(tags.curriculumStatus);
    const curriculum=curriculumValue.replace(/^课标词[·・\s]+(初中|高中)$/,'$1课标词').replace(/^课标合成词$/,'课标词的合成词').replace(/^课标派生词$/,'课标词的派生词');
    const derived = options.labelState?.derived || '';
    const reading = text(tags.readingLevel || word?.readingLevel);
    const keyDifficulty = text(tags.keyDifficulty) === '1' && (!options.labelState || options.labelState.id.startsWith('curriculum'));
    const selectedPOS = options.selectedPOS ? posFamily(options.selectedPOS) : '';
    const rows = (word?.pronunciations || []).filter(row => !selectedPOS || posFamily(row.pos || row.partOfSpeech) === selectedPOS);
    const levels = [], syllables = [];
    const seenLevels = new Set(), seenSyllables = new Map();
    rows.forEach(row => {
      const pos = posFamily(row.pos || row.partOfSpeech), speaking = validLevel(row.speakingLevel,'S'), writing = validLevel(row.writingLevel,'W');
      if (speaking !== null || writing !== null) {
        const key = JSON.stringify([pos,speaking,writing]);
        if (!seenLevels.has(key)) { seenLevels.add(key); levels.push({pos,posLabel:posLabel(pos),speaking,writing}); }
      }
      const supplied = text(row.syllables);
      if (!supplied) return;
      if (!seenSyllables.has(supplied)) {
        const group = {text:supplied,parts:[],partLabels:[]};
        seenSyllables.set(supplied,group); syllables.push(group);
      }
      const group = seenSyllables.get(supplied);
      if (pos && !group.parts.includes(pos)) { group.parts.push(pos); group.partLabels.push(posLabel(pos)); }
    });
    const levelSignatures = new Set(levels.map(row => JSON.stringify([row.speaking,row.writing])));
    return {examCount,signal,academic,curriculum,derived,reading,keyDifficulty,levels,syllables,showLevelPOS:levelSignatures.size > 1};
  }
  const element = (tag,className,value) => {
    const node = document.createElement(tag); node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  function tag(value,kind) {
    const node = element('span','v1227-word-tag',value);
    node.dataset.wordTag = kind; node.dataset.wordTagField = ({'exam-frequency':'exam-count','source-frequency':'word-frequency','key-difficulty':'teaching-priority'}[kind] || kind); return node;
  }
  function examTag(count, existing, openCases) {
    const button = existing || element('button','ke-exam-frequency');
    button.type = 'button'; button.classList.add('v1227-word-tag','v1227-exam-tag');
    button.dataset.wordTag = 'exam-frequency'; button.dataset.wordTagField = 'exam-count';
    button.title = '已收录高考例句次数';
    button.setAttribute('aria-label',`高考收录${count}，查看含义说明`);
    button.replaceChildren(document.createTextNode('高考收录'),element('span','v1227-exam-number',String(count)));
    if (!existing && openCases) button.addEventListener('click',openCases);
    return button;
  }
  function mountLabels(article, description, options = {}) {
    const term = article.querySelector('.knowledge-term'); if (!term) return;
    const oldButton = term.querySelector('.ke-exam-frequency');
    let host = term.querySelector(':scope > .v1227-word-labels');
    if (!host) { host=element('div','v1227-word-labels'); term.append(host); }
    let above=article.querySelector(':scope > .v107-detail-tags');if(!above){above=element('div','v1227-word-labels v107-detail-tags');article.prepend(above);}
    const children = [],labels=[];
    if (description.examCount !== null) children.push(examTag(description.examCount,oldButton,options.openCases));
    else oldButton?.remove();
    if (description.signal !== null) {
      const node = tag('','source-frequency'), signal = element('span','v1227-frequency-signal');
      signal.setAttribute('aria-hidden','true');
      for (let index=1;index<=5;index++) {
        const bar = element('i','v1227-frequency-bar'); bar.classList.toggle('is-on',index<=description.signal);
        bar.style.setProperty('--signal-step',index); signal.append(bar);
      }
      node.append(signal,document.createTextNode(`词频${description.signal}`));
      node.title = '词库词频，五级'; node.setAttribute('aria-label',`词库词频${description.signal}，五级中的第${description.signal}级`);
      children.push(node);
    }
    if (description.academic) labels.push(tag('AW','academic'));
    labels.push(...levelGroups(description.levels,false));
    if(description.reading)labels.push(tag(String(description.reading).replace(/^[A-Z]+(\d+)$/i,'R$1'),'reading-level'));
    if(description.derived)labels.push(tag(description.derived,'derived-status'));
    // These levels follow the selected POS in the unchanged header component.
    if (description.curriculum) labels.push(tag(description.curriculum,'curriculum'));
    if (description.keyDifficulty) labels.push(tag('重难词','key-difficulty'));
    host.replaceChildren(...children); host.hidden=!children.length;above.replaceChildren(...labels);above.hidden=!labels.length;host.classList.add("v107-detail-metrics");
    term.classList.toggle('v1227-has-metadata',Boolean(children.length));
  }
  function levelGroups(rows,showPOS=false) {
    return rows.map(row=>{
      const group=element('span','v1227-level-group'); group.dataset.levelPos=row.pos;
      group.dataset.metadataScope='part-of-speech';
      group.setAttribute('aria-label',`${row.posLabel}的朗文级别`);
      if(showPOS)group.append(element('span','v1227-level-pos',row.posLabel));
      if(row.speaking!==null)group.append(tag(`S${row.speaking}`,'spoken-level'));
      if(row.writing!==null)group.append(tag(`W${row.writing}`,'written-level'));
      return group;
    });
  }
  function mountPartMetadata(root,description,options={}) {
    root.querySelectorAll('.v1228-pos-levels').forEach(node=>node.remove());
    if(!options.mother || !description.levels.length)return;
    const groups=[...root.querySelectorAll('.v1227-meaning-group[data-v1227-pos]')];
    if(groups.length){
      groups.forEach(group=>{
        const pos=posFamily(group.dataset.v1227Pos),rows=description.levels.filter(row=>row.pos===pos);
        const heading=group.querySelector(':scope > .v1227-group-heading .v1227-fold-label');
        if(!rows.length || !heading)return;
        const host=element('span','v1228-pos-levels');host.dataset.levelPos=pos;
        host.dataset.metadataScope='part-of-speech';
        host.append(...levelGroups(rows));heading.append(host);
      });
      return;
    }
    // The first popup shows one current meaning. Keep the POS field explicitly
    // identified inside that meaning card rather than on the word's header.
    if(!options.mother)return;
    const card=root.querySelector('.resource-meanings');if(!card)return;
    const selected=options.selectedPOS?posFamily(options.selectedPOS):'';
    const rows=selected?description.levels.filter(row=>row.pos===selected):description.levels;
    if(!rows.length)return;
    const host=element('div','v1228-pos-levels v1228-mother-pos-levels');
    host.dataset.metadataScope='part-of-speech';host.append(...levelGroups(rows,true));card.prepend(host);
  }
  function mountSenseMetadata(root,word,options={}) {
    const senses=new Map((word.parts||[]).flatMap(part=>part.senses||[]).map(sense=>[String(sense.senseKey||sense.id),sense]));
    root.querySelectorAll('[data-latest-sense]').forEach(line=>{
      const sense=senses.get(String(line.dataset.latestSense)),host=line.querySelector('.resource-sense-meta');
      if(!sense||!host)return;
      const fields=['transitivity','countability','emphasis','register'];
      const children=fields.filter(field=>text(sense[field])).map(field=>{
        const item=element('span','v1228-sense-tag',text(sense[field]));item.dataset.senseTag=field;item.dataset.wordTagField='usage';return item;
      });
      host.replaceChildren(...children);host.dataset.metadataScope='sense';
    });
    // The mother popup's meaning remains the approved standard-Word context.
    // Keep its existing grammatical values rather than rematching a new sense.
    if(options.mother)root.querySelectorAll('.resource-sense-meta').forEach(host=>{
      host.dataset.metadataScope='sense';
      [...host.children].filter(node=>text(node.textContent)).forEach(node=>{node.classList.add('v1228-sense-tag');node.dataset.wordTagField='usage';});
    });
  }
  function headerMetadataRows(word,selectedPOS) {
    const pos=posFamily(selectedPOS || word?.parts?.[0]?.partOfSpeech);
    const part=(word?.parts || []).find(row=>posFamily(row.partOfSpeech || row.pos)===pos);
    const variants=(word?.displayVariants || []).filter(row=>text(row.label)!=='符号' && row.field!=='symbol').filter(row=>{
      const scope=row.pos || row.partOfSpeech || row.parts || row.posList;
      return !scope || (Array.isArray(scope)?scope:[scope]).some(value=>posFamily(value)===pos);
    }).map(row=>({...row,kind:'variant'}));
    const forms=part ? (window.V1220WordDetail?.inflectionRows?.(word,part) || []).map(row=>({...row,kind:'inflection'})) : [];
    return {pos,rows:[...variants,...forms]};
  }
  function mountHeaderMetadata(article,word,selectedPOS) {
    const description=headerMetadataRows(word,selectedPOS),detail=article.closest('#wordDetailDialog');
    const group=[...(detail?.querySelectorAll('.v1227-meaning-group[data-v1227-pos]') || [])].find(node=>posFamily(node.dataset.v1227Pos)===description.pos);
    const target=group?.querySelector(':scope > .resource-sense-list');
    let host=detail?.querySelector('[data-word-variants]') || article.querySelector('[data-word-variants]');
    if(!target){host?.remove();return;}
    if(!host && !description.rows.length)return;
    if(!host){host=element('dl','v1227-inflections');host.dataset.wordVariants='';}
    host.dataset.metadataScope='part-of-speech';host.dataset.headerPos=description.pos;
    host.setAttribute('aria-label',`${posLabel(description.pos)}词形信息`);
    host.replaceChildren(...description.rows.map(row=>{
      const pair=element('div','v1227-inflection');
      if(row.kind==='inflection'){
        pair.dataset.v1227Form=row.field;pair.dataset.v1227FormHead=row.head || word.head || '';
        if(row.source?.row)pair.dataset.v1227FormSourceRow=String(row.source.row);
      }
      if(row.mock)pair.dataset.wordMetadataDemonstration='true';
      if(text(row.value).length>20)pair.dataset.wordHeaderWide='true';
      pair.append(element('dt','',row.label),element('dd','',row.value));return pair;
    }));
    host.hidden=!description.rows.length;
    if(host.parentElement!==target || target.firstElementChild!==host)target.prepend(host);
  }
  function syllableSwap(word,original,selectedPOS='') {
    const candidates=describe(word,{selectedPOS}).syllables.map(row=>row.text);
    if(candidates.length!==1)return null;
    const supplied=candidates[0],normal=value=>text(value).replace(/\s+/g,'').toLocaleLowerCase('en');
    // Keep the source separator and spelling. A different word or an unsplit
    // source string cannot become a usable switch by guessing boundaries.
    if(!/[·\u00ad]/.test(supplied)||normal(supplied)===normal(original))return null;
    if(normal(supplied.replace(/[·\u00ad]/g,''))!==normal(original))return null;
    return {original:String(original),syllables:supplied};
  }
  function mountSyllableControl(detail,word,selectedPOS='') {
    detail.querySelectorAll('.v1227-syllable-disclosure,.v1228-syllable-word-toggle').forEach(node=>node.remove());
    const title=detail.querySelector('.vwn-word-intro .knowledge-word,.resource-popover-body > .knowledge-entry .knowledge-word');
    const previous=syllableControls.get(detail);
    const clear=()=>{
      if(previous?.title){
        previous.title.removeEventListener('click',previous.click);
        previous.title.removeEventListener('keydown',previous.keydown);
        previous.title.textContent=previous.original;
        ['role','tabindex','aria-pressed','aria-label','title','data-word-syllable-control'].forEach(name=>previous.title.removeAttribute(name));
      }
      syllableControls.delete(detail);delete detail.dataset.v1232SyllablesVisible;
    };
    if(!title){clear();return;}
    const original=previous?.title===title?previous.original:title.textContent;
    const swap=syllableSwap(word,original,selectedPOS);
    if(!swap){clear();return;}
    let model=previous?.title===title?previous:null;
    if(!model){
      clear();model={...swap,title,pressed:false};
      const toggle=()=>{
        model.pressed=!model.pressed;sync();
        window.WordDetailNavigation?.fit?.();
      };
      model.click=event=>{event.preventDefault();event.stopPropagation();toggle();};
      model.keydown=event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();event.stopPropagation();toggle();}};
      title.addEventListener('click',model.click);title.addEventListener('keydown',model.keydown);
      syllableControls.set(detail,model);
    }
    model.syllables=swap.syllables;
    function sync(){
      title.textContent=model.pressed?model.syllables:model.original;
      title.dataset.wordSyllableControl='';title.setAttribute('role','button');title.tabIndex=0;
      title.setAttribute('aria-pressed',String(model.pressed));
      const label=model.pressed?'恢复单词拼写':'显示音节拆分';title.setAttribute('aria-label',label);title.title=label;
      if(model.pressed)detail.dataset.v1232SyllablesVisible='true';else delete detail.dataset.v1232SyllablesVisible;
    }
    sync();
  }
  // Label meanings: Victoria University AWL /information/howto and Pearson Longman catalogue.
  // https://www.wgtn.ac.nz/lals/resources/academicwordlist/information/howto
  // https://www.pearson.com/content/dam/one-dot-com/one-dot-com/africa/Catalogue%20Files/ELT%20Catalogue/Pearson%202018%20Catalogue_WEB.pdf
  const tagHelp={
    'exam-frequency':'全部已收录高考例句的数量；与五格词频等级分别统计。',
    'source-frequency':'词库中的五级使用频率。亮起N格表示词频N，不是高考出现的次数。',
    academic:'AWL是Academic Word List（学术词汇表），收录跨学科的常见学术词族，帮助学术阅读与写作。数字表示所在子表，例如AWL_1表示第1子表。',
    'spoken-level':'S表示Spoken（口语）。S1、S2、S3分别标记口语最常见的前1000、2000、3000词。此标签对应当前词性的口语使用频率。',
    'written-level':'W表示Written（书面语），数字标示词语在书面语中的常用频率档位。W1属于最常用档；此标签随当前词性变化。',
    'reading-level':'阅读难度参考，帮助判断词汇与学习阶段的适配。',
    curriculum:'课标词表示列入本项目的课标词汇范围；小学、初中表示相应学段。本项目必修对应高一，选必（选择性必修）对应高二。合成词和派生词标签表示与课标词的构词关系。',
    'derived-status':'标记课标词相关派生词的学习范围：核心派生词是核心学习内容；非核心派生词用于拓展学习。',
    'key-difficulty':'该单词是本项目重点学习、讲解的词汇；此标记与各释义的 CEFR 语言难度等级分别记录。',
    'pos-exam':'当前词性在全部已收录高考例句中的次数，与高考列表使用相同数据源。',
    'sense-exam':'该释义在全部已收录高考例句中的次数，与高考列表使用相同数据源。'
  };
  function mountExplanations(detail,model) {
    detail.querySelectorAll('.v1227-word-tag,.v1228-sense-tag,.v1226-block-category,[data-word-tag-field="difficulty"]').forEach(node=>{
      // Exact sense destinations own their click; explanatory tag capture must
      // not intercept the navigation action or replace it with a help tooltip.
      if(node.matches('[data-v1241-sense-link]')){delete node.dataset.wordTagHelp;return;}
      node.dataset.wordTagHelp=node.dataset.wordTagField==='difficulty'?'该释义的 CEFR 语言难度等级：'+node.textContent.replace(/^难度\s*/, '')+'。':tagHelp[node.dataset.wordTag] || node.title || ('标签说明：'+node.textContent.trim());
      const level=node.textContent.trim().match(/^([SW])(\d+)$/);
      if(level)node.dataset.wordTagHelp=level[1]==='S'?`S表示Spoken（口语）。${level[0]}表示当前词性属于口语最常用的前${Number(level[2])*1000}词范围。`:`W表示Written（书面语）。${level[0]}表示当前词性的书面语使用频率第${level[2]}档；数字越小，使用越频繁。`;
      node.tabIndex=0;
    });
    if(detail.dataset.wordTagHelpBound)return;detail.dataset.wordTagHelpBound='true';
    let active=null,pinned=false,card=null;
    const inside=(node,root)=>node instanceof Element && root?.contains(node);
    function outside(event){if(card&&!card.hidden&&!inside(event.target,card)&&!inside(event.target,active))hide();}
    function hide(){if(card)card.hidden=true;active=null;pinned=false;document.removeEventListener('pointerdown',outside,true);}
    function show(node,pin=false){
      if(pinned&&!pin)return;
      active=node;pinned=pin;document.addEventListener('pointerdown',outside,true);
      if(!card){card=document.createElement('aside');card.className='resource-word-note';card.dataset.wordTagExplanation='';card.setAttribute('role','tooltip');detail.append(card);}
      card.dataset.wordTagPinned=String(pinned);
      const heading=document.createElement('h4'),copy=document.createElement('p');heading.textContent=node.textContent.trim();copy.textContent=node.dataset.wordTagHelp;card.replaceChildren(heading,copy);
      if(node.dataset.wordTag==='exam-frequency'){
        const link=document.createElement('button');link.type='button';link.className='v1220-related-link';link.textContent='查看高考真题';link.addEventListener('click',()=>{window.WordDetailNavigation?.select?.(detail,'cases');hide();});card.append(link);
      }
      card.hidden=false;const r=node.getBoundingClientRect(),d=detail.getBoundingClientRect();card.style.left=Math.max(0,Math.min(r.left-d.left,d.width-card.offsetWidth))+'px';card.style.top=Math.max(0,Math.min(r.bottom-d.top,d.height-card.offsetHeight))+'px';
    }
    detail.addEventListener('pointerover',event=>{const tag=event.target.closest('[data-word-tag-help]');if(tag)show(tag);});
    detail.addEventListener('pointerout',event=>{if(!pinned&&!inside(event.relatedTarget,active)&&!inside(event.relatedTarget,card))hide();});
    detail.addEventListener('focusin',event=>{const tag=event.target.closest('[data-word-tag-help]');if(tag)show(tag);});
    detail.addEventListener('focusout',event=>{if(!pinned&&!inside(event.relatedTarget,active)&&!inside(event.relatedTarget,card))hide();});
    detail.addEventListener('click',event=>{
      const tag=event.target.closest('[data-word-tag-help]');
      if(tag){event.preventDefault();event.stopImmediatePropagation();show(tag,true);}
      else if(!inside(event.target,card))hide();
    },true);
    detail.addEventListener('keydown',event=>{if(event.key==='Escape'&&card&&!card.hidden){event.preventDefault();event.stopImmediatePropagation();hide();}},true);
    detail.querySelector(':scope > .resource-popover-body')?.addEventListener('scroll',()=>{if(!pinned)hide();},{passive:true});
  }
  function mountLabelStates(detail,model) {
    const variants=model.word.labelStateVariants;if(!variants?.length || detail.querySelector('[data-word-label-states]'))return;
    const disclosure=document.createElement('details');disclosure.className='resource-word-note';const caption=document.createElement('summary');caption.textContent='标签状态';disclosure.append(caption);
    const host=document.createElement('div');host.dataset.wordLabelStates='';host.setAttribute('role','group');host.setAttribute('aria-label','标签状态');disclosure.append(host);
    variants.forEach((variant,index)=>{const button=document.createElement('button');button.type='button';button.className='v1220-related-link';button.textContent=variant.label;button.dataset.wordLabelState=variant.id;button.setAttribute('aria-selected',String(index===0));button.addEventListener('click',()=>{labelStates.set(detail,variant);host.querySelectorAll('button').forEach(other=>other.setAttribute('aria-selected',String(other===button)));enhanceDetail(detail,model);});host.append(button);});
    detail.querySelector('.vwn-panel[aria-labelledby$="-tab-meanings"] .vwn-panel-scroll')?.append(disclosure);
  }
  // First popups retain their approved compact V26 presentation and data.
  // New labels, POS metadata and syllable controls belong to word detail only.
  function enhanceArticle() {}
  function enhanceDetail(detail, suppliedModel) {
    const model=suppliedModel || window.V1220WordDetail?.getModel?.(detail);
    if(!model?.word) return;
    const article=detail.querySelector('.vwn-word-intro .knowledge-entry,.resource-popover-body > .knowledge-entry,.ke-original-word-content .knowledge-entry');
    if(!article) return;
    const casesPanel=detail.querySelector('[data-case-module="cases"],#ke-exam-cases');
    const rendered=casesPanel ? casesPanel.querySelectorAll('[data-latest-example]') : [];
    const count=rendered.length || casesPanel?.querySelectorAll('.ke-exam-case').length || 0;
    const selectedPOS=window.WordDetailNavigation?.getState?.(detail)?.pos || model.word.parts?.[0]?.partOfSpeech;
    const description=describe(model.word,{caseCount:count,selectedPOS,labelState:labelStates.get(detail)});
    mountLabels(article,description,{hasDemonstration:!!model.word.demonstrationFields?.length,openCases:()=>detail.querySelector('[data-word-module="cases"]')?.click()});
    mountPartMetadata(detail,description);
    mountSenseMetadata(detail,model.word);
    detail.querySelectorAll('.v1227-meaning-group .v1227-inflections').forEach(node=>node.remove());
    mountHeaderMetadata(article,model.word,selectedPOS);
    mountSyllableControl(detail,model.word,selectedPOS);
    article.querySelectorAll('[data-pronunciation-parts]').forEach(row=>{row.hidden=!row.dataset.pronunciationParts.split(',').some(pos=>posFamily(pos)===posFamily(selectedPOS));const label=row.querySelector('.resource-pronunciation-pos');if(label&&!row.hidden)label.textContent=selectedPOS;});
    mountExplanations(detail,model);
    // Label-state demonstration controls were removed by the user.
    article.dataset.v1227MetadataHead=model.word.head||model.word.word||'';
  }
  window.V1227WordMetadata={describe,headerMetadataRows,mountHeaderMetadata,syllableSwap,enhanceArticle,enhanceDetail,mountPartMetadata,mountSenseMetadata,mountSyllableControl};
})();
