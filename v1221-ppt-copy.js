/* Display-only correction for one supplied listening example; source data stays intact. */
(() => {
  'use strict';
  if (typeof renderResourceMarkup !== 'function') return;
  const previous = renderResourceMarkup;
  const supplied = 'Sydney and the New South Wales coast have been {hit}by heavy rains.';
  const plainSupplied = 'Sydney and the New South Wales coast have been hitby heavy rains.';
  const corrected = 'Sydney and the New South Wales coast have been {hit} by heavy rains.';
  renderResourceMarkup = function correctedListeningCopy(value) {
    const question = typeof getQuestion === 'function' && typeof state !== 'undefined' ? getQuestion(state.currentQuestionId) : null;
    if (question?.bookKey === 'test-single-book' && typeof value === 'string') {
      const input = value.trim();
      if (input === supplied || input === plainSupplied) value = value.replace(input, corrected);
    }
    return previous(value);
  };
})();
