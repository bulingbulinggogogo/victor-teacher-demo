/* V71: textbook meaning badges and field-safe source chips; V70 behavior preserved. Load after the existing V68/V69 finish wrappers.
 * Only cases/textbookExamples are replaced. Source objects, rich rendering, audio,
 * sense links, stars and the existing OOXML writer remain owned by their APIs. */
(() => {
  'use strict';
  if (window.V1270Examples) return;
  const api=window.V1220WordDetail;
  if (!api?.finish || !window.V1222SenseExamples?.renderExample) return;
  const text=value=>String(value??'').trim();
  const clean=value=>['','—','-'].includes(text(value))?'':text(value);
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize=value=>text(value).normalize('NFC').toLocaleLowerCase('en').replace(/\s+/g,' ');
  const first=(row,names)=>{for(const name of names){const value=clean(row?.[name]);if(value)return value;}return '';};
  const kinds={
    cases:{label:'高考真题',renderKind:'listening',fields:[['year','年份'],['paper','卷别'],['questionType','题型']],sorts:[['default','默认'],['year-desc','年份降序'],['year-asc','年份升序']]},
    textbookExamples:{label:'教材例句',renderKind:'textbook',fields:[['edition','教材版本'],['bookVolume','册别'],['unit','单元']],sorts:[['default','默认'],['unit','单元顺序']]}
  };
  const aliases={year:['year','examYear'],paper:['paper','sourceName','examPaper'],questionType:['questionType'],edition:['edition','textbookVersion','version'],bookVolume:['bookVolume','volume','bookTitle','bookName'],unit:['unit','unitName']};
  const states=new Map(),mounted=new WeakMap(),liveMounts=new Set();
  const mock=row=>row?.mock===true||row?.isDemonstration===true||row?.simulated===true;
  const displayWord=word=>text(word.displayWord||word.word||word.head)||'word';
  const identity=word=>text(word.wordKey)||[word.head||word.word||word.primaryCurrentWordId,(word.v1225MergedHeads||[]).join('+')].join('|');
  function recordsFor(result,kind){
    const options=result.options||{};
    if(kind==='cases')return api.cases({wordId:options.context?.word?.id,item:options.item,retained:options.retainedCases||[]});
    return result.word.textbookExamples||[];
  }
  function updateRecords(state,rows){
    const seen=new Map();
    state.records=(Array.isArray(rows)?rows:[]).filter(row=>clean(row?.sentence??row?.english??row?.example)).map((row,index)=>{
      const sourceId=first(row,['exampleKey','recordKey','id','exampleId','__victor_record_id']);
      const source=row.source||{};
      const base=sourceId||JSON.stringify([row.head,source.file,source.sheet,source.row,row.sentence??row.english??row.example,row.year,row.paper||row.sourceName]);
      const occurrence=(seen.get(base)||0)+1;seen.set(base,occurrence);
      return {row,index,sourceId,key:base+'::'+occurrence,values:Object.fromEntries(kinds[state.kind].fields.map(([field])=>[field,first(row,aliases[field])])),search:normalize([row.sentence??row.english??row.example,row.translation??row.chinese,row.meaning].filter(Boolean).join(' '))};
    });
    const keys=new Set(state.records.map(record=>record.key));
    state.selected=new Set([...state.selected].filter(key=>keys.has(key)));
    kinds[state.kind].fields.forEach(([field])=>{const values=new Set(state.records.map(record=>record.values[field]).filter(Boolean));state.filters[field]=new Set([...state.filters[field]].filter(value=>values.has(value)));});
  }
  function stateFor(result,kind){
    const key=identity(result.word)+'\u0000'+kind;
    let state=states.get(key);
    if(!state){state={key,kind,records:[],filters:Object.fromEntries(kinds[kind].fields.map(([field])=>[field,new Set()])),keyword:'',sort:'default',selected:new Set(),views:new Set(),notice:'',busy:false};states.set(key,state);}
    updateRecords(state,recordsFor(result,kind));return state;
  }
  function sortRecords(records,state){
    const rows=records.slice();
    if(state.sort==='year-desc'||state.sort==='year-asc'){
      const year=record=>{const value=record.values.year?.match(/(?:19|20)\d{2}/);return value?Number(value[0]):null;};
      rows.sort((a,b)=>{const x=year(a),y=year(b);if(x===null&&y!==null)return 1;if(y===null&&x!==null)return -1;return (x!==null&&y!==null?(state.sort==='year-desc'?y-x:x-y):0)||a.index-b.index;});
    }else if(state.sort==='unit')rows.sort((a,b)=>{const x=a.values.unit||'',y=b.values.unit||'';return (!x-!y)||x.localeCompare(y,'zh-CN',{numeric:true})||a.index-b.index;});
    return rows;
  }
  function results(state){
    const words=normalize(state.keyword).split(' ').filter(Boolean);
    return sortRecords(state.records.filter(record=>words.every(word=>record.search.includes(word))&&kinds[state.kind].fields.every(([field])=>!state.filters[field].size||state.filters[field].has(record.values[field]))),state);
  }
  const selected=state=>sortRecords(state.records.filter(record=>state.selected.has(record.key)),state);
  function dimensions(state){return kinds[state.kind].fields.map(([field,label])=>({field,label,values:[...new Set(state.records.map(record=>record.values[field]).filter(Boolean))].sort((a,b)=>field==='year'?(Number(b)-Number(a)||b.localeCompare(a,'zh-CN',{numeric:true})):a.localeCompare(b,'zh-CN',{numeric:true}))})).filter(field=>field.values.length);}
  function make(tag,className,value){const node=document.createElement(tag);node.className=className;if(value!==undefined)node.textContent=value;return node;}
  function sourceTag(field,value){const node=make('span','v1225-example-topic-badge v1270-source-tag',value);node.dataset.wordTagField=field;return node;}
  function renderRecord(record,view,index){
    const row=record.row,kind=kinds[view.state.kind];
    const wrapper=make('div','v1270-example-row');wrapper.dataset.v1270RecordKey=record.key;wrapper.dataset.v1270SourceId=record.sourceId;
    const choice=make('label','v1270-example-choice'),checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.dataset.v1270ExampleKey=record.key;checkbox.checked=view.state.selected.has(record.key);checkbox.setAttribute('aria-label','选择第'+(index+1)+'条例句');choice.append(checkbox,make('span','v1270-example-number',String(index+1).padStart(2,'0')));wrapper.append(choice);
    const copy=make('div','v1270-example-copy'),template=document.createElement('template');
    template.innerHTML=window.V1222SenseExamples.renderExample(row,kind.renderKind,'data-latest-example="'+escape(record.sourceId)+'"');
    const native=template.content.firstElementChild;
    if(!native)return wrapper;
    native.classList.add('v1270-native-example');native.dataset.latestExample=record.sourceId;
    const line=native.querySelector(':scope > .v1223-sense-example-line');
    if(line){
      const citation=line.querySelector('[data-v1224-citation]'),fallback=citation?.textContent||'',provenance=citation?.title||'';
      let footer=line.querySelector(':scope > .v1225-example-topic-line');if(!footer){footer=make('div','v1225-example-topic-line');line.append(footer);}footer.classList.add('v1270-source-tags');if(provenance)footer.title=provenance;
      if(view.state.kind==='textbookExamples'){
        const fields=[['source-edition',first(row,['edition','textbookVersion','version'])],['source-book-title',first(row,['bookTitle','bookName'])],['source-book-volume',first(row,['bookVolume','volume'])],['source-unit',clean(row.unit)],['source-section',clean(row.section)]];
        const tags=document.createDocumentFragment(),seen=new Set();fields.forEach(([field,value])=>{const key=field+'\u0000'+value;if(value&&!seen.has(key)){seen.add(key);tags.append(sourceTag(field,value));}});footer.prepend(tags);
      }
      // Keep the existing native badges, exact supplemental source fields and topic.
      [...line.children].filter(node=>node.matches('.v1223-example-kind,.v1229-example-labels')).reverse().forEach(node=>footer.prepend(node));
      if(!footer.querySelector('[data-word-tag-field^="source-"]')&&fallback)footer.append(sourceTag('source',fallback));
      footer.querySelectorAll('.v1225-example-topic-badge,.v1223-example-kind').forEach(node=>node.classList.add('v1270-source-tag'));
      if(mock(row)){const note=sourceTag('demonstration','模拟例句');note.classList.add('v1270-mock-tag');note.title='原有模拟例句';footer.append(note);}
      citation?.remove();line.querySelector('.v1224-source-anchor')?.remove();
      let meaning=native.querySelector(':scope > [data-exam-sense]');
      if(!meaning&&clean(row.meaning)){meaning=make('div','resource-sense-meta v1270-example-meaning');if(clean(row.partOfSpeech))meaning.append(make('span','v1229-example-pos',row.partOfSpeech));const meaningText=make('span','v1270-meaning-text',row.meaning);if(view.state.kind==='textbookExamples'){meaningText.classList.add('v1227-word-tag');meaningText.dataset.wordTag='textbook-meaning';meaningText.dataset.wordTagField='usage';}meaning.append(meaningText);}
      if(meaning){meaning.classList.add('v1270-example-meaning');line.insertBefore(meaning,footer);}
      // V68's one-time arrange/disclosure pass has already finished before these nodes are created.
    }
    window.V1271ExampleSources?.decorate?.(native,row,kind.renderKind);
    copy.append(native);wrapper.append(copy);return wrapper;
  }
  function focusKey(node){if(!node?.dataset)return '';const d=node.dataset;if(d.v1270Keyword!==undefined)return 'keyword';if(d.v1270ExampleKey!==undefined)return 'row:'+d.v1270ExampleKey;if(d.v1270Filter!==undefined)return 'filter:'+d.v1270Field+':'+d.v1270Value;if(d.v1270Sort!==undefined)return 'sort:'+d.v1270Sort;return d.v1270Action||'';}
  function render(view){
    const {state,controls,output}=view,active=document.activeElement,key=[controls,output].some(node=>node.contains(active))?focusKey(active):'',caret=key==='keyword'?[active.selectionStart,active.selectionEnd]:null;
    const visible=results(state),chosen=selected(state),visibleKeys=new Set(visible.map(record=>record.key)),outside=chosen.filter(record=>!visibleKeys.has(record.key)).length,checked=visible.filter(record=>state.selected.has(record.key)).length;
    const filters=dimensions(state).map(({field,label,values})=>'<div class="v1270-filter-row"><span class="v1270-filter-label">'+label+'</span><div class="v1270-filter-options" role="group" aria-label="'+label+'筛选"><button type="button" data-v1270-filter data-v1270-field="'+field+'" data-v1270-value="" aria-pressed="'+(!state.filters[field].size)+'">全部</button>'+values.map(value=>'<button type="button" data-v1270-filter data-v1270-field="'+field+'" data-v1270-value="'+escape(value)+'" aria-pressed="'+state.filters[field].has(value)+'">'+escape(value)+'</button>').join('')+'</div></div>').join('');
    controls.innerHTML='<div class="v1270-filter-body">'+filters+'<div class="v1270-keyword-row"><label><span>关键词</span><input type="search" data-v1270-keyword aria-label="搜索例句的英文或中文" placeholder="搜索英文或中文" autocomplete="off" value="'+escape(state.keyword)+'"></label><button type="button" data-v1270-action="reset">清空筛选</button></div></div><div class="v1270-sort"><span>排序</span><div class="v1270-sort-segments" role="group" aria-label="例句排序">'+kinds[state.kind].sorts.map(([value,label])=>'<button type="button" data-v1270-sort="'+value+'" aria-pressed="'+(state.sort===value)+'">'+label+'</button>').join('')+'</div></div>';
    const mocks=visible.filter(record=>mock(record.row)).length,canExport=typeof window.V1267DictionaryHierarchy?.wordBlob==='function';
    output.innerHTML='<div class="v1270-result-summary" role="status" aria-live="polite"><span>当前结果 <b>'+visible.length+'</b> / '+state.records.length+' 条</span><span>已选 <b>'+chosen.length+'</b> 条</span><span class="v1270-outside">当前结果外已选 '+outside+' 条</span>'+(mocks?'<span class="v1270-mock-summary">当前结果含 '+mocks+' 条模拟例句</span>':'')+'</div><div class="v1270-example-actions"><label><input type="checkbox" data-v1270-action="select-visible" '+(visible.length&&checked===visible.length?'checked ':'')+(!visible.length?'disabled':'')+'>全选当前结果</label><button type="button" data-v1270-action="clear" '+(!chosen.length?'disabled':'')+'>清空已选</button><span class="v1270-action-spacer"></span><button type="button" class="v1270-export" data-v1270-action="export-results" '+(!visible.length||state.busy||!canExport?'disabled':'')+'>导出当前结果 Word</button><button type="button" class="v1270-export" data-v1270-action="export-selected" '+(!chosen.length||state.busy||!canExport?'disabled':'')+'>导出已选 '+chosen.length+' 条 Word</button></div><div class="v1270-example-list"></div><div class="v1270-export-status" role="status" aria-live="polite">'+escape(state.notice)+'</div>';
    const list=output.querySelector('.v1270-example-list');if(visible.length){const fragment=document.createDocumentFragment();visible.forEach((record,index)=>fragment.append(renderRecord(record,view,index)));list.append(fragment);}else list.append(make('p','v1270-example-empty','没有符合当前条件的例句'));
    output.querySelector('[data-v1270-action="select-visible"]').indeterminate=checked>0&&checked<visible.length;
    if(key){const target=[...controls.querySelectorAll('button,input'),...output.querySelectorAll('button,input')].find(node=>focusKey(node)===key);if(target){target.focus({preventScroll:true});if(caret&&target.setSelectionRange)target.setSelectionRange(...caret);}}
  }
  function refreshState(state){state.views.forEach(view=>{if(view.output.isConnected)render(view);});}
  function timestamp(){const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',year:'2-digit',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));return p.year+p.month+p.day+'_'+p.hour+p.minute;}
  function download(view,scope){
    const state=view.state,rows=scope==='selected'?selected(state):results(state);if(!rows.length||state.busy)return;
    state.busy=true;state.notice='';refreshState(state);
    try{
      const head=displayWord(view.result.word),count=rows.filter(record=>mock(record.row)).length,label=kinds[state.kind].label+(count?'（含'+count+'条模拟例句）':''),blob=window.V1267DictionaryHierarchy.wordBlob(head,label,rows.map(record=>record.row),state.kind);
      const filename=(head+'_'+kinds[state.kind].label+'_'+(scope==='selected'?'已选':'当前结果')+'_'+rows.length+'条_'+timestamp()+'.docx').replace(/[\\/:*?"<>|]/g,'_');
      const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;link.hidden=true;view.output.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      state.notice='已导出 '+rows.length+' 条例句';view.output.dataset.v1270LastExportCount=String(rows.length);view.output.dataset.v1270LastExportName=filename;
    }catch(error){state.notice='导出未完成，请重试';console.error('V1270Examples export',error);}finally{state.busy=false;refreshState(state);}
  }
  function bindView(view){
    const {state,controls,output}=view;
    const click=event=>{const button=event.target.closest('button');if(!button||button.disabled)return;
      if(button.dataset.v1270Filter!==undefined){const set=state.filters[button.dataset.v1270Field],value=button.dataset.v1270Value;if(!set)return;if(!value)set.clear();else if(set.has(value))set.delete(value);else set.add(value);}
      else if(button.dataset.v1270Sort!==undefined){if(!kinds[state.kind].sorts.some(([value])=>value===button.dataset.v1270Sort))return;state.sort=button.dataset.v1270Sort;}
      else if(button.dataset.v1270Action==='reset'){Object.values(state.filters).forEach(set=>set.clear());state.keyword='';}
      else if(button.dataset.v1270Action==='clear')state.selected.clear();
      else if(button.dataset.v1270Action==='export-results'){download(view,'results');return;}
      else if(button.dataset.v1270Action==='export-selected'){download(view,'selected');return;}else return;
      event.preventDefault();state.notice='';refreshState(state);
    };
    const input=event=>{if(event.target.dataset.v1270Keyword===undefined||event.isComposing||view.composing)return;state.keyword=event.target.value;state.notice='';refreshState(state);};
    const compositionStart=event=>{if(event.target.dataset.v1270Keyword!==undefined)view.composing=true;};
    const compositionEnd=event=>{if(event.target.dataset.v1270Keyword===undefined)return;view.composing=false;input(event);};
    const change=event=>{const node=event.target;if(node.dataset.v1270ExampleKey!==undefined){if(node.checked)state.selected.add(node.dataset.v1270ExampleKey);else state.selected.delete(node.dataset.v1270ExampleKey);}else if(node.dataset.v1270Action==='select-visible')results(state).forEach(record=>{if(node.checked)state.selected.add(record.key);else state.selected.delete(record.key);});else return;state.notice='';refreshState(state);};
    controls.addEventListener('click',click);controls.addEventListener('input',input);controls.addEventListener('compositionstart',compositionStart);controls.addEventListener('compositionend',compositionEnd);output.addEventListener('click',click);output.addEventListener('change',change);
    view.unbind=()=>{controls.removeEventListener('click',click);controls.removeEventListener('input',input);controls.removeEventListener('compositionstart',compositionStart);controls.removeEventListener('compositionend',compositionEnd);output.removeEventListener('click',click);output.removeEventListener('change',change);};
  }
  function inspectState(state){const visible=results(state),chosen=selected(state),keys=new Set(visible.map(record=>record.key));return {kind:state.kind,wordKey:state.key,total:state.records.length,resultCount:visible.length,selectedCount:chosen.length,outsideSelectedCount:chosen.filter(record=>!keys.has(record.key)).length,mockCount:state.records.filter(record=>mock(record.row)).length,sort:state.sort,keyword:state.keyword,filters:Object.fromEntries(Object.entries(state.filters).map(([field,values])=>[field,[...values]])),visibleIds:visible.map(record=>record.sourceId),selectedIds:chosen.map(record=>record.sourceId)};}
  function mount(detail,result=api.getModel?.(detail)){
    if(detail?.id!=='wordDetailDialog'||!result?.word)return null;
    const nav=detail.querySelector('.v1225-word-main-nav,.vwn-main-nav');if(!nav)return null;
    const prior=mounted.get(detail);if(prior?.result===result&&prior.nav===nav&&prior.views.every(view=>detail.contains(view.output))){prior.sync();return prior;}
    prior?.destroy();
    const slot=make('section','v1270-filter-slot');slot.setAttribute('aria-label','例句筛选');slot.hidden=true;
    const contact=make('section','v1270-example-contact'),home=document.createComment('V1270 main navigation original position');nav.before(home);nav.after(slot);
    const controller={detail,result,nav,slot,contact,home,views:[],sync:null,destroy:null};
    Object.keys(kinds).forEach(kind=>{
      const button=nav.querySelector('[data-word-module="'+kind+'"]'),panel=button&&document.getElementById(button.getAttribute('aria-controls')),scroll=panel?.querySelector('.vwn-panel-scroll');if(!scroll)return;
      const state=stateFor(result,kind),controls=make('section','v1270-example-controls'),output=make('section','v1270-example-browser');controls.dataset.v1270Kind=kind;output.dataset.v1270Kind=kind;controls.setAttribute('aria-label',kinds[kind].label+'筛选');output.setAttribute('aria-label',kinds[kind].label+'浏览与导出');slot.append(controls);
      panel.classList.add('v1270-example-panel');panel.querySelectorAll('.v1267-example-export,.v1227-exam-distribution,.v1228-exam-flat-distributions').forEach(node=>node.remove());scroll.replaceChildren(output);
      const view={state,controls,output,panel,result};state.views.add(view);controller.views.push(view);bindView(view);render(view);
    });
    if(!controller.views.length){home.remove();slot.remove();return null;}
    // Old controls own only their removed nodes. They must never filter the new rows.
    detail.querySelectorAll('[data-v1220-subnav-for="cases"],[data-v1225-subnav-for="cases"],[data-v1220-subnav-for="textbookExamples"],[data-v1225-subnav-for="textbookExamples"],.v1227-exam-type-tabs').forEach(node=>node.remove());
    let scheduled=false,last='';
    function sync(){scheduled=false;if(!detail.isConnected){controller.destroy();return;}const active=nav.querySelector('[data-word-module][aria-selected="true"]')?.dataset.wordModule,enabled=controller.views.some(view=>view.state.kind===active);
      if(enabled){
        // The shared dock owns the nav parent. Keep its original node in place and
        // cancel only the body's existing row gap between this nav and our filter.
        if(contact.previousElementSibling!==nav)nav.after(contact);
        if(slot.parentElement!==contact)contact.append(slot);
        const rowGap=parseFloat(getComputedStyle(nav.parentElement).rowGap)||0;
        contact.style.setProperty('--v1270-nav-gap',rowGap+'px');
        slot.hidden=false;detail.dataset.v1270ExampleActive=active;
      }else{slot.hidden=true;contact.remove();delete detail.dataset.v1270ExampleActive;}
      controller.views.forEach(view=>view.controls.hidden=view.state.kind!==active);
      if(last!==active){last=active;requestAnimationFrame(()=>window.WordDetailNavigation?.fit?.());}
    }
    function schedule(){if(!scheduled){scheduled=true;queueMicrotask(sync);}}
    const observer=new MutationObserver(schedule);observer.observe(nav,{subtree:true,attributes:true,attributeFilter:['aria-selected'],childList:true});nav.addEventListener('click',schedule);
    controller.sync=sync;controller.destroy=()=>{observer.disconnect();nav.removeEventListener('click',schedule);controller.views.forEach(view=>{view.unbind();view.state.views.delete(view);view.controls.remove();view.panel.classList.remove('v1270-example-panel');});if(nav.parentElement===contact)home.after(nav);slot.remove();contact.remove();home.remove();delete detail.dataset.v1270ExampleActive;liveMounts.delete(controller);if(mounted.get(detail)===controller)mounted.delete(detail);};
    mounted.set(detail,controller);liveMounts.add(controller);sync();return controller;
  }
  const finish=api.finish;
  api.finish=function(detail,result){const value=finish.apply(this,arguments);mount(detail,result);return value;};
  const connectionObserver=new MutationObserver(records=>{if(records.some(record=>record.removedNodes.length))liveMounts.forEach(controller=>{if(!controller.detail.isConnected)controller.destroy();});});
  if(document.body)connectionObserver.observe(document.body,{childList:true,subtree:true});
  window.V1270Examples=Object.freeze({mount,refresh:detail=>{const controller=mounted.get(detail||document.getElementById('wordDetailDialog'));controller?.views.forEach(render);controller?.sync();},inspect:detail=>{const controller=mounted.get(detail||document.getElementById('wordDetailDialog'));return controller?Object.fromEntries(controller.views.map(view=>[view.state.kind,inspectState(view.state)])):null;}});
  queueMicrotask(()=>{const detail=document.getElementById('wordDetailDialog'),result=detail&&api.getModel?.(detail);if(result)mount(detail,result);});
})();
