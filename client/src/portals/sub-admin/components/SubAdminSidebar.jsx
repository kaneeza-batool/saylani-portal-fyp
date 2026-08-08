import { NavLink } from 'react-router-dom';
import { ADMISSIONS_BADGE_COUNT } from '../_mocks';

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

export const SUB_NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    to: '/sub-admin/dashboard',
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
    id: 'admissions',
    label: 'Admissions Queue',
    to: '/sub-admin/admissions',
    badge: ADMISSIONS_BADGE_COUNT,
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M9 3l-6 6v12h18V9l-6-6" />
        <path d="M9 3h6v6H9z" />
        <path d="M10 15l1.5 1.5L14 13" />
      </svg>
    ),
  },
  {
    id: 'students',
    label: 'Students',
    to: '/sub-admin/students',
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
    id: 'trainers',
    label: 'Trainers',
    to: '/sub-admin/trainers',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="11" r="2" />
        <path d="M6 16c0-1.7 1.5-3 3-3s3 1.3 3 3" />
        <path d="M14 9h4M14 13h4" />
      </svg>
    ),
  },
  {
    id: 'batches',
    label: 'Batches',
    to: '/sub-admin/batches',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4 5c2-1 4-1 6 0v14c-2-1-4-1-6 0V5z" />
        <path d="M20 5c-2-1-4-1-6 0v14c2-1 4-1 6 0V5z" />
      </svg>
    ),
  },
  {
    id: 'attendance',
    label: 'Attendance Reports',
    to: '/sub-admin/attendance',
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
    id: 'feedback',
    label: 'Feedback',
    to: '/sub-admin/feedback',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M21 12a8 8 0 1 1-3.5-6.6" />
        <path d="M21 4v5h-5" />
      </svg>
    ),
  },
];

// Flat path → label map used by SubAdminTopBar to resolve the page title.
export const SUB_NAV_LOOKUP = Object.fromEntries(SUB_NAV_ITEMS.map((i) => [i.to, i.label]));

export default function SubAdminSidebar() {
  return (
    <div className="w-[252px] shrink-0 bg-primary-900 flex flex-col gap-1 sticky top-0 h-screen py-[22px] px-3.5 overflow-y-auto">
      {/* Logo + wordmark */}
      <div className="flex items-center gap-2.5 pt-1.5 px-2.5 pb-3">
        <div className="w-[34px] h-[34px] rounded shrink-0 bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center font-heading font-bold text-white text-[15px]">
          T
        </div>
        <div>
          <div className="font-heading font-bold text-brand text-white">TITAN</div>
          <div className="text-micro font-medium text-neutral-400">Campus Manager</div>
        </div>
      </div>

      {/* Campus pill — hardcoded until campus-lookup endpoint exists */}
      <div className="mx-2.5 mb-4 px-2.5 py-2 bg-white/10 rounded text-badge font-semibold text-neutral-200">
        Campus
      </div>

      {/* Flat nav — no collapsible groups */}
      {SUB_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.id}
          to={item.to}
          end
          className={({ isActive }) =>
            [
              'flex items-center gap-[11px] rounded py-[9px] text-body font-medium cursor-pointer transition-colors duration-150 border-l-2',
              isActive
                ? 'bg-primary-600 text-white border-l-accent-500 pl-2.5 pr-3'
                : 'text-neutral-200 border-l-transparent pl-3 pr-3 hover:bg-white/10 hover:text-white',
            ].join(' ')
          }
        >
          <span className="w-[18px] h-[18px] shrink-0 flex items-center justify-center">
            {item.icon}
          </span>
          <span className="flex-1">{item.label}</span>
          {item.badge != null && (
            <span className="ml-auto bg-accent-500 text-neutral-900 text-badge rounded-pill px-2 py-px">
              {item.badge}
            </span>
          )}
        </NavLink>
      ))}
    </div>
  );
}
