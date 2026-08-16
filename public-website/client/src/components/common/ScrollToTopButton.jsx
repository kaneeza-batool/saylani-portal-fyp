import { useState, useEffect } from 'react';
import useFooterInView from '../../hooks/useFooterInView';

const ScrollToTopButton = () => {
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const footerInView = useFooterInView();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollBtn(true);
      } else {
        setShowScrollBtn(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Hides once the footer is in view — this button sits at a fixed
  // bottom-right screen position that would otherwise always land on top
  // of the footer's last row once a visitor scrolls that far.
  if (!showScrollBtn || footerInView) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-50 flex items-center justify-center p-3.5 bg-white/70 backdrop-blur-xl border border-neutral-200/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06),_inset_0_1px_1px_rgba(255,255,255,0.8)] text-neutral-800 hover:text-accent-600 hover:border-accent-500/30 hover:bg-white hover:shadow-[0_12px_40px_-8px_rgba(208,163,91,0.15)] transition-all duration-500 hover:-translate-y-1.5 active:scale-95 cursor-pointer group select-none"
      title="Scroll to Top"
    >
      {/* Subtle background glow on hover */}
      <span className="absolute inset-0 bg-gradient-to-tr from-accent-50/0 to-accent-50/0 group-hover:from-accent-50/40 group-hover:to-accent-100/30 rounded-2xl transition-all duration-500 -z-10" />
      
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="group-hover:-translate-y-0.5 transition-transform duration-300"
      >
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="5 12 12 5 19 12"></polyline>
      </svg>
    </button>
  );
};

export default ScrollToTopButton;