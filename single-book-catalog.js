/* V1.2.13: one real-source book in the existing book workbench.
 * Scope adapters only; original renderers, classes, tabs and event flows remain.
 * 990001 is an internal runtime set index, not a source business identifier.
 */
(() => {
  'use strict';
  const book = window.TEST_SINGLE_BOOK;
  if (!book || window.SingleBookCatalog) return;
  const realKey = 'test-single-book';
  const legacyKey = 'legacy-book';
  const legacyGroups = [...BOOK_CATALOG_GROUPS];
  const realGroups = [{ code: '--', title: '', sets: [{
    setId: Number(book.setId), sourceSetId: Number(book.setId),
    name: book.name, available: true, bookKey: realKey
  }] }];
  const original = {
    renderSchoolBookSummary, renderBookOverview, renderBookDetail,
    renderBookOverviewSets, bookCatalogSourceSet, bookSetIsGraded,
    bookCatalogClassActivity, normalizeBookScore, formatBookScore,
    formatBookScoreValue, renderBookOverviewMetricCards,
    renderBookOverviewCharts, bookOverviewRingOption,
    bookOverviewAbilityValue, bookAverageScoreDistribution,
    bookStudentTrendData, bookStudentAbilityItems,
    bookKnowledgeFilterResourceItems, bookStudentRows
  };
  const isRealBook = () => state.activeBookKey === realKey;
  const missing = value => value === null || value === undefined || value === '';
  const fields = Object.keys(state).filter(key => key.startsWith('book') && key !== 'bookClassName');
  const copy = value => value instanceof Set ? new Set(value) : value;
  const savedScopes = new Map();
  const identityCards = [...document.querySelectorAll(
    '#bookOverviewPage .book-workbench-identity-card,#bookDetailPage .book-workbench-identity-card'
  )].map(card => ({ card, title: card.querySelector('h2')?.textContent || '',
    image: card.querySelector('img'), src: card.querySelector('img')?.getAttribute('src') || '',
    alt: card.querySelector('img')?.getAttribute('alt') || '',
    meta: card.querySelector('.book-workbench-identity-meta'),
    metaHTML: card.querySelector('.book-workbench-identity-meta')?.innerHTML || ''
  }));
  const cover = document.querySelector('[data-book-key="test-single-book"] .school-book-cover')
    ?.getAttribute('src') || '';
  function installGroups(key) {
    const groups = key === realKey ? realGroups : legacyGroups;
    BOOK_CATALOG_GROUPS.splice(0, BOOK_CATALOG_GROUPS.length, ...groups);
  }
  function inScope(key, action) {
    const previous = state.activeBookKey;
    state.activeBookKey = key;
    installGroups(key);
    try { return action(); } finally {
      state.activeBookKey = previous;
      installGroups(previous);
    }
  }
  // Reference-class fixtures are retained for the original book only.
  function withoutReference(action) {
    if (!isRealBook()) return action();
    const previous = BOOK_OVERVIEW_REFERENCE.className;
    BOOK_OVERVIEW_REFERENCE.className = '__real_single_book_no_fixture__';
    try { return action(); } finally { BOOK_OVERVIEW_REFERENCE.className = previous; }
  }
  function syncIdentity() {
    const real = isRealBook();
    identityCards.forEach(({card,title,image,src,alt,meta,metaHTML}) => {
      card.dataset.bookKey = real ? realKey : legacyKey;
      const heading = card.querySelector('h2');
      if (heading) heading.textContent = real ? book.name : title;
      if (image) {
        if (real && !cover) image.removeAttribute('src');
        else image.setAttribute('src', real ? cover : src);
        image.hidden = real && !cover;
        image.setAttribute('alt', real ? `${book.name}封面` : alt);
      }
      if (meta) {
        meta.innerHTML = metaHTML;
        if (real) {
          const expiry = [...meta.children].find(node => node.querySelector('[data-icon="calendar"]'));
          if (expiry) {
            const calendar = expiry.querySelector('[data-icon="calendar"]')?.outerHTML || '';
            expiry.innerHTML = `${calendar}有效期至：--`;
          }
        }
      }
    });
  }
  function selectBook(key) {
    key = key === realKey ? realKey : legacyKey;
    const previous = state.activeBookKey || legacyKey;
    if (previous !== key) {
      savedScopes.set(previous, Object.fromEntries(fields.map(field => [field, copy(state[field])])));
      const saved = savedScopes.get(key);
      if (saved) Object.entries(saved).forEach(([field,value]) => { state[field] = copy(value); });
      else {
        state.bookSelectedSetIds = new Set();
        state.bookSelectedQuestionIds = new Set();
        state.bookActiveSetId = key === realKey ? Number(book.setId) : 14255;
        state.bookCatalogGroupCode = key === realKey ? realGroups[0].code : legacyGroups[0].code;
        state.bookOverviewTab = 'catalog';
        state.bookOverviewUnit = 'all';
        state.bookOverviewSelectedSetId = 'all';
        state.bookOverviewSetDetailId = null;
        state.bookOverviewSetDetailStudentId = null;
        state.bookOverviewStudentId = null;
        state.bookOverviewStudentSetPage = 1;
        state.bookOverviewSetStudentPage = 1;
        state.bookOverviewSetQuestionPage = 1;
        state.bookOverviewMistakeUnit = 'all';
        state.bookOverviewMistakeSetId = 'all';
        state.bookKnowledgeUnit = 'all';
        state.bookKnowledgeSetId = 'all';
        state.bookAssignmentUnit = 'all';
        state.bookAssignmentSetId = 'all';
        state.bookDetailView = 'catalog';
        state.bookQuestionMode = 'sets';
        state.bookQuestionTypeFilters = new Set(['短对话','长对话','独白']);
        state.bookQuestionPointFilter = 'all';
        state.bookActiveQuestionId = null;
        state.bookBasketExpandedTypes = new Set();
      }
      if (typeof resetBookQuestionAudio === 'function') resetBookQuestionAudio();
    }
    state.activeBookKey = key;
    installGroups(key);
    syncIdentity();
    return key;
  }
  bookCatalogSourceSet = function(record) {
    if (!isRealBook()) return original.bookCatalogSourceSet(record);
    const candidate = typeof record === 'object' ? record : catalogSetRecord(record);
    const id = Number(candidate?.sourceSetId || candidate?.setId);
    return id === Number(book.setId) ? bookSetById(id) : null;
  };
  bookSetIsGraded = function(setId,className) {
    return Number(setId) === Number(book.setId) ? false : original.bookSetIsGraded(setId,className);
  };
  bookCatalogClassActivity = function(record,className,graded) {
    return isRealBook() ? {answered:0,total:0,percent:0,latest:'--'}
      : original.bookCatalogClassActivity(record,className,graded);
  };
  renderBookOverviewSets = function(...args) {
    const html = original.renderBookOverviewSets(...args);
    // Keep the original table markup and replace unavailable source counts only.
    return isRealBook() ? html.replace(/<span><b>0<\/b>\/0<\/span>/g,'<span><b>--</b>/--</span>') : html;
  };
  normalizeBookScore = function(value,...args) {
    return isRealBook() && missing(value) ? '--' : original.normalizeBookScore(value,...args);
  };
  formatBookScore = function(value,...args) {
    return isRealBook() && missing(value) ? '--' : original.formatBookScore(value,...args);
  };
  formatBookScoreValue = function(value,...args) {
    return isRealBook() && missing(value) ? '--' : original.formatBookScoreValue(value,...args);
  };
  bookAverageScoreDistribution = function(...args) {
    return isRealBook() ? [] : original.bookAverageScoreDistribution(...args);
  };
  bookStudentTrendData = function(...args) {
    return isRealBook() ? [] : original.bookStudentTrendData(...args);
  };
  bookStudentAbilityItems = function(...args) {
    return isRealBook() ? [] : original.bookStudentAbilityItems(...args);
  };
  bookStudentRows = function(set,className,forceGraded) {
    return original.bookStudentRows(set,className,
      Number(set?.setId) === Number(book.setId) ? false : forceGraded);
  };
  bookKnowledgeFilterResourceItems = function(items,...args) {
    return isRealBook() ? items.map(item => ({...item,rows:[]}))
      : original.bookKnowledgeFilterResourceItems(items,...args);
  };
  bookOverviewAbilityValue = function(items,label) {
    return isRealBook() && !(items || []).some(item => Number.isFinite(item.rate))
      ? null : original.bookOverviewAbilityValue(items,label);
  };
  bookOverviewRingOption = function(value,color,track,fontSize,label) {
    const option = original.bookOverviewRingOption(value,color,track,fontSize,label);
    if (isRealBook()) {
      option.title.text = label ? `{value|--}\n{label|${label}}` : '--';
      option.tooltip = { ...(option.tooltip || {}), show:false };
      option.aria = { ...(option.aria || {}), enabled:false };
    }
    return option;
  };
  renderBookOverviewMetricCards = function(...args) {
    const html = withoutReference(() => original.renderBookOverviewMetricCards(...args));
    if (!isRealBook()) return html;
    const fragment=document.createElement('div');fragment.innerHTML=html;
    const progress=fragment.querySelector('.is-progress .book-overview-progress-copy strong');
    if (progress) progress.innerHTML=`-- / ${allBookCatalogSets().length}<em>套</em>`;
    const maximum=fragment.querySelector('.is-score .book-overview-value-body strong em');
    if (maximum) maximum.textContent='/ --分';
    return fragment.innerHTML.replace(/正确率 null%/g,'正确率 --');
  };
  renderBookOverviewCharts = function(...args) {
    return withoutReference(() => original.renderBookOverviewCharts(...args));
  };
  renderBookOverview = function(...args) {
    syncIdentity();
    return withoutReference(() => original.renderBookOverview(...args));
  };
  renderBookDetail = function(...args) {
    syncIdentity();
    return original.renderBookDetail(...args);
  };
  function renderRealSummary() {
    const container = document.getElementById('testSingleBookClassSummary');
    if (!container) return;
    // This is the original summary-row markup with real empty metrics.
    // Reuse the teacher account's existing class controls. Do not fabricate
    // book-level completion metrics or class associations from a new fixture.
    const rows = [...document.querySelectorAll('#schoolBookClassSummary [data-book-class-detail]')];
    container.replaceChildren(...rows.map(source => {
      const row=source.cloneNode(true);
      row.querySelector('.school-book-class-header em').textContent='--';
      row.querySelector('.school-book-progress-row b').textContent='已作答 -- / 1 套';
      const progress=row.querySelector('.school-book-progress');
      progress.setAttribute('aria-label','未提供班级作答数据');
      progress.querySelector('i').style.width='0%';
      return row;
    }));
    container.querySelectorAll('[data-book-class-detail]').forEach(button => {
      button.addEventListener('click', () => {
        selectBook(realKey);
        openBookOverviewForClass(button.dataset.bookClassDetail,'catalog');
      });
    });
  }
  renderSchoolBookSummary = function(...args) {
    inScope(legacyKey, () => original.renderSchoolBookSummary(...args));
    renderRealSummary();
  };
  state.activeBookKey = state.activeBookKey || legacyKey;
  installGroups(state.activeBookKey);
  window.SingleBookCatalog = {selectBook, syncIdentity};
  renderSchoolBookSummary();
  syncIdentity();
})();
