/* Keep one original resource pager. First-level multi-word resources page
 * through source entries; word-detail meanings and example trees remain whole.
 * V1.2.26: the original pager shares the fullscreen control group. */
(() => {
 'use strict';
 const popup=document.getElementById('popover');
 if(!popup || typeof showResourcePopover!=='function' || typeof showResourceCollectionPopover!=='function')return;
 const originalShow=showResourcePopover,originalCollection=showResourceCollectionPopover;
 const identity=item=>String(item?.sourceRecordId||item?.analysisRecordId||item?.analysisRow||item?.sourceAnalysisRow||'');
 function sameHighlightItems(event,type,item){
  const trigger=event?.target instanceof Element?event.target.closest('[data-resource-question-id]'):null;
  const question=typeof getQuestion==='function'?getQuestion(trigger?.dataset.resourceQuestionId||state.currentQuestionId):null;
  if(!question || typeof knowledgeItemsForQuestion!=='function')return[item];
  const candidates=knowledgeItemsForQuestion(question,type),source=libraryResourceForItem(item)||item;
  const target=String(item.highlightTarget||source.highlight||'').trim(),area=String(item.targetArea||source.targetArea||'录音稿');
  // Use only the current book/question's actual resources. The exact target
  // retains its occurrence suffix, and target areas never cross-group.
  if(!target || !candidates.some(candidate=>identity(candidate)===identity(item)))return[item];
  const siblings=candidates.filter(candidate=>{
   const row=libraryResourceForItem(candidate)||candidate;
   return String(candidate.highlightTarget||row.highlight||'').trim()===target && String(candidate.targetArea||row.targetArea||'录音稿')===area;
  });
  return siblings.length>1?siblings:[item];
 }
 const flatten=(type,items)=>items.flatMap(item=>{
  if(!['词汇','语音'].includes(type) || !Array.isArray(item.content) || item.content.length<2)return[item];
  return item.content.map((entry,index)=>({...item,content:[entry],v1225SourceEntry:index,v1225SourceEntryCount:item.content.length}));
 });
 showResourcePopover=function(event,type,item){
  const grouped=sameHighlightItems(event,type,item);
  const pages=flatten(type,grouped),initial=Math.max(0,pages.findIndex(page=>identity(page)===identity(item)));
  return pages.length>1?originalCollection(event,type,pages,initial):originalShow(event,type,item);
 };
 showResourceCollectionPopover=function(event,type,items,startIndex=0){return originalCollection(event,type,flatten(type,items),startIndex);};
 let frame=0;
 const groupModels=new WeakMap();
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(sync);};
 function mountGroupedSpeech(){
  if(popup.querySelector('.resource-popover-pager'))return;
  const group=popup.querySelector('.v16-speech-group');
  if(!group || groupModels.has(group))return;
  const members=[...group.children].filter(node=>node.matches('[data-knowledge-record]'));
  if(members.length<2)return;
  const pager=document.createElement('footer');pager.className='resource-popover-pager';
  const previous=document.createElement('button'),next=document.createElement('button'),count=document.createElement('span');
  previous.type=next.type='button';previous.dataset.resourcePagePrev='';next.dataset.resourcePageNext='';
  previous.innerHTML=icons['arrow-left']+'<span>上一条</span>';next.innerHTML='<span>下一条</span>'+icons['arrow-right'];pager.append(previous,count,next);group.after(pager);
  const model={group,members,pager,index:0};groupModels.set(group,model);
  const draw=()=>{
   members.forEach((member,index)=>{member.hidden=index!==model.index;});
   group.dataset.v1225MemberPage=String(model.index);count.textContent=(model.index+1)+' / '+members.length;
   previous.disabled=model.index===0;next.disabled=model.index===members.length-1;
   window.ClassroomTools?.refresh?.();schedule();
  };
  const step=delta=>{
   resourceDetailAudio.pause();if(typeof restoreMainAudioAfterResource==='function')restoreMainAudioAfterResource();
   popup.querySelectorAll('video,audio').forEach(media=>media.pause());
   model.index=Math.max(0,Math.min(members.length-1,model.index+delta));draw();
   popup.querySelector('.resource-popover-body')?.scrollTo({top:0,behavior:'instant'});
  };
  previous.addEventListener('click',event=>{event.stopPropagation();step(-1);});next.addEventListener('click',event=>{event.stopPropagation();step(1);});draw();
 }
 function sync(){
  frame=0;
  if(popup.classList.contains('hidden'))return;
  const footer=popup.querySelector(':scope > .classroom-modal-tools');
  if(!footer)return;
  const controls=footer.querySelector(':scope > .classroom-modal-expand-host');
  if(!controls)return;
  mountGroupedSpeech();
  const pagers=[...popup.querySelectorAll('.resource-popover-pager')];
  if(popup.classList.contains('v1225-has-resource-pager')!==(pagers.length>0))popup.classList.toggle('v1225-has-resource-pager',pagers.length>0);
  pagers.forEach(pager=>{
   // Keep the source node and its listeners. ClassroomTools owns fullscreen's
   // real button and reservation; the pager occupies the adjacent flex slot.
   // The fullscreen reservation stays outermost; the pager follows inward.
   // The parent group mirrors with the lecture layout, while the pager itself
   // remains left-to-right so previous/next retain their visual direction.
   const fullscreen=controls.querySelector(':scope > [data-classroom-tool-kind="expand"]');
   if(fullscreen){
    if(pager.parentElement!==controls || pager.previousElementSibling!==fullscreen)controls.insertBefore(pager,fullscreen.nextSibling);
   }else if(pager.parentElement!==controls)controls.append(pager);
   if(!pager.classList.contains('v1225-resource-pager'))pager.classList.add('v1225-resource-pager');
   if(pager.getAttribute('aria-label')!=='知识内容翻页')pager.setAttribute('aria-label','知识内容翻页');
   for(const [selector,label] of [['[data-resource-page-prev]','上一条'],['[data-resource-page-next]','下一条']]){
    const button=pager.querySelector(selector);if(!button)continue;
    if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);
    if(button.title!==label)button.title=label;
   }
   const count=pager.querySelector(':scope > span');if(count){
    if(count.getAttribute('aria-live')!=='polite')count.setAttribute('aria-live','polite');
    if(count.getAttribute('aria-atomic')!=='true')count.setAttribute('aria-atomic','true');
   }
  });
 }
 new MutationObserver(schedule).observe(popup,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
 window.addEventListener('resize',schedule);
 window.V1225ResourcePaging={flatten,sameHighlightItems,refresh:schedule,inspect:()=>({pagers:popup.querySelectorAll('.resource-popover-pager').length,count:popup.querySelector('.resource-popover-pager > span')?.textContent.trim()||null,right:popup.querySelector('.resource-popover-pager')?.getBoundingClientRect().right||null,groupPage:popup.querySelector('[data-v1225-member-page]')?.dataset.v1225MemberPage||null,visibleWords:[...popup.querySelectorAll('.knowledge-entry')].filter(node=>!node.closest('[hidden],.hidden')).map(node=>node.querySelector('.knowledge-word')?.textContent.trim()).filter(Boolean),firstLevelOnly:true})};
})();
