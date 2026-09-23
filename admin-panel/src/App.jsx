import { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import useThemeStore from './store/themeStore';

// Layout
import AdminLayout from './layouts/AdminLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import LabTests from './pages/LabTests';
import Samples from './pages/Samples';
import LabAssistants from './pages/LabAssistants';
import Tickets from './pages/Tickets';
import SystemLogs from './pages/SystemLogs';
import Settings from './pages/Settings';
import Login from './pages/Login';
import AIAnalytics from './pages/AIAnalytics';
import Alerts from './pages/Alerts';
import Payments from './pages/Payments';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Roles from './pages/Roles';
import AuditLogs from './pages/AuditLogs';

function App() {
   const initTheme = useThemeStore((state) => state.initTheme);
  const syncSystemTheme = useThemeStore((state) => state.syncSystemTheme);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    if (theme !== 'system') {
      return;
    }

    const mediaQuery = window.matchMedia(
      '(prefers-color-scheme: dark)'
    );

    const handleChange = () => {
      syncSystemTheme();
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, syncSystemTheme]);

  return (
    <Router>
      <Routes>
        {/* Authentication */}
        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route path="/" element={<AdminLayout />}>
          <Route
            index
            element={<Navigate to="/dashboard" replace />}
          />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="tests" element={<LabTests />} />
          <Route path="samples" element={<Samples />} />
          <Route path="assistants" element={<LabAssistants />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="reports" element={<Reports />} />

          <Route path="ai-analytics" element={<AIAnalytics />} />
          <Route path="analytics" element={<Analytics />} />

          <Route path="payments" element={<Payments />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="notifications" element={<Notifications />} />

          <Route path="roles" element={<Roles />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="logs" element={<SystemLogs />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;