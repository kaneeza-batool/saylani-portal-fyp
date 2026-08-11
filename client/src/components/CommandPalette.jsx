import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { NAV_ITEMS } from './Sidebar';
import { useCommandPalette } from '../context/CommandPaletteContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

function flattenNavCommands(items, section = '') {
  const out = [];
  for (const item of items) {
    if (item.to) out.push({ id: item.id, label: item.label, section, to: item.to });
    if (item.children) out.push(...flattenNavCommands(item.children, item.label));
  }
  return out;
}

const NAV_COMMANDS = flattenNavCommands(NAV_ITEMS);

function NavIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export default function CommandPalette() {
  const { open, openPalette, closePalette } = useCommandPalette();
  const { toggleTheme, theme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const actionCommands = useMemo(
    () => [
      {
        id: 'toggle-theme',
        label: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
        section: 'Actions',
        run: toggleTheme,
      },
      {
        id: 'logout',
        label: 'Log out',
        section: 'Actions',
        run: async () => {
          await logout();
          navigate('/login', { replace: true });
        },
      },
    ],
    [theme, toggleTheme, logout, navigate]
  );

  const allCommands = useMemo(() => [...NAV_COMMANDS, ...actionCommands], [actionCommands]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCommands;
    return allCommands.filter((c) => `${c.label} ${c.section}`.toLowerCase().includes(q));
  }, [query, allCommands]);

  useEffect(() => {
    function onKeyDown(e) {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openPalette();
      } else if (e.key === 'Escape' && open) {
        closePalette();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, openPalette, closePalette]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  const runCommand = (cmd) => {
    if (!cmd) return;
    if (cmd.to) navigate(cmd.to);
    else if (cmd.run) cmd.run();
    closePalette();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(results[activeIndex]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[14vh] px-4"
          onClick={closePalette}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[560px] bg-surface border border-neutral-200 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-neutral-200">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8A9A93" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, actions..."
                className="flex-1 border-none bg-transparent outline-none text-body text-neutral-900 font-sans"
              />
              <span className="text-badge text-neutral-400 font-normal border border-neutral-200 rounded px-1.5 py-0.5">Esc</span>
            </div>

            <div className="max-h-[320px] overflow-y-auto py-1.5">
              {results.length === 0 ? (
                <div className="px-4 py-8 text-center text-body-sm text-neutral-400">No matches.</div>
              ) : (
                results.map((cmd, i) => (
                  <button
                    key={cmd.id}
                    type="button"
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => runCommand(cmd)}
                    className={`w-full flex items-center justify-between gap-2.5 px-4 py-2.5 text-left cursor-pointer transition-colors ${
                      i === activeIndex ? 'bg-gold-500/10' : ''
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-body-sm font-semibold text-neutral-900 truncate">{cmd.label}</span>
                      {cmd.section && <span className="text-badge text-neutral-400 font-normal">{cmd.section}</span>}
                    </div>
                    {cmd.to && <NavIcon width="14" height="14" className="text-neutral-300 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
