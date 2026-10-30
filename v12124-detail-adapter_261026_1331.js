/* V1.2.96: annotate native nodes without replacing the word model or its owners. */
(() => {
 'use strict';
 let frame=0;const scanned=new WeakSet();
 const make=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const setText=(n,t)=>{if(n&&n.textContent!==t)n.textContent=t;};
 const setData=(n,k,v)=>{if(n.dataset[k]!==v)n.dataset[k]=v;};
 function badge(n,label,value){
  if(!n)return;
  n.classList.add('v1296-dictionary-badge');
  if(n.dataset.v1296Badge!==label){n.replaceChildren(make('span','v1296-badge-label',label),make('span','v1296-badge-value',value));n.dataset.v1296Badge=label;}
  else setText(n.querySelector('.v1296-badge-value'),value);
 }
 function upper(d){
  const entry=d.querySelector('.v1270-word-upper .knowledge-entry');if(!entry)return;
  if(!entry.querySelector('.v1296-shortcuts')){
   const shortcuts=make('nav','v1296-shortcuts');shortcuts.setAttribute('aria-label','单词图示快捷入口');
   for(const [module,label]of [['illustrations','语义网'],['contrast','辨析']]){
    const b=make('button','',label);b.type='button';b.dataset.v1296Shortcut=module;
    b.addEventListener('click',()=>{const tab=d.querySelector('[data-word-module="'+module+'"]');if(tab&&!tab.disabled&&!tab.hidden){if(window.V1297EntrySettings)window.V1297EntrySettings.open(d,module,b);else tab.click();}});shortcuts.append(b);
   }
   entry.querySelector('.resource-pronunciation-groups')?.after(shortcuts);
  }
  entry.querySelectorAll('[data-v1296-shortcut]').forEach(b=>{const tab=d.querySelector('[data-word-module="'+b.dataset.v1296Shortcut+'"]');b.disabled=!tab||tab.disabled||tab.hidden;b.hidden=b.disabled;});const shortcutNav=entry.querySelector('.v1296-shortcuts');if(shortcutNav)shortcutNav.hidden=![...shortcutNav.children].some(b=>!b.hidden);
 }
 function meanings(d,model){
  const senses=new Map((model?.word.parts||[]).flatMap(p=>p.senses||[]).map(s=>[String(s.senseKey||s.id),s]));
  const difficulty=d.querySelector('[data-sense-sort]:checked')?.dataset.senseSort==='difficulty';
  setData(d,'v1296SenseSort',difficulty?'difficulty':'frequency');
  d.querySelectorAll('[data-latest-sense]').forEach(line=>{
   const sense=senses.get(line.dataset.latestSense),copy=line.querySelector(':scope>.resource-sense-copy');if(!sense||!copy)return;
   const exam=copy.querySelector('[data-word-tag="sense-exam"]');
   const raw=exam?.dataset.v1296Count??exam?.textContent.match(/\d+/)?.[0]??'0';
   if(exam){setData(exam,'v1296Count',raw);badge(exam,'高考',raw);}
   const number=line.querySelector(':scope>.v1220-sense-number'),level=String(sense.cefr||sense.readingLevel||'—').toUpperCase();
   if(number){
    const rank=[...line.parentElement.children].filter(n=>n.matches('[data-latest-sense]')).indexOf(line)+1;
    setText(number,difficulty?level:String(rank));setData(number,'v1296Frequency',Number(raw)>=2?'high':'low');
    number.setAttribute('aria-label',difficulty?'难度 '+level:('第'+rank+'义，'+(Number(raw)>=2?'高义频':'低义频')+'，高考'+raw+'次'));
    const title=difficulty?'难度 '+level:(Number(raw)>=2?'高义频（≥2次）':'低义频（≤1次）');if(number.title!==title)number.title=title;
   }
   let definition=copy.querySelector(':scope>.v1220-english-definition');
   if(!definition){definition=make('span','v1220-english-definition');copy.querySelector('.resource-sense-meaning')?.after(definition);}
   let relations=definition.querySelector('.v1278-meaning-relations');
   if(!relations){relations=make('span','v1278-meaning-relations');definition.append(relations);}
   [...relations.children].filter(n=>n!==exam&&!n.dataset.v1296Badge).forEach(n=>{const m=n.textContent.match(/^(近|反)[:：]\s*([\s\S]*)$/);if(m)badge(n,m[1],m[2]);});
   if(exam&&relations.lastElementChild!==exam)relations.append(exam);
  });
 }
 function blocks(d){
  d.querySelectorAll('.v1223-sense-block-heading,.v1226-block-unit-head').forEach(head=>{
   head.querySelectorAll(':scope>.v1223-block-kind').forEach(n=>n.remove());
   const h4=head.querySelector(':scope>h4');
   if(h4){while(h4.firstChild)head.insertBefore(h4.firstChild,h4);h4.remove();}
   if(head.classList.contains('v1226-block-unit-head'))head.classList.add('v1223-sense-block-heading');
   const type=head.querySelector('.v1224-block-category,.v1226-block-category'),meaning=head.querySelector('.v1223-block-meaning,.v1226-block-chinese');
   if(type){type.classList.add('v1224-block-category');if(meaning&&meaning.nextElementSibling!==type)meaning.after(type);}
  });
  d.querySelectorAll('.v1268-idiom-card').forEach(card=>{
   const image=card.querySelector('.v1272-idiom-source-example'),examples=card.querySelector('.v1226-block-associated');
   if(image&&examples&&image.parentElement!==examples)examples.append(image);
  });
 }
 function family(d){
  d.querySelectorAll('.vft-node').forEach(node=>{
   const head=node.querySelector(':scope>.vft-node-content>.vft-word');if(!head)return;
   let meaning=node.querySelector(':scope>.v1268-family-body>.vft-meaning')||node.querySelector(':scope>.vft-meaning');
   if(meaning){const inline=make('span','vft-meaning v1296-family-meaning');while(meaning.firstChild)inline.append(meaning.firstChild);meaning.replaceWith(inline);const pos=head.querySelector('.vft-pos');if(pos)pos.after(inline);else head.append(inline);}
   const count=head.querySelector('.v1278-family-frequency');if(count){const v=count.dataset.v1296FamilyCount??count.textContent.replace(/^高考\s*/,'');setData(count,'v1296FamilyCount',v);badge(count,'高考',v);if(head.lastElementChild!==count)head.append(count);}
  });
 }
 function redInk(d){
  // Only original red glyphs are recolored. Orange topic labels and purple metadata stay semantic.
  d.querySelectorAll('strong,span,b,em,mark,i,p,td').forEach(n=>{
   if(scanned.has(n))return;scanned.add(n);
   const m=getComputedStyle(n).color.match(/^rgb\((\d+), (\d+), (\d+)\)$/);if(!m)return;
   const [r,g,b]=m.slice(1).map(Number),max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
   let hue=delta?((g-b)/delta)*60:0;if(hue<0)hue+=360;
   if(max===r&&r>=140&&delta>=55&&(hue<=18||hue>=330))n.dataset.v1296RedInk='true';
  });
 }
 function sync(){frame=0;const d=document.querySelector('#wordDetailDialog');if(!d||d.classList.contains('v1263-interactive-fullscreen'))return;const model=window.V1220WordDetail?.getModel(d);if(!model)return;upper(d);meanings(d,model);blocks(d);family(d);redInk(d);}
 function schedule(){if(!frame)frame=requestAnimationFrame(sync);}
 new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','aria-selected','aria-pressed','data-demo-palette']});
 document.addEventListener('change',schedule,true);document.addEventListener('click',schedule,true);window.addEventListener('resize',schedule);window.addEventListener('v1213-word-mounted',schedule);schedule();
 window.V1296AnnotationLayout={refresh:schedule,inspect(){const d=document.querySelector('#wordDetailDialog');return {sort:d?.dataset.v1296SenseSort,badges:d?.querySelectorAll('.v1296-dictionary-badge').length,shortcuts:d?.querySelectorAll('[data-v1296-shortcut]').length,familyNodes:d?.querySelectorAll('.vft-node').length};}};
})();
