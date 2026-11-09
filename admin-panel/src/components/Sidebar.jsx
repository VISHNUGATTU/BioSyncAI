import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FlaskConical, TestTube2, FileText,
  Stethoscope, CalendarDays, BrainCircuit, AlertTriangle,
  CreditCard, Bell, BarChart3, ShieldCheck, ClipboardList,
  Settings, UserRoundCog, Headset, FileCode2, X, ChevronRight,
  Activity, ShieldAlert, ChefHat,
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const navigationGroups = [
  {
    title: 'Overview',
    items: [{ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Operations',
    items: [
      { path: '/users',        label: 'Users',           icon: Users },
      { path: '/tests',        label: 'Lab Tests',        icon: FlaskConical },
      { path: '/samples',      label: 'Samples',          icon: TestTube2 },
      { path: '/assistants',   label: 'Lab Assistants',   icon: UserRoundCog },
      { path: '/doctors',      label: 'Doctors',          icon: Stethoscope },
      { path: '/appointments', label: 'Appointments',     icon: CalendarDays },
      { path: '/reports',      label: 'Reports',          icon: FileText },
    ],
  },
  {
    title: 'Metabolic Food Delivery',
    items: [
      { path: '/kitchen-kds',           label: 'Kitchen KDS (Tickets)', icon: ChefHat, accent: true },
      { path: '/clinical-surveillance', label: 'Clinical Nutrition',    icon: Activity, accent: true },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { path: '/ai-analytics', label: 'AI Analytics', icon: BrainCircuit, accent: true },
      { path: '/analytics',    label: 'Analytics',    icon: BarChart3 },
    ],
  },
  {
    title: 'Finance & Support',
    items: [
      { path: '/payments',      label: 'Payments',       icon: CreditCard },
      { path: '/tickets',       label: 'Support',        icon: Headset },
      { path: '/alerts',        label: 'Alerts',         icon: AlertTriangle },
      { path: '/notifications', label: 'Notifications',  icon: Bell },
    ],
  },
  {
    title: 'Administration',
    items: [
      { path: '/roles',            label: 'Roles & Permissions', icon: ShieldCheck },
      { path: '/audit',            label: 'Audit Logs',          icon: ClipboardList },
      { path: '/error-monitoring', label: 'Error Monitoring',    icon: ShieldAlert },
      { path: '/logs',             label: 'System Logs',         icon: FileCode2 },
      { path: '/settings',         label: 'Settings',            icon: Settings },
    ],
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const admin = useAuthStore((state) => state.admin);

  const getInitials = () => {
    const name = admin?.name || admin?.fullName || admin?.username || admin?.email || 'Admin';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getAdminName = () => admin?.name || admin?.fullName || admin?.username || 'Administrator';
  const getAdminRole = () => admin?.role || 'Super Admin';

  const handleNavigation = () => {
    if (window.innerWidth < 768) onClose?.();
  };

  const isItemActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex w-[264px] -translate-x-full flex-col
        border-r border-slate-200/80 bg-white/80 backdrop-blur-2xl
        shadow-[4px_0_24px_rgba(15,23,42,0.04)]
        transition-all duration-300 ease-out
        dark:border-slate-800/80 dark:bg-slate-900/85 dark:shadow-[4px_0_28px_rgba(0,0,0,0.45)]
        md:relative md:z-20 md:translate-x-0
        ${isOpen ? 'translate-x-0' : ''}
      `}
    >
      {/* ── Brand Header ── */}
      <div className="shrink-0 border-b border-slate-200/75 px-5 py-4 dark:border-slate-800/80">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" onClick={handleNavigation} className="group flex min-w-0 items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-gradient-to-br from-white to-cyan-50/60 shadow-sm transition-transform duration-200 group-hover:scale-105 dark:border-cyan-400/25 dark:from-slate-800 dark:to-slate-900">
              <img src="/images/Logo.png" alt="BioSyncAI" className="h-6 w-6 object-contain" />
              <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">
                  BioSync<span className="text-cyan-600 dark:text-cyan-400">AI</span>
                </p>
                <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  v3.4
                </span>
              </div>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                Clinical Command
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 md:hidden"
          >
            <X size={17} />
          </button>
        </div>

        {/* Live Telemetry Status Pill */}
        <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 dark:border-emerald-500/25 dark:bg-emerald-500/[0.08]">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            All Nodes Operational
          </span>
          <span className="ml-auto rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9px] font-extrabold tracking-widest text-emerald-700 dark:text-emerald-300">
            LIVE
          </span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-1.5 px-2.5 text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                {group.title}
              </p>
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
                        group relative flex h-9.5 items-center gap-3 rounded-xl px-2.5 text-[12.5px] font-semibold
                        transition-all duration-150
                        ${active
                          ? 'bg-gradient-to-r from-cyan-500/[0.12] via-cyan-500/[0.06] to-transparent text-cyan-700 shadow-2xs ring-1 ring-cyan-500/25 dark:from-cyan-400/[0.16] dark:via-cyan-400/[0.06] dark:text-cyan-300 dark:ring-cyan-400/25'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
                        }
                      `}
                    >
                      {/* Active left glow indicator bar */}
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] dark:bg-cyan-400" />
                      )}

                      <span
                        className={`
                          flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150
                          ${active
                            ? 'bg-cyan-500 text-white shadow-xs shadow-cyan-500/30 dark:bg-cyan-400 dark:text-slate-950'
                            : item.accent
                              ? 'bg-violet-500/10 text-violet-600 group-hover:bg-violet-500/20 dark:bg-violet-400/10 dark:text-violet-400'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-cyan-500/10 group-hover:text-cyan-600 dark:bg-slate-800/90 dark:text-slate-400 dark:group-hover:bg-cyan-400/10 dark:group-hover:text-cyan-300'
                          }
                        `}
                      >
                        <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                      </span>

                      <span className="min-w-0 flex-1 truncate">{item.label}</span>

                      {item.accent && !active && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400/80" />
                      )}

                      {active && (
                        <ChevronRight size={13} strokeWidth={2.5} className="shrink-0 text-cyan-500 dark:text-cyan-400" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* ── Profile Footer Card ── */}
      <div className="shrink-0 border-t border-slate-200/75 p-3 dark:border-slate-800/80">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/75 px-3 py-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-800/50">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-extrabold text-white shadow-sm shadow-cyan-500/20">
            {getInitials()}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400 dark:border-slate-900" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-bold text-slate-900 dark:text-white">
              {getAdminName()}
            </p>
            <p className="truncate text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
              {getAdminRole()}
            </p>
          </div>
          <Activity size={14} className="shrink-0 text-cyan-500 dark:text-cyan-400 animate-pulse" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
