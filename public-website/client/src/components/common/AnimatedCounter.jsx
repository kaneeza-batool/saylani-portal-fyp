import { useEffect, useRef, useState } from 'react';

// Count-up number that starts animating once it scrolls into view.
const AnimatedCounter = ({ target, duration = 1800, prefix = '' }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) setHasStarted(true);
      },
      { threshold: 0.2 }
    );
    if (countRef.current) observer.observe(countRef.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let startTimestamp = null;
    const numericTarget = parseInt(target.replace(/[^0-9]/g, ''), 10);
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * numericTarget));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [hasStarted, target, duration]);

  return (
    <span ref={countRef} className="tabular-nums">
      {prefix}{count.toLocaleString()}{target.includes('+') ? '+' : target.includes('%') ? '%' : ''}
    </span>
  );
};

export default AnimatedCounter;
