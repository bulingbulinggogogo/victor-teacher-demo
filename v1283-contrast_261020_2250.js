/* V83: adapt original contrast data to the approved handoff template. The
   approved vendor CSS and ContrastReveal implementation are loaded unchanged. */
(() => {
 'use strict';
 const api=window.V1213Illustrations;if(!api?.create||window.V1283Contrast)return;
 const make=(tag,cls,value)=>{const n=document.createElement(tag);n.className=cls;if(value!==undefined)n.textContent=value;return n;};
 const roots=new Set();let headingFrame=0;
 function richLine(target,line,fallback){
  if(line)while(line.firstChild)target.append(line.firstChild);else target.textContent=fallback||'';
  target.querySelectorAll('.pgi-source-red').forEach(span=>{const strong=document.createElement('strong');while(span.firstChild)strong.append(span.firstChild);for(const attr of span.attributes)if(attr.name.startsWith('data-'))strong.setAttribute(attr.name,attr.value);span.replaceWith(strong);});
 }
 function decorate(row){
  const module=row?.content;if(!module?.matches('[data-graph-kind="contrast"]')||module.dataset.v1283Contrast)return;
  const source=row.source?.contrast||window.V1213_PPT_SOURCE?.entries?.[module.dataset.graphKey]?.contrast;
  const grid=module.querySelector('.pgi-contrast-grid');if(!source||!grid)return;
  const oldCards=[...grid.children];grid.classList.add('columns');grid.setAttribute('aria-label','词语对比');
  oldCards.forEach((card,index)=>{
   const column=source.columns[index];if(!column)return;
   const lines=[...card.querySelectorAll('[data-pgi-line]')],image=card.querySelector('img'),head=column.canonicalWord||column.word;
   const word=make('h2','word',head),definition=make('p','definition'),pos=make('span','pos',(column.pos||'').replace(/\.$/,'')+'.'),meaning=make('span','meaning',column.meaning||'');definition.append(pos,meaning);
   const figure=make('figure','image-panel');if(image){image.alt=head+'：'+(column.meaning||'');figure.append(image);}
   const button=make('button','hint-toggle');button.type='button';button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','揭示'+head+'的辨析提示');
   const hint=make('span','hint-text',column.note||'');hint.setAttribute('aria-hidden','true');
   const cover=make('span','hint-cover');cover.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';cover.append(document.createTextNode('点击揭示'));button.append(hint,cover);figure.append(button);
   const english=make('p','english'),translation=make('p','translation');richLine(english,lines[2],column.english);richLine(translation,lines[3],column.translation);
   card.className='word-card pgi-card';card.dataset.word=head;card.dataset.v1281ContrastCard=head;card.replaceChildren(word,definition,figure,english,translation);
  });
  const scene=module.querySelector('.pgi-scene'),lecture=make('main','lecture');lecture.append(grid);scene.replaceChildren(lecture);
  module.classList.add('contrast-reference');module.dataset.contrastRoot='';module.dataset.v1281Contrast='true';module.dataset.v1283Contrast='approved-handoff';
  window.ContrastReveal?.mount(module);roots.add(module);scheduleHeading();
 }
 const create=api.create;api.create=function(){const rows=create.apply(this,arguments)||[];rows.forEach(decorate);return rows;};
 document.querySelectorAll('[data-graph-kind="contrast"]').forEach(content=>decorate({content}));
 function refreshHeading(){
  headingFrame=0;const detail=document.querySelector('#wordDetailDialog'),header=detail?.querySelector(':scope>.v1281-fullscreen-heading');if(!header)return;
  const active=detail.classList.contains('v1263-interactive-fullscreen')&&detail.dataset.v1263InteractiveModule==='contrast',heading=header.querySelector('h2');
  header.classList.toggle('contrast-reference',active);header.classList.toggle('v1283-approved-contrast-heading',active);heading?.classList.toggle('lesson-title',active);
 }
 function scheduleHeading(){if(!headingFrame)headingFrame=requestAnimationFrame(refreshHeading);}
 new MutationObserver(scheduleHeading).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','data-v1263-interactive-module','aria-selected']});
 window.addEventListener('resize',scheduleHeading);
 const inspect=(root=document.querySelector('#wordDetailDialog'))=>[...root?.querySelectorAll('[data-v1281-contrast-card]')||[]].map(card=>({word:card.dataset.word,meaning:card.querySelector('.definition')?.textContent,cue:card.querySelector('.hint-text')?.textContent,expanded:card.querySelector('.hint-toggle')?.getAttribute('aria-expanded'),image:card.querySelector('img')?.getAttribute('src'),english:card.querySelector('.english')?.textContent,translation:card.querySelector('.translation')?.textContent}));
 window.V1283Contrast=Object.freeze({inspect,setAll(root,visible){window.ContrastReveal?.setAll(root||document.querySelector('[data-v1283-contrast]'),visible);},destroy(root){window.ContrastReveal?.destroy(root);roots.delete(root);}});
 window.V1281Contrast=window.V1283Contrast;
 scheduleHeading();
})();
