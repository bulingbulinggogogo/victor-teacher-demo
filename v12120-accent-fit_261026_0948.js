/* Match accent-label ink height to its own unchanged pronunciation glyphs. */
(()=>{'use strict';const popup=document.getElementById('popover');if(!popup)return;
const ctx=document.createElement('canvas').getContext('2d');if(!ctx)return;let cache=new WeakMap(),frame=0;
function metrics(node,size){const s=getComputedStyle(node);ctx.font=s.fontStyle+' '+s.fontWeight+' '+size+'px '+s.fontFamily;return ctx.measureText(node.textContent.trim())}
const height=m=>m.actualBoundingBoxAscent+m.actualBoundingBoxDescent;
const center=m=>(m.fontBoundingBoxAscent-m.fontBoundingBoxDescent-m.actualBoundingBoxAscent+m.actualBoundingBoxDescent)/2;
function put(n,key,value){if(n.style.getPropertyValue(key)!==value)n.style.setProperty(key,value)}
function update(){frame=0;if(!popup.classList.contains('v105-vocabulary')||popup.classList.contains('hidden'))return;
 popup.querySelectorAll('.v105-word-header .resource-pronunciation-item').forEach(item=>{const label=item.querySelector('b'),ipa=item.querySelector('em');if(!label||!ipa||!/[英美]/.test(label.textContent))return;
 const ps=getComputedStyle(ipa),ls=getComputedStyle(label),key=[ipa.textContent,label.textContent,ps.font,ls.fontFamily,ls.fontWeight,ls.fontStyle].join('|');if(cache.get(label)===key)return;
 const target=metrics(ipa,parseFloat(ps.fontSize)),sample=metrics(label,100),h=height(target),unit=height(sample)/100;if(!Number.isFinite(h)||h<=0||unit<=0)return;
 const size=Math.round(h/unit*1000)/1000,labelMetrics=metrics(label,size);const shift=center(target)-center(labelMetrics);
 put(label,'--v120-accent-size',size+'px');put(label,'--v120-accent-line-height',ps.lineHeight);put(label,'--v120-accent-shift',(Number.isFinite(shift)?shift.toFixed(3):'0')+'px');cache.set(label,key);
 });
}
function schedule(){if(!frame)frame=requestAnimationFrame(update)}
new MutationObserver(schedule).observe(popup,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','style','hidden']});
window.addEventListener('resize',schedule);document.fonts?.ready.then(()=>{cache=new WeakMap();schedule()});document.fonts?.addEventListener('loadingdone',()=>{cache=new WeakMap();schedule()});schedule();window.V12120AccentFit=Object.freeze({refresh(){cache=new WeakMap();schedule()}});
})();
