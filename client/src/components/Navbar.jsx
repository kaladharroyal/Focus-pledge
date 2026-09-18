import React from 'react';
import { 
  ShieldCheck, 
  Flame, 
  Award, 
  Sparkles, 
  Calendar, 
  Timer, 
  BarChart3, 
  FileCheck2, 
  Settings, 
  Volume2, 
  VolumeX 
} from 'lucide-react';
import { sound } from '../services/sound';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  user, 
  soundEnabled, 
  setSoundEnabled,
  onOpenSettings,
  activeSlot
}) {
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.toggle(next);
    if (next) sound.playClick();
  };

  const streak = user?.currentStreak || 1;
  const credits = user?.totalCredits || 0;
  const level = user?.level || 'Bronze';
  const multiplier = streak >= 30 ? '2.0x' : streak >= 7 ? '1.5x' : streak >= 3 ? '1.2x' : '1.0x';
  const certUnlocked = level !== 'Bronze' || streak >= 21;

  const navItems = [
    { id: 'home', label: 'Check-In', icon: Sparkles },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { 
      id: 'focus', 
      label: activeSlot ? 'Focusing' : 'Focus', 
      icon: Timer,
      badge: activeSlot ? 'LIVE' : null 
    },
    { id: 'dashboard', label: 'Stats', icon: BarChart3 },
    { 
      id: 'certificate', 
      label: 'Certificate', 
      icon: FileCheck2,
      badge: certUnlocked ? 'UNLOCKED' : null 
    }
  ];

  return (
    <header className="navbar-root">
      <div className="navbar-inner">
        
        {/* Brand */}
        <div 
          onClick={() => { setCurrentTab('home'); sound.playClick(); }}
          className="brand-logo"
        >
          <div className="brand-icon-box">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="brand-title">Focus<span>Pledge</span></h1>
          </div>
        </div>

        {/* Tab switcher */}
        <nav className="nav-tab-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  sound.playClick();
                }}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`nav-pill-badge ${item.badge.toLowerCase()}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Status */}
        <div className="navbar-actions">
          
          <div className="status-badge streak" title="Current Daily Streak">
            <Flame size={15} color="#f59e0b" />
            <span>Day {streak}</span>
            <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>({multiplier})</span>
          </div>

          <div className="status-badge credits" title="Productivity Credits">
            <Award size={15} color="#818cf8" />
            <span>{credits} pts</span>
            <span style={{ textTransform: 'uppercase', fontSize: '0.68rem', opacity: 0.85 }}>{level}</span>
          </div>

          <button
            onClick={toggleSound}
            className="icon-btn"
            title={soundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            onClick={onOpenSettings}
            className="icon-btn"
            title="Settings & Simulation"
          >
            <Settings size={16} />
          </button>
        </div>

      </div>
    </header>
  );
}
