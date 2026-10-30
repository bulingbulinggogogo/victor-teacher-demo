/* Source circled numbers remain in the source; visibility follows the existing clue toggle. */
(() => {
  'use strict';
  const old=renderTranscript;
  renderTranscript=function(q){
    const result=old(q);if(!q?.realOnly)return result;
    const active=state.activeKnowledgeType==='线索定位';
    const marker=String.fromCodePoint(0x2460+Number(q.questionNo)-1);
    const roots=[...els.transcript.querySelectorAll('[data-play-segment],.turn-translation')];
    roots.forEach(root=>{
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];
      while(walker.nextNode())if(/[①-⑳]/.test(walker.currentNode.data)&&!walker.currentNode.parentElement.closest('.v13-source-clue-marker,.demo-clue-number'))nodes.push(walker.currentNode);
      nodes.forEach(node=>{
        const fragment=document.createDocumentFragment();let last=0;
        for(const match of node.data.matchAll(/[①-⑳]/g)){
          fragment.append(document.createTextNode(node.data.slice(last,match.index)));
          const span=document.createElement('span');span.className='v13-source-clue-marker';span.textContent=match[0];
          span.hidden=!(active&&match[0]===marker&&!root.classList.contains('turn-translation'));fragment.append(span);last=match.index+1;
        }
        fragment.append(document.createTextNode(node.data.slice(last)));node.replaceWith(fragment);
      });
      if(active&&!root.classList.contains('turn-translation'))root.querySelectorAll('.v13-source-clue-marker:not([hidden])').forEach(span=>{
        if(span.closest('.demo-clue'))return;
        let next=span.nextSibling;while(next&&next.nodeType===3&&!next.textContent.trim())next=next.nextSibling;
        if(next?.nodeType===1&&next.matches('.demo-clue'))next.prepend(span);
      });
    });return result;
  };
})();
