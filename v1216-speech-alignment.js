/* V1.2.16: restore verified speech grouping and native guidance; source objects remain untouched. */
(() => {
  "use strict";
  if (window.V1216SpeechAlignment || typeof resourceItemDetail !== "function") return;
  const nativeDetail = resourceItemDetail;
  const nativePronunciation = renderPronunciationResource;
  const nativeMarkup = renderResourceMarkup;
  const nativeCollection = showResourceCollectionPopover;
  const nativeBind = bindResourcePopoverInteractions;
  const nativeGuidanceSync = syncResourceGuidancePlayer;
  const guidanceDurations = new Map();
  const guidanceRequests = new Map();
  let speechDepth = 0;
  let omitMemberExplanation = false;
  const evidenceGroup = {
    set: "14255", transcript: "214274", target: "nationality", subtype: 4,
    // Order is the test teacher site's actual VoiceDetailDialog entry order.
    wordIds: [3103, 3104, 3102], recordIds: ["explanations:row-6684", "explanations:row-6683", "explanations:row-6685"]
  };
  const isSpeech = (item, source) => (item?.resourceType || source?.resourceType) === "语音";
  const sourceOnly = item => item?.realOnly === true || item?.bookKey === "test-single-book" ||
    (typeof getQuestion === "function" && typeof state !== "undefined" && getQuestion(state.currentQuestionId)?.realOnly === true);
  const identity = item => item?.sourceRecordId || item?.analysisRecordId || String(item?.analysisRow || "");
  function verifiedGroup(item) {
    if (!item || sourceOnly(item)) return [];
    const source = libraryResourceForItem(item) || item;
    if (!isSpeech(item, source) || String(source.oldSetId) !== evidenceGroup.set ||
      String(source.oldTranscriptId) !== evidenceGroup.transcript ||
      String(item.highlightTarget || source.highlight) !== evidenceGroup.target ||
      Number(source.resourceSubtype) !== evidenceGroup.subtype || !evidenceGroup.recordIds.includes(identity(source))) return [];
    const rows = window.FULLSCREEN_KNOWLEDGE_LIBRARY?.analysisResources || [];
    const members = evidenceGroup.recordIds.map(id => rows.find(row => identity(row) === id));
    if (members.some(row => !row || String(row.oldSetId) !== evidenceGroup.set ||
      String(row.oldTranscriptId) !== evidenceGroup.transcript || String(row.highlight) !== evidenceGroup.target ||
      Number(row.resourceSubtype) !== evidenceGroup.subtype || row.resourceType !== "语音" ||
      row.pronunciationPhenomenon || row.pronunciationAudio || String(row.content || "") !== String(source.content || ""))) return [];
    return members.map(row => ({...row, id:row.analysisRow, prominent:row.highlight, highlightTarget:row.highlight,
      contextSenseId:row.senseId, content:"", explainOne:"", explainTwo:""}));
  }
  function speechMarkup(value) {
    const tokens = [];
    const protectedText = String(value ?? "").replace(/\$\$([\s\S]*?)\$\$|《([^《》]+)》|@([^@\n]+)@|\{([^{}\n]+)\}/g,
      (_match, plosion, linking, assimilation, weak) => {
        const type = plosion !== undefined ? "incomplete-plosion" : linking !== undefined ? "linking" : assimilation !== undefined ? "assimilation" : "weak-form";
        const text = plosion ?? linking ?? assimilation ?? weak;
        const title = {"incomplete-plosion":"不完全爆破",linking:"连读",assimilation:"同化","weak-form":"弱读"}[type];
        const copy = nativeMarkup(text);
        tokens.push(`<span class="v16-speech-mark v16-speech-${type}" title="${title}">${type === "incomplete-plosion" ? `(${copy})` : copy}</span>`);
        return `V16SPEECHMARK${tokens.length - 1}TOKEN`;
      });
    return nativeMarkup(protectedText).replace(/V16SPEECHMARK(\d+)TOKEN/g, (_match, index) => tokens[Number(index)]);
  }
  renderResourceMarkup = function speechScopedMarkup(value) {
    return speechDepth ? speechMarkup(value) : nativeMarkup(value);
  };
  renderPronunciationMarkup = speechMarkup;
  renderPronunciationResource = function speechNativeEntry(item, source) {
    const renderSource = omitMemberExplanation && source ? {...source, content:""} : source;
    let html = nativePronunciation(item, renderSource);
    const word = item.word || source?.word || "";
    const context = word ? libraryContextForEntry({word, word_id:item.wordId || source?.wordId,
      part_id:item.partId || source?.partId, sense_id:item.senseId || source?.senseId,
      part_of_speech:item.partOfSpeech || source?.partOfSpeech || ""}, item) : null;
    const audio = context?.word?.guidanceAudio;
    if (audio && knowledgeAssetAvailable("guidanceAudio", audio)) {
      const card = renderPronunciationGuidanceCard(knowledgeAssetUrl("guidanceAudio", audio));
      // Preserve original meanings and their expansion/listeners; insert the existing native coach card before them.
      const holder = document.createElement("div"); holder.innerHTML = html;
      const entry = holder.querySelector(".pronunciation-entry");
      const anchor = entry?.querySelector(".resource-meanings, .pronunciation-phenomenon, .knowledge-explanation, .resource-examples");
      if (anchor) anchor.insertAdjacentHTML("beforebegin", card); else entry?.insertAdjacentHTML("beforeend", card);
      html = holder.innerHTML;
    }
    return html;
  };
  resourceItemDetail = function speechAlignedDetail(item) {
    const source = libraryResourceForItem(item);
    if (!isSpeech(item, source)) return nativeDetail(item);
    speechDepth++;
    const previousOmission = omitMemberExplanation;
    try {
      const members = verifiedGroup(item);
      if (!members.length) return `<div class="v16-speech-detail">${nativeDetail(item)}</div>`;
      omitMemberExplanation = true;
      // Each native call registers its own item, so the three 'more details' buttons retain the correct word IDs.
      const entries = members.map(member => nativeDetail(member)).join("");
      omitMemberExplanation = previousOmission;
      const explanation = String(item.content || source?.content || item.explainOne || item.explainTwo || "");
      return `<div class="v16-speech-detail v16-speech-group" data-v16-speech-source="14255:214274:nationality">${entries}${explanation.trim() ? `<section class="knowledge-explanation is-unlabeled v16-speech-group-explanation"><p>${speechMarkup(explanation)}</p></section>` : ""}</div>`;
    } finally { omitMemberExplanation = previousOmission; speechDepth--; }
  };
  showResourceCollectionPopover = function speechAlignedCollection(event, type, items, startIndex = 0) {
    if (type !== "语音") return nativeCollection(event, type, items, startIndex);
    const shown = new Set();
    const pages = items.filter(item => {
      const members = verifiedGroup(item);
      if (!members.length) return true;
      const key = evidenceGroup.recordIds.join("|");
      if (shown.has(key)) return false;
      shown.add(key); return true;
    });
    const requested = items[Math.max(0, Math.min(items.length - 1, Number(startIndex) || 0))];
    const requestedGroup = requested && verifiedGroup(requested).length;
    const selectedPage = Math.max(0, pages.findIndex(item => item === requested || (requestedGroup && verifiedGroup(item).length)));
    return nativeCollection(event, type, pages.map(item => {
      const source = libraryResourceForItem(item);
      const hasPhenomenon = String(item.pronunciationPhenomenon || source?.pronunciationPhenomenon || "").trim();
      return verifiedGroup(item).length || hasPhenomenon ? {...item, prominent:"", title:""} : item;
    }), selectedPage);
  };
  function showIdleGuidanceDuration() {
    const popup = document.getElementById("popover");
    if (!popup?.querySelector(".v16-speech-detail")) return;
    popup.querySelectorAll("[data-resource-guidance-card]").forEach(card => {
      const button = card.querySelector("[data-resource-audio]");
      const current = activeResourceAudioButton === button && resourceDetailAudio.dataset.source === button?.dataset.resourceAudio;
      const duration = guidanceDurations.get(button?.dataset.resourceAudio);
      if (!current && duration) {
        const time = card.querySelector("[data-resource-guidance-time]");
        if (time) time.textContent = `00:00 / ${formatAudioTime(duration)}`;
      }
    });
  }
  syncResourceGuidancePlayer = function speechGuidanceSync() { nativeGuidanceSync(); showIdleGuidanceDuration(); };
  bindResourcePopoverInteractions = function speechNativeBinding() {
    nativeBind();
    const popup = document.getElementById("popover");
    if (!popup?.querySelector(".v16-speech-detail")) return;
    popup.querySelectorAll("[data-resource-guidance-card] [data-resource-audio]").forEach(button => {
      const url = resolveDemoAudioURL(button.dataset.resourceAudio);
      if (!url || guidanceDurations.has(url) || guidanceRequests.has(url)) return;
      // Read the real AAC metadata without playing or changing the shared audio controller.
      const probe = new Audio(); probe.preload = "metadata";
      guidanceRequests.set(url, probe);
      const release = () => { guidanceRequests.delete(url); probe.removeAttribute("src"); probe.load(); };
      probe.addEventListener("loadedmetadata", () => {
        if (Number.isFinite(probe.duration) && probe.duration > 0) guidanceDurations.set(url, probe.duration);
        showIdleGuidanceDuration(); release();
      }, {once:true});
      probe.addEventListener("error", release, {once:true});
      probe.src = url;
    });
    showIdleGuidanceDuration();
  };
  window.V1216SpeechAlignment = Object.freeze({version:"V1.2.16", verifiedGroup, speechMarkup,
    sourcePolicy:"Verified source group only; native member records, meanings and audio lifecycle retained."});
})();
