
/**
 * SemanticGuidancePopup: image-first content viewer.
 * Usage: const popup = new SemanticGuidancePopup({ items, title: '语义点拨' });
 * popup.open(0, triggerButton); popup.previous(); popup.next(); popup.close(); popup.destroy();
 * items contain trusted local media/explanation markup; labels are escaped by the component.
 */
(function(global){
  'use strict';
  let nextId=0;
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon={up:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg>',down:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 10 6 6 6-6"/></svg>',close:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>'};
  class SemanticGuidancePopup {
    constructor({items=[],title='语义点拨'}={}) {
      this.items=items.slice();this.conversionStages=new Map();this.title=title;this.index=0;this.isOpen=false;this.trigger=null;this.inertStates=new Map();this.id='sgp-'+(++nextId);
      this.backdrop=document.createElement('div');this.backdrop.className='sgp-backdrop';this.backdrop.hidden=true;
      this.backdrop.addEventListener('click',event=>this.handleClick(event));
      this.keyHandler=event=>this.handleKeydown(event);
      document.body.append(this.backdrop);
    }
    open(index=0,trigger=document.activeElement) {
      if(!this.items.length)return false;
      this.index=Math.max(0,Math.min(this.items.length-1,Number.isFinite(index)?Math.trunc(index):0));
      if(!this.isOpen){
        this.conversionStages.clear();
        this.trigger=trigger;this.previousOverflow=document.body.style.overflow;
        for(const element of document.body.children){if(element===this.backdrop)continue;this.inertStates.set(element,element.inert);element.inert=true;}
        document.body.style.overflow='hidden';document.addEventListener('keydown',this.keyHandler);this.isOpen=true;
      }
      this.themeOwner=this.trigger?.closest?.('#wordDetailDialog')||document.querySelector('#wordDetailDialog');this.syncTheme();this.themeObserver?.disconnect();this.themeObserver=new MutationObserver(()=>this.syncTheme());if(this.themeOwner)this.themeObserver.observe(this.themeOwner,{attributes:true,attributeFilter:['data-demo-palette','data-theme-kind','style']});
      this.backdrop.hidden=false;this.render();this.focusPanel();return true;
    }
    syncTheme(){
      if(!this.themeOwner)return;const s=getComputedStyle(this.themeOwner);for(let i=0;i<s.length;i++){const key=s[i];if(key.startsWith('--lecture-'))this.backdrop.style.setProperty(key,s.getPropertyValue(key));}this.backdrop.dataset.demoPalette=this.themeOwner.dataset.demoPalette||'light';this.backdrop.dataset.themeKind=this.themeOwner.dataset.themeKind||'light';
    }
    close() {
      if(!this.isOpen)return;
      this.themeObserver?.disconnect();this.isOpen=false;this.backdrop.hidden=true;document.removeEventListener('keydown',this.keyHandler);
      document.body.style.overflow=this.previousOverflow;
      for(const [element,value] of this.inertStates)element.inert=value;
      this.inertStates.clear();
      if(this.trigger?.isConnected)this.trigger.focus({preventScroll:true});
    }
    goTo(index) {
      if(!this.isOpen||!Number.isInteger(index)||index<0||index>=this.items.length)return false;
      this.index=index;this.render();this.focusPanel();return true;
    }
    previous(){return this.goTo(this.index-1);}
    next(){return this.goTo(this.index+1);}
    handleClick(event) {
      // Close only when the actual shaded backdrop was clicked, never an inner element.
      if(event.target===this.backdrop){this.close();return;}
      const button=event.target.closest('button[data-sgp-action]');
      if(!button||button.disabled)return;
      if(button.dataset.sgpAction==='module'){this.goTo(Number(button.dataset.sgpIndex));this.backdrop.querySelector('[data-sgp-action="module"][aria-selected="true"]')?.focus({preventScroll:true});}
      if(button.dataset.sgpAction==='close')this.close();
      if(button.dataset.sgpAction==='previous')this.previous();
      if(button.dataset.sgpAction==='next')this.next();
      if(button.dataset.sgpAction==='derive-action'&&this.conversionStage()===0)this.setConversionStage(1);
      if(button.dataset.sgpAction==='reveal-verb'&&this.conversionStage()===1)this.setConversionStage(2);
      if(button.dataset.sgpAction==='reset-conversion')this.setConversionStage(0);
    }
    handleKeydown(event) {
      if(!this.isOpen)return;
      if(event.key==='Escape'){event.preventDefault();this.close();return;}
      if(event.altKey&&event.key==='ArrowUp'){event.preventDefault();this.previous();return;}
      if(event.altKey&&event.key==='ArrowDown'){event.preventDefault();this.next();return;}
      if(event.target.closest?.('.sgp-module-tabs')&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){const tabs=[...this.backdrop.querySelectorAll('[data-sgp-action="module"]')],current=tabs.indexOf(event.target),next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(current+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;event.preventDefault();tabs[next].click();return;}
      if(event.key!=='Tab')return;
      const buttons=[...this.backdrop.querySelectorAll('button:not(:disabled)')];
      if(!buttons.length)return;
      const first=buttons[0],last=buttons[buttons.length-1],active=document.activeElement;
      if(event.shiftKey&&(active===first||active===this.panel)){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&active===last){event.preventDefault();first.focus();}
    }
    conversionStage(){return this.conversionStages.get(this.index)||0;}
    setConversionStage(stage){
      const interaction=this.items[this.index]?.interaction;
      if(!this.isOpen||interaction?.type!=='noun-to-verb'||!Number.isInteger(stage)||stage<0||stage>2||stage>this.conversionStage()+1)return false;
      this.conversionStages.set(this.index,stage);this.render();
      const nextAction=stage===0?'derive-action':stage===1?'reveal-verb':'reset-conversion';
      this.backdrop.querySelector('[data-sgp-action="'+nextAction+'"]')?.focus({preventScroll:true});return true;
    }
    conversionMedia(item){
      const info=item.interaction,stage=this.conversionStage();
      return `<section class="sgp-conversion" data-conversion-stage="${stage}" aria-label="${escape(item.word)}从名词到动词的推导">
        <div class="sgp-conversion-toolbar"><span class="sgp-conversion-progress">${['观察名词形态','推导动作方式','理解动词含义'][stage]} <small>${stage+1} / 3</small></span><button class="sgp-conversion-reset" data-sgp-action="reset-conversion" ${stage===0?'disabled':''}>重新推导</button></div>
        <figure class="sgp-conversion-noun"><img src="${escape(info.nounImage)}" alt="${escape(info.nounLabel)}的名词原图"><figcaption><b>n.</b> ${escape(info.nounLabel)}</figcaption></figure>
        <div class="sgp-conversion-bridge">${stage===0?'<button class="sgp-discover" data-sgp-action="derive-action" aria-expanded="false">它怎样运动？</button>':`<div class="sgp-conversion-action"><strong>${escape(info.actionLabel)}</strong><span aria-hidden="true">⟶</span></div>`}</div>
        <div class="sgp-conversion-verb">${stage<2?`<div class="sgp-verb-placeholder"><span class="sgp-question" aria-hidden="true">?</span><span>动词含义待推导</span><button class="sgp-discover" data-sgp-action="reveal-verb" aria-expanded="false" ${stage===0?'disabled':''}>揭示动词含义</button></div>`:`<figure><img src="${escape(info.verbImage)}" alt="原动图：${escape(info.verbLabel)}"><figcaption><b>v.</b> ${escape(info.verbLabel)}</figcaption></figure>`}</div>
      </section>`;
    }
    render() {
      const item=this.items[this.index],first=this.index===0,last=this.index===this.items.length-1;
      const interactive=item.interaction?.type==='noun-to-verb',stage=interactive?this.conversionStage():2;
      const media=interactive?this.conversionMedia(item):(item.media||'');
      const sub=interactive&&stage<2?'观察形态，推导动作':item.sub;
      const explanation=interactive&&stage===0?'先观察左侧的名词图，想一想它怎样运动。点击中间的按钮，开始推导。':interactive&&stage===1?'动作方式已经揭示。再想一想：用来描述这种动作的动词，应该表示什么？':item.explain;
      const hasEnglish=String(item.en||'').replace(/<[^>]*>/g,'').trim(),hasChinese=String(item.zh||'').trim();
      const example=stage===2&&(hasEnglish||hasChinese)?`<div class="sgp-example">${hasEnglish?`<p class="sgp-example-en">${item.en}</p>`:''}${hasChinese?`<p class="sgp-example-zh">${escape(item.zh)}</p>`:''}</div>`:'';
      const groups=[...new Set(this.items.map(row=>row.type))],tabs=groups.map(type=>`<button type="button" role="tab" id="${this.id}-module-${this.items.findIndex(row=>row.type===type)}" data-sgp-action="module" data-sgp-index="${this.items.findIndex(row=>row.type===type)}" aria-selected="${type===item.type}" tabindex="${type===item.type?0:-1}" aria-controls="${this.id}-body">${escape(type)}</button>`).join('');
      this.backdrop.innerHTML=`<section class="sgp-panel" role="dialog" aria-modal="true" aria-labelledby="${this.id}-title" tabindex="-1">
        <header class="sgp-header"><h2 class="sgp-title" id="${this.id}-title">${escape(this.title)}</h2><nav class="sgp-module-tabs" role="tablist" aria-label="点拨模块">${tabs}</nav><span class="sgp-counter">${this.index+1} / ${this.items.length}</span><button class="sgp-close" data-sgp-action="close" aria-label="关闭弹窗">${icon.close}</button></header>
        <div class="sgp-body" id="${this.id}-body" role="tabpanel" aria-labelledby="${this.id}-module-${this.items.findIndex(row=>row.type===item.type)}">${media.trim()?`<div class="sgp-media">${media}</div>`:''}<div class="sgp-copy"><div class="sgp-topic"><h3 class="sgp-word">${escape(item.word)}</h3><span class="sgp-subtitle">${escape(sub)}</span></div><p class="sgp-explanation">${explanation||''}</p>${example}</div></div>
        ${this.items.length>1?`<footer class="sgp-footer"><button class="sgp-action" data-sgp-action="previous" aria-label="上一个" ${first?'disabled':''}>${icon.up}<span>上一个</span></button><button class="sgp-action sgp-next" data-sgp-action="next" aria-label="下一个" ${last?'disabled':''}><span>下一个</span>${icon.down}</button></footer>`:''}
        <span class="sgp-status" role="status" aria-live="polite">第${this.index+1}个，共${this.items.length}个。${escape(item.type)}，${escape(item.word)}${interactive?'，'+['观察名词形态','推导动作方式','理解动词含义'][stage]:''}</span></section>`;
      this.panel=this.backdrop.querySelector('.sgp-panel');
    }
    focusPanel(){this.panel?.focus({preventScroll:true});}
    destroy(){this.close();this.backdrop.remove();}
  }
  global.SemanticGuidancePopup=SemanticGuidancePopup;
})(window);
