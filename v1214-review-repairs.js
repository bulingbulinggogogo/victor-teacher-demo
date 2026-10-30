/* Narrow Western apostrophe glyphs for the real book, without editing source characters. */
(() => {
  const nativeRender=renderFull;
  const sync=()=>{
    const real=Boolean(getQuestion(state.currentQuestionId)?.realOnly);
    ['fullscreenPage','popover','wordDetailDialog'].forEach(id=>{
      const node=document.getElementById(id);
      if(node && node.dataset.realSource !== String(real)) node.dataset.realSource=String(real);
    });
  };
  renderFull=function(...args){const result=nativeRender(...args);sync();return result;};
  new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});
  sync();
})();
