import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  Command,
  LogOut,
  Settings as SettingsIcon,
  Sun,
  Moon,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const searchablePages = [
  { title: 'Dashboard',             path: '/dashboard',             description: 'Live command center and real-time KPIs' },
  { title: 'Users',                 path: '/users',                 description: 'Manage patients and registered users' },
  { title: 'Lab Tests',             path: '/tests',                 description: 'View and manage diagnostic test catalog' },
  { title: 'Samples',               path: '/samples',               description: 'Track biological specimens and barcodes' },
  { title: 'Lab Assistants',        path: '/assistants',            description: 'Manage field phlebotomists and staff' },
  { title: 'Doctors',               path: '/doctors',               description: 'Manage medical professionals & specialists' },
  { title: 'Appointments',          path: '/appointments',          description: '8-stage home collection & teleconsult queue' },
  { title: 'Reports',               path: '/reports',               description: 'View clinical and verified NABL reports' },
  { title: 'Kitchen KDS (Tickets)', path: '/kitchen-kds',           description: 'Biometric kitchen dispatch & 3-phase labels' },
  { title: 'Clinical Nutrition',    path: '/clinical-surveillance', description: 'Postprandial glucose & pharmacovigilance audit' },
  { title: 'AI Analytics',          path: '/ai-analytics',          description: 'Advanced AI inference telemetry and models' },
  { title: 'Analytics',             path: '/analytics',             description: 'Revenue trajectory and platform analytics' },
  { title: 'Payments',              path: '/payments',              description: 'Billing, settlements, and transaction history' },
  { title: 'Support Tickets',       path: '/tickets',               description: 'Manage helpdesk and patient support requests' },
  { title: 'Alerts',                path: '/alerts',                description: 'Critical biometric and operational alerts' },
  { title: 'Notifications',         path: '/notifications',         description: 'Broadcast messages and push notifications' },
  { title: 'Roles & Permissions',   path: '/roles',                 description: 'Manage RBAC and administrator access control' },
  { title: 'Audit Logs',            path: '/audit',                 description: 'Immutable cryptographic activity ledger' },
  { title: 'Error Monitoring',      path: '/error-monitoring',      description: 'SRE incident queue and stack trace inspector' },
  { title: 'System Logs',           path: '/logs',                  description: 'Technical system and microservice logs' },
  { title: 'Settings',              path: '/settings',              description: 'Platform and administrator configuration' },
];

const Header = ({ onMenuClick }) => {
  const admin       = useAuthStore((state) => state.admin);
  const logout      = useAuthStore((state) => state.logout);
  const activeTheme = useThemeStore((state) => state.activeTheme);
  const setTheme    = useThemeStore((state) => state.setTheme);
  const navigate    = useNavigate();

  const [isProfileOpen,   setIsProfileOpen]   = useState(false);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchRef  = useRef(null);
  const profileRef = useRef(null);

  /* Cmd+K focus */
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* Close profile on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isProfileOpen]);

  const filteredPages = searchablePages.filter(
    (page) =>
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNavigate = (path) => {
    navigate(path);
    setSearchQuery('');
    setIsSearchFocused(false);
    searchRef.current?.blur();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && filteredPages.length > 0) handleNavigate(filteredPages[0].path);
  };

  const toggleTheme = () => {
    setTheme(activeTheme === 'dark' ? 'light' : 'dark');
  };

  const getAdminName = () => admin?.name || admin?.fullName || admin?.username || 'Administrator';
  const getAdminRole = () => admin?.role || 'Super Admin';
  const getInitials  = () => {
    const name  = admin?.name || admin?.fullName || admin?.username || admin?.email || 'Admin';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header
      className="relative z-30 flex h-[66px] shrink-0 items-center justify-between
        border-b border-slate-200/80 bg-white/75 px-4 backdrop-blur-2xl transition-colors duration-200
        dark:border-slate-800/80 dark:bg-slate-900/80 sm:px-6"
    >
      {/* ── Left: Burger + Search ── */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile burger */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80
            bg-white text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900
            dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white md:hidden"
        >
          <Menu size={18} />
        </button>

        {/* Global Command Search */}
        <form onSubmit={handleSearchSubmit} className="group relative hidden w-64 md:block lg:w-[380px]">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400
              transition-colors group-focus-within:text-cyan-500 dark:text-slate-500"
          />
          <input
            ref={searchRef}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 180)}
            placeholder="Jump to module, telemetry, or KDS…"
            aria-label="Search"
            className="h-9.5 w-full rounded-xl border border-slate-200/80 bg-slate-100/75 pl-9.5 pr-14
              text-[12.5px] font-medium text-slate-900 shadow-2xs outline-none
              transition-all placeholder:text-slate-400
              hover:border-slate-300/80 hover:bg-white
              focus:border-cyan-500/60 focus:bg-white focus:ring-4 focus:ring-cyan-500/10
              dark:border-slate-800 dark:bg-slate-950/65 dark:text-slate-100 dark:placeholder:text-slate-500
              dark:hover:border-slate-700 dark:hover:bg-slate-950
              dark:focus:border-cyan-400/60 dark:focus:bg-slate-950 dark:focus:ring-cyan-400/10"
          />
          <div
            className="pointer-events-none absolute right-2.5 top-1/2 hidden h-5 -translate-y-1/2
              items-center gap-0.5 rounded-md border border-slate-200/90 bg-white px-1.5
              font-mono text-[10px] font-bold text-slate-400 shadow-2xs
              dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 sm:flex"
          >
            <Command size={10} />
            <span>K</span>
          </div>

          {/* Search dropdown */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div
              className="absolute left-0 top-[calc(100%+8px)] w-full overflow-hidden rounded-2xl
                border border-slate-200/90 bg-white/95 shadow-2xl backdrop-blur-2xl
                dark:border-slate-700/80 dark:bg-slate-900/95"
            >
              {filteredPages.length > 0 ? (
                <div className="max-h-80 overflow-y-auto p-1.5">
                  <p className="mb-1 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Console Modules ({filteredPages.length})
                  </p>
                  {filteredPages.map((page) => (
                    <button
                      key={page.path}
                      type="button"
                      onClick={() => handleNavigate(page.path)}
                      className="group/item flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition-colors
                        hover:bg-cyan-500/10 dark:hover:bg-cyan-400/10"
                    >
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-bold text-slate-800 group-hover/item:text-cyan-600 dark:text-slate-100 dark:group-hover/item:text-cyan-400">
                          {page.title}
                        </p>
                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {page.description}
                        </p>
                      </div>
                      <ArrowUpRight
                        size={14}
                        className="shrink-0 text-slate-300 transition-transform group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 group-hover/item:text-cyan-500 dark:text-slate-600"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-[12.5px] font-medium text-slate-500 dark:text-slate-400">
                  No modules matching <span className="font-bold text-slate-800 dark:text-white">"{searchQuery}"</span>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Mobile title */}
        <div className="md:hidden">
          <p className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">
            BioSync<span className="text-cyan-600 dark:text-cyan-400">AI</span>
          </p>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Admin</p>
        </div>
      </div>

      {/* ── Right: Security Pill + Theme Toggle + Notifications + Profile ── */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Clinical HIPAA/NABH Compliance Badge */}
        <div className="hidden items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/70 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 xl:flex">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>NABH · ABDM M3</span>
        </div>

        {/* 1-Click Theme Switcher (Light / Dark) */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          title={activeTheme === 'dark' ? 'Switch to Alabaster Light mode' : 'Switch to Obsidian Dark mode'}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80
            bg-white text-slate-600 shadow-2xs transition-all hover:border-cyan-500/40 hover:text-cyan-600
            dark:border-slate-800 dark:bg-slate-800/80 dark:text-amber-300 dark:hover:border-amber-400/40 dark:hover:text-amber-200"
        >
          {activeTheme === 'dark' ? <Sun size={16} strokeWidth={2.2} /> : <Moon size={16} strokeWidth={2.2} />}
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80
            bg-white text-slate-600 shadow-2xs transition-all hover:border-cyan-500/40 hover:text-cyan-600
            dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-cyan-400/40 dark:hover:text-cyan-400"
        >
          <Bell size={16} strokeWidth={2} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-500 ring-2 ring-white dark:ring-slate-900" />
        </button>

        <div className="hidden h-5 w-px bg-slate-200 dark:bg-slate-800 sm:block" />

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((v) => !v)}
            className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-transparent p-1
              transition-all hover:border-slate-200/80 hover:bg-slate-100/70
              dark:hover:border-slate-800 dark:hover:bg-slate-800/60"
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl
              bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-extrabold text-white shadow-sm shadow-cyan-500/20">
              {getInitials()}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400 dark:border-slate-900" />
            </div>
            <div className="hidden min-w-0 flex-col text-left lg:flex">
              <span className="max-w-[128px] truncate text-[12.5px] font-bold text-slate-900 dark:text-white">
                {getAdminName()}
              </span>
              <span className="max-w-[128px] truncate text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
                {getAdminRole()}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`hidden text-slate-400 transition-transform lg:block ${isProfileOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown */}
          {isProfileOpen && (
            <div
              className="absolute right-0 top-[calc(100%+8px)] w-56 rounded-2xl
                border border-slate-200/90 bg-white/95 p-1.5 shadow-2xl backdrop-blur-2xl
                dark:border-slate-700/80 dark:bg-slate-900/95"
            >
              <div className="mb-1.5 border-b border-slate-100 px-3 pb-2.5 pt-2 dark:border-slate-800">
                <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white">{getAdminName()}</p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {admin?.email || 'admin@biosync.ai'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/settings');
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold
                  text-slate-600 transition-colors hover:bg-slate-100 hover:text-cyan-600
                  dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-400"
              >
                <SettingsIcon size={14} /> Account Settings
              </button>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold
                  text-rose-600 transition-colors hover:bg-rose-500/10
                  dark:text-rose-400 dark:hover:bg-rose-500/15"
              >
                <LogOut size={14} /> Sign Out of Console
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
