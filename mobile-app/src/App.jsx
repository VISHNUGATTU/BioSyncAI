import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useThemeStore from './store/themeStore';

// Layouts
import MobileLayout from './layouts/MobileLayout';

// Pages
import Home from './pages/Home';
import Scan from './pages/Scan';
import Health from './pages/Health';
import Profile from './pages/Profile';

import './App.css';

function App() {
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MobileLayout />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="scan" element={<Scan />} />
          <Route path="health" element={<Health />} />
          <Route path="appointments" element={<div className="screen-header"><h1>Appointments</h1></div>} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
