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

  // Inject CSS inside the shadow root (not the host page)
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