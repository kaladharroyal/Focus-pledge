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
            <Settings size={18} color="#818cf8" />
            <h3 style={{ fontSize: '1.15rem' }}>Settings & Simulation</h3>
          </div>
          <button onClick={onClose} style={{ color: '#94a3b8' }}>✕</button>
        </div>

        {/* Distraction List */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
            <span>Blocked Apps Guard</span>
            <span>{blockedApps.length} active</span>
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
                  background: 'rgba(255,255,255,0.05)',
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={onClose} className="btn btn-primary">
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
