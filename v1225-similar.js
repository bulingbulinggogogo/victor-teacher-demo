/* V1.2.25: genuine 0938 gaokao questions. The demonstration book and dictionary
 * stay untouched. Only records with an original playable audio and a source
 * exam-point id are available here. */
(() => {
  'use strict';
  const data=window.V1225_GAOKAO_SIMILAR_DATA;
  if(!data || !Array.isArray(data.questions)) return;
  const saved={open:openSimilar,render:renderFull,timecode:findTimecode,resource:textResourceForQuestion};
  const storageKey='victor:v1225-similar-source';
  const isGaokao=q=>q?.bookKey==='gaokao-0938-698';
  const sourceQuestion=()=>state.questions.find(q=>q.id===state.similarSourceQuestionId);
  let opening=false;
  findTimecode=function(q){return isGaokao(q)?data.timecodes[`${q.setId}-${q.textNo}`]||null:saved.timecode(q);};
  textResourceForQuestion=function(q){return isGaokao(q)?data.textResources[`${q.setId}-${q.textNo}`]||null:saved.resource(q);};
  similarLocalCandidates=function(source){
    if(!source || !(Number(source.examPointId)>1)) return [];
    const pool=state.similarSource==='gaokao'?data.questions:state.questions.filter(q=>q.id!==source.id && (source.bookKey?q.bookKey===source.bookKey:q.bookName===source.bookName));
    const same=pool.filter(q=>Number(q.examPointId)===Number(source.examPointId));
    // Prefer the same genre, but always preserve the exact source exam point.
    return [...same.filter(q=>q.questionType===source.questionType),...same.filter(q=>q.questionType!==source.questionType)];
  };
  function syncControls(){
    if(els.fullscreenPage.dataset.mode!=='similar') return;
    const source=sourceQuestion(),candidates=similarLocalCandidates(source),used=new Set(state.similarPool.map(q=>q.baseId||q.id));
    document.querySelectorAll('[data-similar-source]').forEach(button=>{
      button.classList.remove('hidden');button.disabled=Boolean(state.practiceModeActive);
      button.classList.toggle('active',button.dataset.similarSource===state.similarSource);
      button.setAttribute('aria-pressed',String(button.dataset.similarSource===state.similarSource));
      button.title=button.dataset.similarSource==='gaokao'?'真实高考同考点题目':'本书其他同考点题目';
    });
    const swap=document.getElementById('swapSimilarQuestion');
    swap.disabled=Boolean(state.practiceModeActive)||!candidates.some(q=>!used.has(q.id));
    swap.title=swap.disabled?'暂无其他同考点题目可替换':'换一道同考点题目';
    document.getElementById('currentQuestionPicker').disabled=!state.similarPool.length;
  }
  buildSimilarPool=function(source){
    state.similarSourceQuestionId=source.id;
    if(opening){const chosen=demoStorage.getItem(storageKey);state.similarSource=['book','gaokao'].includes(chosen)?chosen:'gaokao';}
    const candidates=similarLocalCandidates(source),key=`${source.id}:${state.similarSource}`;
    const remembered=Array.isArray(state.similarQuestionMemory[key])?state.similarQuestionMemory[key]:[];
    const picked=remembered.map(id=>candidates.find(q=>q.id===id)).filter(Boolean).slice(0,3);
    // Keep the source's genre first where possible. Cycling uses the same exact
    // point, so sparse genres never silently produce a different kind of skill.
    for(const item of candidates){if(picked.length>=Math.min(3,candidates.length))break;if(!picked.some(q=>q.id===item.id))picked.push(item);}
    state.similarQuestionMemory[key]=picked.map(q=>q.id);
    state.similarPool=picked.map((item,index)=>({...item,id:`similar-${state.similarSource}-${source.id}-${item.id}`,baseId:item.id,similarSourceQuestionId:source.id,sourceQuestionNo:item.sourceQuestionNo||item.questionNo,questionNo:index+1,stem:`${index+1}. ${String(item.stem).replace(/^\s*\d+\s*[.．]\s*/,'')}`,examSource:item.examSource||item.setName||'',correctRate:item.correctRate}));
    syncControls();
  };
  openSimilar=function(){opening=true;try{return saved.open();}finally{opening=false;}};
  setSimilarSource=function(source){
    if(!['book','gaokao'].includes(source)||state.similarSource===source||state.practiceModeActive) return;
    const current=sourceQuestion();if(!current)return;
    invalidateResourceMainAudioResume();closeResourcePopover();resetTranscriptTeachingModes({restoreAnalysis:false,render:false});els.audio.pause();setPlayButton(false);
    state.similarSource=source;demoStorage.setItem(storageKey,source);buildSimilarPool(current);
    state.explainIds=state.similarPool.map(q=>q.id);state.originalExplainIds=[...state.explainIds];state.currentQuestionId=state.explainIds[0]||null;
    state.showAnswer=false;state.showAnswerAnalysis=false;state.showAnalysis=false;state.questionPanelCollapsed=false;state.showQuestionTranslation=false;state.showTranscriptTranslation=false;state.activeKnowledgeType=null;state.playbackStopTime=null;state.playbackScope=null;
    renderFull();
  };
  function renderEmpty(){
    // The shared renderer initializes the original toolbar and layout lifecycle.
    // No source question remains visible: replace its content synchronously.
    const source=sourceQuestion(),id=state.currentQuestionId;
    if(source){state.currentQuestionId=source.id;saved.render();state.currentQuestionId=id;}
    els.fullscreenPage.classList.add('v1225-similar-empty');els.fullscreenPage.classList.remove('analysis-open','question-panel-collapsed');
    els.fullTitle.textContent=`同类题——${state.similarExamPoint||examPointLabel(source||{})}`;
    els.fullQuestion.innerHTML=`<div class="v1225-similar-empty-message" role="status"><strong>${state.similarSource==='book'?'本书暂无其他同考点题目':'暂无可用的高考同考点题目'}</strong><p>可切换到${state.similarSource==='book'?'高考':'本书'}，或返回原题讲解。</p></div>`;
    els.audio.pause();els.audio.removeAttribute('src');els.audio.load();setPlayButton(false);
    ['prevQuestion','nextQuestion','playPause','audioSeek','currentQuestionPicker','answerToggle','answerAnalysisToggle','analysisToggle','followReadBtn','questionTranslate'].forEach(id=>{const el=document.getElementById(id);if(el)el.disabled=true;});
    document.getElementById('audioSeek').value='0';document.getElementById('audioSeek').style.setProperty('--progress','0%');document.getElementById('audioSeek').style.setProperty('--seek-percent','0%');document.getElementById('currentQuestionPicker').textContent='暂无题目';document.getElementById('audioDuration').textContent='--:--';document.getElementById('audioCurrentTime').textContent='00:00';
    syncControls();
  }
  renderFull=function(){
    const similar=els.fullscreenPage.dataset.mode==='similar';
    els.fullscreenPage.classList.toggle('v1225-similar-empty',similar&&!state.similarPool.length);
    if(similar&&!state.similarPool.length)return renderEmpty();
    const result=saved.render();
    // These controls are disabled for an empty source and restored by a real
    // question. Standard rendering still owns their ordinary disabled states.
    document.getElementById('currentQuestionPicker').disabled=false;
    if(!state.followReadActive&&!state.practiceModeActive)document.getElementById('answerToggle').disabled=false;
    syncControls();return result;
  };
  window.V1225Similar={data,candidates:similarLocalCandidates,sourceQuestion};
})();
