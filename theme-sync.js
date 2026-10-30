/* V1.2.2 · Complete role palette from the test deployment.
 * 97 captured color tokens (the 98th, transcript padding, is geometry and excluded); semantic red adapts only to the confirmed dark-red requirement.
 * This layer changes colors only. It does not alter content, typography, sizing or playback. */
(function () {
  "use strict";
  const capturedDark = {
  "--lecture-phonetic-red": "#f04444",
  "--lecture-rich-color": "#ff6f7d",
  "--lecture-translation": "#919aa8",
  "--lecture-option-fill": "#cbd5e1",
  "--lecture-knowledge-text": "#c4ccd7",
  "--lecture-ring-center": "var(--lecture-panel)",
  "--lecture-ring-track": "color-mix(in srgb, var(--lecture-border) 70%, transparent)",
  "--lecture-ring-shadow": "inset 0 0 0 1px color-mix(in srgb, var(--lecture-border) 44%, transparent)",
  "--lecture-ring-selected-center": "color-mix(in srgb, var(--lecture-primary) 17%, var(--lecture-panel))",
  "--lecture-ring-selected-shadow": "0 0 0 2px var(--lecture-primary), 0 5px 14px color-mix(in srgb, var(--lecture-primary) 28%, transparent)",
  "--lecture-select-menu-shadow": "0 16px 36px #0000004d",
  "--lecture-select-menu-background": "var(--lecture-panel)",
  "--lecture-select-option-hover": "color-mix(in srgb, var(--lecture-primary) 10%, transparent)",
  "--lecture-select-option-active": "color-mix(in srgb, var(--lecture-primary) 14%, transparent)",
  "--lecture-select-border": "var(--lecture-border)",
  "--lecture-select-background": "color-mix(in srgb, var(--lecture-panel) 76%, transparent)",
  "--lecture-select-text": "var(--lecture-text)",
  "--lecture-select-focus-shadow": "0 0 0 2px color-mix(in srgb, var(--lecture-primary) 16%, transparent)",
  "--lecture-picker-background": "#1a222e",
  "--lecture-picker-border": "#526479",
  "--lecture-picker-shadow": "0 22px 54px #00000061",
  "--lecture-rate-good": "#16a34a",
  "--lecture-rate-medium": "#facc15",
  "--lecture-rate-low": "#ef4444",
  "--lecture-question-border": "color-mix(in srgb, var(--lecture-primary) 72%, var(--lecture-border))",
  "--lecture-question-background": "color-mix(in srgb, var(--lecture-primary) 15%, var(--lecture-panel))",
  "--lecture-play-background": "#1268f3",
  "--lecture-play-hover": "#0f5bea",
  "--lecture-play-border": "#7eb0ff",
  "--lecture-play-text": "#fff",
  "--lecture-play-shadow": "0 6px 14px #1268f338",
  "--lecture-progress-track": "#e2e7ee",
  "--lecture-progress-border": "#a5adb8",
  "--lecture-text": "#eef2f6",
  "--lecture-muted": "#aab3bf",
  "--lecture-primary": "#3b82f6",
  "--lecture-panel-deep": "#12161d",
  "--lecture-panel": "#1b2028",
  "--lecture-border": "#b2bbc738",
  "--lecture-page-background": "#0b0d11",
  "--lecture-header-background": "#08101b6b",
  "--lecture-header-text": "var(--lecture-text)",
  "--lecture-button-background": "color-mix(in srgb, var(--lecture-panel) 72%, transparent)",
  "--lecture-button-hover-border": "color-mix(in srgb, var(--lecture-primary) 70%, var(--lecture-border))",
  "--lecture-button-hover-text": "color-mix(in srgb, var(--lecture-primary) 82%, #fff)",
  "--lecture-focus-ring": "#3b82f6",
  "--lecture-dock-border": "color-mix(in srgb, var(--lecture-primary) 34%, var(--lecture-border))",
  "--lecture-dock-background": "color-mix(in srgb, var(--lecture-panel-deep) 94%, transparent)",
  "--lecture-dock-shadow": "0 18px 44px #00000057",
  "--lecture-icon-active-background": "color-mix(in srgb, var(--lecture-primary) 12%, var(--lecture-panel))",
  "--lecture-toolbar-background": "#0f1724",
  "--lecture-settings-border": "color-mix(in srgb, var(--lecture-primary) 42%, var(--lecture-border))",
  "--lecture-settings-background": "color-mix(in srgb, var(--lecture-panel-deep) 97%, #000 3%)",
  "--lecture-settings-shadow": "0 18px 44px #00000061",
  "--lecture-speed-menu-background": "color-mix(in srgb, var(--lecture-panel-deep) 97%, #000 3%)",
  "--lecture-speed-menu-shadow": "0 14px 34px #00000057",
  "--lecture-playing-background": "#1268f352",
  "--lecture-playing-text": "#f8fbff",
  "--lecture-playing-shadow": "inset 0 0 0 1px #7eb0ff6b",
  "--lecture-speaker-man-border": "#7eb0ff",
  "--lecture-speaker-man-background": "#1268f3",
  "--lecture-speaker-man-text": "#fff",
  "--lecture-speaker-man-shadow": "0 0 0 3px #1268f329",
  "--lecture-speaker-woman-border": "#ff9fba",
  "--lecture-speaker-woman-background": "#e85b84",
  "--lecture-speaker-woman-text": "#fff",
  "--lecture-speaker-woman-shadow": "0 0 0 3px #e85b8429",
  "--lecture-resource-panel": "#1b1d22",
  "--lecture-resource-panel-deep": "#121419",
  "--lecture-resource-border": "#bec4ce3d",
  "--lecture-resource-dialog-border": "color-mix(in srgb, var(--lecture-resource-primary) 42%, var(--lecture-resource-border))",
  "--lecture-resource-text": "#f4f7fb",
  "--lecture-resource-muted": "#aeb6c2",
  "--lecture-resource-primary": "#3b82f6",
  "--lecture-resource-background": "#15181e",
  "--lecture-resource-shadow": "0 18px 48px #00000057",
  "--lecture-student-panel": "#171d25",
  "--lecture-student-border": "#344252",
  "--lecture-student-divider": "var(--lecture-student-border)",
  "--lecture-student-row": "#222b36",
  "--lecture-student-text": "#eef3fb",
  "--lecture-student-close-border": "#1f2c3b",
  "--lecture-student-close-background": "#0f1724",
  "--lecture-student-close-text": "#eef3fb",
  "--lecture-student-close-shadow": "0 10px 22px #00000038",
  "--lecture-segment-background": "color-mix(in srgb, var(--lecture-panel) 68%, transparent)",
  "--lecture-segment-selected-background": "color-mix(in srgb, var(--lecture-primary) 20%, var(--lecture-panel))",
  "--lecture-segment-selected-shadow": "0 1px 4px #0000002e",
  "--lecture-toolbar-border": "var(--lecture-border)",
  "--lecture-toolbar-shadow": "none",
  "--lecture-action-border": "var(--lecture-border)",
  "--lecture-action-background": "var(--lecture-button-background)",
  "--lecture-action-text": "var(--lecture-text)",
  "--lecture-action-hover-border": "var(--lecture-button-hover-border)",
  "--lecture-action-hover-background": "var(--lecture-button-background)",
  "--lecture-action-hover-text": "var(--lecture-button-hover-text)",
  "--lecture-question-panel-background": "#0b1912",
  "--lecture-transcript-padding": "16px"
};
  const capturedLight = {
  "--lecture-phonetic-red": "#eb0042",
  "--lecture-rich-color": "#eb0042",
  "--lecture-translation": "#9aa0a6",
  "--lecture-option-fill": "var(--lecture-muted)",
  "--lecture-knowledge-text": "#4b5563",
  "--lecture-ring-center": "#fff",
  "--lecture-ring-track": "#dfe8e2",
  "--lecture-ring-shadow": "inset 0 0 0 1px color-mix(in srgb, var(--lecture-border) 44%, transparent)",
  "--lecture-ring-selected-center": "#fff",
  "--lecture-ring-selected-shadow": "0 0 0 2px var(--lecture-primary), 0 5px 14px color-mix(in srgb, var(--lecture-primary) 28%, transparent)",
  "--lecture-select-menu-shadow": "0 12px 32px #176bff1f",
  "--lecture-select-menu-background": "#f8fbff",
  "--lecture-select-option-hover": "color-mix(in srgb, var(--lecture-primary) 10%, transparent)",
  "--lecture-select-option-active": "color-mix(in srgb, var(--lecture-primary) 14%, transparent)",
  "--lecture-select-border": "#cfe0f6",
  "--lecture-select-background": "#fff",
  "--lecture-select-text": "#12345f",
  "--lecture-select-focus-shadow": "0 0 0 2px color-mix(in srgb, var(--lecture-primary) 16%, transparent)",
  "--lecture-picker-background": "#fff",
  "--lecture-picker-border": "#cfe0f6",
  "--lecture-picker-shadow": "0 18px 46px #2237582e",
  "--lecture-rate-good": "#16a34a",
  "--lecture-rate-medium": "#facc15",
  "--lecture-rate-low": "#ef4444",
  "--lecture-question-border": "color-mix(in srgb, var(--lecture-primary) 72%, var(--lecture-border))",
  "--lecture-question-background": "color-mix(in srgb, var(--lecture-primary) 15%, var(--lecture-panel))",
  "--lecture-play-background": "#1268f3",
  "--lecture-play-hover": "#0f5bea",
  "--lecture-play-border": "#7eb0ff",
  "--lecture-play-text": "#fff",
  "--lecture-play-shadow": "0 6px 14px #1268f338",
  "--lecture-progress-track": "#e2e7ee",
  "--lecture-progress-border": "#a5adb8",
  "--lecture-text": "#17243b",
  "--lecture-muted": "#6b7a90",
  "--lecture-primary": "#246bfd",
  "--lecture-panel-deep": "#f0f6ff",
  "--lecture-panel": "#fff",
  "--lecture-border": "#d7e4f5",
  "--lecture-page-background": "linear-gradient(145deg, #edf6ff, #fff 58%, #f3f8ff)",
  "--lecture-header-background": "linear-gradient(180deg, #edf6ff, #f8fbff)",
  "--lecture-header-text": "#12345f",
  "--lecture-button-background": "color-mix(in srgb, var(--lecture-panel) 72%, transparent)",
  "--lecture-button-hover-border": "color-mix(in srgb, var(--lecture-primary) 70%, var(--lecture-border))",
  "--lecture-button-hover-text": "color-mix(in srgb, var(--lecture-primary) 82%, #fff)",
  "--lecture-focus-ring": "#3b82f6",
  "--lecture-dock-border": "#cfe0f6",
  "--lecture-dock-background": "#f8fbff",
  "--lecture-dock-shadow": "0 12px 32px #176bff1f",
  "--lecture-icon-active-background": "color-mix(in srgb, var(--lecture-primary) 12%, var(--lecture-panel))",
  "--lecture-toolbar-background": "#f8fbfffa",
  "--lecture-settings-border": "color-mix(in srgb, var(--lecture-primary) 42%, var(--lecture-border))",
  "--lecture-settings-background": "#fff",
  "--lecture-settings-shadow": "0 18px 44px #26416833",
  "--lecture-speed-menu-background": "#fff",
  "--lecture-speed-menu-shadow": "0 14px 34px #26416833",
  "--lecture-playing-background": "#e8f2ff",
  "--lecture-playing-text": "var(--lecture-text)",
  "--lecture-playing-shadow": "inset 0 0 0 1px #1268f338",
  "--lecture-speaker-man-border": "#c9dbfb",
  "--lecture-speaker-man-background": "#f1f6ff",
  "--lecture-speaker-man-text": "#2f6edb",
  "--lecture-speaker-man-shadow": "none",
  "--lecture-speaker-woman-border": "#f3cbd8",
  "--lecture-speaker-woman-background": "#fff3f7",
  "--lecture-speaker-woman-text": "#c54a73",
  "--lecture-speaker-woman-shadow": "none",
  "--lecture-resource-panel": "#fff",
  "--lecture-resource-panel-deep": "#f2f7ff",
  "--lecture-resource-border": "#c9daef",
  "--lecture-resource-dialog-border": "#b9cee9",
  "--lecture-resource-text": "#17243b",
  "--lecture-resource-muted": "#64748b",
  "--lecture-resource-primary": "#2563eb",
  "--lecture-resource-background": "#fff",
  "--lecture-resource-shadow": "0 18px 48px #1d4e9429",
  "--lecture-student-panel": "#fff",
  "--lecture-student-border": "#d7e4f5",
  "--lecture-student-divider": "#e1e9f4",
  "--lecture-student-row": "#f5f8fc",
  "--lecture-student-text": "#263b57",
  "--lecture-student-close-border": "#9fd3c8",
  "--lecture-student-close-background": "#fff",
  "--lecture-student-close-text": "#087a62",
  "--lecture-student-close-shadow": "0 8px 18px #159b7729",
  "--lecture-segment-background": "color-mix(in srgb, var(--lecture-panel) 68%, transparent)",
  "--lecture-segment-selected-background": "#d3e1ff",
  "--lecture-segment-selected-shadow": "0 1px 4px #0000002e",
  "--lecture-toolbar-border": "#cfe0f6",
  "--lecture-toolbar-shadow": "0 -6px 20px #176bff14",
  "--lecture-action-border": "#cfe0f6",
  "--lecture-action-background": "#fff",
  "--lecture-action-text": "#12345f",
  "--lecture-action-hover-border": "#9fc4ff",
  "--lecture-action-hover-background": "#eef6ff",
  "--lecture-action-hover-text": "#176bff",
  "--lecture-question-panel-background": "#fff",
  "--lecture-transcript-padding": "16px"
};
  // A responsive geometry variable appears among the source tokens; colors must not override it.
  delete capturedDark["--lecture-transcript-padding"];
  delete capturedLight["--lecture-transcript-padding"];
  const variants = {
    paper: { kind: "light", bg: "#F4EAD8", panel: "#FBF3E5", text: "#3D352B" },
    apricot: { kind: "light", bg: "#F3E7D8", panel: "#FAF1E8", text: "#3C342D" },
    tea: { kind: "light", bg: "#E8EDDF", panel: "#F3F5EB", text: "#2F3A2B" },
    mint: { kind: "light", bg: "#E0EEE7", panel: "#EDF7F1", text: "#203A30" },
    mist: { kind: "light", bg: "#E3EBF3", panel: "#F0F5FA", text: "#25384B" },
    lavender: { kind: "light", bg: "#ECE8F2", panel: "#F6F2FA", text: "#383047" },
    charcoal: { kind: "dark", bg: "#1E1C1A", panel: "#2C2824", text: "#F2EADF" },
    graphite: { kind: "dark", bg: "#181D22", panel: "#232A31", text: "#E7EDF2" },
    pine: { kind: "dark", bg: "#15221F", panel: "#22342E", text: "#E2EEE8" },
    indigo: { kind: "dark", bg: "#1B2032", panel: "#2A3046", text: "#E8EAF4" },
  };
  function blend(a, b, share) {
    const left = a.replace("#", ""), right = b.replace("#", "");
    return "#" + [0, 2, 4].map(offset => Math.round(parseInt(left.slice(offset, offset + 2), 16) * share
      + parseInt(right.slice(offset, offset + 2), 16) * (1 - share)).toString(16).padStart(2, "0")).join("");
  }
  const palettes = {
    dark: { ...capturedDark, "--lecture-phonetic-red": "#ff6f7d", "--lecture-rate-low": "#ff6f7d" },
    light: { ...capturedLight },
  };
  function buildVariant(spec) {
    const dark = spec.kind === "dark";
    const palette = { ...(dark ? palettes.dark : palettes.light) };
    const primary = palette["--lecture-primary"], text = spec.text, panel = spec.panel;
    const deep = blend(spec.bg, panel, .72);
    const border = blend(text, panel, dark ? .27 : .23);
    const muted = blend(text, panel, dark ? .73 : .72);
    const translation = blend(text, panel, dark ? .67 : .63);
    const header = `linear-gradient(180deg, ${blend(spec.bg, panel, .65)}, ${panel})`;
    Object.assign(palette, {
      "--lecture-panel": panel, "--lecture-panel-deep": deep, "--lecture-border": border,
      "--lecture-text": text, "--lecture-muted": muted, "--lecture-translation": translation,
      "--lecture-page-background": spec.bg, "--lecture-header-background": header,
      "--lecture-header-text": text, "--lecture-question-panel-background": panel,
      "--lecture-knowledge-text": muted, "--lecture-option-fill": muted,
      "--lecture-ring-center": panel, "--lecture-ring-selected-center": blend(primary, panel, .10),
      "--lecture-ring-track": blend(text, panel, .15),
      "--lecture-ring-shadow": `inset 0 0 0 1px ${border}`,
      "--lecture-select-border": border, "--lecture-select-background": panel,
      "--lecture-select-text": text, "--lecture-select-menu-background": deep,
      "--lecture-select-menu-shadow": dark ? "0 16px 36px #0000004d" : "0 12px 32px #176bff1f",
      "--lecture-picker-background": panel, "--lecture-picker-border": border,
      "--lecture-picker-shadow": dark ? "0 22px 54px #00000061" : "0 18px 46px #2237582e",
      "--lecture-question-border": blend(primary, border, .72),
      "--lecture-question-background": blend(primary, panel, .15),
      "--lecture-button-background": panel,
      "--lecture-dock-border": border, "--lecture-dock-background": deep,
      "--lecture-icon-active-background": blend(primary, panel, .12),
      "--lecture-toolbar-background": deep, "--lecture-toolbar-border": border,
      "--lecture-settings-border": border, "--lecture-settings-background": panel,
      "--lecture-speed-menu-background": panel,
      "--lecture-playing-background": blend(primary, panel, dark ? .30 : .09),
      "--lecture-playing-text": text,
      "--lecture-playing-shadow": `inset 0 0 0 1px ${blend(primary, panel, .36)}`,
      "--lecture-resource-panel": panel, "--lecture-resource-panel-deep": deep,
      "--lecture-resource-border": border, "--lecture-resource-dialog-border": border,
      "--lecture-resource-text": text, "--lecture-resource-muted": muted,
      "--lecture-resource-background": panel,
      "--lecture-student-panel": panel, "--lecture-student-border": border,
      "--lecture-student-divider": border, "--lecture-student-row": deep,
      "--lecture-student-text": text, "--lecture-student-close-border": border,
      "--lecture-student-close-background": panel, "--lecture-student-close-text": text,
      "--lecture-segment-background": deep,
      "--lecture-segment-selected-background": blend(primary, panel, .16),
      "--lecture-action-border": border, "--lecture-action-background": panel,
      "--lecture-action-text": text, "--lecture-action-hover-border": blend(primary, border, .5),
      "--lecture-action-hover-background": blend(primary, panel, dark ? .14 : .07),
      "--lecture-action-hover-text": dark ? blend(primary, text, .38) : primary,
    });
    if (!dark) {
      Object.assign(palette, {
        "--lecture-speaker-man-border": blend("#2f6edb", panel, .24),
        "--lecture-speaker-man-background": blend("#2f6edb", panel, .05),
        "--lecture-speaker-woman-border": blend("#c54a73", panel, .24),
        "--lecture-speaker-woman-background": blend("#c54a73", panel, .06),
      });
    }
    return palette;
  }
  Object.entries(variants).forEach(([key, spec]) => { palettes[key] = buildVariant(spec); });
  function choice() {
    return typeof state !== "undefined" && palettes[state.theme] ? state.theme : "dark";
  }
  function isResource(node) { return node.classList.contains("resource-popover"); }
  function apply() {
    const name = choice(), palette = palettes[name];
    const kind = name === "dark" ? "dark" : name === "light" ? "light" : variants[name].kind;
    const hosts = document.querySelectorAll("#fullscreenPage, #onlinePage, .resource-popover, .app-dialog");
    hosts.forEach(host => {
      if (host.dataset.demoPalette !== name) host.dataset.demoPalette = name;
      if (host.dataset.themeKind !== kind) host.dataset.themeKind = kind;
      host.classList.toggle("light-mode", kind === "light");
      host.classList.toggle("dark-mode", kind === "dark");
      host.style.removeProperty("--lecture-transcript-padding");
      Object.entries(palette).forEach(([key, value]) => {
        if (host.style.getPropertyValue(key) !== value) host.style.setProperty(key, value);
      });
      const resource = isResource(host);
      const localPanel = resource ? palette["--lecture-resource-panel"] : palette["--lecture-panel"];
      const localText = resource ? palette["--lecture-resource-text"] : palette["--lecture-text"];
      const localBorder = resource ? palette["--lecture-resource-border"] : palette["--lecture-border"];
      const aliases = {
        "--lecture-bg": variants[name]?.bg || (kind === "dark" ? "#0b0d11" : "#f5f9ff"),
        "--lecture-panel": localPanel,
        "--lecture-panel-deep": resource ? palette["--lecture-resource-panel-deep"] : palette["--lecture-panel-deep"],
        "--lecture-border": localBorder, "--lecture-text": localText,
        "--lecture-muted": resource ? palette["--lecture-resource-muted"] : palette["--lecture-muted"],
        "--lecture-primary": resource ? palette["--lecture-resource-primary"] : palette["--lecture-primary"],
        "--lecture-active": kind === "dark" ? "#34d399" : "#176bff",
        "--lecture-hot": kind === "dark" ? "#ff6f7d" : "#eb0042",
        "--lecture-context": kind === "dark" ? "#5eead4" : "#0f8f83",
        "--resource-text": localText, "--resource-panel": localPanel,
        "--demo-panel": localPanel, "--demo-text": localText,
        "--demo-bg": variants[name]?.bg || (kind === "dark" ? "#0b0d11" : "#f5f9ff"),
        "--demo-red": kind === "dark" ? "#ff6f7d" : "#ef4444",
        "--demo-mask-background": name === "dark" ? "#1a322b" : name === "light" ? "#e2e6eb" : blend(localText, localPanel, .16),
      };
      Object.entries(aliases).forEach(([key, value]) => {
        if (host.style.getPropertyValue(key) !== value) host.style.setProperty(key, value);
      });
      host.querySelectorAll("#classRate, #nationalRate").forEach(node => {
        const match = node.textContent.trim().match(/^(\d+(?:\.\d+)?)%$/);
        if (!match) return;
        const rate = Number(match[1]);
        const color = `var(--lecture-rate-${rate < 70 ? "low" : rate < 100 ? "medium" : "good"})`;
        if (node.style.color !== color) node.style.color = color;
      });
    });
    return { name, kind, tokenCount: Object.keys(palette).length };
  }
  window.DemoThemePalette = {
    apply, names: Object.keys(palettes), palette: name => ({ ...palettes[name] }),
    capturedDark: { ...capturedDark }, capturedLight: { ...capturedLight },
    source: "LectureContainer-kbOsVtb2.css / a9f11df8fe837cf2c447827d3161e933dcc4117695c4e886ea6ae9afcbfc689f",
  };
  let pending = false;
  const observer = new MutationObserver(records => {
    if (pending || !records.some(record => record.addedNodes.length)) return;
    pending = true;
    queueMicrotask(() => { pending = false; apply(); });
  });
  observer.observe(document.body, { childList: true, subtree: true });
  apply();
})();
