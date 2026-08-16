import { useEffect, useState } from 'react';

// Tracks whether the site <footer> is at least partially visible in the
// viewport. Fixed-position floating UI (QuizFAB, ScrollToTopButton) reads
// this to get out of the footer's way instead of covering its links —
// they previously sat at a fixed bottom-right screen position that always
// landed on top of the footer's last row once a visitor scrolled that far,
// on every breakpoint, since a fixed element can't avoid whatever content
// happens to be at that same screen position.
const useFooterInView = () => {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const footerEl = document.querySelector('footer');
    if (!footerEl) return undefined;

    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '0px',
      threshold: 0,
    });
    observer.observe(footerEl);
    return () => observer.disconnect();
  }, []);

  return inView;
};

export default useFooterInView;
