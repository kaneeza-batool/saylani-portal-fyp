// Shared card shell. Every section still supplies its own padding, border
// color, shadow and hover treatment via `className` — this just centralizes
// the repeated wrapper <div> so it isn't retyped per section.
const Card = ({ className = '', children, ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export default Card;
