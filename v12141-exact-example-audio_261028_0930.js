/* An inline example button may play only the exact sentence, never a merely related recording. */
(() => {
 'use strict';
 const text=v=>String(v??'').trim();
 const normalize=v=>text(v).replace(/[{}*]/g,'').replace(/[’‘]/g,"'").replace(/[“”]/g,'"').replace(/\s+/g,' ').trim().toLowerCase();
 const textNo=v=>Number(text(v).replace(/^text\s*/i,''));
 const url=v=>{try{return new URL(text(v).replace(/^prototype\//,''),document.baseURI).href}catch{return ''}};
 function owns(row){const entries=Object.values(window.V12137_EXAMPLE_MEDIA?.byKey||{});return entries.some(e=>e.exampleKey===row?.exampleKey||(text(row?.audioUrl)&&url(e.src)===url(row.audioUrl))||(text(row?.audioSource?.sha256)&&row.audioSource.sha256===e.source.sha256));}
 function decide(row){
  const exact=window.V12137_EXAMPLE_MEDIA?.byKey?.[row?.exampleKey];
  if(!exact&&owns(row))return {status:'blocked',playable:false,reason:'新增录音的例句身份不一致'};
  if(exact){
   const same=exact.verified===true&&exact.standalone===true&&row.isSingleSentenceAudio===true&&
    row.optionIsSpokenInRecording!==false&&(row.source?.row||row.sourceWorkbookRow)===exact.sourceRow&&row.source?.file===exact.recordSource.file&&row.source?.sheet===exact.recordSource.sheet&&(!exact.recordSource.range||row.source?.range===exact.recordSource.range)&&row.head===exact.head&&
    normalize(row.english||row.sentence)===normalize(exact.english)&&String(row.year)===String(exact.year)&&
    normalize(row.paper||row.sourceName)===normalize(exact.paper)&&textNo(row.textNo)===textNo(exact.textNo)&&
    url(row.audioUrl)===url(exact.src)&&row.audioSource?.sha256===exact.source.sha256;
   return same?{status:'exact-file',playable:true,src:exact.src,reason:'独立原句录音与来源行、词头、卷别、全文、文件指纹一致'}:{status:'blocked',playable:false,reason:'独立例句录音与已核对身份不一致'};
  }

  const related=row?.relatedRecording;
  if(!related?.src)return {status:'not-supplied',reason:'未提供可定位的例句原音'};
  if(row.optionIsSpokenInRecording===false||related.optionIsSpokenInRecording===false||['option','question-option'].includes(row.sourceType))return {status:'blocked',reason:'题干或选项没有在该录音中朗读'};
  if(!(text(row.exampleKey)&&row.source?.file&&row.source?.sheet&&(Number(row.source.row)>0||/[A-Z]+\d+/.test(row.source.range||''))))return {status:'blocked',reason:'缺少可追溯的例句来源身份'};
  const wanted=normalize(row.english||row.sentence),number=textNo(row.textNo);
  const texts=window.TEST_SINGLE_BOOK?.timecodes?.sets?.flatMap(set=>set.texts||[])||[];
  const matches=[];
  for(const recording of texts){
   if(recording.textNo!==number||url(recording.audioPath)!==url(related.src))continue;
   for(const segment of recording.segments||[]){
    // A substring inside a timed paragraph has no proven per-sentence boundaries.
    if(normalize(segment.text)!==wanted||segment.timingEstimated!==false||!segment.sourceTiming||!Number.isFinite(segment.start)||!Number.isFinite(segment.end)||segment.start<0||segment.end<=segment.start||segment.end>recording.sourceCropEnd)continue;
    matches.push({src:related.src,start:segment.start,end:segment.end,text:segment.text,sourceExcelRow:segment.sourceExcelRow,source:segment.source});
   }
  }
  if(matches.length!==1)return {status:'blocked',reason:matches.length?'原句时码匹配不唯一':'没有与整句完全一致且边界已核实的时码'};
  return {status:'exact-segment',playable:true,reason:'原句全文、篇目、文件及非估算时码一致',...matches[0]};
 }
 function button(row){
  const d=decide(row);if(!d.playable)return '';
  const template=document.createElement('template');template.innerHTML=resourceInlineAudioButton(d.src,'播放例句');const b=template.content.querySelector('button');
  if(d.status==='exact-segment'){b.dataset.resourceStart=String(d.start);b.dataset.resourceEnd=String(d.end);}b.dataset.v136ExampleKey=row.exampleKey;b.dataset.v136AudioScope=d.status;
  return '<span class="v134-inline-related">'+b.outerHTML+'</span>';
 }
 window.V12137ExampleAudio=Object.freeze({decide,button,owns});window.V12136ExampleAudio=window.V12137ExampleAudio;
})();
