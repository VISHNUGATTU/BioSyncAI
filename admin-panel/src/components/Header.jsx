import { Search, Bell, Menu, ChevronDown, Command, LogOut, Settings as SettingsIcon } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const searchablePages = [
  { title: 'Dashboard',         path: '/dashboard',    description: 'Overview and main metrics' },
  { title: 'Users',             path: '/users',        description: 'Manage patients and registered users' },
  { title: 'Lab Tests',         path: '/tests',        description: 'View and manage laboratory tests' },
  { title: 'Samples',           path: '/samples',      description: 'Track biological samples' },
  { title: 'Lab Assistants',    path: '/assistants',   description: 'Manage laboratory staff' },
  { title: 'Doctors',           path: '/doctors',      description: 'Manage medical professionals' },
  { title: 'Appointments',      path: '/appointments', description: 'View and manage patient appointments' },
  { title: 'Reports',           path: '/reports',      description: 'View clinical and system reports' },
  { title: 'AI Analytics',      path: '/ai-analytics', description: 'Advanced AI insights and predictions' },
  { title: 'Analytics',         path: '/analytics',    description: 'Standard platform analytics' },
  { title: 'Payments',          path: '/payments',     description: 'Billing and transaction history' },
  { title: 'Support Tickets',   path: '/tickets',      description: 'Manage helpdesk and support requests' },
  { title: 'Alerts',            path: '/alerts',       description: 'System and operational alerts' },
  { title: 'Notifications',     path: '/notifications', description: 'Broadcast messages and push notifications' },
  { title: 'Roles & Permissions', path: '/roles',      description: 'Manage access control' },
  { title: 'Audit Logs',        path: '/audit',        description: 'Review system activity' },
  { title: 'System Logs',       path: '/logs',         description: 'Technical system and error logs' },
  { title: 'Settings',          path: '/settings',     description: 'Platform configuration' },
];

const Header = ({ onMenuClick }) => {
  const admin     = useAuthStore((state) => state.admin);
  const logout    = useAuthStore((state) => state.logout);
  const navigate  = useNavigate();

  const [isProfileOpen,   setIsProfileOpen]   = useState(false);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchRef = useRef(null);
  const profileRef = useRef(null);

  /* Cmd+K focus */
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
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

  const filteredPages = searchablePages.filter((page) =>
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

  const getAdminName    = () => admin?.name || admin?.fullName || admin?.username || 'Administrator';
  const getAdminRole    = () => admin?.role || 'Super Admin';
  const getInitials     = () => {
    const name  = admin?.name || admin?.fullName || admin?.username || admin?.email || 'Admin';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="relative z-30 flex h-[68px] shrink-0 items-center justify-between
      border-b border-white/50 bg-white/50 px-4 backdrop-blur-xl sm:px-6">

      {/* ── Left ── */}
      <div className="flex min-w-0 items-center gap-3">

        {/* Mobile burger */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/60
            bg-white/50 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900 md:hidden"
        >
          <Menu size={18} />
        </button>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="group relative hidden w-64 md:block lg:w-[340px]">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400
              transition-colors group-focus-within:text-cyan-600"
          />
          <input
            ref={searchRef}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 180)}
            placeholder="Search pages…"
            aria-label="Search"
            className="h-10 w-full rounded-xl border border-white/60 bg-white/50 pl-10 pr-12
              text-[13px] font-medium text-slate-900 shadow-sm outline-none backdrop-blur-md
              transition-all placeholder:text-slate-400
              hover:bg-white/75 focus:border-cyan-400/60 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 hidden h-5.5 -translate-y-1/2
            items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 px-1.5
            text-[10px] font-bold text-slate-400 shadow-sm sm:flex">
            <Command size={11} /><span>K</span>
          </div>

          {/* Search dropdown */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 top-[calc(100%+6px)] w-full overflow-hidden rounded-xl
              border border-white/70 bg-white/96 shadow-xl backdrop-blur-xl">
              {filteredPages.length > 0 ? (
                <div className="max-h-72 overflow-y-auto p-1.5">
                  <p className="mb-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pages
                  </p>
                  {filteredPages.map((page) => (
                    <button
                      key={page.path}
                      type="button"
                      onClick={() => handleNavigate(page.path)}
                      className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-cyan-50"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800">{page.title}</p>
                        <p className="text-[11px] text-slate-500">{page.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-5 text-center text-[13px] font-medium text-slate-500">
                  No results for <span className="font-semibold text-slate-800">"{searchQuery}"</span>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Mobile title */}
        <div className="md:hidden">
          <p className="text-[15px] font-bold tracking-tight text-slate-900">BioSync</p>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Admin</p>
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-2">

        {/* Notifications */}
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/60
            bg-white/50 text-slate-500 shadow-sm transition hover:bg-white hover:text-cyan-600"
        >
          <Bell size={17} strokeWidth={2} />
        </button>

        <div className="hidden h-6 w-px bg-slate-200/60 sm:block" />

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((v) => !v)}
            className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-transparent p-1.5
              transition-all hover:border-white/60 hover:bg-white/40"
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl
              bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white shadow">
              {getInitials()}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
            </div>
            <div className="hidden min-w-0 flex-col lg:flex">
              <span className="max-w-[120px] truncate text-[13px] font-semibold text-slate-800">
                {getAdminName()}
              </span>
              <span className="max-w-[120px] truncate text-[11px] font-medium text-slate-500">
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
            <div className="absolute right-0 top-[calc(100%+6px)] w-52 rounded-xl
              border border-white/60 bg-white/90 p-1.5 shadow-lg backdrop-blur-xl">
              <div className="mb-1.5 border-b border-slate-100 px-3 pb-2.5 pt-2">
                <p className="text-[13px] font-semibold text-slate-800">{getAdminName()}</p>
                <p className="text-[11px] text-slate-500">{admin?.email || 'admin@biosync.ai'}</p>
              </div>
              <button
                onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium
                  text-slate-600 transition-colors hover:bg-slate-50 hover:text-cyan-600"
              >
                <SettingsIcon size={14} /> Settings
              </button>
              <button
                onClick={() => { setIsProfileOpen(false); logout(); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium
                  text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;