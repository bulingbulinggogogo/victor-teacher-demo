/* V1.2.115: listening-only direct overlay. Original source rows and mother-card actions stay owned by their modules. */
(()=>{'use strict';
const popup=document.getElementById('popover');if(!popup)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=v=>String(v??'').trim(),clean=v=>['','—','-'].includes(text(v))?'':text(v);
const models=new WeakMap();let dialog,model,selected=null,trigger,frame=0,lastAudioButton=null;
function pos(value){const v=clean(value),m=v.match(/^(adj|adv|prep|pron|conj|interj|det|num|n|vt|vi|v)\b/i);return m?(m[1].match(/^v[ti]$/i)?'v.':m[1].toLowerCase()+'.'):'未标注';}
function modelFor(article){
 if(models.has(article))return models.get(article);const o=article?.v105Context;if(!o)return null;
 const word=window.V1220WordDetail?.resolve(o.entry,o.item,o.context);if(!word)return null;
 const wordId=o.context?.word?.id||o.entry.word_id||o.entry.wordId||o.item.wordId;
 const raw=(o.item.bookKey==='test-single-book'||o.item.realOnly===true?window.TEST_SINGLE_BOOK?.enhancements:window.DEMO_KNOWLEDGE_ENHANCEMENTS)?.examCasesByWordId?.[String(wordId)];
 const retained=(Array.isArray(raw)?raw:raw?.cases||[]).filter(r=>r.isDemonstration!==true&&r.simulated!==true);
 const all=window.V1220WordDetail?.cases({wordId,item:o.item,retained})||retained;
 const rows=all.filter(r=>r.mock!==true&&r.isDemonstration!==true&&r.simulated!==true&&/听力/.test(r.questionType||r.sourceQuestionType||'')&&clean(r.sentence||r.english));
 const map=new Map();rows.forEach((r,index)=>{const part=pos(r.partOfSpeech),meaning=clean(r.meaning)||'未标注释义',key=part+'|'+meaning;if(!map.has(key))map.set(key,{key,part,meaning,count:0,order:map.size});map.get(key).count++;});
 const groups=[...map.values()].sort((a,b)=>b.count-a.count||a.order-b.order).map((g,index)=>({...g,index,percent:rows.length?g.count/rows.length*100:0}));
 const value={word:text(word.displayWord||word.word||word.head),rows,groups,total:rows.length,allCount:all.length};models.set(article,value);return value;
}
function rowKey(r){return pos(r.partOfSpeech)+'|'+(clean(r.meaning)||'未标注释义');}
function rich(r,field){const value=String(field==='english'?r.sentence||r.english||'':r.translation||''),runs=r.sourceRichTextRuns?.[field]||r.richText?.[field];if(Array.isArray(runs)&&runs.map(x=>x.text||'').join('')===value)return runs.map(x=>x.bold?'<strong>'+esc(x.text)+'</strong>':esc(x.text)).join('');return esc(value).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\{([^{}]+)\}/g,'<strong>$1</strong>');}
const percent=n=>Number(n.toFixed(1)).toString()+'%';
function color(i){return ['#3264ff','#7197ff','#a9c4ff','#7d69d6','#46a7a1','#d39a49'][i%6];}
function ring(){
 let angle=-Math.PI/2;const point=(r,a)=>[110+r*Math.cos(a),110+r*Math.sin(a)];
 const paths=model.groups.map(g=>{const end=angle+g.count/model.total*Math.PI*2,a=point(92,angle),b=point(92,end),c=point(60,end),d=point(60,angle),large=g.count/model.total>.5?1:0;
 const attrs='data-group="'+g.index+'" tabindex="0" role="button" aria-pressed="'+(selected===g.index)+'" aria-label="'+esc(g.part+' '+g.meaning+'，'+g.count+'次，'+percent(g.percent))+'" style="--slice:'+color(g.index)+'"';
 const shape=g.count===model.total?'<circle class="v115-ring-full" cx="110" cy="110" r="76" '+attrs+'/>':'<path '+attrs+' d="M '+a.join(' ')+' A 92 92 0 '+large+' 1 '+b.join(' ')+' L '+c.join(' ')+' A 60 60 0 '+large+' 0 '+d.join(' ')+' Z"><title>'+esc(g.meaning+' '+g.count+'次 '+percent(g.percent))+'</title></path>';
 angle=end;return shape;}).join('');
 return '<svg class="v115-ring" viewBox="0 0 220 220" role="group" aria-label="听力例句释义分布，共'+model.total+'条">'+paths+'<text x="110" y="109" text-anchor="middle" class="v115-ring-total">'+model.total+'</text><text x="110" y="134" text-anchor="middle" class="v115-ring-label">听力例句</text></svg>';
}

function sentenceWithInlineAudio(html,audio){
 const root=document.createElement('span');root.innerHTML=html;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node,last;
 while(node=walker.nextNode())if(node.textContent.trim())last=node;
 if(!last)return html+audio;
 const match=/\S+\s*$/.exec(last.textContent),range=document.createRange();
 range.setStart(last,match.index);range.setEnd(root,root.childNodes.length);
 const tail=document.createElement('span');tail.className='v134-sentence-tail';tail.append(range.extractContents());
 tail.insertAdjacentHTML('beforeend','&nbsp;'+audio);root.append(tail);return root.innerHTML;
}
function render(){
 if(!dialog||!model)return;if(activeResourceAudioButton&&dialog.contains(activeResourceAudioButton))window.DemoResourceAudio.pause({resumeMain:false});const group=selected===null?null:model.groups[selected],rows=group?model.rows.filter(r=>rowKey(r)===group.key):model.rows;

 dialog.querySelector('.v115-case-list').innerHTML=rows.length?rows.map(r=>{const number=model.rows.indexOf(r)+1,source=[r.year?String(r.year)+'年':'',clean(r.paper||r.sourceName),'听力',clean(r.textNo),r.sourceType==='question-option'?'题目选项':''].filter(Boolean).join(' · ');return '<article class="v115-case" data-example-key="'+esc(r.exampleKey)+'"><span class="v115-number">'+String(number).padStart(2,'0')+'</span><div><p class="v115-case-en">'+(window.V12137ExampleAudio?.decide(r).playable===true?sentenceWithInlineAudio(rich(r,'english'),window.V12137ExampleAudio.button(r)):rich(r,'english'))+'</p>'+(clean(r.translation)?'<p class="v115-case-zh">'+rich(r,'translation')+'</p>':'')+'<div class="v115-tags"><span class="v115-sense">'+esc(pos(r.partOfSpeech)+' '+(clean(r.meaning)||'未标注释义'))+'</span><span>'+esc(source)+'</span>'+(clean(r.topic)?'<span>'+esc(r.topic)+'</span>':'')+'</div></div></article>';}).join(''):'<p class="v115-empty">暂无已收录的高考听力例句。</p>';
 const table='<table class="v124-distribution-table" aria-label="听力例句词性释义分布"><thead><tr><th>词性与释义</th><th>次数</th><th>占比</th></tr></thead><tbody>'+model.groups.map(g=>'<tr data-group="'+g.index+'" class="'+(selected===g.index?'is-selected':'')+'"><td><button class="v124-distribution-key" type="button" aria-pressed="'+(selected===g.index)+'" aria-label="'+esc(g.part+' '+g.meaning+'，'+g.count+'次，'+percent(g.percent))+'"><span class="v124-distribution-swatch" style="--slice:'+color(g.index)+'"></span><span>'+esc(g.part+' '+g.meaning)+'</span></button></td><td>'+g.count+'</td><td>'+percent(g.percent)+'</td></tr>').join('')+'</tbody></table>';
 dialog.querySelector('.v115-chart-grid').innerHTML=model.total?table+ring():'<p class="v115-empty">暂无分布数据。</p>';

}
function choose(index,origin){const svg=!!origin?.closest('svg');selected=selected===index?null:index;render();dialog.querySelector(svg?'svg [data-group="'+index+'"]':'tr[data-group="'+index+'"] button')?.focus({preventScroll:true});}
function close(){if(activeResourceAudioButton&&(dialog?.contains(activeResourceAudioButton)||activeResourceAudioButton===lastAudioButton))window.DemoResourceAudio.pause({resumeMain:true});if(dialog?.open)dialog.close();if(trigger?.isConnected&&!popup.classList.contains('hidden'))trigger.focus({preventScroll:true});}
function ensure(){
 if(dialog?.isConnected)return;dialog=document.createElement('dialog');dialog.id='v115ListeningDialog';dialog.className='v115-exam-dialog';dialog.setAttribute('aria-labelledby','v115ListeningTitle');
 dialog.innerHTML='<header class="v115-head"><h2 id="v115ListeningTitle"></h2><button class="v115-close" type="button" aria-label="关闭高考听力例句">×</button></header><div class="v115-layout"><section class="v115-examples" aria-label="高考听力例句"><div class="v115-list-head"><h3>高考听力例句</h3></div><div class="v115-case-list"></div></section><section class="v115-statistics" aria-label="词性释义分布"><div class="v115-stat-head"><h3>释义分布</h3></div><div class="v115-chart-grid"></div></section></div>';
 popup.append(dialog);dialog.querySelector('.v115-close').addEventListener('click',close);
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.addEventListener('click',e=>{e.stopPropagation();const audioButton=e.target.closest('[data-resource-audio]');if(audioButton){e.preventDefault();lastAudioButton=audioButton;window.DemoResourceAudio.toggle(audioButton.dataset.resourceAudio,audioButton);return;}if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();return;}const target=e.target.closest('[data-group]');if(target)choose(Number(target.dataset.group),target);});
 dialog.addEventListener('keydown',e=>{if(!['Enter',' '].includes(e.key))return;const target=e.target.closest('svg [data-group]');if(target){e.preventDefault();choose(Number(target.dataset.group),target);}});
}
function open(article,button){model=modelFor(article);if(!model)return;ensure();trigger=button;selected=null;dialog.querySelector('h2').textContent=model.word+' · 高考听力：'+model.total+'次';render();dialog.showModal();dialog.querySelector('.v115-close').focus();}
popup.addEventListener('click',e=>{const button=e.target.closest?.('[data-v105-vocabulary] .ke-exam-frequency');if(!button)return;e.preventDefault();e.stopImmediatePropagation();open(button.closest('[data-v105-vocabulary]'),button);},true);
window.addEventListener('keydown',e=>{if(!dialog?.open)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}else if(e.key==='Tab'){e.stopImmediatePropagation();const buttons=[...dialog.querySelectorAll('button,[tabindex="0"]')].filter(n=>!n.disabled&&n.getClientRects().length),first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}},true);
function refresh(){frame=0;if(dialog?.open&&(!dialog.isConnected||popup.classList.contains('hidden')))close();popup.querySelectorAll('[data-v105-vocabulary]').forEach(article=>{const button=article.querySelector('.ke-exam-frequency');if(!button)return;const m=modelFor(article);button.hidden=!m?.total;if(!m)return;const label='高考听力：'+m.total+'次';if(button.textContent!==label)button.textContent=label;if(button.hidden!==!m.total)button.hidden=!m.total;if(button.getAttribute('aria-haspopup')!=='dialog')button.setAttribute('aria-haspopup','dialog');if(button.getAttribute('aria-controls')!=='v115ListeningDialog')button.setAttribute('aria-controls','v115ListeningDialog');});}
new MutationObserver(()=>{if(!frame)frame=requestAnimationFrame(refresh);}).observe(popup,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});refresh();
window.V12115ListeningExamples={modelFor,inspect:()=>dialog?.open?{word:model.word,total:model.total,allCount:model.allCount,selected,groups:model.groups,rows:model.rows}:null};
})();
