/* V1.2.98: all word-block content labels use one trailing inline treatment. */
(() => {
 'use strict';let frame=0;
 const labels='.v1224-block-category,.v1226-block-category,.v1226-block-subcategory,.v1226-block-field-label';
 function sync(){frame=0;const d=document.querySelector('#wordDetailDialog');if(!d||d.classList.contains('v1263-interactive-fullscreen'))return;d.querySelectorAll(labels).forEach(label=>{if(!label.classList.contains('v1298-content-label'))label.classList.add('v1298-content-label');if(label.matches('.v1226-block-field-label')){const line=label.closest('.v1226-block-field');if(line&&line.lastElementChild!==label)line.append(label);}});}
 function schedule(){if(!frame)frame=requestAnimationFrame(sync);}
 new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true});document.addEventListener('click',schedule,true);window.addEventListener('v1213-word-mounted',schedule);schedule();
})();
