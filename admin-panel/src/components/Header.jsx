import {
  Moon,
  Sun,
  Monitor,
  Search,
  Bell,
  Menu,
  ChevronDown,
  Command,
  LogOut,
} from 'lucide-react';

import useThemeStore from '../store/themeStore';
import useAuthStore from '../store/authStore';

const Header = ({ onMenuClick }) => {
  const { theme, setTheme } = useThemeStore();

  const admin = useAuthStore((state) => state.admin);
  const logout = useAuthStore((state) => state.logout);

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

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="relative z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-xl dark:border-slate-800/70 dark:bg-[#020817]/80 sm:px-6 lg:px-8">

      {/* Left */}
      <div className="flex min-w-0 items-center gap-3">

        {/* Mobile menu */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white md:hidden"
        >
          <Menu size={19} />
        </button>

        {/* Search */}
        <div className="group relative hidden w-[280px] md:block lg:w-[360px]">

          <Search
            size={17}
            strokeWidth={1.8}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-500 dark:text-slate-600 dark:group-focus-within:text-cyan-400"
          />

          <input
            type="search"
            placeholder="Search anything..."
            aria-label="Search"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-20 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400/60 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.07] dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:border-cyan-500/40 dark:focus:bg-slate-900"
          />

          <div className="pointer-events-none absolute right-2.5 top-1/2 hidden h-6 -translate-y-1/2 items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 text-[10px] font-medium text-slate-400 shadow-sm sm:flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
            <Command size={10} />
            <span>K</span>
          </div>
        </div>

        {/* Mobile title */}
        <div className="md:hidden">
          <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
            BioSync
          </p>
          <p className="text-[9px] font-semibold tracking-[0.18em] text-slate-400 dark:text-slate-600">
            ADMIN
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Theme switcher */}
        <div className="hidden items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900/70 sm:flex">

          <button
            type="button"
            onClick={() => setTheme('light')}
            title="Light mode"
            aria-label="Light mode"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              theme === 'light'
                ? 'bg-white text-amber-500 shadow-sm dark:bg-slate-800'
                : 'text-slate-400 hover:text-slate-700 dark:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Sun size={14} />
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            title="Dark mode"
            aria-label="Dark mode"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              theme === 'dark'
                ? 'bg-white text-cyan-500 shadow-sm dark:bg-slate-800 dark:text-cyan-400'
                : 'text-slate-400 hover:text-slate-700 dark:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Moon size={14} />
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            title="System theme"
            aria-label="System theme"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              theme === 'system'
                ? 'bg-white text-blue-500 shadow-sm dark:bg-slate-800 dark:text-blue-400'
                : 'text-slate-400 hover:text-slate-700 dark:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Monitor size={14} />
          </button>
        </div>

        {/* Divider */}
        <div className="hidden h-7 w-px bg-slate-200 dark:bg-slate-800 sm:block" />

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-slate-900 dark:hover:text-white"
        >
          <Bell size={18} strokeWidth={1.9} />

          <span className="absolute right-[9px] top-[8px] h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        </button>

        <div className="hidden h-7 w-px bg-slate-200 dark:bg-slate-800 sm:block" />

        {/* User */}
        <div className="group flex cursor-pointer items-center gap-2 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900">

          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white shadow-[0_4px_14px_rgba(14,165,233,0.2)]">
            {getInitials()}

            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400 dark:border-[#020817]" />
          </div>

          <div className="hidden min-w-0 flex-col lg:flex">
            <span className="max-w-[130px] truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
              {getAdminName()}
            </span>

            <span className="max-w-[130px] truncate text-[10px] font-medium text-slate-400 dark:text-slate-600">
              {getAdminRole()}
            </span>
          </div>

          <ChevronDown
            size={14}
            className="hidden text-slate-400 transition-transform group-hover:text-slate-600 dark:text-slate-600 dark:group-hover:text-slate-400 lg:block"
          />
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

export default Header;