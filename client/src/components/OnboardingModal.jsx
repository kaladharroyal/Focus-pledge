import React from 'react';
import { ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { sound } from '../services/sound';

export default function OnboardingModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handleAgree = () => {
    sound.playSuccess();
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #e11d48, #9f1239)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#ffffff', boxShadow: '0 4px 16px rgba(225, 29, 72, 0.4)' }}>
            <ShieldCheck size={26} />
          </div>
          <h3 style={{ fontSize: '1.35rem', marginBottom: '6px' }}>Sanctuary Protocol</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Your self-scheduling evening discipline protocol.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', marginBottom: '20px' }}>
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <strong style={{ color: '#fda4af', display: 'block', marginBottom: '2px' }}>1. Check In When You Arrive Home</strong>
            <span style={{ color: '#94a3b8' }}>Tap "帰宅 — I'm Home" to lock in your daily streak and commit to your evening focus blocks.</span>
          </div>

          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <strong style={{ color: '#34d399', display: 'block', marginBottom: '2px' }}>2. Guarded Focus Chambers</strong>
            <span style={{ color: '#94a3b8' }}>Focus Mode blocks distracting apps. Complete slots to earn +10 honor credits (multiplied by streaks).</span>
          </div>

          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <strong style={{ color: '#f59e0b', display: 'block', marginBottom: '2px' }}>3. Download Verified Certificate</strong>
            <span style={{ color: '#94a3b8' }}>Hit Bushi rank (500 pts) or 21 days to unlock an official verified PDF certificate for your portfolio.</span>
          </div>
        </div>

        <button
          onClick={handleAgree}
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px' }}
        >
          <Sparkles size={16} />
          <span>I Pledge to Focus — Enter Sanctuary</span>
        </button>

      </div>
    </div>
  );
}
