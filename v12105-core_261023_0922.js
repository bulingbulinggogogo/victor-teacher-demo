
/* V1.1 教师端：答案连接、来源返回、合并翻译、真实线索及界面设置。 */
(function () {
 const old={openFull,renderFull,setCurrentLectureQuestion,handleFullReturn,closeFull,renderTranscript,renderKnowledgeRail,decorateResourceHighlights,toggleAudio,renderFullQuestion};
 let view='lecture', origin=null, answerHistory=[], audioSource=null, pendingQuestionChange=null, audioQuestionSignature='';
 let cluePulseStartedAt=0, cluePulseQuestionId='', cluePulseSequence=0;
 const cluePulseDuration=1920;
 const themes={light:{name:'亮色',kind:'light'},pine:{name:'暗色',kind:'dark',bg:'#15221F',panel:'#22342E',text:'#E2EEE8'}};
 function stop(reason){
  window.DemoAudioEngine?.cancel(reason);
  window.DemoResourceAudio?.invalidate();window.DemoResourceAudio?.pause();
  resetTranscriptTeachingModes({restoreAnalysis:false,pauseAudio:true});
  els.audio.pause();els.practiceInstructionAudio.pause();
  delete els.audio.dataset.pendingSegmentStart;
  try{els.audio.currentTime=0;els.practiceInstructionAudio.currentTime=0;}catch{}
  setPlayButton(false);closeResourcePopover();closeQuestionPicker();closeSpeedMenu();
 }
 function snapshot(){return {qid:state.currentQuestionId,ids:[...state.explainIds],originalIds:[...state.originalExplainIds],setId:state.activeExplainSetId,order:state.explainOrder,returnPage:state.fullReturnPage,setName:state.fullSetNameOverride||''};}
 function resetTeaching(){state.showAnswer=false;state.showAnswerAnalysis=false;state.showAnalysis=false;state.showQuestionTranslation=false;state.showTranscriptTranslation=false;state.activeKnowledgeType=null;state.questionPanelCollapsed=false;}
 openFull=function(ids,focusId,returnPage='',options={}){
  closeQuestionPicker();closeInterfaceSettings();closeSpeedMenu();
  const pause=options.pauseOnEntry===true; view=options.audioOnly?'audio':'lecture';origin=null;audioSource=null;answerHistory=[];
  old.openFull(ids,focusId,returnPage,pause?{...options,audioOnly:false}:options);
  if(pause){state.audioOnlyPlayback=true;state.practiceModeActive=false;state.practicePhase='idle';els.fullscreenPage.dataset.mode='audio-only';renderFull();}
 };
 function enterAnswers(next){
  if(!state.audioOnlyPlayback) return;
  if(view===next){handleFullReturn();return;}
  if(!audioSource) audioSource=snapshot();
  answerHistory.push({view,qid:state.currentQuestionId,scroll:els.fullscreenPage.querySelector('.full-grid').scrollTop});
  stop('enter-'+next);resetTeaching();view=next;state.audioOnlyPlayback=true;state.practiceModeActive=false;state.practicePhase='idle';state.practicePaused=true;state.showAnswer=next==='check';
  renderFull();els.fullscreenPage.querySelector('.full-grid').scrollTop=0;
 }
 function enterLecture(qid){
  origin=audioSource||snapshot();stop('answer-to-lecture');view='lecture';state.audioOnlyPlayback=false;state.currentQuestionId=String(qid);resetTeaching();state.showAnalysis=true;els.fullscreenPage.dataset.mode='';renderFull();
  els.fullscreenPage.querySelector('.full-grid').scrollTop=0;
 }
 function restoreAudio(snap){
  const source={...snap};stop('lecture-to-source-audio');
  openFull(source.ids,source.qid,source.returnPage,{order:source.order,keepScopeOrder:true,audioOnly:true,pauseOnEntry:true,setName:source.setName});
  state.originalExplainIds=[...source.originalIds];state.activeExplainSetId=source.setId;state.currentQuestionId=source.qid;state.practicePaused=true;renderFull();updateAudioProgress();
 }
 handleFullReturn=function(){
  if(els.fullscreenPage.dataset.mode==='similar'&&state.lectureSnapshot){window.DemoResourceAudio?.invalidate();old.handleFullReturn();return;}
  if(origin){restoreAudio(origin);return;}
  if((view==='check'||view==='all')&&answerHistory.length){
   const prior=answerHistory.pop();stop('answer-back');view=prior.view;resetTeaching();state.currentQuestionId=prior.qid;state.audioOnlyPlayback=true;state.practiceModeActive=false;state.practicePaused=true;state.showAnswer=view==='check';renderFull();els.fullscreenPage.querySelector('.full-grid').scrollTop=prior.scroll;return;
  }
  stop('exit-fullscreen');view='lecture';audioSource=null;answerHistory=[];old.handleFullReturn();
 };
 closeFull=function(){stop('close-fullscreen');origin=null;audioSource=null;answerHistory=[];view='lecture';old.closeFull();};
 setCurrentLectureQuestion=function(id){
  const prev=getQuestion(state.currentQuestionId), next=getQuestion(String(id));
  const same=els.fullscreenPage.dataset.mode!=='similar'&&prev&&next&&prev.setId===next.setId&&prev.textNo===next.textNo;
  const translated=state.showTranscriptTranslation||state.showQuestionTranslation;
  if(!same){state.showTranscriptTranslation=false;state.showQuestionTranslation=false;
   if(state.followReadRestoreSnapshot){state.followReadRestoreSnapshot.showQuestionTranslation=false;state.followReadRestoreSnapshot.showTranscriptTranslation=false;}
  }
  if(state.activeKnowledgeType==='线索定位')state.activeKnowledgeType=null;
  window.DemoResourceAudio?.invalidate();
  pendingQuestionChange={id:String(id),same,translated};
  try{old.setCurrentLectureQuestion(id);}finally{pendingQuestionChange=null;}
 };
 updatePracticeOptionLayouts=function(){
  if(!state.audioOnlyPlayback&&!state.practiceModeActive)return;
  const rows=[...els.fullQuestion.querySelectorAll('.practice-option-row')];
  rows.forEach(row=>row.classList.remove('stacked-options'));
  void els.fullQuestion.offsetWidth;
  rows.forEach(row=>row.classList.toggle('stacked-options',[...row.querySelectorAll('.full-option')].some(option=>{const copy=option.querySelector('.option-copy-main'),text=copy?.firstElementChild;if(!copy||!text)return false;const right=option.getBoundingClientRect().right-parseFloat(getComputedStyle(option).paddingRight||0);return copy.scrollWidth>copy.clientWidth+1||text.getBoundingClientRect().right>right+1;})));
 };
 function renderCards(){
  const q=getQuestion(state.currentQuestionId);const groups=[];
  currentLectureIds().map(getQuestion).filter(x=>x&&x.setId===q.setId).sort((a,b)=>a.questionNo-b.questionNo).forEach(x=>{
   const key=x.questionType==='短对话'?'short':String(x.textNo);let g=groups.find(t=>t.key===key);
   if(!g){g={key,label:x.questionType==='短对话'?'第一节 · 短对话':x.questionType+' · Text '+x.textNo,questions:[]};groups.push(g);}g.questions.push(x);
  });
  els.fullQuestion.innerHTML='<div class="demo-answer-sheet">'+groups.map(g=>'<section class="demo-answer-group"><h3>'+escapeHtml(g.label)+'</h3><div class="demo-answer-tiles">'+g.questions.map(x=>'<button class="demo-answer-tile" data-answer-question="'+x.id+'" aria-label="第'+x.questionNo+'题，正确答案'+x.answerKey+'，进入全屏讲解"><span>'+x.questionNo+'</span><b>'+escapeHtml(x.answerKey)+'</b></button>').join('')+'</div></section>').join('')+'</div>';
  els.fullQuestion.querySelectorAll('[data-answer-question]').forEach(b=>b.onclick=()=>enterLecture(b.dataset.answerQuestion));
 }
 renderFull=function(){
  if(pendingQuestionChange&&state.currentQuestionId===pendingQuestionChange.id){
   const keep=pendingQuestionChange.same&&pendingQuestionChange.translated&&!state.followReadActive;
   state.showQuestionTranslation=Boolean(keep);state.showTranscriptTranslation=Boolean(keep);
  }
  if(view==='check')state.showAnswer=true;
  old.renderFull();const q=getQuestion(state.currentQuestionId);if(!q)return;
  if(els.fullscreenPage.dataset.mode!=='similar'&&(!state.fullSetNameOverride||state.fullSetNameOverride===q.setName)){const title={14255:'新高中英语听力进阶 高一上（2026版） - WELCOME UNIT WELCOME（一）',14256:'新高中英语听力进阶 高一上（2026版） - WELCOME UNIT WELCOME（二）'}[q.setId];if(title)els.fullTitle.textContent=title;}
  els.fullscreenPage.dataset.demoView=view;
  els.fullscreenPage.classList.toggle('demo-answer-check',view==='check');els.fullscreenPage.classList.toggle('demo-all-answers',view==='all');
  $('#practiceModeTools').classList.toggle('visible',state.audioOnlyPlayback&&view!=='all');$('#classroomDock').classList.remove('audio-only-complete');
  $('#practiceModeTools').setAttribute('aria-hidden',String(!state.audioOnlyPlayback||view==='all'));
  $('#checkAnswersBtn').classList.toggle('active',view==='check');$('#allAnswersBtn').classList.toggle('active',view==='all');
  $('#questionTranslate').classList.add('hidden');
  $('#demoAbility').textContent=q.ability||'--';$('#demoTopic').textContent=q.topic||'--';
  $('#demoAbility').closest('.exam-point-line').title=q.metadataSourceLabel||'';$('#demoTopic').closest('.exam-point-line').title=q.metadataSourceLabel||'';
  if(view==='all'){renderCards();}else if(state.audioOnlyPlayback){
   const fade=view==='audio'&&q.questionType==='短对话';
   els.fullQuestion.querySelectorAll('[data-full-item]').forEach(node=>{
    const current=node.dataset.fullItem===q.id;node.classList.toggle('demo-current-audio',fade&&current);node.classList.toggle('demo-dim-audio',fade&&!current);
    if(view==='check'){
     const h=node.querySelector('.full-stem');h.setAttribute('role','button');h.tabIndex=0;h.setAttribute('aria-label','进入第'+getQuestion(node.dataset.fullItem).questionNo+'题全屏讲解');
     h.onclick=()=>enterLecture(node.dataset.fullItem);h.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();enterLecture(node.dataset.fullItem);}};
    }
   });
   if(fade){const active=els.fullQuestion.querySelector('.demo-current-audio');const grid=els.fullscreenPage.querySelector('.full-grid');if(active&&grid){const r=active.getBoundingClientRect(),g=grid.getBoundingClientRect();if(r.top<g.top||r.bottom>g.bottom)active.scrollIntoView({block:'nearest',behavior:'smooth'});}}
  }
  if(view==='check')$('#returnToLectureLabel').textContent='返回';
  if(view==='all')$('#returnToLectureLabel').textContent='返回';
  updatePracticeOptionLayouts();applyTheme();window.updateSuiteEstimate?.();
 };
 renderKnowledgeRail=function(q){
  closeResourcePopover();els.leftKnowledgeRail.classList.add('hidden');els.leftKnowledgeRail.innerHTML='';els.transcriptPanel.classList.add('no-knowledge');
  const dock=$('#dockKnowledge');if(!state.showAnalysis){dock.innerHTML='';dock.classList.remove('visible');return;}
  const keys=availableKnowledgeTypes(q);if(q.clueSegments?.length)keys.unshift('线索定位');
  if(state.activeKnowledgeType&&!keys.includes(state.activeKnowledgeType))state.activeKnowledgeType=null;
  keys.push('翻译');dock.innerHTML=keys.map(k=>'<button data-demo-knowledge="'+k+'" class="'+((k==='翻译'?state.showTranscriptTranslation:state.activeKnowledgeType===k)?'active':'')+'" aria-pressed="'+String(k==='翻译'?state.showTranscriptTranslation:state.activeKnowledgeType===k)+'">'+k+'</button>').join('');dock.classList.add('visible');
  dock.querySelectorAll('button').forEach(b=>b.onclick=e=>{
   const k=b.dataset.demoKnowledge;
   if(k==='翻译'){const active=!(state.showTranscriptTranslation||state.showQuestionTranslation);state.showTranscriptTranslation=active;state.showQuestionTranslation=active;}
   else state.activeKnowledgeType=state.activeKnowledgeType===k?null:k;
   if(k==='线索定位'&&state.activeKnowledgeType===k){cluePulseStartedAt=performance.now();cluePulseQuestionId=String(q.id);cluePulseSequence++;}
   renderKnowledgeRail(q);renderTranscript(q);renderFullQuestion(q);
   if(k==='线索定位'&&state.activeKnowledgeType===k)requestAnimationFrame(()=>els.transcript.querySelector('.demo-clue')?.scrollIntoView({block:'center',behavior:'smooth'}));
   else if(k!=='翻译'&&state.activeKnowledgeType){requestAnimationFrame(()=>highlightKnowledgeWord(k));const items=knowledgeItemsForQuestion(q,k);if(!items.some(i=>i.highlightTarget))showResourceCollectionPopover(e,k,items);}
  });requestAnimationFrame(clampClassroomDock);
 };
 // Source ranges remain unchanged. Only revealed clue ranges show their source markers.
 function transcriptMarkup(q,index,text){
  const markers=(findTimecode(q)?.derivedClueMarkers||[]).filter(m=>m.segmentIndex===index);
  const sourceRanges=state.activeKnowledgeType==='线索定位'?(q.clueSegments||[]).filter(c=>c.segmentIndex===index):[];
  const ranges=[];
  sourceRanges.map(r=>({start:Math.max(0,r.startChar),end:Math.min(text.length,r.endChar)})).filter(r=>r.end>r.start).sort((a,b)=>a.start-b.start).forEach(r=>{
   const previous=ranges[ranges.length-1];if(previous&&r.start<previous.end)previous.end=Math.max(previous.end,r.end);else ranges.push(r);
  });
  if(!ranges.length)return decorateResourceHighlights(text,q,'录音稿');
  if(cluePulseQuestionId!==String(q.id)||!cluePulseStartedAt){cluePulseQuestionId=String(q.id);cluePulseStartedAt=performance.now();cluePulseSequence++;}
  const elapsed=Math.max(0,performance.now()-cluePulseStartedAt);
  const flashing=elapsed<cluePulseDuration&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  let html='',cursor=0;
  ranges.forEach(range=>{
   html+=decorateResourceHighlights(text.slice(cursor,range.start),q,'录音稿');
   let content='',position=range.start;
   markers.filter(m=>m.charIndex>=range.start&&m.charIndex<range.end).sort((a,b)=>a.charIndex-b.charIndex).forEach(m=>{
    content+=escapeHtml(text.slice(position,m.charIndex))+'<span class="demo-clue-number">'+escapeHtml(m.marker)+'</span>';
    position=m.charIndex;
   });
   content+=escapeHtml(text.slice(position,range.end));
   html+='<span class="demo-clue'+(flashing?' demo-clue-flashing':'')+'" data-clue-pulse="'+cluePulseSequence+'"'+(flashing?' style="animation-delay:-'+elapsed.toFixed(1)+'ms"':'')+'>'+content+'</span>';
   cursor=range.end;
  });
  return html+decorateResourceHighlights(text.slice(cursor),q,'录音稿');
 }
 renderTranscript=function(q){
  old.renderTranscript(q);
  // Old static clue styling is superseded by the requested clue toggle.
  els.transcript.querySelectorAll('.sentence.clue').forEach(n=>n.classList.remove('clue'));
  els.transcript.querySelectorAll('.translation-clue').forEach(n=>{n.style.textDecoration='none';n.style.color='inherit';});
  els.transcript.querySelectorAll('[data-play-segment]').forEach(node=>{
   const index=Number(node.dataset.playSegment);const text=findTimecode(q)?.segments[index]?.text||'';
   node.innerHTML=sliceSentenceMarkup(transcriptMarkup(q,index,text),Number(node.dataset.sentenceStart||0),Number(node.dataset.sentenceEnd||text.length));
   node.querySelectorAll('.demo-clue-flashing').forEach(clue=>clue.addEventListener('animationend',()=>clue.classList.remove('demo-clue-flashing'),{once:true}));
  });
 };
 // Inline spans allow long highlighted source sentences to break exactly like text.
 decorateResourceHighlights=function(text,q,areas){
  return old.decorateResourceHighlights(text,q,areas).replace(/<button type="button" class="resource-highlight/g,'<span role="button" tabindex="0" class="resource-highlight').replace(/<\/button>/g,'</span>');
 };
 function alignTranslationCopies(){
  els.fullQuestion.querySelectorAll('.question-copy-line,.option-copy-main').forEach(row=>{
   const prefix=row.querySelector('.demo-copy-prefix');const translation=row.querySelector('.line-translation');
   if(prefix&&translation){const english=row.querySelector('.demo-copy-text');translation.style.marginLeft=(english.getBoundingClientRect().left-row.getBoundingClientRect().left)+'px';}
  });
 }
 renderFullQuestion=function(q){
  const multi=(state.practiceModeActive||state.audioOnlyPlayback)&&!state.showAnalysis;
  const signature=multi?JSON.stringify({ids:audioOnlyVisibleQuestionIds(q),answer:state.showAnswer,translation:state.showQuestionTranslation,analysis:state.showAnswerAnalysis,knowledge:state.activeKnowledgeType}):'';
  if(multi&&signature===audioQuestionSignature&&els.fullQuestion.querySelector('.full-question-list')){updatePracticeOptionLayouts();return;}
  old.renderFullQuestion(q);audioQuestionSignature=signature;
  if(!multi){
   const stem=els.fullQuestion.querySelector('.full-stem > span');
   const match=String(q.stem||'').match(/^(\d+[.．、])\s*(.*)$/);
   if(stem&&match)stem.innerHTML='<span class="demo-copy-prefix">'+escapeHtml(match[1])+'</span><span class="demo-copy-text">'+decorateResourceHighlights(match[2],q,'题干')+'</span>';
   els.fullQuestion.querySelectorAll('.full-option').forEach((row,index)=>{
    const option=q.options[index],english=row.querySelector('.option-copy-main > span');if(!option||!english)return;
    english.innerHTML='<span class="demo-copy-prefix">'+escapeHtml(option.key)+'.</span><span class="demo-copy-text">'+decorateResourceHighlights(cleanOptionText(option.text),q,['选项'+option.key,...(state.showAnswer&&option.key===q.answerKey?['答案']:[])])+'</span>';
   });
   bindQuestionResourceHighlights(q);alignTranslationCopies();
  }
 };
 document.addEventListener('keydown',e=>{const n=e.target.closest('[data-resource-highlight][role="button"]');if(n&&['Enter',' '].includes(e.key)){e.preventDefault();n.click();}});

 toggleAudio=function(){
  if(state.practiceModeActive&&window.DemoAudioEngine?.togglePractice){window.DemoAudioEngine.togglePractice();return;}
  if(state.audioOnlyPlayback&&!state.practiceModeActive&&view!=='all'){
   state.practiceModeActive=true;state.practicePhase='idle';state.practiceIntroducedSections=new Set();
   if(audioSource&&state.currentQuestionId===audioSource.qid){const q=getQuestion(state.currentQuestionId);state.practiceIntroducedSections.add(practiceSectionKey(q));}
   renderFull();startPracticeSequence();return;
  }old.toggleAudio();
 };
 applyTheme=function(){
  if(!themes[state.theme])state.theme=['dark','charcoal','graphite','indigo'].includes(state.theme)?'pine':'light';const t=themes[state.theme];
  document.body.dataset.demoTheme=t.kind;
  [els.fullscreenPage,els.onlinePage,els.popover,...document.querySelectorAll('.app-dialog')].filter(Boolean).forEach(page=>{
   page.classList.toggle('light-mode',t.kind==='light');page.classList.toggle('dark-mode',t.kind==='dark');page.dataset.themeKind=t.kind;
   const vars={'--lecture-bg':t.bg,'--lecture-panel':t.panel,'--lecture-panel-deep':t.panel,'--lecture-text':t.text,'--demo-panel':t.panel,'--demo-text':t.text,'--demo-bg':t.bg,'--demo-red':t.kind==='dark'?'#ff6f7d':null};
   Object.entries(vars).forEach(([k,v])=>v?page.style.setProperty(k,v):page.style.removeProperty(k));
   if(t.bg){page.style.setProperty('--lecture-border',t.kind==='dark'?'#4d5a60':'#c5cdd2');page.style.setProperty('--lecture-muted',t.kind==='dark'?'#b8c0ca':'#697586');}
   else{page.style.removeProperty('--lecture-border');page.style.removeProperty('--lecture-muted');}
  });
  document.querySelectorAll('[data-theme-choice]').forEach(b=>{b.classList.toggle('selected',b.dataset.themeChoice===state.theme);b.setAttribute('aria-checked',String(b.dataset.themeChoice===state.theme));});
  window.DemoKnowledgeEnhancements?.syncTheme();window.DemoThemePalette?.apply();
 };
 setFullFont=function(size){
  state.fullFont=Math.max(33,Math.min(60,Number(size)||48));demoStorage.setItem('victor:fullFont',String(state.fullFont));
  document.documentElement.style.setProperty('--full-dialog-scale',String(1.5*state.fullFont/48));
  document.documentElement.style.setProperty('--full-font-size',state.fullFont+'px');
  document.documentElement.style.setProperty('--full-ui-scale',String(1.2*state.fullFont/48));
  [els.fullscreenPage,els.onlinePage].forEach(p=>p.style.setProperty('--full-font',state.fullFont+'px'));
  els.fullscreenPage.style.setProperty('--question-panel-height',Math.round(state.fullFont*7+50)+'px');
  ['#fontDown','#onlineFontDown'].forEach(id=>$(id).disabled=state.fullFont<=33);['#fontUp','#onlineFontUp'].forEach(id=>$(id).disabled=state.fullFont>=60);
  $('#demoFontValue').textContent=String(state.fullFont);requestAnimationFrame(()=>{updatePracticeOptionLayouts();alignTranslationCopies();});
 };
 rateColor=function(rate){if(rate<70)return themes[state.theme]?.kind==='light'?'#ef4444':'#ff6f7d';if(rate<100)return '#facc15';return '#16a34a';};
 const engineProgress=updateAudioProgress;
 updateAudioProgress=function(){engineProgress();const seek=$('#audioSeek');const percentage=Number.isFinite(els.audio.duration)&&els.audio.duration>0?Math.max(0,Math.min(100,els.audio.currentTime/els.audio.duration*100)):0;seek?.style.setProperty('--progress',percentage+'%');$('#audioDuration').textContent=Number.isFinite(els.audio.duration)?formatAudioTime(els.audio.duration):'--:--';};
 function initialize(){
  if(!state.questions.length){setTimeout(initialize,30);return;}
  const tools=$('#practiceModeTools');tools.insertAdjacentHTML('beforeend','<button id="checkAnswersBtn" class="dock-text-action" type="button">对答案</button><button id="allAnswersBtn" class="dock-text-action" type="button">全部答案</button>');
  $('#checkAnswersBtn').onclick=()=>enterAnswers('check');$('#allAnswersBtn').onclick=()=>enterAnswers('all');
  document.querySelector('.question-meta').insertAdjacentHTML('beforeend','<div class="exam-point-line demo-ability-line"><span aria-hidden="true">'+icons.target+'</span><strong>能力：<b id="demoAbility"></b></strong></div><div class="exam-point-line demo-topic-line"><span aria-hidden="true">'+icons.target+'</span><strong>话题：<b id="demoTopic"></b></strong></div>');
  const progress=$('#audioProgressFloat'),pair=document.createElement('span');pair.className='demo-audio-time';pair.append($('#audioCurrentTime'),document.createTextNode(' / '),$('#audioDuration'));progress.after(pair);
  pair.insertAdjacentHTML('afterend','<span id="suiteEstimate" class="demo-suite-estimate" aria-label="套题预计时长">套题预计时长 --分--秒</span>');
  const panel=$('#themeSegment');Object.entries(themes).filter(([k])=>!['dark','light'].includes(k)).forEach(([key,t])=>panel.insertAdjacentHTML('beforeend','<button data-theme-choice="'+key+'" role="radio" type="button" style="--theme-swatch:'+t.bg+'">'+t.name+'</button>'));
  $('#fontDown').after(Object.assign(document.createElement('span'),{id:'demoFontValue'}));
  ['#returnToLecture','#playPause','#fontDown','#fontUp','#onlineFontDown','#onlineFontUp'].forEach(id=>$(id).addEventListener('click',e=>{
   if(id==='#playPause'&&state.practiceModeActive)return;
   e.preventDefault();e.stopImmediatePropagation();
   if(id==='#returnToLecture')handleFullReturn();else if(id==='#playPause')toggleAudio();else setFullFont(state.fullFont+(id.endsWith('Up')?3:-3));
  },true));
  document.addEventListener('click',e=>{const b=e.target.closest('[data-theme-choice]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();state.theme=b.dataset.themeChoice;demoStorage.setItem('victor:theme',state.theme);applyTheme();},true);
  document.addEventListener('keydown',e=>{
   if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)||els.fullscreenPage.classList.contains('hidden')||view==='all')return;
   if(e.target.closest('input,textarea,select,[contenteditable="true"],[role="slider"]'))return;
   if([...document.querySelectorAll('[role="dialog"],#popover')].some(x=>!x.classList.contains('hidden')&&x.getBoundingClientRect().width))return;
   if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();navigateQuestion(e.key==='ArrowUp'?-1:1);return;}
   if(state.practiceModeActive&&state.practicePhase!=='recording')return;
   if(!Number.isFinite(els.audio.duration)||!els.audio.duration)return;
   e.preventDefault();const t=Math.max(0,Math.min(els.audio.duration,els.audio.currentTime+(e.key==='ArrowRight'?5:-5)));
   if(state.followReadActive){state.followReadPendingSeekTime=t;applyFollowReadSeek();}else els.audio.currentTime=t;updateAudioProgress();
  });
  state.fullFont=Number(demoStorage.getItem('victor:fullFont')||48);setFullFont(state.fullFont);applyTheme();
  if(!els.fullscreenPage.classList.contains('hidden'))renderFull();window.updateSuiteEstimate?.();
  window.DemoCore={get view(){return view;},get origin(){return origin;},enterAnswers,enterLecture,return:handleFullReturn,theme:applyTheme};
  window.DemoTheme={sync:applyTheme};
 }
 let resizeFrame=0;
 function syncFontGeometry(){cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{
  updatePracticeOptionLayouts();alignTranslationCopies();
  const active=els.fullQuestion.querySelector('.demo-current-audio'),grid=els.fullscreenPage.querySelector('.full-grid');
  if(active&&grid&&!els.fullscreenPage.classList.contains('hidden')&&els.popover.classList.contains('hidden')){const r=active.getBoundingClientRect(),g=grid.getBoundingClientRect();if(r.top<g.top||r.bottom>g.bottom)active.scrollIntoView({block:'nearest',behavior:'smooth'});}
 });}
 window.addEventListener('resize',syncFontGeometry);
 document.fonts?.addEventListener('loadingdone',syncFontGeometry);
 initialize();
})();
