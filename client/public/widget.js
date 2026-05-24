(function () {
  if (window.GrowDigitallyWidgetLoaded) return;
  window.GrowDigitallyWidgetLoaded = true;

  const rootId = "growdigitally-chat-widget-root";

  let root = document.getElementById(rootId);

  if (!root) {
    root = document.createElement("div");
    root.id = rootId;
    document.body.appendChild(root);
  }

  root.style.position = "fixed";
  root.style.right = "0";
  root.style.bottom = "0";
  root.style.width = "0";
  root.style.height = "0";
  root.style.zIndex = "999999";

  // Safety-net: neutralise any Tailwind Preflight rules that may bleed into
  // the host page. This undoes margin/box-sizing resets on html & body
  // so the host website's layout is never disturbed.
  const guard = document.createElement("style");
  guard.textContent = [
    "html { box-sizing: revert !important; margin: revert !important; padding: revert !important; }",
    "body { box-sizing: revert !important; margin: revert !important; padding: revert !important; }",
    "*, ::before, ::after { box-sizing: revert; }"
  ].join("\n");
  document.head.appendChild(guard);

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://grow-digitally-chatbot-6tky.vercel.app/assets/index.css";
  document.head.appendChild(css);

  const script = document.createElement("script");
  script.type = "module";
  script.src = "https://grow-digitally-chatbot-6tky.vercel.app/assets/index.js";
  document.body.appendChild(script);
})();