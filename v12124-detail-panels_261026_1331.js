/* V1.2.79: source-preserving exam/textbook detail panels. The final finish
 * wrapper calls mount(); this module does not patch navigation or full screen. */
(() => {
  'use strict';
  const mounted = new WeakMap();
  const TYPE_ORDER = Object.freeze(['听力','阅读','七选五','完形填空','语法填空','应用文','读后续写']);
  // A local placeholder for the future user's textbook setting. Source labels
  // remain unchanged; 人教 is the family represented by 新人教 in this batch.
  const CURRENT_TEXTBOOK_EDITION = '新人教';
  const text = value => String(value ?? '').trim();
  const clean = value => ['', '-', '—'].includes(text(value)) ? '' : text(value);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const first = (row, names) => names.map(name => clean(row?.[name])).find(Boolean) || '';
  const make = (tag, className, value) => { const node = document.createElement(tag); node.className = className; if (value !== undefined) node.textContent = value; return node; };
  const isMock = row => row?.mock === true || row?.isDemonstration === true || row?.simulated === true;
  function posFamily(value) {
    const match = clean(value).toLowerCase().match(/^(adj|adv|prep|pron|conj|num|interj|det|n|vt|vi|v)(?=[.\s\[（(]|$)/);
    return match ? (/^v[ti]$/.test(match[1]) ? 'v' : match[1]) : clean(value).toLowerCase();
  }
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
  function rowsFor(result, kind) {
    const api = window.V1220WordDetail, options = result?.options || {};
    const rows = kind === 'cases'
      ? api?.cases?.({wordId:options.context?.word?.id,item:options.item,retained:options.retainedCases || []}) || []
      : result?.word?.textbookExamples || [];
    const seen = new Map();
    return (Array.isArray(rows) ? rows : []).filter(row => clean(row?.sentence ?? row?.english ?? row?.example)).map((row,index) => {
      const sourceId = first(row,['exampleKey','recordKey','id','exampleId','__victor_record_id']);
      const base = sourceId || JSON.stringify([row.head,row.source?.file,row.source?.sheet,row.source?.row,row.sentence ?? row.english ?? row.example,row.year,row.paper || row.sourceName]);
      const occurrence = (seen.get(base) || 0) + 1; seen.set(base,occurrence);
      return {row,index,sourceId,key:base + '::' + occurrence,type:questionType(row.questionType),pos:posFamily(row.partOfSpeech),meaning:clean(row.meaning),edition:first(row,['edition','textbookVersion','version'])};
    });
  }
  function isCurrentEdition(value) {
    const label = clean(value).replace(/\s+/g,'').replace(/版$/,'');
    return label === CURRENT_TEXTBOOK_EDITION || label === '人教';
  }
  const POS_LABELS = Object.freeze({n:'n.',adj:'adj.',v:'v.',adv:'adv.',prep:'prep.',pron:'pron.',conj:'conj.',num:'num.',interj:'interj.',det:'det.'});
  const STAT_COLORS = Object.freeze(['#3269f5','#6c9aff','#a3c3ff','#36adf2','#76d0ef','#7893ff','#bdccff','#73baff','#c3e5ff','#95aaff']);
  const posLabel = value => POS_LABELS[value] || value || '未标注';
  function statisticGroups(records, mode, pos = 'all') {
    const rows = mode === 'meaning' && pos !== 'all' ? records.filter(record => record.pos === pos) : records;
    const groups = new Map();
    rows.forEach(record => {
      const key = mode === 'pos' ? record.pos : JSON.stringify([record.pos,record.meaning]);
      if (!groups.has(key)) groups.set(key,{key,label:mode === 'pos' ? posLabel(record.pos) : record.meaning || '未标注',pos:record.pos,count:0,records:[],missing:mode === 'pos' ? !record.pos : !record.meaning});
      const group = groups.get(key); group.count++; group.records.push(record);
    });
    return {records:rows,groups:[...groups.values()].sort((a,b) => b.count - a.count)};
  }
  function donutPath(start, end) {
    const point = (radius,angle) => [160 + radius * Math.cos(angle),160 + radius * Math.sin(angle)].map(value => value.toFixed(3)).join(' ');
    if (end - start >= Math.PI * 2 - .00001) return 'M 160 34 A 126 126 0 1 1 160 286 A 126 126 0 1 1 160 34 L 160 78 A 82 82 0 1 0 160 242 A 82 82 0 1 0 160 78 Z';
    const large = end - start > Math.PI ? 1 : 0;
    return 'M ' + point(126,start) + ' A 126 126 0 ' + large + ' 1 ' + point(126,end) + ' L ' + point(82,end) + ' A 82 82 0 ' + large + ' 0 ' + point(82,start) + ' Z';
  }
  function chartPOSOptions(records) {
    const present = [...new Set(records.map(record => record.pos).filter(Boolean))];
    return [['all','全部'],...[...new Set(['n','adj','v',...present])].filter(value => present.includes(value)).map(value => [value,POS_LABELS[value] || clean(records.find(record => record.pos === value)?.row.partOfSpeech) || value])];
  }
  function provenance(row, kind, native) {
    const paper = first(row,['paper','examPaper','sourceName']);
    const values = kind === 'cases'
      ? [first(row,['year','examYear']),paper,clean(row.textNo),first(row,['section','sourceSection']),clean(row.sourceQuestionType || row.questionType)]
      : [first(row,['edition','textbookVersion','version']),first(row,['bookTitle','bookName']),first(row,['bookVolume','volume']),first(row,['unit','unitName']),first(row,['section','sourceSection']),clean(row.textNo)];
    native.querySelectorAll('[data-word-tag-field]').forEach(node => {
      const field = node.dataset.wordTagField || '';
      // Prefer the source row's paper/name field over legacy duplicate labels.
      // The original source-section/text number is retained even when supplied
      // only by the existing renderer, rather than the normalized model.
      if (paper && /^(?:source-)?(?:paper|name|source-name|sourceName)$/.test(field)) return;
      if (field === 'source') { if (!values.some(Boolean)) values.push(...clean(node.textContent).split(/\s*[·•]\s*/)); return; }
      if (/^(?:source-|year|paper|edition|version|book|unit|section|textNo)/.test(field)) values.push(clean(node.textContent));
    });
    const citation = native.querySelector('[data-v1224-citation]');
    const unique = [], seen = new Set(), suppliedType = clean(row.sourceQuestionType || row.questionType), canonicalType = questionType(suppliedType);
    values.filter(Boolean).filter(value => !/^(未标注|unclassified)$/.test(clean(value))).forEach(value => {
      const raw = clean(value), year = raw.match(/^((?:19|20)\d{2})\s*年?$/);
      const sameType = kind === 'cases' && TYPE_ORDER.includes(canonicalType) && (raw === suppliedType || raw === canonicalType);
      const key = year ? 'year:' + year[1] : sameType ? 'type:' + canonicalType : raw.replace(/\s+/g,'');
      if (seen.has(key)) return;
      seen.add(key); unique.push(year ? year[1] + '年' : raw);
    });
    if (!unique.length && clean(citation?.textContent)) unique.push(clean(citation.textContent));
    const source = row.source || {}, location = [source.file,source.sheet,source.row ? '第' + source.row + '行' : ''].filter(Boolean).join(' · ');
    return {label:unique.join(' · '),title:[clean(citation?.title),location].filter(Boolean).join('\n')};
  }
  function exampleNode(record, kind, index) {
    const row = record.row, wrapper = make('article','v1278-example');
    wrapper.dataset.v1278RecordKey = record.key;
    wrapper.dataset.v1278SourceId = record.sourceId;
    wrapper.dataset.v1278Meaning = record.meaning;
    wrapper.dataset.v1278Pos = record.pos;
    wrapper.tabIndex = -1;
    const number = make('span','v1278-example-number',String(index + 1).padStart(2,'0'));
    number.setAttribute('aria-hidden','true'); wrapper.append(number);
    const copy = make('div','v1278-example-copy'), template = document.createElement('template');
    template.innerHTML = window.V1222SenseExamples.renderExample(row,kind === 'cases' ? 'listening' : 'textbook','data-latest-example="' + esc(record.sourceId) + '"');
    let native = template.content.firstElementChild;
    if (!native) {
      native = make('div','v1278-native-example');
      native.append(make('p','v1223-example-copy',row.sentence || row.english || row.example));
      if (clean(row.translation || row.chinese)) native.append(make('p','v1222-sense-example-translation',row.translation || row.chinese));
    }
    native.classList.add('v1278-native-example'); native.dataset.latestExample = record.sourceId;
    native.dataset.v1271Sources = 'true';
    const source = provenance(row,kind,native);
    // Only presentation metadata is replaced. The supplied English/translation,
    // rich runs, target-word highlighting and audio markup keep their renderer.
    native.querySelectorAll('.v1223-example-kind,.v1229-example-labels,.v1225-example-topic-line,[data-v1224-citation],.v1224-source-anchor,[data-exam-sense],.v1270-example-meaning').forEach(node => node.remove());
    const metadata = make('div','v1278-example-metadata');
    if (record.meaning) {
      const meaningPOS = POS_LABELS[record.pos] || '';
      const hasMeaningPOS = /^(?:adj|adv|prep|pron|conj|num|interj|det|vt|vi|n|v)\.(?=\s|[\u3400-\u9fff])/i.test(record.meaning);
      const meaningLabel = meaningPOS && !hasMeaningPOS ? meaningPOS + ' ' + record.meaning : record.meaning;
      const sense = make('span','v1227-word-tag v1278-meaning-chip',meaningLabel);
      sense.dataset.wordTagField = 'usage'; sense.dataset.wordTag = kind === 'cases' ? 'exam-meaning' : 'textbook-meaning';
      if (clean(row.partOfSpeech)) sense.title = clean(row.partOfSpeech);
      metadata.append(sense);
    }
    if (source.label) {
      const chip = make('span','v1278-provenance-chip',source.label);
      chip.dataset.wordTagField = 'source'; chip.title = source.title || source.label; metadata.append(chip);
    }
    if (clean(row.topic)) {
      const chip = make('span','v1278-topic-chip',row.topic);
      chip.dataset.wordTagField = 'topic'; metadata.append(chip);
    }
    if (isMock(row)) {
      const chip = make('span','v1278-mock-chip','模拟例句');
      chip.title = '原有例句中的模拟数据标识'; metadata.append(chip);
    }
    native.querySelectorAll('[data-v1238-exam-star]').forEach(star=>number.prepend(star));
    native.append(metadata); copy.append(native); wrapper.append(copy); return wrapper;
  }
  function replaceExamples(view, records) {
    view.visible = records; view.nodes = new Map();
    const fragment = document.createDocumentFragment();
    records.forEach((record,index) => {
      const node=exampleNode(record,view.kind,index);view.nodes.set(record.key,node);fragment.append(node);
    });
    if (!records.length) fragment.append(make('p','v1278-empty',view.kind === 'cases' ? '当前题型暂无例句' : '当前版本暂无已收录例句'));
    view.list.replaceChildren(fragment);
    view.summary.textContent = '当前结果 ' + records.length + ' / ' + view.records.length + ' 条';
    view.host.dataset.v1278VisibleCount = String(records.length);
    window.V1222SenseExamples?.layoutCitations?.(view.host);
  }
  function arrowButtons(group, attribute) {
    group.addEventListener('keydown',event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      const buttons = [...group.querySelectorAll('button[' + attribute + ']')].filter(button => !button.hidden && !button.disabled), index = buttons.indexOf(event.target);
      if (index < 0 || !buttons.length) return;
      event.preventDefault(); event.stopPropagation();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].click(); buttons[next].focus({preventScroll:true});
    });
  }
  function detailForView(view){return view.host.closest('#wordDetailDialog');}
  function buildExam(view) {
    const layout=make('div','v1278-exam-layout'),left=make('section','v1278-exam-examples v1281-exam-scroll-column'),right=make('aside','v1278-meanings-chart');
    left.setAttribute('aria-label','按年份从新到旧排列的高考例句');right.setAttribute('aria-label','高考词性与释义统计');
    view.host.classList.add('v1281-exam-lesson','v1288-exam');
    const head=make('div','v1278-panel-heading');view.summary=make('span','v1278-result-count');view.summary.setAttribute('role','status');
    const selector=make('div','v1278-type-selector'),all=make('button','v1296-exam-type','全部'),reset=make('button','v1288-clear-filters','清除筛选');all.type=reset.type='button';all.dataset.v1288AllTypes='';all.dataset.v1278Type='';reset.dataset.v1288ClearFilters='';
    const strip=make('div','book-unit-options v1220-secondary-tabs v1296-exam-tabs');strip.setAttribute('role','tablist');strip.setAttribute('aria-label','高考精讲题型');strip.dataset.v1220SubnavFor='cases';all.setAttribute('role','tab');strip.append(all);
    const emphasis=['#4F7DDC','#269C82','#8561C4','#B68B2A','#3A95AF','#6884B6','#B45E82'];
    const colors=['#B7CEFF','#A6E1D2','#CDBAF4','#F4D494','#B4E2F0','#B9C8E8','#F0BFD2'];
    TYPE_ORDER.forEach((type,index)=>{const count=view.records.filter(r=>r.type===type).length,b=make('button','v1296-exam-type');b.setAttribute('role','tab');b.type='button';b.dataset.v1278Type=type;b.style.setProperty('--v1288-type-color',colors[index]);b.style.setProperty('--v1289-type-emphasis',emphasis[index]);b.style.flexGrow=String(count);b.style.flexBasis='0px';b.hidden=!count;b.disabled=!count;b.setAttribute('aria-pressed','false');b.setAttribute('aria-label',type+'，'+count+'条');b.textContent=type+' ('+count+')';strip.append(b);});detailForView(view).querySelector('.vwn-secondary-tools').append(strip);const syncTabs=()=>{const active=view.button.getAttribute('aria-selected')==='true'&&view.records.some(record=>TYPE_ORDER.includes(record.type));if(strip.hidden===active)strip.hidden=!active;};const tabObserver=new MutationObserver(syncTabs);tabObserver.observe(view.button,{attributes:true,attributeFilter:['aria-selected']});syncTabs();
    const chips=view.summary;chips.classList.add('v1289-filter-summary');chips.setAttribute('aria-label','当前筛选条件');
    view.list=make('div','v1278-example-list');view.list.tabIndex=0;view.list.setAttribute('role','region');view.list.setAttribute('aria-label','按年份从新到旧排列的高考例句，可独立滚动');left.append(view.list);
    const chartHead=make('div','v1278-panel-heading v1279-statistics-heading');chartHead.append(make('h3','','词频统计'));
    const mode=make('div','v1270-sort-segments v1279-statistics-switch');mode.setAttribute('role','group');mode.setAttribute('aria-label','统计维度');[['pos','词性'],['meaning','释义']].forEach(([value,label])=>{const b=make('button','',label);b.type='button';b.dataset.v1279ChartMode=value;mode.append(b);});chartHead.append(mode);right.append(chartHead);
    const countLine=make('div','v1288-stat-summary');view.chartSummary=make('span','v1278-chart-count');countLine.append(view.chartSummary,reset);right.append(countLine);
    view.chart=make('div','v1279-statistics-chart');right.append(view.chart);view.notice=make('p','v1278-location-status');view.notice.setAttribute('role','status');view.notice.setAttribute('aria-live','polite');right.append(view.notice);view.policy=make('p','v1278-chart-policy');right.append(view.policy);layout.append(left,right);view.host.append(layout);
    view.type='';view.pos='all';view.chartMode='meaning';view.selectedGroup='';view.meaningFilter=null;view.posFilter='';view.chartRecords=view.records.filter(r=>!isMock(r.row));
    const yearMonth=record=>{const row=record.row,s=[row.year,row.examYear,row.paper,row.sourceName].filter(Boolean).join(' ');return [Number(s.match(/(?:19|20)\d{2}/)?.[0]||0),Number(s.match(/(\d{1,2})\s*月/)?.[1]||0)];};
    const sourceScope=()=>view.type?view.records.filter(r=>r.type===view.type):view.records;
    function showExamples(){
      const records=sourceScope().filter(r=>(!view.posFilter||r.pos===view.posFilter)&&(!view.meaningFilter||JSON.stringify([r.pos,r.meaning])===view.meaningFilter.key)).sort((a,b)=>{const x=yearMonth(a),y=yearMonth(b);return y[0]-x[0]||y[1]-x[1]||a.index-b.index;});
      replaceExamples(view,records);view.list.scrollTop=0;view.host.dataset.v1278Type=view.type||'all';view.host.dataset.v1288Pos=view.posFilter;view.host.dataset.v1288Meaning=view.meaningFilter?.key||'';view.pos=view.posFilter||'all';
      all.setAttribute('aria-pressed',String(!view.type));strip.querySelectorAll('button').forEach(b=>{const active=b.dataset.v1278Type===view.type;b.setAttribute('aria-pressed',String(active));b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});selector.toggleAttribute('data-v1278-type-active',!!view.type);
      const conditions=[view.type?'题型：'+view.type:'全部题型'];
      if(view.posFilter)conditions.push('词性：'+posLabel(view.posFilter));
      if(view.meaningFilter)conditions.push('释义：'+view.meaningFilter.label);
      chips.textContent='当前筛选：'+conditions.join(' · ')+' · '+records.length+' / '+view.records.length+' 条';
      const hasFilters=!!(view.type||view.posFilter||view.meaningFilter);
      reset.hidden=!hasFilters;reset.disabled=!hasFilters;view.notice.hidden=true;
      if(!records.length){const empty=view.list.querySelector('.v1278-empty');if(empty)empty.textContent='当前组合条件暂无例句，可取消筛选或清除全部筛选。';}
    }
    function showChart(){
      const meaningMode=view.chartMode==='meaning',scope=(view.type?view.chartRecords.filter(r=>r.type===view.type):view.chartRecords).filter(r=>!meaningMode||!view.posFilter||r.pos===view.posFilter),stats=statisticGroups(scope,view.chartMode,'all'),total=stats.records.length;
      const classified=stats.groups.some(group=>!group.missing);right.hidden=!classified;layout.classList.toggle('v12102-no-statistics',!classified);if(!classified){view.chartGroups=[];view.chart.replaceChildren();return;}
      view.chartGroups=stats.groups;view.chartSummary.textContent=view.visible.length+' / '+view.records.length+' 条';view.chartSummary.setAttribute('aria-label','当前筛选结果 '+view.visible.length+' / '+view.records.length+' 条');view.chart.dataset.denominator=String(total);view.chart.dataset.mode=view.chartMode;mode.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v1279ChartMode===view.chartMode)));
      view.policy.textContent='占比按当前题型'+(meaningMode&&view.posFilter?'及词性':'')+'范围计算。点击'+(meaningMode?'释义':'词性')+'或环图，进一步筛选左侧例句；再次点击取消该筛选。';
      let angle=-Math.PI/2;const paths=[],rows=stats.groups.map((g,i)=>{
        const percent=total?g.count/total*100:0,label=percent.toFixed(1).replace(/\.0$/,'')+'%',color=['#3264ff','#7197ff','#a9c4ff','#7d69d6','#46a7a1','#d39a49'][i%6],selected=meaningMode?view.meaningFilter?.key===g.key:view.posFilter===g.pos;
        const detail=(meaningMode?posLabel(g.pos)+' ':'')+g.label+'，'+g.count+'条，占'+label+'；点击筛选左侧例句';const attrs=' data-v1279-statistic-index="'+i+'" aria-pressed="'+selected+'" aria-label="'+esc(detail)+'"';
        const end=angle+percent/100*Math.PI*2;paths.push('<path class="v1279-donut-segment" d="'+donutPath(angle,end)+'" fill="'+color+'" role="button" tabindex="0"'+attrs+'></path>');angle=end;
        const swatch='<i class="v1279-stat-swatch v124-distribution-swatch" style="--slice:'+color+'" aria-hidden="true"></i>',button='<button type="button" class="v1279-stat-link v124-distribution-key"'+attrs+'>'+swatch+'<span>'+esc((meaningMode?posLabel(g.pos)+' ':'')+g.label)+'</span></button>';
        return '<tr data-v1279-statistic-row="'+i+'"'+(selected?' class="is-selected"':'')+'><td>'+button+'</td>'+'<td class="v1279-stat-number">'+g.count+'</td><td class="v1279-stat-number">'+label+'</td></tr>';
      }).join('');
      view.chart.innerHTML=stats.groups.length?'<div class="v1279-stat-table-wrap"><table class="v1279-stat-table v124-distribution-table"><caption class="v1279-visually-hidden">'+(meaningMode?'释义':'词性')+'分布，共'+total+'条</caption><thead><tr><th>'+(meaningMode?'词性与释义':'词性')+'</th><th class="v1279-stat-number">次数</th><th class="v1279-stat-number">占比</th></tr></thead><tbody>'+rows+'</tbody></table></div><div class="v1279-donut-wrap"><svg class="v1279-donut" viewBox="0 0 320 320" role="group" aria-label="'+(meaningMode?'释义':'词性')+'占比环形图">'+paths.join('')+'<text class="v1279-donut-total" x="160" y="154" text-anchor="middle" aria-hidden="true">'+total+'</text><text class="v1279-donut-caption" x="160" y="181" text-anchor="middle" aria-hidden="true">真实例句</text></svg></div>':'<p class="v1278-empty">当前范围暂无真实例句</p>';
    }
    function render(){tooltip.hidden=true;showExamples();showChart();scheduleSize();}
    function choose(index){const g=view.chartGroups[index];if(!g)return;if(view.chartMode==='meaning'){view.meaningFilter=view.meaningFilter?.key===g.key?null:{key:g.key,label:posLabel(g.pos)+' '+g.label};}else{view.posFilter=view.posFilter===g.pos?'':g.pos;if(view.meaningFilter&&JSON.parse(view.meaningFilter.key)[0]!==view.posFilter)view.meaningFilter=null;}render();}
    const tooltip=make('div','v1288-chart-tooltip');tooltip.hidden=true;tooltip.setAttribute('role','tooltip');tooltip.id='v1288-tooltip-'+view.panel.id;right.append(tooltip);
    const hideTooltip=()=>{tooltip.hidden=true;};
    const showTooltip=(target,x,y)=>{const g=view.chartGroups[Number(target.dataset.v1279StatisticIndex)];if(!g)return;target.setAttribute('aria-describedby',tooltip.id);const denominator=Number(view.chart.dataset.denominator),percent=denominator?(g.count/denominator*100).toFixed(1):'0.0';tooltip.replaceChildren(make('strong','',(view.chartMode==='meaning'?posLabel(g.pos)+' ':'')+g.label),make('span','',g.count+' 条 · 占比 '+percent+'%'),make('small','',(view.type||'全部题型')+(view.chartMode==='meaning'&&view.posFilter?' · 词性 '+posLabel(view.posFilter):'')));tooltip.hidden=false;const rect=tooltip.getBoundingClientRect();tooltip.style.left=Math.max(8,Math.min(x+14,innerWidth-rect.width-12))+'px';tooltip.style.top=Math.max(8,Math.min(y+14,innerHeight-rect.height-12))+'px';};
    view.chart.addEventListener('pointermove',e=>{const n=e.target.closest('[data-v1279-statistic-index]');if(n)showTooltip(n,e.clientX,e.clientY);else hideTooltip();});view.chart.addEventListener('pointerleave',hideTooltip);view.chart.addEventListener('focusin',e=>{const n=e.target.closest('[data-v1279-statistic-index]');if(n){const r=n.getBoundingClientRect();showTooltip(n,r.right,r.top);}});view.chart.addEventListener('focusout',hideTooltip);
    strip.addEventListener('click',e=>{const b=e.target.closest('[data-v1278-type]');if(b&&b!==all&&!b.disabled){view.type=view.type===b.dataset.v1278Type?'':b.dataset.v1278Type;render();}});
    all.addEventListener('click',()=>{view.type='';render();});reset.addEventListener('click',()=>{view.type='';view.posFilter='';view.meaningFilter=null;view.chartMode='meaning';render();});
    mode.addEventListener('click',e=>{const b=e.target.closest('[data-v1279-chart-mode]');if(b){view.chartMode=b.dataset.v1279ChartMode;render();}});
    view.chart.addEventListener('click',e=>{const n=e.target.closest('[data-v1279-statistic-index]');if(n)choose(Number(n.dataset.v1279StatisticIndex));});view.chart.addEventListener('keydown',e=>{if(e.target.matches('.v1279-donut-segment')&&['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();choose(Number(e.target.dataset.v1279StatisticIndex));}});
    const detail=detailForView(view),body=detail?.querySelector(':scope>.resource-popover-body');let heightFrame=0;
    const verticalEdges=element=>{const s=getComputedStyle(element);return ['paddingTop','paddingBottom','borderTopWidth','borderBottomWidth','marginTop','marginBottom'].reduce((sum,key)=>sum+(parseFloat(s[key])||0),0);};
    const size=()=>{heightFrame=0;if(!layout.getClientRects().length||!body)return;const nav=detail.querySelector('.vwn-main-nav'),content=view.host.closest('.vwn-content');if(!nav||!content)return;const s=getComputedStyle(body),pad=(parseFloat(s.paddingTop)||0)+(parseFloat(s.paddingBottom)||0),gap=parseFloat(s.rowGap)||0;let edges=0;for(let parent=view.host.parentElement;parent&&parent!==content;parent=parent.parentElement)edges+=verticalEdges(parent);const header=layout.getBoundingClientRect().top-view.host.getBoundingClientRect().top,room=Math.max(220,Math.floor(body.clientHeight-pad-nav.getBoundingClientRect().height-gap-verticalEdges(content)-edges-header));if(layout.style.getPropertyValue('--v1281-exam-room')!==room+'px')layout.style.setProperty('--v1281-exam-room',room+'px');};
    function scheduleSize(){if(!heightFrame)heightFrame=requestAnimationFrame(size);}
    const observer=new MutationObserver(scheduleSize);observer.observe(detail,{subtree:true,attributes:true,attributeFilter:['aria-selected','hidden']});const resize=new ResizeObserver(scheduleSize);[body,detail.querySelector('.vwn-main-nav'),head,selector,chips].filter(Boolean).forEach(n=>resize.observe(n));window.addEventListener('resize',scheduleSize);
    // Selecting a tab updates content in place; it must not force the outer page to scroll.
    view.cleanup=()=>{tabObserver.disconnect();strip.remove();observer.disconnect();resize.disconnect();window.removeEventListener('resize',scheduleSize);cancelAnimationFrame(heightFrame);};

    view.statistics={getState:()=>({type:view.type||'all',pos:view.posFilter||'all',meaning:view.meaningFilter?.label||'',mode:view.chartMode,visible:view.visible.map(r=>({id:r.sourceId,pos:r.pos,meaning:r.meaning,date:yearMonth(r)}))})};
    arrowButtons(strip,'data-v1278-type');arrowButtons(mode,'data-v1279-chart-mode');render();
  }
  function buildTextbook(view) {
    const heading = make('div','v1278-panel-heading'); 
    const controls = make('div','book-unit-options v1220-secondary-tabs v1296-exam-tabs v1297-textbook-tabs'); controls.dataset.v1220SubnavFor='textbookExamples';controls.setAttribute('role','tablist'); controls.setAttribute('aria-label','教材版本范围');
    [['current','当前版本'],['all','全部版本']].forEach(([value,label]) => { const button = make('button','',label); button.type = 'button'; button.dataset.v1278Edition = value;button.setAttribute('role','tab'); controls.append(button); });
    detailForView(view).querySelector('.vwn-secondary-tools').append(controls);
    const syncTabs=()=>{controls.hidden=view.button.getAttribute('aria-selected')!=='true';};const tabObserver=new MutationObserver(syncTabs);tabObserver.observe(view.button,{attributes:true,attributeFilter:['aria-selected']});syncTabs();view.cleanup=()=>{tabObserver.disconnect();controls.remove();};
    const countLine = make('div','v1278-textbook-summary'); view.summary = make('span','v1278-result-count'); view.summary.setAttribute('role','status');
    const version = make('span','v1278-current-edition','当前版本：' + CURRENT_TEXTBOOK_EDITION); 
    view.list = make('div','v1278-example-list'); view.host.append(view.list); view.edition = 'current';
    function render() {
      controls.querySelectorAll('button').forEach(button => {const value=button.dataset.v1278Edition,count=value==='all'?view.records.length:view.records.filter(record=>isCurrentEdition(record.edition)).length;button.textContent=(value==='all'?'全部版本':'当前版本')+' ('+count+')';const active=value === view.edition;button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
      replaceExamples(view,view.edition === 'all' ? view.records : view.records.filter(record => isCurrentEdition(record.edition)));
      const editions = [...new Set(view.records.map(record => record.edition).filter(Boolean))];
      version.textContent = view.edition === 'all' ? '全部版本：' + (editions.join('、') || '未标注') : '当前版本：' + CURRENT_TEXTBOOK_EDITION;
      view.host.dataset.v1278Edition = view.edition;
    }
    controls.addEventListener('click',event => { const button = event.target.closest('[data-v1278-edition]'); if (!button) return; view.edition = button.dataset.v1278Edition; render(); });
    arrowButtons(controls,'data-v1278-edition'); render();
  }
  function mount(detail, result = window.V1220WordDetail?.getModel?.(detail)) {
    if (detail?.id !== 'wordDetailDialog' || !result?.word || !window.V1222SenseExamples?.renderExample) return null;
    const previous = mounted.get(detail);
    if (previous?.word === result.word && Object.values(previous.views).every(view => detail.contains(view.host))) return previous;
    previous?.destroy();
    // The baseline exposes its controller through mount(). Stop its observers
    // before replacing removed controls so they cannot restore the old toolbar.
    window.V1270Examples?.mount?.(detail,result)?.destroy?.();
    detail.querySelectorAll('[data-v1220-subnav-for="cases"],[data-v1225-subnav-for="cases"],[data-v1220-subnav-for="textbookExamples"],[data-v1225-subnav-for="textbookExamples"],.v1227-exam-type-tabs').forEach(node => node.remove());
    const controller = {detail,word:result.word,views:{},destroy:null};
    ['cases','textbookExamples'].forEach(kind => {
      const button = detail.querySelector('[data-word-module="' + kind + '"]');
      const panel = button && document.getElementById(button.getAttribute('aria-controls'));
      if (!panel || !detail.contains(panel)) return;
      const scroll = panel.querySelector('.vwn-panel-scroll') || panel;
      const host = make('section','v1278-detail-panel'); host.dataset.v1278Kind = kind;
      const view = {kind,panel,button,host,records:rowsFor(result,kind),visible:[],nodes:new Map()};
      panel.dataset.v1278Panel = kind; panel.classList.add('v1278-managed-panel'); scroll.replaceChildren(host);
      controller.views[kind] = view;
      if (kind === 'cases') buildExam(view); else buildTextbook(view);
    });
    controller.destroy = () => {
      Object.values(controller.views).forEach(view => {view.cleanup?.(); view.host.remove(); view.panel.classList.remove('v1278-managed-panel'); delete view.panel.dataset.v1278Panel; });
      if (mounted.get(detail) === controller) mounted.delete(detail);
    };
    mounted.set(detail,controller); window.WordDetailNavigation?.fit?.(); return controller;
  }
  function inspect(detail = document.getElementById('wordDetailDialog')) {
    const controller = mounted.get(detail); if (!controller) return null;
    return Object.fromEntries(Object.entries(controller.views).map(([kind,view]) => [kind,{
      total:view.records.length,visible:view.visible.length,visibleIds:view.visible.map(record => record.sourceId),
      mockCount:view.records.filter(record => isMock(record.row)).length,
      ...(kind === 'cases' ? {type:view.type || 'all',chartPOS:view.pos,chartMode:view.chartMode,statisticSourceCount:view.chartRecords.length,availablePOS:chartPOSOptions(view.chartRecords).map(([value]) => value),types:TYPE_ORDER.map(type => ({type,count:view.records.filter(record => record.type === type).length})),chartDenominator:Number(view.chart.dataset.denominator),meanings:(view.chartGroups || []).map(group => ({meaning:group.label,pos:group.pos,count:group.count})),statisticGroups:(view.chartGroups || []).map(group => ({label:group.label,pos:group.pos,count:group.count}))} : {edition:view.edition,currentEdition:CURRENT_TEXTBOOK_EDITION,currentCount:view.records.filter(record => isCurrentEdition(record.edition)).length,editions:[...new Set(view.records.map(record => record.edition))]})
    }]));
  }
  window.V1278DetailPanels = Object.freeze({mount,inspect,types:TYPE_ORDER,currentTextbookEdition:CURRENT_TEXTBOOK_EDITION,
    statistics:detail=>mounted.get(detail)?.views.cases?.statistics||null,
    getPanels:detail => { const controller = mounted.get(detail || document.getElementById('wordDetailDialog')); return controller ? Object.fromEntries(Object.entries(controller.views).map(([key,view]) => [key,view.panel])) : {}; }
  });
})();
