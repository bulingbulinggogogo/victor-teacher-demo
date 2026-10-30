/* V79: approved review corrections. Source records and live media stay owned
 * by their original renderers; this adapter changes their presentation homes. */
(() => {
  'use strict';
  const api=window.V1220WordDetail,nav=window.WordDetailNavigation;
  if(!api?.finish||!nav?.reconfigure)return;
  const models=new WeakMap();
  let activeGuide=null;
  // Register the approved viewer as the top popup, so the host's outside-click
  // guard does not dismiss the word detail underneath it.
  window.DemoPopupDismiss?.register('.sgp-backdrop:not([hidden])',{
    panelSelector:'.sgp-panel',close:()=>activeGuide?.close()
  });
  // This boundary precedes the legacy document-level modal keyboard handler.
  window.addEventListener('keydown',event=>{
    if(!activeGuide?.isOpen)return;
    event.stopImmediatePropagation();activeGuide.handleKeydown(event);
  },true);
  const text=value=>String(value??'').trim();
  const norm=value=>text(value).normalize('NFC').replace(/[；;]/g,';').replace(/\s+/g,'');
  const pos=value=>{const key=text(value).toLowerCase().match(/^(adj|adv|n|vt|vi|v)(?=[.\s[(（]|$)/)?.[1];return /^v[ti]$/.test(key||'')?'v':key||text(value);};
  const make=(tag,cls,value)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(value!==undefined)node.textContent=value;return node;};
  const panelFor=(detail,id)=>detail.querySelector('.vwn-panel[aria-labelledby$="-tab-'+id+'"]');
  const meaningful=node=>!!text(node.textContent)||!!node.querySelector('img[src],video[src],audio[src],canvas,svg');
  function cleanFeatureIdentity(node){
    [node,...node.querySelectorAll('[data-word-note-feature]')].forEach(child=>child.removeAttribute('data-word-note-feature'));
    node.hidden=false;
  }
  function displayAcademicLabels(detail){
    detail.querySelectorAll('[data-word-tag="academic"],[data-word-tag-field="academic"]').forEach(node=>{
      if(text(node.textContent)!=='AW')node.textContent='AW';
      node.title='学术词汇';node.dataset.wordTagHelp='AW：学术词汇标签。';
    });
  }
  function compactWordPresentation(detail){
    detail.querySelectorAll('[data-vwn-pos]').forEach(button=>{
      const key=button.dataset.vwnPos,label=/^(n|v|adj|adv|vi|vt)$/.test(key)?key+'.':key;
      if(button.textContent!==label){if(!button.dataset.v1280FullPos)button.dataset.v1280FullPos=text(button.textContent);button.setAttribute('aria-label',button.dataset.v1280FullPos);button.textContent=label;}
    });
    detail.querySelectorAll('[data-v1238-exam-star]').forEach(star=>{
      const wrapper=star.closest('.v1278-example');
      const marker=wrapper?.querySelector(':scope>.v1278-example-number');
      if(marker){if(star.parentElement!==marker)marker.prepend(star);return;}
      const sentence=star.closest('.v1223-example-copy');if(sentence&&sentence.firstElementChild!==star)sentence.prepend(star);
    });
  }
  function syncControls(detail){
    if(!detail?.hasAttribute('data-v1278-word-detail'))return;
    displayAcademicLabels(detail);compactWordPresentation(detail);
    detail.querySelectorAll('.v1227-stat-source-tabs').forEach(node=>node.remove());
    const allowed=new Set(['english','blocks','examples','ordinary','textbook','exam']);
    detail.querySelectorAll('[data-word-feature]').forEach(button=>{if(!allowed.has(button.dataset.wordFeature))button.remove();});
    detail.querySelectorAll('[data-v1244-block-relation-controls]').forEach(group=>group.remove());
    detail.querySelectorAll('[data-v1265-all-features]').forEach(button=>button.remove());
  }
  function shapeExample(example){
    if(example.closest('.v1278-detail-panel'))return;
    example.querySelectorAll('.v1223-example-kind').forEach(chip=>{if(['单词例句','教材例句','高考例句'].includes(text(chip.textContent)))chip.remove();});
    const citations=[...example.querySelectorAll('[data-v1224-citation]')].filter(node=>node.closest('.v1222-sense-example')===example);
    const footer=[...example.querySelectorAll('.v1225-example-topic-line')].find(node=>node.closest('.v1222-sense-example')===example);
    const sources=[...(footer?.querySelectorAll('[data-word-tag-field]')||[])].filter(node=>/^source/.test(node.dataset.wordTagField||''));
    if(!citations.length&&sources.length===1&&sources[0].classList.contains('v1278-provenance-chip'))return;
    const values=[];
    const add=value=>text(value).split(/\s*·\s*/).filter(Boolean).forEach(part=>{if(!values.includes(part))values.push(part);});
    sources.forEach(node=>add(node.textContent));
    if(!values.length)citations.forEach(node=>add(node.textContent));
    let host=footer;
    if(!host&&values.length){host=make('div','v1225-example-topic-line');const line=example.querySelector('.v1266-example-children,.v1223-sense-example-line');(line||example).append(host);}
    if(host&&values.length){
      const chip=make('span','v1278-provenance-chip',values.join(' · '));chip.dataset.wordTagField='source';
      chip.title=citations.map(node=>node.title).filter(Boolean).join('\n')||values.join(' · ');
      sources.forEach(node=>node.remove());host.prepend(chip);
    }
    citations.forEach(node=>node.remove());
    example.querySelectorAll('.v1224-source-anchor').forEach(node=>node.remove());
    example.dataset.v1271Sources='true';
  }
  function decorateExamples(detail){detail.querySelectorAll('.v1222-sense-example').forEach(shapeExample);}
  function decorateMeaning(detail,result){
    const senses=new Map((result.word.parts||[]).flatMap(part=>part.senses||[]).map(sense=>[String(sense.senseKey||sense.id),sense]));
    detail.querySelectorAll('[data-latest-sense]').forEach(line=>{
      const sense=senses.get(line.dataset.latestSense),copy=line.querySelector(':scope>.resource-sense-copy');if(!sense||!copy)return;
      // These values are the original exact-sense fields, not block relations.
      copy.querySelectorAll('[data-sense-feature="synonyms"],[data-sense-feature="antonyms"]').forEach(node=>node.remove());
      const definition=copy.querySelector('.v1220-english-definition');
      if(definition&&!definition.querySelector('.v1278-meaning-relations')){
        const entries=[['近',sense.synonyms],['反',sense.antonyms]].filter(([,value])=>text(value));
        if(entries.length){const relations=make('span','v1278-meaning-relations');entries.forEach(([label,value])=>relations.append(make('span','',label+'：'+text(value))));definition.append(relations);}
      }
      line.querySelectorAll('.resource-sense-meta').forEach(meta=>meta.classList.add('v1278-sense-prefix'));
    });
  }
  function noteRecords(word){
    const words=word.v1225OriginalWords?.length?word.v1225OriginalWords:[word];
    return words.flatMap(source=>['semanticNotes','formationNotes'].flatMap(field=>(source[field]||[]).map(record=>({...record,recordHead:source.head,module:field}))));
  }
  function exactTarget(record,result){
    if(!record)return null;
    const all=(result.word.parts||[]).flatMap(part=>(part.senses||[]).map(sense=>({part,sense})));
    const sourceHead=norm(result.word.head).replace(/\d+$/,'');
    if(sourceHead==='hit' && /风行|轰动|流行歌曲|受欢迎/.test(text(record.text))){
      const target=all.filter(({part,sense})=>pos(part.partOfSpeech)==='n'&&/轰动|受欢迎|风行|流行歌曲/.test(text(sense.chinese)));
      return target.length===1?target[0].sense:null;
    }
    if(record.senseKey)return all.find(({sense})=>String(sense.senseKey||sense.id)===String(record.senseKey))?.sense||null;
    const chinese=record.chinese||record.meaning||record.parentMeaning,part=record.partOfSpeech||record.parentPartOfSpeech;
    if(!text(chinese)||!text(part))return null;
    const matching=all.filter(({part:partRow,sense})=>norm(sense.chinese)===norm(chinese)&&pos(partRow.partOfSpeech)===pos(part));
    return matching.length===1?matching[0].sense:null;
  }
  function noteFor(node,records){
    const key=node.dataset.latestNote,keys=node.dataset.v1235NoteKeys;
    let sourceKeys=[];try{sourceKeys=JSON.parse(keys||'[]');}catch(_){}
    return records.find(record=>[record.noteKey,record.formationKey].filter(Boolean).some(value=>value===key||sourceKeys.includes(value)))||null;
  }
  function guidanceItems(model,key){
    const local=model.guides.get(key)||[],shared=model.sharedGuides||[],formations=model.formationGuides||[];
    const formation=formations.find(item=>/present-day/.test(item.node.textContent))||formations[0];
    const list=[...local,...shared,...formations];
    const order=['语义点拨','同义表达','名词动化','构词法','语义推导'];
    return list.filter((item,index)=>list.findIndex(other=>other.node===item.node)===index).sort((a,b)=>order.indexOf(a.label)-order.indexOf(b.label));
  }
  const guideIcons={up:'m6 14 6-6 6 6',down:'m6 10 6 6 6-6',close:'m6 6 12 12M18 6 6 18'};
  function guideIcon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',guideIcons[name]);svg.append(path);return svg;}
  function conceptMedia(media,parts){const row=make('div','v1282-guide-concept-row');parts.forEach(([head,sub],index)=>{if(index)row.append(make('div','v1282-guide-arrow','→'));const concept=make('div','v1282-guide-concept');concept.append(make('b','',head),make('span','',sub));row.append(concept);});media.append(row);}
  function conversionMedia(media,item){
    const first=item.node.querySelector('.v1247-reasoning-noun img'),last=item.node.querySelector('[data-v1247-source-src]');
    if(!first||!last)return false;
    media.classList.add('v1282-conversion');
    const noun=make('figure'),verb=make('figure'),bridge=make('div','v1282-guide-arrow v1282-conversion-bridge'),bridgeCopy=make('div','v1282-conversion-reveal'),verbCopy=make('div','v1282-conversion-reveal');
    const nounCaption=make('figcaption'),verbCaption=make('figcaption');nounCaption.append(make('b','','n.'),' 蛇');verbCaption.append(make('b','','v.'),' 蛇行；蜿蜒前进');
    noun.append(first.cloneNode(true),nounCaption);verbCopy.append(last.cloneNode(true),verbCaption);verb.append(verbCopy);
    bridgeCopy.append(make('small','','像蛇一样运动'),make('span','v1282-guide-arrow-char','→'));bridge.append(bridgeCopy);
    const reason=make('button','v1282-guide-discover','它怎样运动？'),reveal=make('button','v1282-guide-discover','揭示动词含义'),reset=make('button','v1282-conversion-reset','重新推导');reason.type=reveal.type=reset.type='button';bridge.append(reason);verb.append(reveal);media.append(reset,noun,bridge,verb);
    const show=stage=>{media.dataset.conversionStage=String(stage);bridgeCopy.hidden=stage<1;verbCopy.hidden=stage<2;reason.hidden=stage>=1;reveal.hidden=stage>=2;reveal.disabled=stage<1;reason.setAttribute('aria-expanded',String(stage>=1));reveal.setAttribute('aria-expanded',String(stage>=2));};
    reason.addEventListener('click',()=>show(1));reveal.addEventListener('click',()=>show(2));reset.addEventListener('click',()=>show(0));show(0);return true;
  }
  function renderGuidance(model,item,body){
    const isPresent=/^present\d*$/.test(text(model.result.word.head)),type=item.label;
    const copy=item.node.cloneNode(true);copy.querySelectorAll('h3,h4,button,.vpi-tools,.v1247-reasoning-controls,.v1247-polysemy-controls').forEach(node=>node.remove());
    const source=text(copy.textContent).replace(/^构词法/,'').trim();
    let word=text(model.result.word.displayWord||model.result.word.word||model.result.word.head).replace(/\d+$/,''),sub='',explanation=source,en='',zh='';
    const media=make('div','v1282-guide-media');
    if(type==='名词动化'&&conversionMedia(media,item)){
      word='snake';sub='由“蛇”到“蜿蜒前进”';explanation='从蛇弯曲的形态，联想到曲折向前的运动方式。名词变成动词，画面中的联系依然存在。';en='The road snakes through the mountains.';zh='这条路蜿蜒穿过群山。';
    }else if(type==='构词法'&&/present-day/.test(source)){
      word='present-day';sub='两个词组合，表达一个概念';
      const flow=make('div','v1282-guide-word-flow');[['present','现在的'],['day','日子 / 时期'],['present-day','当今的']].forEach(([part,meaning],index)=>{if(index)flow.append(make('div','v1282-guide-operator',index===1?'+':'→'));const large=make('div','v1282-guide-large',part);large.append(make('small','',meaning));flow.append(large);});media.append(flow);
      en='Technology shapes present-day life.';zh='科技塑造着当今的生活。';
    }else if(type==='语义推导'&&isPresent){
      sub='从“在场”理解“呈现于眼前”';conceptMedia(media,[['在眼前','起点'],['让别人看见','推导'],['呈现、展示','引申义']]);en='All members were present at the meeting.';zh='所有成员都出席了会议。';
    }else if(type==='语义点拨'&&isPresent){
      if(source.includes('礼物')){sub='从赠礼场景理解“礼物”';conceptMedia(media,[['送到对方面前','动作 / 场景'],['表达心意的一件东西','语义引申'],['present','礼物']]);en='What can I get him for a birthday present?';zh='我给他送点什么生日礼物呢？';}else{sub='从语境理解“呈现”';conceptMedia(media,[['给出','礼物 / 奖项'],['呈现','信息 / 成果'],['介绍','观点 / 人物']]);en='She presented her findings to the class.';zh='她向全班展示了自己的研究结果。';}
    }else{
      sub=type;copy.querySelectorAll('img,video').forEach(node=>media.append(node.cloneNode(true)));
    }
    const topic=make('div','v1282-guide-topic');topic.append(make('h3','',word),make('span','v1282-guide-topic-label',sub));
    const para=make('p','v1282-guide-explanation');
    const highlight=type==='名词动化'?'曲折向前的运动方式':type==='构词法'?'present-day':type==='语义点拨'?'送到对方面前':type==='语义推导'?'呈现、展示':'';
    if(highlight&&explanation.includes(highlight)){const at=explanation.indexOf(highlight);para.append(explanation.slice(0,at),make('strong','',highlight),explanation.slice(at+highlight.length));}else para.textContent=explanation;
    body.replaceChildren();if(media.childNodes.length)body.append(media);body.append(topic,para);
    if(en){const example=make('div','v1282-guide-example'),english=make('p','v1282-guide-example-en'),translation=make('p','v1282-guide-example-zh',zh),target=type==='名词动化'?'snakes':type==='构词法'?'present-day':type==='语义点拨'?(en.includes('presented')?'presented':'present'):'present',at=en.indexOf(target);english.append(en.slice(0,at),make('strong','',target),en.slice(at+target.length));example.append(english,translation);body.append(example);}
    body.dataset.guideType=type;
  }
  function approvedItem(model,item,key){
    if(item.label==='名词动化'){
      const noun=item.node.querySelector('.v1247-reasoning-noun img'),verb=item.node.querySelector('[data-v1247-source-src]');
      if(!noun||!verb)return null;
      return {type:item.label,word:'snake',sub:'由“蛇”到“蜿蜒前进”',explain:'从蛇弯曲的形态，联想到<strong>曲折向前的运动方式</strong>。名词变成动词，画面中的联系依然存在。',en:'The road <strong>snakes</strong> through the mountains.',zh:'这条路蜿蜒穿过群山。',interaction:{type:'noun-to-verb',nounImage:noun.getAttribute('src'),verbImage:verb.getAttribute('src'),nounLabel:'蛇',verbLabel:'蛇行；蜿蜒前进',actionLabel:'像“蛇”一样运动'},sourceNode:item.node};
    }
    // Data-only adaptation: the approved component owns the visible markup and behavior.
    const detached=make('div');renderGuidance(model,item,detached);
    const media=detached.querySelector('.v1282-guide-media');
    const names={'v1282-guide-concept-row':'concept-row','v1282-guide-concept':'concept','v1282-guide-arrow':'arrow','v1282-guide-word-flow':'word-flow','v1282-guide-large':'large','v1282-guide-operator':'operator'};
    if(media)for(const node of media.querySelectorAll('[class]'))for(const [old,now] of Object.entries(names))if(node.classList.contains(old)){node.classList.remove(old);node.classList.add(now);}
    return {type:item.label,word:text(detached.querySelector('.v1282-guide-topic h3')?.textContent),sub:text(detached.querySelector('.v1282-guide-topic-label')?.textContent),media:media?.innerHTML||'',explain:detached.querySelector('.v1282-guide-explanation')?.innerHTML||'',en:detached.querySelector('.v1282-guide-example-en')?.innerHTML||'',zh:text(detached.querySelector('.v1282-guide-example-zh')?.textContent),sourceNode:item.node,senseKey:key};
  }
  function openGuidance(model,key,trigger){
    if(!window.SemanticGuidancePopup)return;
    const items=guidanceItems(model,key).map(item=>approvedItem(model,item,key)).filter(Boolean);if(!items.length)return;
    model.guideDialog?.destroy();
    const popup=new window.SemanticGuidancePopup({items,title:'语义点拨'});model.guideDialog=popup;
    // The host word-detail sits above ordinary page overlays; lift only this instance.
    popup.backdrop.style.zIndex=String(Math.max(10000,Number(getComputedStyle(model.detail).zIndex)||0)+1);
    // The host's original resource card listens for outside clicks on document.
    // The approved viewer is its sibling; stop here after the component handles
    // the click, even when next/previous has replaced the clicked button.
    popup.backdrop.addEventListener('click',event=>event.stopPropagation());
    activeGuide=popup;popup.open(0,trigger);
  }
  function ensureGuidanceButton(model,key){
    const line=[...panelFor(model.detail,'meanings')?.querySelectorAll('[data-latest-sense]')||[]].find(node=>node.dataset.latestSense===key);
    const copy=line?.querySelector(':scope>.resource-sense-copy');if(!copy||copy.querySelector('[data-v1278-guidance]'))return;
    const button=make('button','v1278-guidance-button','语义点拨');button.type='button';button.dataset.v1278Guidance=key;button.setAttribute('aria-haspopup','dialog');
    const meaning=text(copy.querySelector('.resource-sense-meaning')?.textContent);button.setAttribute('aria-label','语义点拨：'+meaning);
    button.addEventListener('click',event=>{event.stopPropagation();openGuidance(model,key,button);});copy.prepend(button);line.dataset.v1279HasGuidance='true';
  }
  function prepareContent(model){
    const {detail,result}=model,meanings=panelFor(detail,'meanings'),records=noteRecords(result.word);
    const family=make('section','v1278-family-content'),formation=make('section','v1278-formation-content');
    const addGuidance=(key,node,label)=>{
      if(!meaningful(node))return false;
      if(/^同义表达[：:]/.test(text(node.querySelector('p')?.textContent||node.textContent)))label='同义表达';
      const head=norm(result.word.head).replace(/\d+$/,'');
      if(head==='hit' && /语义/.test(label)){
        const record=noteFor(node,records)||records.find(row=>row.module==='semanticNotes'&&/风行|轰动|流行歌曲|受欢迎/.test(text(row.text)));
        const target=exactTarget(record,result);key=target?String(target.senseKey||target.id):null;
        // An unassigned source note cannot be repeated under unrelated senses.
        if(!key){model.store.append(node);return true;}
      }

      cleanFeatureIdentity(node);node.classList.add('v1278-construction-content');node.dataset.v1278Construction='true';
      // Keep the source in its Tab and expose the same complete content in the merged guide.
      if(/构词/.test(label)){formation.append(node);if(!model.formationGuides.some(item=>item.node===node))model.formationGuides.push({label:'构词法',node,scope:'构词示例'});return true;}
      if(!key){
        if(model.sharedGuides.some(item=>item.node===node))return true;
        const scope=label==='名词动化'?'示例 snake':'词义脉络';
        model.sharedGuides.push({label,node,scope});model.store.append(node);return true;
      }
      key=String(key);const items=model.guides.get(key)||[];if(items.some(item=>item.node===node))return true;if(items.some(item=>item.label===label&&norm(item.node.textContent)===norm(node.textContent))){node.remove();return true;}
      items.push({label,node});model.guides.set(key,items);model.store.append(node);ensureGuidanceButton(model,key);return true;
    };
    model.addGuidance=addGuidance;
    const addWordContent=(node,type='formation')=>{
      if(type==='nominalization'||node.matches('[data-graph-kind="nominalization"]')||node.querySelector('[data-graph-kind="nominalization"]'))return addGuidance(null,node,'名词动化');
      if(type==='semantic')return addGuidance(null,node,'语义推导');
      cleanFeatureIdentity(node);if(meaningful(node))formation.append(node);
    };
    for(const card of [...meanings?.querySelectorAll('[data-v1264-sense-card]')||[]]){
      const type=card.dataset.v1264SenseCard,body=card.querySelector(':scope>.v1264-sense-card-body')||card;
      if(type==='family'){
        [...body.children].forEach(node=>{cleanFeatureIdentity(node);family.append(node);});card.remove();continue;
      }
      if(type==='singleMeaning'){
        const plain=make('section','v1278-single-meaning');plain.dataset.v1278SingleMeaning='';
        [...body.children].forEach(node=>{cleanFeatureIdentity(node);plain.append(node);});
        plain.querySelectorAll('.resource-word-note,.knowledge-explanation,.v1220-note').forEach(node=>{node.classList.remove('resource-word-note','knowledge-explanation','v1220-note');cleanFeatureIdentity(node);});
        plain.querySelectorAll('h3,h4').forEach(node=>{if(['一词一义','释义'].includes(text(node.textContent)))node.remove();});
        const copy=card.closest('[data-latest-sense]')?.querySelector('.resource-sense-copy');
        if(copy){
          const flow=copy.querySelector(':scope>.v1275-sense-body')||copy;
          flow.prepend(plain);
        }
        card.remove();continue;
      }
      if(!['semantic','formation','nominalization'].includes(type))continue;
      // Only source-declared sense relationships enter a meaning's popup.
      // Legacy first-sense placement is not treated as source evidence.
      const notes=[...body.querySelectorAll('[data-latest-note]')].filter(node=>!node.parentElement?.closest('[data-latest-note]'));
      notes.forEach(note=>{
        const record=noteFor(note,records),target=exactTarget(record,result);
        if(target)addGuidance(String(target.senseKey||target.id),note,type==='formation'?'构词法':'语义推导');else addWordContent(note,type);
      });
      [...body.children].forEach(node=>{
        node.querySelectorAll('.vpi-tools,.v1247-reasoning-controls,.v1247-polysemy-controls').forEach(control=>control.remove());
        if(meaningful(node))addWordContent(node,type);
      });card.remove();
    }
    // Source-specific semantic notes and construction rows have exact parents.
    meanings?.querySelectorAll('[data-v1241-semantic-note],.v1267-construction-card').forEach(note=>{
      const key=note.closest('[data-latest-sense]')?.dataset.latestSense;
      addGuidance(key,note,note.matches('.v1267-construction-card')?'构词法':'语义点拨');
    });
    meanings?.querySelectorAll('.resource-word-note,.knowledge-explanation').forEach(note=>{
      if(note.matches('[data-v1264-sense-card]')||note.closest('[data-v1264-sense-card],.v1278-single-meaning'))return;
      const label=text(note.querySelector('h4')?.textContent);
      if(!/语义|构词|名词动化/.test(label))return;
      const key=note.closest('[data-latest-sense]')?.dataset.latestSense;
      addGuidance(key,note,label);
    });
    // Independent source panels (when a word has no first sense card) also stay.
    for(const id of ['formation','semantic','nominalization']){
      const old=panelFor(detail,id);if(!old)continue;
      const body=old.querySelector('.vwn-panel-scroll');if(body)[...body.children].forEach(node=>addWordContent(node,id));
    }
    model.family=family;model.formation=formation;
    if(model.sharedGuides.length)meanings?.querySelectorAll('[data-latest-sense]').forEach(line=>ensureGuidanceButton(model,line.dataset.latestSense));
  }
  function decorateFamily(model){
    const {detail,result}=model,data=window.SINGLE_BOOK_LATEST_WORD_DATA;
    detail.querySelectorAll('[data-vft-node]').forEach(node=>{
      const head=node.dataset.vftNode,heading=node.querySelector('.vft-node-content>.vft-word');if(!heading||heading.querySelector('.v1278-family-frequency'))return;
      const current=result.word.displayWord||result.word.word||result.word.head;
      const word=norm(current.replace(/\d+$/,''))===norm(head)?result.word:data?.wordsByHead?.[head];
      let count=null;
      if(word&&window.V1227ExamDistribution?.sourceRows){
        const retained=word===result.word?(result.options.retainedCases||[]):[];
        count=window.V1227ExamDistribution.sourceRows(word,{bookKey:'test-single-book'},retained).length;
      }
      const chip=make('span','v1227-word-tag v1278-family-frequency','高考 '+(count===null?'—':count));chip.dataset.wordTagField='exam-count';chip.title=count===null?'暂无可核对的高考收录次数':'已收录高考例句次数，与高考详情同源';heading.append(chip);
    });
  }
  function showNetworkInitially(detail){
    const panel=panelFor(detail,'illustrations');if(!panel)return;
    const control=detail.querySelector('.v1247-polysemy-source-all[data-pgi-all]')||[...detail.querySelectorAll('[data-pgi-all]')].find(button=>button.closest('[data-v1220-subnav-for="illustrations"],[data-v1225-subnav-for="illustrations"]'));
    if(control&&control.getAttribute('aria-pressed')!=='true')control.click();
    // If the original action was already detached, reveal its existing copies.
    panel.querySelectorAll('[data-pgi-copy]').forEach(copy=>{copy.classList.remove('is-hidden');copy.setAttribute('aria-pressed','true');});
    window.V1247PolysemyControls?.refresh?.();
  }
  function mount(detail,result=api.getModel(detail)){
    if(detail?.id!=='wordDetailDialog'||!result?.word||models.has(detail))return;
    detail.dataset.v1278WordDetail='true';
    if(norm(result.word.head).replace(/\d+$/,'')==='hit')detail.dataset.v12102NoSenseExamStats='true';
    const model={detail,result,guides:new Map(),sharedGuides:[],formationGuides:[],store:make('div','v1278-guidance-store')};model.store.hidden=true;detail.append(model.store);models.set(detail,model);
    prepareContent(model);

    window.V1278DetailPanels?.mount(detail,result);
    model.statistics=window.V1278DetailPanels?.statistics(detail);
    const available=id=>!!panelFor(detail,id);
    const specs=[['meanings','释义'],['formation','构词解析'],['etymology','词源趣谈'],['illustrations','语义网'],['family','词族树'],['contrast','辨析'],['cases','高考精讲'],['textbookExamples','教材详情']].filter(([id])=>id==='formation'?meaningful(model.formation):id==='family'?meaningful(model.family):id==='statistics'?!!model.statistics:available(id)).map(([id,title])=>({id,title,...(id==='family'?{nodes:[model.family]}:id==='formation'?{nodes:[model.formation]}:id==='statistics'?{nodes:[model.statistics]}:{})}));
    nav.reconfigure(detail,specs);showNetworkInitially(detail);decorateMeaning(detail,result);decorateFamily(model);decorateExamples(detail);syncControls(detail);
    const features=api.featureState?.(detail);if(features)features.relations=true;
    api.refreshFeatures(detail);syncControls(detail);
    let pending=false;
    const observer=new MutationObserver(records=>{
      if(!records.some(record=>record.type==='childList')||pending)return;
      pending=true;queueMicrotask(()=>{pending=false;if(!detail.isConnected){observer.disconnect();return;}
        panelFor(detail,'meanings')?.querySelectorAll('[data-v1241-semantic-note],.v1267-construction-card').forEach(note=>{if(note.hasAttribute('data-v1278-construction'))return;const key=note.closest('[data-latest-sense]')?.dataset.latestSense;model.addGuidance(key,note,note.matches('.v1267-construction-card')?'构词法':'语义点拨');});
        decorateExamples(detail);syncControls(detail);});
    });observer.observe(detail,{subtree:true,childList:true});model.observer=observer;
    detail.addEventListener('word-pos-change',()=>{decorateMeaning(detail,result);syncControls(detail);});
    window.V1223WordDock?.refresh?.(detail);nav.fit();
  }
  const finish=api.finish;api.finish=function(detail,result){const value=finish.apply(this,arguments);mount(detail,result);return value;};
  function preview(head='present2'){
    if(window.V1284EntryContext&&!window.V1284EntryContext.prepare())return false;
    const source=window.SINGLE_BOOK_LATEST_WORD_DATA?.wordsByHead?.[head]||window.SINGLE_BOOK_LATEST_WORD_DATA?.wordsByHead?.[head+'2'];
    if(!source||!window.DemoKnowledgeEnhancements?.openWordDetail)return false;
    const id=source.primaryCurrentWordId||source.currentWordIds?.[0];
    window.DemoKnowledgeEnhancements.openWordDetail({word:source.displayWord||source.word,word_id:id},{bookKey:'test-single-book',v1220Head:source.head,wordId:id},{word:{id,word:source.displayWord||source.word}},'top',null);return true;
  }
  const requestedHead=new URL(location.href).searchParams.get('reviewWord');
  if(requestedHead){
    let attempts=0;
    const openRequested=()=>{
      const classroom=document.getElementById('fullscreenPage');
      if(classroom&&!classroom.classList.contains('hidden')&&typeof state!=='undefined'&&state.questions?.length&&preview(requestedHead))return;
      if(++attempts<600)requestAnimationFrame(openRequested);
    };
    requestAnimationFrame(openRequested);
  }
  window.V1283Guidance={current:()=>activeGuide,inspect(){const guide=activeGuide;return guide?{approved:guide instanceof window.SemanticGuidancePopup,isOpen:guide.isOpen,index:guide.index,types:guide.items.map(item=>item.type),stage:guide.conversionStage()}:null;}};
  window.V1278WordDetail={mount,syncControls,preview,inspect(detail=document.getElementById('wordDetailDialog')){
    const model=models.get(detail);if(!model)return null;
    return {head:model.result.word.head,navigation:[...detail.querySelectorAll('[data-word-module]')].map(button=>({id:button.dataset.wordModule,label:text(button.textContent)})),guidance:[...model.guides].map(([key,items])=>({senseKey:key,count:guidanceItems(model,key).length,types:guidanceItems(model,key).map(item=>item.label)})),formationGuidance:model.formationGuides.length,sharedGuidance:model.sharedGuides.map(item=>({type:item.label,scope:item.scope})),familyNodes:detail.querySelectorAll('.v1278-family-frequency').length,singleMeaning:detail.querySelectorAll('[data-v1278-single-meaning]').length,sourceChips:detail.querySelectorAll('.v1278-provenance-chip').length};
  }};
})();
