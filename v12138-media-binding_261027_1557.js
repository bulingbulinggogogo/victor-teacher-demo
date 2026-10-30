/* Explicit media bindings from current source records and original timecodes. */
(()=>{'use strict';
 const original=renderPronunciationResource;
 renderPronunciationResource=function(item,source){
  const clip=item?.mediaBinding?.pronunciationClip||source?.mediaBinding?.pronunciationClip;
  const html=original.apply(this,arguments);if(!clip)return html;
  const host=document.createElement('div');host.innerHTML=html;
  const sentence=host.querySelector('.pronunciation-sentence');if(!sentence)return html;
  const fragment=document.createElement('div');fragment.innerHTML=resourceInlineAudioButton(clip.src,clip.label);
  const button=fragment.firstElementChild;if(Number.isFinite(clip.start))button.dataset.resourceStart=String(clip.start);if(Number.isFinite(clip.end))button.dataset.resourceEnd=String(clip.end);button.title=clip.label||'本题原音示范';sentence.append(button);
  return host.innerHTML;
 };
})();

/* A supplied phrase can also be opened as its own source entry. */
(()=>{'use strict';
 const norm=v=>String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLowerCase();
 function attach(host,head){
  if(!host||host.querySelector('[data-source-phrase-audio]'))return;
  const rows=(window.SINGLE_BOOK_LATEST_WORD_DATA?.collocations||[]).filter(row=>row.audioUrl&&norm(row.phrase)===norm(head));if(rows.length!==1)return;
  const box=document.createElement('div');box.innerHTML=resourceInlineAudioButton(rows[0].audioUrl,'播放词块：'+rows[0].phrase);
  const button=box.firstElementChild;button.dataset.sourcePhraseAudio=rows[0].blockKey;
  if(host.closest('#wordDetailDialog'))button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();window.DemoResourceAudio.toggle(button.dataset.resourceAudio,button);});
  const term=host.querySelector('.v105-word-headline .knowledge-word');
  if(term){
   // Keep the final word and its control together when a long phrase wraps.
   const walker=document.createTreeWalker(term,NodeFilter.SHOW_TEXT);let leaf,last;
   while(leaf=walker.nextNode())if(leaf.textContent.trim())last=leaf;
   if(last){const start=last.textContent.search(/\S+\s*$/);const tail=document.createElement('span');tail.className='v138-phrase-tail';const end=last.splitText(Math.max(0,start));end.before(tail);tail.append(end,button);}
   else term.append(button);
  }else (host.querySelector('.knowledge-term,.v1296-term-line')||host).append(button);
 }
 const mount=window.V12105Vocabulary.mount;
 window.V12105Vocabulary.mount=function(container,item){const result=mount.apply(this,arguments);container.querySelectorAll('.knowledge-entry').forEach(article=>attach(article,article.v105Context?.entry?.word));return result;};
 const api=window.V1220WordDetail,finish=api.finish;
 api.finish=function(detail,model){const result=finish.apply(this,arguments);requestAnimationFrame(()=>attach(detail.querySelector('.vwn-word-intro>.knowledge-entry'),model?.word?.displayWord||model?.word?.word));return result;};
})();
