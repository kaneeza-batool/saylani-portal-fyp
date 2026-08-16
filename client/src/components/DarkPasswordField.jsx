import { useState } from 'react';

// Password input for the dark navy/gold auth forms (Login, Trainer Register)
// — same titan-dark-input styling those already use, plus a show/hide
// toggle none of them had. Shared here rather than duplicated per-form
// since both need the exact same look/behavior.
export default function DarkPasswordField({ id, value, onChange, placeholder, autoComplete, required }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="titan-dark-input w-full border border-white/15 bg-white/[0.04] text-white placeholder:text-navy-300 rounded px-3 py-[10px] pr-10 text-body-sm font-sans outline-none focus:border-gold-500 focus:shadow-[0_0_0_3px_rgba(201,162,39,0.15)] transition-all"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-gold-400 transition-colors"
      >
        {visible ? (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3l18 18" />
            <path d="M10.6 5.2A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a15.5 15.5 0 0 1-3.4 4.3M6.3 6.5C3.9 8.1 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 3.6-.7" />
            <path d="M9.5 10a3 3 0 0 0 4.2 4.2" />
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
