/* Teacher Demo V1.2 knowledge dialogs. Load after app.js; source data stays read-only. */
(() => {
  "use strict";
  const data = () => window.DEMO_KNOWLEDGE_ENHANCEMENTS || {};
  const grammarFor = item => matchRow(window.V1214_GRAMMAR_STRUCTURES?.grammarStructures, item) || matchRow(data().grammarStructures, item);
  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const records = new Map();
  let recordSequence = 0;
  const popup = document.getElementById("popover");
  if (!popup || typeof resourceItemDetail !== "function") return;
  const originalDetail = resourceItemDetail;
  const originalBind = bindResourcePopoverInteractions;
  const originalClose = closeResourcePopover;
  const originalShow = showResourcePopover;
  const originalCollection = showResourceCollectionPopover;
  const expandedIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/></svg>';
  const modalIDs = ["paperSetupDialog", "addMaterialDialog", "bookAssignmentDialog", "appDialog", "fullOptionStudentDialog", "passwordResetDialog", "studentEditDialog", "popover", "wordDetailDialog", "lexicalChunkDialog"];
  const visible = (element) => element && !element.classList.contains("hidden") && !element.hidden && getComputedStyle(element).display !== "none";
  const testKnowledgeTypes = new Set(["微技能", "百科知识"]);
  const imageStates = new WeakMap();
  let imageFitFrame = 0;
  let knowledgeLayoutHome = null;
  let knowledgeFocusPending = false;
  const escape = (value) => escapeHtml(String(value ?? ""));
  const matchRow = (collection, item) => (collection || []).find((row) => Number(row.analysisRow) === Number(item.analysisRow || item.sourceAnalysisRow) || (row.analysisRecordId && String(row.analysisRecordId) === String(item.analysisRecordId || item.id)));
  const vocabItems = (item) => Array.isArray(item.content) ? item.content : ensureType(item) === "语音" && item.word ? [{ word: item.word, word_id: item.wordId, part_id: item.partId, sense_id: item.senseId, part_of_speech: item.partOfSpeech }] : [];
  function ensureType(item) {
    return item.resourceType || libraryResourceForItem(item)?.resourceType || "";
  }
  function completeExplanations(item, html) {
    const source = libraryResourceForItem(item);
    const alreadyRendered = Array.isArray(item.content)
      ? item.explainOne || item.explainTwo || ""
      : typeof item.content === "string" ? item.content : source?.content || "";
    const unique = new Set([String(alreadyRendered).trim()]);
    const remaining = [item.explainOne, item.explainTwo].filter((value) => {
      const content = String(value || "").trim();
      if (!content || unique.has(content)) return false;
      unique.add(content);
      return true;
    });
    return html + remaining.map((value) => `<section class="knowledge-explanation is-unlabeled ke-extra-explanation"><p>${renderResourceMarkup(value)}</p></section>`).join("");
  }
  // Only split a complete English sentence followed by its Chinese translation.
  // A note beginning with "wish 后..." must remain a note, never a source sentence.
  function grammarIntro(item, grammar) {
    const source = libraryResourceForItem(item);
    const raw = String(typeof item.content === "string" && item.content.trim()
      ? item.content : source?.content || grammar?.explanation || "").trim();
    const lines = raw.split(/\r?\n/);
    const first = (lines[0] || "").replace(/^###([\s\S]*)###$/, "$1").replace(/\*update\*/g, "").trim();
    const pair = first.match(/^([\s\S]+?[.!?]["'’”)]*)\s+([\u3400-\u9fff][\s\S]*)$/);
    const plain = value => String(value || "").replace(/###|\*\*|\$\$|[{}@]/g, "").trim();
    const sentence = grammar?.sentence || (pair ? plain(pair[1]) : item.prominent || item.highlightTarget || "");
    let english = pair ? pair[1] : sentence;
    let translation = grammar?.translation || item.sentenceTranslation || (pair ? pair[2] : "");
    let explanation = pair ? lines.slice(1).join("\n").trim() : raw;
    if (!pair && sentence && plain(first) === plain(sentence)) {
      explanation = lines.slice(1).join("\n").trim();
      const next = explanation.split(/\r?\n/)[0];
      if (!translation && /^[\u3400-\u9fff]/.test(next) && !/^(分析|句子主干|主句|从句|句型|本句|该句)/.test(next)) {
        translation = next;
        explanation = explanation.slice(next.length).trim();
      }
    }
    return { raw, sentence, english, translation, explanation };
  }
  function grammarPairMarkup(intro) {
    return `<div class="ke-grammar-pair">${intro.english ? `<p class="ke-grammar-source">${renderResourceMarkup(intro.english)}</p>` : ""}${intro.translation ? `<p class="ke-grammar-translation">${renderResourceMarkup(intro.translation)}</p>` : ""}</div>`;
  }
  // Keep the original resource layout and image/video components. A supplied
  // image is independent teaching content; a videoCover remains only a poster.
  function resourceLayoutWithIndependentMedia(item, html, type) {
    const source = libraryResourceForItem(item);
    const reviewImage = type === "词汇" ? item.reviewExplanationImage || source?.reviewExplanationImage || "" : "";
    let media = resourceMediaDetail(item, []);
    if (!media && reviewImage && knowledgeAssetAvailable("images", reviewImage)) {
      media = `<aside class="resource-media-panel">${renderResourceImageFrame(reviewImage, item.reviewExplanationImageAlt || source?.reviewExplanationImageAlt || "说明配图")}</aside>`;
    }
    if (!media) return html;
    const holder = document.createElement("div"); holder.innerHTML = html;
    let layout = type === "语法" ? null : holder.querySelector(":scope > .resource-detail-layout,:scope > .ke-topic-layout");
    if (!layout) {
      if (type === "语法") {
        holder.querySelectorAll(".resource-media-panel").forEach(panel => panel.remove());
        [...holder.querySelectorAll(".resource-detail-copy,.resource-detail-layout")].reverse().forEach(node => node.replaceWith(...node.childNodes));
      }
      layout = document.createElement("div"); layout.className = "resource-detail-layout has-media";
      const copy = document.createElement("div"); copy.className = "resource-detail-copy";
      while (holder.firstChild) copy.append(holder.firstChild);
      layout.append(copy); layout.insertAdjacentHTML("beforeend", media); holder.append(layout);
    } else if (!layout.querySelector(":scope > .resource-media-panel")) {
      // The native speech layout contains a copy column but no media panel.
      // Supply its explicit image/video through the same original media renderer.
      layout.insertAdjacentHTML("beforeend", media);
      layout.classList.add("has-media");
    }
    const image = item.imageUrl || item.image || source?.image || reviewImage || "";
    const panel = layout.querySelector(":scope > .resource-media-panel");
    if (image && panel?.querySelector("video") && !panel.querySelector(".resource-image-frame")) {
      panel.insertAdjacentHTML("beforeend", renderResourceImageFrame(image, item.title || source?.title || "讲解配图"));
    }
    return holder.innerHTML;
  }
  resourceItemDetail = function knowledgeItemDetail(item) {
    const key = String(++recordSequence);
    records.set(key, item);
    const type = ensureType(item);
    let html = completeExplanations(item, originalDetail(item));
    const grammar = type === "语法" ? grammarFor(item) : null;
    const topic = type === "话题词汇" ? matchRow(data().topicPairs, item) : null;
    if (type === "语法") {
      const intro = grammarIntro(item, grammar);
      const noteItem = { ...item, content: intro.explanation };
      for (const field of ["explainOne", "explainTwo"]) {
        if (String(noteItem[field] || "").trim() === intro.raw) noteItem[field] = intro.explanation;
      }
      const notes = intro.explanation || noteItem.explainOne || noteItem.explainTwo
        ? completeExplanations(noteItem, originalDetail(noteItem)) : "";
      if ((item.resourceSubtypeLabel || libraryResourceForItem(item)?.resourceSubtypeLabel) === '长难句' && grammar && grammar.sentence && Array.isArray(grammar.segments) && grammar.segments.length) {
        html = `<div class="ke-grammar" data-grammar-record="${key}" data-grammar-sentence="${escape(intro.sentence)}">${grammarPairMarkup(intro)}</div>${notes ? `<section class="ke-grammar-description">${notes}</section>` : ""}`;
      } else {
        html = `<section class="ke-grammar-basic">${grammarPairMarkup(intro)}<section class="ke-grammar-description" data-grammar-answer hidden>${notes}</section></section>`;
      }
    }
    if (topic) {
      const media = resourceMediaDetail(item, []);
      html = `<div class="ke-topic-layout ${media ? "has-media" : ""}"><div class="ke-topic-practice" data-topic-record="${key}"></div>${media}</div>`;
      // The paired practice already contains the source bilingual list. Repeating
      // that same list as a note would reveal every hidden answer immediately.
      const source = libraryResourceForItem(item);
      const normalise = (value) => {
        const plain = document.createElement("div");
        plain.innerHTML = renderResourceMarkup(value || "");
        return plain.textContent.replace(/\s+/g, "").trim();
      };
      const pairedSource = topic.groups.flatMap((group) => group.items.map((pair) => pair.sourceLine || "")).join("\n");
      const renderedLists = new Set([item.content, source?.content, pairedSource].filter((value) => typeof value === "string" && value.trim()).map(normalise));
      const explanation = [item.explainOne, item.explainTwo].filter((value) => {
        const content = normalise(value);
        if (!content || renderedLists.has(content)) return false;
        renderedLists.add(content);
        return true;
      });
      if (explanation.length) html += explanation.map((value) => `<section class="knowledge-explanation is-unlabeled"><p>${renderResourceMarkup(value)}</p></section>`).join("");
    }
    html = resourceLayoutWithIndependentMedia(item, html, type);
    if (type === "语音") {
      const source = libraryResourceForItem(item);
      const word = item.word || source?.word || "";
      const phenomenon = item.pronunciationPhenomenon || source?.pronunciationPhenomenon || "";
      if (!word && phenomenon) {
        const note = String(item.content || source?.content || "");
        const labels = [...new Set(note.split(/\r?\n/).map(line => line.match(/^([^：:\s]+)[：:]/)?.[1]).filter(Boolean))];
        const title = item.contentTitle || source?.contentTitle || item.title || source?.title || labels.join("与") || "语音现象讲解";
        html = `<h3 class="resource-detail-title ke-wiki-name pronunciation-content-title">${escape(title)}</h3>${html}`;
      }
    }
    return `<div class="ke-resource-content" data-knowledge-record="${key}" data-knowledge-type="${escape(type)}"${item.isReviewSimulation ? ' data-knowledge-simulation="true"' : ""}>${html}</div>`;
  };

  // Use the same in-page expansion and layout switch as the existing lecture.
  // Opening knowledge never requests native fullscreen or starts its media.
  function releaseKnowledgeLayout() {
    const layout = document.getElementById("dockLayoutSwitch");
    if (layout?.parentElement?.classList.contains("v1224-knowledge-layout-host") && knowledgeLayoutHome?.parentNode) knowledgeLayoutHome.after(layout);
    popup.querySelector(":scope > .classroom-modal-tools > .v1224-knowledge-layout-host")?.remove();
    knowledgeLayoutHome?.remove();
    knowledgeLayoutHome = null;
    knowledgeFocusPending = false;
  }
  function syncKnowledgeLayout() {
    if (!visible(popup) || !popup.classList.contains("ke-expanded")) {
      releaseKnowledgeLayout();
      return;
    }
    const footer = popup.querySelector(":scope > .classroom-modal-tools");
    const layout = document.getElementById("dockLayoutSwitch");
    if (!footer || !layout || layout.closest(".v1223-word-dock-owner")) return;
    let host = footer.querySelector(":scope > .v1224-knowledge-layout-host");
    if (!host) {
      host = document.createElement("div");
      host.className = "v1224-knowledge-layout-host";
      footer.append(host);
    }
    if (!knowledgeLayoutHome) {
      knowledgeLayoutHome = document.createComment("knowledge layout switch home");
      layout.before(knowledgeLayoutHome);
    }
    if (layout.parentElement !== host) host.append(layout);
    const exit = popup.querySelector(".classroom-modal-back");
    if (knowledgeFocusPending && exit?.getBoundingClientRect().height) {
      exit.focus({ preventScroll: true });
      knowledgeFocusPending = false;
    }
  }
  function prepareKnowledgeExpansion(type) {
    if (type === "语法") { popup.classList.add("ke-expanded"); return; }
    if (!testKnowledgeTypes.has(type)) return;
    popup.classList.remove("v1226-adaptive-knowledge");
    popup.classList.add("v1227-test-knowledge");
    // Restore the current test site's CSS geometry. Fullscreen stays manual.
    ["--v1226-dialog-width", "--v1226-body-max", "--v1226-media-width", "--repair-width", "--repair-body-budget", "--repair-copy-height", "--repair-media-width"].forEach(name => popup.style.removeProperty(name));
    delete popup.dataset.repairMediaLayout;
    knowledgeFocusPending = false;
  }
  showResourcePopover = function knowledgeShow(event, type, item) {
    popup.dataset.knowledgeType = type;
    originalShow(event, type, item);
    popup.dataset.knowledgeType = type;
    syncModalTheme(popup);
    prepareKnowledgeExpansion(type);
  };
  showResourceCollectionPopover = function knowledgeCollection(event, type, items, startIndex = 0) {
    popup.dataset.knowledgeType = type;
    originalCollection(event, type, items, startIndex);
    popup.dataset.knowledgeType = type;
    syncModalTheme(popup);
    prepareKnowledgeExpansion(type);
  };
  closeResourcePopover = function knowledgeClose() {
    releaseKnowledgeLayout();
    closeWordDetail();
    popup.classList.remove("ke-expanded", "ke-topic-modal", "ke-encyclopedia-modal", "ke-grammar-modal", "ke-wiki-modal", "ke-has-media", "ke-media-only", "v1224-default-expanded", "v1226-adaptive-knowledge", "v1227-test-knowledge");
    popup.removeAttribute("data-knowledge-type");
    originalClose();
    records.clear();
  };
  bindResourcePopoverInteractions = function knowledgeBind() {
    originalBind();
    enhanceResourceContent();
    enhanceModal(popup);
    freezeMediaDimensions(popup);
  };

  function enhanceResourceContent() {
    popup.querySelectorAll("[data-knowledge-record]").forEach((container) => {
      const item = records.get(container.dataset.knowledgeRecord);
      if (!item) return;
      const type = container.dataset.knowledgeType;
      popup.dataset.knowledgeType = type;
      popup.classList.toggle("ke-grammar-modal", type === "语法");
      if (type === "词汇" || (type === "语音" && item.word && !item.pronunciationGuideOnly)) enhanceVocabulary(container, item);
      if (type === "语法") {
        const plot = container.querySelector("[data-grammar-record]");
        const basic = container.querySelector('.ke-grammar-basic');
        if (basic && !basic.dataset.answerBound) mountBasicGrammarAnswer(basic);
        if (plot && !plot.dataset.bound) {
          const grammar = grammarFor(item);
          mountGrammar(plot, { ...grammar, translation: grammarIntro(item, grammar).translation });
        }
      }
      if (type === "语音") {
        if (item.pronunciationGuideOnly) container.querySelectorAll(".resource-meanings").forEach(section => section.remove());
        const segment = item.audioSegment;
        if (Number.isFinite(segment?.start) && Number.isFinite(segment?.end) && segment.end > segment.start) {
          container.querySelectorAll("[data-resource-audio]").forEach(button => {
            button.dataset.resourceStart = String(segment.start);
            button.dataset.resourceEnd = String(segment.end);
            button.setAttribute("aria-label", "播放第17题结尾句");
          });
        }
      }
      if (["微技能", "百科知识", "实用表达"].includes(type)) mountTextVisibility(container);
      if (type === "话题词汇") {
        const practice = container.querySelector("[data-topic-record]");
        if (practice && !practice.dataset.bound) mountTopic(practice, matchRow(data().topicPairs, item));
      }
      markMissingMedia(container, item);
    });
  }

  function mountTextVisibility(container) {
    if (container.querySelector("[data-knowledge-all]")) return;
    const copy = container.querySelector(".resource-detail-copy") || container;
    const button = document.createElement("button"); button.type = "button";
    button.className = "ke-g-all"; button.dataset.knowledgeAll = "true";
    button.setAttribute("aria-pressed", "true"); button.textContent = "全部隐藏";
    button.addEventListener("click", () => {
      const visible = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(visible)); button.textContent = visible ? "全部隐藏" : "全部展示";
      copy.querySelectorAll(".resource-markup-copy,.knowledge-explanation,.pronunciation-notes").forEach(node => { node.hidden = !visible; });
      window.ClassroomTools?.refresh?.();
    });
    copy.append(button);
  }
  function examCases(wordId, item) {
    if (item?.bookKey === "test-single-book" || item?.realOnly === true || getQuestion(state.currentQuestionId)?.realOnly === true) {
      const raw = window.TEST_SINGLE_BOOK?.enhancements?.examCasesByWordId?.[String(wordId)];
      const cases = Array.isArray(raw) ? raw : Array.isArray(raw?.cases) ? raw.cases : [];
      const retained = cases.filter(example => example.realOnly === true && example.source && example.isDemonstration !== true);
      return window.V1220WordDetail?.cases?.({ wordId, item, retained }) || retained;
    }
    const sample = window.WORD_DETAIL_CASE;
    if (sample && Number(wordId) === Number(sample.wordId)) return sample.cases || [];
    const raw = data().examCasesByWordId?.[String(wordId)];
    return Array.isArray(raw) ? raw : Array.isArray(raw?.cases) ? raw.cases : [];
  }
  function restoreCurrentMeaning(details) {
    const originalSummary = details.querySelector(":scope > .resource-current-summary");
    const section = document.createElement("section");
    section.className = "resource-meanings ke-current-meaning";
    const summary = document.createElement("div");
    summary.className = originalSummary?.className || "resource-current-summary";
    const copy = originalSummary?.querySelector(".resource-current-copy");
    if (copy) summary.append(copy);
    section.append(summary);
    details.replaceWith(section);
    return summary;
  }
  function meaningActionContainer(meaning) {
    const existing = meaning.querySelector(":scope > .resource-current-summary");
    if (existing) return existing;
    // Single-sense entries retain the original sense nodes and card spacing.
    // The action shares their row rather than creating a separate second row.
    if (meaning.classList.contains("is-single")) {
      const summary = document.createElement("div");
      summary.className = "resource-current-summary ke-single-summary";
      if (meaning.classList.contains("has-part-pronunciations")) summary.classList.add("has-part-pronunciations");
      const copy = document.createElement("span");
      copy.className = "resource-current-copy";
      while (meaning.firstChild) copy.append(meaning.firstChild);
      summary.append(copy);
      meaning.classList.add("ke-current-meaning");
      meaning.append(summary);
      return summary;
    }
    return meaning;
  }
  function completeCurrentSensePOS(container, context) {
    const meaning = container.querySelector(".resource-meanings.is-single");
    const pos = context?.selected?.part?.partOfSpeech || context?.part?.partOfSpeech || "";
    if (!meaning || !pos || meaning.querySelector(".resource-sense-pos,.resource-collapsed-pos")) return;
    const label = document.createElement("span");
    label.className = "resource-collapsed-pos";
    label.textContent = pos;
    const line = meaning.querySelector(".resource-sense-line");
    if (line) line.before(label);
  }
  function enhanceVocabulary(container, item) {
    container.classList.add("ke-vocabulary");
    container.querySelectorAll(".knowledge-entry").forEach((article, index) => {
      if (article.dataset.keVocabulary) return;
      article.dataset.keVocabulary = "true";
      const entry = vocabItems(item)[index];
      if (!entry) return;
      const context = libraryContextForEntry(entry, item);
      article.v105Context = {entry,item,context};
      window.WordDetailCaseUI?.enhanceVocabularyArticle?.(article, entry, item, context);
      window.V1220WordDetail?.enhanceArticle?.(article, entry, item, context);
      completeCurrentSensePOS(article, context);
      const cases = examCases(context?.word?.id || entry.word_id || entry.wordId || item.wordId, item);
      const term = article.querySelector(".knowledge-term");
      if (cases.length && term) {
        const frequency = document.createElement("button");
        frequency.type = "button";
        frequency.className = "ke-exam-frequency";
        frequency.textContent = `高考听力：${cases.length}次`;
        frequency.addEventListener("click", () => openWordDetail(entry, item, context, "cases", frequency));
        term.append(frequency);
      }
      const details = article.querySelector("details.resource-all-senses");
      if (details) restoreCurrentMeaning(details);
      if (item.wordDetailEnabled === false) return;
      const more = document.createElement("button");
      more.type = "button";
      more.className = "ke-word-more";
      more.textContent = "更多单词详情";
      more.addEventListener("click", () => openWordDetail(entry, item, context, "top", more));
      const meaning = article.querySelector(".resource-meanings");
      if (meaning) meaningActionContainer(meaning).append(more); else article.append(more);
      window.V1227WordMetadata?.enhanceArticle?.(article,entry,item,context,cases,
        () => openWordDetail(entry,item,context,"cases",article.querySelector('[data-word-tag="exam-frequency"]')));
    });
    window.V1220WordDetail?.finishMother?.(container, item);
    const reviewCopy=item.reviewExplanation || libraryResourceForItem(item)?.reviewExplanation;
    if(reviewCopy && !container.querySelector('[data-review-vocabulary-explanation]')){
      const note=document.createElement('section');
      note.className='ke-current-context-explanation';
      note.setAttribute('data-review-vocabulary-explanation','');
      note.innerHTML='<p class="resource-markup-copy">'+renderResourceMarkup(reviewCopy)+'</p>';
      container.append(note);
    }
    layoutVocabularyExplanation(container);
    window.V12105Vocabulary?.mount(container,item);
  }

  // Retain the native term, pronunciation and current-meaning nodes across the
  // whole sheet; only the explanation below their separator owns a media rail.
  function layoutVocabularyExplanation(container) {
    if (container.closest('#wordDetailDialog')) return;
    const primary = container.querySelector(':scope > .resource-detail-layout');
    if (!primary) return;
    primary.classList.add('ke-vocabulary-mother-layout');
    let row = container.querySelector(':scope > .ke-vocabulary-explanation-layout');
    const selector = '.resource-word-notes,.resource-word-note,.knowledge-explanation,p.resource-markup-copy,[data-review-vocabulary-explanation]';
    const notes = [...container.querySelectorAll(selector)].filter(node =>
      !node.closest('.ke-vocabulary-explanation-layout') && !node.parentElement?.closest(selector));
    const panels = [...container.querySelectorAll('.resource-media-panel')].filter(panel => !panel.closest('.ke-vocabulary-explanation-layout'));
    if (!row && !notes.length && !panels.length) return;
    if (!row) {
      row = document.createElement('section');
      row.className = 'resource-detail-layout ke-current-context-explanation ke-vocabulary-explanation-layout';
      const copy = document.createElement('div');
      copy.className = 'resource-detail-copy ke-vocabulary-explanation-copy';
      row.append(copy); container.append(row);
    }
    const copy = row.querySelector(':scope > .ke-vocabulary-explanation-copy');
    notes.forEach(note => copy.append(note));
    let media = row.querySelector(':scope > .resource-media-panel');
    panels.forEach(panel => {
      if (!media) { media = panel; row.append(panel); }
      else while (panel.firstChild) media.append(panel.firstChild);
      if (panel !== media) panel.remove();
    });
    copy.querySelectorAll('.resource-word-note-media').forEach(aside => {
      if (!media) { media = document.createElement('aside'); media.className = 'resource-media-panel'; row.append(media); }
      const note = aside.closest('.resource-word-note');
      while (aside.firstChild) media.append(aside.firstChild);
      aside.remove(); note?.classList.remove('has-media');
    });
    primary.classList.remove('has-media');
    row.classList.toggle('has-media', Boolean(media));
    if (row !== container.lastElementChild) container.append(row);
  }

  function completeWordExplanations(item, dictionaryHTML) {
    const plain = (value) => { const node = document.createElement("div"); node.innerHTML = value; return node.textContent.replace(/\s+/g, "").trim(); };
    let output = dictionaryHTML;
    let existing = plain(output);
    const source = libraryResourceForItem(item);
    const candidates = [item.explainOne, item.explainTwo, typeof source?.content === "string" ? source.content : ""];
    candidates.forEach((value) => {
      const rendered = renderResourceMarkup(String(value || "").trim());
      const content = plain(rendered);
      if (!content || existing.includes(content)) return;
      output += `<section class="knowledge-explanation is-unlabeled ke-extra-explanation"><p>${rendered}</p></section>`;
      existing += content;
    });
    return output;
  }

  function renderContextFirstSenseOverview(context) {
    if (!context?.word?.parts?.length) return "";
    const selectedId = Number(context.selected?.dictionarySenseId || context.selected?.id || 0);
    const selectedPartId = Number(context.selected?.part?.id || context.part?.id || 0);
    const parts = [...context.word.parts].sort((a, b) => Number(Number(b.id) === selectedPartId) - Number(Number(a.id) === selectedPartId));
    const partPronunciations = libraryPronunciationGroups(context.word).length > 1;
    return `<section class="resource-meanings resource-sense-overview">${parts.map((part) => {
      const senses = [...part.senses].sort((a, b) => Number(Number(b.id) === selectedId) - Number(Number(a.id) === selectedId));
      return `<section class="${partPronunciations ? "has-part-pronunciations" : ""}">${partPronunciations ? renderResourceSenseHeading(part, true) : `<div class="resource-sense-pos">${escape(part.partOfSpeech || "")}</div>`}<div class="resource-sense-list">${senses.map((sense) => renderResourceSenseLine(sense, Number(sense.id) === selectedId)).join("")}</div></section>`;
    }).join("")}</section>`;
  }

  function renderWordDetailOriginal(content, item, context) {
    const media = resourceMediaDetail(item, context ? [context] : []);
    return media
      ? `<div class="resource-detail-layout has-media"><div class="resource-detail-copy">${content}</div>${media}</div>`
      : content;
  }

  let parentFocus = null;
  let parentScroll = [];
  let detailAbortController = null;
  function openWordDetail(entry, item, context, destination, trigger, feature = null) {
    closeWordDetail();
    parentFocus = trigger;
    parentScroll = [popup, ...popup.querySelectorAll(".resource-popover-page,.resource-popover-body")].map((element) => ({ element, top: element.scrollTop, left: element.scrollLeft }));
    const word = context?.word;
    const cases = examCases(word?.id || entry.word_id || entry.wordId || item.wordId, item);
    const backdrop = document.createElement("div");
    backdrop.id = "wordDetailBackdrop";
    backdrop.className = "ke-word-detail-backdrop";
    backdrop.addEventListener("click", (event) => { event.stopPropagation(); closeWordDetail(); });
    const detail = document.createElement("div");
    detail.id = "wordDetailDialog";
    detail.className = "resource-popover ke-word-detail";
    if(feature){detail.dataset.v107Direct=feature.id;detail.classList.add("v107-direct-pending");}
    detail.setAttribute("role", "dialog");
    detail.setAttribute("aria-modal", "true");
    detail.setAttribute("aria-labelledby", "keWordDetailTitle");
    detail.dataset.knowledgeType = "词汇";
    detail.addEventListener("click", (event) => event.stopPropagation());
    syncModalTheme(detail);
    const sourceContent = completeWordExplanations(item, renderDictionaryEntry(entry, item));
    const fragment = document.createElement("div");
    fragment.innerHTML = sourceContent;
    const sourceMeaning = fragment.querySelector(".resource-meanings");
    if (context && sourceMeaning) {
      const all = document.createElement("section");
      all.className = "ke-all-meanings ke-integrated-meanings";
      all.innerHTML = `<h3>所有释义</h3>${renderContextFirstSenseOverview(context)}`;
      sourceMeaning.replaceWith(all);
    }
    const existingContent = fragment.innerHTML;
    const originalContent = renderWordDetailOriginal(existingContent, item, context);
    const derivation = word?.derivation && resourceSubtypeLabel("词汇", item) !== "构词点拨"
      ? `<section class="resource-word-note"><h4>构词点拨</h4><p>${renderResourceMarkup(word.derivation)}</p></section>` : "";
    const caseHTML = cases.length ? `<section id="ke-exam-cases" class="ke-exam-cases"><div class="ke-section-title"><h3>高考听力案例 · ${cases.length}次</h3></div>${cases.map((example, index) => `<article class="ke-exam-case"><div class="ke-case-source"><b>${index + 1}</b><span>${escape(example.year)}年 · ${escape(example.sourceName)} · ${escape(example.textNo || example.recordingNo || "")}</span></div><div class="ke-case-sentence"><p>${renderResourceMarkup(example.english || example.sentence || "")}</p>${example.audioUrl ? resourceInlineAudioButton(example.audioUrl, `播放第${index+1}个案例`) : ""}</div>${example.translation || example.chinese ? `<p class="ke-case-translation">${renderResourceMarkup(example.translation || example.chinese)}</p>` : ""}</article>`).join("")}</section>` : "";
    const latest = window.V1220WordDetail?.render?.({ entry, item, context, destination, trigger, originalContent, derivation, caseHTML, retainedCases: cases });
    detail.innerHTML = `<div class="resource-popover-head"><div><span id="keWordDetailTitle">单词详情 · ${escape(latest?.word?.displayWord || latest?.word?.word || word?.displayWord || word?.word || entry.word || "")}</span></div><button type="button" data-word-detail-close aria-label="关闭单词详情">${icons.x}</button></div><div class="resource-popover-body ke-vocabulary">${latest?.html || `<section class="ke-original-word-content">${originalContent}</section>${derivation}${caseHTML}`}</div>`;
    window.WordDetailCaseUI?.mount?.(detail, { entry, item, context, destination });
    document.body.append(backdrop, detail);
    popup.setAttribute("aria-hidden", "true");
    popup.inert = true;
    detail.querySelector("[data-word-detail-close]").addEventListener("click", closeWordDetail);
    enhanceModal(detail);
    window.V1220WordDetail?.finish?.(detail, latest);
    window.V1227WordMetadata?.enhanceDetail?.(detail,latest || {word,options:{entry,item,context,retainedCases:cases}});
    window.V1223WordDock?.activate(detail);
    // Native details are removed here too; all meanings have their own permanent section.
    detail.querySelectorAll("details.resource-all-senses").forEach(restoreCurrentMeaning);
    completeCurrentSensePOS(detail, context);
    const singleMeaning = detail.querySelector(".ke-original-word-content .resource-meanings.is-single");
    if (singleMeaning) meaningActionContainer(singleMeaning);
    window.V1241WordGuidance?.mount(detail, { entry, item, context, word:latest?.word || word });
    window.V1241DetailNotes?.mount(detail, { entry, item, context, word:latest?.word || word });
    window.V12107WordPresentation?.prepareContrast?.(detail,latest?.word || word);
    bindDetailMedia(detail);
    freezeMediaDimensions(detail);
    if(feature){
      if(feature.id==='illustrations')window.V1213Illustrations?.configure?.(detail,feature.settings);
      else window.V1283Contrast?.setAll?.(detail,!feature.settings.mask);
      const tab=detail.querySelector('[data-word-module="'+feature.id+'"]');
      window.WordDetailNavigation?.select?.(detail,feature.id);
      let attempts=0;
      const enter=()=>{
        if(!detail.isConnected)return;
        const entered=window.V1263InteractiveTabs?.enter?.(detail,feature.id);
        if(entered){detail.dataset.v107DirectEntered='true';detail.classList.remove('v107-direct-pending');window.V1288Network?.refresh?.();window.V1247PolysemyControls?.refresh?.();return;}
        if(attempts++<60){tab?.click();requestAnimationFrame(enter);}else closeWordDetail();
      };
      enter();return;
    }
    requestAnimationFrame(() => {
      const positionContent = () => requestAnimationFrame(() => {
        detail.querySelector("[data-word-detail-close]")?.focus({ preventScroll: true });
        const body = detail.querySelector(".resource-popover-body");
        const cases = detail.querySelector("#ke-exam-cases");
        if (!body) return;
        const top = destination === "cases" && cases
          ? body.scrollTop + cases.getBoundingClientRect().top - body.getBoundingClientRect().top
          : 0;
        body.scrollTo({ top, behavior: destination === "cases" && !reducedMotion() ? "smooth" : "instant" });
      });
      if (document.fonts) document.fonts.ready.then(positionContent);
      else positionContent();
    });
    if (!reducedMotion()) detail.animate([{ opacity: 0, transform: "translate(-50%, calc(-50% + 12px)) scale(.985)" }, { opacity: 1, transform: "translate(-50%, -50%) scale(1)" }], { duration: 230, easing: "cubic-bezier(.2,.8,.2,1)" });
  }
  function closeWordDetail() {
    const detail = document.getElementById("wordDetailDialog");
    if (!detail) return;
    window.V1263InteractiveTabs?.leave?.(detail,false);
    window.WordDetailCaseUI?.closeNested?.();
    window.V1223WordDock?.release(detail);
    detail.querySelectorAll("video,audio").forEach((media) => media.pause());
    if (activeResourceAudioButton && detail.contains(activeResourceAudioButton)) {
      if (window.DemoResourceAudio?.pause) window.DemoResourceAudio.pause({resumeMain:true});
      else {
        resourceDetailAudio.pause();
        if (typeof restoreMainAudioAfterResource === "function") restoreMainAudioAfterResource();
      }
    }
    detailAbortController?.abort();
    detailAbortController = null;
    detail.remove();
    document.getElementById("wordDetailBackdrop")?.remove();
    popup.removeAttribute("aria-hidden");
    popup.inert = false;
    parentScroll.forEach(({ element, top, left }) => { element.scrollTop = top; element.scrollLeft = left; });
    parentFocus?.focus({ preventScroll: true });
    parentFocus = null;
  }
  function bindDetailMedia(detail) {
    detailAbortController?.abort();
    detailAbortController = new AbortController();
    const signal = detailAbortController.signal;
    detail.querySelectorAll("[data-resource-audio]").forEach((button) => {
      button.addEventListener("click", () => {
        const source = resolveDemoAudioURL(button.dataset.resourceAudio);
        if (window.DemoResourceAudio?.toggle) {
          document.querySelectorAll("#popover video,#wordDetailDialog video").forEach((media) => media.pause());
          window.DemoResourceAudio.toggle(source, button);
          return;
        }
        const sameSource = activeResourceAudioButton === button && resourceDetailAudio.dataset.source === source;
        if (sameSource && !resourceDetailAudio.paused) { resourceDetailAudio.pause(); updateResourceAudioButton(button, false); return; }
        if (window.DemoResourceAudio?.play) {
          document.querySelectorAll("#popover video,#wordDetailDialog video").forEach((media) => media.pause());
          window.DemoResourceAudio.play(source, button).then((played) => {
            if (played === false) { button.classList.add("unavailable"); button.title = "音频暂时无法播放"; }
          });
          return;
        }
        updateResourceAudioButton(activeResourceAudioButton, false);
        if (!sameSource) { resourceDetailAudio.pause(); resourceDetailAudio.dataset.source = source; resourceDetailAudio.src = source; }
        document.querySelectorAll("#popover video,#wordDetailDialog video").forEach((media) => media.pause());
        if (typeof suspendMainAudioForResource === "function") suspendMainAudioForResource();
        activeResourceAudioButton = button;
        resourceDetailAudio.currentTime = 0;
        resourceDetailAudio.play().then(() => updateResourceAudioButton(button, true)).catch(() => {
          updateResourceAudioButton(button, false);
          button.classList.add("unavailable");
          button.title = "音频暂时无法播放";
          if (typeof restoreMainAudioAfterResource === "function") restoreMainAudioAfterResource();
        });
      }, { signal });
    });
    const syncDetailAudio = () => {
      detail.querySelectorAll("[data-resource-audio]").forEach((button) => updateResourceAudioButton(button, activeResourceAudioButton === button && !resourceDetailAudio.paused));
      const card = detail.querySelector("[data-resource-guidance-card]");
      const current = card?.querySelector("[data-resource-audio]");
      const active = current && activeResourceAudioButton === current;
      const duration = active && Number.isFinite(resourceDetailAudio.duration) ? resourceDetailAudio.duration : 0;
      const time = active && Number.isFinite(resourceDetailAudio.currentTime) ? resourceDetailAudio.currentTime : 0;
      const slider = card?.querySelector("[data-resource-guidance-progress]");
      if (slider) slider.value = duration ? String(time / duration * 100) : "0";
      const label = card?.querySelector("[data-resource-guidance-time]");
      if (label) label.textContent = `${formatAudioTime(time)} / ${formatAudioTime(duration)}`;
    };
    ["play", "pause", "ended", "timeupdate", "loadedmetadata"].forEach((name) => resourceDetailAudio.addEventListener(name, syncDetailAudio, { signal }));
    detail.querySelector("[data-resource-guidance-progress]")?.addEventListener("input", (event) => {
      if (activeResourceAudioButton !== event.target.closest("[data-resource-guidance-card]").querySelector("[data-resource-audio]") || !Number.isFinite(resourceDetailAudio.duration)) return;
      resourceDetailAudio.currentTime = resourceDetailAudio.duration * Number(event.target.value) / 100;
      syncDetailAudio();
    });
    detail.querySelectorAll("video").forEach((media) => {
      media.addEventListener("play", () => { resourceDetailAudio.pause(); if (typeof suspendMainAudioForResource === "function") suspendMainAudioForResource(); });
      ["ended", "error"].forEach((name) => media.addEventListener(name, () => { if (typeof restoreMainAudioAfterResource === "function") restoreMainAudioAfterResource(); }));
    });
    detail.querySelectorAll("[data-resource-image-fullscreen]").forEach((button) => button.addEventListener("click", () => {
      const frame = button.closest(".resource-image-frame");
      if (document.fullscreenElement === frame) document.exitFullscreen?.(); else frame?.requestFullscreen?.().catch?.(() => {});
    }));
  }

  function mountTopic(root, record) {
    if (!record) return;
    root.dataset.bound = "true";
    const state = { direction: "zh-en", revealed: new Set() };
    const groups = record.groups || [];
    const terms = groups.flatMap((group) => group.items || []);
    // A collection heading or an image alt can itself contain a practice
    // answer. Keep its original source title, but conceal unrevealed terms.
    const page = root.closest(".resource-popover-page");
    const caption = page?.querySelector("article > strong");
    const heading = popup.querySelector(".resource-popover-head > div > span");
    const captions = [heading, caption, ...root.closest(".ke-resource-content").querySelectorAll("figcaption")].filter(Boolean).map((element) => {
      if (!element.dataset.keCaptionOriginal) element.dataset.keCaptionOriginal = element.textContent;
      return { element, copy: element.dataset.keCaptionOriginal };
    });
    const imageCaptions = [...root.closest(".ke-resource-content").querySelectorAll("img[alt]")].map((element) => ({ element, copy: element.alt }));
    function captionCopy(original) {
      if (state.direction !== "zh-en") return original;
      const hidden = terms.filter((term, index) => !state.revealed.has(index)).map((term) => term.english).filter(Boolean);
      let copy = original.replace(/[（(][^）)]*[）)]/g, (part) => hidden.some((term) => part.toLowerCase().includes(term.toLowerCase())) ? "" : part);
      hidden.forEach((term) => {
        const start = copy.toLowerCase().indexOf(term.toLowerCase());
        if (start >= 0) copy = copy.slice(0, start) + "…" + copy.slice(start + term.length);
      });
      return copy.trim();
    }
    root.innerHTML = `<div class="ke-topic-toolbar"><div class="ke-topic-directions"><button type="button" data-topic-direction="zh-en">汉译英</button><button type="button" data-topic-direction="en-zh">英译汉</button></div><button type="button" data-topic-all>全部显示</button></div><div class="ke-topic-groups"></div>`;
    const toolbar = root.querySelector(".ke-topic-toolbar");
    const body = root.closest(".resource-popover-body");
    if (body) {
      toolbar.classList.add("ke-topic-frozen-toolbar");
      toolbar.setAttribute("role", "toolbar");
      toolbar.setAttribute("aria-label", "话题词汇练习控制");
      body.before(toolbar);
    }
    function render() {
      let index = 0;
      root.querySelector(".ke-topic-groups").innerHTML = groups.map((group) => `<section class="ke-topic-group">${group.title ? `<h3>${escape(group.title)}</h3>` : ""}<div>${(group.items || []).map((term) => {
        const key = index++;
        const front = state.direction === "zh-en" ? term.chinese : term.english;
        const answer = state.direction === "zh-en" ? term.english : term.chinese;
        return `<button type="button" class="ke-topic-term ${state.revealed.has(key) ? "is-revealed" : ""} ${term.emphasis ? "is-emphasis" : ""}" data-topic-term="${key}" aria-pressed="${state.revealed.has(key)}"><span class="${(state.direction === "zh-en" ? term.chineseEmphasis : term.englishEmphasis) ?? term.emphasis ? "ke-topic-emphasis" : ""}">${escape(front)}</span>${state.revealed.has(key) ? `<strong class="${(state.direction === "zh-en" ? term.englishEmphasis : term.chineseEmphasis) ?? term.emphasis ? "ke-topic-emphasis" : ""}">${escape(answer)}</strong>` : ""}</button>`;
      }).join("")}</div></section>`).join("");
      toolbar.querySelectorAll("[data-topic-direction]").forEach((button) => {
        const selected = button.dataset.topicDirection === state.direction;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      const all = state.revealed.size === terms.length && terms.length > 0;
      toolbar.querySelector("[data-topic-all]").textContent = all ? "全部隐藏" : "全部显示";
      toolbar.querySelector("[data-topic-all]").setAttribute("aria-pressed", String(all));
      captions.forEach(({ element, copy }) => { element.textContent = captionCopy(copy); });
      imageCaptions.forEach(({ element, copy }) => { element.alt = captionCopy(copy); });
    }
    function handleTopicClick(event) {
      const direction = event.target.closest("[data-topic-direction]");
      const term = event.target.closest("[data-topic-term]");
      const all = event.target.closest("[data-topic-all]");
      if (direction || term || all) event.stopPropagation();
      if (direction) { state.direction = direction.dataset.topicDirection; state.revealed.clear(); }
      if (term) {
        const key = Number(term.dataset.topicTerm);
        state.revealed.has(key) ? state.revealed.delete(key) : state.revealed.add(key);
      }
      if (all) {
        if (state.revealed.size === terms.length) state.revealed.clear(); else terms.forEach((_, index) => state.revealed.add(index));
      }
      if (!direction && !term && !all) return;
      render();
      if (!reducedMotion() && term) root.querySelector(`[data-topic-term="${term.dataset.topicTerm}"]`)?.animate([{ transform: "translateY(2px)", opacity: .75 }, { transform: "translateY(0)", opacity: 1 }], { duration: 220, easing: "ease-out" });
    }
    root.addEventListener("click", handleTopicClick);
    if (!root.contains(toolbar)) toolbar.addEventListener("click", handleTopicClick);
    render();
  }

  function markMissingMedia(container, item) {
    container.querySelectorAll("[data-resource-audio]").forEach(button=>{
      const missing=(data().missingAssets||[]).some(asset=>asset.filename&&button.dataset.resourceAudio.includes(encodeURIComponent(asset.filename)));
      if(missing)button.remove();
    });
  }

  function freezeMediaDimensions(dialog) {
    enhanceImageFrames(dialog);
    const type = dialog.dataset.knowledgeType;
    if (!["百科知识", "话题词汇", "微技能"].includes(type)) return;
    const article = dialog.querySelector(".resource-popover-page>article");
    const heading = article?.querySelector(":scope>strong");
    const body = article?.querySelector(":scope>.resource-popover-body");
    if (heading && body) {
      heading.classList.add("ke-wiki-name");
      body.prepend(heading);
    }
    dialog.classList.toggle("ke-topic-modal", type === "话题词汇");
    dialog.classList.toggle("ke-encyclopedia-modal", type === "百科知识");
    dialog.classList.toggle("ke-wiki-modal", true);
    dialog.classList.toggle("ke-has-media", Boolean(dialog.querySelector(".resource-media-panel")));
    dialog.classList.toggle("ke-media-only", Boolean(dialog.querySelector(".resource-detail-layout.media-only")));
    dialog.querySelectorAll(".resource-media-panel").forEach((panel) => {
      const standalone = panel.closest(".media-only");
      // Current deployed WikiDialog: 520px encyclopedia / 400px topic and micro /
      // 600px standalone. The user approved these widths in this repair round.
      const fixedWidth = standalone ? 600 : type === "百科知识" ? 520 : 400;
      panel.style.setProperty("--ke-media-width", fixedWidth + "px");
      panel.querySelectorAll("img,video").forEach((media) => {
        const apply = () => {
          const width = media.naturalWidth || media.videoWidth;
          const height = media.naturalHeight || media.videoHeight;
          if (!width || !height) return;
          const visual = media.closest(".resource-image-frame") || media;
          let slot = visual.parentElement;
          if (!slot.classList.contains("ke-media-slot")) {
            slot = document.createElement("div");
            slot.className = "ke-media-slot";
            visual.before(slot);
            slot.append(visual);
          }
          slot.style.width = "100%";
          slot.style.height = "auto";
          media.style.width = "100%";
          media.style.height = "auto";
          if (visual !== media) {
            visual.style.width = "100%";
            visual.style.height = "auto";
          }
        };
        media.addEventListener(media.tagName === "IMG" ? "load" : "loadedmetadata", apply, { once: true });
        apply();
      });
    });
    scheduleImageFit();
  }

  // Keep the supplied image and URL intact. A failed request gets one automatic
  // retry; subsequent retries require the visible user control.
  function enhanceImageFrames(dialog) {
    dialog.querySelectorAll('.resource-image-frame').forEach(frame => {
      const image=frame.querySelector('img');
      if(!image || imageStates.has(image))return;
      const original=image.getAttribute('src');
      const status=document.createElement('div');status.className='v1225-image-status';status.setAttribute('role','status');
      const message=document.createElement('span');
      const retry=document.createElement('button');retry.type='button';retry.className='v1225-image-retry';retry.textContent='重试';retry.dataset.v1225RetrySource=original;
      status.append(message,retry);frame.append(status);
      const record={image,frame,status,message,retry,original,automaticRetries:0,generation:0,phase:'loading',zoomButtons:[...frame.querySelectorAll('[data-resource-image-fullscreen]')]};imageStates.set(image,record);
      const state=phase=>{
        record.phase=phase;frame.dataset.v1225ImageState=phase;
        frame.setAttribute('aria-busy',String(phase==='loading'));
        status.hidden=phase==='ready';retry.hidden=phase!=='failed';retry.disabled=phase==='loading';
        message.textContent=phase==='failed'?'图片暂未加载，请重试':'图片加载中…';
        record.zoomButtons.forEach(button=>{button.disabled=phase!=='ready';button.hidden=phase!=='ready';button.dataset.v1225ImageUnavailable=String(phase!=='ready');button.setAttribute('aria-disabled',String(phase!=='ready'));});
        scheduleImageFit();
      };
      const reload=()=>{
        if(!image.isConnected)return;
        record.generation++;state('loading');
        // Reuse the original source. No replacement picture or changed filename.
        image.src=record.original;
      };
      const failed=()=>{
        if(!image.isConnected)return;
        state('failed');
        if(record.automaticRetries===0){record.automaticRetries=1;setTimeout(()=>{if(image.isConnected&&record.phase==='failed')reload();},180);}
      };
      const loaded=async()=>{
        const generation=record.generation;
        try{if(image.decode)await image.decode();if(!image.naturalWidth||!image.naturalHeight)throw new Error('image not decoded');}
        catch{if(generation===record.generation)failed();return;}
        if(generation!==record.generation || !image.isConnected)return;
        frame.style.setProperty('--v1225-image-ratio',String(image.naturalWidth/image.naturalHeight));state('ready');
      };
      image.addEventListener('error',failed);image.addEventListener('load',loaded);
      retry.addEventListener('click',event=>{event.stopPropagation();reload();});
      state('loading');if(image.complete){if(image.naturalWidth)loaded();else failed();}
    });
  }
  function fitImageFrames(){
    imageFitFrame=0;
    document.querySelectorAll('#popover.ke-wiki-modal .resource-image-frame:not(:fullscreen)').forEach(frame=>{
      const dialog=frame.closest('#popover'),image=frame.querySelector('img');if(!image || dialog.classList.contains('hidden'))return;
      if(testKnowledgeTypes.has(dialog.dataset.knowledgeType)||dialog.classList.contains('v1246-adaptive-knowledge')){
        if(frame.classList.contains('v1225-image-fitted'))frame.classList.remove('v1225-image-fitted');
        if(frame.style.getPropertyValue('--v1225-image-fit-height'))frame.style.removeProperty('--v1225-image-fit-height');return;
      }
      const rect=frame.getBoundingClientRect(),footer=dialog.querySelector(':scope > .classroom-modal-tools');
      if(!rect.width || !footer)return;
      const body=frame.closest('.resource-popover-body');
      const bottom=Math.min(footer.getBoundingClientRect().top,body?.getBoundingClientRect().bottom||innerHeight)-12;
      const ratio=image.naturalWidth&&image.naturalHeight?image.naturalWidth/image.naturalHeight:16/9;
      const natural=rect.width/ratio,available=Math.max(0,bottom-rect.top),record=imageStates.get(image);
      const key=[innerWidth,innerHeight,dialog.classList.contains('ke-expanded'),dialog.dataset.repairMediaLayout,state.fullFont].join('|');
      if(record && record.fitKey!==key){record.fitKey=key;record.reserveScroll=false;}
      // A stacked image below long text needs a scrollable body, rather than
      // forcing a 48px image into a 4px remainder behind the footer.
      if(record && dialog.dataset.repairMediaLayout==='stack' && available<120)record.reserveScroll=true;
      const budget=record?.reserveScroll?Math.max(120,(body?.clientHeight||300)-24):Math.max(48,available);
      const height=Math.min(natural,budget);
      const fitted=natural>budget+1 || frame.dataset.v1225ImageState!=='ready';
      if(frame.classList.contains('v1225-image-fitted')!==fitted)frame.classList.toggle('v1225-image-fitted',fitted);
      const value=Math.floor(height)+'px';if(frame.style.getPropertyValue('--v1225-image-fit-height')!==value)frame.style.setProperty('--v1225-image-fit-height',value);
    });
  }
  function scheduleImageFit(){if(!imageFitFrame)imageFitFrame=requestAnimationFrame(fitImageFrames);}
  window.addEventListener('resize',scheduleImageFit);
  document.addEventListener('fullscreenchange',scheduleImageFit);
  popup.addEventListener('scroll',scheduleImageFit,true);
  const imageObserver=new MutationObserver(()=>{
    if(popup.classList.contains('hidden'))return;
    enhanceImageFrames(popup);scheduleImageFit();
  });
  imageObserver.observe(popup,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
  if(typeof ResizeObserver==='function')new ResizeObserver(scheduleImageFit).observe(popup);
  window.V1225ResourceImages={refresh:dialog=>{enhanceImageFrames(dialog||popup);scheduleImageFit();},inspect:()=>[...popup.querySelectorAll('.resource-image-frame')].map(frame=>{const image=frame.querySelector('img'),record=imageStates.get(image);return{source:record?.original,phase:record?.phase,automaticRetries:record?.automaticRetries,naturalWidth:image?.naturalWidth,naturalHeight:image?.naturalHeight,rect:frame.getBoundingClientRect().toJSON()};})};

  function syncModalTheme(dialog) {
    const source = document.querySelector("#fullscreenPage") || document.querySelector(".fullscreen");
    const scheme = source?.dataset.themeKind || source?.dataset.themeScheme || (state.theme === "light" ? "light" : "dark");
    dialog.classList.toggle("light-mode", scheme === "light");
    dialog.classList.toggle("dark-mode", scheme === "dark");
    dialog.dataset.themeScheme = scheme;
    dialog.dataset.themeKind = scheme;
    ["--lecture-panel", "--lecture-panel-deep", "--lecture-border", "--lecture-text", "--lecture-muted", "--lecture-translation", "--lecture-primary", "--lecture-context", "--demo-panel", "--demo-text", "--demo-bg", "--demo-red"].forEach((name) => {
      const value = source && getComputedStyle(source).getPropertyValue(name).trim();
      if (value) dialog.style.setProperty(name, value);
      else dialog.style.removeProperty(name);
    });
  }
  function modalPanel(dialog) {
    return dialog.id === "popover" || (dialog.id === "wordDetailDialog" || dialog.id === "lexicalChunkDialog") ? dialog : dialog.querySelector(".publish-dialog-panel,.add-material-panel,.app-dialog-panel") || dialog;
  }
  function enhanceModal(dialog) {
    if (!dialog) return;
    if (["popover", "wordDetailDialog", "lexicalChunkDialog"].includes(dialog.id)) {
      if (!dialog.dataset.keArrowBoundary) {
        dialog.addEventListener("keydown", event => { if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) event.stopPropagation(); });
        dialog.dataset.keArrowBoundary = "true";
      }
      modalPanel(dialog).querySelectorAll(".ke-modal-expand").forEach(button => button.remove());
      if (!dialog.classList.contains("ke-formal-modal")) dialog.classList.add("ke-formal-modal");
      return;
    }
    if (!dialog.dataset.keArrowBoundary) {
      dialog.addEventListener("keydown", (event) => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) event.stopPropagation();
      });
      dialog.dataset.keArrowBoundary = "true";
    }
    const panel = modalPanel(dialog);
    if (!dialog.classList.contains("ke-formal-modal")) dialog.classList.add("ke-formal-modal");
    if (panel.querySelector(":scope > .ke-modal-expand, :scope > header .ke-modal-expand, :scope > .resource-popover-head .ke-modal-expand, :scope > .student-edit-head .ke-modal-expand")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ke-modal-expand";
    button.innerHTML = expandedIcon + "<span>全屏查看</span>";
    button.setAttribute("aria-label", "全屏查看弹框");
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => toggleExpanded(dialog));
    const header = panel.querySelector(":scope > .resource-popover-head, :scope > header, :scope > .student-edit-head");
    if (header) header.insertBefore(button, header.lastElementChild); else panel.append(button);
  }
  function toggleExpanded(dialog, expanded = !dialog.classList.contains("ke-expanded")) {
    const scrollers = [dialog, ...dialog.querySelectorAll("*")].filter((element) => element.scrollHeight > element.clientHeight).map((element) => ({ element, top: element.scrollTop, left: element.scrollLeft }));
    dialog.classList.toggle("ke-expanded", expanded);
    dialog.querySelectorAll(".ke-modal-expand").forEach((button) => {
      button.querySelector("span").textContent = expanded ? "退出全屏" : "全屏查看";
      button.setAttribute("aria-pressed", String(expanded));
      button.setAttribute("aria-label", expanded ? "退出弹框全屏" : "全屏查看弹框");
    });
    requestAnimationFrame(() => scrollers.forEach(({ element, top, left }) => { element.scrollTop = top; element.scrollLeft = left; }));
    if (dialog === popup) syncKnowledgeLayout();
  }
  const closeHandlers = {
    paperSetupDialog: () => document.querySelector("[data-paper-setup-cancel]")?.click(),
    addMaterialDialog: () => document.querySelector("[data-add-material-cancel]")?.click(),
    bookAssignmentDialog: () => closeBookAssignmentDialog(),
    appDialog: () => closeAppDialog(),
    fullOptionStudentDialog: () => closeFullOptionStudentDialog(),
    passwordResetDialog: () => closePasswordResetDialog(),
    studentEditDialog: () => closeStudentEdit(),
    popover: () => dismissResourcePopover(),
    wordDetailDialog: () => closeWordDetail(),
    lexicalChunkDialog: () => window.WordDetailCaseUI?.closeNested?.(),
  };
  function topModal() {
    return modalIDs.map((id) => document.getElementById(id)).filter(visible).sort((a, b) => {
      const z = Number.parseInt(getComputedStyle(a).zIndex) || 0;
      const other = Number.parseInt(getComputedStyle(b).zIndex) || 0;
      return z - other || (modalIDs.indexOf(a.id) - modalIDs.indexOf(b.id));
    }).at(-1);
  }
  document.addEventListener("keydown", (event) => {
    const current = topModal();
    if (!current) return;
    if (event.key === "Escape") {
      event.stopImmediatePropagation();
      const nativeMedia = document.fullscreenElement;
      if (nativeMedia?.matches("video,.resource-image-frame,.v15-video-player") || nativeMedia?.closest(".resource-image-frame")) {
        document.exitFullscreen?.();
        return;
      }
      event.preventDefault();
      if (current.id === "popover" && ["语法", "话题词汇"].includes(current.dataset.knowledgeType)) closeHandlers[current.id]?.();
      else if (current.classList.contains("ke-expanded")) toggleExpanded(current, false); else closeHandlers[current.id]?.();
    }
    // Let controls inside the modal receive arrows; the modal boundary isolates page navigation.
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key) && !current.contains(event.target)) event.stopPropagation();
    if (event.key === "Tab") {
      const controls = [...modalPanel(current).querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]')].filter((element) => !element.disabled && !element.hidden && !element.closest("[inert]") && getComputedStyle(element).display !== "none");
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
      if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
    }
  }, true);
  const observer = new MutationObserver(() => {
    modalIDs.forEach((id) => {
      const dialog = document.getElementById(id);
      if (!dialog) return;
      enhanceModal(dialog);
      if (!visible(dialog) && dialog.classList.contains("ke-expanded")) toggleExpanded(dialog, false);
    });
    syncKnowledgeLayout();
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  modalIDs.forEach((id) => enhanceModal(document.getElementById(id)));

  // Highlight and answer visibility are independent teaching controls.
  let grammarWidgetId = 0;
  function mountBasicGrammarAnswer(root) {
    root.dataset.answerBound='true';
    const answer=root.querySelector('[data-grammar-answer]');
    if(!answer)return;
    const id='v144-grammar-answer-'+(++grammarWidgetId);answer.id=id;answer.hidden=true;
    const toolbar=document.createElement('div');toolbar.className='ke-g-toolbar';
    toolbar.innerHTML=`<div class="ke-g-buttons"><button type="button" class="ke-g-structure" data-grammar-answer-toggle aria-controls="${id}" aria-pressed="false" aria-expanded="false">显示答案</button></div>`;
    const button=toolbar.querySelector('button');root.append(toolbar);
    button.addEventListener('click',()=>{
      const visible=answer.hidden;answer.hidden=!visible;
      button.setAttribute('aria-pressed',String(visible));button.setAttribute('aria-expanded',String(visible));
      button.classList.toggle('is-active',visible);button.textContent=visible?'隐藏答案':'显示答案';
      window.ClassroomTools?.refresh?.();
    });
  }
  function mountGrammar(root, source) {
    source = source?.isReviewSimulation ? source : window.V1219GrammarFocus?.project(source) || source;
    if (!source?.sentence || !source?.segments?.length || !window.GrammarDiagramLayout) return;
    const sentenceText = String(source.sentence);
    const segments = source.segments.map(segment => ({...segment, roleType:window.GrammarRolePalette.classify(segment.role,segment.roleType)}));
    if (!segments.every(segment => Number.isInteger(segment.start) && Number.isInteger(segment.end) && segment.end > segment.start && sentenceText.slice(segment.start,segment.end) === segment.quote)) return;
    root.dataset.bound = 'true'; root.dataset.grammarSentence = sentenceText;
    root.dataset.grammarStructureVisible = 'false';
    if(source.teachingFocus){root.dataset.grammarFocus=source.teachingFocus.policy;root.dataset.grammarOriginalCount=String(source.teachingFocus.originalCount);root.dataset.grammarDisplayedCount=String(source.teachingFocus.displayedCount);}
    const id='v142-grammar-'+(++grammarWidgetId);
    root.classList.add('v142-highlight-grammar');
    root.innerHTML=`<div class="ke-grammar-pair"><div class="ke-g-diagram"><div id="${id}-sentence" class="ke-g-sentence"><div class="ke-g-line"><div class="ke-g-line-words"></div></div></div></div>${source.translation?`<p class="ke-grammar-translation">${renderResourceMarkup(source.translation)}</p>`:''}</div><div class="ke-g-toolbar"><div class="ke-g-buttons"><button type="button" class="ke-g-structure" data-grammar-structure-toggle aria-controls="${id}-sentence" aria-pressed="false">显示句子结构</button><button type="button" class="ke-g-structure" data-grammar-answer-toggle aria-controls="${id}-answer" aria-pressed="false" aria-expanded="false">显示答案</button></div></div><span class="ke-sr-only" role="status" aria-live="polite"></span>`;
    const copy=root.closest('.resource-detail-copy')||root.parentElement;
    let description=copy.querySelector(':scope > .ke-grammar-description');
    const notes=segments.filter(segment=>String(segment.explanation||'').trim());
    if(notes.length){
      if(!description){description=document.createElement('section');description.className='ke-grammar-description';root.after(description);}
      description.innerHTML=notes.map(segment=>`<section class="knowledge-explanation is-unlabeled"><p>${renderResourceMarkup(segment.explanation)}</p></section>`).join('');
    }
    if(description){description.id=id+'-answer';description.hidden=true;description.dataset.grammarAnswer='';}
    const words=root.querySelector('.ke-g-line-words'),sentence=root.querySelector('.ke-g-sentence');
    const structureButton=root.querySelector('[data-grammar-structure-toggle]'),answerButton=root.querySelector('[data-grammar-answer-toggle]');
    const status=root.querySelector('[role=status]'),selected=new Set(segments.map((_,i)=>i));
    sentence.setAttribute('aria-label',sentenceText);
    // Split only at source structure boundaries, keeping internal spaces in each range.
    const cuts=[...new Set([0,sentenceText.length,...segments.flatMap(segment=>[segment.start,segment.end])])].sort((a,b)=>a-b);
    const runs=[];
    cuts.slice(0,-1).forEach((start,i)=>{
      const end=cuts[i+1],fragment={start,end,roles:segments.flatMap((segment,role)=>start>=segment.start&&end<=segment.end?[role]:[])};
      const role=window.GrammarDiagramLayout.roleForFragment(fragment,selected,segments);
      const prior=runs.at(-1);
      if(prior&&prior.role===role&&prior.end===start)prior.end=end;else runs.push({start,end,role});
    });
    runs.forEach(run=>{
      const span=document.createElement('span');span.className='ke-g-word';span.textContent=sentenceText.slice(run.start,run.end);
      span.dataset.start=run.start;span.dataset.end=run.end;if(run.role!==undefined)span.dataset.role=run.role;words.append(span);
    });
    function palette(){
      words.querySelectorAll('[data-role]').forEach(span=>window.GrammarRolePalette.apply(span,segments[Number(span.dataset.role)].roleType));
    }
    structureButton.addEventListener('click',()=>{
      const visible=structureButton.getAttribute('aria-pressed')!=='true';
      root.dataset.grammarStructureVisible=String(visible);structureButton.setAttribute('aria-pressed',String(visible));structureButton.classList.toggle('is-active',visible);structureButton.textContent=visible?'隐藏句子结构':'显示句子结构';
      words.querySelectorAll('[data-role]').forEach(span=>span.classList.toggle('is-active',visible));
      if(visible)palette();status.textContent=visible?'句子结构已显示':'句子结构已隐藏';window.ClassroomTools?.refresh?.();
    });
    answerButton.hidden=!description;
    answerButton.addEventListener('click',()=>{
      if(!description)return;
      const visible=description.hidden;description.hidden=!visible;answerButton.setAttribute('aria-pressed',String(visible));answerButton.setAttribute('aria-expanded',String(visible));answerButton.classList.toggle('is-active',visible);answerButton.textContent=visible?'隐藏答案':'显示答案';
      status.textContent=visible?'答案已显示':'答案已隐藏';window.ClassroomTools?.refresh?.();
    });
    palette();
    const themeObserver=new MutationObserver(()=>{if(!root.isConnected){themeObserver.disconnect();return;}palette();});
    themeObserver.observe(document.body,{attributes:true,attributeFilter:['class','style','data-demo-theme']});
    const popup=root.closest('.resource-popover');if(popup)themeObserver.observe(popup,{attributes:true,attributeFilter:['class','style']});
  }

  window.DemoKnowledgeEnhancements = {
    enhance: enhanceResourceContent,
    closeWordDetail,
    openWordDetail,
    rebindDetailMedia: (detail) => { detailAbortController?.abort(); detailAbortController = null; bindDetailMedia(detail); },
    enhanceModal,
    syncModalTheme,
    renderContextFirstSenseOverview,
    toggleExpanded,
    isModalOpen: () => Boolean(topModal()),
    syncTheme: () => modalIDs.map((id) => document.getElementById(id)).filter(Boolean).forEach(syncModalTheme),
    version: "V1.2.3",
  };
})();
