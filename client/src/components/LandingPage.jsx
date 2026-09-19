import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Flame, 
  Award, 
  FileCheck2, 
  Timer, 
  ShieldAlert, 
  Lock, 
  Calendar, 
  Clock, 
  Zap,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { sound } from '../services/sound';
import AuthModal from './AuthModal';
import KageCanvas from './KageCanvas';

export default function LandingPage({ onAuthSuccess }) {
  const [authModalConfig, setAuthModalConfig] = useState({
    isOpen: false,
    initialRegister: false
  });
  const [activeChapter, setActiveChapter] = useState('01');
  
  // Zen Loading Screen State
  const [targetProgress, setTargetProgress] = useState(12);
  const [displayProgress, setDisplayProgress] = useState(12);
  const [loadingCaption, setLoadingCaption] = useState('RAISING THE MOUNTAIN TEMPLE');
  const [isLoaderFading, setIsLoaderFading] = useState(false);
  const [isLoaderGone, setIsLoaderGone] = useState(false);

  // Smooth snappy lerp progress counter
  useEffect(() => {
    let anim;
    const updateProgress = () => {
      setDisplayProgress(prev => {
        if (prev >= 100) return 100;
        const diff = targetProgress - prev;
        const step = Math.max(1.8, diff * 0.25);
        return Math.min(targetProgress, prev + step);
      });
      anim = requestAnimationFrame(updateProgress);
    };
    anim = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(anim);
  }, [targetProgress]);

  // Handle Loading Progress from Three.js
  const handle3DProgress = (pct, phaseText) => {
    setTargetProgress(Math.max(pct, 25));
    if (phaseText) setLoadingCaption(phaseText);
  };

  // Handle 3D Scene Loaded
  const handle3DLoaded = () => {
    setTargetProgress(100);
    setDisplayProgress(100);
    setLoadingCaption('ENTERING THE SANCTUARY');
    setTimeout(() => {
      setIsLoaderFading(true);
      setTimeout(() => {
        setIsLoaderGone(true);
      }, 600);
    }, 200);
  };

  // Fallback safety timer (max 2.2s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setTargetProgress(100);
      setDisplayProgress(100);
      setIsLoaderFading(true);
      setTimeout(() => setIsLoaderGone(true), 600);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  // Interactive Live Focus Simulator
  const [simTimer, setSimTimer] = useState(45 * 60); // 45 minutes
  const [isSimRunning, setIsSimRunning] = useState(false);
  const [simBlockedAttempt, setSimBlockedAttempt] = useState(false);
  const [shieldCountdown, setShieldCountdown] = useState(5);

  const openAuth = (isRegister = false) => {
    sound.playClick();
    setAuthModalConfig({ isOpen: true, initialRegister: isRegister });
  };

  const closeAuth = () => {
    sound.playClick();
    setAuthModalConfig({ isOpen: false, initialRegister: false });
  };

  // Timer simulation effect
  useEffect(() => {
    let interval;
    if (isSimRunning && simTimer > 0) {
      interval = setInterval(() => {
        setSimTimer(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSimRunning, simTimer]);

  // Shield countdown simulation effect
  useEffect(() => {
    let countdownInterval;
    if (simBlockedAttempt && shieldCountdown > 0) {
      countdownInterval = setInterval(() => {
        setShieldCountdown(prev => {
          if (prev <= 1) {
            setSimBlockedAttempt(false);
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownInterval);
  }, [simBlockedAttempt, shieldCountdown]);

  const toggleSimTimer = () => {
    sound.playClick();
    setIsSimRunning(prev => !prev);
  };

  const resetSimTimer = () => {
    sound.playClick();
    setIsSimRunning(false);
    setSimTimer(45 * 60);
  };

  const triggerBlockedAppSimulation = () => {
    sound.playError();
    setSimBlockedAttempt(true);
    setShieldCountdown(5);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Track active chapter during scrolling
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['chapter-1', 'chapter-2', 'chapter-3', 'chapter-4'];
      const scrollY = window.scrollY + 350;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollY) {
          setActiveChapter(`0${i + 1}`);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="kage-page-root">
      
      {/* Zen Kyoto Loading Screen */}
      {!isLoaderGone && (
        <div className={`kage-loading-screen ${isLoaderFading ? 'loaded' : ''}`} aria-hidden="true">
          <div className="kage-loader-center">
            
            {/* Japanese Torii & Vermilion Emblem Glyph */}
            <div className="kage-loader-icon-wrap">
              <svg viewBox="0 0 60 60" width="46" height="46" className="kage-loader-torii-svg">
                <circle cx="30" cy="32" r="10.5" stroke="#e0231c" strokeWidth="1.5" fill="none" opacity="0.95" />
                <line x1="14" y1="20" x2="46" y2="20" stroke="#f1f5f9" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="18" y1="24.5" x2="42" y2="24.5" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="30" y1="13" x2="30" y2="45" stroke="#f1f5f9" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>

            {/* Japanese Subtitle */}
            <div className="kage-loader-kanji">影 の 道</div>

            {/* Hairline Progress Track */}
            <div className="kage-loader-bar-wrap">
              <div 
                className="kage-loader-bar-fill" 
                style={{ width: `${Math.min(100, Math.round(displayProgress))}%` }} 
              />
            </div>

            {/* Phase Description & Percentage */}
            <div className="kage-loader-meta-row">
              <span className="kage-loader-phase-text">{loadingCaption}</span>
              <span className="kage-loader-percent-text">{Math.min(100, Math.round(displayProgress))}%</span>
            </div>

          </div>
        </div>
      )}

      {/* Three.js Live WebGL Atmosphere Canvas */}
      <KageCanvas onProgress={handle3DProgress} onLoaded={handle3DLoaded} />

      {/* Atmospheric Vignette & Grain */}
      <div className="kage-vignette" aria-hidden="true" />
      <div className="kage-grain" aria-hidden="true" />

      {/* Progress Rail Navigation */}
      <nav className="kage-rail" aria-label="Chapter navigation">
        {[
          { id: 'chapter-1', label: '01', title: 'The Gate' },
          { id: 'chapter-2', label: '02', title: 'Still Gardens' },
          { id: 'chapter-3', label: '03', title: 'Sacred Craft' },
          { id: 'chapter-4', label: '04', title: 'Afterlight' }
        ].map(item => (
          <a 
            key={item.id} 
            href={`#${item.id}`} 
            className={`rail-dot ${activeChapter === item.label ? 'active' : ''}`}
            title={`Chapter ${item.label} — ${item.title}`}
          >
            <span>{item.label}</span>
            <i />
          </a>
        ))}
      </nav>

      {/* Main Content Flow */}
      <div className="kage-content-wrapper">
        
        {/* Top Header Navigation */}
        <header className="kage-nav">
          <div className="kage-nav-inner">
            
            <div 
              className="kage-brand" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="kage-brand-emblem">
                <span className="emblem-vermilion-circle" />
                <ShieldCheck size={18} className="emblem-shield" />
              </div>
              <div className="kage-brand-text">
                <span className="kage-wordmark">Focus<span>Pledge</span></span>
                <span className="kage-kanji">集中誓約</span>
              </div>
            </div>

            <nav className="kage-nav-links">
              <a href="#chapter-1"><span>01</span> The Gate</a>
              <a href="#chapter-2"><span>02</span> Still Gardens</a>
              <a href="#chapter-3"><span>03</span> Sacred Craft</a>
              <a href="#chapter-4"><span>04</span> Afterlight</a>
            </nav>

            <div className="kage-nav-actions">
              <button
                onClick={() => openAuth(false)}
                className="btn-kage-ghost"
              >
                Sign In
              </button>

              <button
                onClick={() => openAuth(true)}
                className="btn-kage-vermilion"
              >
                <span>Start Focus Pledge</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>
        </header>

        {/* Hero Section — Editorial Split with Asymmetric Vertical Kanji */}
        <section className="kage-hero">
          
          <div className="kage-hero-top">
            <div className="kage-eyebrow">
              <span className="vermilion-dot" />
              <span>CHAPTER 00 — THE HIDDEN THRESHOLD</span>
            </div>

            <h1 className="kage-display-title">
              Where stillness<br />
              reveals the<br />
              <span className="text-vermilion-glow">unseen.</span>
            </h1>

            <p className="kage-lead-text">
              Enter your evening through quiet discipline. Self-schedule minute-precise study blocks, defend your attention with real stakes, and forge verified habit consistency.
            </p>

            <div className="kage-hero-cta">
              <button
                onClick={() => openAuth(true)}
                className="btn-kage-primary-large"
              >
                <i></i>
                <span>Enter The Sanctuary (Free)</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => openAuth(false)}
                className="btn-kage-outline-large"
              >
                <Play size={14} fill="currentColor" />
                <span>Sign In / Demo</span>
              </button>
            </div>
          </div>

          {/* Right Floating Live Session Window */}
          <div className="kage-hero-preview">
            <div className="kage-card-frame">
              
              <div className="card-frame-header">
                <div className="frame-meta">
                  <span className="meta-badge">LIVE SANCTUARY SESSION</span>
                  <span className="meta-date">Kyoto Night · 17:00 – 18:15</span>
                </div>
                <div className="frame-status">
                  <span className={`status-orb ${isSimRunning ? 'active-pulse' : ''}`} />
                  <span>{isSimRunning ? 'SESSION ACTIVE' : 'READY TO PLEDGE'}</span>
                </div>
              </div>

              <div className="card-frame-body">
                <div className="frame-timer-display">
                  <span className="timer-countdown">{formatTime(simTimer)}</span>
                  <span className="timer-slot-title">Algorithms & Deep Calculus Problem Solving</span>
                  
                  {/* Interactive Timer Controls */}
                  <div className="timer-interactive-controls">
                    <button 
                      onClick={toggleSimTimer} 
                      className={`btn-timer-toggle ${isSimRunning ? 'running' : ''}`}
                    >
                      {isSimRunning ? <><Pause size={14} /> Pause Session</> : <><Play size={14} /> Start Timer</>}
                    </button>
                    <button 
                      onClick={resetSimTimer} 
                      className="btn-timer-reset" 
                      title="Reset"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </div>
                </div>

                <div className="frame-stats-strip">
                  <div className="strip-item">
                    <span className="strip-label">CURRENT STREAK</span>
                    <strong className="strip-value text-amber">
                      <Flame size={14} /> Day 21 (1.8x)
                    </strong>
                  </div>
                  <div className="strip-item">
                    <span className="strip-label">SCHOLAR RANK</span>
                    <strong className="strip-value text-gold">
                      <Award size={14} /> Silver Scholar
                    </strong>
                  </div>
                  <div className="strip-item">
                    <span className="strip-label">SHIELD STATUS</span>
                    <strong className="strip-value text-emerald">
                      <ShieldCheck size={14} /> 8 Feeds Blocked
                    </strong>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Hero Bottom Chapter Chips */}
          <div className="hero-foot-chips">
            <div className="hero-cue-line">
              <span>Scroll to enter</span>
              <div className="hero-cue-track"><i /></div>
            </div>
            <div className="kage-chapters-strip">
              <a href="#chapter-1" className="chapter-chip-link">
                <span className="chip-num">01</span>
                <div className="chip-tx">
                  <b>The Sanmon</b>
                  <p>Cross the threshold from commute fatigue into sacred work.</p>
                </div>
              </a>
              <a href="#chapter-2" className="chapter-chip-link">
                <span className="chip-num">02</span>
                <div className="chip-tx">
                  <b>Still Gardens</b>
                  <p>Distraction Guard shield with real 5-credit stakes.</p>
                </div>
              </a>
              <a href="#chapter-3" className="chapter-chip-link">
                <span className="chip-num">03</span>
                <div className="chip-tx">
                  <b>Sacred Craft</b>
                  <p>Five daily disciplines compounding your focus momentum.</p>
                </div>
              </a>
              <a href="#chapter-4" className="chapter-chip-link">
                <span className="chip-num">04</span>
                <div className="chip-tx">
                  <b>Afterlight</b>
                  <p>Earn your verified cryptographic consistency certificate.</p>
                </div>
              </a>
            </div>
          </div>

        </section>

        {/* Chapter 01: The Gate — Asymmetric Story Spread */}
        <section id="chapter-1" className="kage-sec-story">
          <div className="sec-head-line">
            <span className="k"><b>01</b> — The Sanmon</span>
            <div className="rule" />
            <span className="k jp">山門</span>
          </div>

          <div className="gate-story-grid">
            <h2 className="gate-headline display">
              Charred cypress, worn stone, one gate left open.
            </h2>
            <div className="gate-story-copy">
              <p className="lead-story">
                FocusPledge begins where reactive browsing stops: an evening threshold of deliberate intent. The moment you cross your doorway, the platform anchors your planned deep-work blocks before dopamine fatigue takes hold.
              </p>
              <p className="body-story">
                Climb through your scheduled study slots with minute-precise start and end times. With each uninterrupted minute, the inner sanctuary lights brighten and your streak multiplier accelerates.
              </p>
              <a href="#chapter-2" className="arrowlink">
                <span>Enter Still Gardens</span>
                <div className="ar">
                  <ArrowRight size={14} />
                </div>
              </a>
            </div>
          </div>

          {/* 4-Stat Band */}
          <div className="gate-stats-band">
            <div><b>05</b><span>Daily Chapters</span></div>
            <div><b>90</b><span>Minutes / Block</span></div>
            <div><b>21</b><span>Day Streak Goal</span></div>
            <div><b>∞</b><span>Deep Stillness</span></div>
          </div>
        </section>

        {/* Chapter 02: Still Gardens — Staggered Vertical Cascade Cards */}
        <section id="chapter-2" className="kage-sec-gardens">
          <div className="sec-head-line">
            <span className="k"><b>02</b> — Still Gardens</span>
            <div className="rule" />
            <span className="k jp">庭園</span>
          </div>

          <div className="gardens-staggered-cards">
            
            <article className="garden-card">
              <div className="garden-card-inner">
                <div className="card-top-icon">
                  <Sparkles size={20} color="#e0231c" />
                </div>
                <div className="card-content-wrap">
                  <span className="card-jp-tag">参道 · 01</span>
                  <h3>The Arrival Ritual</h3>
                  <p>One-tap "I'm Home" check-in seals today's streak and removes the friction of starting evening tasks.</p>
                </div>
                <div className="card-bottom-meta">
                  <span>Threshold Seal</span>
                  <span>01 / 03</span>
                </div>
              </div>
            </article>

            <article className="garden-card offset-mid">
              <div className="garden-card-inner highlight-glow">
                <div className="card-top-icon">
                  <ShieldAlert size={20} color="#ff5a3c" />
                </div>
                <div className="card-content-wrap">
                  <span className="card-jp-tag">灯籠 · 02</span>
                  <h3>5-Credit Distraction Guard</h3>
                  <p>Attempting to open blocked feeds triggers a 5-second neural breathing buffer with real credit deduction.</p>
                  
                  {/* Interactive Shield Test Trigger */}
                  <button 
                    onClick={triggerBlockedAppSimulation}
                    className="btn-shield-test"
                  >
                    {simBlockedAttempt ? `Penalty in ${shieldCountdown}s...` : 'Test Shield Breach'}
                  </button>
                </div>
                <div className="card-bottom-meta">
                  <span>Distraction Shield</span>
                  <span>02 / 03</span>
                </div>
              </div>
            </article>

            <article className="garden-card offset-deep">
              <div className="garden-card-inner">
                <div className="card-top-icon">
                  <Flame size={20} color="#f59e0b" />
                </div>
                <div className="card-content-wrap">
                  <span className="card-jp-tag">月影 · 03</span>
                  <h3>Streak Multiplier Engine</h3>
                  <p>Maintain unbroken daily consistency to scale multiplier rewards from 1.0x baseline up to 2.0x Double XP.</p>
                </div>
                <div className="card-bottom-meta">
                  <span>Momentum Ladder</span>
                  <span>03 / 03</span>
                </div>
              </div>
            </article>

          </div>
        </section>

        {/* Chapter 03: Sacred Craft — Ruled Syllabus / Ledger */}
        <section id="chapter-3" className="kage-sec-curriculum">
          <div className="sec-head-line">
            <span className="k"><b>03</b> — Sacred Craft</span>
            <div className="rule" />
            <span className="k jp">手業</span>
          </div>

          <div className="kage-sec-curriculum-card">
            <div className="curriculum-head">
              <h2 className="display">Five Disciplines. Ninety Minutes. One Quiet Mind.</h2>
              <p className="body-lg">
                Each discipline is an active ritual, not passive advice. You cross the gate, lock your schedule, defend your focus, and leave with verifiable mastery.
              </p>
            </div>

            <div className="curriculum-ledger">
              
              <div className="ledger-row" onClick={() => openAuth(true)}>
                <span className="row-k">01</span>
                <h3>The Arrival Pledge<em className="jp">山門</em></h3>
                <p>Why crossing the doorway is a commitment, and how one tap locks your intention.</p>
                <span className="row-time">15 min</span>
                <i className="row-bar" />
              </div>

              <div className="ledger-row" onClick={() => openAuth(true)}>
                <span className="row-k">02</span>
                <h3>Self-Scheduled Blocks<em className="jp">借景</em></h3>
                <p>Shakkei: composing deep work blocks around existing evening obligations.</p>
                <span className="row-time">45 min</span>
                <i className="row-bar" />
              </div>

              <div className="ledger-row" onClick={() => openAuth(true)}>
                <span className="row-k">03</span>
                <h3>Real-Stakes Guard<em className="jp">焼杉</em></h3>
                <p>Yakisugi: creating deliberate behavioral friction so distractions burn out before focus is broken.</p>
                <span className="row-time">5-pt Stake</span>
                <i className="row-bar" />
              </div>

              <div className="ledger-row" onClick={() => openAuth(true)}>
                <span className="row-k">04</span>
                <h3>Streak Multiplier Velocity<em className="jp">灯籠</em></h3>
                <p>How 21 consecutive days compound your credit earnings from 1.0x up to 2.0x XP.</p>
                <span className="row-time">21 Days</span>
                <i className="row-bar" />
              </div>

              <div className="ledger-row" onClick={() => openAuth(true)}>
                <span className="row-k">05</span>
                <h3>The Master Credential<em className="jp">朱月</em></h3>
                <p>Official verifiable time management consistency certificate signed with serial cryptography.</p>
                <span className="row-time">Silver+ Tier</span>
                <i className="row-bar" />
              </div>

            </div>
          </div>
        </section>

        {/* Chapter 04: Afterlight & Certificate — Monumental Closing Stage */}
        <section id="chapter-4" className="kage-sec-afterlight">
          
          <div className="afterlight-monolith">
            
            <div className="monolith-left">
              <div className="kage-eyebrow">
                <span className="vermilion-dot" />
                <span>CHAPTER 04 — AFTERLIGHT CREDENTIAL</span>
              </div>
              <h2 className="display monolith-h2">Time Management Consistency Certificate</h2>
              <p className="body-lg">
                Upon reaching Silver Scholar (500 credits) or maintaining an unbroken 21-Day Streak, earn your official verifiable certificate of consistency complete with cryptographic serial verification.
              </p>

              <div className="monolith-actions" style={{ marginTop: '28px' }}>
                <button
                  onClick={() => openAuth(true)}
                  className="btn-kage-vermilion"
                  style={{ padding: '14px 30px' }}
                >
                  <span>Claim Your Certificate</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>

            <div className="monolith-right">
              <div className="japanese-cert-document">
                <div className="cert-doc-header">
                  <span>FOCUSPLEDGE ACADEMIC BOARD</span>
                  <h4>CONSISTENCY CERTIFICATE</h4>
                  <div className="cert-doc-divider" />
                </div>
                <div className="cert-doc-name">
                  <span>Alex Rivera</span>
                </div>
                <div className="cert-doc-meta">
                  <span>Serial: FP-2026-9A82F1</span>
                  <span>Execution: 98.6%</span>
                </div>
                <div className="cert-doc-seal">
                  <span>VERIFIED</span>
                </div>
              </div>
            </div>

          </div>

        </section>

        {/* Final Call To Action */}
        <section className="kage-final-cta">
          <div className="final-cta-box">
            <div className="kage-eyebrow">
              <span className="vermilion-dot" />
              <span>THE THRESHOLD IS OPEN</span>
            </div>
            <h2>Begin Your Focus Sanctuary Tonight.</h2>
            <p>Join thousands of dedicated students, engineers, and creators conquering evening distractions.</p>

            <div className="kage-hero-cta" style={{ justifyContent: 'center' }}>
              <button
                onClick={() => openAuth(true)}
                className="btn-kage-primary-large"
              >
                <span>Start Your Focus Pledge Free</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => openAuth(false)}
                className="btn-kage-outline-large"
              >
                <span>Sign In</span>
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="kage-footer">
          <div className="kage-footer-inner">
            <div className="kage-brand">
              <div className="kage-brand-emblem">
                <span className="emblem-vermilion-circle" />
                <ShieldCheck size={16} />
              </div>
              <span className="kage-wordmark">Focus<span>Pledge</span></span>
            </div>
            <p>© 2026 FocusPledge Protocol · WebGL & Three.js Kyoto Sanctuary Architecture.</p>
          </div>
        </footer>

      </div>

      {/* Auth Modal Popup */}
      {authModalConfig.isOpen && (
        <div className="modal-backdrop animate-fade-in" onClick={closeAuth}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: '460px' }}>
            <button 
              onClick={closeAuth} 
              className="modal-close-corner-btn"
              title="Close"
            >
              ✕
            </button>
            <AuthModal
              onAuthSuccess={onAuthSuccess}
              initialRegister={authModalConfig.initialRegister}
            />
          </div>
        </div>
      )}

    </div>
  );
}
