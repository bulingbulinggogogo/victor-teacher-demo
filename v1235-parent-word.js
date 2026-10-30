/* V1.2.35: preserve the supplied parent/collocation relation as data while
   removing the unrequested parent-word navigation from word-detail content. */
(() => {
  'use strict';
  const api=window.V1220WordDetail;
  if(!api?.finish||window.V1235ParentWord)return;
  function removeParentNavigation(detail){
    if(detail?.id!=='wordDetailDialog')return;
    detail.querySelectorAll('button.v1220-related-link[data-latest-head]').forEach(button=>button.remove());
  }
  const originalFinish=api.finish;
  api.finish=function(detail,...args){
    const result=originalFinish.call(this,detail,...args);
    removeParentNavigation(detail);
    return result;
  };
  window.V1235ParentWord={refresh:removeParentNavigation};
  removeParentNavigation(document.getElementById('wordDetailDialog'));
})();
