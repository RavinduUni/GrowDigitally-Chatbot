import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

const rootId = "growdigitally-chat-widget-root";

// When loaded as an embedded widget, widget.js creates a Shadow DOM and
// stores its reference on window.__GDWidgetShadowRoot. Mount into that so
// our CSS is fully isolated from the host page.
let rootElement =
  (window.__GDWidgetShadowRoot &&
    window.__GDWidgetShadowRoot.getElementById(rootId)) ||
  document.getElementById(rootId);

if (!rootElement) {
  rootElement = document.createElement("div");
  rootElement.id = rootId;
  document.body.appendChild(rootElement);
}

// Read the widget token injected by widget.js from the <script data-token="..."> attribute.
// widget.js stores it on window.__GDWidgetToken before loading this bundle.
const widgetToken = window.__GDWidgetToken || null;

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App widgetToken={widgetToken} />
    </BrowserRouter>
  </React.StrictMode>
);