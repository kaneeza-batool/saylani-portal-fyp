import { NavLink } from 'react-router-dom';

const ICON_PROPS = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

// Flat nav list for the trainer portal — no nested groups, unlike the
// super-admin Sidebar, since trainers only have a handful of top-level views.
export const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    to: '/trainer/dashboard',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    id: 'batches',
    label: 'My Batches',
    to: '/trainer/batches',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4 5c2-1 4-1 6 0v14c-2-1-4-1-6 0V5z" />
        <path d="M20 5c-2-1-4-1-6 0v14c2-1 4-1 6 0V5z" />
      </svg>
    ),
  },
  {
    id: 'attendance',
    label: 'Attendance',
    to: '/trainer/attendance',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18" />
        <path d="M8 2v4M16 2v4" />
        <path d="M8 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'quizzes',
    label: 'Quizzes & Assignments',
    to: '/trainer/quizzes',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 3v2h6V3" />
        <path d="M8 11l2 2 4-4" />
        <path d="M8 16h6" />
      </svg>
    ),
  },
  {
    id: 'students',
    label: 'Students',
    to: '/trainer/students',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="9" cy="8" r="3" />
        <path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" />
        <circle cx="17" cy="9" r="2.3" />
        <path d="M16 14.2c2.7.3 5 2.3 5 5.8" />
      </svg>
    ),
  },
  {
    id: 'resources',
    label: 'Resources',
    to: '/trainer/resources',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M14 3v5h5" />
        <path d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
        <path d="M9 13h6M9 17h6" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    to: '/trainer/profile',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

// Flat path -> label lookup, used by TopBar for the view title.
export const NAV_LOOKUP = NAV_ITEMS.reduce((acc, item) => {
  acc[item.to] = item.label;
  return acc;
}, {});

function NavLeaf({ item }) {
  return (
    <NavLink
      to={item.to}
      end
      className={({ isActive }) =>
        [
          'flex items-center gap-[11px] rounded py-[9px] pl-3 text-body font-medium cursor-pointer transition-colors duration-150',
          isActive
            ? 'bg-titan-sidebar-active text-titan-sidebar-text-active font-semibold shadow-[0_2px_10px_rgba(201,162,39,0.35)]'
            : 'text-titan-sidebar-text hover:bg-titan-sidebar-hover hover:text-titan-sidebar-text-hover',
        ].join(' ')
      }
    >
      <span className="w-[18px] h-[18px] shrink-0 flex items-center justify-center">{item.icon}</span>
      {item.label}
    </NavLink>
  );
}

export default function TrainerSidebar() {
  return (
    <div className="w-[252px] shrink-0 bg-titan-sidebar flex flex-col gap-1 sticky top-0 h-screen py-[22px] px-3.5 overflow-y-auto">
      <div className="flex items-center gap-2.5 pt-1.5 px-2.5 pb-[22px]">
        <div className="w-[40px] h-[40px] shrink-0 flex items-center justify-center">
          <img src="/logo.png" alt="TITAN crest" className="w-full h-full object-contain drop-shadow-[0_2px_6px_rgba(201,162,39,0.4)]" />
        </div>
        <div>
          <div className="font-heading font-bold text-brand text-gold-400 tracking-wide">TITAN</div>
          <div className="text-[11px] font-medium text-titan-sidebar-text/80">Trainer Portal</div>
        </div>
      </div>

      {NAV_ITEMS.map((item) => (
        <NavLeaf key={item.id} item={item} />
      ))}
    </div>
  );
}
