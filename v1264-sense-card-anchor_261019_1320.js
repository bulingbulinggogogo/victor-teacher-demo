/* Anchor once after the original POS and frequency ordering has finished. */
(() => {
  'use strict';
  const api=window.V1220WordDetail;
  if(!api?.finish)return;
  const finish=api.finish;
  api.finish=function(detail,result){
    const value=finish.apply(this,arguments);
    if(detail?.id!=='wordDetailDialog')return value;
    const first=detail.querySelector('.vwn-panel[aria-labelledby$="-tab-meanings"] [data-latest-sense]');
    const copy=first?.querySelector('.resource-sense-copy');
    if(!copy)return value;
    let moved=false;
    detail.querySelectorAll('[data-v1264-sense-card]').forEach(card=>{
      if(card.dataset.v1264AnchorFinalized)return;
      copy.append(card);card.dataset.v1264SenseKey=first.dataset.latestSense;
      card.dataset.v1264AnchorFinalized='true';moved=true;
    });
    if(moved)api.refreshFeatures?.(detail);
    return value;
  };
})();
