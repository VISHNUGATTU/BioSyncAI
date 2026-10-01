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
    <div className="relative flex h-screen w-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[15%] -top-[15%] h-[55vh] w-[55vw] rounded-full bg-cyan-200/30 blur-[140px]" />
        <div className="absolute -bottom-[15%] -right-[10%] h-[45vh] w-[45vw] rounded-full bg-blue-200/25 blur-[120px]" />
        <div className="absolute left-[30%] top-[40%] h-[30vh] w-[30vw] rounded-full bg-violet-100/20 blur-[100px]" />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/15 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main area */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileOpen((v) => !v)} />

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;