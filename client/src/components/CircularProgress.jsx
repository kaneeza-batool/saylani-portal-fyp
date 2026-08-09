export default function CircularProgress({ percentage, size = 44, strokeWidth = 4, labelClassName = '' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const tone = percentage === 100 ? 'text-success-text' : percentage === 0 ? 'text-neutral-300' : 'text-accent-500';

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} className="stroke-neutral-200 fill-none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`fill-none stroke-current transition-[stroke-dashoffset] duration-500 ${tone}`}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-bold text-neutral-700 ${labelClassName}`}>
        {percentage}%
      </span>
    </div>
  );
}
