import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Flame, 
  Award, 
  FileCheck2, 
  Timer, 
  CheckCircle2, 
  Zap, 
  ShieldAlert, 
  Lock, 
  Calendar, 
  Clock, 
  ChevronRight,
  Play
} from 'lucide-react';
import { sound } from '../services/sound';
import AuthModal from './AuthModal';

export default function LandingPage({ onAuthSuccess }) {
  const [authModalConfig, setAuthModalConfig] = useState({
    isOpen: false,
    initialRegister: false
  });

  const openAuth = (isRegister = false) => {
    sound.playClick();
    setAuthModalConfig({ isOpen: true, initialRegister: isRegister });
  };

  const closeAuth = () => {
    sound.playClick();
    setAuthModalConfig({ isOpen: false, initialRegister: false });
  };

  return (
    <div className="landing-root">
      
      {/* Top Clean Navbar */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          
          <div className="brand-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="brand-icon-box">
              <ShieldCheck size={22} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="brand-title">Focus<span>Pledge</span></h1>
            </div>
          </div>

          <nav className="landing-nav-links">
            <a href="#how-it-works">How It Works</a>
            <a href="#features">Features</a>
            <a href="#gamification">Rewards</a>
            <a href="#certificate">Certificate</a>
          </nav>

          <div className="landing-nav-actions">
            <button
              onClick={() => openAuth(false)}
              className="btn-landing-login"
            >
              Sign In
            </button>

            <button
              onClick={() => openAuth(true)}
              className="btn-landing-cta"
            >
              <span>Get Started Free</span>
              <ArrowRight size={15} />
            </button>
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-glow-sphere" />
        <div className="hero-content">
          
          <div className="hero-badge animate-fade-in">
            <Sparkles size={14} className="text-amber-400" />
            <span>Evening Self-Scheduling & Anti-Distraction Protocol</span>
          </div>

          <h1 className="hero-headline animate-slide-up">
            Master Post-Commute Focus.<br />
            <span className="text-gradient">Build Habits That Stick.</span>
          </h1>

          <p className="hero-description">
            FocusPledge empowers you to self-schedule evening focus blocks, defend against social media distractions, earn gamified streak credits, and unlock official Time Management Consistency Certificates.
          </p>

          <div className="hero-cta-group">
            <button
              onClick={() => openAuth(true)}
              className="btn-hero-primary"
            >
              <span>Start Your Focus Pledge</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => openAuth(false)}
              className="btn-hero-secondary"
            >
              <Play size={16} fill="currentColor" />
              <span>Sign In / Demo Login</span>
            </button>
          </div>

          {/* Social Proof / Key Highlights Bar */}
          <div className="hero-metrics-bar">
            <div className="hero-metric-item">
              <Flame size={18} color="#f59e0b" />
              <div>
                <strong>Up to 2.0x</strong>
                <span>Streak Multipliers</span>
              </div>
            </div>
            <div className="metric-divider" />
            <div className="hero-metric-item">
              <ShieldAlert size={18} color="#10b981" />
              <div>
                <strong>Distraction Guard</strong>
                <span>App Blocker & Stakes</span>
              </div>
            </div>
            <div className="metric-divider" />
            <div className="hero-metric-item">
              <Award size={18} color="#818cf8" />
              <div>
                <strong>Verified Certificate</strong>
                <span>21-Day Habit Milestone</span>
              </div>
            </div>
          </div>

        </div>

        {/* Live Interactive Hero Mockup */}
        <div className="hero-preview-container">
          <div className="mockup-frame">
            <div className="mockup-top-bar">
              <div className="mockup-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <span className="mockup-url">focuspledge.io/dashboard</span>
              <div className="mockup-live-indicator">
                <span className="live-pulse" /> LIVE SESSION
              </div>
            </div>

            <div className="mockup-body">
              <div className="mockup-sidebar">
                <div className="mockup-profile-chip">
                  <div className="mockup-avatar">AR</div>
                  <div>
                    <div className="mockup-name">Alex Rivera</div>
                    <div className="mockup-tier">Gold Scholar (2.0x)</div>
                  </div>
                </div>
                <div className="mockup-stat-pill">
                  <Flame size={14} color="#f59e0b" />
                  <span>30-Day Streak</span>
                </div>
                <div className="mockup-stat-pill">
                  <Award size={14} color="#818cf8" />
                  <span>2,340 Credits</span>
                </div>
              </div>

              <div className="mockup-main">
                <div className="mockup-timer-card">
                  <div className="timer-badge">ACTIVE FOCUS BLOCK</div>
                  <div className="mockup-timer-clock">48:15</div>
                  <div className="mockup-slot-name">Advanced Calculus Assignment & Proofs</div>
                  <div className="mockup-guard-status">
                    <ShieldCheck size={14} color="#34d399" />
                    <span>Distraction Guard: 8 Addictive Apps Blocked</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works (The 4-Step Protocol) */}
      <section id="how-it-works" className="landing-section">
        <div className="section-header">
          <span className="section-subtitle">THE 4-STEP METHODOLOGY</span>
          <h2 className="section-title">Designed Around Behavioral Neuroplasticity</h2>
          <p className="section-description">
            Traditional planners get abandoned. FocusPledge combines pre-commitment with real-time stakes.
          </p>
        </div>

        <div className="protocol-steps-grid">
          
          <div className="protocol-card">
            <div className="step-number">01</div>
            <div className="step-icon-box bg-indigo">
              <Sparkles size={22} color="#818cf8" />
            </div>
            <h3 className="step-title">"I'm Home" Check-In</h3>
            <p className="step-desc">
              Trigger the habit initiation loop right as you finish your commute. Validates today's streak and loads your schedule.
            </p>
          </div>

          <div className="protocol-card">
            <div className="step-number">02</div>
            <div className="step-icon-box bg-emerald">
              <Calendar size={22} color="#34d399" />
            </div>
            <h3 className="step-title">Self-Schedule Blocks</h3>
            <p className="step-desc">
              Design tailored evening time slots for study, assignments, and refreshing breaks that match your energy rhythm.
            </p>
          </div>

          <div className="protocol-card">
            <div className="step-number">03</div>
            <div className="step-icon-box bg-rose">
              <ShieldAlert size={22} color="#fb7185" />
            </div>
            <h3 className="step-title">Distraction Guard Shield</h3>
            <p className="step-desc">
              If you slip up and open distracting apps during active sessions, behavioral friction intervenes with a -5 credit penalty.
            </p>
          </div>

          <div className="protocol-card">
            <div className="step-number">04</div>
            <div className="step-icon-box bg-amber">
              <Award size={22} color="#f59e0b" />
            </div>
            <h3 className="step-title">Earn Credits & Multipliers</h3>
            <p className="step-desc">
              Stack credits on every completed slot. Climb from Bronze to Silver and Gold, scaling multiplier up to 2.0x!
            </p>
          </div>

        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="landing-section bg-surface-tint">
        <div className="section-header">
          <span className="section-subtitle">PRODUCTIVITY ENGINE</span>
          <h2 className="section-title">Built For Deep Work & Habit Mastery</h2>
        </div>

        <div className="features-showcase-grid">
          
          <div className="feature-box">
            <div className="feature-icon">
              <Clock size={24} color="#6366f1" />
            </div>
            <h4>Active Countdown Timer</h4>
            <p>Visual circular progress display keeps you locked in on single-task execution with high-contrast digits.</p>
          </div>

          <div className="feature-box">
            <div className="feature-icon">
              <Flame size={24} color="#f59e0b" />
            </div>
            <h4>Streak Multiplier Engine</h4>
            <p>Maintain consistent daily focus to unlock 1.2x at Day 3, 1.5x at Day 7, and a massive 2.0x double-rate at Day 30.</p>
          </div>

          <div className="feature-box">
            <div className="feature-icon">
              <Zap size={24} color="#10b981" />
            </div>
            <h4>Full-Day Completion Bonus</h4>
            <p>Complete all scheduled non-break slots in a single evening to trigger an instant +20 credit mastery bonus.</p>
          </div>

          <div className="feature-box">
            <div className="feature-icon">
              <ShieldCheck size={24} color="#38bdf8" />
            </div>
            <h4>Sound & Web Audio Chimes</h4>
            <p>Synthesized harmonic chimes and resonant Tibetan bells provide dopamine reinforcement on task completion.</p>
          </div>

        </div>
      </section>

      {/* Certificate Showcase Section */}
      <section id="certificate" className="landing-section">
        <div className="certificate-banner-card">
          <div className="cert-banner-text">
            <div className="badge-gold">
              <Award size={15} />
              <span>OFFICIAL CREDENTIAL</span>
            </div>
            <h2>Time Management Consistency Certificate</h2>
            <p>
              Hit <strong>Silver Tier (500+ credits)</strong> or sustain a <strong>21-Day Streak</strong> to unlock your verified credential with unique serial numbers, exportable directly to PDF or printable for academic portfolios.
            </p>
            <button
              onClick={() => openAuth(true)}
              className="btn-landing-cta"
              style={{ marginTop: '10px' }}
            >
              <span>Unlock Your Certificate</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="cert-preview-mini">
            <div className="mini-cert-frame">
              <FileCheck2 size={48} color="#d4af37" />
              <span className="mini-cert-title">Consistency Certificate</span>
              <span className="mini-cert-serial">FP-2026-9A82F1</span>
              <div className="mini-cert-stamp">VERIFIED</div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="landing-bottom-cta">
        <div className="bottom-cta-inner">
          <h2>Ready to transform your evening productivity?</h2>
          <p>Join students, engineers, and creators building bulletproof focus habits.</p>
          
          <div className="hero-cta-group" style={{ justifyContent: 'center' }}>
            <button
              onClick={() => openAuth(true)}
              className="btn-hero-primary"
            >
              <span>Get Started Free</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => openAuth(false)}
              className="btn-hero-secondary"
            >
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="brand-logo">
            <div className="brand-icon-box">
              <ShieldCheck size={18} />
            </div>
            <span className="brand-title">Focus<span>Pledge</span></span>
          </div>
          <p>© 2026 FocusPledge Protocol. Crafted for deep work and unstoppable consistency.</p>
        </div>
      </footer>

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
