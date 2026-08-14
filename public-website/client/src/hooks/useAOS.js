import { useEffect, useRef, useState } from 'react';

// Scroll-reveal hook shared by Home and Programs — fires once when the
// element crosses 10% into the viewport, then disconnects.
const useAOS = () => {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, []);

  return [elementRef, isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'];
};

export default useAOS;
