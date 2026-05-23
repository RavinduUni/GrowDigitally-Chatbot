import React from 'react';

/**
 * ChatIcon Component
 * -------------------
 * A floating action button fixed at the bottom-right of the screen.
 * Shows a "Need help?" tooltip on hover.
 * Toggles between a chat icon and a close icon based on whether
 * the chat window is open.
 *
 * Props:
 *  - isOpen  : boolean – whether the chat window is currently visible
 *  - onClick : () => void – called when the button is clicked
 */
const ChatIcon = ({ isOpen, onClick }) => {
  return (
    /*
      Fixed container — sits at bottom-right.
      The 'group' class enables CSS group-hover on child elements.
    */
    <div className="fixed bottom-6 right-6 z-50 flex items-center group">

      {/* ── "Need help?" tooltip ──────────────────── */}
      {/*
        Appears to the LEFT of the button on hover.
        Hidden by default (opacity-0), visible on group-hover (opacity-100).
      */}
      <div
        className="
          mr-4 bg-[#213145] text-[#eaf1ff]
          text-[12px] font-medium leading-[16px] tracking-wide
          px-4 py-2 rounded-lg whitespace-nowrap shadow-lg
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200 pointer-events-none
          relative
        "
      >
        Need help?
        {/* Small right-pointing caret connecting the tooltip to the button */}
        <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 border-8 border-transparent border-l-[#213145]" />
      </div>

      {/* ── Circular trigger button ────────────────── */}
      <button
        onClick={onClick}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        title={isOpen ? 'Close chat' : 'Need help?'}
        className="
          w-16 h-16 rounded-full
          bg-[#004ac6] text-white
          shadow-xl
          flex items-center justify-center
          hover:scale-105 active:scale-90
          transition-all duration-200
        "
      >
        {/*
          Icon switches between 'chat' (closed) and 'close' (open).
          The transition-transform + rotate creates a smooth flip effect.
        */}
        <span
          className={`material-symbols-outlined text-[30px] transition-transform duration-300 ${isOpen ? 'rotate-0' : 'rotate-0'}`}
          style={{ fontSize: '28px' }}
        >
          {isOpen ? 'close' : 'chat'}
        </span>
      </button>
    </div>
  );
};

export default ChatIcon;