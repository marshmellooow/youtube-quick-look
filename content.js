(() => {
  "use strict";

  if (window.__ytQuickLookLoaded) return;
  window.__ytQuickLookLoaded = true;

  // Sind wir IM Popup, das wir selbst geöffnet haben? (Marker via URL-Hash)
  // Dann reicht ein winziger Esc-Handler — und wir machen sonst nichts.
  if (location.hash === "#ytql-popup") {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        window.close();
      }
    }, true);
    return;
  }

  // Auf youtube.com kann der in-page Embed-Player wegen Parent-Origin-Prüfungen
  // scheitern. Dort nutzen wir stattdessen unsere eigene Extension-Player-Seite.
  const IS_YOUTUBE = (() => {
    const h = location.hostname.replace(/^www\./, "");
    return h === "youtube.com" || h === "m.youtube.com" || h === "music.youtube.com";
  })();

  const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

  // Settings (vom Popup verwaltet, in chrome.storage.sync persistiert)
  const settings = { enabled: true, triggerCode: "Space" };
  try {
    chrome.storage.sync.get({ enabled: true, triggerCode: "Space" }, (loaded) => {
      Object.assign(settings, loaded);
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync") return;
      if (changes.enabled) settings.enabled = changes.enabled.newValue;
      if (changes.triggerCode) settings.triggerCode = changes.triggerCode.newValue;
    });
  } catch (_) {
    // Extension-Context-Probleme — ignorieren, Defaults bleiben aktiv
  }

  function extractVideoId(urlStr) {
    if (!urlStr) return null;
    try {
      const url = new URL(urlStr, location.href);
      const host = url.hostname.replace(/^www\./, "");

      if (host === "youtu.be") {
        const id = url.pathname.slice(1).split("/")[0];
        return VIDEO_ID_RE.test(id) ? id : null;
      }

      if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
        if (url.pathname === "/watch") {
          const id = url.searchParams.get("v");
          return id && VIDEO_ID_RE.test(id) ? id : null;
        }
        const m = url.pathname.match(/^\/(?:embed|shorts|v|live)\/([a-zA-Z0-9_-]{11})/);
        if (m) return m[1];
      }
    } catch (_) {}
    return null;
  }

  function findVideoIdFromElement(el) {
    if (!el) return null;
    let cur = el;
    while (cur && cur !== document.body) {
      if (cur.tagName === "A" && cur.href) {
        const id = extractVideoId(cur.href);
        if (id) return id;
      }
      if (cur.dataset) {
        if (cur.dataset.videoId && VIDEO_ID_RE.test(cur.dataset.videoId)) {
          return cur.dataset.videoId;
        }
      }
      cur = cur.parentElement;
    }

    // YouTube thumbnails ohne href: img/ytd-thumbnail innerhalb eines ankerlosen Containers.
    // Versuch: nächstgelegenen Anchor mit /watch oder /shorts finden.
    const anchor = el.closest && el.closest("a#thumbnail, a.ytd-thumbnail, a[href*='/watch'], a[href*='/shorts/']");
    if (anchor && anchor.href) {
      const id = extractVideoId(anchor.href);
      if (id) return id;
    }

    // Manche Grid-Items: ytd-rich-item-renderer -> a#thumbnail innerhalb
    const wrapper = el.closest && el.closest("ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-video-renderer, ytd-reel-item-renderer");
    if (wrapper) {
      const a = wrapper.querySelector("a#thumbnail, a[href*='/watch'], a[href*='/shorts/']");
      if (a && a.href) {
        const id = extractVideoId(a.href);
        if (id) return id;
      }
    }

    // Bild-URL als Fallback: i.ytimg.com/vi/<ID>/...
    const img = el.tagName === "IMG" ? el : (el.querySelector && el.querySelector("img"));
    if (img && img.src) {
      const m = img.src.match(/\/vi(?:_webp)?\/([a-zA-Z0-9_-]{11})\//);
      if (m) return m[1];
    }
    return null;
  }

  let hoveredVideoId = null;
  let hoveredElement = null;

  function onMouseOver(e) {
    const id = findVideoIdFromElement(e.target);
    if (id) {
      hoveredVideoId = id;
      hoveredElement = e.target;
    }
  }

  function onMouseOut(e) {
    if (e.target === hoveredElement || (hoveredElement && !hoveredElement.isConnected)) {
      hoveredVideoId = null;
      hoveredElement = null;
    }
  }

  document.addEventListener("mouseover", onMouseOver, true);
  document.addEventListener("mouseout", onMouseOut, true);

  // --- Preview Host (Shadow DOM) ---
  let hostEl = null;
  let shadow = null;
  let rootEl = null;
  let iframeEl = null;

  function isEditableTarget(t) {
    if (!t) return false;
    const tag = t.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (t.isContentEditable) return true;
    return false;
  }

  function isPreviewOpen() {
    return !!hostEl || !!popupWin;
  }

  // --- Popup-Fallback für youtube.com ---
  let popupWin = null;
  let popupPoll = null;

  function openPopup(videoId) {
    const w = 800, h = 500;
    const left = Math.max(0, Math.round((screen.availWidth - w) / 2));
    const top = Math.max(0, Math.round((screen.availHeight - h) / 3));
    const features = `popup=yes,width=${w},height=${h},left=${left},top=${top},noopener=no,noreferrer=no`;
    const url = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}#ytql-popup`;
    try {
      popupWin = window.open(url, "ytQuickLookPopup", features);
    } catch (_) {
      popupWin = null;
    }
    if (!popupWin) {
      console.warn("[YT Quick Look] Popup blockiert — bitte Popups für diese Seite erlauben.");
      return;
    }
    try { popupWin.focus(); } catch (_) {}
    // youtube.com setzt Cross-Origin-Opener-Policy, daher kann der Browser
    // unsere Fenster-Referenz kappen (popupWin.closed wirft dann). Best-effort.
    popupPoll = setInterval(() => {
      let gone = false;
      try { gone = !popupWin || popupWin.closed; } catch (_) { gone = true; }
      if (gone) {
        clearInterval(popupPoll);
        popupPoll = null;
        popupWin = null;
      }
    }, 1000);
  }

  function closePopup() {
    if (popupPoll) { clearInterval(popupPoll); popupPoll = null; }
    try {
      if (popupWin && !popupWin.closed) popupWin.close();
    } catch (_) {
      // COOP hat die Referenz gekappt — Nutzer muss das Fenster manuell schließen.
    }
    popupWin = null;
  }

  function buildPreview(videoId) {
    // Extension-Context kann invalidiert sein (z.B. nach Reload der Extension,
    // während alte Content-Scripts in offenen Tabs noch laufen).
    if (!chrome.runtime || !chrome.runtime.id) {
      console.warn("[YT Quick Look] Extension wurde neu geladen — bitte Tab neu laden.");
      return;
    }
    hostEl = document.createElement("div");
    hostEl.id = "yt-quick-look-host";
    hostEl.style.all = "initial";
    hostEl.style.position = "fixed";
    hostEl.style.top = "0";
    hostEl.style.left = "0";
    hostEl.style.width = "0";
    hostEl.style.height = "0";
    hostEl.style.zIndex = "2147483647";

    shadow = hostEl.attachShadow({ mode: "closed" });

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("preview.css");
    shadow.appendChild(link);

    rootEl = document.createElement("div");
    rootEl.className = "ytql-root";
    rootEl.innerHTML = `
      <div class="ytql-header" part="header">
        <span class="ytql-title">YouTube Quick Look</span>
        <button class="ytql-close" title="Schließen (Esc)">×</button>
      </div>
      <div class="ytql-body">
        <span class="ytql-hint">Leertaste / Esc zum Schließen</span>
      </div>
    `;
    shadow.appendChild(rootEl);

    iframeEl = document.createElement("iframe");
    iframeEl.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    iframeEl.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture; fullscreen");
    iframeEl.setAttribute("referrerpolicy", "no-referrer");
    rootEl.querySelector(".ytql-body").prepend(iframeEl);

    rootEl.querySelector(".ytql-close").addEventListener("click", closePreview);

    const header = rootEl.querySelector(".ytql-header");
    enableDrag(rootEl, header);

    document.documentElement.appendChild(hostEl);

    // Klick außerhalb: am Document hängen, aber auf Klicks außerhalb des hostEl reagieren.
    setTimeout(() => {
      document.addEventListener("mousedown", onOutsideClick, true);
    }, 0);
  }

  function enableDrag(target, handle) {
    let startX = 0, startY = 0, origLeft = 0, origTop = 0, dragging = false;

    handle.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      dragging = true;
      const rect = target.getBoundingClientRect();
      // wechsele von transform-zentriert auf absolute left/top für Drag
      target.style.left = rect.left + "px";
      target.style.top = rect.top + "px";
      target.style.transform = "none";
      startX = e.clientX;
      startY = e.clientY;
      origLeft = rect.left;
      origTop = rect.top;
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      target.style.left = (origLeft + e.clientX - startX) + "px";
      target.style.top = (origTop + e.clientY - startY) + "px";
    }, true);

    window.addEventListener("mouseup", () => { dragging = false; }, true);
  }

  function closePreview() {
    closePopup();
    if (!hostEl) return;
    document.removeEventListener("mousedown", onOutsideClick, true);
    if (iframeEl) {
      iframeEl.src = "about:blank";
      iframeEl.remove();
      iframeEl = null;
    }
    hostEl.remove();
    hostEl = null;
    shadow = null;
    rootEl = null;
  }

  function onOutsideClick(e) {
    if (!hostEl) return;
    // Composed path: prüfen, ob hostEl in der Bubble-Kette liegt
    const path = e.composedPath ? e.composedPath() : [];
    if (path.includes(hostEl)) return;
    closePreview();
  }

  function matchesTrigger(e) {
    const code = settings.triggerCode || "Space";
    return e.code === code || e.key === code;
  }

  function onKeyDown(e) {
    // Esc schließt immer (sofern offen)
    if (e.key === "Escape" && isPreviewOpen()) {
      e.preventDefault();
      e.stopPropagation();
      closePreview();
      return;
    }

    if (!matchesTrigger(e)) return;

    // wenn offen: Trigger-Taste schließt
    if (isPreviewOpen()) {
      e.preventDefault();
      e.stopPropagation();
      closePreview();
      return;
    }

    if (!settings.enabled) return;

    // nicht im Editor/Input
    if (isEditableTarget(e.target)) return;
    if (isEditableTarget(document.activeElement)) return;

    if (!hoveredVideoId) return;

    e.preventDefault();
    e.stopPropagation();
    if (IS_YOUTUBE) {
      openPopup(hoveredVideoId);
    } else {
      buildPreview(hoveredVideoId);
    }
  }

  document.addEventListener("keydown", onKeyDown, true);

  // --- MutationObserver: nur als Marker, dass das DOM lebt ---
  // Hover-Erkennung läuft per Event-Delegation, deshalb brauchen wir den Observer
  // nicht aggressiv. Wir nutzen ihn nur, um aufzuräumen, falls das hoveredElement
  // aus dem DOM fliegt (z.B. SPA-Navigation auf YouTube).
  const mo = new MutationObserver(() => {
    if (hoveredElement && !hoveredElement.isConnected) {
      hoveredElement = null;
      hoveredVideoId = null;
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
