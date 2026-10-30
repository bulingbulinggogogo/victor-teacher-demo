/* V1.2.19: project existing annotations onto the teaching structures named in the source explanation.
   The source records, complete sentence, wording, and original character offsets stay read-only. */
(() => {
  'use strict';
  const definitions = Object.freeze({
    'explanations:row-6771': {
      sentence: "Let me go over some of the safety rules in the lab so that you know how to act properly while you're here.",
      focus: '祈使句（主句）；so that 目的状语从句',
      evidence: '本句的主句是以 let 开头的祈使句，so that 引导目的状语从句',
      project(segments) {
        return [
          span(segments[0].start, segments[2].end, '祈使句（主句）', 'predicate'),
          copy(segments[3])
        ];
      }
    },
    'test-single-book:standard:p73': {
      sentence: 'I don’t think you’d say that if you’d just driven 400 miles.',
      focus: '主句结果部分；if 条件从句',
      evidence: '从句：if + had done；主句：would + have done',
      project(segments) {
        return [
          // The original object-clause annotation starts at you’d; the if annotation
          // supplies the endpoint of the result part. Only display ranges are derived.
          span(segments[2].start, segments[5].end, '主句（结果部分）', 'object'),
          { ...copy(segments[6]), role: 'if 条件从句' }
        ];
      },
      sourceIssue: '源说明 would + have done 与原句 you’d say 不一致，仍保留原说明，未自行改写。'
    },
    'test-single-book:standard:p716': {
      sentence: 'In the 1940s, Mary Hussey, an American scholar, suggested that they might be about food, but people didn’t believe her until French author Jean Bottéro, in the 1980s, was asked to write an article about cooking in the past.',
      focus: '同位语；that 宾语从句；but 并列连词；not … until 句型；until 时间状语从句',
      evidence: 'but 连接并列复合句；that 引导宾语从句；an American scholar 是同位语；not … until；until 引导状语从句',
      project(segments) {
        return [
          { ...copy(segments[2]), explanation: 'an American scholar是Mary Hussey的同位语。' },
          { ...copy(segments[4]), explanation: '第一个分句包含一个that引导的宾语从句。' },
          { ...copy(segments[5]), explanation: '句子主干：Mary Hussey suggested that… but people didn’t believe her until …。\n这是一个由but连接的并列复合句。' },
          // This source explanation names the whole not … until pattern. Preserve
          // that parent scope as well as the contained until clause, without the
          // internal subject, passive predicate, time phrase or infinitive detail.
          { ...span(segments[7].start, segments[9].end, 'not … until 句型', 'adverbial'), explanation: '第二个分句包含句型：not … until 直到……才……。' },
          { ...copy(segments[9]), explanation: 'until引导状语从句。' }
        ];
      }
    }
  });
  function copy(segment) { return { ...segment }; }
  function span(start, end, role, roleType) {
    return { start, end, role, roleType, displayOnly: true };
  }
  function recordKey(source) {
    if (source.analysisRecordId) return String(source.analysisRecordId);
    return ({ 91: 'explanations:row-6771', 1000073: 'test-single-book:standard:p73', 1000716: 'test-single-book:standard:p716' })[source.analysisRow] || '';
  }
  function project(source) {
    if (!source || !Array.isArray(source.segments)) return source;
    if (source.generatedForInteraction === true && source.generationPolicy === 'user-authorized-current-source-sentence') {
      const valid = source.segments.every(segment => Number.isInteger(segment.start) && Number.isInteger(segment.end) && segment.end > segment.start && source.sentence.slice(segment.start,segment.end) === segment.quote);
      return {...source, segments: valid ? source.segments.map(copy) : [], relations: valid ? (source.relations||[]).map(copy) : [], teachingFocus:{policy:'user-authorized-current-source-sentence',verified:valid,originalCount:source.segments.length,displayedCount:valid?source.segments.length:0}};
    }
    const key = recordKey(source), definition = definitions[key];
    if (!definition || source.sentence !== definition.sentence) return {
      ...source, segments: [], relations: [],
      teachingFocus: { key, policy: 'source-explanation-only', verified: false, originalCount: source.segments.length, displayedCount: 0 }
    };
    const sentence = String(source.sentence);
    const valid = source.segments.every(segment => Number.isInteger(segment.start) && Number.isInteger(segment.end)
      && segment.end > segment.start && sentence.slice(segment.start, segment.end) === segment.quote);
    if (!valid) return { ...source, segments: [], relations: [] };
    const segments = definition.project(source.segments).map(segment => ({
      ...segment, quote: sentence.slice(segment.start, segment.end)
    }));
    const relations = (source.relations || []).filter(relation => {
      const start = Number.isInteger(relation.sourceStart) ? relation.sourceStart : sentence.indexOf(relation.sourceQuote);
      const end = relation.sourceEnd ?? start + String(relation.sourceQuote || '').length;
      return segments.some(segment => segment.start === start && segment.end === end);
    }).map(relation => ({ ...relation }));
    return {
      ...source, segments, relations,
      teachingFocus: {
        key, policy: 'source-explanation-only', verified: true,
        originalCount: source.segments.length, displayedCount: segments.length,
        focus: definition.focus, evidence: definition.evidence,
        sourceIssue: definition.sourceIssue || ''
      }
    };
  }
  window.V1219GrammarFocus = Object.freeze({ project, definitions, policy: 'source-explanation-only' });
})();

