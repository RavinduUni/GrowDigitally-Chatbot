import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ChatIcon from "./components/ChatIcon";
import ChatWindow from "./components/ChatWindow";
import RegisterPage from "./components/RegisterPage";
import api from "./services/api";

/* ─────────────────────────────────────────────────────────────
   Resolve the businessId for this widget instance.

   Priority:
     1. data-token on the <script> tag  →  fetch from /api/business/by-token
     2. No token                         →  fall back to "default-business"
───────────────────────────────────────────────────────────── */
const useBusinessId = (widgetToken) => {
  const [businessId, setBusinessId] = useState(null);
  const [loading, setLoading] = useState(!!widgetToken);

  useEffect(() => {
    if (!widgetToken) {
      setBusinessId("default-business");
      setLoading(false);
      return;
    }

    api
      .get(`/api/business/by-token/${widgetToken}`)
      .then((res) => {
        if (res.data?.success) {
          setBusinessId(res.data.businessId);
        } else {
          setBusinessId("default-business");
        }
      })
      .catch(() => {
        setBusinessId("default-business");
      })
      .finally(() => setLoading(false));
  }, [widgetToken]);

  return { businessId, loading };
};

/* ─────────────────────────────────────────────────────────────
   Widget route — waits for businessId to resolve
───────────────────────────────────────────────────────────── */
const WidgetRoute = ({ widgetToken }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { businessId, loading } = useBusinessId(widgetToken);

  const toggleChat = () => setIsChatOpen((prev) => !prev);

  if (loading) return null;

  return (
    <div id="gd-chat-widget">
      <ChatWindow
        isOpen={isChatOpen}
        onClose={toggleChat}
        businessId={businessId}
      />
      <ChatIcon isOpen={isChatOpen} onClick={toggleChat} />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   App — React Router DOM routes
───────────────────────────────────────────────────────────── */
const App = ({ widgetToken }) => {
  return (
    <Routes>
      {/* Business registration page */}
      <Route path="/register" element={<RegisterPage />} />

      {/* Embeddable chat widget (default route) */}
      <Route path="/" element={<WidgetRoute widgetToken={widgetToken} />} />

      {/* Catch-all → redirect to widget */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;