import React, { useState } from 'react';
import ChatIcon from './components/ChatIcon';
import ChatWindow from './components/ChatWindow';

/**
 * App — Root component
 * ----------------------
 * Manages the open/closed state of the chat widget.
 * The ChatIcon and ChatWindow are wired together here.
 *
 * Usage:
 *   <App />
 *
 * To integrate a real backend API, edit the sendMessage function
 * inside ChatWindow.jsx (look for the comment marked "real call").
 */
const App = () => {
  // Controls whether the ChatWindow is visible
  const [isChatOpen, setIsChatOpen] = useState(false);

  /** Toggle the chat window open/closed */
  const toggleChat = () => setIsChatOpen(prev => !prev);

  return (
    /* ── Demo page background ── */
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] font-[Inter,sans-serif]">

      {/* ── Demo page content (simulates a real website) ── */}
      <main className="p-8 max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-[18px] leading-[24px] font-bold mb-4 text-[#0b1c30]">
            Product Landing Page
          </h1>
          <p className="text-[14px] text-[#434655]">
            This is a simulation of your website to demonstrate the floating AI Sales Assistant widget.
          </p>
        </header>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-xl bg-[#eff4ff] border border-[#c3c6d7]">
            <div className="w-12 h-12 bg-[#2563eb] rounded-lg mb-4 flex items-center justify-center">
              <span className="material-symbols-outlined text-white">trending_up</span>
            </div>
            <h3 className="text-[18px] leading-[24px] font-semibold mb-2">Boost Conversion</h3>
            <p className="text-[13px] text-[#434655]">
              Our AI Sales Assistant engages visitors instantly, qualifying leads while you sleep.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-[#eff4ff] border border-[#c3c6d7]">
            <div className="w-12 h-12 bg-[#bc4800] rounded-lg mb-4 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#ffede6]">support_agent</span>
            </div>
            <h3 className="text-[18px] leading-[24px] font-semibold mb-2">24/7 Support</h3>
            <p className="text-[13px] text-[#434655]">
              Never miss a question. Detailed product knowledge delivered instantly via LLMs.
            </p>
          </div>
        </div>
      </main>

      {/* ════════════════════════════════════════
          CHAT WIDGET
          ChatWindow sits above ChatIcon.
          Both share the isChatOpen state.
      ════════════════════════════════════════ */}

      {/* Chat window panel */}
      <ChatWindow isOpen={isChatOpen} onClose={toggleChat} />

      {/* Floating trigger icon */}
      <ChatIcon isOpen={isChatOpen} onClick={toggleChat} />
    </div>
  );
};

export default App;