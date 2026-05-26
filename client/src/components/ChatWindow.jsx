import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import api from '../services/api';


/* ─── Helper ─────────────────────────────── */
/** Returns the current time as "HH:MM AM/PM" */
const getTime = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/* ─── Initial greeting message from the AI ─ */
const INITIAL_MESSAGES = [
    {
        id: 1,
        text: "Hi! I'm your AI assistant. How can I help you today?",
        isUser: false,
        time: getTime(),
    },
];

/* ─── Quick-reply chip labels ────────────── */
const QUICK_REPLIES = ['Pricing Details', 'Book a Demo', 'Contact Details'];

/**
 * ChatWindow Component
 * ---------------------
 * The main chat panel that appears above the ChatIcon.
 *
 * Props:
 *  - isOpen  : boolean – controls visibility
 *  - onClose : () => void – called when the minimize button is pressed
 */
const ChatWindow = ({ isOpen, onClose }) => {
    /* ── State ────────────────────────────────────── */
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false); // typing indicator
    const [isExpanded, setIsExpanded] = useState(false); // toggle expand/collapse

    /* Ref for auto-scrolling to the bottom after each new message */
    const messagesEndRef = useRef(null);

    /* ── Auto-scroll whenever messages or loading state changes ── */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    /* ── sendMessage ──────────────────────────────── */
    /**
     * Handles sending a user message and simulating an AI response.
     * Replace the setTimeout block below with your actual API call.
     */
    const getSessionId = () => {
        let sessionId = localStorage.getItem("chat_session_id");

        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            localStorage.setItem("chat_session_id", sessionId);
        }

        return sessionId;
    };

    const sendMessage = async (text) => {
        const trimmed = (text ?? inputValue).trim();
        if (!trimmed || isLoading) return;

        const userMsg = {
            id: Date.now(),
            text: trimmed,
            isUser: true,
            time: getTime(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsLoading(true);

        try {
            const response = await api.post(`${import.meta.env.N8N_CHAT_WEBHOOK_URL}`,{
                question: trimmed,
                sessionId: getSessionId(),
                businessId: "Grow-Digitally",
            });

            const aiMsg = {
                id: Date.now() + 1,
                text: response.data.reply || "Sorry, I couldn't get a reply right now.",
                isUser: false,
                time: getTime(),
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg = {
                id: Date.now() + 1,
                text: "Something went wrong. Please try again later.",
                isUser: false,
                time: getTime(),
            };

            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    /* ── Key handler: Enter key sends the message ── */
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    /* ── Toggle expand/collapse ─────────────────── */
    const toggleExpand = () => setIsExpanded(prev => !prev);

    /* ─────────────────────────────────────────────
       RENDER
    ───────────────────────────────────────────── */
    return (
        /*
          Outer wrapper — handles show/hide with scale + opacity transitions.
          Position is fixed (bottom-right), sitting above the chat icon.
        */
        <div
            className={`
        chat-window
        fixed bottom-[90px] right-6 z-50
        bg-[#f8f9ff] rounded-xl shadow-[0px_10px_25px_rgba(0,0,0,0.12)]
        flex flex-col border border-[#c3c6d7]
        transition-all duration-300 ease-out origin-bottom-right
        ${isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-0 opacity-0 pointer-events-none'}
        ${isExpanded ? 'w-[500px] h-[600px]' : 'w-[380px] h-[550px]'}
      `}
            style={{ maxWidth: 'calc(100vw - 24px)' }}
        >

            {/* ════════════════════════════════════════
          HEADER / TOP APP BAR
      ════════════════════════════════════════ */}
            <header className="flex justify-between items-center px-4 py-2 w-full bg-[#dce9ff] rounded-t-xl border-b border-[#c3c6d7] shadow-sm shrink-0">

                {/* Left: Avatar + name + status */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {/* Robot avatar icon */}
                        <span className="material-symbols-outlined text-[#004ac6]" style={{ fontSize: '28px' }}>
                            smart_toy
                        </span>
                        {/* Green online dot */}
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#f8f9ff] rounded-full" />
                    </div>
                    <div>
                        <h2 className="text-[18px] leading-[24px] font-bold text-[#0b1c30]">Sales AI</h2>
                        <p className="text-[12px] leading-[16px] font-medium tracking-wide text-[#434655]">Online</p>
                    </div>
                </div>

                {/* Right: Expand + Minimize buttons */}
                <div className="flex items-center gap-1">

                    {/* Expand / Collapse button */}
                    <button
                        onClick={toggleExpand}
                        title={isExpanded ? 'Collapse' : 'Expand'}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-[#434655] hover:bg-[#cbdbf5] transition-colors active:scale-95"
                    >
                        <span className="material-symbols-outlined">
                            {isExpanded ? 'close_fullscreen' : 'fullscreen'}
                        </span>
                    </button>

                    {/* Minimize / Close button */}
                    <button
                        onClick={onClose}
                        title="Minimize"
                        className="w-8 h-8 flex items-center justify-center rounded-full text-[#434655] hover:bg-[#cbdbf5] transition-colors active:scale-95"
                    >
                        <span className="material-symbols-outlined">minimize</span>
                    </button>
                </div>
            </header>

            {/* ════════════════════════════════════════
          MESSAGE AREA
      ════════════════════════════════════════ */}
            <div className="flex-1 overflow-y-auto chat-scroll p-4 space-y-3 bg-[#f8f9ff]">

                {/* Render all message bubbles */}
                {messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}

                {/* ── Quick reply chips (only show if no user message sent yet) ── */}
                {messages.length === 1 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {QUICK_REPLIES.map(label => (
                            <button
                                key={label}
                                onClick={() => sendMessage(label)}
                                className="px-4 py-1.5 border border-[#004ac6] text-[#004ac6] rounded-full text-[12px] font-medium leading-[16px] tracking-wide hover:bg-[#004ac6]/5 transition-colors"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Typing / Loading indicator ── */}
                {isLoading && (
                    <div className="flex items-center gap-1.5 bg-white border border-[#c3c6d7] px-4 py-3 rounded-2xl w-fit animate-fade-in-up">
                        <div className="w-1.5 h-1.5 bg-[#737686] rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-[#737686] rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-[#737686] rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                )}

                {/* Invisible anchor element — scrolled into view after new messages */}
                <div ref={messagesEndRef} />
            </div>

            {/* ════════════════════════════════════════
          INPUT FOOTER
      ════════════════════════════════════════ */}
            <div className="p-4 bg-[#f8f9ff] border-t border-[#c3c6d7] shrink-0">
                <div className="flex items-center gap-2">

                    {/* Text input */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                            className="w-full bg-[#e5eeff] border-none focus:outline-none focus:ring-2 focus:ring-[#004ac6] rounded-full px-5 py-3 pr-12 text-[14px] text-[#0b1c30] placeholder:text-[#737686] transition-all disabled:opacity-60"
                        />
                        {/* Emoji button (decorative — hook up emoji picker later if needed) */}
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737686] hover:text-[#004ac6] transition-colors">
                            <span className="material-symbols-outlined">sentiment_satisfied</span>
                        </button>
                    </div>

                    {/* Send button */}
                    <button
                        onClick={() => sendMessage()}
                        disabled={!inputValue.trim() || isLoading}
                        className="w-12 h-12 flex items-center justify-center cursor-pointer bg-[#004ac6] text-white rounded-full shadow-md transition-all active:scale-95 disabled:bg-[#d3e4fe] disabled:text-[#737686] disabled:shadow-none"
                    >
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </div>
            </div>

            {/* ════════════════════════════════════════
          BOTTOM NAV BAR
      ════════════════════════════════════════ */}
            <nav className="bg-[#e5eeff] border-t border-[#c3c6d7] flex justify-around items-center py-2 px-3 rounded-b-xl shrink-0">
                {/* Chat tab — active */}
                <a
                    href="#"
                    onClick={e => e.preventDefault()}
                    className="flex flex-col items-center justify-center bg-[#2563eb] text-white rounded-full px-6 py-1 opacity-90 transition-opacity"
                >
                    <span className="material-symbols-outlined">chat</span>
                    <span className="text-[11px] font-semibold tracking-wide leading-[16px]">Chat</span>
                </a>
                {/* Support tab */}
                <a
                    href="#"
                    onClick={e => e.preventDefault()}
                    className="flex flex-col items-center justify-center text-[#434655] px-6 py-1 hover:text-[#004ac6] transition-colors"
                >
                    <span className="material-symbols-outlined">help_outline</span>
                    <span className="text-[11px] font-semibold tracking-wide leading-[16px]">Support</span>
                </a>
            </nav>
        </div>
    );
};

export default ChatWindow;