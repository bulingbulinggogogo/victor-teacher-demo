/* V1.2.112: compact design-06 drawer, symmetric content gutters and direct fullscreen playback. */
(() => {
'use strict';
const original=resourceMediaDetail;
resourceMediaDetail=function(item,contexts){const html=original(item,contexts),source=libraryResourceForItem(item),title=source?.videoTitle||source?.title||item.title||'讲解视频';return html.replace('<aside class="resource-media-panel">','<aside class="resource-media-panel" data-v105-video-title="'+escapeHtml(title)+'">');};
const controllers=new Map();
const make=(tag,cls)=>{const n=document.createElement(tag);n.className=cls;return n;};
function setup(popup){
 if(!popup||controllers.has(popup))return;
 const contentSettled=e=>{if(e.target.matches?.('.resource-popover-body')&&e.propertyName==='padding-left')window.V1235KnowledgeSize?.refresh();};popup.addEventListener('transitionend',contentSettled);
 const records=new Map();let rail,body,track,handle,active,stage,fullscreenRecord,frame=0,sequence=0,collapsed=true,palette='';
 const setStyle=(name,value)=>{if(rail.style.getPropertyValue(name)!==value)rail.style.setProperty(name,value);};
 function side(){return document.getElementById('classroomDock')?.classList.contains('dock-right')?'right':'left';}
 function drawHandle(){
  const outward=side()==='left';const right=collapsed?outward:!outward;
  handle.innerHTML='<span class="v112-video-label">视频</span><svg class="v112-video-direction" viewBox="0 0 24 24" aria-hidden="true"><path d="'+(right?'m9 5 7 7-7 7':'m15 5-7 7 7 7')+'"/></svg>';
  handle.setAttribute('aria-expanded',String(!collapsed));handle.setAttribute('aria-label',collapsed?'展开视频':'收起视频');handle.title=collapsed?'展开视频':'收起视频';
 }
 function ensure(){
  if(rail){if(!rail.isConnected)popup.append(rail);return;}
  rail=make('aside','v108-edge-video');rail.dataset.v108VideoOwner=popup.id;rail.setAttribute('aria-label','讲解视频');
  handle=make('button','v108-video-handle');handle.type='button';body=make('div','v108-video-content');body.id=popup.id+'-edge-video';handle.setAttribute('aria-controls',body.id);track=make('div','v112-video-track');track.append(body,handle);rail.append(track);rail.classList.add('is-collapsed');body.inert=true;body.setAttribute('aria-hidden','true');popup.append(rail);
  rail.addEventListener('click',e=>e.stopPropagation());
  handle.addEventListener('click',()=>{collapsed=!collapsed;rail.classList.toggle('is-collapsed',collapsed);body.inert=collapsed;body.setAttribute('aria-hidden',String(collapsed));popup.classList.toggle('v112-video-open',!collapsed);if(collapsed)active?.video.pause();drawHandle();schedule();});
  drawHandle();
 }
 function closePlayback(exit=true){
  if(!stage||stage.hidden)return;
  const r=fullscreenRecord;fullscreenRecord=null;r?.video.pause();
  if(r){r.video.controls=false;r.player.prepend(r.video);r.play.hidden=false;}
  stage.hidden=true;
  if(exit&&document.fullscreenElement===stage)document.exitFullscreen?.().catch(()=>{});
  if(!rail.hidden&&!collapsed)r?.play.focus({preventScroll:true});
 }
 function playFullscreen(r){
  if(!stage){
   stage=make('section','v112-fullscreen-video v15-video-player');stage.id=popup.id+'-fullscreen-video';stage.dataset.v108VideoOwner=popup.id;stage.hidden=true;stage.setAttribute('role','dialog');stage.setAttribute('aria-modal','true');stage.setAttribute('aria-label','讲解视频全屏播放');
   const close=make('button','v112-video-exit');close.type='button';close.textContent='退出全屏';close.setAttribute('aria-label','退出讲解视频全屏');close.addEventListener('click',()=>closePlayback());stage.append(close);document.body.append(stage);
   stage.addEventListener('click',e=>e.stopPropagation());
  }
  if(fullscreenRecord)closePlayback();fullscreenRecord=r;stage.hidden=false;stage.prepend(r.video);r.video.controls=true;r.video.removeAttribute('controlslist');
  const request=stage.requestFullscreen?.();request?.catch(()=>{});
  r.video.play().catch(reason=>{if(reason.name!=='AbortError'){r.error.hidden=false;closePlayback();}});
  stage.querySelector('button').focus({preventScroll:true});
 }
 // Capture the outside click even when the teaching dialog stops bubbling.
 const outsideClick=e=>{
  if(!rail||rail.hidden||collapsed||rail.contains(e.target)||stage?.contains(e.target))return;
  // Closing the drawer must not interrupt the independent fullscreen player.
  if(stage&&!stage.hidden)return;
  handle.click();
 };
 document.addEventListener('click',outsideClick,true);
 document.addEventListener('fullscreenchange',()=>{if(stage&&!stage.hidden&&document.fullscreenElement!==stage)closePlayback(false);});
 const escape=e=>{if(e.key==='Escape'&&stage&&!stage.hidden){e.preventDefault();e.stopImmediatePropagation();closePlayback();}};
 window.addEventListener('keydown',escape,true);
 function activate(r){if(active&&active!==r){closePlayback();active.video.pause();}active=r;collapsed=true;if(!rail.classList.contains('is-collapsed'))rail.classList.add('is-collapsed');body.inert=true;body.setAttribute('aria-hidden','true');popup.classList.remove('v112-video-open');drawHandle();for(const rec of records.values())rec.player.hidden=rec!==r;}
 function enhance(video){
  if(records.has(video))return;
  const panel=video.closest('.resource-media-panel,.v1270-media-figure');if(!panel)return;
  ensure();const anchor=document.createComment('video source');if(panel.classList.contains('resource-media-panel'))panel.before(anchor);else video.before(anchor);
  if(panel.classList.contains('v1270-media-figure')){panel.classList.add('v105-relocated-video');panel.querySelectorAll('button').forEach(b=>b.hidden=true);}
  const title=panel.dataset.v105VideoTitle||'讲解视频',player=make('div','v108-video-player');
  video.controls=false;video.preload='metadata';video.setAttribute('controlslist','nofullscreen nodownload noremoteplayback');video.disablePictureInPicture=true;video.disableRemotePlayback=true;video.playsInline=true;video.setAttribute('aria-label',title);
  const play=make('button','v108-video-play');play.type='button';play.setAttribute('aria-label','播放讲解视频：'+title);play.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7Z"/></svg>';
  const error=make('p','v108-video-error');error.textContent='视频暂时无法加载';error.hidden=true;
  player.append(video,play,error);body.append(player);
  const cover=make('img','v112-video-cover');cover.src=video.poster;cover.alt='';player.prepend(cover);const r={video,player,anchor,title,play,error,id:++sequence};records.set(video,r);
  play.addEventListener('click',()=>playFullscreen(r));
  video.addEventListener('error',()=>error.hidden=false);video.addEventListener('loadedmetadata',()=>error.hidden=true);
  video.addEventListener('play',()=>{error.hidden=true;video.controls=true;play.hidden=true;for(const rec of records.values())if(rec!==r)rec.video.pause();if(typeof els!=='undefined')els.audio?.pause();});
  video.addEventListener('ended',()=>{video.controls=false;play.hidden=false;});
 }
 function shown(r){
  if(popup.classList.contains('hidden')||popup.inert||popup.getAttribute('aria-hidden')==='true')return false;
  let n=r.anchor.parentElement;if(!n?.isConnected)return false;
  for(;n&&n!==popup;n=n.parentElement)if(n.hidden||n.classList.contains('hidden')||getComputedStyle(n).display==='none')return false;
  return true;
 }
 function update(){
  frame=0;popup.querySelectorAll('.resource-media-panel video,.v1270-media-figure video').forEach(enhance);if(!rail)return;
  const visible=[];for(const [v,r]of records){if(!r.anchor.isConnected){if(fullscreenRecord===r)closePlayback();v.pause();r.player.remove();records.delete(v);}else if(shown(r))visible.push(r);else {v.pause();if(fullscreenRecord===r)closePlayback();}}
  if(rail.hidden!==!visible.length)rail.hidden=!visible.length;
  if(popup.id==='popover'&&popup.classList.contains('v109-has-video')!==!!visible.length)popup.classList.toggle('v109-has-video',!!visible.length);
  if(popup.classList.contains('v112-has-video')!==!!visible.length)popup.classList.toggle('v112-has-video',!!visible.length);
  if(!visible.length){collapsed=true;if(!rail.classList.contains('is-collapsed'))rail.classList.add('is-collapsed');if(!body.inert)body.inert=true;if(body.getAttribute('aria-hidden')!=='true')body.setAttribute('aria-hidden','true');if(popup.classList.contains('v112-video-open'))popup.classList.remove('v112-video-open');if(handle.getAttribute('aria-expanded')!=='false')drawHandle();return;}
  if(!visible.includes(active))activate(visible[0]);
  const direction=side();if(rail.dataset.side!==direction){rail.dataset.side=direction;drawHandle();}
  // The absolute rail shares its owner geometry and cannot lag a dialog resize.
  const theme=document.body.dataset.demoTheme+'|'+(typeof state==='undefined'?'':state.theme);
  if(palette!==theme){palette=theme;const css=getComputedStyle(popup);for(const name of css)if(name.startsWith('--lecture-'))rail.style.setProperty(name,css.getPropertyValue(name));}
  const z=Number.parseInt(getComputedStyle(popup).zIndex,10)||100;setStyle('z-index',String(z+5));
  // Keep the sliding rail inside its owner; symmetric body insets reserve its occupied width.
  const ownerRect=popup.getBoundingClientRect(),scaleX=ownerRect.width/popup.offsetWidth||1,scaleY=ownerRect.height/popup.offsetHeight||1;
  const panel={left:0,top:0,right:popup.clientWidth,bottom:popup.clientHeight},footer=popup.querySelector(':scope > .classroom-modal-tools');
  const footerHeight=footer?.offsetHeight||0;
  const header=popup.querySelector(':scope > .resource-popover-head');
  const headerHeight=header?.offsetHeight||0;
  const width=156,height=76;
  const x=direction==='left'?panel.left+1:panel.right-width-1;
  let y=panel.bottom-footerHeight-height-12;
  for(const node of popup.querySelectorAll('.v105-popup-dock:not([hidden]),#classroomDock,#interfaceSettingsPanel:not(.hidden)')){
    const bounds=node.getBoundingClientRect(),rect={width:bounds.width,height:bounds.height,left:(bounds.left-ownerRect.left)/scaleX,right:(bounds.right-ownerRect.left)/scaleX,top:(bounds.top-ownerRect.top)/scaleY};if(!rect.width||!rect.height||getComputedStyle(node).display==='none')continue;
    if(direction==='left'?rect.left<x+width:rect.right>x)y=Math.min(y,rect.top-height-12);
  }
  y=Math.max(panel.top+headerHeight+8,Math.min(panel.bottom-footerHeight-height-4,y));
  if(rail.dataset.attachment!=='inside')rail.dataset.attachment='inside';
  setStyle('left',direction==='left'?'1px':'auto');setStyle('right',direction==='right'?'1px':'auto');setStyle('top','auto');setStyle('bottom',(panel.bottom-y-height)+'px');

 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 const observer=new MutationObserver(schedule);observer.observe(popup,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','inert','aria-hidden']});
 const dockObserver=new MutationObserver(schedule);const dock=document.getElementById('classroomDock');if(dock)dockObserver.observe(dock,{attributes:true,attributeFilter:['class']});dockObserver.observe(document.body,{attributes:true,attributeFilter:['data-demo-theme']});
 const resizer=new ResizeObserver(schedule);resizer.observe(popup);
 window.addEventListener('resize',schedule);
 controllers.set(popup,{refresh:schedule,dispose(){resizer.disconnect();observer.disconnect();dockObserver.disconnect();window.removeEventListener('resize',schedule);popup.removeEventListener('transitionend',contentSettled);window.removeEventListener('keydown',escape,true);document.removeEventListener('click',outsideClick,true);closePlayback();stage?.remove();cancelAnimationFrame(frame);for(const r of records.values())r.video.pause();rail?.remove();controllers.delete(popup);}});schedule();
}
function mount(){for(const [popup,c]of controllers)if(!popup.isConnected)c.dispose();['popover','lexicalChunkDialog'].forEach(id=>setup(document.getElementById(id)));}
window.V15LectureMedia={refresh(){mount();for(const c of controllers.values())c.refresh();}};
new MutationObserver(mount).observe(document.body,{childList:true});mount();
})();
