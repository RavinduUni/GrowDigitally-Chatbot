import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

const rootId = "growdigitally-chat-widget-root";

// When loaded as an embedded widget, widget.js creates a Shadow DOM and
// stores its reference on window.__GDWidgetShadowRoot. Mount into that so
// our Tailwind/CSS is fully isolated from the host page.
let rootElement =
  (window.__GDWidgetShadowRoot &&
    window.__GDWidgetShadowRoot.getElementById(rootId)) ||
  document.getElementById(rootId);

if (!rootElement) {
  rootElement = document.createElement("div");
  rootElement.id = rootId;
  document.body.appendChild(rootElement);
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);