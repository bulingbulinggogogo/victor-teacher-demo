/* Merge only runtime question/text/timing namespaces; legacy dictionary data remains intact. */
(() => {
  'use strict';
  const book = window.TEST_SINGLE_BOOK;
  if (!book?.prototypeData || !window.PROTOTYPE_DATA || !window.TIMECODES_DATA) return;
  const previous = window.PROTOTYPE_DATA;
  const added = book.prototypeData;
  window.PROTOTYPE_DATA = { ...previous,
    questions: [...previous.questions, ...added.questions],
    textResources: { ...previous.textResources, ...added.textResources },
    resourceQuestionMap: { ...previous.resourceQuestionMap, ...added.resourceQuestionMap }
  };
  window.TIMECODES_DATA = { ...window.TIMECODES_DATA,
    sets: [...window.TIMECODES_DATA.sets, ...book.timecodes.sets] };
  const enhancements = window.DEMO_KNOWLEDGE_ENHANCEMENTS || {};
  window.DEMO_KNOWLEDGE_ENHANCEMENTS = { ...enhancements,
    topicPairs: [...(enhancements.topicPairs || []), ...(book.enhancements.topicPairs || [])] };
})();
