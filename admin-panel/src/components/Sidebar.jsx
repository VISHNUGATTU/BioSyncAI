import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FlaskConical,
  TestTube2,
  FileText,
  Stethoscope,
  CalendarDays,
  BrainCircuit,
  AlertTriangle,
  CreditCard,
  Bell,
  BarChart3,
  ShieldCheck,
  ClipboardList,
  Settings,
  UserRoundCog,
  Headset,
  FileCode2,
  X,
  ChevronRight,
  Activity,
} from 'lucide-react';

import useAuthStore from '../store/authStore';

const navigationGroups = [
  {
    title: 'Overview',
    items: [
      {
        path: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        path: '/users',
        label: 'Users',
        icon: Users,
      },
      {
        path: '/tests',
        label: 'Lab Tests',
        icon: FlaskConical,
      },
      {
        path: '/samples',
        label: 'Samples',
        icon: TestTube2,
      },
      {
        path: '/assistants',
        label: 'Lab Assistants',
        icon: UserRoundCog,
      },
      {
        path: '/doctors',
        label: 'Doctors',
        icon: Stethoscope,
      },
      {
        path: '/appointments',
        label: 'Appointments',
        icon: CalendarDays,
      },
      {
        path: '/reports',
        label: 'Reports',
        icon: FileText,
      },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      {
        path: '/ai-analytics',
        label: 'AI Analytics',
        icon: BrainCircuit,
        accent: true,
      },
      {
        path: '/analytics',
        label: 'Analytics',
        icon: BarChart3,
      },
    ],
  },
  {
    title: 'Operations & Support',
    items: [
      {
        path: '/payments',
        label: 'Payments',
        icon: CreditCard,
      },
      {
        path: '/tickets',
        label: 'Support',
        icon: Headset,
      },
      {
        path: '/alerts',
        label: 'Alerts',
        icon: AlertTriangle,
        badge: true,
      },
      {
        path: '/notifications',
        label: 'Notifications',
        icon: Bell,
        badge: true,
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        path: '/roles',
        label: 'Roles & Permissions',
        icon: ShieldCheck,
      },
      {
        path: '/audit',
        label: 'Audit Logs',
        icon: ClipboardList,
      },
      {
        path: '/logs',
        label: 'System Logs',
        icon: FileCode2,
      },
      {
        path: '/settings',
        label: 'Settings',
        icon: Settings,
      },
    ],
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const admin = useAuthStore((state) => state.admin);

  const getInitials = () => {
    const name =
      admin?.name ||
      admin?.fullName ||
      admin?.username ||
      admin?.email ||
      'Admin User';

    const parts = name.trim().split(/\s+/);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }

    return name.slice(0, 2).toUpperCase();
  };

  const getAdminName = () => {
    return (
      admin?.name ||
      admin?.fullName ||
      admin?.username ||
      'Administrator'
    );
  };

  const getAdminRole = () => {
    return admin?.role || 'Super Admin';
  };

  const handleNavigation = () => {
    if (window.innerWidth < 768) {
      onClose?.();
    }
  };

  const isItemActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex w-[272px] -translate-x-full
        flex-col overflow-hidden border-r border-slate-800/70
        bg-[#07111f] text-slate-300 shadow-2xl
        transition-transform duration-300 ease-out
        md:relative md:z-20 md:translate-x-0 md:shadow-none
        ${isOpen ? 'translate-x-0' : ''}
      `}
    >
      {/* Background accents */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-cyan-500/[0.045] blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-blue-600/[0.04] blur-[90px]" />

      {/* Brand */}
      <div className="relative shrink-0 border-b border-white/[0.06] px-5 py-5">

        <div className="flex items-center justify-between">

          <Link
            to="/dashboard"
            onClick={handleNavigation}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] shadow-[0_0_25px_rgba(34,211,238,0.07)]">
              <Activity
                size={19}
                strokeWidth={2.5}
                className="text-cyan-300"
              />

              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_9px_rgba(103,232,249,0.9)]" />
            </div>

            <div className="min-w-0">
              <div className="text-[17px] font-semibold tracking-tight text-white">
                BioSync
              </div>

              <div className="mt-0.5 text-[8px] font-semibold tracking-[0.24em] text-slate-500">
                ADMIN CONSOLE
              </div>
            </div>
          </Link>

          {/* Mobile close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-white md:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* System status */}
        <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.025] px-3 py-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>

          <span className="text-[11px] font-medium text-slate-400">
            System operational
          </span>

          <span className="ml-auto rounded-md bg-emerald-400/10 px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-emerald-400">
            LIVE
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        className="relative flex-1 overflow-y-auto px-3 py-5"
      >
        <div className="space-y-6">

          {navigationGroups.map((group) => (
            <div key={group.title}>

              <div className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">
                {group.title}
              </div>

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={handleNavigation}
                      className={`
                        group relative flex h-10 items-center gap-3
                        rounded-xl px-3 text-[12px] font-medium
                        transition-all duration-200
                        ${
                          active
                            ? 'bg-cyan-400/[0.09] text-cyan-300'
                            : 'text-slate-500 hover:bg-white/[0.035] hover:text-slate-200'
                        }
                      `}
                    >
                      {/* Active indicator */}
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.65)]" />
                      )}

                      <span
                        className={`
                          flex h-7 w-7 shrink-0 items-center justify-center
                          rounded-lg transition-colors
                          ${
                            active
                              ? 'bg-cyan-400/[0.08] text-cyan-300'
                              : item.accent
                                ? 'text-violet-400 group-hover:text-violet-300'
                                : 'text-slate-600 group-hover:text-slate-300'
                          }
                        `}
                      >
                        <Icon
                          size={17}
                          strokeWidth={active ? 2.2 : 1.8}
                        />
                      </span>

                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>

                      {item.badge && !active && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_7px_rgba(34,211,238,0.6)]" />
                      )}

                      {active && (
                        <ChevronRight
                          size={14}
                          strokeWidth={2.5}
                          className="shrink-0 text-cyan-400/70"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

        </div>
      </nav>

      {/* Profile */}
      <div className="relative shrink-0 border-t border-white/[0.06] p-3">

        <div className="group flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.025] px-3 py-2.5 transition-colors hover:border-white/[0.08] hover:bg-white/[0.04]">

          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-[10px] font-bold text-white">
            {getInitials()}

            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#07111f] bg-emerald-400" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-200">
              {getAdminName()}
            </p>

            <p className="mt-0.5 truncate text-[10px] text-slate-600">
              {getAdminRole()}
            </p>
          </div>

          <ChevronRight
            size={15}
            className="shrink-0 text-slate-700 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
          />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;