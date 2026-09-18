const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` 
  : '/api';

export const api = {
  // User & Checkin
  getUser: async () => {
    const res = await fetch(`${API_BASE}/user`);
    return res.json();
  },
  checkIn: async () => {
    const res = await fetch(`${API_BASE}/user/checkin`, { method: 'POST' });
    return res.json();
  },
  updateProfile: async (data) => {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  simulateStreak: async (targetStreak, targetCredits) => {
    const res = await fetch(`${API_BASE}/user/simulate-streak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetStreak, targetCredits })
    });
    return res.json();
  },

  // Schedules & Slots
  getTodaySchedule: async () => {
    const res = await fetch(`${API_BASE}/schedules/today`);
    return res.json();
  },
  addSlot: async (slotData) => {
    const res = await fetch(`${API_BASE}/schedules/slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slotData)
    });
    return res.json();
  },
  updateSlot: async (slotId, slotData) => {
    const res = await fetch(`${API_BASE}/schedules/slots/${slotId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slotData)
    });
    return res.json();
  },
  deleteSlot: async (slotId) => {
    const res = await fetch(`${API_BASE}/schedules/slots/${slotId}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Focus Sessions & Penalties
  startFocus: async (slotId) => {
    const res = await fetch(`${API_BASE}/focus/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId })
    });
    return res.json();
  },
  completeFocus: async (slotId) => {
    const res = await fetch(`${API_BASE}/focus/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId })
    });
    return res.json();
  },
  recordPenalty: async (slotId, distractionName) => {
    const res = await fetch(`${API_BASE}/focus/penalty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId, distractionName })
    });
    return res.json();
  },
  abandonFocus: async (slotId) => {
    const res = await fetch(`${API_BASE}/focus/abandon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId })
    });
    return res.json();
  },

  // Gamification & Dashboard
  getDashboard: async () => {
    const res = await fetch(`${API_BASE}/gamification/dashboard`);
    return res.json();
  },
  getCreditLogs: async () => {
    const res = await fetch(`${API_BASE}/gamification/logs`);
    return res.json();
  },

  // Certificate
  getCertificateStatus: async () => {
    const res = await fetch(`${API_BASE}/certificate/status`);
    return res.json();
  },
  issueCertificate: async (recipientName) => {
    const res = await fetch(`${API_BASE}/certificate/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientName })
    });
    return res.json();
  },
  verifyCertificate: async (certId) => {
    const res = await fetch(`${API_BASE}/certificate/verify/${certId}`);
    return res.json();
  }
};
