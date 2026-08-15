import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Standard react-router-dom pattern: BrowserRouter preserves scroll
// position across navigations (it's not a full page reload), so without
// this every route change keeps whatever scroll offset the previous page
// was left at.
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
