import React, { useState, useEffect } from 'react';
import { ShieldAlert, ArrowLeft, XOctagon, ZapOff } from 'lucide-react';
import { sound } from '../services/sound';

export default function DistractionGuardOverlay({
  isOpen,
  distractionName,
  slot,
  onReturnToFocus,
  onAcceptPenalty
}) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      return;
    }
    sound.playPenalty();
    const interval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ background: 'rgba(23, 7, 12, 0.92)' }}>
      <div className="modal-content" style={{ maxWidth: '460px', borderColor: 'rgba(244, 63, 94, 0.5)', textAlign: 'center' }}>
        
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', border: '2px solid #f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fb7185' }}>
          <ShieldAlert size={28} />
        </div>

        <h3 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '8px' }}>
          Distraction Guard Triggered!
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '16px' }}>
          You attempted to open <strong style={{ color: '#fb7185' }}>{distractionName || 'a blocked app'}</strong> during your focus block "{slot?.title || 'Study Block'}".
        </p>

        <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '10px', padding: '10px 14px', marginBottom: '20px', fontSize: '0.82rem', color: '#fda4af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <ZapOff size={16} />
          <strong>Risk: -5 Credit Penalty if broken</strong>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => {
              sound.playSuccess();
              onReturnToFocus();
            }}
            className="btn btn-emerald"
            style={{ width: '100%', padding: '12px' }}
          >
            <ArrowLeft size={16} />
            <span>Stay Focused & Resist Distraction ({countdown > 0 ? `${countdown}s` : 'Safe'})</span>
          </button>

          <button
            onClick={() => {
              sound.playPenalty();
              onAcceptPenalty(distractionName);
            }}
            className="btn btn-secondary"
            style={{ width: '100%', color: '#94a3b8', fontSize: '0.78rem' }}
          >
            <XOctagon size={14} />
            <span>Break Focus Anyway (-5 Penalty)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
