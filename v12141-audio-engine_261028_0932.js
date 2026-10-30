/* V1.1.0 · Teacher demo natural media scheduler and full-paper estimate.
 * Loaded as a classic script after app.js. Durations come from real metadata;
 * elapsed-time acceptance uses native media events and unscaled wall clocks. */
(() => {
  "use strict";
  const old = {
    bindAudio, stopPracticeMode, setPlaybackRate, syncPracticeSettingsUi,
    setPracticeShortDialogueRepeats, setSimilarPracticeRepeats,
    updateAudioProgress, syncPracticePlaybackStatus,
  };
  const mediaInfo = new Map();
  const trace = { version: window.DEMO_VERSION || "V1.2.1", runs: [], events: [] };
  let generation = 0;
  let stageSerial = 0;
  let runSerial = 0;
  let currentRun = null;
  let stage = null;
  let delay = null;
  let auxiliary = null;
  let recording = null;
  let finishTimer = null;
  const perf = () => performance.now();
  const sourceKey = (value) => {
    try { return new URL(resolveDemoAudioURL(value), location.href).pathname; } catch { return String(value || ""); }
  };
  const stageContext = () => {
    const q = getQuestion(state.currentQuestionId);
    return {
      questionId: state.currentQuestionId, setId: q?.setId || "", textNo: q?.textNo,
      recordingKey: practiceTextKey(q), rate: state.playbackRate,
      repeats: q?.questionType === "短对话" ? state.practiceShortDialogueRepeats : 2,
      sectionInstructions: state.practiceChineseInstruction,
    };
  };
  function record(event, details = {}) {
    const entry = {
      event, utc: new Date().toISOString(), wallMs: Date.now(), monotonicMs: perf(),
      runId: currentRun?.id || null, stageId: stage?.id || null,
      generation, ...stageContext(), ...details,
    };
    trace.events.push(entry);
    return entry;
  }
  function ensureRun() {
    const q = getQuestion(state.currentQuestionId);
    if (currentRun?.status === "running" && currentRun.setId === q?.setId) return;
    if (currentRun?.status === "running") endRun("cancelled", "套题切换");
    currentRun = {
      id: `audio-run-${++runSerial}`, status: "running", setId: q?.setId || "",
      startedUtc: new Date().toISOString(), startedWallMs: Date.now(), startedMonotonicMs: perf(),
      configuration: { rate: state.playbackRate, shortRepeats: state.practiceShortDialogueRepeats,
        sectionInstructions: state.practiceChineseInstruction },
      estimateAtStart: estimateSuite(q?.setId),
    };
    trace.runs.push(currentRun);
    record("run-start", { configuration: currentRun.configuration });
  }
  function endRun(status, reason = "") {
    if (!currentRun || currentRun.status !== "running") return;
    currentRun.status = status;
    currentRun.reason = reason;
    currentRun.finishedUtc = new Date().toISOString();
    currentRun.finishedMonotonicMs = perf();
    currentRun.elapsedMs = currentRun.finishedMonotonicMs - currentRun.startedMonotonicMs;
    currentRun.estimateAtEnd = estimateSuite(currentRun.setId);
    record("run-end", { status, reason, elapsedMs: currentRun.elapsedMs });
  }
  function finishStage(reason = "natural", extra = {}) {
    if (!stage) return;
    record("stage-end", {
      kind: stage.kind, reason, source: stage.source || "", duration: stage.duration,
      repeat: stage.repeat, expectedDelayMs: stage.expectedDelayMs,
      elapsedMs: perf() - stage.startedMonotonicMs, ...extra,
    });
    stage = null;
  }
  function beginStage(kind, details = {}) {
    if (stage) finishStage("superseded");
    stage = { id: `stage-${++stageSerial}`, kind, generation, startedMonotonicMs: perf(), ...details };
    record("stage-start", { kind, ...details });
    return stage;
  }
  function current(ticket) {
    return ticket?.generation === generation && state.practiceModeActive
      && !els.fullscreenPage.classList.contains("hidden")
      && ticket.questionId === state.currentQuestionId;
  }
  function clearLocalWork() {
    clearPracticeTimer();
    clearTimeout(finishTimer);
    finishTimer = null;
    delay = null;
    auxiliary = null;
    recording = null;
    state.practiceAuxiliaryCallback = null;
    els.audio.pause();
    els.practiceInstructionAudio.pause();
  }
  function cancel(reason = "页面离开") {
    finishStage("cancelled", { reason });
    endRun("cancelled", reason);
    generation += 1;
    clearLocalWork();
    state.practicePaused = false;
    setPlayButton(false);
    record("cancel", { reason });
  }
  function reportMissing(source, reason = "媒体加载失败") {
    mediaInfo.set(sourceKey(source), { status: "missing", source, reason });
    finishStage("media-error", { reason, source });
    endRun("failed", reason);
    generation += 1;
    clearLocalWork();
    state.practicePhase = "missing";
    state.practicePaused = true;
    $("#playPause").disabled = true;
    $("#playPause").title = "素材待补齐";
    $("#audioSeek").disabled = true;
    setPlayButton(false);
    const status = $("#practicePlaybackStatus");
    if (status) { status.classList.remove("hidden"); status.textContent = "素材待补齐"; }
    record("media-error", { source, reason });
    updateSuiteEstimate();
  }
  function observeMetadata(media, source = media.getAttribute("src") || media.currentSrc) {
    if (!source || !Number.isFinite(media.duration) || media.duration <= 0) return;
    mediaInfo.set(sourceKey(source), {
      source, duration: media.duration, status: "ready", method: "HTMLMediaElement.duration",
      observedUtc: new Date().toISOString(),
    });
    updateSuiteEstimate();
  }
  function preload(source) {
    source = resolveDemoAudioURL(source);
    return new Promise((resolve) => {
      const media = new Audio();
      media.preload = "metadata";
      let timer;
      let done = false;
      const settle = (info) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        media.removeEventListener("loadedmetadata", loaded);
        media.removeEventListener("error", failed);
        mediaInfo.set(sourceKey(source), info);
        media.removeAttribute("src");
        media.load();
        updateSuiteEstimate();
        resolve(info);
      };
      const loaded = () => {
        const duration = media.duration;
        if (Number.isFinite(duration) && duration > 0) settle({ status: "ready", source, duration,
          method: "HTMLMediaElement.duration", observedUtc: new Date().toISOString() });
        else settle({ status: "unknown", source, reason: "媒体时长尚未取得" });
      };
      const failed = () => settle({ status: "missing", source, reason: "媒体加载失败", mediaErrorCode: media.error?.code });
      media.addEventListener("loadedmetadata", loaded);
      media.addEventListener("error", failed);
      timer = setTimeout(() => settle({ status: "unknown", source, reason: "媒体元数据加载超时" }), 20000);
      media.src = source;
      media.load();
    });
  }
  let manifestRows = [];
  const metadataReady = fetch("./data/audio-durations.json").then((response) => {
    if (!response.ok) throw new Error("时长清单不可用");
    return response.json();
  }).then((rows) => {
    rows = [...rows, ...(window.TEST_SINGLE_BOOK?.audioDurations || []), ...(window.V12140_PRACTICE_MEDIA || [])];
    manifestRows = rows;
    // afinfo is retained for provenance. Browser duration is authoritative for this UI.
    rows.forEach((row) => mediaInfo.set(sourceKey(`./${row.path}`), {
      status: "loading", source: `./${row.path}`, fileDuration: row.duration,
      fileDurationSource: row.source, sha256: row.sha256,
    }));
    return Promise.all(rows.filter((row) => !row.path.endsWith("ending-instruction.mp3"))
      .map((row) => preload(`./${row.path}`)));
  }).catch((error) => { record("metadata-manifest-error", { message: error.message }); return []; });

  function durationFor(source) {
    const value = mediaInfo.get(sourceKey(source));
    return value?.status === "ready" && Number.isFinite(value.duration) ? value.duration : null;
  }
  function suiteGroups(setId) {
    const questions = state.questions.filter((q) => String(q.setId) === String(setId))
      .sort((a, b) => Number(a.questionNo) - Number(b.questionNo));
    const groups = new Map();
    questions.forEach((q) => {
      const key = `${q.setId}:${q.textNo}`;
      if (!groups.has(key)) groups.set(key, { key, q, questions: [] });
      groups.get(key).questions.push(q);
    });
    return [...groups.values()];
  }
  function estimateSuite(setId = getQuestion(state.currentQuestionId)?.setId) {
    const groups = suiteGroups(setId);
    const rate = state.playbackRate || 1;
    const parts = [];
    const missing = [];
    let seconds = 0;
    if (!groups.length) return { known: false, setId, seconds: null, parts, missing: ["套题未加载"] };
    const required = (source) => {
      const duration = durationFor(source);
      if (duration === null) missing.push({ source, status: mediaInfo.get(sourceKey(source))?.status || "unknown" });
      return duration;
    };
    groups.forEach(({ q, key, questions }) => {
      const first = Number(questions[0].questionNo);
      const last = Number(questions.at(-1).questionNo);
      const range = first === last ? `${first}` : `${first}-${last}`;
      const instructionFile = PRACTICE_INSTRUCTION_FILES[range];
      const instructionSrc = instructionFile ? `${PRACTICE_AUDIO_ROOT}/${instructionFile}` : "";
      const recordingSrc = timecodeAudioUrl(findTimecode(q));
      const beep = required(`${PRACTICE_AUDIO_ROOT}/ding.wav`);
      const instruction = !state.practiceChineseInstruction ? 0 : instructionSrc ? required(instructionSrc) : null;
      if (state.practiceChineseInstruction && !instructionSrc) missing.push({ source: `题组指令 ${range}`, status: "not-supplied", kind: "group-instruction", range });
      const audio = recordingSrc ? required(recordingSrc) : null;
      if (!recordingSrc) missing.push({ source: key, status: "missing" });
      const count = questions.length;
      const repeats = q.questionType === "短对话" ? state.practiceShortDialogueRepeats : 2;
      const readAnswerSeconds = 10 * count;
      const mediaSeconds = beep !== null && instruction !== null && audio !== null
        ? (beep + instruction + audio * repeats) / rate : null;
      const total = mediaSeconds === null ? null : readAnswerSeconds + mediaSeconds;
      // Retain all measured components when an instruction is not supplied.
      const knownTotalSeconds = readAnswerSeconds + ((beep ?? 0) + (instruction ?? 0) + (audio ?? 0) * repeats) / rate;
      seconds += knownTotalSeconds;
      parts.push({ key, textNo: q.textNo, count, repeats, rate, readAnswerSeconds,
        beepDuration: beep, groupInstructionDuration: instruction, recordingDuration: audio,
        totalSeconds: total, knownTotalSeconds, recordingSrc, instructionSrc });
    });
    const sections = [...new Set(groups.map(({ q }) => practiceSection(q)))];
    if (state.practiceChineseInstruction) sections.forEach((section) => {
      const source = `${PRACTICE_AUDIO_ROOT}/${PRACTICE_GLOBAL_INSTRUCTION_FILES[section]}`;
      const duration = required(source);
      if (duration !== null) seconds += duration / rate;
      parts.push({ section, source, duration, rate, totalSeconds: duration === null ? null : duration / rate });
    });
    const known = missing.length === 0;
    // Preserve precision across all phases: round the aggregate to milliseconds, then floor seconds.
    const milliseconds = known ? Math.round(seconds * 1000) : null;
    const knownMilliseconds = Math.round(seconds * 1000);
    return { known, setId, knownMilliseconds, knownSeconds: Math.floor(knownMilliseconds / 1000), seconds: milliseconds === null ? null : Math.floor(milliseconds / 1000),
      preciseSeconds: known ? seconds : null, milliseconds, rate,
      shortRepeats: state.practiceShortDialogueRepeats, sectionInstructions: state.practiceChineseInstruction,
      excludedCheckingSeconds: PRACTICE_CHECK_SECONDS, parts, missing };
  }
  function updateSuiteEstimate() {
    const result = estimateSuite();
    const node = $("#suiteEstimate");
    if (node) {
      const format = seconds => `${String(Math.floor(seconds / 60)).padStart(2, "0")}分${String(seconds % 60).padStart(2, "0")}秒`;
      const onlyMissingInstructions = result.missing.length > 0 && result.missing.every(item => item.kind === "group-instruction" && item.status === "not-supplied");
      node.textContent = result.known ? `套题预计时长 ${format(result.seconds)}`
        : onlyMissingInstructions ? `套题预计时长 至少${format(result.knownSeconds)}（缺${result.missing.length}段指令）`
        : result.missing.some(item => item.status === "loading") ? "套题时长计算中…" : "套题时长暂未取得";
      node.title = result.known ? "整套预计时长；不含最后60秒检查" : onlyMissingInstructions
        ? `已计入全部录音、已提供指令与读答题时间；待补${result.missing.map(item => item.range).join("、")}题指令；不含最后60秒检查`
        : "媒体尚未加载完成，请重试；不使用估算文件时长替代实测";
      node.dataset.known = String(result.known);
      node.dataset.partial = String(onlyMissingInstructions);
    }
    return result;
  }
  window.updateSuiteEstimate = updateSuiteEstimate;

  function scheduleDelay(ticket) {
    if (!current(ticket) || state.practicePaused) return;
    clearPracticeTimer({ keepCallback: true });
    ticket.startedMonotonicMs = perf();
    ticket.deadline = perf() + ticket.remainingMs;
    state.practiceTimerRemainingMs = ticket.remainingMs;
    state.practiceTimerStartedAt = Date.now();
    state.practiceTimerCallback = ticket.callback;
    state.practiceTimer = setTimeout(() => {
      if (delay !== ticket || !current(ticket) || state.practicePaused) return;
      ticket.remainingMs = 0;
      const callback = ticket.callback;
      delay = null;
      clearPracticeTimer();
      state.practiceTimerRemainingMs = 0;
      finishStage("natural", { expectedDelayMs: ticket.initialMs });
      callback?.();
    }, ticket.remainingMs);
    state.practiceCountdownTicker = setInterval(syncPracticePlaybackStatus, 250);
    setPlayButton(true);
    syncPracticePlaybackStatus();
  }
  startPracticeDelay = function (phase, durationMs, callback) {
    clearPracticeTimer();
    auxiliary = null;
    recording = null;
    state.practicePhase = phase;
    state.practicePaused = false;
    lockPracticeProgress();
    beginStage(phase, { expectedDelayMs: durationMs });
    delay = { generation, questionId: state.currentQuestionId, initialMs: durationMs,
      remainingMs: durationMs, callback, phase };
    scheduleDelay(delay);
  };
  pausePracticeDelay = function () {
    if (!delay || state.practicePaused) return;
    delay.remainingMs = Math.max(0, delay.deadline - perf());
    state.practiceTimerRemainingMs = delay.remainingMs;
    state.practicePaused = true;
    clearPracticeTimer({ keepCallback: true });
    record("pause-start", { kind: delay.phase, remainingMs: delay.remainingMs });
    setPlayButton(false);
    syncPracticePlaybackStatus();
  };
  resumePracticeDelay = function () {
    if (!delay || !current(delay)) return;
    record("pause-end", { kind: delay.phase, remainingMs: delay.remainingMs });
    state.practicePaused = false;
    scheduleDelay(delay);
  };

  async function playMedia(media, ticket) {
    if (!current(ticket)) return;
    try {
      await media.play();
      if (!current(ticket)) return; // A newer stage may already own this same media element.
      setPlayButton(!state.practicePaused);
    } catch (error) {
      if (!current(ticket) || (error.name === "AbortError" && state.practicePaused)) return;
      if (error.name === "NotAllowedError") {
        state.practicePaused = true;
        setPlayButton(false);
        record("autoplay-blocked", { source: ticket.source });
        syncPracticePlaybackStatus();
      } else reportMissing(ticket.source, error.message || "媒体播放失败");
    }
  }
  playPracticeAuxiliary = function (src, phase, unusedRate, callback = null) {
    clearPracticeTimer();
    delay = null;
    recording = null;
    els.practiceInstructionAudio.pause();
    state.practicePhase = phase;
    state.practicePaused = false;
    state.practiceAuxiliaryCallback = callback;
    lockPracticeProgress();
    auxiliary = { generation, questionId: state.currentQuestionId, source: src, phase, callback,
      section: /section-[12]-instruction\.mp3(?:$|\?)/.test(src) };
    beginStage(auxiliary.section ? "section-instruction" : phase === "ding" ? "ding" : "group-instruction",
      { source: src, duration: durationFor(src), rate: state.playbackRate });
    if (mediaInfo.get(sourceKey(src))?.status === "missing") { reportMissing(src); return; }
    els.practiceInstructionAudio.src = resolveDemoAudioURL(src);
    els.practiceInstructionAudio.playbackRate = state.playbackRate;
    els.practiceInstructionAudio.currentTime = 0;
    playMedia(els.practiceInstructionAudio, auxiliary);
    syncPracticePlaybackStatus();
  };
  playPracticeDing = function (callback) {
    playPracticeAuxiliary(`${PRACTICE_AUDIO_ROOT}/ding.wav`, "ding", state.playbackRate, callback);
  };
  playPracticeInstruction = function (src, callback, phase = "instruction") {
    const section = /section-[12]-instruction\.mp3(?:$|\?)/.test(src);
    if (!src || (section && !state.practiceChineseInstruction)) {
      record("section-instruction-skipped", { source: src });
      callback?.();
      return;
    }
    playPracticeAuxiliary(src, phase, state.playbackRate, callback);
  };
  playPracticeRecording = function (repeatIndex = 1) {
    const config = practiceConfig();
    const src = config && timecodeAudioUrl(findTimecode(config.q));
    if (!config || !src) { reportMissing(src || "当前录音"); return; }
    clearPracticeTimer();
    delay = null;
    auxiliary = null;
    els.practiceInstructionAudio.pause();
    state.practiceAuxiliaryCallback = null;
    state.practicePhase = "recording";
    state.practicePaused = false;
    state.practiceRepeatIndex = repeatIndex;
    state.playbackStopTime = null;
    state.playbackScope = null;
    recording = { generation, questionId: state.currentQuestionId, source: src,
      repeat: repeatIndex, phase: "recording" };
    beginStage("recording", { source: src, duration: durationFor(src), repeat: repeatIndex, rate: state.playbackRate });
    if (mediaInfo.get(sourceKey(src))?.status === "missing") { reportMissing(src); return; }
    const ticket = recording;
    if (sourceKey(els.audio.getAttribute("src")) !== sourceKey(src)) {
      els.audio.src = resolveDemoAudioURL(src);
      els.audio.load();
    }
    const begin = () => {
      if (recording !== ticket || !current(ticket)) return;
      els.audio.currentTime = 0;
      els.audio.playbackRate = state.playbackRate;
      $("#audioSeek").disabled = false;
      updateAudioProgress();
      playMedia(els.audio, ticket);
      syncPracticePlaybackStatus();
    };
    if (els.audio.readyState >= 1) begin();
    else els.audio.addEventListener("loadedmetadata", begin, { once: true });
  };
  function auxiliaryEnded(event) {
    if (!state.practiceModeActive) return;
    event.stopImmediatePropagation();
    if (event.type === "error") {
      if (auxiliary && current(auxiliary)) reportMissing(auxiliary.source, `辅助媒体错误 ${els.practiceInstructionAudio.error?.code || ""}`);
      return;
    }
    const ticket = auxiliary;
    if (!ticket || !current(ticket) || state.practicePaused
      || sourceKey(els.practiceInstructionAudio.currentSrc) !== sourceKey(ticket.source)) return;
    auxiliary = null;
    state.practiceAuxiliaryCallback = null;
    finishStage("natural", { mediaCurrentTime: els.practiceInstructionAudio.currentTime,
      mediaDuration: els.practiceInstructionAudio.duration });
    ticket.callback?.();
  }
  els.practiceInstructionAudio.addEventListener("ended", auxiliaryEnded, true);
  els.practiceInstructionAudio.addEventListener("error", auxiliaryEnded, true);
  els.audio.addEventListener("ended", (event) => {
    if (!state.practiceModeActive) return;
    event.stopImmediatePropagation();
    const ticket = recording;
    if (!ticket || !current(ticket) || state.practicePaused || state.practicePhase !== "recording"
      || sourceKey(els.audio.currentSrc) !== sourceKey(ticket.source)) return;
    recording = null;
    finishStage("natural", { mediaCurrentTime: els.audio.currentTime, mediaDuration: els.audio.duration });
    advancePracticeRecording();
  }, true);
  els.audio.addEventListener("error", (event) => {
    const src = els.audio.currentSrc || els.audio.getAttribute("src");
    if (state.practiceModeActive) {
      event.stopImmediatePropagation();
      const expectedSource = timecodeAudioUrl(findTimecode(getQuestion(state.currentQuestionId)));
      if (src && expectedSource && sourceKey(src) === sourceKey(expectedSource)
        && els.audio.error?.code !== 1 && !els.fullscreenPage.classList.contains("hidden")) {
        reportMissing(src, `录音媒体错误 ${els.audio.error?.code || ""}`);
      }
    } else if (src) {
      mediaInfo.set(sourceKey(src), { status: "missing", source: src, reason: "媒体加载失败" });
      $("#playPause").disabled = true;
      $("#playPause").title = "素材待补齐";
      $("#audioSeek").disabled = true;
      setPlayButton(false);
      updateSuiteEstimate();
    }
  }, true);
  [els.audio, els.practiceInstructionAudio].forEach((media) => {
    media.addEventListener("loadedmetadata", () => observeMetadata(media));
    media.addEventListener("playing", () => {
      const ticket = media === els.audio ? recording : auxiliary;
      if (!ticket || !current(ticket)) return;
      record("media-playing", { source: ticket.source, mediaCurrentTime: media.currentTime,
        mediaDuration: media.duration, playbackRate: media.playbackRate });
    });
    media.addEventListener("waiting", () => {
      const ticket = media === els.audio ? recording : auxiliary;
      if (ticket && current(ticket)) record("buffer-start", { source: ticket.source, mediaCurrentTime: media.currentTime });
    });
    media.addEventListener("stalled", () => {
      const ticket = media === els.audio ? recording : auxiliary;
      if (ticket && current(ticket)) record("media-stalled", { source: ticket.source, mediaCurrentTime: media.currentTime });
    });
    media.addEventListener("seeked", () => {
      const ticket = media === els.audio ? recording : auxiliary;
      if (ticket && current(ticket)) record("media-seeked", { source: ticket.source, mediaCurrentTime: media.currentTime });
    });
  });
  startPracticeSequence = function () {
    const config = practiceConfig();
    if (!state.practiceModeActive || !config) return;
    ensureRun();
    const requiredSources = [timecodeAudioUrl(findTimecode(config.q)), `${PRACTICE_AUDIO_ROOT}/ding.wav`, config.instructionSrc];
    const section = practiceSection(config.q);
    const sectionKey = practiceSectionKey(config.q, section);
    if (state.practiceChineseInstruction && practiceUsesFullPaperStages()
      && !state.practiceIntroducedSections.has(sectionKey)) {
      requiredSources.push(`${PRACTICE_AUDIO_ROOT}/${PRACTICE_GLOBAL_INSTRUCTION_FILES[section]}`);
    }
    const unavailable = requiredSources.find((src) => src && mediaInfo.get(sourceKey(src))?.status === "missing");
    if (unavailable) { reportMissing(unavailable); return; }
    finishStage("group-change");
    generation += 1;
    clearLocalWork();
    state.practiceTextKey = practiceTextKey(config.q);
    state.practiceRepeatIndex = 0;
    state.practicePaused = false;
    state.practiceAuxiliaryCallback = null;
    lockPracticeProgress();
    record("group-start", { questionNumbers: config.questions.map((q) => q.questionNo) });
    startPracticeTextWithSectionInstruction(config);
    updateSuiteEstimate();
  };
  startPracticeClosingStages = function () {
    state.practiceClosingStagesStarted = true;
    startPracticeDelay("checking", PRACTICE_CHECK_SECONDS * 1000, completePracticeSequence);
  };
  completePracticeSequence = function () {
    finishStage("natural");
    state.practicePhase = "completed";
    state.practicePaused = false;
    state.practiceAuxiliaryCallback = null;
    auxiliary = null;
    recording = null;
    $("#audioSeek").disabled = false;
    setPlayButton(false);
    syncPracticePlaybackStatus();
    updateAudioProgress();
    endRun("completed", "整套自然播放完成，检查60秒单独计入实际经过时间");
    const ticket = generation;
    finishTimer = setTimeout(() => {
      if (ticket !== generation || !state.practiceModeActive || state.practicePhase !== "completed") return;
      stopPracticeMode({ restore: false, render: false });
      resetTranscriptTeachingModes({ restoreAnalysis: false, pauseAudio: false });
      state.showAnswer = false;
      state.showAnswerAnalysis = false;
      state.showAnalysis = false;
      state.questionPanelCollapsed = false;
      state.showQuestionTranslation = false;
      state.showTranscriptTranslation = false;
      state.activeKnowledgeType = null;
      closeResourcePopover();
      if (!els.fullscreenPage.classList.contains("hidden")) renderFull();
    }, 600);
  };
  stopPracticeMode = function (options) {
    cancel("停止套题播放");
    old.stopPracticeMode(options);
  };
  function pauseOrResumePractice() {
    if (!state.practiceModeActive) return;
    if (["reading", "answering", "checking"].includes(state.practicePhase)) {
      if (state.practicePaused) resumePracticeDelay(); else pausePracticeDelay();
      return;
    }
    const media = ["instruction", "ding"].includes(state.practicePhase) ? els.practiceInstructionAudio : els.audio;
    const ticket = media === els.audio ? recording : auxiliary;
    if (!ticket || !current(ticket)) return;
    if (state.practicePaused || media.paused) {
      record("pause-end", { kind: state.practicePhase, source: ticket.source, mediaCurrentTime: media.currentTime });
      state.practicePaused = false;
      playMedia(media, ticket);
    } else {
      state.practicePaused = true;
      media.pause();
      record("pause-start", { kind: state.practicePhase, source: ticket.source, mediaCurrentTime: media.currentTime });
      setPlayButton(false);
    }
    syncPracticePlaybackStatus();
  }
  $("#playPause").addEventListener("click", (event) => {
    if (!state.practiceModeActive) return;
    event.stopImmediatePropagation();
    event.preventDefault();
    pauseOrResumePractice();
  }, true);

  setPlaybackRate = function (rate, closeMenu = true) {
    old.setPlaybackRate(rate, closeMenu);
    if (state.practiceModeActive && ["instruction", "ding"].includes(state.practicePhase)) {
      els.practiceInstructionAudio.playbackRate = state.playbackRate;
    }
    record("rate-change", { rate: state.playbackRate, mediaCurrentTime: state.practicePhase === "recording"
      ? els.audio.currentTime : els.practiceInstructionAudio.currentTime });
    updateSuiteEstimate();
  };
  setPracticeShortDialogueRepeats = function (repeats) {
    old.setPracticeShortDialogueRepeats(repeats);
    record("repeat-change", { shortRepeats: state.practiceShortDialogueRepeats });
    updateSuiteEstimate();
  };
  setSimilarPracticeRepeats = function (repeats) {
    old.setSimilarPracticeRepeats(repeats);
    updateSuiteEstimate();
  };
  setPracticeChineseInstruction = function (enabled) {
    state.practiceChineseInstruction = Boolean(enabled);
    demoStorage.setItem("victor:practiceChineseInstruction", String(state.practiceChineseInstruction));
    syncPracticeSettingsUi();
    record("section-instruction-setting", { enabled: state.practiceChineseInstruction });
    updateSuiteEstimate();
    if (!state.practiceChineseInstruction && auxiliary?.section && current(auxiliary)) {
      const ticket = auxiliary;
      const wasPaused = state.practicePaused;
      auxiliary = null;
      state.practiceAuxiliaryCallback = null;
      els.practiceInstructionAudio.pause();
      finishStage("section-skipped-by-user", { source: ticket.source });
      ticket.callback?.();
      if (wasPaused && !state.practicePaused) pauseOrResumePractice();
    }
  };
  syncPracticeSettingsUi = function () {
    old.syncPracticeSettingsUi();
    const button = $("#practiceInstructionBtn");
    if (button) button.title = state.practiceChineseInstruction
      ? "播放节总指令；题组指令始终播放" : "跳过节总指令；题组指令仍播放";
    updateSuiteEstimate();
  };
  syncPracticePlaybackStatus = function () {
    old.syncPracticePlaybackStatus();
    if (state.practiceModeActive && state.practicePhase === "missing") {
      const node = $("#practicePlaybackStatus");
      if (node) { node.classList.remove("hidden"); node.textContent = "素材待补齐"; }
    }
  };
  bindAudio = function (q) {
    old.bindAudio(q);
    const src = timecodeAudioUrl(findTimecode(q));
    if (src && mediaInfo.get(sourceKey(src))?.status === "missing") {
      $("#playPause").disabled = true;
      $("#playPause").title = "素材待补齐";
      $("#audioSeek").disabled = true;
    }
    updateSuiteEstimate();
  };
  updateAudioProgress = function () {
    old.updateAudioProgress();
    const currentTime = Number.isFinite(els.audio.currentTime) ? els.audio.currentTime : 0;
    const duration = Number.isFinite(els.audio.duration) && els.audio.duration > 0 ? formatAudioTime(els.audio.duration) : "--:--";
    const showTime = state.practiceModeActive && !["recording", "completed"].includes(state.practicePhase) ? "00:00" : formatAudioTime(currentTime);
    $("#audioDuration").textContent = `${showTime} / ${duration}`;
    $("#audioDuration").setAttribute("aria-label", "音频当前时间与总时长");
  };
  window.DemoTimingTrace = {
    get runs() { return trace.runs; }, get events() { return trace.events; },
    snapshot() { return JSON.parse(JSON.stringify({ ...trace, metadata: [...mediaInfo.values()] })); },
    clear() {
      if (currentRun?.status === "running") throw new Error("完整播放期间不能清除验收日志");
      trace.runs.length = 0; trace.events.length = 0; currentRun = null;
    },
  };
  window.DemoAudioEngine = {
    cancel, estimate: estimateSuite, metadataReady, updateSuiteEstimate, togglePractice: pauseOrResumePractice,
    async retryMetadata() {
      if (!manifestRows.length) {
        try {const response = await fetch("./data/audio-durations.json", {cache:"no-store"});if(!response.ok)throw new Error("metadata unavailable");manifestRows=[...await response.json(),...(window.TEST_SINGLE_BOOK?.audioDurations||[]),...(window.V12140_PRACTICE_MEDIA||[])];}
        catch(error){record("metadata-retry-error",{message:error.message});return [];}
      }
      const rows=manifestRows.filter(row=>!row.path.endsWith("ending-instruction.mp3")&&mediaInfo.get(sourceKey(`./${row.path}`))?.status!=="ready");
      return Promise.all(rows.map(row=>preload(`./${row.path}`)));
    },
    get metadata() { return [...mediaInfo.values()]; },
    get generation() { return generation; },
  };
})();
