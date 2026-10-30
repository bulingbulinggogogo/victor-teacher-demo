/* Reuse existing source-bound buttons, including their listeners and media state. */
(() => {
 const popup=document.getElementById('popover');
 function mount(){
  popup.querySelectorAll('[data-v105-vocabulary]').forEach(article=>{
   const header=article.querySelector('.v105-word-header');if(!header||header.dataset.v145Mounted)return;
   header.dataset.v145Mounted='true';popup.classList.add('v145-vocabulary');
   const buttons=[article.querySelector('.ke-exam-frequency'),article.querySelector('.v105-primary'),article.querySelector('.v105-contrast')].filter(Boolean);
   if(buttons.length){
    const nav=document.createElement('nav');nav.className='v145-word-navigation';nav.setAttribute('aria-label','单词相关内容');
    buttons.forEach(button=>nav.append(button));header.append(nav);header.classList.add('v145-has-navigation');
   }
  });
  if(!popup.querySelector('[data-v105-vocabulary]'))popup.classList.remove('v145-vocabulary');
 }
 const bind=bindResourcePopoverInteractions;
 bindResourcePopoverInteractions=function(){const result=bind.apply(this,arguments);mount();return result;};
 new MutationObserver(mount).observe(popup,{childList:true,subtree:true});mount();
})();
