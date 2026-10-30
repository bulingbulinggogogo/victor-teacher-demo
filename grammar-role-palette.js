/* Display taxonomy, not a claimed count of every structure in English. */
(function (root) {
  'use strict';
  const groups = [
    ['subject', '主语', 218, [['subject','主语'],['formal-subject','形式主语'],['real-subject','真正主语'],['subject-clause','主语从句']]],
    ['predicate', '谓语', 270, [['predicate','谓语'],['link-verb','系动词'],['modal-predicate','情态谓语'],['negative-predicate','否定谓语'],['passive-predicate','被动谓语']]],
    ['object', '宾语', 30, [['object','宾语'],['direct-object','直接宾语'],['indirect-object','间接宾语'],['preposition-object','介词宾语'],['formal-object','形式宾语'],['real-object','真正宾语'],['object-clause','宾语从句']]],
    ['complement', '补足语', 132, [['predicative','表语'],['object-complement','宾语补足语'],['subject-complement','主语补足语'],['predicative-clause','表语从句']]],
    ['modifier', '修饰语', 338, [['attribute','定语'],['relative-clause','定语从句'],['nonrestrictive-relative','非限制性定语从句'],['appositive','同位语'],['appositive-clause','同位语从句']]],
    ['adverbial', '状语', 174, [['adverbial','状语'],['time-adverbial','时间状语'],['place-adverbial','地点状语'],['manner-adverbial','方式状语'],['cause-adverbial','原因状语'],['purpose-adverbial','目的状语'],['result-adverbial','结果状语'],['condition-adverbial','条件状语'],['concession-adverbial','让步状语'],['comparison-adverbial','比较状语'],['degree-adverbial','程度状语'],['frequency-adverbial','频率状语'],['accompaniment-adverbial','伴随状语']]],
    ['connector', '连接成分', 54, [['coordinator','并列连词'],['subordinator','从属连词'],['relative-pronoun','关系代词'],['relative-adverb','关系副词']]],
    ['nonfinite', '非谓语形式', 295, [['infinitive','不定式'],['gerund','动名词'],['present-participle','现在分词'],['past-participle','过去分词'],['absolute-construction','独立主格']]]
  ];
  const definitions = groups.flatMap(([family, familyName, hue, rows]) => rows.map(([key,label],i) => ({key,label,family,familyName,hue:hue + i * .9 - (rows.length-1)*.45, saturation:63+(i%3)*5, lightnessShift:(i%4)*.012})));
  const index = new Map(definitions.map(x=>[x.key,x]));
  function classify(label, explicit) {
    if (index.has(explicit)) return explicit;
    const text=String(label||'').replace(/\s/g,'');
    const tests=[
      ['subject-clause',/主语从句/],['object-clause',/宾语从句/],['predicative-clause',/表语从句/],['appositive-clause',/同位语从句/],['nonrestrictive-relative',/非限制.*定语/],['relative-clause',/定语从句/],
      ['object-complement',/宾语补足|宾补/],['subject-complement',/主语补足|主补/],['formal-subject',/形式主语/],['real-subject',/真正主语|真实主语/],['formal-object',/形式宾语/],['real-object',/真正宾语|真实宾语/],['direct-object',/直接宾语/],['indirect-object',/间接宾语/],['preposition-object',/介词宾语/],
      ['time-adverbial',/时间状语/],['place-adverbial',/地点状语/],['manner-adverbial',/方式状语/],['cause-adverbial',/原因状语/],['purpose-adverbial',/目的状语/],['result-adverbial',/结果状语/],['condition-adverbial',/条件状语/],['concession-adverbial',/让步状语/],['comparison-adverbial',/比较状语/],['degree-adverbial',/程度状语/],['frequency-adverbial',/频率状语/],['accompaniment-adverbial',/伴随状语/],
      ['negative-predicate',/谓语.*否定|否定.*谓语/],['passive-predicate',/被动.*谓语|谓语.*被动/],['modal-predicate',/情态/],['link-verb',/系动词/],['subject',/主语/],['predicate',/谓语/],['object',/宾语/],['predicative',/表语/],['appositive',/同位语/],['attribute',/定语|修饰语/],['adverbial',/状语/],
      ['coordinator',/并列连词/],['subordinator',/从属连词/],['relative-pronoun',/关系代词/],['relative-adverb',/关系副词/],['absolute-construction',/独立主格/],['infinitive',/不定式/],['gerund',/动名词/],['present-participle',/现在分词/],['past-participle',/过去分词/]
    ];
    return tests.find(([,pattern])=>pattern.test(text))?.[0] || 'attribute';
  }
  function rgbOfHsl(h,s,l) {
    s/=100;h=((h%360)+360)%360/360;
    const a=s*Math.min(l,1-l), f=n=>{const k=(n+h*12)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1));};
    return [f(0),f(8),f(4)].map(v=>Math.round(255*v));
  }
  const luminance=rgb=>rgb.reduce((sum,c,i)=>{c/=255;return sum+[.2126,.7152,.0722][i]*(c<=.04045?c/12.92:((c+.055)/1.055)**2.4);},0);
  const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  function parseColor(value) {
    const text=String(value||''); const hex=text.match(/^#([\da-f]{6})$/i);
    if(hex)return [0,2,4].map(i=>parseInt(hex[1].slice(i,i+2),16));
    const rgb=text.match(/^rgba?\(\s*(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)/);
    return rgb ? rgb.slice(1,4).map(Number) : null;
  }
  const css=rgb=>'rgb('+rgb.join(', ')+')';
  function colors(key, background) {
    const d=index.get(key)||index.get('attribute'),bg=parseColor(background)||[255,255,255];
    const light=luminance(bg)>.32;let l=(light?.32:.77)+(light?-1:1)*d.lightnessShift,ink,fill,ratio;
    for(let i=0;i<80;i++) {
      ink=rgbOfHsl(d.hue,d.saturation,l);fill=bg.map((x,j)=>Math.round(x*.92+ink[j]*.08));ratio=Math.min(contrast(ink,bg),contrast(ink,fill));
      if(ratio>=4.5)break;
      l=Math.max(.05,Math.min(.97,l+(light?-.009:.009)));
    }
    return {ink:css(ink),fill:css(fill),contrast:ratio,key:d.key,family:d.family};
  }
  function backgroundFor(element) {
    const dialog=element.closest?.('.resource-popover') || element;
    if(typeof getComputedStyle!=='function') return '#ffffff';
    const style=getComputedStyle(dialog);
    return style.getPropertyValue('--lecture-panel').trim() || style.backgroundColor || '#ffffff';
  }
  function apply(element,key) {
    element.dataset.grammarType=key;const color=colors(key,backgroundFor(element));
    element.style.setProperty('--ke-role-color',color.ink);element.style.setProperty('--ke-role-fill',color.fill);
  }
  const api={definitions,classify,colors,contrast,parseColor,apply};
  root.GrammarRolePalette=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
