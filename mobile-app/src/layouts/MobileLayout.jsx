import { Outlet } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const MobileLayout = () => {
  return (
    <div className="mobile-app-container">
      <main className="mobile-content hide-scrollbar">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default MobileLayout;
