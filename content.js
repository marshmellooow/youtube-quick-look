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

  function isEditableTarget(t) {
    if (!t) return false;
    const tag = t.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (t.isContentEditable) return true;
    return false;
  }

  function isPreviewOpen() {
    return !!popupWin;
  }

  // --- Vorschau-Popup ---
  // Wir öffnen die volle youtube.com/watch-Seite in einem kleinen Popup-Fenster.
  // Vorteile gegenüber dem In-Page-Embed: zuverlässiges Autoplay, spielt auch
  // embed-deaktivierte Videos, und der #ytql-popup-Marker aktiviert dort den
  // Esc-zum-Schließen-Handler (siehe ganz oben in dieser Datei).
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

  function matchesTrigger(e) {
    const code = settings.triggerCode || "Space";
    return e.code === code || e.key === code;
  }

  function onKeyDown(e) {
    // Esc schließt das Popup (sofern noch erreichbar — COOP kann die Referenz kappen)
    if (e.key === "Escape" && isPreviewOpen()) {
      e.preventDefault();
      e.stopPropagation();
      closePopup();
      return;
    }

    if (!matchesTrigger(e)) return;

    // wenn offen: Trigger-Taste schließt
    if (isPreviewOpen()) {
      e.preventDefault();
      e.stopPropagation();
      closePopup();
      return;
    }

    if (!settings.enabled) return;

    // nicht im Editor/Input
    if (isEditableTarget(e.target)) return;
    if (isEditableTarget(document.activeElement)) return;

    if (!hoveredVideoId) return;

    e.preventDefault();
    e.stopPropagation();
    openPopup(hoveredVideoId);
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
