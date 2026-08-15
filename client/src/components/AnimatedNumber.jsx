import { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

// KPI values arrive pre-formatted from the backend ("4,820", "68%", "12") —
// pull the numeric part out, animate it, then reapply whatever suffix/comma
// styling the original string had.
function parseValue(raw) {
  const str = String(raw ?? '');
  const suffixMatch = str.match(/[^\d.]+$/);
  const suffix = suffixMatch ? suffixMatch[0] : '';
  const numeric = parseFloat(str.replace(/[^\d.]/g, '')) || 0;
  return { numeric, suffix };
}

export default function AnimatedNumber({ value }) {
  const { numeric, suffix } = parseValue(value);
  const [display, setDisplay] = useState(`0${suffix}`);

  useEffect(() => {
    const controls = animate(0, numeric, {
      duration: 0.9,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(`${Math.round(v).toLocaleString()}${suffix}`),
    });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numeric, suffix]);

  return display;
}
