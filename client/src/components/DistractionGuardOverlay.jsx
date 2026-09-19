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
    <div className="modal-backdrop" style={{ background: 'rgba(10, 4, 8, 0.94)' }}>
      <div className="modal-content" style={{ maxWidth: '460px', borderColor: 'rgba(225, 29, 72, 0.55)', textAlign: 'center', boxShadow: '0 0 50px rgba(225, 29, 72, 0.3)' }}>
        
        <div style={{ width: '58px', height: '58px', borderRadius: '50%', background: 'rgba(225, 29, 72, 0.16)', border: '2px solid #e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fda4af', boxShadow: '0 0 20px rgba(225, 29, 72, 0.4)' }}>
          <ShieldAlert size={28} />
        </div>

        <h3 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '8px' }}>
          Distraction Shield Triggered!
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '16px' }}>
          You attempted to breach focus for <strong style={{ color: '#fda4af' }}>{distractionName || 'a blocked app'}</strong> during your focus block "{slot?.title || 'Study Block'}".
        </p>

        <div style={{ background: 'rgba(225, 29, 72, 0.12)', border: '1px solid rgba(225, 29, 72, 0.3)', borderRadius: '10px', padding: '10px 14px', marginBottom: '20px', fontSize: '0.82rem', color: '#fda4af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <ZapOff size={16} />
          <strong>Dishonor Risk: -5 Honor Credit Penalty</strong>
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
            <span>Resist & Return to Focus ({countdown > 0 ? `${countdown}s` : 'Protected'})</span>
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
