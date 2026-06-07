import React, { useState, useEffect } from "react";
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
   Simple hash router
───────────────────────────────────────────────────────────── */
const useHashRoute = () => {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return hash;
};

/* ─────────────────────────────────────────────────────────────
   App
───────────────────────────────────────────────────────────── */
const App = ({ widgetToken }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { businessId, loading } = useBusinessId(widgetToken);
  const hash = useHashRoute();

  const toggleChat = () => setIsChatOpen((prev) => !prev);

  /* ── Register page ── */
  if (hash === "#/register") {
    return <RegisterPage />;
  }

  /* ── Widget (default) — wait for businessId to resolve ── */
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

export default App;