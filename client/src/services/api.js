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

// Wrapper for fetch that injects Authorization header
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({ success: false, error: 'Failed to parse response' }));

  if (response.status === 401) {
    // If unauthorized, clear invalid token
    if (token && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      clearToken();
      window.dispatchEvent(new CustomEvent('focuspledge:unauthorized'));
    }
  }

  return data;
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
