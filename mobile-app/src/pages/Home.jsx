import React from 'react';
import { Heart, Droplets, Scale, Zap } from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-screen">
      <header className="screen-header home-header">
        <div>
          <p className="greeting">Good Morning 👋</p>
          <h1>John Doe</h1>
        </div>
        <div className="avatar-small">JD</div>
      </header>

      <div className="section-title">Your Health Today</div>
      
      <div className="vitals-scroll hide-scrollbar">
        <div className="vital-card">
          <div className="vital-icon pulse">
            <Heart size={20} color="#ef4444" />
          </div>
          <div className="vital-info">
            <span className="vital-label">Heart Rate</span>
            <span className="vital-value">72 <small>BPM</small></span>
          </div>
        </div>

        <div className="vital-card">
          <div className="vital-icon bp">
            <Droplets size={20} color="#3b82f6" />
          </div>
          <div className="vital-info">
            <span className="vital-label">Blood Pressure</span>
            <span className="vital-value">120/80</span>
          </div>
        </div>

        <div className="vital-card">
          <div className="vital-icon weight">
            <Scale size={20} color="#10b981" />
          </div>
          <div className="vital-info">
            <span className="vital-label">Weight</span>
            <span className="vital-value">68.4 <small>kg</small></span>
          </div>
        </div>
      </div>

      <div className="insight-card card">
        <div className="insight-header">
          <Zap size={18} color="#f59e0b" fill="#f59e0b" />
          <h3>BioSync AI Insight</h3>
        </div>
        <p className="insight-text">Your recent food pattern shows a slight increase in sodium intake. Consider balancing your next meal with potassium-rich foods.</p>
      </div>
      
      <div className="appointment-card card">
        <div className="apt-date">
          <span className="month">Aug</span>
          <span className="day">28</span>
        </div>
        <div className="apt-info">
          <h4>Home Health Check</h4>
          <p>10:30 AM • Home Address</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
