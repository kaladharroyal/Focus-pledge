const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` 
  : (import.meta.env.PROD ? 'https://focuspledge-api.onrender.com/api' : '/api');

const TOKEN_KEY = 'focuspledge_auth_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

const MOCK_USER = {
  _id: 'usr_demo_kyoto_2026',
  name: 'Ronin Scholar',
  email: 'ronin@focuspledge.io',
  currentStreak: 7,
  highestStreak: 14,
  totalCredits: 380,
  level: 'Silver',
  lastCheckInDate: '',
  settings: {
    blockedApps: ['Instagram', 'YouTube', 'TikTok', 'Reddit', 'Netflix', 'Twitter (X)']
  }
};

const MOCK_SCHEDULE = {
  _id: 'sched_today',
  date: new Date().toISOString().split('T')[0],
  slots: [
    { _id: 's1', title: 'Algorithms & Calculus Sets', category: 'study', startTime: '17:00', endTime: '18:15', durationMinutes: 75, status: 'pending', creditsEarned: 0, distractionsAttempted: 0 },
    { _id: 's2', title: 'Zen Tea Recharge', category: 'break', startTime: '18:15', endTime: '18:45', durationMinutes: 30, status: 'pending', creditsEarned: 0, distractionsAttempted: 0 },
    { _id: 's3', title: 'Deep Systems & React Coding', category: 'homework', startTime: '18:45', endTime: '20:00', durationMinutes: 75, status: 'pending', creditsEarned: 0, distractionsAttempted: 0 }
  ]
};

const MOCK_DASHBOARD = {
  success: true,
  stats: {
    totalCredits: 380,
    currentStreak: 7,
    highestStreak: 14,
    streakMultiplier: 1.5,
    level: 'Silver',
    progressPercent: 76,
    completedSlotsCount: 18,
    distractionsBlockedCount: 32,
    certificateUnlocked: true
  },
  weeklyData: [
    { day: 'Mon', credits: 45 },
    { day: 'Tue', credits: 60 },
    { day: 'Wed', credits: 30 },
    { day: 'Thu', credits: 75 },
    { day: 'Fri', credits: 50 },
    { day: 'Sat', credits: 90 },
    { day: 'Sun', credits: 30 }
  ],
  badgesCatalog: [
    { id: 'b1', name: 'Sanmon Threshold', icon: '⛩️', description: 'First evening check-in completed.', unlocked: true },
    { id: 'b2', name: 'Seven-Day Blade', icon: '⚔️', description: '7 unbroken days of focus blocks.', unlocked: true },
    { id: 'b3', name: 'Distraction Warden', icon: '🛡️', description: 'Shield held against 25 breaches.', unlocked: true },
    { id: 'b4', name: 'Master Hatamoto', icon: '👑', description: 'Attain Gold Scholar 2000 credits.', unlocked: false }
  ],
  recentLogs: [
    { _id: 'l1', reason: 'Focus Block Completed (+15 pts with 1.5x)', amount: 15, resultingTotal: 380, createdAt: new Date().toISOString() },
    { _id: 'l2', reason: 'Daily Check-In Pledge Sealed (+5 pts)', amount: 5, resultingTotal: 365, createdAt: new Date(Date.now() - 3600000).toISOString() }
  ]
};

const MOCK_CERTIFICATE = {
  success: true,
  isEligible: true,
  certificate: {
    certificateId: 'FP-2026-KYOTO-8F92',
    issueDate: new Date().toISOString()
  }
};

// Wrapper for fetch with offline fallback
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => null);

    if (response.status === 401) {
      if (token && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        clearToken();
        window.dispatchEvent(new CustomEvent('focuspledge:unauthorized'));
      }
    }

    if (data && data.success) {
      return data;
    }

    // If API returned failure/HTML fallback, fallback to mock data
    throw new Error('API unavailable');
  } catch (netErr) {
    // Graceful offline mock fallback
    if (endpoint === '/auth/demo' || endpoint === '/auth/login' || endpoint === '/auth/register') {
      const mockUser = { ...MOCK_USER, name: (options.body ? JSON.parse(options.body).name : null) || 'Ronin Scholar' };
      setToken('demo_jwt_token_local');
      localStorage.setItem('focuspledge_local_user', JSON.stringify(mockUser));
      return { success: true, token: 'demo_jwt_token_local', user: mockUser };
    }
    if (endpoint === '/user' || endpoint === '/auth/me') {
      const saved = localStorage.getItem('focuspledge_local_user');
      const user = saved ? JSON.parse(saved) : MOCK_USER;
      return { success: true, user };
    }
    if (endpoint === '/user/checkin') {
      const saved = localStorage.getItem('focuspledge_local_user');
      const user = saved ? JSON.parse(saved) : { ...MOCK_USER };
      user.lastCheckInDate = new Date().toISOString().split('T')[0];
      user.currentStreak += 1;
      user.totalCredits += 10;
      localStorage.setItem('focuspledge_local_user', JSON.stringify(user));
      return { success: true, user, message: '🔥 Evening sanctuary activated. Welcome home, warrior.' };
    }
    if (endpoint === '/schedules/today') {
      const savedSched = localStorage.getItem('focuspledge_local_sched');
      const schedule = savedSched ? JSON.parse(savedSched) : MOCK_SCHEDULE;
      return { success: true, schedule };
    }
    if (endpoint === '/schedules/slots' && options.method === 'POST') {
      const newSlot = { ...JSON.parse(options.body), _id: `s_${Date.now()}`, status: 'pending', creditsEarned: 0, distractionsAttempted: 0 };
      const savedSched = localStorage.getItem('focuspledge_local_sched');
      const schedule = savedSched ? JSON.parse(savedSched) : { ...MOCK_SCHEDULE };
      schedule.slots = [...schedule.slots, newSlot];
      localStorage.setItem('focuspledge_local_sched', JSON.stringify(schedule));
      return { success: true, schedule };
    }
    if (endpoint.startsWith('/schedules/slots/') && options.method === 'DELETE') {
      const slotId = endpoint.split('/').pop();
      const savedSched = localStorage.getItem('focuspledge_local_sched');
      const schedule = savedSched ? JSON.parse(savedSched) : { ...MOCK_SCHEDULE };
      schedule.slots = schedule.slots.filter(s => s._id !== slotId);
      localStorage.setItem('focuspledge_local_sched', JSON.stringify(schedule));
      return { success: true, schedule };
    }
    if (endpoint === '/focus/start') {
      const { slotId } = JSON.parse(options.body);
      const savedSched = localStorage.getItem('focuspledge_local_sched');
      const schedule = savedSched ? JSON.parse(savedSched) : { ...MOCK_SCHEDULE };
      schedule.slots = schedule.slots.map(s => s._id === slotId ? { ...s, status: 'in_progress' } : s);
      const slot = schedule.slots.find(s => s._id === slotId);
      localStorage.setItem('focuspledge_local_sched', JSON.stringify(schedule));
      return { success: true, schedule, slot };
    }
    if (endpoint === '/focus/complete') {
      const { slotId } = JSON.parse(options.body);
      const savedSched = localStorage.getItem('focuspledge_local_sched');
      const schedule = savedSched ? JSON.parse(savedSched) : { ...MOCK_SCHEDULE };
      schedule.slots = schedule.slots.map(s => s._id === slotId ? { ...s, status: 'completed', creditsEarned: 15 } : s);
      localStorage.setItem('focuspledge_local_sched', JSON.stringify(schedule));
      const saved = localStorage.getItem('focuspledge_local_user');
      const user = saved ? JSON.parse(saved) : { ...MOCK_USER };
      user.totalCredits += 15;
      localStorage.setItem('focuspledge_local_user', JSON.stringify(user));
      return { success: true, schedule, user, creditsEarned: 15, multiplier: 1.5, fullDayBonusAwarded: true };
    }
    if (endpoint === '/gamification/dashboard') {
      return MOCK_DASHBOARD;
    }
    if (endpoint === '/certificate/status') {
      return MOCK_CERTIFICATE;
    }

    return { success: false, error: 'Offline mode active' };
  }
}

export const api = {
  // Silent health check / warm-up ping for cold-starting backends
  warmUp: () => {
    fetch(`${API_BASE.replace(/\/api$/, '')}/api/health`, { method: 'GET' }).catch(() => {});
  },

  // Auth helpers
  getToken,
  setToken,
  clearToken,
  isAuthenticated: () => Boolean(getToken()),

  // Auth Endpoints
  register: async (name, email, password) => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    if (res.success && res.token) {
      setToken(res.token);
    }
    return res;
  },

  login: async (email, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.success && res.token) {
      setToken(res.token);
    }
    return res;
  },

  demoLogin: async () => {
    const res = await request('/auth/demo', {
      method: 'POST'
    });
    if (res.success && res.token) {
      setToken(res.token);
    }
    return res;
  },

  getMe: async () => {
    return request('/auth/me');
  },

  logout: () => {
    clearToken();
  },

  // User & Checkin
  getUser: async () => {
    return request('/user');
  },

  checkIn: async () => {
    return request('/user/checkin', { method: 'POST' });
  },

  updateProfile: async (data) => {
    return request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Schedules & Slots
  getTodaySchedule: async () => {
    return request('/schedules/today');
  },

  addSlot: async (slotData) => {
    return request('/schedules/slots', {
      method: 'POST',
      body: JSON.stringify(slotData)
    });
  },

  updateSlot: async (slotId, slotData) => {
    return request(`/schedules/slots/${slotId}`, {
      method: 'PUT',
      body: JSON.stringify(slotData)
    });
  },

  deleteSlot: async (slotId) => {
    return request(`/schedules/slots/${slotId}`, {
      method: 'DELETE'
    });
  },

  // Focus Sessions & Penalties
  startFocus: async (slotId) => {
    return request('/focus/start', {
      method: 'POST',
      body: JSON.stringify({ slotId })
    });
  },

  completeFocus: async (slotId) => {
    return request('/focus/complete', {
      method: 'POST',
      body: JSON.stringify({ slotId })
    });
  },

  recordPenalty: async (slotId, distractionName) => {
    return request('/focus/penalty', {
      method: 'POST',
      body: JSON.stringify({ slotId, distractionName })
    });
  },

  abandonFocus: async (slotId) => {
    return request('/focus/abandon', {
      method: 'POST',
      body: JSON.stringify({ slotId })
    });
  },

  // Gamification & Dashboard
  getDashboard: async () => {
    return request('/gamification/dashboard');
  },

  getCreditLogs: async () => {
    return request('/gamification/logs');
  },

  // Certificate
  getCertificateStatus: async () => {
    return request('/certificate/status');
  },

  issueCertificate: async (recipientName) => {
    return request('/certificate/issue', {
      method: 'POST',
      body: JSON.stringify({ recipientName })
    });
  },

  verifyCertificate: async (certId) => {
    return request(`/certificate/verify/${certId}`);
  }
};
