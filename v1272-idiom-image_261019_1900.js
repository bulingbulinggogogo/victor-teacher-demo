/* Restore the original, explicitly labelled come-to-light teaching example.
 * This example is not an illustration of "There is no time like the present".
 * Word/block/sense data and original image bytes remain unchanged.
 */
(() => {
  'use strict';
  if(window.V1272IdiomImage)return;
  const api=window.V1220WordDetail;if(!api?.finish)return;
  const source=Object.freeze({
    word:'come to light',meaning:'暴露',blockKey:'demo-present-idiom',senseKey:'latest-sense:present1:2',
    url:'./assets/lexical-ppt/zip-03.gif',
    presentation:'词库配图样例 v5.pptx',slide:32,presentationEntry:'ppt/media/image90.GIF',
    archive:'图片格式.zip',archiveEntry:'图片格式/come to light.gif',
    sha256:'099a4879159e262fb155d3973d61bdd143b2a860605a18d8625e8d5f81acd67f'
  });
  const pending=new WeakSet();
  const isPresent=word=>['present1','present2'].includes(word?.head)||(word?.v1225MergedHeads||[]).some(head=>['present1','present2'].includes(head));
  function originalImage() {
    const entry=window.V1213_PPT_SOURCE?.entries?.[source.word]?.single;
    const asset=window.V1213_PPT_SOURCE?.assets?.find(row=>row.url===entry?.image);
    return entry?.kind==='idiom'&&entry.title===source.word&&entry.image===source.url&&asset?.sha256===source.sha256?entry.image:null;
  }
  function mount(detail,supplied) {
    if(detail?.id!=='wordDetailDialog'||!detail.isConnected)return false;
    const model=api.getModel?.(detail)||supplied;
    if(!isPresent(model?.word))return false;
    const block=[...detail.querySelectorAll('[data-sense-block]')].find(node=>node.dataset.senseBlock===source.blockKey);
    const sense=block?.closest('[data-latest-sense]');
    const card=block?.closest('.v1268-idiom-card,[data-v1264-sense-card="idioms"]');
    const body=card?.querySelector(':scope>.v1264-sense-card-body');
    const imageURL=originalImage();
    if(!body||sense?.dataset.latestSense!==source.senseKey||!imageURL)return false;
    const copies=[...body.querySelectorAll('[data-v1272-idiom-source-example]')];
    if(copies.length){copies.slice(1).forEach(node=>node.remove());return true;}
    const example=document.createElement('figure');
    example.className='v1272-idiom-source-example';
    example.dataset.v1272IdiomSourceExample=source.word;
    example.dataset.v1272BindingScope='teaching-example';
    example.dataset.v1272SourceHead='light';
    example.dataset.v1272SourceSlide=String(source.slide);
    example.dataset.v1272SourceSha256=source.sha256;
    const caption=document.createElement('figcaption');caption.className='v1272-idiom-example-caption';
    const label=document.createElement('span');label.textContent='示例：';
    const word=document.createElement('strong');word.textContent=source.word;
    const meaning=document.createElement('span');meaning.textContent='（'+source.meaning+'）';
    caption.append(label,word,meaning);
    const image=document.createElement('img');
    image.src=imageURL;image.alt='come to light（暴露）的原习语示例图';image.decoding='async';
    example.append(caption,image);body.append(example);
    return true;
  }
  function schedule(detail,supplied) {
    if(detail?.id!=='wordDetailDialog'||pending.has(detail))return;
    pending.add(detail);queueMicrotask(()=>{pending.delete(detail);mount(detail,supplied);});
  }
  const finish=api.finish;
  api.finish=function(detail,result){const value=finish.apply(this,arguments);schedule(detail,result);return value;};
  window.addEventListener('v1213-word-mounted',event=>schedule(event.detail));
  document.addEventListener('click',event=>{
    const pos=event.target.closest?.('#wordDetailDialog [data-vwn-pos]');
    if(pos)schedule(pos.closest('#wordDetailDialog'));
  });
  window.V1272IdiomImage={mount,schedule,source,inspect:()=>{
    const detail=document.getElementById('wordDetailDialog');
    const nodes=[...(detail?.querySelectorAll('[data-v1272-idiom-source-example]')||[])];
    return {count:nodes.length,source,nodes:nodes.map(node=>({
      sourceWord:node.dataset.v1272IdiomSourceExample,scope:node.dataset.v1272BindingScope,
      surroundingSense:node.closest('[data-latest-sense]')?.dataset.latestSense,
      card:node.closest('[data-v1264-sense-card]')?.dataset.v1264SenseCard,
      caption:node.querySelector('figcaption')?.textContent,
      src:node.querySelector('img')?.getAttribute('src'),
      naturalWidth:node.querySelector('img')?.naturalWidth,naturalHeight:node.querySelector('img')?.naturalHeight
    }))};
  }};
  const detail=document.getElementById('wordDetailDialog');if(detail)schedule(detail);
})();

