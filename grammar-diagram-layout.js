/* Measured grammar layout. These helpers operate on display geometry, never source data. */
(() => {
  'use strict';
  function splitToken(token, segments) {
    const cuts = [...new Set([token.start, token.end, ...segments.flatMap(segment => [segment.start, segment.end])])]
      .filter(offset => offset >= token.start && offset <= token.end).sort((a, b) => a - b);
    return cuts.slice(0, -1).map((start, index) => {
      const end = cuts[index + 1];
      return {start, end, text: token.text.slice(start - token.start, end - token.start),
        roles: segments.flatMap((segment, role) => start >= segment.start && end <= segment.end ? [role] : [])};
    });
  }
  function roleForFragment(fragment, selected, segments) {
    return fragment.roles.filter(role => selected.has(role)).sort((a, b) =>
      (segments[a].end - segments[a].start) - (segments[b].end - segments[b].start) || b - a)[0];
  }
  function intervalLanes(items, gap = 8) {
    const lanes = [];
    [...items].sort((a, b) => (a.right - a.left) - (b.right - b.left) || a.left - b.left || (a.role || 0) - (b.role || 0))
      .forEach(item => {
        let lane = 0;
        while ((lanes[lane] || []).some(other => item.left < other.right + gap && item.right + gap > other.left)) lane++;
        (lanes[lane] || (lanes[lane] = [])).push(item);
        item.lane = lane;
      });
    return lanes;
  }
  function semanticIntervalLanes(items, gap = 8) {
    const lanes = [], placed = [];
    const hasRange = item => Number.isFinite(item.sourceStart) && Number.isFinite(item.sourceEnd) && item.sourceEnd > item.sourceStart;
    const span = item => hasRange(item) ? item.sourceEnd - item.sourceStart : item.right - item.left;
    const strictlyContains = (outer, inner) => hasRange(outer) && hasRange(inner)
      && outer.sourceStart <= inner.sourceStart && outer.sourceEnd >= inner.sourceEnd && span(outer) > span(inner);
    [...items].sort((a, b) => span(a) - span(b) || a.left - b.left || (a.role || 0) - (b.role || 0))
      .forEach(item => {
        // Use the whole source segment even when this displayed fragment wraps onto another line.
        // Equal ranges and partial intersections have no inferred parent/child relationship.
        let lane = placed.reduce((minimum, inner) => strictlyContains(item, inner) ? Math.max(minimum, inner.lane + 1) : minimum, 0);
        while ((lanes[lane] || []).some(other => item.left < other.right + gap && item.right + gap > other.left)) lane++;
        (lanes[lane] || (lanes[lane] = [])).push(item);
        item.lane = lane;
        placed.push(item);
      });
    return lanes;
  }
  function planRow({textHeight, fontSize, parts, labels, relations, crossPort}) {
    const gap = Math.max(8, fontSize * .22), step = Math.max(12, fontSize * .34), stub = Math.max(6, fontSize * .16);
    const relationLanes = intervalLanes(relations, gap);
    let above = 0;
    relationLanes.forEach(lane => {
      const labelHeight = Math.max(...lane.map(item => item.height));
      lane.forEach(item => { item.labelY = above; item.arcY = above + labelHeight + gap; });
      above += labelHeight + gap + Math.max(24, fontSize * .65);
    });
    // Cross-line ports get their own blank band, even on a row without a relation label.
    if (crossPort) above = Math.max(above, Math.max(24, fontSize * .65) + gap);
    const bracketLanes = semanticIntervalLanes(parts, Math.max(2, fontSize * .06));
    parts.forEach(part => { part.bracketY = above + textHeight + gap + part.lane * step; part.stub = stub; });
    const bracketBottom = parts.length ? above + textHeight + gap + (bracketLanes.length - 1) * step : above + textHeight;
    const labelLanes = semanticIntervalLanes(labels, gap);
    let cursor = bracketBottom + (parts.length ? gap : 0);
    labelLanes.forEach(lane => {
      lane.forEach(label => { label.y = cursor; });
      cursor += Math.max(...lane.map(label => label.height)) + gap;
    });
    return {above, gap, step, stub, bracketBottom, height: Math.max(cursor, bracketBottom + gap) + gap,
      bracketLaneCount: bracketLanes.length, labelLaneCount: labelLanes.length, relationLaneCount: relationLanes.length};
  }
  function relationPath({from, to, arcY, gutter, gap, lift}) {
    const sx = (from.left + from.right) / 2, tx = (to.left + to.right) / 2;
    const sy = from.top - gap, ty = to.top - gap;
    const sameLine = from.line === to.line;
    if (sameLine) return `M ${sx} ${sy} C ${sx} ${arcY} ${tx} ${arcY} ${tx} ${ty}`;
    const sourceLift = from.line < to.line ? arcY : sy - lift;
    const targetLift = to.line < from.line ? arcY : ty - lift;
    return `M ${sx} ${sy} C ${sx} ${sourceLift} ${gutter} ${sourceLift} ${gutter} ${sourceLift} V ${targetLift} C ${gutter} ${targetLift} ${tx} ${targetLift} ${tx} ${ty}`;
  }
  function leaderPath(part, label, labels, width, gap, bracketBottom) {
    const center = (part.left + part.right) / 2, target = (label.left + label.right) / 2;
    const obstacles = labels.filter(other => other !== label && other.y < label.y);
    const clear = x => !obstacles.some(other => x >= other.left - 3 && x <= other.right + 3);
    const candidates = [center, 0, width, ...obstacles.flatMap(other => [other.left - gap, other.right + gap])]
      .filter(x => x >= 0 && x <= width && clear(x)).sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
    const corridor = candidates[0];
    // A full-width label can leave no corridor. Keep only the short stem rather than cross its text.
    if (corridor === undefined) return `M ${center} ${part.bracketY} V ${bracketBottom + gap / 2}`;
    return `M ${center} ${part.bracketY} V ${bracketBottom + gap / 2} H ${corridor} V ${label.y - gap / 2} H ${target} V ${label.y}`;
  }
  window.GrammarDiagramLayout = Object.freeze({splitToken, roleForFragment, intervalLanes, semanticIntervalLanes, planRow, relationPath, leaderPath});
})();
