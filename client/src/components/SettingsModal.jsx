import React, { useState } from 'react';
import { Settings, Plus, Zap, ShieldCheck } from 'lucide-react';
import { sound } from '../services/sound';
import { api } from '../services/api';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  user, 
  onRefreshUser 
}) {
  const [blockedApps, setBlockedApps] = useState(
    user?.settings?.blockedApps || [
      'Instagram', 'YouTube', 'TikTok', 'Reddit', 'Netflix', 'Twitter (X)', 'Discord', 'Mobile Games'
    ]
  );
  const [newApp, setNewApp] = useState('');
  const [msg, setMsg] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newApp.trim() || blockedApps.includes(newApp.trim())) return;
    sound.playClick();
    const updated = [...blockedApps, newApp.trim()];
    setBlockedApps(updated);
    setNewApp('');
    api.updateProfile({ settings: { blockedApps: updated } });
  };

  const handleRemove = (app) => {
    sound.playClick();
    const updated = blockedApps.filter(a => a !== app);
    setBlockedApps(updated);
    api.updateProfile({ settings: { blockedApps: updated } });
  };

  const handleSimulate = async (streakVal, creditsVal) => {
    sound.playClick();
    const res = await api.simulateStreak(streakVal, creditsVal);
    setMsg(`✅ ${res.message}`);
    await onRefreshUser();
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} color="#fb7185" />
            <h3 style={{ fontSize: '1.15rem' }}>設定 • Settings & Dev Simulation</h3>
          </div>
          <button onClick={onClose} style={{ color: '#94a3b8' }}>✕</button>
        </div>

        {/* Distraction List */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#fda4af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            <span>Blocked Distraction Shield</span>
            <span style={{ color: '#94a3b8' }}>{blockedApps.length} active</span>
          </div>

          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Add distracting app or site..."
              value={newApp}
              onChange={(e) => setNewApp(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px' }}>
              <Plus size={14} /> Add
            </button>
          </form>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
            {blockedApps.map(a => (
              <span
                key={a}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{a}</span>
                <button type="button" onClick={() => handleRemove(a)} style={{ color: '#64748b' }}>✕</button>
              </span>
            ))}
          </div>
        </div>

        {/* Simulation Controls for Quick Testing */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            <Zap size={14} />
            <span>Developer Time Machine</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '12px' }}>
            Jump ahead in streak days and credits to test unlock levels and certificate generation:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              onClick={() => handleSimulate(7, 250)}
              className="btn btn-secondary"
              style={{ padding: '8px', fontSize: '0.78rem' }}
            >
              Day 7 (1.5x)
            </button>
            <button
              onClick={() => handleSimulate(21, 600)}
              className="btn btn-secondary"
              style={{ padding: '8px', fontSize: '0.78rem', borderColor: 'rgba(217, 119, 6, 0.4)', color: '#fcd34d' }}
            >
              Day 21 (Cert 🎓)
            </button>
            <button
              onClick={() => handleSimulate(35, 2200)}
              className="btn btn-secondary"
              style={{ padding: '8px', fontSize: '0.78rem', borderColor: 'rgba(225, 29, 72, 0.4)', color: '#fda4af' }}
            >
              Day 35 (Gold 👑)
            </button>
          </div>

          {msg && (
            <p style={{ color: '#34d399', fontSize: '0.82rem', marginTop: '10px', textAlign: 'center', fontWeight: 600 }}>
              {msg}
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button onClick={onClose} className="btn btn-primary">
              Done
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
