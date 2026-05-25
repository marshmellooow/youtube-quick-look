(() => {
  "use strict";

  const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const iframe = document.getElementById("player");
  const closeBtn = document.querySelector(".ytql-close");

  if (id && VIDEO_ID_RE.test(id)) {
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
  } else {
    document.querySelector(".ytql-body").insertAdjacentHTML(
      "afterbegin",
      '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#888;font-size:14px;">Ungültige Video-ID</div>'
    );
  }

  function close() {
    if (iframe) iframe.src = "about:blank";
    window.close();
  }

  closeBtn.addEventListener("click", close);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" || e.code === "Space" || e.key === " ") {
      e.preventDefault();
      close();
    }
  }, true);
})();
