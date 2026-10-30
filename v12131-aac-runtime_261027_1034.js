/* Exact verified original-AAC routing. This module owns no player and changes no source data. */
(() => {
  'use strict';
  const text = value => String(value ?? '').trim();
  const phonetic = value => text(value).replace(/^\/+|\/+$/g,'').replace(/\s+/g,'');
  const manifest = () => window.V1230_AAC_MAP || {};
  const base = () => document.baseURI || window.location?.href || '';
  const strip = value => text(value).replace(/[?#].*$/,'');
  const own = (object,key) => Object.prototype.hasOwnProperty.call(object || {},key);
  let cachedMap = null, cachedBase = '', urlIndex = new Map();
  function verified(record) {
    if (!record || record.verified !== true || !/\.(?:aac|m4a)(?:[?#].*)?$/i.test(text(record.src))) return false;
    const source=record.source || {};
    if (!/^[a-f\d]{64}$/i.test(text(source.sha256)) || !(Number(source.bytes)>0)) return false;
    try {
      const target=new URL(record.src,base()),assets=new URL('./assets/',base());
      return target.href.startsWith(assets.href);
    } catch { return false; }
  }
  function indexURLs() {
    const map=manifest(),currentBase=base();
    if (cachedMap===map && cachedBase===currentBase) return;
    cachedMap=map;cachedBase=currentBase;urlIndex=new Map();
    for (const [key,record] of Object.entries(map.byURL || {})) {
      if (!verified(record)) continue;
      for (const value of [key,...(Array.isArray(record.aliases)?record.aliases:[])]) {
        const exact=strip(value);if(!exact)continue;
        urlIndex.set(exact,record);
        try {urlIndex.set(new URL(exact,currentBase).href,record);} catch {}
      }
    }
  }
  function exactURLRecord(value) {
    indexURLs();
    const exact=strip(value);
    let record=urlIndex.get(exact);
    if (!record) {try {record=urlIndex.get(new URL(exact,base()).href);} catch {}}
    return record || null;
  }
  function resolveURL(value) {
    const original=String(value ?? '');
    // General media routing changes only proven MP3 equivalents. Existing AAC
    // outside the latest display-book pronunciation scope keeps its original URL.
    if (!/\.mp3$/i.test(strip(original))) return original;
    return exactURLRecord(original)?.src || original;
  }
  function resolvePronunciationURL(value) {
    // The display book's older dictionary renderer also emits AAC/M4A. Those
    // pronunciations must come from the same sole source batch as latest slots.
    if (!/\.(?:mp3|aac|m4a)$/i.test(strip(value))) return '';
    for (const key of Object.keys(manifest().blockedURLs || {})) {
      if (strip(key)===strip(value)) return '';
      try {if(new URL(strip(key),base()).href===new URL(strip(value),base()).href)return '';} catch {}
    }
    const record=exactURLRecord(value);
    return verified(record) && approvedPronunciationSource(record) ? record.src : '';
  }
  function slotIdentity(input) {
    const sourceHead=text(input?.sourceHead),normalizedPOS=text(input?.normalizedPOS),accent=text(input?.accent);
    return {sourceHead,normalizedPOS,accent,slotKey:`${sourceHead}|${normalizedPOS}|${accent}`};
  }
  function sameSlot(record,wanted) {
    return record && ['sourceHead','normalizedPOS','accent','slotKey'].every(key=>text(record[key])===wanted[key]);
  }
  function blockedSlot(input) {
    const wanted=slotIdentity(input),blocks=manifest().blockedSlots || {};
    return own(blocks,wanted.slotKey) && sameSlot(blocks[wanted.slotKey],wanted);
  }
  function approvedPronunciationSource(record) {
    const map=manifest(),root=text(map.pronunciationSourceRoot).replace(/\\/g,'/').replace(/\/+$/,'');
    const file=text(record?.source?.file).replace(/\\/g,'/');
    return map.pronunciationPolicy==='current-original-final-aac' && root.endsWith('/【定稿】听力demo音频aac_20261016_1508/单词音频') && !file.split('/').includes('..') && file.startsWith(root+'/');
  }
  function resolveSlot(input) {
    const wanted=slotIdentity(input),slots=manifest().bySlot || {};
    if (!wanted.sourceHead || !['uk','us'].includes(wanted.accent) || blockedSlot(input)) return null;
    let identity=wanted,record=own(slots,wanted.slotKey) ? slots[wanted.slotKey] : null;
    if (!record && wanted.normalizedPOS) {
      // An empty Excel POS stays empty. Only the manifest's independently proven
      // unique dictionary POS may identify it with the current real word part.
      const untyped=slotIdentity({...wanted,normalizedPOS:''});
      const candidate=own(slots,untyped.slotKey) ? slots[untyped.slotKey] : null;
      if (text(candidate?.source?.dictionaryPOS)!==wanted.normalizedPOS || blockedSlot(untyped)) return null;
      identity=untyped;record=candidate;
    }
    if (!sameSlot(record,identity) || !verified(record) || !approvedPronunciationSource(record)) return null;
    if (!identity.normalizedPOS && !text(record.source?.dictionaryPOS) && record.source?.untypedIdentityVerified!==true) return null;
    // A supplied pronunciation stays tied to this exact source record and accent.
    const proven=phonetic(record.source?.phonetic),current=phonetic(input?.phonetic);
    if (proven && (!current || proven!==current)) return null;
    return record;
  }
  window.V1230AAC=Object.freeze({resolveURL,resolvePronunciationURL,resolveSlot,blockedSlot,
    inspect:()=>({byURL:Object.keys(manifest().byURL || {}).length,bySlot:Object.keys(manifest().bySlot || {}).length,
      blockedSlots:Object.keys(manifest().blockedSlots || {}).length,sourcePolicy:'verified-exact-exclusive-pronunciation-batch',pronunciationSourceRoot:manifest().pronunciationSourceRoot || '',ownsPlayer:false})});
})();
