/* V1.2.105 — source-bound vocabulary cards and shared teaching popup layout. */
(() => {
'use strict';
const popup=document.getElementById('popover');
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
const button=(text,fn,cls='')=>{const b=el('button',cls,text);b.type='button';b.addEventListener('click',fn);return b;};
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=s=>String(s||'').trim();
let uid=0;
function tabbed(groups){
 const section=el('section','v105-notes'),nav=el('div','v105-note-tabs'),body=el('div','v105-note-panels');nav.setAttribute('role','tablist');nav.setAttribute('aria-label','说明内容');
 const id='v105-notes-'+(++uid); const tabs=[];
 const select=i=>{tabs.forEach((b,j)=>{b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1;body.children[j].hidden=i!==j;});};
 groups.forEach(([title,nodes],i)=>{const b=button(title,()=>select(i));b.id=id+'-tab-'+i;b.setAttribute('role','tab');b.setAttribute('aria-controls',id+'-panel-'+i);const panel=el('div','v105-note-panel');panel.id=id+'-panel-'+i;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',b.id);nodes.forEach(n=>{const card=el('article','v105-note-card');card.append(n);panel.append(card);});nav.append(b);body.append(panel);tabs.push(b);b.addEventListener('keydown',e=>{let next=i;if(e.key==='ArrowRight')next=(i+1)%tabs.length;else if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();select(next);tabs[next].focus();});});section.append(nav,body);select(0);return section;
}
function openFeature(o,module,trigger){
 window.V1297EntrySettings?.open(popup,module,trigger,{
   historyTarget:window.V1220WordDetail?.resolve(o.entry,o.item,o.context)||o.entry,
   onEnter:settings=>window.DemoKnowledgeEnhancements.openWordDetail(o.entry,o.item,o.context,'top',trigger,{id:module,settings})
 });
}
function rich(ex,key){const runs=ex.richText?.[key];return Array.isArray(runs)&&runs.length?runs.map(r=>r.bold||r.isRed?'<strong>'+esc(r.text)+'</strong>':esc(r.text)).join(''):esc(ex[key]);}
function mount(container,item){
 const articles=[...container.querySelectorAll('.knowledge-entry')];
 articles.forEach(article=>{
 if(article.dataset.v105Vocabulary)return;const o=article.v105Context;if(!o)return;
 const word=window.V1220WordDetail?.resolve(o.entry,o.item,o.context);if(!word)return;
 article.dataset.v105Vocabulary='true';popup.classList.add('v105-vocabulary');
 const meaning=article.querySelector('.resource-sense-meaning');const chinese=text(meaning?.textContent);
 const senses=(word.parts||[]).flatMap(p=>p.senses||[]);const matches=senses.filter(s=>text(s.chinese)===chinese);const sense=matches.length===1?matches[0]:matches.find(s=>s.partOfSpeech===o.context?.partOfSpeech);
 const meta=window.V1227WordMetadata?.describe(word,{selectedPOS:sense?.partOfSpeech})||{};
 const top=el('section','v105-word-header'),tags=el('div','v105-tags');
 const levels=(meta.levels||[]).filter(l=>!sense||l.pos===sense.partOfSpeech);const level=levels[0]||{};
 [[meta.academic?'AW':'','academic'],[level.speaking?'S'+level.speaking:'','level'],[level.writing?'W'+level.writing:'','level'],[meta.reading?String(meta.reading).replace(/^[A-Z]+(\d+)$/i,'R$1'):'','reading'],[meta.curriculum||'','curriculum'],[meta.keyDifficulty?'重难词':'','key']].forEach(([t,k])=>{if(t)tags.append(el('span','v105-tag v105-tag-'+k,t));});
 const headline=el('div','v105-word-headline'),term=article.querySelector('.knowledge-word'),frequency=article.querySelector('.ke-exam-frequency'),features=el('div','v105-word-features');
 if(term)headline.append(term);if(meta.signal){const bars=el('span','v105-signal');bars.setAttribute('role','img');bars.setAttribute('aria-label','词频 '+meta.signal+' / 5');for(let i=1;i<=5;i++){const bar=el('i',i<=meta.signal?'filled':'');bar.style.height=(6+i*5)+'px';bars.append(bar);}headline.append(bars);}if(frequency)headline.append(frequency);
 const graph=window.V1213Illustrations?.sourceEntry(o)?.[1];
 if(graph?.polysemy)features.append(button('语义网',e=>openFeature(o,'illustrations',e.currentTarget),'v105-primary'));
 headline.append(features);top.append(tags,headline);const pron=article.querySelector('.resource-pronunciation-groups');if(pron)top.append(pron);
 const guidance=article.querySelector('[data-resource-guidance-card]');
 const middle=el('section','v105-current-sense'),line=el('div','v105-sense-heading'),summary=article.querySelector('.resource-current-copy')||article.querySelector('.resource-sense-line'),more=article.querySelector('.ke-word-more');
 if(summary)line.append(summary);if(sense){[['近',sense.synonyms],['反',sense.antonyms]].forEach(([label,value])=>{if(!text(value))return;const badge=el('span','v105-relation v1296-dictionary-badge');badge.dataset.v1296Badge=label;badge.append(el('span','v1296-badge-label',label),el('span','v1296-badge-value',value));line.append(badge);});}
 if(word.comparisonNotes?.some(note=>text(note.text||note.content))||graph?.contrast?.columns?.length)line.append(button('辨析',e=>openFeature(o,'contrast',e.currentTarget),'v105-contrast'));
 if(more)line.append(more);middle.append(line);
 const examples=(word.examples||[]).filter(x=>sense&&text(x.meaning)===text(sense.chinese)&&(!x.partOfSpeech||x.partOfSpeech===sense.partOfSpeech));
 const example=examples.find(x=>text(x.translation))||examples[0];if(example){const block=el('div','v105-example');block.dataset.exampleKey=example.exampleKey||'';const en=el('p','v105-example-en');en.innerHTML=rich(example,'english');block.append(en);if(text(example.translation)){const zh=el('p','v105-example-zh');zh.innerHTML=rich(example,'translation');block.append(zh);}middle.append(block);}
 // Preserve the existing source-bound player and its native controls when rebuilding the mother popup.
 article.replaceChildren(...[top,guidance,middle].filter(Boolean));
 const groups=new Map(),seen=new Set();const add=(title,node,key)=>{if(!node||!text(node.textContent)||seen.has(key))return;seen.add(key);if(!groups.has(title))groups.set(title,[]);groups.get(title).push(node);};
 // The mother-card explanation is kept as its own source module; word notes are never rewritten.
 const review=container.querySelector('[data-review-vocabulary-explanation]');if(review)add('语境说明',review,'review');
 for(const [field,fallback] of [['semanticNotes','语义点拨'],['formationNotes','构词法'],['etymologyNotes','词源趣谈']]){
 for(const note of word[field]||[]){if(note.senseKey&&note.senseKey!==sense?.senseKey)continue;if(note.partOfSpeech&&sense&&note.partOfSpeech!==sense.partOfSpeech)continue;const content=note.text||note.content;if(!text(content))continue;const node=el('div','v105-source-note');node.innerHTML=typeof renderResourceMarkup==='function'?renderResourceMarkup(content):esc(content);add(note.title||fallback,node,note.noteKey||content);}}
 if(!groups.size){container.querySelectorAll('.resource-word-note,.knowledge-explanation').forEach(n=>{const title=text(n.querySelector('h3,h4,header')?.textContent)||'说明';add(title,n,n.textContent);});}
 if(groups.size)article.append(tabbed([...groups]));
 container.querySelectorAll('.ke-vocabulary-explanation-layout').forEach(n=>{if(n.querySelector('img,video,.v105-video-card')){n.querySelector('.ke-vocabulary-explanation-copy')?.remove();}else n.remove();});
 });
}
const setVar=(node,key,value)=>{if(node.style.getPropertyValue(key)!==value)node.style.setProperty(key,value);};
function syncDock(entry){
 const aside=entry.sideDock;if(!aside?.isConnected)return;
 const native=document.querySelector('#classroomDock #analysisToggle')||document.querySelector('#analysisToggle');
 const normal=document.querySelector('#answerToggle')||native;if(!native||!normal)return;
 const style=getComputedStyle(native),rest=getComputedStyle(normal);
 const width=native.offsetWidth||64,height=native.offsetHeight||40;
 const props={'--v106-tool-width':width+'px','--v106-tool-height':height+'px','--v106-tool-font':style.fontSize,'--v106-tool-family':style.fontFamily,'--v106-tool-weight':style.fontWeight,'--v106-tool-radius':style.borderRadius,'--v106-tool-bg':rest.backgroundColor,'--v106-tool-border':rest.borderColor,'--v106-tool-color':rest.color};
 for(const [key,value]of Object.entries(props))setVar(entry.panel,key,value);
 if(aside.hidden){setVar(entry.panel,'--v106-content-left','0px');setVar(entry.panel,'--v106-content-right','0px');setVar(entry.panel,'--v109-dock-body-min','0px');if(settingsOwner===entry.dialog)restoreSettings();return;}
 const rect=entry.panel.getBoundingClientRect(),rail=aside.getBoundingClientRect();
 const right=entry.dialog.dataset.classroomToolsSide==='right';
 const occupied=right?Math.max(0,rect.right-rail.left+16):Math.max(0,rail.right+16-rect.left);
 setVar(entry.panel,'--v109-dock-body-min',Math.ceil(rail.height+24)+'px');
 setVar(entry.panel,'--v106-content-left',!right?occupied+'px':'0px');setVar(entry.panel,'--v106-content-right',right?occupied+'px':'0px');
}
function prepareContrast(detail,word){
 const notes=word?.comparisonNotes||[];if(!notes.length)return;
 const panel=detail.querySelector('.vwn-panel[aria-labelledby$="-tab-contrast"]');if(!panel)return;
 const head=String(word.head||word.word||'').replace(/\d+$/,'').toLowerCase();
 const graphs=[...panel.querySelectorAll('[data-graph-kind="contrast"]')];
 if(graphs.some(n=>String(n.dataset.graphKey||'').toLowerCase()===head))return;
 const host=panel.querySelector('.vwn-panel-scroll')||panel;
 const section=el('section','pgi-module v107-owned-contrast');section.dataset.graphKind='contrast';section.dataset.graphKey=head;
 for(const note of notes){if(!text(note.text||note.content))continue;const card=el('article','v107-contrast-note'),title=el('h3','',note.title||word.displayWord||word.word);const toggle=button('',()=>{},'hint-toggle');toggle.setAttribute('aria-expanded','false');const content=el('span','hint-text');content.setAttribute('aria-hidden','true');content.innerHTML=renderResourceMarkup(note.text||note.content);const cover=el('span','hint-cover','点击揭示辨析提示');toggle.append(content,cover);card.append(title,toggle);section.append(card);}
 if(!section.children.length)return;host.replaceChildren(section);window.ContrastReveal?.mount(section);
}
const settingsPanel=document.getElementById('interfaceSettingsPanel');
const settingsHome=document.createComment('shared interface settings home');
settingsPanel.before(settingsHome);let settingsOwner=null,settingsTrigger=null;
function restoreSettings(){
 if(!settingsOwner)return;
 settingsPanel.classList.add('hidden');settingsTrigger?.setAttribute('aria-expanded','false');
 settingsHome.after(settingsPanel);settingsPanel.removeAttribute('data-v108-shared');for(const name of [...settingsPanel.style])if(name.startsWith('--lecture-'))settingsPanel.style.removeProperty(name);settingsOwner=null;settingsTrigger=null;
}
function sharedSettings(entry,trigger){
 if(settingsOwner===entry.dialog&&!settingsPanel.classList.contains('hidden')){restoreSettings();return;}
 restoreSettings();closeInterfaceSettings();settingsOwner=entry.dialog;settingsTrigger=trigger;
 entry.sideDock.append(settingsPanel);settingsPanel.dataset.v108Shared='true';
 syncSettingsPalette();settingsPanel.classList.remove('hidden');trigger.setAttribute('aria-expanded','true');
}
const nativeSettingsToggle=toggleInterfaceSettings;
toggleInterfaceSettings=function(){restoreSettings();return nativeSettingsToggle();};
function syncSettingsPalette(){const source=document.getElementById('fullscreenPage');if(!source)return;const css=getComputedStyle(source);for(const name of css)if(name.startsWith('--lecture-')){const value=css.getPropertyValue(name);if(settingsPanel.style.getPropertyValue(name)!==value)settingsPanel.style.setProperty(name,value);}}
function syncSharedSettings(){
 if(settingsOwner)syncSettingsPalette();
 if(settingsOwner&&(!settingsOwner.isConnected||settingsOwner.classList.contains('hidden')||settingsOwner.inert||settingsOwner.getAttribute('aria-hidden')==='true'||settingsPanel.classList.contains('hidden')))restoreSettings();
}
function mountDock(entry){
 if(entry.dialog.id!=='popover')return;
 if(entry.sideDock?.isConnected){syncDock(entry);return;}
 const aside=el('aside','v105-popup-dock');aside.setAttribute('aria-label','讲解工具栏');
 const body=el('div','v105-dock-body'),actions=el('div','v105-dock-actions'),extras=el('div','v105-dock-extras');
 const controls=el('div','v106-dock-controls');
 const collapse=button('',()=>{const hidden=!body.hidden;body.hidden=hidden;aside.classList.toggle('is-collapsed',hidden);entry.dialog.classList.toggle('v105-tools-collapsed',hidden);collapse.innerHTML='<span>'+icons[hidden?'teaching-tools':entry.dialog.dataset.classroomToolsSide==='right'?'arrow-right':'arrow-left']+'</span>';collapse.setAttribute('aria-expanded',String(!hidden));collapse.setAttribute('aria-label',hidden?'展开讲解工具栏':'收起讲解工具栏');collapse.title=hidden?'展开讲解工具栏':'收起讲解工具栏';restoreSettings();syncDock(entry);window.ClassroomTools?.refresh();},'v105-dock-collapse');
 collapse.innerHTML=document.querySelector('#classroomDockToggle')?.innerHTML||'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6 6-6-6 6-6"/></svg>';collapse.setAttribute('aria-expanded','true');collapse.setAttribute('aria-label','收起讲解工具栏');collapse.title='收起讲解工具栏';
 const setting=button('',e=>{e.stopPropagation();sharedSettings(entry,e.currentTarget);},'v106-dock-setting');setting.innerHTML=document.querySelector('#interfaceSettingsToggle')?.innerHTML||'';setting.setAttribute('aria-label','讲解界面设置');setting.title='讲解界面设置';setting.setAttribute('aria-expanded','false');
 body.append(actions,extras);controls.append(collapse,setting);aside.append(body,controls);entry.panel.append(aside);actions.append(entry.actions);entry.sideDock=aside;entry.sideActions=extras;
 for(const child of [...entry.expandHost.children])if(child!==entry.returnButton)extras.append(child);
 syncDock(entry);
}
function syncModalChrome(){
 for(const id of ['popover','wordDetailDialog','lexicalChunkDialog','fullOptionStudentDialog']){
  const d=document.getElementById(id);if(!d||d.classList.contains('hidden'))continue;
  if(d.dataset.v107DirectEntered==='true'&&!d.classList.contains('v1263-interactive-fullscreen')){window.DemoKnowledgeEnhancements.closeWordDetail();continue;}
  let close=d.querySelector(':scope > .v107-modal-close');
  if(!close){close=button('',()=>{
    if(id==='wordDetailDialog'){
      if(d.classList.contains('v1263-interactive-fullscreen')&&!d.dataset.v107Direct)window.V1263InteractiveTabs?.leave?.(d);
      else window.DemoKnowledgeEnhancements.closeWordDetail();
    }else if(id==='popover')closeResourcePopover();
    else d.querySelector('[data-lexical-chunk-close],[data-full-option-students-close]')?.click();
  },'v107-modal-close');close.innerHTML=icons.x;close.setAttribute('aria-label','关闭当前弹窗');d.append(close);}
  const full=d.classList.contains('ke-expanded')||d.classList.contains('v1263-interactive-fullscreen');
  const kind=full?'fullscreen':'popup';if(d.dataset.v108Presentation!==kind)d.dataset.v108Presentation=kind;
  const needed=!full&&id==='fullOptionStudentDialog';
  if(close.hidden===needed)close.hidden=!needed;
  const panel=id==='fullOptionStudentDialog'?d.querySelector('.full-option-student-panel')||d:d;const footer=panel.querySelector(':scope > .classroom-modal-tools');
  if(footer){const controls=[...footer.querySelectorAll('button,select,input')].filter(n=>(full||!n.matches('.classroom-modal-back,[data-full-option-students-close]'))&&!n.closest('[hidden],.hidden')&&getComputedStyle(n).display!=='none');const empty=!full&&!controls.length;if(footer.classList.contains('v107-empty-footer')!==empty)footer.classList.toggle('v107-empty-footer',empty);}
 }
}
let queued=false;
function refresh(){queued=false;syncSharedSettings();syncModalChrome();
 document.querySelectorAll('#themeSegment [data-theme-choice]').forEach(b=>{if(!['pine','light'].includes(b.dataset.themeChoice))b.remove();else{const label=b.dataset.themeChoice==='pine'?'暗色':'亮色';if(b.textContent!==label)b.textContent=label;}});
 const theme=document.getElementById('themeSegment'),dark=theme?.querySelector('[data-theme-choice=pine]');if(dark&&theme.firstElementChild!==dark)theme.prepend(dark);
 if(!popup||popup.classList.contains('hidden'))return;
 const vocabulary=!!popup.querySelector('[data-v105-vocabulary]');popup.classList.toggle('v105-vocabulary',vocabulary);
 popup.querySelectorAll('[data-resource-page-prev],[data-resource-page-next]').forEach(b=>{const label=b.hasAttribute('data-resource-page-prev')?'上一条':'下一条';if(b.textContent!==label)b.textContent=label;});
 const active=[...popup.querySelectorAll('.resource-popover-page')].find(n=>!n.hidden&&!n.classList.contains('hidden')&&getComputedStyle(n).display!=='none')||popup;
 const title=active.querySelector('.resource-detail-title,.ke-wiki-name');const header=popup.querySelector(':scope > .resource-popover-head > div');
 if(title&&header&&!vocabulary){const content=text(title.textContent);if(content&&header.textContent!==content)header.textContent=content;if(!title.classList.contains('v105-promoted-title'))title.classList.add('v105-promoted-title');}
 popup.querySelectorAll('.v15-video-fullscreen-button').forEach(n=>n.remove());
}
const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(refresh);}};
window.V12107WordPresentation={prepareContrast};
window.V12105Vocabulary={mount};window.V12105Popup={mountDock,syncDock,refresh:schedule};
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class']});
window.ClassroomTools?.refresh();schedule();
})();
