/* Retry original media after a temporary service/network failure; never substitute another file. */
(()=>{'use strict';let pending=null,lastAttempt=0,hadPlaybackError=false;
 els.audio.addEventListener('error',()=>{hadPlaybackError=true;});
 els.audio.addEventListener('loadedmetadata',()=>{if(hadPlaybackError&&!state.practiceModeActive){hadPlaybackError=false;document.getElementById('playPause').disabled=false;document.getElementById('playPause').title='播放';document.getElementById('audioSeek').disabled=false;updateAudioProgress();}});
 async function retry(){
  const needsRetry=!!els.audio.error||[...document.querySelectorAll('img.resource-guidance-avatar')].some(i=>i.complete&&!i.naturalWidth)||(window.DemoAudioEngine?.metadata||[]).some(x=>['missing','unknown'].includes(x.status));
  if(!needsRetry)return true;
  if(pending)return pending;if(Date.now()-lastAttempt<1500)return;lastAttempt=Date.now();
  pending=(async()=>{
   try{let response=await fetch('./index.html?media-retry='+Date.now(),{cache:'no-store'});if(!response.ok)return false;}catch{return false;}
   document.querySelectorAll('img.resource-guidance-avatar').forEach(img=>{if(img.complete&&!img.naturalWidth){const src=img.dataset.originalMediaSrc||img.getAttribute('src');img.dataset.originalMediaSrc=src;const url=new URL(src,document.baseURI);url.searchParams.set('media-retry',String(Date.now()));img.src=url.href;}});
   if(els.audio.error){els.audio.load();updateAudioProgress();}
   await window.DemoAudioEngine?.retryMetadata();return true;
  })().finally(()=>{pending=null});return pending;
 }
 window.addEventListener('online',retry);window.addEventListener('focus',retry);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')retry();});
 document.getElementById('playPause').addEventListener('click',()=>{if(!state.practiceModeActive&&els.audio.error){els.audio.load();window.DemoAudioEngine?.retryMetadata();}},true);
 window.V12140MediaRecovery=Object.freeze({retry});
})();
