/* Vocabulary explanations follow their recorded source kind and label.
 * Only exact formatted-text duplicates or a Word-declared replacement merge. */
(() => {
  'use strict';
  const api=window.V1220WordDetail;
  if(!api?.render || window.V1235NoteModules)return;
  const BOOK='test-single-book',titles={semantic:'语义推导',formation:'构词点拨',etymology:'词源故事',contrast:'辨析'};
  const noteSelector='.v1220-note,.resource-word-note,.knowledge-explanation';
  const text=value=>String(value??'').trim();
  const esc=value=>escapeHtml(String(value??''));
  const normalized=value=>String(value??'').normalize('NFC').replace(/[\s\u200b\u200c\u200d\ufeff\u00ad]+/g,'');
  function plainHTML(html){const node=document.createElement('div');node.innerHTML=html;return node.textContent||'';}
  function markup(value){return typeof renderResourceMarkup==='function'?renderResourceMarkup(String(value??'')):esc(value);}
  function rich(note){
    const value=String(note.text??''),runs=note.sourceRichTextRuns?.text||note.richText?.text;
    if(!Array.isArray(runs)||runs.map(run=>run.text||'').join('')!==value)return markup(value);
    return runs.map(run=>{let copy=esc(run.text||'');if(run.bold)copy='<strong>'+copy+'</strong>';if(run.italic)copy='<em>'+copy+'</em>';if(run.underline)copy='<u>'+copy+'</u>';return copy;}).join('');
  }
  function plainKey(value){return normalized(plainHTML(markup(value)));}
  function inferModule(label,fallback='semantic'){
    if(/构词/.test(label))return 'formation';
    if(/词义辨析|辨析/.test(label))return 'contrast';
    if(/词源点拨|词源故事/.test(label))return 'etymology';
    if(/语义|说明/.test(label))return 'semantic';
    return titles[fallback]?fallback:'semantic';
  }
  const specificTag=(label,module)=>text(label)&&![titles[module],'构词法','说明','语义说明','语义点拨'].includes(text(label))?text(label):'';
  function sourceRecord(note,module,head,origin){
    const bodyHTML='<p>'+rich(note)+'</p>';
    return {head,module,text:String(note.text??''),bodyHTML,key:note.noteKey||note.formationKey||'',tag:specificTag(note.title,module),sources:[note.source||{}],sourceKeys:[note.noteKey||note.formationKey||''].filter(Boolean),displayScope:note.displayScope || '',origin};
  }
  function originalWords(word){return word?.v1225OriginalWords?.length?word.v1225OriginalWords:word?[word]:[];}
  function mergeEvidence(target,record){
    for(const key of record.sourceKeys||[])if(key&&!target.sourceKeys.includes(key))target.sourceKeys.push(key);
    for(const source of record.sources||[])if(!target.sources.some(row=>JSON.stringify(row)===JSON.stringify(source)))target.sources.push(source);
    if(!target.tag&&record.tag)target.tag=record.tag;
    if(record.mediaHTML&&!target.bodyHTML.includes(record.mediaHTML))target.bodyHTML+=record.mediaHTML;
  }
  function describe(word,extras=[]){
    const planned=[],byBody=new Map(),replaced=new Map();
    function add(record){
      const key=record.head+'|'+normalized(plainHTML(record.bodyHTML));if(key.endsWith('|'))return;
      const replacement=replaced.get(key),existing=replacement||byBody.get(key);
      if(existing){mergeEvidence(existing,record);return;}
      record.sourceKeys=record.sourceKeys||[];record.sources=record.sources||[];
      planned.push(record);byBody.set(key,record);
    }
    originalWords(word).forEach(original=>{
      const head=original.head||original.word||'';
      const excel=[...(original.semanticNotes||[]).map(note=>sourceRecord(note,'semantic',head,'excel')),...(original.formationNotes||[]).map(note=>sourceRecord(note,'formation',head,'excel'))];
      const marked=window.V1224_WORD_NOTES?.byHead?.[head];
      if(text(marked?.text)){
        const explicit=new Set((marked.replaces?.existingDataNotes||[]).map(plainKey).filter(Boolean));
        const linked=excel.filter(note=>explicit.has(normalized(plainHTML(note.bodyHTML))));
        // The real Word field is authoritative for a conflicting old module ID.
        // In particular, 构词法内容 belongs to 构词点拨, even if an old map said semantic.
        const field=text(marked.source?.field),module=/构词/.test(field)||/构词/.test(marked.title||'')?'formation':titles[marked.detailModule]?marked.detailModule:linked[0]?.module||'semantic';
        const record=sourceRecord(marked,module,head,'word');
        record.tag=linked.map(note=>specificTag(note.tag,module)).find(Boolean)||specificTag(marked.title,module);
        linked.forEach(note=>mergeEvidence(record,note));
        add(record);
        const aliases=[marked.text,marked.replaces?.legacyWordText,...(marked.replaces?.existingDataNotes||[])].filter(value=>text(value));
        aliases.forEach(value=>replaced.set(head+'|'+plainKey(value),record));
      }
      excel.forEach(add);
    });
    extras.forEach(add);
    return planned;
  }
  function notesFromDOM(root,fallbackHead){
    const nodes=[...root.querySelectorAll(noteSelector)].filter(node=>!node.parentElement?.closest(noteSelector));
    return nodes.flatMap((node,index)=>{
      const heading=node.querySelector(':scope > h4,:scope > .resource-word-note-copy > h4');
      const paragraphs=[...node.querySelectorAll(':scope > p,:scope > .resource-word-note-copy > p')];
      const copy=node.cloneNode(true);copy.querySelector(':scope > h4,:scope > .resource-word-note-copy > h4')?.remove();
      const mediaHTML=[...node.querySelectorAll(':scope > .resource-word-note-media')].map(media=>media.outerHTML).join('');
      const bodyHTML=paragraphs.length?paragraphs.map(p=>p.outerHTML).join('')+mediaHTML:copy.innerHTML;
      const value=paragraphs.length?paragraphs.map(p=>p.textContent).join('\n'):copy.textContent;
      if(!text(value))return [];
      const head=node.dataset.v1224WordNote||node.closest('[data-latest-word-head]')?.dataset.latestWordHead||fallbackHead;
      const parent=node.closest('[data-case-module]')?.dataset.caseModule;
      const module=inferModule(text(heading?.textContent),parent==='explanation'?'semantic':parent);
      return [{head,module,text:value,bodyHTML,mediaHTML,key:node.dataset.latestNote||node.dataset.latestMotherNote||'dom-note:'+head+':'+index,tag:specificTag(heading?.textContent,module),sources:[],sourceKeys:[node.dataset.latestNote||node.dataset.latestMotherNote].filter(Boolean),origin:'rendered-word'}];
    });
  }
  function itemNotes(item,head){
    return [['explainOne','semantic'],['explainTwo','semantic'],['derivationText','formation']].flatMap(([field,module])=>{
      const value=item?.[field];return text(value)?[{head,module,text:String(value),bodyHTML:'<p>'+markup(value)+'</p>',key:'word-item:'+head+':'+field,tag:'',sources:[],sourceKeys:[],origin:'word-item'}]:[];
    });
  }
  function noteMarkup(note,mother=false){
    const label=note.tag?titles[note.module]+'-'+note.tag:'';
    const attrs=' data-v1235-note-module="'+esc(note.module)+'" data-v1235-note-head="'+esc(note.head)+'" data-v1235-note-keys="'+esc(JSON.stringify(note.sourceKeys))+'"';
    return '<article class="'+(mother?'knowledge-explanation is-unlabeled v1235-mother-note':'v1220-note v1235-source-note')+'" data-latest-note="'+esc(note.key)+'"'+attrs+'>'+(label&&!mother?'<h4 class="v1235-note-subtitle">'+esc(label)+'</h4>':'')+note.bodyHTML+'</article>';
  }
  const originalRender=api.render;
  api.render=function(options){
    const result=originalRender.apply(this,arguments);if(!result?.word)return result;
    const root=document.createElement('div');root.innerHTML=result.html;
    const head=result.word.head||result.word.word;
    const extras=[...notesFromDOM(root,head),...itemNotes(options?.item,head)];
    const notes=describe(result.word,extras);
    root.querySelectorAll('[data-case-module="explanation"],[data-case-module="semantic"],[data-case-module="formation"],[data-case-module="etymology"],[data-case-module="contrast"]').forEach(module=>{
      module.querySelectorAll(noteSelector).forEach(note=>note.remove());
    });
    notes.forEach(note=>{
      let module=root.querySelector('[data-case-module="'+note.module+'"]');
      if(!module){module=document.createElement('section');module.className='v1220-module';module.dataset.caseModule=note.module;const heading=document.createElement('h3');heading.textContent=titles[note.module];module.append(heading);root.append(module);}
      const holder=document.createElement('div');holder.innerHTML=noteMarkup(note);const node=holder.firstElementChild;
      const figure=module.querySelector(':scope > .v1220-family');if(figure)module.insertBefore(node,figure);else module.append(node);
    });
    root.querySelectorAll('[data-case-module="explanation"],[data-case-module="semantic"],[data-case-module="formation"],[data-case-module="etymology"],[data-case-module="contrast"]').forEach(module=>{
      const id=module.dataset.caseModule,heading=module.querySelector(':scope > h3');
      if(heading&&titles[id])heading.textContent=titles[id];
      if([...module.children].every(child=>child===heading))module.remove();
    });
    return {...result,html:root.innerHTML,v1235Notes:notes};
  };
  const originalFinish=api.finish;
  api.finish=function(detail,result){
    const value=originalFinish.apply(this,arguments);
    if(result?.word)Object.entries(titles).filter(([module])=>result.v1235Notes?.some(note=>note.module===module)).forEach(([module,title])=>{
      const button=detail.querySelector('[data-word-module="'+module+'"]');
      const label=button?.querySelector(':scope > .v1223-word-label');if(label)label.textContent=title;else if(button)button.textContent=title;
      const panel=detail.querySelector('.vwn-panel[aria-labelledby$="-tab-'+module+'"]');const heading=panel?.querySelector(':scope > .vwn-panel-title');if(heading)heading.textContent=title;
      panel?.querySelectorAll('.v1220-module > h3').forEach(heading=>{heading.textContent=title;});
    });
    window.V1223WordDock?.refresh?.(detail);return value;
  };
  const originalMother=api.finishMother;
  api.finishMother=function(container,item){
    if(item?.bookKey!==BOOK||container.closest('#wordDetailDialog'))return originalMother?.apply(this,arguments);
    const heads=[...new Set([...container.querySelectorAll('[data-latest-word-head]')].map(node=>node.dataset.latestWordHead))];
    const words=heads.map(head=>window.SINGLE_BOOK_LATEST_WORD_DATA?.wordsByHead?.[head]).filter(Boolean);
    if(!words.length)return originalMother?.apply(this,arguments);
    const primary=heads[0],word={v1225OriginalWords:words};
    const notes=describe(word,[...notesFromDOM(container,primary),...itemNotes(item,primary)]).filter(note=>note.displayScope!=='word-detail');
    container.querySelectorAll(noteSelector).forEach(node=>node.remove());
    notes.forEach(note=>container.insertAdjacentHTML('beforeend',noteMarkup(note,true)));
    const heading=container.closest('#popover')?.querySelector('.resource-popover-head > div > span');
    if(heading?.textContent.includes('构词法'))heading.textContent=heading.textContent.replace(/构词法/g,'构词点拨');
  };
  window.V1235NoteModules={describe,normalized,inspect(detail=document.getElementById('wordDetailDialog')){
    return detail?[...detail.querySelectorAll('[data-v1235-note-module]')].map(node=>({module:node.dataset.v1235NoteModule,head:node.dataset.v1235NoteHead,keys:JSON.parse(node.dataset.v1235NoteKeys||'[]'),subtitle:node.querySelector('.v1235-note-subtitle')?.textContent||'',text:[...node.querySelectorAll('p')].map(p=>p.textContent).join('\n')})):[];
  }};
})();
