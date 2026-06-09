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

  // ── 1. Create host element (zero-size, fixed, no layout impact) ────────────
  var hostId = "growdigitally-chat-widget-host";
  var host = document.getElementById(hostId);
  if (!host) {
    host = document.createElement("div");
    host.id = hostId;
    host.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;z-index:999999;overflow:visible;pointer-events:none;";
    document.body.appendChild(host);
  }

  // ── 2. Attach Shadow DOM to fully isolate widget CSS ──────────────────────
  var shadow = host.attachShadow({ mode: "open" });

  // Mount point for React inside the shadow root
  var mountPoint = document.createElement("div");
  mountPoint.id = "growdigitally-chat-widget-root";
  mountPoint.style.cssText = "pointer-events:auto;";
  shadow.appendChild(mountPoint);

  // ── 3. Inject fonts INSIDE the shadow root ─────────────────────────────────
  // @font-face / @import rules do NOT pierce the Shadow DOM boundary in all
  // browsers. We inject them directly into the shadow root so fonts and icon
  // ligatures always render correctly regardless of the host page's CSP.
  var fontStyle = document.createElement("style");
  fontStyle.textContent = [
    "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');",
    "@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');",
    "*,*::before,*::after{box-sizing:border-box;}",
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

  // ── 4. Inject widget CSS inside shadow root ────────────────────────────────
  // Points to widget.css which Vite now outputs alongside widget.js at the
  // root of the dist folder — no more assets/index.css path mismatch.
  var base = (function () {
    var s =
      document.currentScript ||
      document.querySelector('script[src*="widget.js"]');
    if (s) {
      var src = s.src;
      return src.substring(0, src.lastIndexOf("/") + 1);
    }
    return "https://grow-digitally-chatbot-6tky.vercel.app/";
  })();

  var cssLink = document.createElement("link");
  cssLink.rel = "stylesheet";
  cssLink.href = base + "widget.css";
  shadow.appendChild(cssLink);

  // Store the shadow root so main.jsx can find the mount point
  window.__GDWidgetShadowRoot = shadow;

  // ── 5. Load the React widget bundle ───────────────────────────────────────
  // widget.js is now the exact filename Vite outputs — no path mismatch.
  var script = document.createElement("script");
  script.type = "module";
  script.src = base + "widget.js";

  // Prevent double-loading when widget.js IS the script tag itself
  // (the loader script and the React bundle share the same filename only in
  //  certain build setups — guard against it just in case).
  if (document.querySelector('script[src="' + script.src + '"]') === document.currentScript) {
    // Already loading — skip
  } else {
    document.body.appendChild(script);
  }
})();