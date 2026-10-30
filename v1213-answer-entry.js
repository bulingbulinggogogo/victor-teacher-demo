/* Answer overview uses the existing lecture/return route and the same side dock. */
(() => {
  'use strict';
  const dock=document.getElementById('classroomDock');
  if(!dock || !window.DemoCore) return;
  const group=document.createElement('div');group.className='v13-answer-tools';
  const button=document.createElement('button');button.type='button';button.className='dock-text-action active';button.textContent='去讲解';button.title='去讲解';button.setAttribute('aria-label','从本套第1题进入讲解');group.append(button);dock.insertBefore(group,dock.querySelector('.dock-footer-actions'));
  button.addEventListener('click',()=>{
    const current=getQuestion(state.currentQuestionId);
    const first=currentLectureIds().map(getQuestion).filter(q=>q && q.setId===current?.setId).sort((a,b)=>a.questionNo-b.questionNo)[0];
    if(first) window.DemoCore.enterLecture(first.id);
  });
  function sync(){
    const visible=els.fullscreenPage.classList.contains('demo-all-answers');group.hidden=!visible;
    const sheet=els.fullQuestion.querySelector('.demo-answer-sheet');
    if(visible && sheet && !sheet.querySelector('.v13-answer-hint')){
      const help=document.createElement('p');help.className='v13-answer-hint';help.textContent='点击题号，进入该题全屏讲解。';sheet.prepend(help);
    }
  }
  const original=renderFull;renderFull=function(...args){const result=original(...args);sync();return result;};sync();
})();
