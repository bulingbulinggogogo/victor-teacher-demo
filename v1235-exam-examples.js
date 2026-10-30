/* The meeting-approved question-type bar replaces V1.2.35's examples-only rule. */
(() => {
  'use strict';
  function refresh(detail = document.getElementById('wordDetailDialog')) {
    if (!detail) return;
    const model = window.V1220WordDetail?.getModel?.(detail);
    if (model) window.V1227ExamNavigation?.mount?.(detail, model);
  }
  window.V1235ExamExamples = { refresh };
  refresh();
})();
