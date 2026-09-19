import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  Sparkles, 
  ArrowRight, 
  Flame, 
  Award, 
  Eye, 
  EyeOff,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { sound } from '../services/sound';

export default function AuthModal({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isRegister && !name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (isRegister) {
        res = await api.register(name.trim(), email.trim(), password);
      } else {
        res = await api.login(email.trim(), password);
      }

      if (res.success && res.user) {
        sound.playSuccess();
        onAuthSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please check your details.');
        sound.playDistraction();
      }
    } catch (err) {
      setErrorMessage('Could not connect to the server. Please verify backend is running.');
      sound.playDistraction();
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMessage('');
    setDemoLoading(true);
    try {
      const res = await api.demoLogin();
      if (res.success && res.user) {
        sound.playSuccess();
        onAuthSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Failed to initialize demo session.');
      }
    } catch (err) {
      setErrorMessage('Could not connect to the server.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card-wrapper animate-slide-up">
        
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-brand-badge">
            <div className="auth-icon-pulse">
              <ShieldCheck size={28} className="text-indigo-400" />
            </div>
            <h1 className="auth-title">Focus<span>Pledge</span></h1>
          </div>
          <p className="auth-subtitle">
            Personalized Daily Schedules, Anti-Distraction Guard & Gamified Rewards
          </p>
        </div>

        {/* Auth Mode Switcher Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${!isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(false);
              setErrorMessage('');
              sound.playClick();
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(true);
              setErrorMessage('');
              sound.playClick();
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="auth-error-banner">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Jordan Lee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading || demoLoading}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="auth-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || demoLoading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || demoLoading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {isRegister && (
              <span className="form-hint">At least 6 characters required</span>
            )}
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || demoLoading}
          >
            {loading ? (
              <span className="spinner-text">Processing...</span>
            ) : (
              <>
                <span>{isRegister ? 'Create Your Account' : 'Sign In to FocusPledge'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>OR QUICK ACCESS</span>
        </div>

        {/* Demo Login Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          className="demo-login-btn"
          disabled={loading || demoLoading}
        >
          <Sparkles size={18} className="text-amber-400" />
          <span>{demoLoading ? 'Launching Demo...' : 'Instant Demo Login (Alex Rivera)'}</span>
        </button>

        {/* Feature Highlights Pills */}
        <div className="auth-perks">
          <div className="perk-item">
            <Flame size={14} color="#f59e0b" />
            <span>Streak Multipliers</span>
          </div>
          <div className="perk-item">
            <ShieldCheck size={14} color="#10b981" />
            <span>Anti-Distraction</span>
          </div>
          <div className="perk-item">
            <Award size={14} color="#818cf8" />
            <span>Official Certificates</span>
          </div>
        </div>

      </div>
    </div>
  );
}
