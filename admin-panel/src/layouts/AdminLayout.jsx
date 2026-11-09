import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import useAuthStore from '../store/authStore';

const AdminLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#f1f5f9] text-slate-900 transition-colors duration-300 dark:bg-[#030712] dark:text-slate-100">

      {/* Ambient glow orbs (adaptive for Alabaster Light & Obsidian Dark) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[12%] -top-[15%] h-[55vh] w-[55vw] rounded-full bg-cyan-300/25 blur-[140px] dark:bg-cyan-500/10" />
        <div className="absolute -bottom-[15%] -right-[10%] h-[50vh] w-[50vw] rounded-full bg-blue-300/20 blur-[130px] dark:bg-indigo-500/10" />
        <div className="absolute left-[32%] top-[38%] h-[32vh] w-[32vw] rounded-full bg-violet-200/20 blur-[110px] dark:bg-violet-500/8" />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity md:hidden"
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main area */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileOpen((v) => !v)} />

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
