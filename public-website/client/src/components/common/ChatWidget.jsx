import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import useFooterInView from '../../hooks/useFooterInView';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5200';

const GREETING = {
  role: 'assistant',
  content: "Hi! I'm the TITAN Assistant. Ask me about our campuses, courses, eligibility, or how to apply.",
};

// Site-wide floating chatbot entry point, mounted once in PublicLayout so
// its open/closed state and conversation survive route changes within a
// session. Stacked above WhatsAppFAB (`bottom-40`) at `bottom-56`, same
// positioning/sizing/z-index convention as QuizFAB and WhatsAppFAB, and
// hides once the footer scrolls into view for the same reason those two do.
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const footerInView = useFooterInView();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  if (footerInView && !open) return null;

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setError('');
    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const { data } = await axios.post(`${API_URL}/api/chat`, {
        message: text,
        history: nextMessages.filter((m) => m !== GREETING).map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err.response?.data?.message || "Sorry, something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Chat with the TITAN Assistant"
        aria-label="Open TITAN Assistant chat"
        className="fixed bottom-56 right-6 sm:right-8 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-accent-500 text-primary-900 shadow-lg hover:bg-accent-400 hover:-translate-y-1 transition-all duration-300 cursor-pointer text-lg"
      >
        💬
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 sm:right-8 z-40 w-[92vw] max-w-[360px] h-[70vh] max-h-[520px] bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-primary-900 text-white">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-full bg-accent-500 text-primary-900 flex items-center justify-center text-sm font-bold shrink-0">T</span>
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">TITAN Assistant</div>
            <div className="text-[11px] text-primary-200">Ask about campuses, courses & admissions</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close chat"
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          ✕
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-3 flex flex-col gap-2.5 bg-neutral-50">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-snug whitespace-pre-wrap ${
              m.role === 'user'
                ? 'self-end bg-primary-900 text-white rounded-br-md'
                : 'self-start bg-white border border-neutral-200 text-neutral-800 rounded-bl-md'
            }`}
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <div className="self-start bg-white border border-neutral-200 text-neutral-400 px-3.5 py-2.5 rounded-2xl rounded-bl-md text-sm">
            Typing...
          </div>
        )}
        {error && (
          <div className="self-start bg-danger-bg text-danger-text px-3.5 py-2 rounded-lg text-xs">{error}</div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-neutral-200 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
          disabled={sending}
          className="flex-1 rounded-full border border-neutral-300 px-3.5 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Send message"
          className="w-9 h-9 shrink-0 rounded-full bg-primary-900 text-white flex items-center justify-center hover:bg-primary-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
