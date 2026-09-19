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
  Play,
  ShieldAlert,
  ShieldCheck
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
      setCheckInMsg(res?.message || '🔥 Evening sanctuary activated. Welcome home, warrior.');
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingIn(false);
    }
  };

  const streak = user?.currentStreak || 1;
  const credits = user?.totalCredits || 0;
  const level = user?.level || 'Bronze';
  const rankJapanese = level === 'Gold' ? '旗本 Hatamoto' : level === 'Silver' ? '武士 Bushi' : '浪人 Ronin';
  const slots = schedule?.slots || [];
  const completedSlots = slots.filter(s => s.status === 'completed').length;
  const multiplier = streak >= 30 ? 2.0 : streak >= 7 ? 1.5 : streak >= 3 ? 1.2 : 1.0;

  return (
    <div className="page-wrapper">
      
      {/* Hero Sanctuary Banner */}
      <div className="hero-card">
        <div className="hero-pill">
          <Sparkles size={14} className="text-rose-400" />
          <span>帰宅儀礼 • EVENING FOCUS SANCTUARY</span>
        </div>

        <h2 className="hero-title">
          Stop mindless scrolling.<br />
          <span style={{ 
            background: 'linear-gradient(135deg, #ffffff 30%, #fecdd3 70%, #f43f5e 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>
            Pledge your evening sanctuary.
          </span>
        </h2>

        <p className="hero-subtitle">
          Check in as soon as you arrive, lock in disciplined study blocks, shield against distractions, and forge your verified Certificate of Mastery.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleCheckInClick}
            disabled={checkingIn}
            className={`btn-checkin-large ${isAlreadyCheckedIn ? 'checked' : ''}`}
          >
            {isAlreadyCheckedIn ? <ShieldCheck size={22} /> : <Home size={22} />}
            <span>{isAlreadyCheckedIn ? 'Checked In Today ✓' : "帰宅 — I'm Home (Activate Pledge)"}</span>
          </button>

          {checkInMsg && (
            <p style={{ color: '#34d399', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} />
              {checkInMsg}
            </p>
          )}
        </div>
      </div>

      {/* 3 Stats Overview */}
      <div className="stats-grid-3">
        
        <div className="stat-box">
          <div className="stat-box-header">
            <span>Daily Discipline Streak</span>
            <Flame size={16} color="#f59e0b" />
          </div>
          <div className="stat-box-value">
            {streak} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>Days</span>
          </div>
          <div className="stat-box-footer">
            <span>Multiplier: <strong style={{ color: '#fcd34d' }}>{multiplier}x</strong></span>
            <span>{streak >= 21 ? '⚔️ Cert Unlocked' : `${21 - streak}d to Cert`}</span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-box-header">
            <span>Honor Credits & Rank</span>
            <Award size={16} color="#fb7185" />
          </div>
          <div className="stat-box-value">
            {credits} <span style={{ fontSize: '0.85rem', color: '#fda4af', fontWeight: 600 }}>({rankJapanese})</span>
          </div>
          <div className="stat-box-footer">
            <span>Next Rank: <strong>{level === 'Bronze' ? '500 pts' : '2000 pts'}</strong></span>
            <span>{level === 'Bronze' ? `${Math.max(0, 500 - credits)} to Bushi` : 'Advanced'}</span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-box-header">
            <span>Today's Protocol</span>
            <CalendarCheck size={16} color="#10b981" />
          </div>
          <div className="stat-box-value">
            {completedSlots}/{slots.length} <span style={{ fontSize: '0.9rem', color: '#34d399', fontWeight: 600 }}>Completed</span>
          </div>
          <div className="stat-box-footer">
            <span>Full-Day Honor Bonus</span>
            <strong style={{ color: '#34d399' }}>+20 pts</strong>
          </div>
        </div>

      </div>

      {/* Two Column Section: Schedule peek + Rulebook */}
      <div className="two-col-grid">
        
        {/* Left: Schedule Preview */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fda4af', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              <Clock size={15} />
              <span>修練予定 • Today's Timeline</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '14px' }}>Evening Commitment Blocks</h3>
            
            <div className="slot-list">
              {slots.slice(0, 3).map((s, idx) => (
                <div key={s._id || idx} className="slot-item" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: s.status === 'completed' ? '#10b981' : s.status === 'in_progress' ? '#e11d48' : '#64748b',
                      boxShadow: s.status === 'in_progress' ? '0 0 10px #e11d48' : 'none'
                    }} />
                    <strong style={{ fontSize: '0.88rem' }}>{s.title}</strong>
                  </div>
                  <span className="slot-time-badge">{s.startTime}–{s.endTime}</span>
                </div>
              ))}
              {slots.length === 0 && (
                <p style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic', padding: '12px 0' }}>
                  No commitment blocks created yet. Click below to craft today's protocol.
                </p>
              )}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fcd34d', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              <TrendingUp size={15} />
              <span>規律 • Sanctuary Rulebook</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '14px' }}>Honor & Reward Matrix</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#cbd5e1' }}>🎯 Complete a focus block</span>
                <strong style={{ color: '#34d399' }}>+10 pts × Multiplier</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#cbd5e1' }}>🌟 Complete entire evening</span>
                <strong style={{ color: '#34d399' }}>+20 Bonus Honor</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#cbd5e1' }}>🔥 Daily Streak Escalation</span>
                <strong style={{ color: '#fcd34d' }}>3d (1.2x) • 7d (1.5x) • 30d (2.0x)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(225,29,72,0.06)', borderRadius: '8px', border: '1px solid rgba(225,29,72,0.18)' }}>
                <span style={{ color: '#fda4af' }}>⚠️ Distraction app breach</span>
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
