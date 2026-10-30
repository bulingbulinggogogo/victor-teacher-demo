/* Each supplied example is one observation. Source fields are never guessed from sentences. */
(() => {
  'use strict';
  const text = value => String(value ?? '').trim();
  const clean = value => ['', '-', '—'].includes(text(value)) ? '' : text(value);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const fields = {
    exam:[['partOfSpeech','词性'],['meaning','中文释义'],['wordForm','词形'],['year','年份'],['paper','卷别'],['questionType','题型'],['topic','话题']],
    textbook:[['partOfSpeech','词性'],['meaning','中文释义'],['wordForm','词形'],['edition','版本'],['bookVolume','册别'],['unit','单元'],['section','板块'],['topic','话题']]
  };
  // Exact missing-field supplement only: 听力demo用词.xlsx / present教材例句 / D2:D35.
  // Current textbook records retain the source row and head but omitted D (词形).
  // These are the original D values for the 33 rows which have examples; raw data stays unchanged.
  const textbookWordForms = new Map([
    [2,'present'],[3,'present'],[4,'present'],[5,'present'],[6,'present'],[7,'present'],[8,'present'],[9,'present'],[10,'present'],[11,'present'],
    [12,'presents'],[13,'present'],[14,'present'],[15,'presents'],[16,'presents'],[17,'presents'],[18,'presented'],[19,'presented'],[20,'presented'],
    [21,'present'],[22,'presenting'],[23,'presented'],[24,'presents'],[25,'present'],[26,'presents'],[27,'present'],[28,'presenting'],[29,'present'],
    [30,'present'],[31,'present'],[32,'presented'],[34,'presented'],[35,'presented']
  ]);
  const posNames = {n:'n. 名词',v:'v. 动词',adj:'adj. 形容词',adv:'adv. 副词',prep:'prep. 介词',pron:'pron. 代词',conj:'conj. 连词',num:'num. 数词',interj:'interj. 感叹词',det:'det. 限定词'};
  function pos(value) {
    const raw=clean(value), match=raw.toLowerCase().match(/^(adj|adv|prep|pron|conj|num|interj|det|n|vt|vi|v)(?=[.\s\[（(]|$)/);
    return match ? posNames[/^v[ti]$/.test(match[1])?'v':match[1]] || raw : raw;
  }
  function rowsFor(word,item,retained,source) {
    if(source==='exam') return window.V1227ExamDistribution?.sourceRows(word,item,retained) || [];
    return (word?.textbookExamples || []).filter(row=>clean(row.sentence || row.english)).map(row=>{
      if(clean(row.wordForm))return row;
      const number=Number(row.source?.row), head=number<=11?'present1':'present2';
      const exact=row.exampleKey===`latest-example:present教材例句:${number}` && row.source?.sheet==='present教材例句' && row.head===head;
      return exact && textbookWordForms.has(number) ? {...row,wordForm:textbookWordForms.get(number),wordFormSource:{file:'听力demo用词.xlsx',sheet:'present教材例句',cell:'D'+number}} : row;
    });
  }
  function getStats(word,item={},retained=[],source='exam',field='partOfSpeech') {
    if(!fields[source])source='exam';
    if(!fields[source].some(([key])=>key===field))field=fields[source][0][0];
    const records=rowsFor(word,item,retained,source);
    // Retained real cases store the supplied 来源名称 in sourceName, rather than paper.
    const values=records.map(row=>({ ...row, statisticValue:field==='partOfSpeech'?pos(row.partOfSpeech):clean(field==='paper' ? row.paper || row.sourceName : row[field]) }));
    const entries=window.V1227ExamDistribution?.grouped(values,'statisticValue') || [];
    return {source,field,label:fields[source].find(([key])=>key===field)[1],denominator:records.length,entries,records,available:!!window.V1227ExamDistribution?.canChart?.(entries),
      policy:'统计已收录例句，每条例句计1次；未标注字段计入总数。'};
  }
  function renderBars(stats) {
    return window.V1227ExamDistribution?.renderBars({key:stats.field,title:stats.label,entries:stats.entries},stats.denominator)||'';
  }
  function renderYears(stats) {
    const entries=[...stats.entries].sort((a,b)=>{
      const left=Number(String(a.label).match(/^\d{4}/)?.[0]);
      const right=Number(String(b.label).match(/^\d{4}/)?.[0]);
      return (Number.isFinite(left)?left:Infinity)-(Number.isFinite(right)?right:Infinity);
    });
    const peak=Math.max(1,...entries.map(entry=>entry.count));
    const step=Math.max(1,Math.ceil(peak/6)),maximum=Math.ceil(peak/step)*step;
    const ticks=Array.from({length:maximum/step+1},(_,index)=>index*step);
    const summary=entries.map(entry=>`${entry.label}，${entry.count}次`).join('；');
    return `<section class="vside-year-chart" data-vside-year-chart data-year-maximum="${maximum}">
      <div class="vside-year-y-axis" aria-hidden="true">${ticks.map(value=>`<span style="bottom:${value/maximum*100}%">${value}</span>`).join('')}</div>
      <div class="vside-year-scroll" tabindex="0" role="group" aria-label="年份频率趋势，已收录${stats.denominator}条例句">
        <div class="vside-year-canvas" style="--vside-year-count:${entries.length}">
          <div class="vside-year-grid" aria-hidden="true">${ticks.map(value=>`<i style="bottom:${value/maximum*100}%"></i>`).join('')}</div>
          <div class="vside-year-columns">${entries.map((entry,index)=>`<div role="button" tabindex="0" aria-pressed="false" aria-label="${esc(entry.label)}，${entry.count}次，占${Number(entry.count/stats.denominator*100).toFixed(1)}%" class="v1227-stat-bar-row vside-year-column${entry.missing?' is-missing':''}" data-v1227-chart-index="${index}" data-stat-label="${esc(entry.label)}" data-stat-count="${entry.count}">
            <span class="vside-year-column-area"><span class="vside-year-bar" style="height:${entry.count/maximum*100}%"><span class="vside-year-value">${entry.count}</span></span></span>
            <span class="vside-year-label">${esc(entry.label)}</span>
          </div>`).join('')}</div>
        </div>
      </div>
      <p class="v1229-chart-accessible-summary">${esc(summary)}</p>
      <p class="v1227-pie-selection" aria-live="polite"></p>
    </section>`;
  }
  function renderContent(stats) {
    if(!stats.available)return '';
    const chartType=['partOfSpeech','meaning','questionType'].includes(stats.field)?'pie':stats.field==='year'?'columns':'bars';
    const content=chartType==='pie'?window.V1227ExamDistribution?.renderChart({key:stats.field,title:stats.label,entries:stats.entries,compact:true},stats.denominator)||'':chartType==='columns'?renderYears(stats):renderBars(stats);
    return `<section class="v1228-chart-group vside-single-chart" data-v1228-chart-group="${esc(stats.field)}" data-stat-denominator="${stats.denominator}" data-stat-field="${esc(stats.field)}" data-stat-chart-type="${chartType}"><header class="v1228-chart-heading"><h4>${esc(stats.label)}</h4><span class="v1228-chart-source-count">已收录 ${stats.denominator} 条例句</span></header><div class="vside-single-chart-body">${content}</div></section>`;
  }
  function getAvailability(word,item={},retained=[]) {
    const stats=Object.fromEntries(Object.keys(fields).map(source=>[source,fields[source].map(([field])=>getStats(word,item,retained,source,field))]));
    const available=Object.fromEntries(Object.keys(fields).map(source=>[source,stats[source].filter(stat=>stat.available)]));
    return {stats,available,sourceKeys:Object.keys(fields).filter(source=>available[source].length)};
  }
  function renderSource(availability,source,selected) {
    const groups=availability.available[source]||[];if(!groups.length)return '';
    const types=[['columns',groups.filter(stat=>stat.field==='year')],
      ['pie',groups.filter(stat=>['partOfSpeech','meaning','questionType'].includes(stat.field))],
      ['bars',groups.filter(stat=>!['partOfSpeech','meaning','questionType','year'].includes(stat.field))]];
    return `<div class="v1227-exam-distribution v1228-stat-source-${source}" data-v1272-stat-layout>${types.filter(([,items])=>items.length).map(([type,items])=>`<div class="v1266-chart-type-group" data-v1266-chart-type="${type}" style="--v1272-chart-count:${Math.min(3,items.length)}">${items.map(renderContent).join('')}</div>`).join('')}</div>`;
  }
  function renderPlaceholder(word,item={},retained=[]) {
    const availability=getAvailability(word,item,retained),source=availability.sourceKeys[0];if(!source)return '';
    return `<div class="v1227-word-statistics" data-v1227-word-statistics><div class="v1227-stat-result">${renderSource(availability,source,availability.available[source][0].field)}</div></div>`;
  }
  let sequence=0;
  function mount(detail,model) {
    const main=detail?.querySelector('[data-word-module="statistics"]'),panel=main&&document.getElementById(main.getAttribute('aria-controls'));
    const host=panel?.querySelector('[data-v1227-word-statistics]'),actions=detail?.querySelector('.vwn-secondary-tools');
    if(!host || !actions || !model?.word || host.dataset.mounted)return;
    host.dataset.mounted='true';const token='v1227-stat-'+(++sequence),result=host.querySelector('.v1227-stat-result'),scroll=panel.querySelector('.vwn-panel-scroll');
    result.id=token+'-result';result.setAttribute('role','tabpanel');
    const availability=getAvailability(model.word,model.options?.item||{},model.options?.retainedCases||[]);
    if(!availability.sourceKeys.length)return;
    const choices={exam:'all',textbook:'all'},positions={exam:{},textbook:{}};let selectedSource=availability.sourceKeys[0];
    const sourceTabs=document.createElement('div');sourceTabs.className='v1220-secondary-tabs v1227-stat-source-tabs';sourceTabs.dataset.v1220SubnavFor='statistics';sourceTabs.setAttribute('role','tablist');sourceTabs.setAttribute('aria-label','词频统计例句来源');
    sourceTabs.innerHTML=availability.sourceKeys.map((key,index)=>`<button type="button" role="tab" id="${token}-source-${key}" data-v1227-stat-source="${key}" aria-controls="${token}-result" aria-selected="${index===0}" tabindex="${index===0?0:-1}">${key==='exam'?'高考例句':'教材例句'}</button>`).join('');actions.append(sourceTabs);
    function sync() {
      const active=main.getAttribute('aria-selected')==='true';if(sourceTabs.hidden===active)sourceTabs.hidden=!active;
      window.V1223WordDock?.refresh?.(detail);
    }
    function render() {
      const field=choices[selectedSource];host.dataset.statisticsSource=selectedSource;host.dataset.statisticsField=field;
      result.setAttribute('aria-labelledby',token+'-source-'+selectedSource);
      sourceTabs.querySelectorAll('[data-v1227-stat-source]').forEach(button=>{const active=button.dataset.v1227StatSource===selectedSource;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
      result.innerHTML=renderSource(availability,selectedSource,field);
      window.V1227ExamDistribution?.bindCharts?.(result);if(scroll)scroll.scrollTop=positions[selectedSource][field]||0;sync();
    }
    function select(source,field) {
      if(scroll)positions[selectedSource][choices[selectedSource]]=scroll.scrollTop;
      if(availability.sourceKeys.includes(source))selectedSource=source;
      render();
    }
    function keys(event,selector,onSelect) {
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      const buttons=[...event.currentTarget.querySelectorAll(selector)],index=buttons.indexOf(event.target);if(index<0)return;
      event.preventDefault();event.stopPropagation();const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
      const value=buttons[next].dataset[selector.includes('source')?'v1227StatSource':'v1227StatField'];onSelect(value);const target=event.currentTarget.querySelector(`${selector.slice(0,-1)}="${value}"]`);target?.focus({preventScroll:true});
    }
    sourceTabs.addEventListener('click',event=>{const button=event.target.closest('[data-v1227-stat-source]');if(button)select(button.dataset.v1227StatSource);});
    sourceTabs.addEventListener('keydown',event=>keys(event,'[data-v1227-stat-source]',value=>select(value)));
    main.closest('[role="tablist"]')?.addEventListener('click',()=>queueMicrotask(sync));detail.addEventListener('keydown',()=>queueMicrotask(sync));render();
  }
  window.V1227WordStatistics={fields,getStats,getAvailability,renderPlaceholder,mount};
})();
