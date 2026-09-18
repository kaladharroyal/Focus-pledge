import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Share2, 
  Lock, 
  CheckCircle, 
  Sparkles, 
  Shield, 
  Zap 
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { sound } from '../services/sound';
import { api } from '../services/api';

export default function CertificateView({ 
  user, 
  certificateStatus, 
  onRefreshUser,
  onNavigate 
}) {
  const [recipientName, setRecipientName] = useState(user?.name || 'Alex Rivera');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const certRef = useRef(null);

  const totalCredits = user?.totalCredits || 0;
  const streak = user?.highestStreak || user?.currentStreak || 1;
  const level = user?.level || (totalCredits >= 2000 ? 'Gold' : totalCredits >= 500 ? 'Silver' : 'Bronze');
  const isEligible = (level !== 'Bronze') || (streak >= 21) || certificateStatus?.isEligible;
  const serialId = `FP-2026-${(totalCredits * 37 + streak * 13).toString(16).toUpperCase().padStart(6, 'X')}`;
  const issueDateFormatted = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    if (user?.name) setRecipientName(user.name);
  }, [user]);

  const handleDownloadPdf = async () => {
    if (!certRef.current) return;
    try {
      setIsGeneratingPdf(true);
      sound.playClick();

      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`FocusPledge_Certificate_${recipientName.replace(/\s+/g, '_')}.pdf`);
      sound.playSuccess();
    } catch (err) {
      console.error('PDF error', err);
    } finally {
      setIsGeneratingPdf(false);
    }
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px', textAlign: 'left' }}>
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Path A: Silver Tier</span>
            <strong style={{ color: '#818cf8', fontSize: '0.95rem' }}>{totalCredits}/500 pts</strong>
          </div>
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Path B: 21-Day Streak</span>
            <strong style={{ color: '#f59e0b', fontSize: '0.95rem' }}>{streak}/21 Days</strong>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button
            onClick={async () => {
              sound.playClick();
              await api.simulateStreak(21, 550);
              await onRefreshUser();
            }}
            className="btn btn-emerald"
            style={{ fontSize: '0.82rem' }}
          >
            <Zap size={14} />
            <span>Simulate Unlock (Silver + 21d Demo)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      
      {/* Top Banner */}
      <div className="card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: '#f59e0b', display: 'block', marginBottom: '4px' }}>
            ★ Milestone Unlocked
          </span>
          <h2 style={{ fontSize: '1.4rem' }}>Time Management Consistency Certificate</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="btn btn-primary"
          >
            <Download size={16} />
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
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

      {/* Recipient Customizer */}
      <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>Recipient Name:</span>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            style={{ padding: '6px 10px', fontSize: '0.88rem', fontWeight: 700, width: '220px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '16px', color: '#64748b' }}>
          <span>Serial: <strong style={{ color: '#f59e0b', fontFamily: 'monospace' }}>{serialId}</strong></span>
          <span>Tier: <strong style={{ color: '#ffffff', textTransform: 'uppercase' }}>{level}</strong></span>
        </div>
      </div>

      {/* Certificate Canvas Preview */}
      <div style={{ overflowX: 'auto', padding: '16px 0', display: 'flex', justifyContent: 'center' }}>
        <div 
          ref={certRef}
          style={{
            width: '840px',
            minHeight: '580px',
            background: '#faf8f5',
            color: '#1c1917',
            padding: '40px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '12px double #996515',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            fontFamily: 'Cinzel, serif'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#996515', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              FocusPledge Academic Productivity Board
            </span>
            <h1 style={{ fontSize: '1.65rem', color: '#1c1917', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 800 }}>
              Time Management Consistency Certificate
            </h1>
            <div style={{ width: '120px', height: '2px', background: '#d4af37', margin: '8px auto 0' }} />
          </div>

          {/* Body */}
          <div style={{ textAlign: 'center', margin: 'auto 0', padding: '0 24px' }}>
            <p style={{ fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#78716c', marginBottom: '8px' }}>
              This credential is conferred upon
            </p>
            <h2 style={{ fontSize: '2.2rem', color: '#1e1b4b', borderBottom: '2px solid rgba(212, 175, 55, 0.4)', paddingBottom: '6px', display: 'inline-block', minWidth: '300px', marginBottom: '12px' }}>
              {recipientName || 'Alex Rivera'}
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
              <div style={{ width: '130px', height: '1px', background: '#d4af37', margin: '2px 0 2px auto' }} />
              <span style={{ fontSize: '0.65rem', color: '#78716c', textTransform: 'uppercase' }}>Productivity Registrar</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
