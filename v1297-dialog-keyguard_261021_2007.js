/* Keep Escape scoped to the topmost entry-settings dialog. */
window.addEventListener('keydown',event=>{const dialog=document.querySelector('.v1297-entry-dialog[open]');if(event.key!=='Escape'||!dialog)return;event.preventDefault();event.stopImmediatePropagation();dialog.dispatchEvent(new Event('cancel',{cancelable:true}));},true);
