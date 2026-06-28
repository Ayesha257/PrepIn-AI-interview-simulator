// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-prepin-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-amber tracking-tight">
            PrepIn
          </h1>
          <p className="text-blush/70 mt-1 text-sm">AI Interview Simulator</p>
        </div>

        {/* Card */}
        <div className="bg-navy/80 backdrop-blur-sm border border-purple/40 rounded-2xl p-8 shadow-glow-rose">
          <h2 className="text-white font-display text-2xl font-semibold mb-6">
            Welcome back
          </h2>

          {error && (
            <div className="bg-rose/20 border border-rose/40 text-blush text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-blush/80 text-sm mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full bg-purple/30 border border-purple/50 text-white placeholder-blush/30
                           rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber
                           focus:ring-1 focus:ring-amber/50 transition"
              />
            </div>

            <div>
              <label className="block text-blush/80 text-sm mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full bg-purple/30 border border-purple/50 text-white placeholder-blush/30
                           rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber
                           focus:ring-1 focus:ring-amber/50 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber hover:bg-amber/90 text-navy font-semibold
                         rounded-xl py-3 text-sm transition shadow-glow-amber
                         disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-blush/60 text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-amber hover:text-amber/80 font-medium transition">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
