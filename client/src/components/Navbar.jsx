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
  VolumeX,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { sound } from '../services/sound';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  user, 
  soundEnabled, 
  setSoundEnabled,
  onOpenSettings,
  onLogout,
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
  const rankLabel = level === 'Gold' ? 'Hatamoto 旗本' : level === 'Silver' ? 'Bushi 武士' : 'Ronin 浪人';
  const multiplier = streak >= 30 ? '2.0x' : streak >= 7 ? '1.5x' : streak >= 3 ? '1.2x' : '1.0x';
  const certUnlocked = level !== 'Bronze' || streak >= 21;

  // Extract initials
  const initials = (user?.name || 'User')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const navItems = [
    { id: 'home', label: 'Check-In', kanji: '儀礼', icon: Sparkles },
    { id: 'schedule', label: 'Schedule', kanji: '計画', icon: Calendar },
    { 
      id: 'focus', 
      label: activeSlot ? 'Focusing' : 'Focus', 
      kanji: '集中',
      icon: Timer,
      badge: activeSlot ? 'LIVE' : null 
    },
    { id: 'dashboard', label: 'Stats', kanji: '記録', icon: BarChart3 },
    { 
      id: 'certificate', 
      label: 'Certificate', 
      kanji: '免状',
      icon: FileCheck2,
      badge: certUnlocked ? 'UNLOCKED' : null 
    }
  ];

  return (
    <>
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

          {/* Desktop Tab switcher (hidden on mobile / small screens) */}
          <nav className="nav-tab-list desktop-nav-tabs">
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
                  <Icon size={15} />
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

          {/* Right Status & Account */}
          <div className="navbar-actions">
            
            <div className="status-badge streak" title="Current Daily Discipline Streak">
              <Flame size={14} color="#f59e0b" />
              <span className="badge-text-full">Day {streak}</span>
              <span className="badge-text-short">{streak}d</span>
              <span className="badge-multiplier">({multiplier})</span>
            </div>

            <div className="status-badge credits" title={`Honor Credits: ${credits} • Rank: ${rankLabel}`}>
              <Award size={14} color="#fb7185" />
              <span className="badge-text-full">{credits} pts</span>
              <span className="badge-text-short">{credits}p</span>
              <span className="badge-rank-tag">{level}</span>
            </div>

            <button
              onClick={toggleSound}
              className="icon-btn"
              title={soundEnabled ? 'Mute sound' : 'Enable sound'}
              aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>

            <button
              onClick={onOpenSettings}
              className="icon-btn"
              title="Settings & Simulation"
              aria-label="Settings & Simulation"
            >
              <Settings size={15} />
            </button>

            {/* User Profile Pill & Logout */}
            {user && (
              <div className="user-profile-badge" title={`Signed in as ${user.name} (${user.email})`}>
                <div className="user-avatar-initials">
                  {initials}
                </div>
                <span className="user-nav-name">{user.name.split(' ')[0]}</span>
                <button
                  onClick={onLogout}
                  className="user-logout-btn"
                  title="Log out of account"
                  aria-label="Log out"
                >
                  <LogOut size={13} />
                </button>
              </div>
            )}

          </div>

        </div>
      </header>

      {/* Mobile Bottom Dock Navigation (visible on mobile / small tablet) */}
      <nav className="mobile-bottom-dock" aria-label="Mobile Navigation">
        <div className="mobile-dock-inner">
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
                className={`mobile-dock-btn ${isActive ? 'active' : ''}`}
                aria-label={item.label}
              >
                <div className="mobile-dock-icon-wrap">
                  <Icon size={18} />
                  {item.badge && (
                    <span className={`mobile-dock-dot ${item.badge.toLowerCase()}`} />
                  )}
                </div>
                <span className="mobile-dock-label">{item.label}</span>
                {isActive && <div className="mobile-dock-indicator" />}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
