import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import useAuthStore from '../store/authStore';

const AdminLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const toggleSidebar = () => {
    setMobileOpen((current) => !current);
  };

  const closeSidebar = () => {
    setMobileOpen(false);
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#f4f7fc] text-slate-900">
      
      {/* Ambient Background Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[50vh] w-[50vw] rounded-full bg-cyan-200/50 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] h-[50vh] w-[50vw] rounded-full bg-blue-200/40 blur-[120px]" />
        
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15, 23, 42, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={mobileOpen} onClose={closeSidebar} />

      {/* Main application area */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        
        {/* Header */}
        <Header onMenuClick={toggleSidebar} />

        {/* Page content */}
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;