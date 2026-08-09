import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

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

// Nav tree = every item from the original design file's flat sidebar, plus
// the extra pages/sub-pages added later (Trainers > Attendance, Attendance,
// Administration > Slots, Updation, Profile, plus the AI/real-time additions).
// Leaf items carry `to`; anything with `children` is a collapsible
// group — only top-level groups/items carry an icon, matching the screenshots
// where indented sub-items are plain text.
export const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    to: '/admin/dashboard',
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
    id: 'students',
    label: 'Students',
    to: '/admin/students',
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
    id: 'campuses',
    label: 'Campuses',
    to: '/admin/campuses',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4 21V7l8-4 8 4v14" />
        <path d="M9 21v-6h6v6" />
        <path d="M9 11h.01M15 11h.01M9 15h.01M15 15h.01" />
      </svg>
    ),
  },
  {
    id: 'subadmins',
    label: 'Sub-Admins',
    to: '/admin/subadmins',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'trainers',
    label: 'Trainers',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="11" r="2" />
        <path d="M6 16c0-1.7 1.5-3 3-3s3 1.3 3 3" />
        <path d="M14 9h4M14 13h4" />
      </svg>
    ),
    children: [
      { id: 'trainers-list', label: 'Trainers', to: '/admin/trainers' },
      {
        id: 'trainers-attendance',
        label: 'Attendance',
        children: [
          { id: 'trainers-attendance-mark', label: 'Mark Attendance', to: '/admin/trainers/attendance/mark' },
          { id: 'trainers-attendance-view', label: 'View Attendance', to: '/admin/trainers/attendance/view' },
          { id: 'trainers-attendance-request', label: 'Attendance Request', to: '/admin/trainers/attendance/request' },
        ],
      },
    ],
  },
  {
    id: 'courses',
    label: 'Courses',
    to: '/admin/courses',
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
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18" />
        <path d="M8 2v4M16 2v4" />
        <path d="M8 14l2 2 4-4" />
      </svg>
    ),
    children: [
      { id: 'attendance-mark', label: 'Mark Attendance', to: '/admin/attendance/mark' },
      { id: 'attendance-view', label: 'View Attendance', to: '/admin/attendance/view' },
      { id: 'attendance-multi', label: 'Multi Attendance', to: '/admin/attendance/multi' },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
    children: [{ id: 'administration-slots', label: 'Slots', to: '/admin/administration/slots' }],
  },
  {
    id: 'quiz',
    label: 'Quiz Oversight',
    to: '/admin/quiz',
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
    id: 'employers',
    label: 'Employers',
    to: '/admin/employers',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="8" width="18" height="12" rx="2" />
        <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    ),
  },
  {
    id: 'jobportal',
    label: 'Job Portal',
    to: '/admin/jobportal',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    id: 'reports',
    label: 'Reports',
    to: '/admin/reports',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
  {
    id: 'auditlog',
    label: 'Audit Log',
    to: '/admin/auditlog',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4 6h16M4 12h16M4 18h10" />
        <circle cx="19" cy="18" r="2.2" />
      </svg>
    ),
  },
  {
    id: 'updation',
    label: 'Updation',
    to: '/admin/updation',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    to: '/admin/settings',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      </svg>
    ),
  },
  {
    id: 'insights',
    label: 'AI Insights',
    to: '/admin/insights',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 2a7 7 0 0 0-4 12.7V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.3A7 7 0 0 0 12 2z" />
        <path d="M9 21h6" />
      </svg>
    ),
  },
  {
    id: 'campusmap',
    label: 'Campus Map',
    to: '/admin/campus-map',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
  },
  {
    id: 'alerts',
    label: 'Alerts',
    to: '/admin/alerts',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    to: '/admin/profile',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

// Flat path -> label lookup, used by TopBar for the view title (walks every
// depth so nested leaves like "Mark Attendance" resolve too).
export const NAV_LOOKUP = (function flatten(items, acc = {}) {
  for (const item of items) {
    if (item.to) acc[item.to] = item.label;
    if (item.children) flatten(item.children, acc);
  }
  return acc;
})(NAV_ITEMS);

// Every group id whose subtree contains `pathname` — used to auto-expand
// the sidebar to the current route on load/navigation.
function findActiveAncestors(items, pathname, trail = []) {
  for (const item of items) {
    if (item.to === pathname) return trail;
    if (item.children) {
      const hit = findActiveAncestors(item.children, pathname, [...trail, item.id]);
      if (hit) return hit;
    }
  }
  return null;
}

function Chevron({ open }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

const DEPTH_PADDING = ['pl-3', 'pl-[41px]', 'pl-[57px]'];

function NavGroup({ item, depth, openGroups, onToggle }) {
  const open = openGroups.has(item.id);
  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        className={[
          'w-full flex items-center gap-[11px] rounded py-[9px] text-body font-medium cursor-pointer transition-colors duration-150',
          DEPTH_PADDING[depth] ?? DEPTH_PADDING[2],
          open
            ? 'bg-titan-sidebar-hover text-titan-sidebar-text-hover'
            : 'text-titan-sidebar-text hover:bg-titan-sidebar-hover hover:text-titan-sidebar-text-hover',
        ].join(' ')}
      >
        {depth === 0 && item.icon && (
          <span className="w-[18px] h-[18px] shrink-0 flex items-center justify-center">{item.icon}</span>
        )}
        <span className="flex-1 text-left">{item.label}</span>
        <Chevron open={open} />
      </button>

      {open && (
        <div className="flex flex-col gap-1 mt-1">
          {item.children.map((child) => (
            <NavNode key={child.id} item={child} depth={depth + 1} openGroups={openGroups} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

function NavLeaf({ item, depth }) {
  return (
    <NavLink
      to={item.to}
      end
      className={({ isActive }) =>
        [
          'flex items-center gap-[11px] rounded py-[9px] text-body font-medium cursor-pointer transition-colors duration-150',
          DEPTH_PADDING[depth] ?? DEPTH_PADDING[2],
          isActive
            ? 'bg-titan-sidebar-active text-titan-sidebar-text-active font-semibold shadow-[0_2px_10px_rgba(201,162,39,0.35)]'
            : 'text-titan-sidebar-text hover:bg-titan-sidebar-hover hover:text-titan-sidebar-text-hover',
        ].join(' ')
      }
    >
      {depth === 0 && item.icon && (
        <span className="w-[18px] h-[18px] shrink-0 flex items-center justify-center">{item.icon}</span>
      )}
      {item.label}
    </NavLink>
  );
}

function NavNode({ item, depth, openGroups, onToggle }) {
  if (item.children) {
    return <NavGroup item={item} depth={depth} openGroups={openGroups} onToggle={onToggle} />;
  }
  return <NavLeaf item={item} depth={depth} />;
}

export default function Sidebar() {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState(() => new Set(findActiveAncestors(NAV_ITEMS, location.pathname) ?? []));

  // Keep whichever group holds the current route expanded as navigation
  // happens, without collapsing groups the user opened manually.
  useEffect(() => {
    const ancestors = findActiveAncestors(NAV_ITEMS, location.pathname);
    if (!ancestors || ancestors.length === 0) return;
    setOpenGroups((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const id of ancestors) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [location.pathname]);

  const toggleGroup = (id) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="w-[252px] shrink-0 bg-titan-sidebar flex flex-col gap-1 sticky top-0 h-screen py-[22px] px-3.5 overflow-y-auto">
      <div className="flex items-center gap-2.5 pt-1.5 px-2.5 pb-[22px]">
        <div className="w-[40px] h-[40px] shrink-0 flex items-center justify-center">
          <img src="/logo.png" alt="TITAN crest" className="w-full h-full object-contain drop-shadow-[0_2px_6px_rgba(201,162,39,0.4)]" />
        </div>
        <div>
          <div className="font-heading font-bold text-brand text-gold-400 tracking-wide">TITAN</div>
          <div className="text-[11px] font-medium text-titan-sidebar-text/80">Super Admin</div>
        </div>
      </div>

      {NAV_ITEMS.map((item) => (
        <NavNode key={item.id} item={item} depth={0} openGroups={openGroups} onToggle={toggleGroup} />
      ))}
    </div>
  );
}
