import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

const rootId = "growdigitally-chat-widget-root";

let rootElement = document.getElementById(rootId);

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