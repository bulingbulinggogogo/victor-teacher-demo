/* V67: the dictionary hierarchy, source-safe block categories, and real Word exports. */
(() => {
 'use strict';
 const api=window.V1220WordDetail;if(!api?.finish)return;
 const text=value=>String(value??'').trim();
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const order=['meanings','etymology','illustrations','contrast','statistics','cases','textbookExamples'];
 const categoryOrder=['短语动词','固定搭配','习语'];
 function categoryFor(row){
   const source=text(row.sourceCategory || row.category);
   if(source==='短语动词'||/^(?:phr[ .]?v|phrasal)/i.test(text(row.phrasalVerbMarker)||source))return '短语动词';
   if(['习语','口语表达'].includes(source))return '习语';
   return '固定搭配';
 }
 const normalize=row=>({...row,sourceCategory:row.sourceCategory || row.category || '',category:categoryFor(row)});
 function renderWordBlocks(rows){
   const groups=new Map();rows.forEach(row=>{const pos=text(row.parentPartOfSpeech)||'unclassified';if(!groups.has(pos))groups.set(pos,[]);groups.get(pos).push(row);});
   return [...groups].map(([pos,items])=>`<section data-v1267-word-block-group data-v1227-pos="${esc(pos)}"><h4 class="v1267-word-block-heading">词块</h4><div class="v1222-sense-examples">${items.map(row=>{
     const example=row.example?window.V1222SenseExamples.renderExample(row,'ordinary',`data-block-example="${esc(row.blockKey)}"`,{label:'词块例句'}):'';
     return `<article class="v1223-sense-block" data-v1267-word-block="${esc(row.blockKey)}" data-block-category="${esc(row.category)}" data-v1246-parent-head="${esc(row.parentHead)}" data-v1246-binding-scope="word"><p class="v1223-sense-block-heading"><span class="v1223-block-kind">词块</span><span class="v1224-block-category">${esc(row.category)}</span> <strong>${window.renderResourceMarkup?.(row.phrase)||esc(row.phrase)}</strong>${text(row.phraseChinese||row.chinese)?' <span>'+esc(row.phraseChinese||row.chinese)+'</span>':''}</p>${row.usage||row.register?'<p class="v1223-sense-block-usage">'+esc([row.usage,row.register].filter(Boolean).join(' '))+'</p>':''}${example}</article>`;
   }).join('')}</div></section>`).join('');
 }
 window.V1267BlockCategories={categoryFor,normalize,renderWordBlocks,categoryOrder};
 // A small stored ZIP writer makes a standards-based .docx locally, without a remote service.
 const utf8=new TextEncoder();
 const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
 const crc32=bytes=>{let crc=0xffffffff;for(const b of bytes)crc=crcTable[(crc^b)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;};
 function header(size,values){const bytes=new Uint8Array(size),view=new DataView(bytes.buffer);values.forEach(([at,value,width])=>width===2?view.setUint16(at,value,true):view.setUint32(at,value,true));return bytes;}
 function zip(files){
   const chunks=[],directory=[];let offset=0;
   Object.entries(files).forEach(([name,content])=>{
     const filename=utf8.encode(name),data=utf8.encode(content),crc=crc32(data);
     const local=header(30,[[0,0x04034b50],[4,20,2],[6,0x800,2],[14,crc],[18,data.length],[22,data.length],[26,filename.length,2]]);
     chunks.push(local,filename,data);
     directory.push(header(46,[[0,0x02014b50],[4,20,2],[6,20,2],[8,0x800,2],[16,crc],[20,data.length],[24,data.length],[28,filename.length,2],[42,offset]]),filename);
     offset+=local.length+filename.length+data.length;
   });
   const directoryLength=directory.reduce((n,b)=>n+b.length,0),count=Object.keys(files).length;
   return new Blob([...chunks,...directory,header(22,[[0,0x06054b50],[8,count,2],[10,count,2],[12,directoryLength],[16,offset]])],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
 }
 const xml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const plain=value=>String(value??'').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/[{}]/g,'');
 function run(value,style={}){return `<w:r><w:rPr>${style.bold?'<w:b/>':''}${style.italic?'<w:i/>':''}${style.underline?'<w:u w:val="single"/>':''}${style.isRed?'<w:color w:val="D41745"/>':''}</w:rPr><w:t xml:space="preserve">${xml(plain(value))}</w:t></w:r>`;}
 function paragraph(value,style='Normal'){return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr>${run(value)}</w:p>`;}
 function sourceText(row,kind){return (kind==='textbookExamples'?[row.edition||row.textbookVersion||row.version,row.bookTitle||row.bookName||row.bookVolume||row.volume,row.unit,row.section]:[row.year?String(row.year).replace(/年$/,'')+'年':'',row.paper||row.sourceName,row.questionType,row.textNo||row.section]).filter(v=>text(v)&&!['—','-'].includes(text(v))).join(' · ');}
 function wordBlob(head,label,rows,kind){
   const body=paragraph(head+' · '+label,'Title')+paragraph('共 '+rows.length+' 条例句','Subtitle')+rows.map((row,index)=>{
     const field=row.sentence!==undefined?'sentence':row.english!==undefined?'english':'example',value=String(row[field]||''),runs=row.sourceRichTextRuns?.[field]||row.richText?.[field]||row.sourceRichText?.[field];
     const english=Array.isArray(runs)&&runs.map(n=>n.text||'').join('')===value?runs.map(n=>run(n.text||'',n)).join(''):run(value);
     const meta=[row.partOfSpeech,row.meaning].filter(Boolean).join(' · ');
     return (meta?paragraph(meta,'Metadata'):'')+`<w:p><w:pPr><w:pStyle w:val="Example"/></w:pPr>${run((index+1)+'. ')}${english}</w:p>`+(row.translation?paragraph(row.translation,'Translation'):'')+(sourceText(row,kind)?paragraph(sourceText(row,kind),'Source'):'');
   }).join('');
   return zip({
    '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
    '_rels/.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    'word/_rels/document.xml.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    'word/document.xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>',
    'word/styles.xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="微软雅黑"/><w:sz w:val="24"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="320" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:styleId="Normal" w:default="1"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:rPr><w:color w:val="64748B"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Metadata"><w:name w:val="Metadata"/><w:rPr><w:color w:val="64748B"/><w:sz w:val="20"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Example"><w:name w:val="Example"/></w:style><w:style w:type="paragraph" w:styleId="Translation"><w:name w:val="Translation"/></w:style><w:style w:type="paragraph" w:styleId="Source"><w:name w:val="Source"/><w:pPr><w:spacing w:after="300"/></w:pPr><w:rPr><w:color w:val="64748B"/><w:sz w:val="20"/></w:rPr></w:style></w:styles>'
   });
 }
 function timestamp(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'2-digit',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()).replace(/[- :]/g,'').replace(/^(\d{6})(\d{4})$/,'$1_$2');}
 function mountExport(detail,result,id,label){
   const button=detail.querySelector(`[data-word-module="${id}"]`),panel=button&&document.getElementById(button.getAttribute('aria-controls'));if(!panel)return;
   const records=id==='cases'?api.cases({wordId:result.options.context?.word?.id,item:result.options.item,retained:result.options.retainedCases||[]}):result.word.textbookExamples||[];
   const byKey=new Map(records.map(row=>[row.exampleKey,row]));
   const rows=(all=false)=>[...panel.querySelectorAll('article[data-latest-example]')].filter(node=>all||!node.closest('[hidden],.hidden')).map(node=>byKey.get(node.dataset.latestExample)).filter(Boolean);
   const tools=document.createElement('div');tools.className='v1267-example-export';tools.innerHTML='<span data-v1267-export-count></span><label>导出范围 <select data-v1267-export-scope aria-label="导出范围"><option value="all">全部收录</option><option value="visible">当前显示结果</option></select></label><button type="button" data-v1267-export="'+id+'">一键导出 Word</button><span data-v1267-export-status role="status" aria-live="polite"></span>';
   (panel.querySelector('.vwn-panel-scroll')||panel).prepend(tools);const exportButton=tools.querySelector('button'),count=tools.querySelector('[data-v1267-export-count]'),status=tools.querySelector('[role="status"]'),scope=tools.querySelector('[data-v1267-export-scope]');
   let busy=false,frame=0;
   function update(){frame=0;if(!detail.isConnected){observer.disconnect();return;}const visible=rows(),caption='当前显示 '+visible.length+' / '+records.length+' 条';if(count.textContent!==caption)count.textContent=caption;exportButton.disabled=busy||!rows(scope.value==='all').length;}
   const observer=new MutationObserver(()=>{if(!frame)frame=requestAnimationFrame(update);});observer.observe(panel,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
   exportButton.addEventListener('click',()=>{
     const selected=rows(scope.value==='all');if(!selected.length||busy)return;busy=true;update();
     try{
       const head=result.word.displayWord||result.word.word||result.word.head,filename=(head+'_'+label+'_'+selected.length+'条_'+timestamp()+'.docx').replace(/[\\/:*?"<>|]/g,'_');
       const url=URL.createObjectURL(wordBlob(head,label,selected,id)),link=document.createElement('a');link.href=url;link.download=filename;link.hidden=true;tools.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
       status.textContent='已导出 '+selected.length+' 条';exportButton.dataset.lastExportCount=String(selected.length);exportButton.dataset.lastExportName=filename;
     }catch(error){status.textContent='导出未完成，请重试';console.error(error);}finally{busy=false;update();}
   });scope.addEventListener('change',update);update();
 }
 const finish=api.finish;
 api.finish=function(detail,result){
   const value=finish.apply(this,arguments);if(detail?.id!=='wordDetailDialog'||!result?.word||detail.dataset.v1267Hierarchy)return value;detail.dataset.v1267Hierarchy='true';
   window.WordDetailNavigation.arrangeSenseModules(detail,{order});
   const textbook=detail.querySelector('[data-word-module="textbookExamples"]');
   const cases=detail.querySelector('[data-word-module="cases"]');
   if(cases){const caption=cases.querySelector('.v1223-word-label')||cases;caption.textContent='高考真题';}
   if(textbook){const caption=textbook.querySelector('.v1223-word-label')||textbook;caption.textContent='教材例句';}
   const controls=detail.querySelector('[data-v1220-subnav-for="meanings"][aria-label="释义内容开关"]');
   if(controls){
     const preferred=['all','blocks','examples','ordinary','textbook','exam','relations','note:语义点拨','note:语义推导','note:构词法'];
     const items=[...controls.querySelectorAll(':scope > button[data-word-feature]')];items.sort((a,b)=>{const rank=k=>preferred.includes(k)?preferred.indexOf(k):preferred.length;return rank(a.dataset.wordFeature)-rank(b.dataset.wordFeature);});
     items.forEach(button=>{controls.append(button);if(button.dataset.wordFeature==='blocks'){const categories=detail.querySelector('[data-v1267-block-categories]');if(categories)button.after(categories);}});
   }
   mountExport(detail,result,'cases','高考真题');mountExport(detail,result,'textbookExamples','教材例句');api.refreshFeatures(detail);window.V1223WordDock?.refresh?.(detail);
   return value;
 };
 window.V1267DictionaryHierarchy={order,wordBlob};
})();
