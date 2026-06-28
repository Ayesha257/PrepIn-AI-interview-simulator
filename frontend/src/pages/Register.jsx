// src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Passwords don't match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-prepin-gradient flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-amber tracking-tight">
            PrepIn
          </h1>
          <p className="text-blush/70 mt-1 text-sm">Start your interview prep journey</p>
        </div>

        <div className="bg-navy/80 backdrop-blur-sm border border-purple/40 rounded-2xl p-8 shadow-glow-rose">
          <h2 className="text-white font-display text-2xl font-semibold mb-6">
            Create account
          </h2>

          {error && (
            <div className="bg-rose/20 border border-rose/40 text-blush text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-blush/80 text-sm mb-1.5">Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ayesha Khan"
                required
                className="w-full bg-purple/30 border border-purple/50 text-white placeholder-blush/30
                           rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber
                           focus:ring-1 focus:ring-amber/50 transition"
              />
            </div>

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
                placeholder="Min. 6 characters"
                required
                className="w-full bg-purple/30 border border-purple/50 text-white placeholder-blush/30
                           rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber
                           focus:ring-1 focus:ring-amber/50 transition"
              />
            </div>

            <div>
              <label className="block text-blush/80 text-sm mb-1.5">Confirm Password</label>
              <input
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                placeholder="Same password again"
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
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-blush/60 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-amber hover:text-amber/80 font-medium transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
