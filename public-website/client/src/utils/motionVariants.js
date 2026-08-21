// Shared framer-motion variants for the public site — same fadeInUp/stagger
// language the root and student-portal apps already use, adapted for
// scroll-triggered reveals (whileInView) since this is a long-scrolling
// marketing site rather than a dashboard. Centralized so every section
// animates consistently instead of each page hand-rolling its own timing.

export const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

// Parent wrapper — children with a matching variant (fadeInUp etc.) cascade
// in one after another instead of popping in together.
export const staggerContainer = (staggerChildren = 0.1, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
});

// Standard scroll-reveal props for a section wrapper: animates once, a bit
// before it's fully in view so it doesn't feel late.
export const revealOnScroll = {
  initial: 'hidden',
  whileInView: 'show',
  viewport: { once: true, amount: 0.2 },
};

// Card hover — a gentle lift, not a cartoonish bounce.
export const cardHover = {
  whileHover: { y: -6, transition: { duration: 0.25, ease: 'easeOut' } },
};
