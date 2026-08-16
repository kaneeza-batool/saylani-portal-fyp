import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { sendChatMessage } from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import { fadeInUp, staggerContainer } from '../lib/motionVariants';
import { BotIcon } from '../components/icons';

function greeting(student) {
  const name = student?.fullName?.split(' ')[0] || 'there';
  return `Hi ${name}! I'm the TITAN Assistant. Ask me about your course, campuses, eligibility, admissions, or anything else about TITAN — for your own attendance/grades/fee status, check the relevant portal page instead, since I can't see your live account data.`;
}

export default function AskTitanPage() {
  const { student } = useAuth();
  const [messages, setMessages] = useState(() => [{ role: 'assistant', content: greeting(student) }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

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
      const reply = await sendChatMessage(
        text,
        nextMessages.slice(1).map((m) => ({ role: m.role, content: m.content }))
      );
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-4 sm:gap-6 h-[calc(100vh-140px)] sm:h-[calc(100vh-120px)]">
      <motion.div variants={fadeInUp} className="flex items-center gap-2">
        <BotIcon className="w-5 h-5 text-primary-800" />
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-neutral-900">TITAN Assistant</h1>
      </motion.div>

      <motion.div variants={fadeInUp} className="flex-1 min-h-0 bg-white border border-neutral-200 rounded-lg shadow-card flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 flex flex-col gap-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'self-end bg-primary-800 text-white rounded-br-md'
                  : 'self-start bg-neutral-100 text-neutral-800 rounded-bl-md'
              }`}
            >
              {m.content}
            </div>
          ))}
          {sending && (
            <div className="self-start bg-neutral-100 text-neutral-400 px-4 py-2.5 rounded-2xl rounded-bl-md text-sm">
              Typing...
            </div>
          )}
          {error && <div className="self-start bg-danger-bg text-danger-text px-3.5 py-2 rounded-lg text-xs">{error}</div>}
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2 p-3 sm:p-4 border-t border-neutral-200">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about courses, campuses, eligibility..."
            disabled={sending}
            className="flex-1 rounded-md border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-md px-4 py-2.5 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
