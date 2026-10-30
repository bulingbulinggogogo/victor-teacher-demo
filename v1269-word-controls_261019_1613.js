/* V69: idioms retain the parent word-block label and category label together. */
(() => {
 'use strict';
 const api=window.V1220WordDetail;if(!api?.finish)return;
 function labelIdioms(detail){
   detail.querySelectorAll('[data-sense-block][data-block-category="习语"],[data-v1267-word-block][data-block-category="习语"]').forEach(block=>{
     const heading=block.querySelector(':scope > .v1226-block-unit-head,:scope > .v1223-sense-block-heading');
     if(!heading||heading.querySelector('.v1223-block-kind'))return;
     const label=document.createElement('span');label.className='v1223-block-kind';label.dataset.wordTagField='usage';label.textContent='词块';heading.prepend(label);
   });
 }
 const finish=api.finish;
 api.finish=function(detail,result){
   const value=finish.apply(this,arguments);if(detail?.id!=='wordDetailDialog'||!result?.word)return value;
   labelIdioms(detail);detail.dataset.v1269Controls='true';return value;
 };
 window.V1269WordControls={labelIdioms};
})();
