/* Local, idempotent reveal binding. Existing application owners may use CSS/HTML only. */
(function(global){
  'use strict';
  const mounted=new WeakMap();
  function setButton(button,visible){
    button.setAttribute('aria-expanded',String(visible));
    button.querySelector('.hint-text').setAttribute('aria-hidden',String(!visible));
    button.setAttribute('aria-label',(visible?'遮住':'揭示')+(button.closest('[data-word]')?.dataset.word||'')+'的辨析提示');
  }
  const api={
    mount(root){
      if(!root||mounted.has(root))return;
      const handler=event=>{const button=event.target.closest('.hint-toggle');if(!button||!root.contains(button))return;setButton(button,button.getAttribute('aria-expanded')!=='true');};
      root.addEventListener('click',handler);mounted.set(root,handler);
    },
    setAll(root,visible){root?.querySelectorAll('.hint-toggle').forEach(button=>setButton(button,Boolean(visible)));},
    destroy(root){const handler=mounted.get(root);if(handler){root.removeEventListener('click',handler);mounted.delete(root);}}
  };
  global.ContrastReveal=api;
})(window);
