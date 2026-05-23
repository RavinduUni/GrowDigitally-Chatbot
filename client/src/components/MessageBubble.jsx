import React from 'react';

/**
 * MessageBubble Component
 * -------------------------
 * Renders a single chat message bubble.
 *
 * Props:
 *  - message (object): { text, isUser, time }
 *    - text    : The message text content (supports multiline)
 *    - isUser  : true  → right-aligned blue bubble (visitor)
 *                false → left-aligned white bubble (AI)
 *    - time    : Display timestamp string (e.g. "10:00 AM")
 */
const MessageBubble = ({ message }) => {
  const { text, isUser, time } = message;

  return (
    /* Outer wrapper — aligns the entire bubble + timestamp */
    <div className={`flex flex-col max-w-[85%] animate-fade-in-up ${isUser ? 'items-end ml-auto' : 'items-start'}`}>

      {/* ── Message bubble ── */}
      <div
        className={`px-4 py-3 shadow-sm whitespace-pre-wrap wrap-break-word
          ${isUser
            /* User: solid primary-blue, white text, left-top corner is squared */
            ? 'bg-[#004ac6] text-white rounded-tl-2xl rounded-bl-2xl rounded-br-2xl'
            /* AI: white surface with border, dark text, right-top corner is squared */
            : 'bg-white border border-[#c3c6d7] text-[#0b1c30] rounded-tr-2xl rounded-br-2xl rounded-bl-2xl'
          }`}
      >
        {/* Supports multiline text — renders each line via whitespace-pre-wrap above */}
        <p className="text-[14px] leading-[22px]">{text}</p>
      </div>

      {/* ── Timestamp ── */}
      <span className={`text-[11px] leading-[16px] font-semibold tracking-wide text-[#737686] mt-1 ${isUser ? 'mr-1' : 'ml-1'}`}>
        {time}
      </span>
    </div>
  );
};

export default MessageBubble;
