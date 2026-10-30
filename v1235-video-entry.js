/* V1.2.35: place existing thumbnail buttons beside the original title. No new
   video, cover, source assignment, playback call or player is created here. */
(() => {
  'use strict';
  const popup=document.getElementById('popover');
  if(!popup)return;
  const supported=new Set(['词汇','语音','语法','微技能','百科知识','话题词汇','实用表达']);
  const playerForThumbnail=new WeakMap();
  let frame=0,launched=null;
  const playingView=player=>document.fullscreenElement===player || player.classList.contains('v15-video-fallback');
  function restoreFocus(){
    if(!launched)return;
    const {player,trigger}=launched;
    if(!player.isConnected||!trigger.isConnected){launched=null;return;}
    if(playingView(player)){launched.wasOpen=true;return;}
    if(launched.wasOpen){
      launched=null;
      if(!popup.classList.contains('hidden')&&!trigger.closest('[hidden],.hidden,[inert]'))trigger.focus({preventScroll:true});
    }
  }
  function update(){
    frame=0;
    if(!supported.has(popup.dataset.knowledgeType)){restoreFocus();return;}
    // Paging replaces the body/player while the original header persists.
    // A header entry must leave with the player it originally opened.
    const thumbnails=[...popup.querySelectorAll('.v15-video-thumbnail')].filter(thumbnail=>{
      const owner=playerForThumbnail.get(thumbnail);
      if(owner&&!owner.isConnected){thumbnail.remove();return false;}
      return true;
    });
    const players=[...popup.querySelectorAll('.v15-video-player')];
    thumbnails.forEach((thumbnail,index)=>{
      const row=thumbnail.closest('.v15-media-title-row');
      const body=thumbnail.closest('.resource-popover-body') || popup.querySelector('.resource-popover-body');
      const player=playerForThumbnail.get(thumbnail) || players[index];
      if(player)playerForThumbnail.set(thumbnail,player);
      const name=thumbnail.querySelector('.v15-video-info strong')?.textContent.trim();
      const label=name?`播放视频：${name}`:'播放视频';
      if(thumbnail.getAttribute('aria-label')!==label)thumbnail.setAttribute('aria-label',label);
      if(thumbnail.title!==label)thumbnail.title=label;
      if(popup.dataset.knowledgeType==='词汇'||(popup.dataset.knowledgeType==='语音'&&body?.querySelector('.knowledge-term'))){
        const sourceContent=player?.closest('.ke-resource-content');
        const title=sourceContent?.querySelector('.knowledge-term') || body?.querySelector('.knowledge-term');
        if(title){
          if(!title.classList.contains('v1235-word-video-title'))title.classList.add('v1235-word-video-title');
          if(thumbnail.parentElement!==title)title.append(thumbnail);
        }
      }else if(popup.dataset.knowledgeType==='语音'){
        // A sentence phenomenon owns its body heading. Its source video shares
        // that row; the outer header remains the resource category only.
        const title=body?.querySelector('.pronunciation-content-title');
        const titleRow=title?.closest('.v15-media-title-row') || row;
        if(titleRow&&thumbnail.parentElement!==titleRow)titleRow.append(thumbnail);
      }else if(row&&!row.querySelector('.ke-wiki-name,.resource-detail-title')){
        // A direct single-item popup can omit the page's own subtitle. Its
        // existing header title remains the title for the same source video.
        const pageTitle=popup.querySelector('.resource-popover-page > article > strong');
        if(pageTitle){
          pageTitle.classList.add('resource-detail-title');row.prepend(pageTitle);
          return;
        }
        if(popup.classList.contains('ke-expanded')){row.classList.add('v1236-body-video-row');return;}
        const title=popup.querySelector(':scope > .resource-popover-head > div');
        if(title){
          if(!title.classList.contains('v1235-video-title-host'))title.classList.add('v1235-video-title-host');
          if(thumbnail.parentElement!==title)title.append(thumbnail);
        }
      }
      if(row&&row!==thumbnail.parentElement&&!row.children.length)row.remove();
    });
    restoreFocus();
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update);}
  // Keep native Enter/Space activation and the V15 click handlers. Remember
  // only the invoking button so exiting the independent layer restores focus.
  popup.addEventListener('click',event=>{
    if(!supported.has(popup.dataset.knowledgeType))return;
    const trigger=event.target.closest?.('.v15-video-thumbnail,.v15-video-fullscreen-button');
    if(!trigger)return;
    const player=playerForThumbnail.get(trigger) || trigger.classroomMediaOwner?.closest('.v15-video-player');
    if(player)launched={player,trigger,wasOpen:false};
  },true);
  new MutationObserver(schedule).observe(popup,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-knowledge-type','data-v15-fullscreen']});
  document.addEventListener('fullscreenchange',()=>{restoreFocus();schedule();});
  window.V1235VideoEntries={refresh:schedule,inspect:()=>[...popup.querySelectorAll('.v15-video-thumbnail')].map(button=>({
    type:popup.dataset.knowledgeType,title:button.title,width:button.getBoundingClientRect().width,height:button.getBoundingClientRect().height,
    host:button.parentElement?.className,playerPresent:Boolean(playerForThumbnail.get(button)?.isConnected),
    badgeBeforeVideo:Boolean(button.parentElement?.querySelector('.ke-exam-frequency'))
  }))};
  schedule();
})();
