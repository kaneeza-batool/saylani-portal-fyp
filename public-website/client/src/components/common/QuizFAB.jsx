import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useFooterInView from '../../hooks/useFooterInView';

// Site-wide floating entry point into the Find Your Path quiz. Mounted once
// in PublicLayout so its minimized/expanded state survives route changes
// within a session. Positioned above ScrollToTopButton (`bottom-8 right-8`)
// so the two never overlap each other; both hide once the footer scrolls
// into view so neither ever overlaps footer links either.
const QuizFAB = () => {
  const [minimized, setMinimized] = useState(false);
  const { pathname } = useLocation();
  const footerInView = useFooterInView();

  if (pathname === '/find-your-path' || footerInView) return null;

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        title="Find Your Path course quiz"
        aria-label="Expand Find Your Path quiz prompt"
        className="fixed bottom-24 right-6 sm:right-8 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-primary-900 text-white shadow-lg hover:bg-primary-800 hover:-translate-y-1 transition-all duration-300 cursor-pointer text-lg"
      >
        🎯
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 sm:right-8 z-40">
      <div className="relative group">
        <button
          type="button"
          onClick={() => setMinimized(true)}
          aria-label="Minimize Find Your Path quiz prompt"
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 shadow-sm flex items-center justify-center text-[10px] font-bold cursor-pointer z-10 leading-none"
        >
          ×
        </button>
        <Link
          to="/find-your-path"
          aria-label="Find Your Path floating quiz button"
          className="flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-primary-900 text-white no-underline shadow-lg hover:bg-primary-800 hover:-translate-y-1 transition-all duration-300 text-sm font-bold whitespace-nowrap"
        >
          <span>🎯</span>
          <span>Find Your Path</span>
        </Link>
      </div>
    </div>
  );
};

export default QuizFAB;
