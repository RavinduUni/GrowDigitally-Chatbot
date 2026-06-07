(function () {
  if (window.GrowDigitallyWidgetLoaded) return;
  window.GrowDigitallyWidgetLoaded = true;

  // ── 0. Read widget token from <script data-token="..."> ────────────────────
  // Business owners embed the widget like:
  //   <script src="widget.js" data-token="abc123..." defer></script>
  // We capture the token here (before defer moves execution) using
  // document.currentScript, then fall back to querying the DOM.
  var widgetToken =
    (document.currentScript && document.currentScript.dataset.token) ||
    (function () {
      var s = document.querySelector(
        'script[src*="widget.js"][data-token]'
      );
      return s ? s.dataset.token : null;
    })();

  // Store on window so main.jsx can read it after the React bundle loads.
  window.__GDWidgetToken = widgetToken || null;

  // ── 1. Load fonts into document.head ───────────────────────────────────────
  // @font-face rules are GLOBAL — fonts loaded in the main document are
  // accessible from inside Shadow DOM too. This is the reliable way to load
  // icon fonts for a widget embedded in any host website.
  function addHeadLink(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  }
  addHeadLink(
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
  );
  addHeadLink(
    "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
  );

  // ── 2. Create host element (zero-size, fixed, no layout impact) ────────────
  var hostId = "growdigitally-chat-widget-host";
  var host = document.getElementById(hostId);
  if (!host) {
    host = document.createElement("div");
    host.id = hostId;
    host.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;z-index:999999;overflow:visible;pointer-events:none;";
    document.body.appendChild(host);
  }

  // ── 3. Attach Shadow DOM to fully isolate widget CSS ──────────────────────
  var shadow = host.attachShadow({ mode: "open" });

  // Mount point for React inside the shadow root
  var mountPoint = document.createElement("div");
  mountPoint.id = "growdigitally-chat-widget-root";
  mountPoint.style.cssText = "pointer-events:auto;";
  shadow.appendChild(mountPoint);

  // ── 4. Inject an inline @font-face block inside shadow root ───────────────
  // Even though fonts are global, some browsers need the font-family declaration
  // to be explicitly re-stated inside the shadow root for icon font ligatures to work.
  var fontStyle = document.createElement("style");
  fontStyle.textContent = [
    "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');",
    "@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');",
    ".material-symbols-outlined {",
    "  font-family: 'Material Symbols Outlined' !important;",
    "  font-weight: normal; font-style: normal; font-size: 24px;",
    "  line-height: 1; letter-spacing: normal; text-transform: none;",
    "  display: inline-block; white-space: nowrap; word-wrap: normal;",
    "  direction: ltr; font-feature-settings: 'liga';",
    "  -webkit-font-smoothing: antialiased;",
    "  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;",
    "  user-select: none; vertical-align: middle;",
    "}",
  ].join("\n");
  shadow.appendChild(fontStyle);

  // ── 5. Inject widget CSS inside shadow root ────────────────────────────────
  var cssLink = document.createElement("link");
  cssLink.rel = "stylesheet";
  cssLink.href = "https://grow-digitally-chatbot-6tky.vercel.app/assets/index.css";
  shadow.appendChild(cssLink);

  // Store the shadow root so main.jsx can find the mount point
  window.__GDWidgetShadowRoot = shadow;

  // ── 6. Load the React widget bundle ───────────────────────────────────────
  var script = document.createElement("script");
  script.type = "module";
  script.src = "https://grow-digitally-chatbot-6tky.vercel.app/assets/index.js";
  document.body.appendChild(script);
})();