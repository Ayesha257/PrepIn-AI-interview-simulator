// src/services/api.js
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

// Helper to get token from localStorage
const getToken = () => localStorage.getItem("token");

// Generic fetch wrapper
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
  };

  // Add auth header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Something went wrong" }));
    throw new Error(err.detail || "Request failed");
  }

  if (res.status === 204) return null;
  return res.json();
}

// ──────────────── AUTH ────────────────
export const authAPI = {
  register: (data) =>
    apiFetch("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data) =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  googleLogin: (token) =>
    apiFetch("/auth/google-login", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  verifyEmail: (token) =>
    apiFetch(`/auth/verify-email?token=${token}`, { method: "GET" }),

  getMe: () => apiFetch("/auth/me"),

  updateProfile: (data) =>
    apiFetch("/auth/profile", { method: "PUT", body: JSON.stringify(data) }),
};

// ──────────────── RESUME ────────────────
export const resumeAPI = {
  upload: (file) => {
    const form = new FormData();
    form.append("file", file);
    return apiFetch("/resume/upload", { method: "POST", body: form });
  },

  getMyResumes: () => apiFetch("/resume/my"),

  getResume: (id) => apiFetch(`/resume/${id}`),

  deleteResume: (id) => apiFetch(`/resume/${id}`, { method: "DELETE" }),
};

// ──────────────── ANALYTICS ────────────────
export const analyticsAPI = {
  getDashboard: () => apiFetch("/analytics/dashboard"),
  getHistory: () => apiFetch("/analytics/history"),
  getTrend: () => apiFetch("/analytics/trend"),
};

// ──────────────── INTERVIEW ────────────────
export const interviewAPI = {
  createSession: () =>
    apiFetch("/interview/session", { method: "POST" }),

  startInterview: (sessionId) =>
    apiFetch(`/interview/start?session_id=${sessionId}`, { method: "POST" }),

  submitAnswer: (sessionId, userAnswer) =>
    apiFetch(
      `/interview/answer?session_id=${sessionId}&user_answer=${encodeURIComponent(userAnswer)}`,
      { method: "POST" }
    ),

  getSession: (sessionId) => apiFetch(`/interview/session/${sessionId}`),
};