/* Whole-row visibility is independent of individual reveal masks; lower rows share one horizontal viewport. */
(() => {
 'use strict';const api=window.V1220WordDetail,graphs=window.V1213Illustrations;if(!api?.finish||!graphs)return;
 const models=new WeakMap(),live=new Set();let frame=0;
 function mount(module){
  if(!module)return;const existing=models.get(module);if(existing){if(module.contains(existing.viewport))return;existing.resize?.disconnect();existing.controls.remove();live.delete(existing);models.delete(module);}
  const scene=module.querySelector('.pgi-scene-polysemy'),derivation=scene?.querySelector('[data-pgi-row="derivation"]'),meaning=scene?.querySelector('[data-pgi-row="meaning"]'),images=scene?.querySelector('.pgi-visual-row'),connector=scene?.querySelector('.pgi-connectors');if(!derivation||!meaning||!images||!connector)return;
  const viewport=document.createElement('div'),track=document.createElement('div');viewport.className='v1288-network-scroll';viewport.tabIndex=0;viewport.setAttribute('role','region');viewport.setAttribute('aria-label','左右滚动查看全部推导、答案和配图');track.className='v1288-network-track';const lower=document.createElement('div'),stem=document.createElement('div');lower.className='v1289-network-lower';stem.className='v1289-fixed-stem';stem.setAttribute('aria-hidden','true');connector.before(lower);lower.append(stem,viewport);viewport.append(track);track.append(connector,derivation,meaning,images);
  const controls=document.createElement('nav');controls.className='v1288-network-row-controls v1247-polysemy-controls v1281-network-rail';controls.setAttribute('aria-label','语义网整行显示控制');controls.classroomMediaOwner=module;
  const bar=document.createElement('div'),slider=document.createElement('input');bar.className='v1298-network-scrollbar';slider.type='range';slider.min='0';slider.max='1000';slider.step='1';slider.value='0';slider.setAttribute('aria-label','横向滚动语义网');slider.setAttribute('aria-orientation','horizontal');bar.append(slider);lower.append(bar);
  const model={bar,slider,module,scene,viewport,track,controls,rows:[derivation,meaning],connected:false,rowHeights:new Map()};
  slider.addEventListener('input',()=>{viewport.scrollLeft=Number(slider.value)/1000*Math.max(0,viewport.scrollWidth-viewport.clientWidth);syncScroll(model);});viewport.addEventListener('scroll',()=>syncScroll(model),{passive:true});models.set(module,model);live.add(model);model.resize=new ResizeObserver(schedule);model.resize.observe(viewport);module.addEventListener('load',schedule,true);schedule();
 }
 function syncScroll(model){
  const {viewport,bar,slider}=model,max=Math.max(0,viewport.scrollWidth-viewport.clientWidth),value=max?Math.round(viewport.scrollLeft/max*1000):0;if(bar.hidden!==(max<1))bar.hidden=max<1;slider.disabled=max<1;if(slider.value!==String(value))slider.value=String(value);slider.setAttribute('aria-valuetext',value===0?'最左侧':value===1000?'最右侧':Math.round(value/10)+'%');const width=Math.max(38,bar.clientWidth*viewport.clientWidth/Math.max(1,viewport.scrollWidth));slider.style.setProperty('--v1298-scroll-thumb',width+'px');
 }
 function fit(model){
  const {module,scene,viewport,track,controls,rows}=model,detail=module.closest('#wordDetailDialog');if(!detail)return;model.connected=true;
  const active=detail.matches('.v1263-interactive-fullscreen[data-v1263-interactive-module="illustrations"]')&&!module.closest('[hidden]');controls.hidden=true;
  
  if(!active){if(!model.bar.hidden)model.bar.hidden=true;return;}
  module.dataset.v1288HorizontalNetwork='true';
  const scale=Math.min(1.3,Math.max(.85,parseFloat(getComputedStyle(detail).getPropertyValue('--full-dialog-scale'))||1));module.style.setProperty('--v1288-network-scale',scale);
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  const columns=rows[0].children.length;
  const widths=Array.from({length:columns},(_,index)=>Math.max(180,...rows.map(row=>{
    const button=row.children[index],span=button?.querySelector('span');if(!span)return 0;
    const style=getComputedStyle(span);ctx.font=style.font;
    return Math.ceil(ctx.measureText(span.textContent).width*1.04+40);
  })));
  const gap=24,minWidth=widths.reduce((a,b)=>a+b,0)+gap*(columns-1),trackWidth=Math.max(viewport.clientWidth,minWidth),extra=(trackWidth-minWidth)/Math.max(1,columns);
  const grid=widths.map(w=>(w+extra)+'px').join(' ');
  track.style.setProperty('--v1288-track-width',trackWidth+'px');
  track.style.setProperty('--v12100-columns',grid);track.style.setProperty('--v12100-gap',gap+'px');
  [ ...rows,track.querySelector('.pgi-visual-row') ].forEach(row=>{if(row){row.style.setProperty('grid-template-columns',grid,'important');row.style.setProperty('gap',gap+'px','important');}});
  const available=detail.querySelector('.vwn-content').clientHeight;
  rows.forEach(row=>{if(!row.hidden)model.rowHeights.set(row,row.getBoundingClientRect().height);});
  const fullRows=rows.reduce((sum,row)=>sum+(row.hidden?0:(model.rowHeights.get(row)||64)),0);
  const columnWidth=Math.min(...widths.map(w=>w+extra)),desiredImage=columnWidth*.75;
  const connectorHeight=Math.max(65,Math.min(150,available*.15));
  const baseHeight=Math.max(120,Math.min(310,available*.31));
  const imageHeight=Math.max(100,Math.min(desiredImage,available-baseHeight-connectorHeight-fullRows-70));
  module.style.setProperty('--v1289-network-base',baseHeight+'px');
  module.style.setProperty('--v1289-network-connectors',connectorHeight+'px');
  module.style.setProperty('--v1288-network-image',imageHeight+'px');
  module.style.setProperty('--v1288-network-top','0px');
  syncScroll(model);window.V1279SemanticNetwork?.refresh();
 }
 function schedule(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;document.querySelectorAll('[data-v1279-semantic-network]').forEach(mount);live.forEach(model=>{if(model.module.isConnected)fit(model);else if(model.connected){model.resize?.disconnect();model.controls.remove();live.delete(model);}});});}
 const finish=api.finish;api.finish=function(){const value=finish.apply(this,arguments);schedule();return value;};
 const create=graphs.create;graphs.create=function(){const rows=create.apply(this,arguments);rows.forEach(row=>{if(row.content?.matches('[data-graph-kind="polysemy"]'))mount(row.content);});return rows;};
 new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-selected','data-v1263-interactive-module']});window.addEventListener('resize',schedule);document.fonts?.ready.then(schedule);
 window.V1288Network={refresh:schedule};schedule();
})();
