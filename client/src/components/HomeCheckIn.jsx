import React, { useState } from 'react';
import { 
  Home, 
  Sparkles, 
  Flame, 
  Award, 
  CalendarCheck, 
  ArrowRight, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  Zap,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../services/sound';

export default function HomeCheckIn({ 
  user, 
  schedule, 
  onCheckIn, 
  onNavigate, 
  onStartFocus 
}) {
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInMsg, setCheckInMsg] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const isAlreadyCheckedIn = user?.lastCheckInDate === todayStr;

  const handleCheckInClick = async () => {
    try {
      setCheckingIn(true);
      sound.playCheckin();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });

      const res = await onCheckIn();
      setCheckInMsg(res?.message || '🔥 Checked in for today! Evening pledge activated.');
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingIn(false);
    }
  };

  const streak = user?.currentStreak || 1;
  const credits = user?.totalCredits || 0;
  const level = user?.level || 'Bronze';
  const slots = schedule?.slots || [];
  const completedSlots = slots.filter(s => s.status === 'completed').length;
  const multiplier = streak >= 30 ? 2.0 : streak >= 7 ? 1.5 : streak >= 3 ? 1.2 : 1.0;

  return (
    <div className="page-wrapper">
      
      {/* Hero Banner */}
      <div className="hero-card">
        <div className="hero-pill">
          <Sparkles size={14} />
          Evening Focus & Habit Protocol
        </div>

        <h2 className="hero-title">
          Stop mindless scrolling.<br />
          <span style={{ background: 'linear-gradient(135deg, #a5b4fc, #6366f1, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Pledge your evening schedule.
          </span>
        </h2>

        <p className="hero-subtitle">
          Check in as soon as you get home, plan focused study blocks, guard against distracting apps, and level up to earn your verified Certificate.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleCheckInClick}
            disabled={checkingIn}
            className={`btn-checkin-large ${isAlreadyCheckedIn ? 'checked' : ''}`}
          >
            <Home size={22} />
            <span>{isAlreadyCheckedIn ? 'Checked In Today ✓' : "I'm Home — Start Pledge"}</span>
          </button>

          {checkInMsg && (
            <p style={{ color: '#34d399', fontSize: '0.88rem', fontWeight: 600 }}>
              {checkInMsg}
            </p>
          )}
        </div>
      </div>

      {/* 3 Stats Overview */}
      <div className="stats-grid-3">
        
        <div className="stat-box">
          <div className="stat-box-header">
            <span>Daily Streak</span>
            <Flame size={16} color="#f59e0b" />
          </div>
          <div className="stat-box-value">
            {streak} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>Days</span>
          </div>
          <div className="stat-box-footer">
            <span>Multiplier: <strong style={{ color: '#fcd34d' }}>{multiplier}x</strong></span>
            <span>{streak >= 21 ? '🎓 Cert Unlocked' : `${21 - streak}d to Cert`}</span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-box-header">
            <span>Credits & Tier</span>
            <Award size={16} color="#818cf8" />
          </div>
          <div className="stat-box-value">
            {credits} <span style={{ fontSize: '0.9rem', color: '#818cf8', fontWeight: 600 }}>({level})</span>
          </div>
          <div className="stat-box-footer">
            <span>Next Goal: <strong>{level === 'Bronze' ? '500 pts' : '2000 pts'}</strong></span>
            <span>{level === 'Bronze' ? `${Math.max(0, 500 - credits)} to Silver` : 'Advanced'}</span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-box-header">
            <span>Today's Progress</span>
            <CalendarCheck size={16} color="#10b981" />
          </div>
          <div className="stat-box-value">
            {completedSlots}/{slots.length} <span style={{ fontSize: '0.9rem', color: '#34d399', fontWeight: 600 }}>Completed</span>
          </div>
          <div className="stat-box-footer">
            <span>Full-Day Bonus</span>
            <strong style={{ color: '#34d399' }}>+20 pts</strong>
          </div>
        </div>

      </div>

      {/* Two Column Section: Schedule peek + Rulebook */}
      <div className="two-col-grid">
        
        {/* Left: Schedule Preview */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
              <Clock size={16} />
              <span>Today's Focus Timeline</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Evening Commitment Blocks</h3>
            
            <div className="slot-list">
              {slots.slice(0, 3).map((s, idx) => (
                <div key={s._id || idx} className="slot-item" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: s.status === 'completed' ? '#10b981' : s.status === 'in_progress' ? '#6366f1' : '#64748b' 
                    }} />
                    <strong style={{ fontSize: '0.88rem' }}>{s.title}</strong>
                  </div>
                  <span className="slot-time-badge">{s.startTime}–{s.endTime}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => { onNavigate('schedule'); sound.playClick(); }}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            <span>Open Schedule Builder</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Right: Gamification Rules */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
              <TrendingUp size={16} />
              <span>Reward Matrix</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Gamification Rulebook</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <span style={{ color: '#cbd5e1' }}>🎯 Complete a focus slot</span>
                <strong style={{ color: '#34d399' }}>+10 pts × Streak Multiplier</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <span style={{ color: '#cbd5e1' }}>🌟 Complete all daily slots</span>
                <strong style={{ color: '#34d399' }}>+20 Bonus Points</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <span style={{ color: '#cbd5e1' }}>🔥 Streak Multipliers</span>
                <strong style={{ color: '#fcd34d' }}>Day 3 (1.2x) • Day 7 (1.5x) • Day 30 (2x)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <span style={{ color: '#cbd5e1' }}>⚠️ Open blocked app mid-slot</span>
                <strong style={{ color: '#fb7185' }}>-5 Point Penalty</strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => { onNavigate('certificate'); sound.playClick(); }}
            className="btn btn-secondary"
            style={{ width: '100%' }}
          >
            <span>View Certificate Unlock Progress</span>
            <ArrowRight size={16} />
          </button>
        </div>

      </div>

    </div>
  );
}
