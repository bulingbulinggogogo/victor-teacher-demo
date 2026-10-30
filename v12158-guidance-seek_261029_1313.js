/* Guidance range interaction for the first-level lecture vocabulary popup only. */
(() => {
  if (window.V158GuidanceSeek) return;
  const selector = '#popover.v148-vocabulary[data-knowledge-type="词汇"]:not(.ke-expanded):not(.v1263-interactive-fullscreen):not(.hidden):not([hidden]) [data-resource-guidance-progress]';
  const gestures = new WeakMap();
  let pending = null;
  function sliderFor(event) {
    const slider = event.target;
    return document.querySelector('#fullscreenPage:not(.hidden)') && slider instanceof HTMLInputElement && slider.matches(selector) ? slider : null;
  }
  function current(request) {
    return request.slider.isConnected && request.slider.matches(selector)
      && !!document.querySelector('#fullscreenPage:not(.hidden)')
      && activeResourceAudioButton === request.button
      && resourceAudioPlaySerial === request.ticket
      && resourceDetailAudio.dataset.source === request.source;
  }
  function seek(request) {
    if (!current(request) || !Number.isFinite(resourceDetailAudio.duration) || resourceDetailAudio.duration <= 0) return;
    const clip = resourceAudioSegment?.ticket === request.ticket ? resourceAudioSegment : null;
    const start = clip?.start || 0, end = clip?.end || resourceDetailAudio.duration;
    // At the right edge play the final instant and let the native ended lifecycle run.
    resourceDetailAudio.currentTime = Math.min(start + (end - start) * request.ratio, Math.max(start, end - .001));
    request.applied = true;
    syncResourceGuidancePlayer();
  }
  function playFrom(slider) {
    const button = slider.closest('[data-resource-guidance-card]')?.querySelector('[data-resource-audio]');
    if (!button || button.disabled || !window.DemoResourceAudio?.play) return;
    const source = resolveDemoAudioURL(button.dataset.resourceAudio);
    const ratio = Math.min(1, Math.max(0, Number(slider.value) / 100));
    if (!source || !Number.isFinite(ratio)) return;
    if (pending && current(pending) && pending.button === button) {
      pending.ratio = ratio; pending.applied = false; seek(pending); return;
    }
    const same = activeResourceAudioButton === button && resourceDetailAudio.dataset.source === source;
    if (same && !resourceDetailAudio.paused && Number.isFinite(resourceDetailAudio.duration)) {
      seek({slider,button,source,ratio,ticket:resourceAudioPlaySerial}); return;
    }
    // Use the existing source resolver, player, error notice and main-audio lifecycle.
    const request = {slider,button,source,ratio,ticket:0,applied:false};
    const loaded = () => seek(request);
    resourceDetailAudio.addEventListener('loadedmetadata', loaded);
    pending = request;
    const result = window.DemoResourceAudio.play(source, button);
    request.ticket = resourceAudioPlaySerial;
    seek(request);
    Promise.resolve(result).then(played => {
      if (played === false && current(request)) {
        resourceDetailAudio.pause();
        updateResourceAudioButton(button, false);
      }
      if (played && current(request) && !request.applied) seek(request);
      if (current(request)) syncResourceGuidancePlayer();
    }).catch(error => {
      if (current(request)) reportResourceAudioError(button, error);
    }).finally(() => {
      resourceDetailAudio.removeEventListener('loadedmetadata', loaded);
      if (pending === request) pending = null;
    });
  }
  document.addEventListener('pointerdown', event => {
    const slider = sliderFor(event);
    if (slider) gestures.set(slider, {input:false});
  }, true);
  document.addEventListener('input', event => {
    const slider = sliderFor(event);
    if (!slider) return;
    const gesture = gestures.get(slider);
    if (gesture) gesture.input = true;
    event.stopImmediatePropagation(); // Replace the old loaded-current-audio-only range handler.
    playFrom(slider);
  }, true);
  document.addEventListener('click', event => {
    const slider = sliderFor(event);
    if (!slider) return;
    const gesture = gestures.get(slider);
    gestures.delete(slider);
    if (!gesture?.input) playFrom(slider); // Also allow clicking the unchanged 0% thumb.
  }, true);
  window.V158GuidanceSeek = {version:'V1.2.158'};
})();
