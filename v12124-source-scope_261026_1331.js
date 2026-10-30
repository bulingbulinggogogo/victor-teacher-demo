/* Source-only policy for the supplied test suite. Empty source fields stay empty. */
(()=>{'use strict';
 const book=window.TEST_SINGLE_BOOK,words=window.SINGLE_BOOK_LATEST_WORD_DATA;if(!book||!words)return;
 let frame=0;
 function sync(){frame=0;const q=typeof getQuestion==='function'?getQuestion(state.currentQuestionId):null;if(q?.bookKey!=='test-single-book')return;
  const analysis=document.getElementById('answerAnalysisToggle');if(analysis)analysis.hidden=!String(q.analysis||'').trim();
  const clue=document.getElementById('clueToggle')||document.getElementById('clueLocateToggle');if(clue)clue.hidden=!String(q.clueSentence||'').trim();
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(sync);}
 const oldFilterConfig=bookSpecialSecondaryFilterConfig,oldTopic=fakeBookSpecialTopic,oldGenre=fakeBookSpecialGenre;
 bookSpecialSecondaryFilterConfig=function(type){
  if(state.activeBookKey!=='test-single-book')return oldFilterConfig(type);
  if(!['长对话','独白'].includes(type))return oldFilterConfig(type);
  const values=[...new Set(book.questions.filter(q=>q.questionType===type).map(q=>String(q.topic||'').trim()).filter(Boolean))];
  return {label:type==='独白'?'话题/体裁':'话题',options:[['all','全部'],...values.map(value=>['source-topic:'+value,value])],kind:type==='独白'?'genre':'topic'};
 };
 fakeBookSpecialTopic=function(q){return q?.bookKey==='test-single-book'?'source-topic:'+String(q.topic||'').trim():oldTopic(q);};
 fakeBookSpecialGenre=function(q){return q?.bookKey==='test-single-book'?'source-topic:'+String(q.topic||'').trim():oldGenre(q);};
 const oldRender=renderFull;renderFull=function(){const result=oldRender.apply(this,arguments);schedule();return result;};
 new MutationObserver(schedule).observe(document.getElementById('fullscreenPage'),{attributes:true,childList:true,subtree:true,attributeFilter:['class']});sync();
 window.V12123RealSource={version:'V1.2.123',inspect:()=>({knowledgeRecords:book.knowledgeLibrary.analysisResources.length,simulationRecords:book.knowledgeLibrary.analysisResources.filter(r=>r.isReviewSimulation||r.isDemonstration||r.mock||r.simulated).length,wordCount:words.words.length,senseCount:words.sourceDefinitions.length,ordinaryExamples:words.examples.length,listeningExamples:words.listeningExamples.length,textbookExamples:words.textbookExamples.length,sourceOnly:true})};
})();
