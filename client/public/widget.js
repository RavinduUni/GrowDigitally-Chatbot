(function () {
  if (window.GrowDigitallyWidgetLoaded) return;
  window.GrowDigitallyWidgetLoaded = true;

  const hostId = "growdigitally-chat-widget-host";

  let host = document.getElementById(hostId);
  if (!host) {
    host = document.createElement("div");
    host.id = hostId;
    // Ensure the host element itself has no impact on layout
    host.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;z-index:999999;overflow:visible;pointer-events:none;";
    document.body.appendChild(host);
  }

  // Attach a Shadow DOM so all widget CSS is fully isolated
  const shadow = host.attachShadow({ mode: "open" });

  // Mount point inside shadow root
  const mountPoint = document.createElement("div");
  mountPoint.id = "growdigitally-chat-widget-root";
  mountPoint.style.cssText = "pointer-events:auto;";
  shadow.appendChild(mountPoint);

  // @font-face rules don't cross Shadow DOM boundaries, so we must inject
  // the Google Fonts stylesheets (Inter + Material Symbols) inside the shadow root.
  const interFont = document.createElement("link");
  interFont.rel = "stylesheet";
  interFont.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
  shadow.appendChild(interFont);

  const iconsFont = document.createElement("link");
  iconsFont.rel = "stylesheet";
  iconsFont.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap";
  shadow.appendChild(iconsFont);

  // Inject widget CSS inside the shadow root (not the host page)
  const cssLink = document.createElement("link");
  cssLink.rel = "stylesheet";
  cssLink.href = "https://grow-digitally-chatbot-6tky.vercel.app/assets/index.css";
  shadow.appendChild(cssLink);

  // Store the shadow root so main.jsx can find the mount point
  window.__GDWidgetShadowRoot = shadow;

  const script = document.createElement("script");
  script.type = "module";
  script.src = "https://grow-digitally-chatbot-6tky.vercel.app/assets/index.js";
  document.body.appendChild(script);
})();