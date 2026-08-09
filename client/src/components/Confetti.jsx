import { useMemo } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#D0A35B', '#162346', '#1A7F42', '#C0392B', '#1D5FB8'];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export default function Confetti({ count = 80 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: randomBetween(0, 100),
        color: COLORS[i % COLORS.length],
        delay: randomBetween(0, 0.6),
        duration: randomBetween(2.6, 4),
        drift: randomBetween(-120, 120),
        rotate: randomBetween(360, 900),
        width: randomBetween(6, 12),
        height: randomBetween(8, 16),
      })),
    [count]
  );

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden pointer-events-none" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: '-10vh', x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', x: p.drift, opacity: [1, 1, 0.9, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: 0,
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
