import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeCheckIn from './components/HomeCheckIn';
import ScheduleBuilder from './components/ScheduleBuilder';
import ActiveFocusSession from './components/ActiveFocusSession';
import DistractionGuardOverlay from './components/DistractionGuardOverlay';
import Dashboard from './components/Dashboard';
import CertificateView from './components/CertificateView';
import SettingsModal from './components/SettingsModal';
import OnboardingModal from './components/OnboardingModal';
import AuthModal from './components/AuthModal';
import LandingPage from './components/LandingPage';
import { api } from './services/api';
import { sound } from './services/sound';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'schedule' | 'focus' | 'dashboard' | 'certificate'
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(api.isAuthenticated());
  const [schedule, setSchedule] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [certificateStatus, setCertificateStatus] = useState(null);
  const [activeSlot, setActiveSlot] = useState(null);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [distractionModal, setDistractionModal] = useState({
    isOpen: false,
    distractionName: ''
  });

  const [loading, setLoading] = useState(true);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAppData = async () => {
    try {
      const [userRes, schedRes, dashRes, certRes] = await Promise.all([
        api.getUser(),
        api.getTodaySchedule(),
        api.getDashboard(),
        api.getCertificateStatus()
      ]);

      if (userRes.success) {
        setUser(userRes.user);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      if (schedRes.success) {
        setSchedule(schedRes.schedule);
        const inProg = (schedRes.schedule?.slots || []).find(s => s.status === 'in_progress');
        setActiveSlot(inProg || null);
      }
      if (dashRes.success) setDashboardData(dashRes);
      if (certRes.success) setCertificateStatus(certRes);
    } catch (err) {
      console.error('Error fetching app data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initiate background warm-up for Render API
    api.warmUp();

    if (api.isAuthenticated()) {
      loadAppData();
    } else {
      setLoading(false);
      setIsAuthenticated(false);
    }

    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setUser(null);
      showToast('Session expired. Please sign in again.', 'warning');
    };

    window.addEventListener('focuspledge:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('focuspledge:unauthorized', handleUnauthorized);
    };
  }, []);

  const handleAuthSuccess = async (authUser) => {
    setUser(authUser);
    setIsAuthenticated(true);
    setLoading(true);
    await loadAppData();
    showToast(`Welcome to FocusPledge, ${authUser.name}!`, 'success');
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setIsAuthenticated(false);
    setSchedule(null);
    setDashboardData(null);
    setCertificateStatus(null);
    setActiveSlot(null);
    showToast('You have been logged out safely.', 'info');
  };

  const handleCheckIn = async () => {
    try {
      const res = await api.checkIn();
      if (res.success) {
        setUser(res.user);
        await loadAppData();
        showToast(res.message, 'success');
        return res;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSlot = async (slotData) => {
    try {
      const res = await api.addSlot(slotData);
      if (res.success) {
        setSchedule(res.schedule);
        showToast(`Slot "${slotData.title}" added to pledge!`, 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSlot = async (slotId, slotData) => {
    try {
      const res = await api.updateSlot(slotId, slotData);
      if (res.success) {
        setSchedule(res.schedule);
        showToast('Slot updated successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      const res = await api.deleteSlot(slotId);
      if (res.success) {
        setSchedule(res.schedule);
        showToast('Slot removed from pledge.', 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartFocus = async (slot) => {
    try {
      const res = await api.startFocus(slot._id);
      if (res.success) {
        setSchedule(res.schedule);
        setActiveSlot(res.slot);
        setCurrentTab('focus');
        showToast(`Focus Guard active: ${slot.title}`, 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteFocus = async (slotId) => {
    try {
      const res = await api.completeFocus(slotId);
      if (res.success) {
        setUser(res.user);
        setSchedule(res.schedule);
        setActiveSlot(null);
        await loadAppData();

        let msg = `🎉 Focus session complete! Earned +${res.creditsEarned} credits (${res.multiplier}x multiplier).`;
        if (res.fullDayBonusAwarded) {
          msg += ' 🌟 FULL-DAY BONUS (+20 pts)!';
        }
        showToast(msg, 'success');
        setCurrentTab('dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAbandonFocus = async (slotId) => {
    try {
      const res = await api.abandonFocus(slotId);
      if (res.success) {
        setSchedule(res.schedule);
        setActiveSlot(null);
        showToast('Session abandoned.', 'warning');
        setCurrentTab('schedule');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerDistraction = (distractionName) => {
    setDistractionModal({
      isOpen: true,
      distractionName
    });
  };

  const handleAcceptPenalty = async (distractionName) => {
    try {
      setDistractionModal({ isOpen: false, distractionName: '' });
      const res = await api.recordPenalty(activeSlot?._id, distractionName);
      if (res.success) {
        setUser(res.user);
        if (res.slot && schedule) {
          const updatedSlots = (schedule.slots || []).map(s => s._id === res.slot._id ? res.slot : s);
          setSchedule({ ...schedule, slots: updatedSlots });
        }
        await loadAppData();
        showToast(`⚠️ Distraction penalty: -5 credits applied.`, 'warning');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturnToFocus = () => {
    setDistractionModal({ isOpen: false, distractionName: '' });
    showToast('🛡️ Shield held! Zero penalty applied.', 'success');
  };

  // If not authenticated, render the LandingPage
  if (!isAuthenticated && !loading) {
    return (
      <div className="app-container">
        <LandingPage onAuthSuccess={handleAuthSuccess} />
        {toast && (
          <div className="toast-floating" style={{
            borderColor: toast.type === 'success' ? '#10b981' : toast.type === 'warning' ? '#f43f5e' : '#6366f1',
            color: toast.type === 'success' ? '#34d399' : toast.type === 'warning' ? '#fb7185' : '#818cf8'
          }}>
            {toast.type === 'success' && <CheckCircle2 size={18} />}
            {toast.type === 'warning' && <AlertTriangle size={18} />}
            {toast.type === 'info' && <Info size={18} />}
            <span style={{ color: '#f8fafc' }}>{toast.message}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={handleLogout}
        activeSlot={activeSlot}
      />

      {/* Main Content */}
      <main className="main-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#fda4af', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', border: '2px solid rgba(225,29,72,0.2)', borderTopColor: '#e11d48', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span>Connecting to Kyoto Sanctuary...</span>
          </div>
        ) : (
          <>
            {currentTab === 'home' && (
              <HomeCheckIn
                user={user}
                schedule={schedule}
                onCheckIn={handleCheckIn}
                onNavigate={(tab) => setCurrentTab(tab)}
                onStartFocus={handleStartFocus}
              />
            )}

            {currentTab === 'schedule' && (
              <ScheduleBuilder
                schedule={schedule}
                onAddSlot={handleAddSlot}
                onUpdateSlot={handleUpdateSlot}
                onDeleteSlot={handleDeleteSlot}
                onStartFocus={handleStartFocus}
                onNavigate={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'focus' && (
              <ActiveFocusSession
                slot={activeSlot}
                user={user}
                onComplete={handleCompleteFocus}
                onAbandon={handleAbandonFocus}
                onTriggerDistraction={handleTriggerDistraction}
                onNavigate={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'dashboard' && (
              <Dashboard
                dashboardData={dashboardData}
                user={user}
                schedule={schedule}
                onNavigate={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'certificate' && (
              <CertificateView
                user={user}
                certificateStatus={certificateStatus}
                onRefreshUser={loadAppData}
                onNavigate={(tab) => setCurrentTab(tab)}
              />
            )}
          </>
        )}
      </main>

      {/* Distraction Overlay */}
      <DistractionGuardOverlay
        isOpen={distractionModal.isOpen}
        distractionName={distractionModal.distractionName}
        slot={activeSlot}
        onReturnToFocus={handleReturnToFocus}
        onAcceptPenalty={handleAcceptPenalty}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
        onRefreshUser={loadAppData}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="toast-floating" style={{
          borderColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : toast.type === 'warning' ? 'rgba(225, 29, 72, 0.5)' : 'rgba(217, 119, 6, 0.4)',
          color: toast.type === 'success' ? '#34d399' : toast.type === 'warning' ? '#fb7185' : '#fcd34d'
        }}>
          {toast.type === 'success' && <CheckCircle2 size={16} />}
          {toast.type === 'warning' && <AlertTriangle size={16} />}
          {toast.type === 'info' && <Info size={16} />}
          <span style={{ color: '#f8fafc' }}>{toast.message}</span>
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '20px 24px', textAlign: 'center', fontSize: '0.78rem', color: '#64748b', background: 'rgba(5, 8, 14, 0.85)' }}>
        <div style={{ maxWidth: '1060px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span>FocusPledge © 2026 — Self-Scheduling Kyoto Focus & Habit Protocol</span>
          <button onClick={() => setOnboardingOpen(true)} style={{ color: '#fda4af', fontWeight: 600 }}>
            Sanctuary Rules & How It Works
          </button>
        </div>
      </footer>

    </div>
  );
}
