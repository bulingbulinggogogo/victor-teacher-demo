/* V1.2.3: dismiss only the currently visible popup, without activating the page below it. */
(() => {
  "use strict";
  const registrations = [];
  const openingOrder = new WeakMap();
  const protectedPanels = new WeakSet();
  let sequence = 0;
  const visible = (element) => Boolean(element && !element.hidden && !element.classList.contains("hidden") && element.getClientRects().length && getComputedStyle(element).visibility !== "hidden");
  const containsPath = (event, element) => Boolean(element && event.composedPath().some((node) => node === element || (node instanceof Node && element.contains(node))));
  const clickClose = (root, selector) => root.querySelector(selector)?.click();
  const add = (selector, options = {}) => registrations.push({ selector, ...options });

  add("#lexicalChunkDialog", { close: () => window.WordDetailCaseUI?.closeNested?.(), closeSelector: "[data-lexical-chunk-close]", blockBubble: true });
  add("#wordDetailDialog", { closeSelector: "[data-word-detail-close]", blockBubble: true });
  add("#popover", { closeSelector: "[data-close-resource-popover]", blockBubble: true });
  [
    ["#paperSetupDialog", ".publish-dialog-panel", "button[data-paper-setup-cancel]"],
    ["#addMaterialDialog", ".add-material-panel", "button[data-add-material-cancel]"],
    ["#bookAssignmentDialog", ".publish-dialog-panel", "button[data-book-assignment-close]"],
    ["#appDialog", ".app-dialog-panel", "#appDialogCancel"],
    ["#fullOptionStudentDialog", ".app-dialog-panel", "button[data-full-option-students-close]"],
    ["#passwordResetDialog", ".app-dialog-panel", "button[data-password-reset-close]"],
    ["#studentEditDialog", ".app-dialog-panel", "button[data-student-edit-close]"],
  ].forEach(([selector, panelSelector, closeSelector]) => add(selector, { panelSelector, closeSelector, blockBubble: true }));
  add("#questionPickerPanel", { closeSelector: "#closeQuestionPicker", trigger: "#currentQuestionPicker", blockBubble: true });
  add("#interfaceSettingsPanel", { closeSelector: "#closeInterfaceSettings", trigger: "#interfaceSettingsToggle,.v106-dock-setting", blockBubble: true });
  add("#onlineSettingsPanel", { closeSelector: "#closeOnlineSettings", trigger: "#onlineSettingsToggle", blockBubble: true });
  add("#speedMenu", { boundary: "#speedSelect", close: () => closeSpeedMenu() });
  add("#onlineSpeedMenu", { boundary: "#onlineSpeedSelect", close: () => closeOnlineSpeedMenu() });
  add("#columnFilterMenu", { trigger: "[data-filter-column],[data-work-table-filter]", close: (root) => root.classList.add("hidden") });
  add("#bookCatalogFilterMenu", { trigger: "[data-book-catalog-unit-filter]", close: (root) => root.classList.add("hidden") });
  add("#publishStudentSearchResults", { boundary: ".publish-student-search", close: (root) => { state.publishStudentSearchOpen = false; root.classList.add("hidden"); } });
  add("#dateRangePanel", { trigger: "#customTimeToggle", closeSelector: "#cancelDateRange" });
  add("#sidebarRoleMenu", { boundary: ".sidebar-role-picker", close: (root) => { root.classList.add("hidden"); document.getElementById("sidebarRoleToggle")?.setAttribute("aria-expanded", "false"); } });
  add(".work-more-popover", { boundary: ".work-more-menu", close: (root) => { root.classList.add("hidden"); root.closest(".work-more-menu")?.querySelector("[data-work-more-toggle]")?.setAttribute("aria-expanded", "false"); } });
  add("#pageSizeSelect[open],#studentClassFilter[open],#studentExportMenu[open],#classSelect[open],#timeSelect[open],#setSelect[open],#orderSelect[open]", { close: (root) => root.removeAttribute("open") });

  function panels() {
    return registrations.flatMap((registration) => [...document.querySelectorAll(registration.selector)].filter(visible).map((root) => ({ registration, root, panel: registration.panelSelector ? root.querySelector(registration.panelSelector) || root : root })));
  }
  function stackingLevel(root) {
    let level = 0;
    for (let element = root; element && element !== document.body; element = element.parentElement) {
      const z = Number.parseInt(getComputedStyle(element).zIndex, 10);
      if (Number.isFinite(z)) level = Math.max(level, z);
    }
    return level;
  }
  function current() {
    return panels().sort((a, b) => {
      if (a.panel.contains(b.root)) return -1;
      if (b.panel.contains(a.root)) return 1;
      return stackingLevel(a.root) - stackingLevel(b.root) || (openingOrder.get(a.root) || 0) - (openingOrder.get(b.root) || 0);
    }).at(-1);
  }
  function dismiss(entry) {
    if (entry.registration.close) entry.registration.close(entry.root);
    else clickClose(entry.root, entry.registration.closeSelector);
  }
  function refresh() {
    panels().forEach(({ registration, root, panel }) => {
      if (!openingOrder.has(root)) openingOrder.set(root, ++sequence);
      // Preserve the dispatch path even when an audio button or a tab replaces its own markup.
      if (registration.blockBubble && !protectedPanels.has(panel)) {
        protectedPanels.add(panel);
        panel.addEventListener("click", (event) => event.stopPropagation());
      }
    });
  }
  // Window capture precedes existing document-level theme and page actions.
  window.addEventListener("click", (event) => {
    if(event.target instanceof Element && event.target.closest("#wordDetailDialog.v107-direct-pending")) return;
    refresh();
    const entry = current();
    if (!entry) return;
    const { registration, root, panel } = entry;
    const media=event.target instanceof Element&&event.target.closest('[data-v108-video-owner]');
    if(media&&document.getElementById(media.dataset.v108VideoOwner)===root)return;
    if (containsPath(event, panel)) return;
    if (registration.boundary && containsPath(event, root.closest(registration.boundary))) return;
    if (registration.trigger && event.composedPath().some((node) => node instanceof Element && node.matches(registration.trigger))) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    dismiss(entry);
  }, true);
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(({ target, type, attributeName }) => {
      if (type === "attributes" && ["class", "open", "hidden"].includes(attributeName) && target instanceof Element && visible(target)) {
        if (registrations.some(({ selector }) => target.matches(selector))) openingOrder.set(target, ++sequence);
      }
    });
    refresh();
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "open", "hidden"] });
  window.DemoPopupDismiss = {
    register(selector, options = {}) { add(selector, options); refresh(); },
    current() { const entry = current(); return entry?.root.id || entry?.root.className || null; },
    inventory() { return registrations.map(({ selector }) => selector); },
  };
  refresh();
})();
