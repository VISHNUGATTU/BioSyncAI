import React from 'react';
import useThemeStore from '../store/themeStore';

const Profile = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div>
      <div className="screen-header">
        <h1>Profile</h1>
      </div>
      
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Appearance</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="radio" 
              name="theme" 
              checked={theme === 'light'} 
              onChange={() => setTheme('light')} 
            /> Light
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="radio" 
              name="theme" 
              checked={theme === 'dark'} 
              onChange={() => setTheme('dark')} 
            /> Dark
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="radio" 
              name="theme" 
              checked={theme === 'system'} 
              onChange={() => setTheme('system')} 
            /> System
          </label>
        </div>
      </div>
    </div>
  );
};

export default Profile;
