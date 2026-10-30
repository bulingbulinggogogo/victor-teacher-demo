/* Explicit review links get the same real book context as a classroom click. */
(() => {
 'use strict';
 const entry=new URLSearchParams(location.hash.slice(1));let prepared=false;
 function prepare(){
  if(prepared||!entry.has('full'))return true;
  if(!window.SingleBookCatalog||!state.questions?.length)return false;
  let ids=(entry.get('full')||'').split(',').filter(Boolean),focusId=ids[0];
  const head=new URL(location.href).searchParams.get('reviewWord');
  const source=window.SINGLE_BOOK_LATEST_WORD_DATA?.wordsByHead?.[head];
  const wordIds=new Set([source?.primaryCurrentWordId,...(source?.currentWordIds||[])].filter(Boolean).map(String));
  if(wordIds.size){
   let linked=null;
   for(const resource of Object.values(state.textResources||{})){
    for(const record of resource.categories?.['词汇']||[]){
     const matches=wordIds.has(String(record.wordId))||(record.content||[]).some(row=>wordIds.has(String(row.word_id)));
     if(!matches||!record.questionNumber)continue;
     linked=state.questions.find(q=>q.setId===resource.setId&&q.textNo===resource.textNo&&q.questionNo===record.questionNumber);
     if(linked)break;
    }
    if(linked)break;
   }
   if(linked&&linked.id!==focusId){
    focusId=linked.id;ids=[focusId];entry.set('full',focusId);
    history.replaceState(history.state,'',location.pathname+location.search+'#'+entry.toString());
   }
  }
  const question=getQuestion(focusId);
  if(question?.bookKey===window.TEST_SINGLE_BOOK?.bookKey){
   const showAnswer=state.showAnswer,showAnalysis=state.showAnalysis;
   window.SingleBookCatalog.selectBook(question.bookKey);
   openBookOverviewForClass(state.bookClassName,'catalog');
   openFull(ids,focusId,'book-overview',{setName:question.setName});
   state.showAnswer=showAnswer;state.showAnalysis=showAnalysis;renderFull();
  }
  prepared=true;return true;
 }
 window.V1284EntryContext={prepare};
 if(entry.has('full')){
  const ready=()=>{if(!prepare())requestAnimationFrame(ready);};
  requestAnimationFrame(ready);
 }
})();
