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

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://grow-digitally-chatbot-4uln.vercel.app/assets/index.css";
  document.head.appendChild(css);

  const script = document.createElement("script");
  script.type = "module";
  script.src = "https://grow-digitally-chatbot-4uln.vercel.app/assets/index.js";
  document.body.appendChild(script);
})();