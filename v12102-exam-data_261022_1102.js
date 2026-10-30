/* Supplied exam examples only: no invented corpus frequencies or topic inference. */
(() => {
  'use strict';
  const BOOK = 'test-single-book';
  const text = value => String(value ?? '').trim();
  const clean = value => ['—', '-', ''].includes(text(value)) ? '' : text(value);
  const norm = value => text(value).normalize('NFC').replace(/[{}]|\*\*/g, '').replace(/’/g, "'").replace(/\s+/g, ' ');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const source = () => window.V1227_GAOKAO_DATA || { records:[], retainedSenseMappings:[] };
  const wordKeys = word => new Set((word?.v1225MergedHeads?.length ? word.v1225MergedHeads : [word?.head || word?.word]).map(text).filter(Boolean));
  function exactRetainedMapping(row, keys) {
    const filename = text(row.source?.file).split(/[\\/]/).pop();
    return source().retainedSenseMappings.find(mapping => keys.has(mapping.head) &&
      mapping.sourceWorkbookRow === Number(row.sourceWorkbookRow || row.source?.row) &&
      mapping.sourceSheet === row.source?.sheet && mapping.sourceFilename === filename &&
      norm(mapping.rawSourceEnglish) === norm(row.rawSourceEnglish || row.english || row.sentence));
  }
  const questionTypes = Object.freeze(['听力','阅读','七选五','完形填空','语法填空','应用文','读后续写']);
  function questionType(value) {
    const label = clean(value);
    if (/七选五/.test(label)) return '七选五';
    if (/读后续写|续写/.test(label)) return '读后续写';
    if (/完形/.test(label)) return '完形填空';
    if (/语法填空|语填/.test(label)) return '语法填空';
    if (/听力/.test(label)) return '听力';
    if (/应用文/.test(label)) return '应用文';
    if (/阅读/.test(label)) return '阅读';
    return label || '未标注';
  }
  function sourceRows(word, item = {}, retained = []) {
    const keys = wordKeys(word);
    const inScope = item?.bookKey === BOOK || item?.realOnly === true;
    if (!inScope) return retained;
    const added = source().records.filter(row => keys.has(row.head));
    const simulated = (word?.demoExamExamples || []).filter(row => keys.has(text(row.head)) && row.mock === true && clean(row.sentence || row.english));
    const previous = (Array.isArray(retained) ? retained : []).filter(row => row?.isDemonstration !== true && row?.simulated !== true && (!text(row.head) || keys.has(text(row.head))) && clean(row.sentence || row.english)).map((row, index) => {
      const mapped = exactRetainedMapping(row, keys);
      return { ...row, ...(mapped && !clean(row.meaning) && !clean(row.senseKey) ? {
        head:mapped.head, senseKey:mapped.senseKey, meaning:mapped.meaning,
        partOfSpeech:mapped.senseKey === 'latest-sense:hit:71' ? 'n' : 'v',
        mappingSource:mapped.source
      } : {}), exampleKey:row.exampleKey || `retained-exam:${[...keys].join('+')}:${row.sourceWorkbookRow || index + 1}` };
    });
    const seen = new Set();
    return [...added, ...previous].filter(row => {
      if(row.mock === true || row.isDemonstration === true || row.simulated === true)return false;
      const key = [norm(row.sentence || row.english), clean(row.year), norm(row.paper || row.sourceName)].join('|');
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).map(row => {
      const filename=text(row.source?.file).split(/[\\/]/).pop(),sourceRow=Number(row.sourceWorkbookRow||row.source?.row);
      const translated=keys.has('hit')&&filename==='Demo数据.xlsx'&&row.source?.sheet==='高考出现次数'
        ? window.V12102HitTranslations?.records.find(entry=>entry.sourceRow===sourceRow&&norm(entry.rawEnglish)===norm(row.rawSourceEnglish||row.english||row.sentence)):null;
      if(translated){
        const value={...row,translation:translated.translation,translationSource:{kind:'user-authorized-translation',file:filename,sheet:row.source.sheet,row:sourceRow},partOfSpeech:'',meaning:'',senseKey:'',topic:'',questionType:'',sourceQuestionType:''};
        delete value.mappingSource;return value;
      }
      return {...row,sourceQuestionType:row.sourceQuestionType||row.questionType,questionType:questionType(row.questionType)};
    });
  }
  function orderedEntries(entries) {
    return (entries || []).map((entry,index)=>({entry,index})).sort((a,b)=>b.entry.count-a.entry.count||a.index-b.index).map(item=>item.entry);
  }
  function grouped(rows, field) {
    const map = new Map();
    rows.forEach(row => {
      const label = clean(row[field]) || '未标注';
      if (!map.has(label)) map.set(label, { label, count:0, recordKeys:[], missing:label === '未标注' });
      const entry = map.get(label); entry.count++; entry.recordKeys.push(row.exampleKey || '');
    });
    return orderedEntries([...map.values()].map(entry => ({ ...entry, fraction:rows.length ? entry.count / rows.length : 0, percent:rows.length ? entry.count * 100 / rows.length : 0 })));
  }
  function getDistribution(word, item = {}, retained = []) {
    const records = sourceRows(word,item,retained);
    return { denominator:records.length, wordKeys:[...wordKeys(word)], records,
      dimensions:[
        { key:'meaning', title:'不同释义', entries:grouped(records,'meaning') },
        { key:'questionType', title:'不同题型', entries:grouped(records,'questionType') },
        { key:'topic', title:'不同话题', entries:grouped(records,'topic') }
      ], policy:'按当前词已收录例句逐条计数；模拟例句不参与高考收录统计，未标注字段含在分母中。' };
  }
  function percent(value) { return Number(value.toFixed(1)).toString() + '%'; }
  const canChart = entries => Array.isArray(entries) && entries.some(entry => !entry.missing && entry.count > 0);
  // Keep the existing top start angle; descending categories proceed counterclockwise.
  const clockwise = false;
  const angleDirection = clockwise ? 1 : -1;
  // Layout coordinates are real CSS pixels, so direct labels keep the current body size.
  function wrapLabel(value, width, measure) {
    const lines = [];
    String(value).split(/\n/).forEach(paragraph => {
      let line = '';
      Array.from(paragraph).forEach(char => {
        if (line && measure(line + char) > width) { lines.push(line.trim()); line = char.trimStart(); }
        else line += char;
      });
      if (line.trim()) lines.push(line.trim());
    });
    return lines.length ? lines : [''];
  }
  function layoutPieLabels(entries, width, fontSize, measureText) {
    const measure = measureText || (value => Array.from(value).reduce((sum,char) => sum + (/[\u2e80-\uffff]/.test(char) ? 1 : .62) * fontSize,0));
    const inset = Math.max(6,fontSize * .35), gap = Math.min(fontSize * .7,width * .08);
    const radius = Math.max(14,Math.min(width * .17,fontSize * 5,width / 2-inset-fontSize*1.1-gap*1.7));
    const cx = width / 2, labelEdge = radius + gap * 1.7;
    const labelWidth = Math.max(fontSize,width / 2 - labelEdge - inset);
    const lineHeight = fontSize * 1.3;
    let start = -Math.PI / 2;
    const labels = entries.map((entry,index) => {
      const mid = start + angleDirection * entry.fraction * Math.PI;
      const item = { ...entry,index,start,mid,side:Math.cos(mid) < 0 ? -1 : 1,
        nameLines:wrapLabel(entry.label,labelWidth,measure),
        valueLines:wrapLabel(`${entry.count}次 · ${percent(entry.percent)}`,labelWidth,measure) };
      item.height = (item.nameLines.length + item.valueLines.length) * lineHeight;
      start += angleDirection * entry.fraction * Math.PI * 2;
      return item;
    });
    const sides = [-1,1].map(side => labels.filter(label=>label.side === side).sort((a,b)=>Math.sin(a.mid)-Math.sin(b.mid)));
    const verticalGap = fontSize * .5;
    const required = Math.max(...sides.map(side=>side.reduce((height,label)=>height+label.height,0)+Math.max(0,side.length-1)*verticalGap));
    const height = Math.ceil(Math.max(radius*2,required)+inset*2), cy = height / 2;
    sides.forEach(side => {
      let bottom = inset - verticalGap;
      side.forEach(label => {
        label.y = Math.max(bottom+verticalGap,cy+Math.sin(label.mid)*radius-label.height/2);
        bottom = label.y + label.height;
      });
      let top = height-inset+verticalGap;
      [...side].reverse().forEach(label=>{label.y=Math.min(label.y,top-verticalGap-label.height);top=label.y;});
      side.forEach((label,index)=>{
        label.x = cx + label.side*labelEdge;
        label.width = Math.max(...[...label.nameLines,...label.valueLines].map(measure));
        label.anchor = label.side < 0 ? 'end' : 'start';
        const outer = [cx+Math.cos(label.mid)*radius,cy+Math.sin(label.mid)*radius];
        const kneeX = cx+label.side*(radius+gap*(.45+.35*(index+1)/(side.length+1)));
        const endX = label.x-label.side*fontSize*.16, middleY=label.y+label.height/2;
        label.leader = [outer,[kneeX,outer[1]],[kneeX,middleY],[endX,middleY]];
      });
    });
    return {width,height,fontSize,lineHeight,radius,cx,cy,labels,clockwise};
  }
  function compactPieModel(entries,width,fontSize) {
    let start=-Math.PI/2;
    const labels=entries.map((entry,index)=>{const row={...entry,index,start};start+=angleDirection*entry.fraction*Math.PI*2;return row;});
    return {width,height:width,cx:width/2,cy:width/2,radius:Math.max(14,width/2-4),fontSize,lineHeight:fontSize*1.3,labels,clockwise,compact:true};
  }
  function chartMarkup(model) {
    const {cx,cy,radius,lineHeight,fontSize}=model;
    const shapes=model.labels.map(entry=>{
      const attrs=`data-v1227-pie-index="${entry.index}" tabindex="0" role="button" aria-pressed="false" aria-label="${esc(entry.label)}，${entry.count}次，占${percent(entry.percent)}" class="v1227-pie-slice${entry.missing?' is-missing':''}" style="--v1227-slice-color:var(--v1227-chart-color-${entry.index%10})"`;
      const title=`<title>${esc(entry.label)}：${entry.count}次（${percent(entry.percent)}）</title>`;
      if(entry.fraction===1)return `<circle cx="${cx}" cy="${cy}" r="${radius}" ${attrs}>${title}</circle>`;
      const a=[cx+radius*Math.cos(entry.start),cy+radius*Math.sin(entry.start)];
      const end=entry.start+angleDirection*entry.fraction*Math.PI*2,b=[cx+radius*Math.cos(end),cy+radius*Math.sin(end)];
      return `<path d="M ${cx} ${cy} L ${a.join(' ')} A ${radius} ${radius} 0 ${entry.fraction>.5?1:0} ${clockwise?1:0} ${b.join(' ')} Z" ${attrs}>${title}</path>`;
    }).join('');
    if(model.compact)return shapes;
    const annotations=model.labels.map(entry=>{
      const lines=[...entry.nameLines.map(value=>({value,kind:'name'})),...entry.valueLines.map(value=>({value,kind:'value'}))];
      return `<g class="v1229-pie-annotation${entry.missing?' is-missing':''}" data-v1227-pie-index="${entry.index}" aria-hidden="true"><polyline class="v1229-pie-leader" points="${entry.leader.map(point=>point.join(',')).join(' ')}"/><text text-anchor="${entry.anchor}" x="${entry.x}" y="${entry.y+fontSize*.95}" class="v1229-pie-direct-label">${lines.map((line,index)=>`<tspan x="${entry.x}" dy="${index?lineHeight:0}" class="v1229-pie-label-${line.kind}">${esc(line.value)}</tspan>`).join('')}</text></g>`;
    }).join('');
    return shapes+annotations;
  }
  function renderChart(dimension, denominator) {
    if (!denominator || !canChart(dimension.entries)) return '';
    const entries=orderedEntries(dimension.entries).map(({label,count,fraction,percent,missing})=>({label,count,fraction,percent,missing}));
    const model=dimension.compact?compactPieModel(entries,280,24):layoutPieLabels(entries,640,24),accessibleTitle=esc(dimension.accessibleTitle||dimension.title);
    const summary=entries.map(entry=>`${entry.label}，${entry.count}次，占${percent(entry.percent)}`).join('；');
    const svg=`<svg viewBox="0 0 ${model.width} ${model.height}" class="v1227-pie" role="group" aria-label="${accessibleTitle}占比，共${denominator}条例句" data-v1231-pie-direction="counterclockwise"${dimension.compact?' data-v1265-compact-pie="true"':''} data-v1229-pie-entries="${esc(JSON.stringify(entries))}">${chartMarkup(model)}</svg>`;
    const legend=dimension.compact?`<div class="v1265-pie-legend" role="group" aria-label="${accessibleTitle}分类">${entries.map((entry,index)=>`<button type="button" class="v1265-pie-legend-item${entry.missing?' is-missing':''}" data-v1227-pie-index="${index}" aria-pressed="false" aria-label="${esc(entry.label)}，${entry.count}次，占${percent(entry.percent)}" style="--v1227-slice-color:var(--v1227-chart-color-${index%10})"><span class="v1265-pie-key" aria-hidden="true"></span><span class="v1265-pie-name">${esc(entry.label)}</span><span class="v1265-pie-numbers"><span>${entry.count}次</span><span>${percent(entry.percent)}</span></span></button>`).join('')}</div>`:'';
    return `<section class="v1227-pie-card" data-v1227-pie="${esc(dimension.key)}"><h4>${esc(dimension.title)}</h4>${dimension.compact?`<div class="v1265-pie-with-legend">${svg}${legend}</div>`:svg}<p class="v1229-chart-accessible-summary">${esc(summary)}</p><p class="v1227-pie-selection" aria-live="polite"></p></section>`;
  }
  function renderBars(dimension, denominator) {
    dimension={...dimension,entries:orderedEntries(dimension.entries)};
    if (!denominator || !canChart(dimension.entries)) return '';
    const max=Math.max(1,...dimension.entries.map(entry=>entry.count));
    return `<section class="v1227-stat-bar-card"><h5>次数</h5><div class="v1227-stat-bars" role="group" aria-label="${esc(dimension.title)}次数，${denominator}条例句">${dimension.entries.map((entry,index)=>`<div role="button" tabindex="0" aria-pressed="false" aria-label="${esc(entry.label)}，${entry.count}次，占${percent(entry.count/denominator*100)}" class="v1227-stat-bar-row${entry.missing?' is-missing':''}" data-v1227-chart-index="${index}" data-stat-label="${esc(entry.label)}" data-stat-count="${entry.count}" style="--v1227-slice-color:var(--v1227-chart-color-${index%10})"><span class="v1227-stat-bar-label">${esc(entry.label)}</span><span class="v1227-stat-bar-track" aria-hidden="true"><span class="v1227-stat-bar-fill" style="width:${entry.count/max*100}%"></span></span><span class="v1227-stat-bar-value">${entry.count}次</span></div>`).join('')}</div></section>`;
  }
  function renderPair(dimension, denominator) {
    dimension={...dimension,entries:orderedEntries(dimension.entries)};
    if (!denominator || !canChart(dimension.entries)) return '';
    return `<section class="v1228-chart-group" data-v1228-chart-group="${esc(dimension.key)}" data-stat-denominator="${denominator}" data-stat-field="${esc(dimension.key)}"><header class="v1228-chart-heading"><h4>${esc(dimension.title)}</h4><span class="v1228-chart-source-count">已收录 ${denominator} 条例句</span></header><div class="v1227-stat-chart-pair">${renderBars(dimension,denominator)}${renderChart({...dimension,accessibleTitle:dimension.title,title:'占比'},denominator)}</div></section>`;
  }
  function renderCharts(word, item = {}, retained = []) {
    const result = getDistribution(word,item,retained);
    const dimensions=result.dimensions.filter(dimension=>canChart(dimension.entries));
    if (!result.denominator || !dimensions.length) return '';
    return `<div class="v1227-exam-distribution v1228-flat-exam-distribution" data-exam-denominator="${result.denominator}">${dimensions.map(dimension => renderPair(dimension,result.denominator)).join('')}</div>`;
  }
  function selectionOwner(target) {
    return target.closest('.v1228-chart-group') || target.closest('[data-v1227-pie]');
  }
  function setSelection(owner,index) {
    if(!owner)return;
    const slice=index===null?null:owner.querySelector(`.v1227-pie-slice[data-v1227-pie-index="${index}"],.v1227-stat-bar-row[data-v1227-chart-index="${index}"]`);
    const selected=slice?String(index):null;
    if(selected===null)delete owner.dataset.v1231SelectedCategory;
    else owner.dataset.v1231SelectedCategory=selected;
    owner.querySelectorAll('[data-v1227-pie-index],[data-v1227-chart-index]').forEach(node=>{
      const key=node.dataset.v1227ChartIndex ?? node.dataset.v1227PieIndex;
      const active=selected!==null&&key===selected;
      if(node.classList.contains('v1227-pie-slice')||node.classList.contains('v1227-stat-bar-row')||node.classList.contains('v1265-pie-legend-item'))node.setAttribute('aria-pressed',String(active));
      node.classList.toggle('is-selected',active);
    });
    const output=owner.querySelector('.v1227-pie-selection');
    if(output)output.textContent=selected===null?'':'已选择：'+slice.getAttribute('aria-label');
  }
  function select(target) {
    const owner=selectionOwner(target);if(!owner)return;
    const index=target.dataset.v1227ChartIndex ?? target.dataset.v1227PieIndex;
    setSelection(owner,owner.dataset.v1231SelectedCategory===index?null:index);
  }
  const layoutSignatures=new WeakMap(), observedCards=new Set(), boundOwners=new WeakSet(), boundRoots=new WeakSet();
  let canvas, frame=0;
  function layoutCharts(root=document) {
    const svgs=[...(root.matches?.('.v1227-pie')?[root]:[]),...root.querySelectorAll('.v1227-pie')];
    svgs.forEach(svg=>{
      if(!svg.isConnected||!svg.getClientRects().length||svg.closest('[hidden],.hidden'))return;
      const width=Math.round(svg.getBoundingClientRect().width*2)/2,style=getComputedStyle(svg),fontSize=parseFloat(style.fontSize);
      if(width<50||!fontSize)return;
      const signature=[width,style.fontSize,style.fontFamily,style.fontWeight,style.fontStyle,svg.dataset.v1229PieEntries].join('|');
      if(layoutSignatures.get(svg)===signature)return;
      canvas ||= document.createElement('canvas');
      const context=canvas.getContext('2d');context.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const entries=JSON.parse(svg.dataset.v1229PieEntries||'[]'),model=svg.dataset.v1265CompactPie?compactPieModel(entries,width,fontSize):layoutPieLabels(entries,width,fontSize,value=>context.measureText(value).width);
      const owner=selectionOwner(svg),selected=owner?.dataset.v1231SelectedCategory ?? svg.querySelector('.v1227-pie-slice[aria-pressed="true"]')?.dataset.v1227PieIndex;
      svg.setAttribute('viewBox',`0 0 ${model.width} ${model.height}`);svg.setAttribute('height',String(model.height));
      svg.innerHTML=chartMarkup(model);layoutSignatures.set(svg,signature);
      if(selected!==undefined)setSelection(owner,selected);
      svg.dataset.v1229LayoutWidth=String(width);svg.dataset.v1229LayoutFont=String(fontSize);
    });
  }
  function scheduleLayout() {
    if(frame)return;
    frame=requestAnimationFrame(()=>{
      frame=0;
      observedCards.forEach(card=>{if(!card.isConnected)observedCards.delete(card);});
      const owner=document.getElementById('wordDetailDialog');if(owner?.isConnected)layoutCharts(owner);
    });
  }
  function observeCharts(root) {
    const owner=root.closest?.('#wordDetailDialog')||(root.id==='wordDetailDialog'?root:null);
    if(!owner)return;
    if(!boundOwners.has(owner)){
      boundOwners.add(owner);
      // Only this detail dialog is observed; geometry writes are signature-guarded.
      const observer=new MutationObserver(scheduleLayout);
      observer.observe(owner,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','style']});
      let ancestor=owner.parentElement;
      while(ancestor){observer.observe(ancestor,{attributes:true,attributeFilter:['class','style','hidden']});ancestor=ancestor.parentElement;}
    }
    owner.querySelectorAll('.v1227-pie-card').forEach(card=>{
      observedCards.add(card);
    });
    scheduleLayout();
  }
  function bindCharts(root = document) {
    if(!root?.addEventListener)return;
    observeCharts(root);
    if(boundRoots.has(root))return;
    boundRoots.add(root);
    root.addEventListener('click',event=>{
      if(event.v1227PieHandled)return;
      const target=event.target.closest?.('[data-v1227-pie-index],[data-v1227-chart-index]');
      if(target){event.v1227PieHandled=true;select(target);return;}
      const pair=event.target.closest?.('.v1227-stat-chart-pair,.vside-single-chart-body');
      if(pair){event.v1227PieHandled=true;setSelection(selectionOwner(pair),null);}
    });
    root.addEventListener('keydown',event=>{
      if(event.v1227PieHandled)return;
      const target=event.target.closest?.('.v1227-pie-slice,.v1227-stat-bar-row,.v1265-pie-legend-item');
      if(target&&['Enter',' '].includes(event.key)){event.preventDefault();event.v1227PieHandled=true;select(target);}
    });
  }
  window.addEventListener('resize',scheduleLayout);
  document.fonts?.addEventListener?.('loadingdone',()=>{observedCards.forEach(card=>card.querySelectorAll('.v1227-pie').forEach(svg=>layoutSignatures.delete(svg)));scheduleLayout();});
  bindCharts();
  window.V1227ExamDistribution={sourceRows,getDistribution,renderCharts,bindCharts,layoutCharts,layoutPieLabels,orderedEntries,grouped,renderChart,renderBars,renderPair,canChart,questionType,questionTypes};
})();
