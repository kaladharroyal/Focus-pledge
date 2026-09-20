import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Share2, 
  Lock, 
  CheckCircle, 
  Shield 
} from 'lucide-react';
import { sound } from '../services/sound';

export default function CertificateView({ 
  user, 
  certificateStatus 
}) {
  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [copySuccess, setCopySuccess] = useState(false);

  const totalCredits = user?.totalCredits || 0;
  const streak = user?.highestStreak || user?.currentStreak || 1;
  const level = user?.level || (totalCredits >= 2000 ? 'Gold' : totalCredits >= 500 ? 'Silver' : 'Bronze');
  const isEligible = (level !== 'Bronze') || (streak >= 21) || certificateStatus?.isEligible;
  const serialId = certificateStatus?.certificate?.certificateId || `FP-2026-${(user?._id ? user._id.slice(-6) : (totalCredits * 37 + streak * 13).toString(16)).toUpperCase()}`;
  const issueDateFormatted = certificateStatus?.certificate?.issueDate 
    ? new Date(certificateStatus.certificate.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    if (user?.name) setRecipientName(user.name);
  }, [user]);

  const handlePrint = () => {
    sound.playSuccess();
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/verify/${serialId}`);
    setCopySuccess(true);
    sound.playClick();
    setTimeout(() => setCopySuccess(false), 2500);
  };

  if (!isEligible) {
    return (
      <div className="card" style={{ maxWidth: '640px', margin: '30px auto', textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#f59e0b' }}>
          <Lock size={28} />
        </div>

        <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Certificate Locked</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 24px' }}>
          Reach <strong>Silver Level (500 pts)</strong> or maintain a <strong>21-Day Streak</strong> to unlock your verified Time Management Consistency Certificate.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'left' }}>
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Path A: Silver Tier</span>
            <strong style={{ color: '#818cf8', fontSize: '0.95rem' }}>{totalCredits}/500 pts</strong>
          </div>
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Path B: 21-Day Streak</span>
            <strong style={{ color: '#f59e0b', fontSize: '0.95rem' }}>{streak}/21 Days</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      
      {/* Top Banner (hidden on print) */}
      <div className="card no-print" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: '#f59e0b', display: 'block', marginBottom: '4px' }}>
            ★ Milestone Unlocked
          </span>
          <h2 style={{ fontSize: '1.4rem' }}>Time Management Consistency Certificate</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handlePrint}
            className="btn btn-primary"
          >
            <Printer size={16} />
            <span>Print / Save PDF</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="btn btn-secondary"
          >
            {copySuccess ? <CheckCircle size={16} color="#34d399" /> : <Share2 size={16} />}
            <span>{copySuccess ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Recipient Customizer (hidden on print) */}
      <div className="card no-print cert-customizer-card">
        <div className="cert-recipient-input-wrap">
          <span className="cert-input-label">Recipient Name:</span>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="cert-name-input"
            placeholder="Scholar Name"
          />
        </div>
        <div className="cert-meta-tags">
          <span>Serial: <strong className="serial-code">{serialId}</strong></span>
          <span>Tier: <strong className="tier-badge">{level}</strong></span>
        </div>
      </div>

      {/* Certificate Canvas Preview with responsive scaling wrapper */}
      <div className="printable-certificate-container">
        <div className="printable-certificate-scaler">
          <div 
            className="printable-certificate-document"
          >
            {/* Header */}
            <div className="cert-doc-header-block">
              <span className="cert-board-title">
                FocusPledge Academic Productivity Board
              </span>
              <h1 className="cert-main-title">
                Time Management Consistency Certificate
              </h1>
              <div className="cert-title-rule" />
            </div>

          {/* Body */}
          <div style={{ textAlign: 'center', margin: 'auto 0', padding: '0 24px' }}>
            <p style={{ fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#78716c', marginBottom: '8px' }}>
              This credential is conferred upon
            </p>
            <h2 style={{ fontSize: '2.2rem', color: '#1e1b4b', borderBottom: '2px solid rgba(212, 175, 55, 0.4)', paddingBottom: '6px', display: 'inline-block', minWidth: '300px', marginBottom: '12px' }}>
              {recipientName || user?.name || 'Focus Scholar'}
            </h2>
            <p style={{ fontSize: '0.75rem', lineHeight: '1.6', color: '#44403c', maxWidth: '560px', margin: '0 auto' }}>
              For demonstrating exemplary focus discipline, habit consistency, and self-scheduling rigor during post-commute evening blocks, conquering digital distraction and achieving the distinguished <strong style={{ color: '#996515', textTransform: 'uppercase' }}>{level} Tier</strong> milestone.
            </p>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: '#f5f0e6', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '8px', padding: '10px 16px', margin: '12px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.62rem', color: '#78716c', textTransform: 'uppercase', display: 'block' }}>Consistency</span>
              <strong style={{ fontSize: '0.88rem' }}>{streak} Days</strong>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(212,175,55,0.3)' }}>
              <span style={{ fontSize: '0.62rem', color: '#78716c', textTransform: 'uppercase', display: 'block' }}>Credits</span>
              <strong style={{ fontSize: '0.88rem' }}>{totalCredits} pts</strong>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(212,175,55,0.3)' }}>
              <span style={{ fontSize: '0.62rem', color: '#78716c', textTransform: 'uppercase', display: 'block' }}>Execution Rate</span>
              <strong style={{ fontSize: '0.88rem', color: '#10b981' }}>98.6%</strong>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(212,175,55,0.3)' }}>
              <span style={{ fontSize: '0.62rem', color: '#78716c', textTransform: 'uppercase', display: 'block' }}>Distinction</span>
              <strong style={{ fontSize: '0.88rem', color: '#996515', textTransform: 'uppercase' }}>{level} Scholar</strong>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '10px' }}>
            <div>
              <span style={{ fontSize: '0.65rem', color: '#78716c', textTransform: 'uppercase', display: 'block' }}>Issue Date</span>
              <strong style={{ fontSize: '0.8rem', display: 'block' }}>{issueDateFormatted}</strong>
              <span style={{ fontSize: '0.65rem', color: '#a8a29e', fontFamily: 'monospace' }}>Serial: {serialId}</span>
            </div>

            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'radial-gradient(circle, #ffe066 0%, #d4af37 60%, #996515 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#78350f', border: '2px dashed #ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              <Shield size={16} fill="currentColor" />
              <span style={{ fontSize: '0.45rem', fontWeight: 900, textTransform: 'uppercase' }}>Verified</span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Pinyon Script, cursive', fontSize: '1.6rem', color: '#1e1b4b' }}>
                Devin S. Alexander
              </div>
              <span style={{ fontSize: '0.65rem', color: '#78716c', textTransform: 'uppercase' }}>Productivity Registrar</span>
            </div>
          </div>

        </div>
      </div>
    </div>

  </div>
);
}
