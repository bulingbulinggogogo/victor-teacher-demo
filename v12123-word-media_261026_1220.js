/* Staged V71 upper word-detail adapter. Source records and existing navigation stay owned by their original modules. */
(() => {
  'use strict';
  if (window.V1271UpperLayout) return;
  const records = new WeakMap();
  const text = value => String(value ?? '').trim();
  const pos = value => { const m=text(value).toLowerCase().match(/^(adj|adv|n|vt|vi|v)(?=[.\s\[（(]|$)/);return m ? (/^v[ti]$/.test(m[1])?'v':m[1]) : text(value).toLowerCase(); };
  const element = (tag, cls, value) => { const node=document.createElement(tag);if(cls)node.className=cls;if(value!==undefined)node.textContent=value;return node; };
  const safeURL = value => { const raw=text(value);if(!raw)return '';try { const url=new URL(raw,document.baseURI);return ['http:','https:','file:','blob:'].includes(url.protocol)?url.href:''; } catch (_) { return ''; } };
  const shortForm = {plural:'复数',thirdPerson:'三单',pastBritish:'过去式',pastAmerican:'过去式（美式）',pastParticipleBritish:'过去分词',pastParticipleAmerican:'过去分词（美式）',presentParticipleBritish:'现在分词',presentParticipleAmerican:'现在分词（美式）',comparative:'比较级',superlative:'最高级'};
  const shortVariant = {'缩写':'缩写','完整拼写':'全拼','英式拼写':'英','美式拼写':'美','其他写法':'其他'};
  // Temporary business-review media, copied by reference from the approved 1523
  // effect page. It never enters the word/item data or actual-media resolver.
  const temporaryPresentVideo = Object.freeze({
    src:'./assets/knowledge/video/test-single-TLWJN_场景预判介绍嘉宾.mp4',
    poster:'./assets/knowledge/images/test-single-TLWJN_场景预判介绍嘉宾.webp',
    title:'场景预判·介绍嘉宾',origin:'temporary-demo-1523',demo:true
  });
  const businessMediaDemoEnabled = window.V1271BusinessMediaDemo !== false;
  const isPresent = model => businessMediaDemoEnabled && text(model?.word?.displayWord || model?.word?.word || model?.word?.head).toLowerCase().replace(/\d+$/,'')==='present';

  function modelFor(detail,supplied) {
    const stored=records.get(detail)?.model;
    const current=window.V1220WordDetail?.getModel?.(detail);
    const model=current || supplied || stored;
    if(!model)return null;
    const options={...(stored?.options || {}),...(model.options || {})};
    const word=model.word || options.context?.word || options.entry;
    return word ? {word,options} : null;
  }
  function sourceRows(model,selectedPOS) {
    const word=model.word, parts=word.parts || [], selected=pos(selectedPOS);
    const descriptions=(selected==='all'&&parts.length?parts.map(part=>part.partOfSpeech || part.pos):[selectedPOS || parts[0]?.partOfSpeech])
      .map(value=>window.V1227WordMetadata?.headerMetadataRows?.(word,value)).filter(Boolean);
    const rows=descriptions.flatMap(description=>description.rows || []);
    const unique=new Map();
    rows.forEach(row=>{
      if(!text(row.value) || text(row.label)==='符号' || row.field==='symbol')return;
      const key=[row.kind,row.field || row.label,row.value].join('\u0000');
      if(!unique.has(key))unique.set(key,{...row,sourceHeads:[],sourceRows:[]});
      const found=unique.get(key),head=row.head || word.head;
      if(head&&!found.sourceHeads.includes(head))found.sourceHeads.push(head);
      if(row.source?.row&&!found.sourceRows.includes(row.source.row))found.sourceRows.push(row.source.row);
    });
    return {variants:[...unique.values()].filter(row=>row.kind==='variant'),forms:[...unique.values()].filter(row=>row.kind==='inflection')};
  }
  function appendValue(host,value) {
    (text(value).match(/[\x20-\x7E]+|[^\x20-\x7E]+/g)||[]).forEach(token=>host.append(/[A-Za-z]/.test(token)?element('strong','',token):document.createTextNode(token)));
  }
  function previewRows(rows,kind) {
    const grouped=[];
    rows.forEach(row=>{
      const label=kind==='variants'?(shortVariant[row.label]||row.label):(shortForm[row.field]||row.label);
      const value=kind==='variants'?text(row.value).replace(/（[^）]*）\s*$/u,'').trim():text(row.value);
      const same=grouped.find(item=>item.value===value);
      if(same){if(!same.labels.includes(label))same.labels.push(label);}
      else grouped.push({labels:[label],value});
    });
    return grouped.map(row=>`${row.labels.join('／')} ${row.value}`).join('；');
  }
  function renderFolds(record) {
    const {detail,model,intro}=record;
    // V78: variants are word-wide; inflections follow the selected POS.
    const selected=window.WordDetailNavigation?.getState?.(detail)?.pos || model.word.parts?.[0]?.partOfSpeech;
    const rows={variants:sourceRows(model,'all').variants,forms:sourceRows(model,selected).forms};
    const old=detail.querySelectorAll('[data-word-variants]');old.forEach(node=>node.remove());
    const article=intro.querySelector(':scope > .knowledge-entry');if(!article)return;
    if(!record.foldHost){record.foldHost=element('div','v1270-folds');article.append(record.foldHost);}
    record.foldHost.querySelectorAll('details').forEach(node=>record.openFolds[node.dataset.v1270Fold]=node.open);
    const fragment=document.createDocumentFragment();
    for(const [kind,title]of [['variants','不同写法'],['forms','词形变化']]){
      if(!rows[kind].length)continue;
      const fold=element('details','v1270-fold');fold.dataset.v1270Fold=kind;fold.open=!!record.openFolds[kind];
      const summary=element('summary','v1270-fold-summary');summary.append(element('span','v1270-fold-title',title));
      const preview=element('span','v1270-fold-preview',previewRows(rows[kind],kind));preview.title=preview.textContent;summary.append(preview);
      const marker=element('span','v1270-fold-marker');marker.setAttribute('aria-hidden','true');summary.append(marker);
      const fields=element('dl','v1270-fold-fields');fields.setAttribute('aria-label',title);
      rows[kind].forEach(row=>{
        const pair=element('div','v1270-fold-field');
        if(row.mock)pair.dataset.wordMetadataDemonstration='true';
        if(row.field)pair.dataset.v1227Form=row.field;
        pair.dataset.v1270SourceHeads=row.sourceHeads.join(',');pair.dataset.v1270SourceRows=row.sourceRows.join(',');
        pair.append(element('dt','',row.label));const value=element('dd');appendValue(value,row.value);pair.append(value);fields.append(pair);
      });
      fold.append(summary,fields);fragment.append(fold);
    }
    record.foldHost.replaceChildren(fragment);record.foldHost.hidden=!record.foldHost.children.length;
  }

  function resolveMedia(model,detail) {
    const images=[],videos=[],seenImages=new Set(),seenVideos=new Set();
    const addImage=(src,alt,origin)=>{const url=safeURL(src);if(!url||seenImages.has(url))return;seenImages.add(url);images.push({src:url,alt:text(alt)||'词义图解',origin});};
    const addVideo=(src,poster,title,origin,trigger)=>{const url=safeURL(src);if(!url||seenVideos.has(url))return;seenVideos.add(url);videos.push({src:url,poster:safeURL(poster),title:text(title)||'讲解视频',origin,trigger:trigger || null});};
    const options=model?.options || {},item=options.item || {},context=options.context;
    // openHead keeps the original item fields. Its original context entries identify
    // resource ownership even after item.word/wordId have been changed by navigation.
    const lexicalHead=value=>text(value).toLowerCase().replace(/\d+$/,'');
    const originalEntries=Array.isArray(item.contextEntries)?item.contextEntries:[];
    const targetHeads=new Set([item.v1220Head,model?.word?.head,model?.word?.displayWord].filter(Boolean).map(lexicalHead));
    const targetIds=new Set([model?.word?.primaryCurrentWordId,model?.word?.sourceBusinessWordId,model?.word?.id].filter(Boolean).map(String));
    const inheritedResourceMedia=!!item.v1220Head&&originalEntries.length>0&&!originalEntries.some(entry=>targetHeads.has(lexicalHead(entry.word))||targetIds.has(String(entry.word_id || entry.wordId || '')));
    let resource=null;try{if(typeof libraryResourceForItem==='function')resource=libraryResourceForItem(item);}catch(_){}
    const videoTitle=resource?.videoTitle || resource?.title || item.title || item.prominent;
    // An explicit image is content; videoCover/cover fields remain posters only.
    const independent=[
      [inheritedResourceMedia?'':item.imageUrl || item.image || resource?.image || item.reviewExplanationImage || resource?.reviewExplanationImage,item.title || resource?.title],
      [context?.selected?.image,context?.selected?.chinese],
      [context?.word?.image,context?.word?.word]
    ];
    independent.forEach(([filename,title])=>{
      try{if(filename&&typeof knowledgeAssetAvailable==='function'&&knowledgeAssetAvailable('images',filename)&&typeof knowledgeAssetUrl==='function')addImage(knowledgeAssetUrl('images',filename),title,'current-item-context-image');}catch(_){}
    });
    function readPanels(root,origin,isLive=false) {
      root.querySelectorAll('.resource-media-panel').forEach(panel=>{
        if(panel.closest('[data-v1270-upper]'))return;
        panel.querySelectorAll('video').forEach(video=>{
          const player=video.closest('.v15-video-player');
          const trigger=isLive&&player?[...detail.querySelectorAll('.v15-video-fullscreen-button')].find(button=>button.classroomMediaOwner===player&&!button.hidden&&!button.closest('[hidden],.hidden,[inert]')):null;
          addVideo(video.getAttribute('src') || video.querySelector('source[src]')?.getAttribute('src'),video.getAttribute('poster'),panel.dataset.v15VideoTitle || videoTitle,origin,trigger);
        });
        panel.querySelectorAll('.resource-image-frame img[src],:scope > img[src]').forEach(image=>addImage(image.getAttribute('src'),image.alt || item.title,origin));
      });
    }
    if(detail&&!inheritedResourceMedia)readPanels(detail,'live-current-word',true);
    const markup=inheritedResourceMedia?[]:[options.originalContent];
    try{if(!inheritedResourceMedia&&typeof resourceMediaDetail==='function'&&options.item)markup.push(resourceMediaDetail(item,context?[context]:[]));}catch(_){}
    markup.filter(Boolean).forEach(html=>{const template=document.createElement('template');template.innerHTML=html;readPanels(template.content,'current-item-context');});
    try{
      const graphicOptions=window.V1225Present?.graphicOptions?.(options) || options;
      const matched=window.V1213Illustrations?.sourceEntry?.(graphicOptions);
      if(matched){
        const [key,entry]=matched;
        if(entry.polysemy){addImage(entry.polysemy.basicImage,`${key}基本义`,'current-word-ppt');(entry.polysemy.pages||[]).forEach(page=>(page.branches||[]).forEach(branch=>addImage(branch.image,`${branch.meaning}图解`,'current-word-ppt')));}
        if(entry.single)addImage(entry.single.image,entry.single.title,'current-word-ppt');
        (entry.contrast?.columns||[]).forEach(column=>addImage(column.image,`${column.canonicalWord || column.word}图解`,'current-word-ppt'));
      }
    }catch(_){}
    return {images,videos,inheritedResourceMediaIgnored:inheritedResourceMedia};
  }
  function iconButton(label,copy,action) {const button=element('button','v1270-media-button',copy);button.type='button';button.setAttribute('aria-label',label);button.title=label;button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();action();});return button;}
  function fullscreenImage(frame) {
    if(document.fullscreenElement===frame){document.exitFullscreen?.();return;}
    frame.requestFullscreen?.().catch(()=>{});
  }
  function removeLegacyUpperZooms(detail) {
    detail.querySelectorAll('[data-resource-image-fullscreen],.classroom-image-expand').forEach(button=>{
      const frame=button.classroomImageFrame || button.closest('.v1270-image-frame');
      if(!frame?.matches('.v1270-image-frame'))return;
      window.ClassroomTools?.detach?.(detail,button);button.remove();
    });
  }
  function renderImage(record,figure) {
    const rows=record.media.images;record.imageIndex=Math.max(0,Math.min(rows.length-1,record.imageIndex));const current=rows[record.imageIndex];
    const frame=element('div','resource-image-frame v1270-media-stage v1270-image-frame');const image=element('img');image.src=current.src;image.alt=current.alt;image.decoding='async';frame.append(image);
    const zoom=iconButton('全屏查看配图','⛶',()=>fullscreenImage(frame));zoom.classList.add('v1271-image-zoom');frame.append(zoom);
    image.addEventListener('click',()=>fullscreenImage(frame));
    const caption=element('figcaption','v1270-media-caption');caption.append(element('span','v1270-media-title',current.alt));
    if(rows.length>1){const pager=element('span','v1270-media-pager');const previous=iconButton('上一张图解','‹',()=>{record.imageIndex--;renderImage(record,figure);});previous.disabled=record.imageIndex===0;const next=iconButton('下一张图解','›',()=>{record.imageIndex++;renderImage(record,figure);});next.disabled=record.imageIndex===rows.length-1;const count=element('span','',`${record.imageIndex+1} / ${rows.length}`);count.setAttribute('aria-live','polite');pager.append(previous,count,next);caption.append(pager);}
    figure.replaceChildren(frame,caption);
  }
  function disposeVideos(host) {
    const videos=[...host.querySelectorAll('video')];
    const ownsMainPause=videos.some(video=>video.v1271SuspendedMainAudio);
    videos.forEach(video=>{video.pause();video.v1271SuspendedMainAudio=false;});
    const resourceAudioPlaying=typeof resourceDetailAudio!=='undefined'&&!resourceDetailAudio.paused&&!resourceDetailAudio.ended;
    if(ownsMainPause&&!resourceAudioPlaying&&typeof restoreMainAudioAfterResource==='function')restoreMainAudioAfterResource();
  }
  function renderVideo(record,figure) {
    const rows=record.media.videos;record.videoIndex=Math.max(0,Math.min(rows.length-1,record.videoIndex));const current=rows[record.videoIndex];
    disposeVideos(figure);const stage=element('div','v1270-media-stage v1270-video-frame');
    let video;
    if(current.trigger?.isConnected){
      const trigger=iconButton(`播放视频：${current.title}`,'',()=>current.trigger.click());trigger.classList.add('v1270-video-proxy');if(current.poster){const poster=element('img');poster.src=current.poster;poster.alt=`${current.title}视频封面`;trigger.append(poster);}const play=element('span','v1270-proxy-play','▶');play.setAttribute('aria-hidden','true');trigger.append(play);stage.append(trigger);
    }else{
      video=element('video');video.src=current.src;if(current.poster)video.poster=current.poster;video.controls=true;video.playsInline=true;video.preload='metadata';
      video.addEventListener('play',()=>{window.DemoResourceAudio?.pause?.();if(typeof suspendMainAudioForResource==='function'){suspendMainAudioForResource();video.v1271SuspendedMainAudio=true;}});
      ['ended','error'].forEach(name=>video.addEventListener(name,()=>{video.v1271SuspendedMainAudio=false;if(typeof restoreMainAudioAfterResource==='function')restoreMainAudioAfterResource();}));stage.append(video);
    }
    const caption=element('figcaption','v1270-media-caption');caption.append(element('span','v1270-media-title',current.title));
    if(video)caption.append(iconButton('全屏播放视频','全屏播放',()=>{video.requestFullscreen?.().catch(()=>{});video.play().catch(()=>{});}));
    if(rows.length>1){const pager=element('span','v1270-media-pager');const previous=iconButton('上一个视频','‹',()=>{record.videoIndex--;renderVideo(record,figure);});previous.disabled=record.videoIndex===0;const next=iconButton('下一个视频','›',()=>{record.videoIndex++;renderVideo(record,figure);});next.disabled=record.videoIndex===rows.length-1;pager.append(previous,element('span','',`${record.videoIndex+1} / ${rows.length}`),next);caption.append(pager);}
    figure.replaceChildren(stage,caption);
  }
  function renderMedia(record) {
    removeLegacyUpperZooms(record.detail);
    const actual=resolveMedia(record.model,record.detail);record.actualMedia=actual;
    const canDemonstrate=false,demo=false;
    const media=demo?{images:record.demoMode==='video'?[]:actual.images,videos:record.demoMode==='image'?[]:[{...temporaryPresentVideo,src:safeURL(temporaryPresentVideo.src),poster:safeURL(temporaryPresentVideo.poster)}]}:actual;
    const signature=JSON.stringify([canDemonstrate?record.demoMode:'actual',media.images.map(row=>[row.src,row.alt]),media.videos.map(row=>[row.src,row.poster,row.title])]);
    const mode=media.images.length?(media.videos.length?'both':'image'):(media.videos.length?'video':'none');
    record.upper.classList.toggle('v1270-has-media',mode!=='none');record.upper.dataset.v1270MediaMode=mode;record.mediaHost.hidden=mode==='none';
    if(signature===record.mediaSignature)return;
    disposeVideos(record.mediaHost);record.media=media;record.mediaSignature=signature;record.mediaHost.replaceChildren();
    if(canDemonstrate){
      const tools=element('div','v1271-media-demo-tools');tools.setAttribute('role','group');tools.setAttribute('aria-label','临时媒体展示');
      const badge=element('span','v1271-media-demo-label',demo?'演示素材':'实际素材');tools.append(badge);
      for(const [key,label]of [['image','仅图片'],['video','仅视频'],['both','图片和视频'],['actual','实际素材']]){
        const button=iconButton(label,label,()=>{record.demoMode=key;renderMedia(record);});button.dataset.v1271DemoMode=key;button.setAttribute('aria-pressed',String(record.demoMode===key));tools.append(button);
      }
      record.mediaHost.append(tools);
    }
    if(mode==='none')return;
    const card=element('div','v1270-media-card');card.dataset.v1270MediaMode=mode;
    if(media.videos.length){const figure=element('figure','v1270-media-figure v1270-media-video');renderVideo(record,figure);card.append(figure);}
    if(media.images.length){const figure=element('figure','v1270-media-figure v1270-media-image');renderImage(record,figure);card.append(figure);}
    record.mediaHost.append(card);
  }
  function mount(detail,supplied) {
    if(detail?.id!=='wordDetailDialog'||!detail.isConnected)return false;
    const model=modelFor(detail,supplied);if(!model)return false;
    const body=detail.querySelector(':scope > .resource-popover-body'),intro=body?.querySelector('.vwn-word-intro');if(!body||!intro)return false;
    let record=records.get(detail);
    if(!record){
      const upper=element('section','v1270-word-upper');upper.dataset.v1270Upper='';intro.before(upper);upper.append(intro);
      const mediaHost=element('aside','v1270-word-media');mediaHost.setAttribute('aria-label','当前单词媒体');upper.append(mediaHost);
      record={detail,intro,upper,mediaHost,model,openFolds:{},imageIndex:0,videoIndex:0,mediaSignature:null,demoMode:isPresent(model)?'both':'actual'};records.set(detail,record);
      detail.addEventListener('word-pos-change',()=>schedule(detail));
    }
    record.model=model;detail.classList.add('v1270-upper-enabled');renderFolds(record);renderMedia(record);return true;
  }
  const pending=new WeakMap();
  function schedule(detail,supplied) {
    if(detail?.id!=='wordDetailDialog')return;
    const existing=pending.get(detail);if(existing){if(supplied)existing.model=supplied;return;}
    const request={model:supplied};pending.set(detail,request);queueMicrotask(()=>{pending.delete(detail);mount(detail,request.model);});
  }
  function install() {
    const api=window.V1220WordDetail,metadata=window.V1227WordMetadata;if(!api?.finish||!metadata?.enhanceDetail)return false;
    if(api.finish.v1271UpperAdapter)return true;
    const finish=api.finish;const wrapped=function(detail,result){const value=finish.apply(this,arguments);schedule(detail,result);return value;};wrapped.v1271UpperAdapter=true;api.finish=wrapped;
    const enhance=metadata.enhanceDetail;metadata.enhanceDetail=function(detail,model){const value=enhance.apply(this,arguments);schedule(detail,model);return value;};
    const detail=document.getElementById('wordDetailDialog');if(detail)schedule(detail);return true;
  }
  window.addEventListener('v1213-word-mounted',event=>schedule(event.detail));
  window.V1271UpperLayout={mount,schedule,resolveMedia,sourceRows,inspect:()=>{
    const detail=document.getElementById('wordDetailDialog'),record=records.get(detail);
    const images=rows=>rows.map(({src,alt,origin})=>({src,alt,origin}));
    const videos=rows=>rows.map(({src,poster,title,origin,demo})=>({src,poster,title,origin,demo:!!demo}));
    return record?{
      head:record.model.word.head || record.model.word.word,
      mediaMode:record.upper.dataset.v1270MediaMode,demoMode:isPresent(record.model)?record.demoMode:'actual',
      isDemonstration:isPresent(record.model)&&record.demoMode!=='actual',
      images:images(record.media.images),videos:videos(record.media.videos),
      actualMedia:{images:images(record.actualMedia.images),videos:videos(record.actualMedia.videos)},
      folds:[...record.foldHost.children].map(node=>({kind:node.dataset.v1270Fold,open:node.open,fields:node.querySelectorAll('.v1270-fold-field').length})),
      legacyVariantHosts:detail.querySelectorAll('[data-word-variants]').length,
      ownZooms:detail.querySelectorAll('.v1271-image-zoom').length
    }:null;
  }};
  if(!install())document.addEventListener('DOMContentLoaded',install,{once:true});
})();
