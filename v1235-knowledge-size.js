/* V57: one geometry owner for the five in-scope ordinary knowledge dialogs.
 * Select the least 16:9 candidate in 720px..90vw, grow at the width cap when
 * necessary, then reclaim unused height for every type. A wrapped visible word heading or
 * current-context meaning can request additional width. Expanded knowledge,
 * word-detail, grammar and fullscreen media retain their existing owners. */
(() => {
 'use strict';
 const popup=document.getElementById('popover');if(!popup)return;
 const types=new Set(['词汇','微技能','语音','百科知识','实用表达']);
 const ratio=16/9,epsilon=1;
 let frame=0,last=null,measuring=false,fitCount=0,committedSize=null;
 let assetBody=null,assetKey='',assetSince=0,assetTimer=0;
 const reasons=new Set();
 const managed=/--v1246-popup-(?:width|height)\s*:[^;]+;?/g;
 const styleWithoutSizing=value=>String(value||'').replace(managed,'').replace(/\s+/g,'').replace(/;+/g,';');
 const classWithoutSizing=value=>String(value||'').split(/\s+/).filter(name=>name&&!['v1246-adaptive-knowledge','v1235-fixed-knowledge'].includes(name)).sort().join(' ');
 const set=(name,value)=>{if(popup.style.getPropertyValue(name)!==value)popup.style.setProperty(name,value);};
 const supported=()=>types.has(popup.dataset.knowledgeType)&&!popup.classList.contains('ke-expanded')&&!popup.hidden&&!popup.classList.contains('hidden');
 const shown=node=>Boolean(node&&!node.closest('[hidden],.hidden')&&getComputedStyle(node).display!=='none'&&getComputedStyle(node).visibility!=='hidden'&&node.getClientRects().length);
 const activeBody=()=>[...popup.querySelectorAll('.resource-popover-body')].find(shown);
 function clearAssetWait(){
  if(assetTimer)clearTimeout(assetTimer);assetTimer=0;assetBody=null;assetKey='';assetSince=0;
 }
 function assetsReady(body){
  // Independent pictures need their intrinsic ratio; avatars and thumbnails
  // already have fixed slots. Failed images are complete too. Bound the wait.
  const images=[...body.querySelectorAll('.resource-image-frame:not(:fullscreen)>img')].filter(shown);
  const pending=images.some(image=>!image.complete),fontsPending=document.fonts?.status==='loading';
  if(!pending&&!fontsPending){clearAssetWait();return true;}
  const key=images.map(image=>image.currentSrc||image.src).join('|');
  if(assetBody!==body||assetKey!==key){clearAssetWait();assetBody=body;assetKey=key;assetSince=performance.now();}
  const remaining=1000-(performance.now()-assetSince);
  if(remaining<=0)return true;
  if(!assetTimer)assetTimer=setTimeout(()=>{assetTimer=0;schedule('asset-wait-limit');},remaining+1);
  return false;
 }
 function requiredContentHeight(body){
  // scrollHeight is at least clientHeight. Flow-child edges reveal intrinsic
  // height without retaining an earlier, roomier page reservation.
  const bodyRect=body.getBoundingClientRect(),style=getComputedStyle(body);
  const children=[...body.children].filter(node=>{
   const position=getComputedStyle(node).position;
   return shown(node)&&position!=='fixed'&&position!=='absolute';
  });
  const bottom=children.reduce((edge,node)=>Math.max(edge,node.getBoundingClientRect().bottom+body.scrollTop+
   (parseFloat(getComputedStyle(node).marginBottom)||0)),bodyRect.top+(parseFloat(style.paddingTop)||0));
  const naturalBodyHeight=Math.ceil(bottom-bodyRect.top+(parseFloat(style.paddingBottom)||0));
  const chrome=popup.getBoundingClientRect().height-bodyRect.height;
  return Math.ceil(chrome+naturalBodyHeight);
 }
 function isOneLine(copy,textSelector='.resource-sense-meta,.resource-sense-meaning'){
  const style=getComputedStyle(copy),lineHeight=parseFloat(style.lineHeight)||parseFloat(style.fontSize)*1.5;
  const walker=document.createTreeWalker(copy,NodeFilter.SHOW_TEXT),range=document.createRange();
  let node,top=Infinity,bottom=-Infinity;
  while((node=walker.nextNode())){
   if(!node.textContent.trim()||(textSelector&&!node.parentElement.closest(textSelector)))continue;
   range.selectNodeContents(node);
   for(const rect of range.getClientRects()){
    if(rect.width<.1||rect.height<.1)continue;
    top=Math.min(top,rect.top);bottom=Math.max(bottom,rect.top);
   }
  }
  return bottom-top<=lineHeight*.5;
 }
 function fit(){
  frame=0;if(measuring)return;
  const ordinary=supported();
  if(popup.classList.contains('v1246-adaptive-knowledge')!==ordinary)popup.classList.toggle('v1246-adaptive-knowledge',ordinary);
  if(!ordinary||getComputedStyle(popup).display==='none'){
   clearAssetWait();last=null;committedSize=null;reasons.clear();return;
  }
  popup.classList.remove('v1235-fixed-knowledge');
  const body=activeBody();if(!body)return;
  if(!assetsReady(body)){popup.dataset.v1256SizeReady='false';return;}
  const viewportWidth=document.documentElement.clientWidth||innerWidth;
  const viewportHeight=document.documentElement.clientHeight||innerHeight;
  if(!viewportWidth||!viewportHeight)return;
  const maxWidth=viewportWidth*.9,maxHeight=viewportHeight*.9,minimum=Math.min(720,maxWidth);
  const previousTop=body.scrollTop,previousBody=last?._body;
  const naturalVocabulary=popup.dataset.knowledgeType==='词汇'||
   (popup.dataset.knowledgeType==='语音'&&Boolean((body.matches('.ke-vocabulary')&&shown(body))||[...body.querySelectorAll('.ke-vocabulary')].some(shown)));
  if(popup.hasAttribute('data-v1248-natural-vocabulary')!==naturalVocabulary)popup.toggleAttribute('data-v1248-natural-vocabulary',naturalVocabulary);
  if(!popup.hasAttribute('data-v1250-natural-content'))popup.setAttribute('data-v1250-natural-content','');
  if(body.getAttribute('tabindex')!=='0')body.setAttribute('tabindex','0');
  if(body.getAttribute('aria-label')!=='知识正文')body.setAttribute('aria-label','知识正文');
  if(body.getAttribute('role')!=='region')body.setAttribute('role','region');
  measuring=true;fitCount++;
  const triggers=[...reasons];reasons.clear();
  let measurementCount=0;
  const state=value=>{if(popup.dataset.v1246SizeState!==value)popup.dataset.v1246SizeState=value;};
  const setWidth=value=>set('--v1246-popup-width',value.toFixed(3)+'px');
  const setHeight=value=>set('--v1246-popup-height',value.toFixed(3)+'px');
  const fits=()=>body.scrollHeight<=body.clientHeight+epsilon&&body.scrollWidth<=body.clientWidth+epsilon&&
   requiredContentHeight(body)<=popup.getBoundingClientRect().height+epsilon;
  function measure(width){
   measurementCount++;setWidth(width);setHeight(Math.min(width/ratio,maxHeight));return fits();
  }
  try{
   state('measuring');
   let width=minimum,candidateFits=measure(minimum);
   if(!candidateFits){
    if(!measure(maxWidth))width=maxWidth;
    else{
     let low=minimum,high=maxWidth;
     for(let count=0;count<12&&high-low>.25;count++){
      const middle=(low+high)/2;if(measure(middle))high=middle;else low=middle;
     }
     width=high;
    }
    candidateFits=measure(width);
   }
   const candidateHeight=popup.getBoundingClientRect().height;
   let naturalHeight=requiredContentHeight(body);
   const heightGrowth=!candidateFits&&width>=maxWidth-.25&&naturalHeight>candidateHeight+epsilon;
   // At maximum width this grows up to 90vh before enabling scrolling;
   // shorter sheets instead reclaim the candidate's unused height.
   setHeight(Math.min(maxHeight,naturalHeight));
   const baseWidth=width,baseHeight=popup.getBoundingClientRect().height;
   const selector=body.matches('.ke-vocabulary')?'.resource-current-summary .resource-sense-line.is-context > .resource-sense-copy':'.ke-vocabulary .resource-current-summary .resource-sense-line.is-context > .resource-sense-copy';
   const currentCopies=naturalVocabulary?[...body.querySelectorAll(selector)].filter(copy=>Boolean(copy.querySelector('.resource-sense-meaning')?.textContent.trim())&&shown(copy)):[];
   const currentFits=()=>currentCopies.every(copy=>isOneLine(copy));
   // Protect only the current visible word text. Badges and the video entry
   // keep their existing ability to wrap onto another row.
   const headwords=naturalVocabulary?[...body.querySelectorAll('.knowledge-term > .knowledge-word')].filter(node=>node.textContent.trim()&&shown(node)):[];
   const headwordsFit=()=>headwords.every(node=>isOneLine(node,null)&&node.scrollWidth<=node.clientWidth+epsilon);
   const currentWrapped=currentCopies.length&&!currentFits();
   const headwordWrapped=headwords.length&&!headwordsFit();
   const protectedFits=()=>currentFits()&&headwordsFit();
   let currentSenseFit=currentCopies.length?'unchanged':'not-applicable';
   let headwordFit=headwords.length?'unchanged':'not-applicable';
   if(currentWrapped||headwordWrapped){
    setWidth(maxWidth);measurementCount++;
    if(!protectedFits())width=maxWidth;
    else{
     let low=baseWidth,high=maxWidth;
     for(let count=0;count<12&&high-low>.25;count++){
      const middle=(low+high)/2;setWidth(middle);measurementCount++;
      if(protectedFits())high=middle;else low=middle;
     }
     width=high;
    }
    setWidth(width);
    if(currentWrapped)currentSenseFit=currentFits()?'single-line':'width-capped';
    if(headwordWrapped)headwordFit=headwordsFit()?'single-line':'width-capped';
   }
   const widened=width>baseWidth+.25;
   const requiredHeightAfterWidening=widened?requiredContentHeight(body):null;
   if(widened){naturalHeight=Math.min(baseHeight,requiredHeightAfterWidening);setHeight(naturalHeight);}
   let capped=body.scrollHeight>body.clientHeight+epsilon;
   state(capped?'capped-scroll':'natural-content');
   // A classic scrollbar consumes text width. Reconcile the final visible
   // layout once without letting capped/uncapped states oscillate.
   const finalRequired=requiredContentHeight(body),heightLimit=widened?Math.min(baseHeight,maxHeight):maxHeight;
   if(Math.abs(popup.getBoundingClientRect().height-Math.min(heightLimit,finalRequired))>epsilon){
    naturalHeight=Math.min(heightLimit,finalRequired);setHeight(naturalHeight);
    capped=body.scrollHeight>body.clientHeight+epsilon;state(capped?'capped-scroll':'natural-content');
   }
   const rect=popup.getBoundingClientRect(),recoveredHeight=Math.max(0,baseHeight-rect.height);
   if(currentCopies.length&&!currentFits())currentSenseFit='width-capped';
   if(headwords.length&&!headwordsFit())headwordFit='width-capped';
   popup.dataset.v1253CurrentSenseFit=currentSenseFit;
   popup.dataset.v1262HeadwordFit=headwordFit;
   popup.dataset.v1253BaseWidth=baseWidth.toFixed(3);popup.dataset.v1253BaseHeight=baseHeight.toFixed(3);
   popup.dataset.v1254RecoveredHeight=recoveredHeight.toFixed(3);
   popup.dataset.v1256SizeReady='true';
   body.scrollTop=previousBody&&previousBody!==body?0:previousTop;
   const media=[...body.querySelectorAll('.resource-image-frame:not(:fullscreen)')].filter(shown);
   committedSize={width:rect.width,height:rect.height};
   last={type:popup.dataset.knowledgeType,viewport:{width:viewportWidth,height:viewportHeight},ratio,
    minimumWidth:minimum,configuredMinimumWidth:720,maxWidth,maxHeight,width:rect.width,height:rect.height,
    base:{width:baseWidth,candidateHeight,candidateFits,height:baseHeight,heightGrowth},
    final:{width:rect.width,height:rect.height,requiredHeight:finalRequired,horizontalOverflow:body.scrollWidth>body.clientWidth+epsilon},
    body:{width:body.clientWidth,height:body.clientHeight,scrollWidth:body.scrollWidth,scrollHeight:body.scrollHeight},
    state:popup.dataset.v1246SizeState,capped,naturalVocabulary,naturalContent:true,naturalHeight,
    currentSense:{fit:currentSenseFit,baseWidth,baseHeight,requiredHeightAfterWidening,recoveredHeight,visibleCount:currentCopies.length,singleLine:currentCopies.length?currentFits():null},
    headword:{fit:headwordFit,visibleCount:headwords.length,singleLine:headwords.length?headwordsFit():null,texts:headwords.map(node=>node.textContent.trim()),baseWidth,baseHeight,recoveredHeight},
    independentImages:media.map(node=>({width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height})),
    activePage:popup.dataset.resourcePageIndex||body.querySelector('[data-v1225-member-page]')?.dataset.v1225MemberPage||'0',
    fitCount,measurementCount,triggers,supportedViewport:viewportWidth>=800};
   Object.defineProperty(last,'_body',{value:body});
  }finally{measuring=false;}
 }
 function schedule(reason='mutation'){
  reasons.add(typeof reason==='string'?reason:'mutation');if(!frame)frame=requestAnimationFrame(fit);
 }
 const playbackOnly='[data-resource-guidance-time],[data-resource-guidance-progress],.resource-audio-icon,.v18-video-clock,.v18-video-seek,.v18-video-volume,.v18-video-sound,.v18-video-toggle';
 function relevantMutation(record){
  const node=record.target.nodeType===Node.ELEMENT_NODE?record.target:record.target.parentElement;
  if(!node)return false;
  // Legacy tool/topic refreshes sometimes remove a class that is already
  // absent. Such no-op writes must not turn playback ticks into resize loops.
  if(record.type==='attributes'&&record.oldValue===node.getAttribute(record.attributeName))return false;
  if(record.type==='attributes'&&record.target===popup){
   if(record.attributeName==='style')return styleWithoutSizing(record.oldValue)!==styleWithoutSizing(popup.getAttribute('style'));
   if(record.attributeName==='class')return classWithoutSizing(record.oldValue)!==classWithoutSizing(popup.className);
  }
  // Fullscreen/fallback media have their own geometry. Clock, seek and icon
  // updates must not keep rerunning this ordinary-dialog fitting pass.
  if(node.closest('.v15-video-player')||node.closest(playbackOnly))return false;
  if(record.type==='attributes'&&['hidden','class','data-resource-page-index','data-v1225-member-page','open'].includes(record.attributeName))return true;
  return !node.closest('[hidden],.hidden');
 }
 new MutationObserver(records=>{
  // Theme/tool owners can temporarily write and restore the same attribute in
  // one batch. Compare its first old value with the final DOM state, rather
  // than treating every intermediate palette write as a layout change.
  const seen=new Map();
  if(records.some(record=>{
   if(record.type==='attributes'){
    let attributes=seen.get(record.target);
    if(!attributes){attributes=new Set();seen.set(record.target,attributes);}
    if(attributes.has(record.attributeName))return false;
    attributes.add(record.attributeName);
   }
   return relevantMutation(record);
  }))schedule('content-or-page');
 }).observe(popup,{
  subtree:true,childList:true,characterData:true,attributes:true,attributeOldValue:true,
  attributeFilter:['class','style','hidden','open','src','srcset','width','height','data-knowledge-type','data-theme-kind','data-resource-page-index','data-v1225-member-page']
 });
 new ResizeObserver(()=>{
  if(!supported())return;const rect=popup.getBoundingClientRect();
  if(!committedSize||Math.abs(rect.width-committedSize.width)>.5||Math.abs(rect.height-committedSize.height)>.5)schedule('external-size');
 }).observe(popup);
 const page=document.getElementById('fullscreenPage');
 if(page)new MutationObserver(()=>schedule('lecture-font-or-theme')).observe(page,{attributes:true,attributeFilter:['style','class','data-demo-palette','data-theme-kind']});
 new MutationObserver(()=>schedule('document-font-or-theme')).observe(document.documentElement,{attributes:true,attributeFilter:['style','class']});
 addEventListener('resize',()=>schedule('viewport'),{passive:true});
 popup.addEventListener('load',event=>{if(shown(event.target))schedule('media-load');},true);
 popup.addEventListener('error',event=>{if(shown(event.target))schedule('media-error');},true);
 popup.addEventListener('loadedmetadata',event=>{if(shown(event.target))schedule('media-metadata');},true);
 popup.addEventListener('toggle',()=>schedule('details-toggle'),true);
 document.addEventListener('fullscreenchange',()=>schedule('fullscreen'));
 document.fonts?.ready.then(()=>schedule('fonts-ready'));
 document.fonts?.addEventListener?.('loadingdone',()=>schedule('fonts-loaded'));
 document.fonts?.addEventListener?.('loadingerror',()=>schedule('fonts-error'));
 if(typeof bindResourcePopoverInteractions==='function'){
  const bind=bindResourcePopoverInteractions;
  bindResourcePopoverInteractions=function adaptiveKnowledgeBind(){const value=bind.apply(this,arguments);schedule('binding');return value;};
 }
 const refresh=()=>schedule('manual'),inspect=()=>last;
 window.V1235KnowledgeSize={refresh,inspect};
 window.V1246PopupSizing={refresh,inspect,limits:{minimumWidth:720,viewportFraction:.9,imageWidth:400,minimumSupportedViewport:800,baseRatio:ratio,ordinaryHeight:'natural-content',vocabularyHeight:'natural-content',speechHeight:'natural-content',currentSenseWidth:'single-line-within-90vw',currentSenseHeight:'recover-reflow-without-growth',headwordWidth:'single-line-within-90vw',headwordHeight:'recover-reflow-without-growth',assetWaitLimitMs:1000}};
 schedule('initial');
})();
