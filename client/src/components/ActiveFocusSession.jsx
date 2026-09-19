import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Flame, 
  Music, 
  FastForward, 
  Clock, 
  Layers,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../services/sound';

const FOCUS_QUOTES = [
  "“無心 — In the stillness of focus, the blade strikes true.”",
  "“Discipline is not restriction; it is the master key to total sovereignty.”",
  "“Small daily devotions compound into unshakeable mastery.”",
  "“Put down the distractions. Forge the masterpiece tonight.”"
];

export default function ActiveFocusSession({ 
  slot, 
  user, 
  onComplete, 
  onAbandon, 
  onTriggerDistraction,
  onNavigate 
}) {
  const [secondsRemaining, setSecondsRemaining] = useState(
    slot?.durationMinutes ? slot.durationMinutes * 60 : 25 * 60
  );
  const [isRunning, setIsRunning] = useState(true);
  const [ambientActive, setAmbientActive] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);

  const totalSeconds = (slot?.durationMinutes || 25) * 60;
  const audioNoiseRef = useRef(null);

  useEffect(() => {
    const qInterval = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % FOCUS_QUOTES.length);
    }, 25000);
    return () => clearInterval(qInterval);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const toggleAmbientSound = () => {
    if (ambientActive) {
      if (audioNoiseRef.current) {
        audioNoiseRef.current.stop();
        audioNoiseRef.current = null;
      }
      setAmbientActive(false);
    } else {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 0.12;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        noise.connect(gainNode);
        gainNode.connect(ctx.destination);
        noise.start();
        audioNoiseRef.current = { stop: () => { noise.stop(); ctx.close(); } };
        setAmbientActive(true);
      } catch (e) {
        console.warn('Audio error', e);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (audioNoiseRef.current) audioNoiseRef.current.stop();
    };
  }, []);

  const handleFinish = async () => {
    sound.playSuccess();
    sound.playFanfare();
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    if (audioNoiseRef.current) {
      audioNoiseRef.current.stop();
      setAmbientActive(false);
    }
    await onComplete(slot._id);
  };

  const handleFastForward = () => {
    setSecondsRemaining((prev) => Math.max(5, prev - 300));
    sound.playClick();
  };

  const streak = user?.currentStreak || 1;
  const multiplier = streak >= 30 ? 2.0 : streak >= 7 ? 1.5 : streak >= 3 ? 1.2 : 1.0;
  const earnedIfComplete = Math.round(10 * multiplier);

  const progressFraction = Math.max(0, Math.min(1, (totalSeconds - secondsRemaining) / totalSeconds));
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressFraction * circumference;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (!slot) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 24px', maxWidth: '600px', margin: '40px auto' }}>
        <Clock size={40} color="#fb7185" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>No Active Focus Chamber</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '24px' }}>
          Select a time slot from your Schedule to begin a guarded deep work block.
        </p>
        <button onClick={() => onNavigate('schedule')} className="btn btn-primary">
          <span>Open Schedule Builder</span>
        </button>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: '720px', margin: '0 auto' }}>
      
      {/* Session Title Header */}
      <div className="card" style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(225, 29, 72, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb7185', border: '1px solid rgba(225, 29, 72, 0.28)' }}>
            <Layers size={18} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: '#fb7185', display: 'block', letterSpacing: '0.04em' }}>無心集中 • Deep Work Chamber</span>
            <strong style={{ fontSize: '1.1rem' }}>{slot.title}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="status-badge streak">
            <Flame size={14} color="#f59e0b" />
            <span>+{earnedIfComplete} pts ({multiplier}x)</span>
          </div>

          <button
            onClick={toggleAmbientSound}
            className={`btn ${ambientActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <Music size={13} />
            <span>{ambientActive ? 'Audio ON' : 'Zen Noise'}</span>
          </button>
        </div>
      </div>

      {/* Main Timer Section */}
      <div className="focus-timer-card">
        <div className="timer-svg-container">
          <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 220 220">
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e11d48" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth="7"
              fill="transparent"
            />
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="url(#timerGrad)"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>

          <div className="timer-center-text">
            <span className="timer-digits">{timeFormatted}</span>
            <span className="timer-state-label">{isRunning ? 'In Presence' : 'Paused'}</span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', fontFamily: 'monospace' }}>
              {Math.round(progressFraction * 100)}% FORGED
            </span>
          </div>
        </div>

        {/* Motivational wisdom quote */}
        <p style={{ fontStyle: 'italic', fontSize: '0.86rem', color: '#94a3b8', minHeight: '26px', maxWidth: '480px', lineHeight: 1.5 }}>
          {FOCUS_QUOTES[quoteIdx]}
        </p>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => { setIsRunning(!isRunning); sound.playClick(); }}
            className="btn btn-secondary"
          >
            {isRunning ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
            <span>{isRunning ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={handleFastForward}
            className="btn btn-secondary"
            title="Fast forward 5 minutes (Testing)"
          >
            <FastForward size={14} />
            <span style={{ fontSize: '0.78rem' }}>-5m</span>
          </button>

          <button
            onClick={handleFinish}
            className="btn btn-emerald"
          >
            <CheckCircle2 size={16} />
            <span>Complete Block</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Abandon session? No honor credits will be earned.')) onAbandon(slot._id);
            }}
            className="icon-btn"
            style={{ color: '#fb7185' }}
            title="Abandon slot"
          >
            <XCircle size={16} />
          </button>
        </div>
      </div>

      {/* Distraction Guard Simulation Testing Row */}
      <div className="distraction-guard-suite">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#fb7185', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.04em' }}>
            <ShieldAlert size={14} />
            Distraction Shield Active
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Test Shield Interception:</span>
        </div>

        <div className="distraction-btn-row">
          {(user?.settings?.blockedApps && user.settings.blockedApps.length > 0 
            ? user.settings.blockedApps 
            : ['Instagram', 'TikTok', 'YouTube', 'Reddit', 'Mobile Games']
          ).map((appName) => {
            const lower = appName.toLowerCase();
            const icon = lower.includes('insta') ? '📸' :
                         lower.includes('tik') ? '🎵' :
                         lower.includes('you') || lower.includes('tube') ? '▶️' :
                         lower.includes('game') ? '🎮' :
                         lower.includes('red') || lower.includes('tweet') || lower.includes('x') ? '💬' :
                         lower.includes('net') || lower.includes('film') ? '🎬' : '🚫';
            return (
              <button
                key={appName}
                onClick={() => onTriggerDistraction(appName)}
                className="distraction-test-btn"
              >
                <span>{icon}</span>
                <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>{appName}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
