import React, { useState } from 'react';
import { 
  Award, 
  Flame, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Zap, 
  ArrowUpRight 
} from 'lucide-react';
import { sound } from '../services/sound';

export default function Dashboard({ 
  dashboardData, 
  user, 
  schedule, 
  onNavigate 
}) {
  const [subTab, setSubTab] = useState('overview'); // 'overview' | 'badges' | 'logs'

  const stats = dashboardData?.stats || {};
  const badges = dashboardData?.badgesCatalog || [];
  const weeklyData = dashboardData?.weeklyData || [];
  const recentLogs = dashboardData?.recentLogs || [];

  const level = user?.level || stats.level || 'Bronze';
  const totalCredits = user?.totalCredits ?? stats.totalCredits ?? 0;
  const currentStreak = user?.currentStreak ?? stats.currentStreak ?? 1;
  const highestStreak = user?.highestStreak ?? stats.highestStreak ?? 1;
  const multiplier = stats.streakMultiplier || 1.0;
  const progressPercent = stats.progressPercent || 0;
  const certUnlocked = stats.certificateUnlocked;

  const maxCredits = Math.max(...weeklyData.map(d => d.credits), 70);

  return (
    <div className="page-wrapper">
      
      {/* Header & Subtabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Focus & Consistency Dashboard</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
            Track credit gains, streak multipliers, weekly progress, and certificate readiness.
          </p>
        </div>

        <div className="nav-tab-list">
          <button
            onClick={() => { setSubTab('overview'); sound.playClick(); }}
            className={`nav-tab-btn ${subTab === 'overview' ? 'active' : ''}`}
          >
            Overview
          </button>
          <button
            onClick={() => { setSubTab('badges'); sound.playClick(); }}
            className={`nav-tab-btn ${subTab === 'badges' ? 'active' : ''}`}
          >
            Badges ({badges.filter(b => b.unlocked).length}/{badges.length})
          </button>
          <button
            onClick={() => { setSubTab('logs'); sound.playClick(); }}
            className={`nav-tab-btn ${subTab === 'logs' ? 'active' : ''}`}
          >
            Transactions
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="stats-grid-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        
        <div className="stat-box">
          <div className="stat-box-header">
            <span>Credits</span>
            <Award size={15} color="#818cf8" />
          </div>
          <div className="stat-box-value">
            {totalCredits} <span style={{ fontSize: '0.8rem', color: '#818cf8' }}>({level})</span>
          </div>
          <div className="stat-box-footer">
            <div style={{ width: '100%' }}>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', marginBottom: '4px' }}>
                <div style={{ height: '100%', width: `${progressPercent}%`, background: '#6366f1', borderRadius: '2px' }} />
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{progressPercent}% to next tier</span>
            </div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-box-header">
            <span>Streak</span>
            <Flame size={15} color="#f59e0b" />
          </div>
          <div className="stat-box-value">{currentStreak} <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>Days</span></div>
          <div className="stat-box-footer">
            <span>Multiplier: <strong style={{ color: '#fcd34d' }}>{multiplier}x</strong></span>
            <span>Best: {highestStreak}d</span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-box-header">
            <span>Completed</span>
            <CheckCircle2 size={15} color="#10b981" />
          </div>
          <div className="stat-box-value">{stats.completedSlotsCount || 0} <span style={{ fontSize: '0.8rem', color: '#34d399' }}>Slots</span></div>
          <div className="stat-box-footer">
            <span>Consistency: <strong>98%</strong></span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-box-header">
            <span>Guards</span>
            <ShieldCheck size={15} color="#06b6d4" />
          </div>
          <div className="stat-box-value">{stats.distractionsBlockedCount || 0} <span style={{ fontSize: '0.8rem', color: '#22d3ee' }}>Blocked</span></div>
          <div className="stat-box-footer">
            <span>Protected: <strong>100%</strong></span>
          </div>
        </div>

      </div>

      {/* Tab 1: Overview */}
      {subTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Weekly Bar Chart */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>7-Day Productivity Flow</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Credits earned per day</p>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: 600 }}>• Weekly Activity</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', height: '160px', alignItems: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
              {weeklyData.map((d, idx) => {
                const heightPercent = Math.max(16, Math.round((d.credits / maxCredits) * 100));
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 700 }}>+{d.credits}</span>
                    <div style={{ width: '100%', maxWidth: '32px', height: `${heightPercent}%`, background: 'linear-gradient(180deg, #818cf8, #4f46e5)', borderRadius: '6px 6px 0 0' }} />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Certificate Promo Card */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(17,23,38,0.9))' }}>
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: '#f59e0b', display: 'block', marginBottom: '4px' }}>Official Credential</span>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Time Management Consistency Certificate</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                {certUnlocked 
                  ? '🎉 Certificate unlocked! Ready for preview and high-resolution PDF download.' 
                  : `Locked. Reach Silver Level (500 pts) or a 21-day streak to unlock. Currently: ${totalCredits} pts, Day ${currentStreak}.`}
              </p>
            </div>

            <button
              onClick={() => { onNavigate('certificate'); sound.playClick(); }}
              className="btn btn-primary"
            >
              <span>{certUnlocked ? 'View & Download PDF' : 'Check Progress'}</span>
              <ArrowUpRight size={16} />
            </button>
          </div>

        </div>
      )}

      {/* Tab 2: Badges */}
      {subTab === 'badges' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {badges.map((b) => (
            <div
              key={b.id}
              className="card"
              style={{
                padding: '16px',
                opacity: b.unlocked ? 1 : 0.45,
                borderColor: b.unlocked ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.06)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.75rem' }}>{b.icon}</span>
                {b.unlocked ? (
                  <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Unlock size={12} /> Unlocked
                  </span>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} /> Locked
                  </span>
                )}
              </div>
              <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>{b.name}</strong>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{b.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Transactions */}
      {subTab === 'logs' && (
        <div className="card" style={{ padding: '0' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ fontSize: '1.05rem' }}>Credit Transaction Ledger</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentLogs.length === 0 ? (
              <p style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                No credit transactions logged yet.
              </p>
            ) : (
              recentLogs.map((log, idx) => {
                const isPositive = log.amount > 0;
                return (
                  <div
                    key={log._id || idx}
                    style={{
                      padding: '14px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block' }}>{log.reason}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Resulting balance: {log.resultingTotal} pts
                      </span>
                    </div>

                    <strong style={{
                      color: isPositive ? '#34d399' : '#fb7185',
                      fontFamily: 'monospace',
                      fontSize: '0.95rem'
                    }}>
                      {isPositive ? `+${log.amount}` : log.amount} pts
                    </strong>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
}
