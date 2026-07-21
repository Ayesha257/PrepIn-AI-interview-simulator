// src/services/api.js
const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

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

  verifyCode: (email, code) =>
    apiFetch("/auth/verify-code", { method: "POST", body: JSON.stringify({ email, code }) }),

  resendVerification: (email) =>
    apiFetch(`/auth/resend-verification?email=${encodeURIComponent(email)}`, { method: "POST" }),

  login: (data) =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  googleLogin: (token) =>
    apiFetch("/auth/google-login", { method: "POST", body: JSON.stringify({ token }) }),

  resetPassword: (email, code, newPassword) =>
    apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, code, new_password: newPassword }),
    }),

  getMe: () => apiFetch("/auth/me"),
  forgotPassword: (email) =>
    apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),

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
  createSession: (targetRole, seniorityLevel) =>
    apiFetch("/interview/session", {
      method: "POST",
      body: JSON.stringify({ target_role: targetRole, seniority_level: seniorityLevel }),
    }),

  startInterview: (sessionId) =>
    apiFetch(`/interview/start`, {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    }),

  submitAnswer: (sessionId, userAnswer) =>
    apiFetch(`/interview/answer`, {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, user_answer: userAnswer }),
    }),

  getSession: (sessionId) => apiFetch(`/interview/session/${sessionId}`),
};

// ──────────────── REPORT ────────────────
export const reportAPI = {
  getReport: (sessionId) => apiFetch(`/report/report/${sessionId}`),

  getLatestReport: () => apiFetch("/report/latest"),
};
