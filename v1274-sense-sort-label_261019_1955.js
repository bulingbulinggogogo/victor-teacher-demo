/* Add a visible caption to the existing sense-sort slot only.
 * The original radio nodes, default value, change listener and slot hiding stay intact.
 */
(() => {
  'use strict';
  if(window.V1274SenseSortLabel)return;
  const api=window.V1220WordDetail;if(!api?.finish)return;
  const pending=new WeakSet();
  function mount(detail) {
    if(detail?.id!=='wordDetailDialog'||!detail.isConnected)return false;
    const sort=detail.querySelector('[data-word-sense-sort][data-v1241-sort-slot]');
    if(!sort)return false;
    if(sort.dataset.v1274SortLabelReady)return true;
    const labels=[...sort.children].filter(node=>node.tagName==='LABEL'&&node.querySelector('[data-sense-sort]'));
    if(labels.length!==2)return false;
    const caption=document.createElement('span');
    caption.className='v1274-sense-sort-label';caption.textContent='排序';
    const segments=document.createElement('span');
    segments.className='v1274-sense-sort-segments';
    labels.forEach(label=>segments.append(label));
    sort.prepend(caption,segments);sort.dataset.v1274SortLabelReady='true';
    return true;
  }
  function schedule(detail) {
    if(detail?.id!=='wordDetailDialog'||pending.has(detail))return;
    pending.add(detail);queueMicrotask(()=>{pending.delete(detail);mount(detail);});
  }
  const finish=api.finish;
  api.finish=function(detail,result){const value=finish.apply(this,arguments);schedule(detail);return value;};
  window.addEventListener('v1213-word-mounted',event=>schedule(event.detail));
  window.V1274SenseSortLabel={mount,inspect:()=>{
    const sort=document.querySelector('#wordDetailDialog [data-word-sense-sort][data-v1241-sort-slot]');
    return sort?{
      caption:sort.querySelector(':scope>.v1274-sense-sort-label')?.textContent,
      captionCount:sort.querySelectorAll('.v1274-sense-sort-label').length,
      hidden:sort.hidden,radioCount:sort.querySelectorAll('[data-sense-sort]').length,
      selected:sort.querySelector('[data-sense-sort]:checked')?.dataset.senseSort,
      parentClass:sort.parentElement?.className
    }:null;
  }};
  const detail=document.getElementById('wordDetailDialog');if(detail)schedule(detail);
})();

