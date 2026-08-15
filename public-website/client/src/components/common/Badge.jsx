// Shared pill/label shell. Sizing, color and shape stay per call-site via
// `className` since eyebrow tags, status pills and category tags each use
// different variants today — this just centralizes the repeated <span>.
const Badge = ({ className = '', children, ...props }) => (
  <span className={className} {...props}>
    {children}
  </span>
);

export default Badge;
