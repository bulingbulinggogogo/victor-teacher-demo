/* V1.2.15: sentence text keeps the outermost selected source range's color. */
(() => {
  'use strict';
  function roleForFragment(fragment, selected, segments) {
    // Ranges come from the existing source annotations. A child can still show its
    // own bracket/label, but cannot recolor text inside a selected outer range.
    return fragment.roles.filter(role => selected.has(role)).sort((a, b) =>
      (segments[b].end - segments[b].start) - (segments[a].end - segments[a].start) || b - a)[0];
  }
  function install() {
    const layout = window.GrammarDiagramLayout;
    if (!layout || layout.roleForFragment === roleForFragment) return Boolean(layout);
    // Only replace text ownership; geometry, all marks, roles and multi-select stay native.
    window.GrammarDiagramLayout = Object.freeze({ ...layout, roleForFragment });
    window.V1215GrammarColor = Object.freeze({ roleForFragment, policy: 'outermost-selected-source-range' });
    return true;
  }
  if (!install()) document.addEventListener('DOMContentLoaded', install, { once: true });
})();
