/* Group existing teaching sources by entry, without changing source records. */
(()=>{'use strict';const api=window.V1220WordDetail;if(!api?.finish)return;
const make=(t,c,v)=>{const n=document.createElement(t);if(c)n.className=c;if(v!==undefined)n.textContent=v;return n;};
const panel=(d,id)=>d.querySelector('.vwn-panel[aria-labelledby$="-tab-'+id+'"] .vwn-panel-scroll');
const flows={
 'deep-fry':[['deep','adv 深入地'],['fry','v 油煎'],['deep-fry','v 油炸']],
 'present-day':[['present','现在的'],['day','日子 / 时期'],['present-day','当今的']],
 'entitle':[['en-','使成为；使处于……状态'],['title','n 称号；称谓'],['entitle','v 使……有权利 / 资格']],
 'trainer':[['train','v （受）训练 / 培训'],['-er','做……的人'],['trainer','n 训练员']]
};
function header(article,kind,word,sub){article.classList.add('v1282-topic-block');article.dataset.v1282TopicKind=kind;article.dataset.v1282TopicWord=word;let head=article.querySelector(':scope>.v1282-topic-head');if(!head){head=make('header','v1282-topic-head');article.prepend(head);}head.replaceChildren(make('h3','v1282-topic-title',kind+'｜'+word));if(sub)head.append(make('span','v1282-topic-subtitle',sub));return article;}
function flow(article,word){if(article.querySelector(':scope>.v1282-formation-flow')||!flows[word])return;const wrap=make('div','v1282-formation-flow');flows[word].forEach(([head,meaning],i)=>{if(i)wrap.append(make('span','v1282-formation-operator',i===1?'+':'→'));const part=make('div','v1282-formation-part');part.append(make('strong','',head),make('span','',meaning));wrap.append(part);});article.querySelector(':scope>.v1282-topic-head').after(wrap);}
function mountFormation(detail){const host=panel(detail,'formation'),gallery=host?.querySelector('.v1281-formation-gallery'),grid=gallery?.querySelector('.v1281-formation-examples');if(!grid)return;
 gallery.querySelector('.v1281-formation-gallery-head')?.remove();gallery.classList.add('v1282-topic-list');
 const cards=[...grid.querySelectorAll(':scope>.v1281-formation-example')];cards.forEach(card=>{const word=card.dataset.v1281GalleryHead;header(card,'构词解析',word,card.dataset.v1281GalleryType);card.querySelector('.v1281-formation-example-head')?.remove();card.querySelector('.v1281-formation-original-label')?.remove();flow(card,word);});
 const source=host.querySelector('.v1278-formation-content');if(!source)return;
 const deep=grid.querySelector('[data-v1281-gallery-head="deep-fry"]'),note=source.querySelector('[data-v1224-word-note="deep-fry"]'),visual=source.querySelector('[data-v1264-source-module="formation"]');
 if(deep){if(note)deep.append(note);if(visual){deep.querySelector('.v1281-formation-source-figure')?.remove();deep.append(visual);}grid.prepend(deep);}
 source.querySelectorAll('.v1267-construction-card').forEach(node=>{if(node.closest('.v1282-topic-block'))return;const word=/present-day/.test(node.textContent)?'present-day':'构词点拨';const article=header(make('article'),'构词解析',word,'合成词');flow(article,word);article.append(node);grid.prepend(article);});
 if(source.children.length===0)source.parentElement.hidden=true;
 const deepCard=grid.querySelector('[data-v1282-topic-word="deep-fry"]');
 if(deepCard&&!deepCard.querySelector('.v1283-full-deep-equation')){
   const sourceParagraph=deepCard.querySelector('[data-v1224-word-note="deep-fry"] p'),diagram=deepCard.querySelector('.v1282-formation-flow');
   if(sourceParagraph&&diagram){sourceParagraph.classList.add('v1283-full-deep-equation');sourceParagraph.innerHTML=sourceParagraph.innerHTML.replace(/\bdeep-fry\b|\bdeep\b|\bfry\b|深度炸/g,part=>'<strong>'+part+'</strong>');diagram.classList.add('v1283-deep-complete');diagram.replaceChildren(sourceParagraph);}
 }
 const order=['present-day','deep-fry','entitle','trainer'];[...grid.children].sort((a,b)=>order.indexOf(a.dataset.v1282TopicWord)-order.indexOf(b.dataset.v1282TopicWord)).forEach(node=>grid.append(node));
}
function sourceStories(detail){const current=api.getModel(detail)?.word,stories=[];const words=current?.v1225OriginalWords?.length?current.v1225OriginalWords:[current];for(const word of words.filter(Boolean))for(const row of word.etymologyNotes||[])if(row.text)stories.push({word:word.displayWord||word.word?.replace(/\d+$/,'')||word.head,row});
 const come=window.SINGLE_BOOK_LATEST_WORD_DATA?.wordsByHead?.['come to light'];const row=come?.semanticNotes?.find(n=>/词源/.test(n.title||''));if(row&&!stories.some(n=>n.row.noteKey===row.noteKey))stories.push({word:'come to light',row,example:true});
 const open=window.WORD_DETAIL_CASE;if(open?.etymology?.content&&!stories.some(n=>n.word===open.word))stories.push({word:open.word,row:{noteKey:'existing-case-etymology:'+open.wordId,text:open.etymology.content,sourceLinks:open.etymology.sourceLinks},example:true});return stories;
}
function mountStories(detail){const host=panel(detail,'etymology');if(!host)return;let list=host.querySelector('.v1282-etymology-list');if(!list){list=make('section','v1282-etymology-list v1282-topic-list');host.append(list);}const stories=sourceStories(detail);for(const item of stories){const key=item.row.noteKey;if(list.querySelector('[data-v1282-story-key="'+CSS.escape(key)+'"]'))continue;const article=header(make('article'),'词源趣谈',item.word,item.example?'词源示例':'');article.dataset.v1282StoryKey=key;if(item.row.source)article.dataset.v1282Source=JSON.stringify(item.row.source);const body=make('div','v1282-story-body');body.append(make('p','',item.row.text));if(item.row.sourceLinks?.length){const sources=make('div','v1282-story-sources');item.row.sourceLinks.forEach(link=>{const a=make('a','',link.title);a.href=link.url;a.target='_blank';a.rel='noopener';sources.append(a);});body.append(sources);}article.append(body);list.append(article);}
 if(stories.length)for(const node of [...host.children])if(node!==list)node.hidden=true;
}
function mount(detail=document.getElementById('wordDetailDialog')){if(!detail?.isConnected)return;mountFormation(detail);mountStories(detail);}
const finish=api.finish;api.finish=function(detail){const value=finish.apply(this,arguments);mount(detail);queueMicrotask(()=>mount(detail));return value;};window.addEventListener('v1213-word-mounted',e=>queueMicrotask(()=>mount(e.detail)));mount();
window.V1282TopicBlocks={mount,inspect(d=document.getElementById('wordDetailDialog')){return[...(d?.querySelectorAll('.v1282-topic-block')||[])].map(n=>({kind:n.dataset.v1282TopicKind,word:n.dataset.v1282TopicWord,title:n.querySelector('.v1282-topic-title')?.textContent,storyKey:n.dataset.v1282StoryKey,flow:[...n.querySelectorAll('.v1282-formation-part')].map(p=>p.textContent),images:[...n.querySelectorAll('img')].map(i=>i.getAttribute('src'))}));}};
})();
