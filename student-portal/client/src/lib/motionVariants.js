// Shared Framer Motion primitives — reuse these instead of hand-rolling
// per-page animation configs, so timing/easing stays consistent (fast,
// subtle, premium — not sluggish) everywhere motion is used.

// Entrance for a single item inside a `staggerContainer` parent.
export const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

// Wrap a list/grid's parent with `initial="hidden" animate="visible"
// variants={staggerContainer}`, then each child gets `variants={fadeInUp}`
// — children animate in with a small cascading delay instead of all at once.
export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

// Route-level transition — used once, in StudentLayout, wrapping <Outlet/>.
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.18, ease: 'easeOut' },
};

// Spread onto a motion.div/motion.button for a clickable card's hover/tap.
export const cardInteraction = {
  whileHover: { y: -2, transition: { duration: 0.15, ease: 'easeOut' } },
  whileTap: { scale: 0.98, transition: { duration: 0.1 } },
};

// Spread onto a motion.button for a plain button's tap feedback (no hover
// lift — used where a hover color/bg transition already exists via Tailwind).
export const tapScale = {
  whileTap: { scale: 0.97, transition: { duration: 0.1 } },
};

// Dropdown/popover open-close (ProfileMenu, NotificationBell, CourseSwitcher).
export const dropdownTransition = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98 },
  transition: { duration: 0.15, ease: 'easeOut' },
};
