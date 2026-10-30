/* Present word family redrawn from the supplied PPT's selectable text and tree relationships. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sourceNodes = [
    {id:'present', parent:null, level:0, runs:[['present',false]], pos:'v.', meaning:'颁发；授予；赠送；呈现；展示；提出（观点、计划等）；出示；提交；主持'},
    {id:'presence', parent:'present', level:1, runs:[['pres',false],['ence',true]], pos:'n.', meaning:'出席；到场；存在；出现；势力；影响力', note:'-ence=名词后缀，表动作/状态/性质'},
    {id:'presentation', parent:'present', level:1, runs:[['present',false],['ation',true]], pos:'n.', meaning:'介绍（会）；展示（会）；出示；提交；呈现方式；外观；（戏剧等的）上演/演出', note:'-ation=名词后缀，……的行为/状态/结果'},
    {id:'presenter', parent:'present', level:1, runs:[['present',false],['er',true]], pos:'n.', meaning:'主持人；主播', note:'-er=名词后缀，做……的人/物'},
    {id:'represent', parent:'present', level:1, runs:[['re',true],['present',false]], pos:'v.', meaning:'代表；象征；相当于；展现；描绘'},
    {id:'representation', parent:'represent', level:2, runs:[['represent',false],['ation',true]], pos:'n.', meaning:'代表；代理；表现；描绘', note:'-ation=名词后缀，……的行为/状态/结果'},
    {id:'representative', parent:'represent', level:2, runs:[['represent',false],['ative',true]], pos:'adj.', meaning:'有代表性的；典型的', note:'-ative=形容词后缀，有……倾向/性质的'},
    {id:'misrepresent', parent:'represent', level:2, runs:[['mis',true],['represent',false]], pos:'v.', meaning:'不如实地叙述；歪曲', note:'mis-=错误的'}
  ];
  let sequence=0;
  const childrenOf = id => sourceNodes.filter(node=>node.parent===id);
  function noteHTML(node) {
    const note=String(node.note || ''),token=note.match(/^-?[a-z]+-?/i)?.[0];
    return token && node.runs.some(([part,accent])=>accent && part===token.replace(/-/g,''))
      ? `<span class="vft-note-affix">${esc(token)}</span>${esc(note.slice(token.length))}` : esc(note);
  }
  function render(word, familyImage) {
    const head = typeof word === 'string' ? word : word?.head;
    if (head !== 'present2' || !familyImage) return '';
    const prefix='vft-'+(++sequence);
    function nodeHTML(node){
      const children=childrenOf(node.id),id=`${prefix}-${node.id}-children`;
      const label=`<strong>${node.runs.map(([text,accent]) => `<span${accent?' class="vft-affix"':''}>${esc(text)}</span>`).join('')}</strong> <span class="vft-pos">${node.pos}</span>`;
      return `<li class="vft-node vft-level-${node.level}" data-vft-node="${node.id}"${node.parent ? ` data-vft-parent="${node.parent}"` : ''}><div class="vft-node-content"><h5 class="vft-word">${children.length ? `<button type="button" class="vft-toggle" data-vft-toggle="${node.id}" aria-expanded="true" aria-controls="${id}" aria-label="收起${node.id}的词族分支"><span class="vft-toggle-label">${label}</span><span class="vft-toggle-icon" aria-hidden="true">−</span></button>` : label}</h5><p class="vft-meaning">${esc(node.meaning)}</p>${node.note?`<p class="vft-note">${noteHTML(node)}</p>`:''}</div>${children.length ? `<ul class="vft-children" id="${id}" data-vft-children="${node.id}">${children.map(nodeHTML).join('')}</ul>` : ''}</li>`;
    }
    return `<figure class="v1220-family v1222-family-tree" data-latest-family="present2" data-family-renderer="native-text-dom" data-family-source="present词族树.pptx" data-family-node-count="8" data-family-connection-count="7"><figcaption>present 词族树</figcaption><div class="vft-stage"><ul class="vft-nodes">${sourceNodes.filter(node=>!node.parent).map(nodeHTML).join('')}</ul></div></figure>`;
  }
  function toggle(button){
    const node=button.closest('[data-vft-node]'),children=node?.querySelector(':scope > .vft-children');
    if(!children)return;
    const expanded=button.getAttribute('aria-expanded')!=='true';
    button.setAttribute('aria-expanded',String(expanded));
    button.setAttribute('aria-label',`${expanded?'收起':'展开'}${node.dataset.vftNode}的词族分支`);
    children.hidden=!expanded;
    const icon=button.querySelector('.vft-toggle-icon');if(icon)icon.textContent=expanded?'−':'＋';
    window.WordDetailNavigation?.fit?.();
  }
  function inspect(root=document){
    return [...root.querySelectorAll('.v1222-family-tree')].map(tree=>({
      nodes:tree.querySelectorAll('[data-vft-node]').length,
      edges:tree.querySelectorAll('[data-vft-parent]').length,
      visible:[...tree.querySelectorAll('[data-vft-node]')].filter(node=>!node.closest('[hidden]')).map(node=>node.dataset.vftNode),
      branches:[...tree.querySelectorAll('[data-vft-toggle]')].map(button=>({node:button.dataset.vftToggle,expanded:button.getAttribute('aria-expanded')==='true'}))
    }));
  }
  // Native buttons supply Enter/Space activation. DOM branches follow normal flow,
  // so line layout needs no global mutation/resize observer or SVG redraw.
  document.addEventListener('click',event=>{const button=event.target.closest?.('.v1222-family-tree [data-vft-toggle]');if(button)toggle(button);},true);
  window.V1222FamilyTree={render,fit:()=>{},sourceNodes,inspect};
})();
