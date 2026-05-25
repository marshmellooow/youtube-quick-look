(() => {
  "use strict";

  const DEFAULTS = { enabled: true, triggerCode: "Space" };

  const toggle = document.getElementById("toggle");
  const keyBtn = document.getElementById("keyBtn");

  let state = { ...DEFAULTS };
  let listening = false;

  function render() {
    toggle.classList.toggle("on", !!state.enabled);
    keyBtn.textContent = listening ? "Taste drücken…" : prettyKey(state.triggerCode);
    keyBtn.classList.toggle("listening", listening);
  }

  function prettyKey(code) {
    if (!code) return "—";
    return code
      .replace(/^Key/, "")
      .replace(/^Digit/, "")
      .replace(/^Arrow/, "↑↓←→ ")
      .replace("Space", "Space");
  }

  function save() {
    chrome.storage.sync.set({ enabled: state.enabled, triggerCode: state.triggerCode });
  }

  chrome.storage.sync.get(DEFAULTS, (loaded) => {
    state = { ...DEFAULTS, ...loaded };
    render();
  });

  toggle.addEventListener("click", () => {
    state.enabled = !state.enabled;
    save();
    render();
  });

  keyBtn.addEventListener("click", () => {
    listening = true;
    render();
  });

  window.addEventListener("keydown", (e) => {
    if (!listening) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.key === "Escape") {
      listening = false;
      render();
      return;
    }
    // ignoriere reine Modifier-Tasten
    if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;
    state.triggerCode = e.code || e.key;
    listening = false;
    save();
    render();
  }, true);
})();
