import { Search, Bell, Menu, ChevronDown, Command, LogOut, Settings as SettingsIcon } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Searchable routes knowledge base
const searchablePages = [
  { title: 'Dashboard', path: '/dashboard', description: 'Overview and main metrics' },
  { title: 'Users', path: '/users', description: 'Manage patients and registered users' },
  { title: 'Lab Tests', path: '/tests', description: 'View and manage laboratory tests' },
  { title: 'Samples', path: '/samples', description: 'Track biological samples' },
  { title: 'Lab Assistants', path: '/assistants', description: 'Manage laboratory staff' },
  { title: 'Doctors', path: '/doctors', description: 'Manage medical professionals' },
  { title: 'Appointments', path: '/appointments', description: 'View and manage patient appointments' },
  { title: 'Reports', path: '/reports', description: 'View clinical and system reports' },
  { title: 'AI Analytics', path: '/ai-analytics', description: 'Advanced AI insights and predictions' },
  { title: 'Analytics', path: '/analytics', description: 'Standard platform analytics and charts' },
  { title: 'Payments', path: '/payments', description: 'Billing and transaction history' },
  { title: 'Support Tickets', path: '/tickets', description: 'Manage helpdesk and support requests' },
  { title: 'Alerts', path: '/alerts', description: 'System and operational alerts' },
  { title: 'Notifications', path: '/notifications', description: 'Broadcast messages and push notifications' },
  { title: 'Roles & Permissions', path: '/roles', description: 'Manage access control' },
  { title: 'Audit Logs', path: '/audit', description: 'Review system activity and audit trails' },
  { title: 'System Logs', path: '/logs', description: 'Technical system and error logs' },
  { title: 'Settings', path: '/settings', description: 'Platform configuration' }
];

const Header = ({ onMenuClick }) => {
  const admin = useAuthStore((state) => state.admin);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [hasUnread, setHasUnread] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const searchRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredPages = searchablePages.filter(page => 
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    page.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && filteredPages.length > 0) {
      // Navigate to the first matching result
      handleNavigate(filteredPages[0].path);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
    setSearchQuery('');
    setIsSearchFocused(false);
    searchRef.current?.blur();
  };

  const getAdminName = () => {
    return admin?.name || admin?.fullName || admin?.username || 'Administrator';
  };

  const getAdminRole = () => {
    return admin?.role || 'Super Admin';
  };

  const getInitials = () => {
    const name = admin?.name || admin?.fullName || admin?.username || admin?.email || 'Admin User';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="relative z-30 flex h-[76px] shrink-0 items-center justify-between border-b border-white/60 bg-white/40 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      
      {/* Left */}
      <div className="flex min-w-0 items-center gap-4">
        
        {/* Mobile menu */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/60 bg-white/50 text-slate-600 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:text-slate-900 md:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Search */}
        <form 
          onSubmit={handleSearchSubmit} 
          className="group relative hidden w-[280px] md:block lg:w-[380px]"
        >
          <Search
            size={18}
            strokeWidth={2}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-600"
          />
          <input
            ref={searchRef}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            placeholder="Search pages and settings..."
            aria-label="Search"
            className="h-11 w-full rounded-xl border border-white/60 bg-white/50 pl-11 pr-14 text-sm font-medium text-slate-900 shadow-sm outline-none backdrop-blur-md transition-all placeholder:text-slate-400 hover:bg-white/80 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 hidden h-6 -translate-y-1/2 items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 text-[10px] font-bold text-slate-400 shadow-sm sm:flex">
            <Command size={12} />
            <span>K</span>
          </div>

          {/* Search Dropdown preview */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 top-[115%] w-full overflow-hidden rounded-xl border border-white/60 bg-white/95 shadow-xl backdrop-blur-xl">
              {filteredPages.length > 0 ? (
                <div className="max-h-80 overflow-y-auto p-2">
                  <div className="mb-2 px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pages & Settings
                  </div>
                  {filteredPages.map((page) => (
                    <button
                      key={page.path}
                      type="button"
                      onClick={() => handleNavigate(page.path)}
                      className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition-colors hover:bg-cyan-50"
                    >
                      <span className="text-sm font-bold text-slate-800">{page.title}</span>
                      <span className="text-xs text-slate-500">{page.description}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-6 text-center text-sm font-medium text-slate-500">
                  No results found for <span className="font-bold text-slate-900">"{searchQuery}"</span>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Mobile title */}
        <div className="md:hidden">
          <p className="text-base font-bold tracking-tight text-slate-900">BioSync</p>
          <p className="text-[9px] font-bold tracking-[0.2em] text-slate-500">ADMIN</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* Notifications */}
        <button
          type="button"
          onClick={() => {
            setHasUnread(false);
            navigate('/notifications');
          }}
          aria-label="Notifications"
          className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/60 bg-white/50 text-slate-500 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:text-cyan-600"
        >
          <Bell size={20} strokeWidth={2} />
          {hasUnread && (
            <span className="absolute right-[11px] top-[11px] h-2 w-2 rounded-full border border-white bg-red-500" />
          )}
        </button>

        <div className="hidden h-8 w-px bg-slate-200/60 sm:block" />

        {/* User Dropdown */}
        <div className="relative">
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="group flex cursor-pointer items-center gap-3 rounded-xl border border-transparent p-1.5 transition-colors hover:border-white/60 hover:bg-white/40"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white shadow-md">
              {getInitials()}
              <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
            </div>

            <div className="hidden min-w-0 flex-col lg:flex">
              <span className="max-w-[140px] truncate text-sm font-bold text-slate-800">
                {getAdminName()}
              </span>
              <span className="max-w-[140px] truncate text-[11px] font-semibold text-slate-500">
                {getAdminRole()}
              </span>
            </div>

            <ChevronDown
              size={16}
              className={`hidden text-slate-400 transition-transform lg:block ${isProfileOpen ? 'rotate-180' : 'group-hover:text-slate-600'}`}
            />
          </div>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 top-[110%] w-56 rounded-xl border border-white/60 bg-white/80 p-2 shadow-lg backdrop-blur-xl">
              <div className="mb-2 border-b border-slate-100/50 px-3 pb-3 pt-2">
                <p className="text-sm font-bold text-slate-800">{getAdminName()}</p>
                <p className="text-xs font-medium text-slate-500">{admin?.email || 'admin@biosync.ai'}</p>
              </div>
              <button 
                onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-white hover:text-cyan-600"
              >
                <SettingsIcon size={16} />
                Settings
              </button>
              <button 
                onClick={() => { setIsProfileOpen(false); logout(); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;