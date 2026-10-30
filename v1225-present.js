/* V1.2.25: join the two supplied present heads only in the detail view.
 * All raw records, source keys, sense IDs, and independent examples remain unchanged. */
(() => {
  'use strict';
  const HEADS=['present1','present2'];
  const cache=new WeakMap();
  const isPresent=word=>HEADS.includes(word?.head);
  const sourceWord=(word,record)=>{
    const head=record?.v1225OriginalHead;
    return head && word?.v1225MergedHeads ? window.SINGLE_BOOK_LATEST_WORD_DATA?.wordsByHead?.[head] || word : word;
  };
  function viewWord(word){
    if(!isPresent(word))return word;
    if(cache.has(word))return cache.get(word);
    const byHead=window.SINGLE_BOOK_LATEST_WORD_DATA?.wordsByHead;
    if(!HEADS.every(head=>byHead?.[head]))return word;
    const originals=HEADS.map(head=>byHead[head]),canonical=byHead.present2,partGroups=new Map();
    originals.forEach(original=>(original.parts||[]).forEach(part=>{
      const key=String(part.partOfSpeech||'').replace(/\./g,'').trim().toLowerCase();
      if(!partGroups.has(key))partGroups.set(key,{...part,partOfSpeech:part.partOfSpeech,senses:[],v1225SourceParts:[]});
      const group=partGroups.get(key);group.v1225SourceParts.push({head:original.head,part});
      (part.senses||[]).forEach(sense=>group.senses.push({...sense,v1225OriginalHead:original.head}));
    }));
    const cloneRows=field=>originals.flatMap(original=>(original[field]||[]).map(record=>({...record,v1225OriginalHead:original.head})));
    const merged={...canonical,head:'present2',word:'present',displayWord:'present',
      v1225MergedHeads:HEADS.slice(),v1225EntryHead:word.head,relatedHeads:[],parts:[...partGroups.values()],
      pronunciations:cloneRows('pronunciations'),inflections:cloneRows('inflections'),collocations:cloneRows('collocations'),
      semanticNotes:cloneRows('semanticNotes'),formationNotes:cloneRows('formationNotes'),
      examples:cloneRows('examples'),listeningExamples:cloneRows('listeningExamples'),textbookExamples:cloneRows('textbookExamples'),
      formationAttachments:originals.flatMap(original=>original.formationAttachments||[]).filter((record,index,rows)=>rows.findIndex(row=>row.attachmentKey===record.attachmentKey)===index),
      v1225OriginalWords:originals
    };
    cache.set(word,merged);return merged;
  }
  function graphicOptions(options){
    const raw=window.V1220WordDetail?.resolve?.(options?.entry,options?.item,options?.context);
    if(!isPresent(raw))return options;
    const canonical=window.SINGLE_BOOK_LATEST_WORD_DATA.wordsByHead.present2;
    const id=canonical.primaryCurrentWordId;
    if(!id)return options;
    // The original PPT is explicitly attached to present2 / 3452. Both detail
    // entry points must retain it, without moving it into either raw record.
    return {...options,entry:{...options.entry,word:'present2',word_id:id},
      context:{...options.context,word:{...options.context?.word,id,word:'present2',bookKey:'test-single-book'}}};
  }
  if(window.V1213Illustrations?.create){
    const create=window.V1213Illustrations.create;
    window.V1213Illustrations.create=options=>create(graphicOptions(options));
  }
  window.V1225Present={isPresent,viewWord,sourceWord,graphicOptions};
})();
