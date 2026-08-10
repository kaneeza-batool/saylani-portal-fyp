function Svg(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props} />;
}

export function GraduationCapIcon(props) {
  return (
    <Svg {...props}>
      <path d="M22 10L12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
      <path d="M22 10v6" />
    </Svg>
  );
}

export function CampusIcon(props) {
  return (
    <Svg {...props}>
      <path d="M3 21h18" />
      <path d="M5 21V9l7-5 7 5v12" />
      <path d="M9 21v-6h6v6" />
    </Svg>
  );
}

export function BriefcaseIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </Svg>
  );
}

export function HourglassIcon(props) {
  return (
    <Svg {...props}>
      <path d="M6 2h12" />
      <path d="M6 22h12" />
      <path d="M6 2c0 5 4 6 4 10s-4 5-4 10" />
      <path d="M18 2c0 5-4 6-4 10s4 5 4 10" />
    </Svg>
  );
}

export function TeacherIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="7" r="3.5" />
      <path d="M4.5 20.5c0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5" />
    </Svg>
  );
}

export function BookIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </Svg>
  );
}

export function ClipboardIcon(props) {
  return (
    <Svg {...props}>
      <rect x="5" y="4" width="14" height="18" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M9 11h6M9 15h6" />
    </Svg>
  );
}

export function JobPostingIcon(props) {
  return (
    <Svg {...props}>
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M4 11h16" />
      <path d="M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
    </Svg>
  );
}

export function CalendarIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9.5h18" />
      <path d="M8 2.5v4M16 2.5v4" />
    </Svg>
  );
}
