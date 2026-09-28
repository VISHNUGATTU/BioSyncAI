import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FlaskConical, TestTube2, FileText,
  Stethoscope, CalendarDays, BrainCircuit, AlertTriangle,
  CreditCard, Bell, BarChart3, ShieldCheck, ClipboardList,
  Settings, UserRoundCog, Headset, FileCode2, X, ChevronRight, Activity,
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
      { path: '/users', label: 'Users', icon: Users },
      { path: '/tests', label: 'Lab Tests', icon: FlaskConical },
      { path: '/samples', label: 'Samples', icon: TestTube2 },
      { path: '/assistants', label: 'Lab Assistants', icon: UserRoundCog },
      { path: '/doctors', label: 'Doctors', icon: Stethoscope },
      { path: '/appointments', label: 'Appointments', icon: CalendarDays },
      { path: '/reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { path: '/ai-analytics', label: 'AI Analytics', icon: BrainCircuit, accent: true },
      { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Operations & Support',
    items: [
      { path: '/payments', label: 'Payments', icon: CreditCard },
      { path: '/tickets', label: 'Support', icon: Headset },
      { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
      { path: '/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    title: 'Administration',
    items: [
      { path: '/roles', label: 'Roles & Permissions', icon: ShieldCheck },
      { path: '/audit', label: 'Audit Logs', icon: ClipboardList },
      { path: '/logs', label: 'System Logs', icon: FileCode2 },
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const admin = useAuthStore((state) => state.admin);

  const getInitials = () => {
    const name = admin?.name || admin?.fullName || admin?.username || admin?.email || 'Admin User';
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
        fixed inset-y-0 left-0 z-50 flex w-[280px] -translate-x-full
        flex-col overflow-hidden border-r border-white/60
        bg-white/40 backdrop-blur-2xl shadow-[4px_0_24px_rgba(15,23,42,0.03)]
        transition-transform duration-300 ease-out
        md:relative md:z-20 md:translate-x-0
        ${isOpen ? 'translate-x-0' : ''}
      `}
    >
      {/* Brand */}
      <div className="relative shrink-0 border-b border-white/50 px-6 py-6">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" onClick={handleNavigation} className="flex min-w-0 items-center gap-3">
            <div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-xl border border-cyan-100 bg-white p-2 shadow-sm">
              <img
                src="/images/Logo.png"
                alt="BioSynAI"
                className="h-full w-full object-contain"
              />
            </div>  
            <div className="min-w-0">
              <div className="text-lg font-bold tracking-tight text-slate-900">BioSyncAI</div>
              <div className="mt-0.5 text-[9px] font-bold tracking-[0.2em] text-slate-500">ADMIN CONSOLE</div>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/50 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 md:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* System status */}
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/60 bg-white/50 px-3 py-2.5 shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-bold text-slate-700">System online</span>
          <span className="ml-auto rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-emerald-700">
            LIVE
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-7">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              <div className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={handleNavigation}
                      className={`
                        group relative flex h-11 items-center gap-3
                        rounded-xl px-3 text-sm font-semibold
                        transition-all duration-200
                        ${active ? 'bg-white text-cyan-700 shadow-sm border border-white/80' : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'}
                      `}
                    >
                      <span
                        className={`
                          flex h-8 w-8 shrink-0 items-center justify-center
                          rounded-lg transition-colors
                          ${active ? 'bg-cyan-50 text-cyan-600' : item.accent ? 'bg-violet-50 text-violet-600 group-hover:bg-violet-100' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-cyan-600'}
                        `}
                      >
                        <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                      </span>
                      
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>

                      {item.badge && !active && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-red-400 shadow-sm" />
                      )}

                      {active && (
                        <ChevronRight size={16} strokeWidth={2.5} className="shrink-0 text-cyan-400" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Profile area */}
      <div className="relative shrink-0 border-t border-white/50 bg-white/30 p-4">
        <div className="group flex items-center gap-3 rounded-xl border border-white/60 bg-white/50 px-3 py-3 shadow-sm transition-colors hover:bg-white">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white shadow-md">
            {getInitials()}
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-800">{getAdminName()}</p>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">{getAdminRole()}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;