/* V1.2.113 — decorate existing source nodes; preserve their text and bound actions. */
(()=>{'use strict';const popup=document.getElementById('popover');if(!popup)return;let frame=0;
function refresh(){frame=0;if(popup.classList.contains('hidden')||!popup.querySelector('[data-v105-vocabulary]'))return;
 const size=parseFloat(getComputedStyle(popup).getPropertyValue('--full-font-size'))||48;
 const scale=String(size/48);if(popup.style.getPropertyValue('--v113-scale')!==scale)popup.style.setProperty('--v113-scale',scale);
 popup.querySelectorAll('[data-v105-vocabulary] .resource-sense-meta>span:first-child').forEach(n=>{if(/^(?:v[ti]?|n|adj|adv|prep|pron|conj|aux|interj|det|num|art|modal)\.?$/i.test(n.textContent.trim())&&!n.classList.contains('v113-pos-code'))n.classList.add('v113-pos-code');});
 popup.querySelectorAll('.v105-primary,.v105-contrast,.v105-sense-heading .ke-word-more').forEach(n=>{if(!n.hasAttribute('aria-label'))n.setAttribute('aria-label',n.textContent.trim());});
}
const schedule=()=>{if(!frame)frame=requestAnimationFrame(refresh);};
new MutationObserver(schedule).observe(popup,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});schedule();
})();
