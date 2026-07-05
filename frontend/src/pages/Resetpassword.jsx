// src/pages/ResetPassword.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(email, code, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-prepin-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-amber tracking-tight">
            PrepIn
          </h1>
        </div>

        <div className="bg-navy/80 backdrop-blur-sm border border-purple/40 rounded-2xl p-8 shadow-glow-rose">
          {success ? (
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-white font-display text-xl font-semibold mb-2">
                Password reset successfully!
              </h2>
              <p className="text-blush/60 text-sm">Redirecting to login...</p>
            </div>
          ) : (
            <>
              <h2 className="text-white font-display text-2xl font-semibold mb-6">
                Reset Password
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-purple/30 border border-purple/50 text-white placeholder-blush/30
                               rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber
                               focus:ring-1 focus:ring-amber/50 transition"
                  />
                </div>

                <div>
                  <label className="block text-blush/80 text-sm mb-1.5">Reset Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    required
                    className="w-full bg-purple/30 border border-purple/50 text-white placeholder-blush/30
                               rounded-xl px-4 py-3 text-sm text-center tracking-[0.5em] focus:outline-none
                               focus:border-amber focus:ring-1 focus:ring-amber/50 transition"
                  />
                </div>

                <div>
                  <label className="block text-blush/80 text-sm mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-blush/60 text-sm mt-6">
            <Link to="/login" className="text-amber hover:text-amber/80 font-medium transition">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}