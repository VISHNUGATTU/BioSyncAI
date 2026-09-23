import { Link, useLocation } from 'react-router-dom';
import { Home, Scan, Activity, Calendar, User } from 'lucide-react';
import './BottomNav.css';

const navItems = [
  { path: '/home', label: 'Home', icon: Home },
  { path: '/scan', label: 'Scan', icon: Scan, isPrimary: true },
  { path: '/health', label: 'Health', icon: Activity },
  { path: '/appointments', label: 'Appointments', icon: Calendar },
  { path: '/profile', label: 'Profile', icon: User },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname.startsWith(item.path);
        
        return (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`nav-item ${isActive ? 'active' : ''} ${item.isPrimary ? 'primary-nav-item' : ''}`}
          >
            <div className="icon-container">
              <Icon size={item.isPrimary ? 28 : 24} />
            </div>
            {!item.isPrimary && <span className="nav-label">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
