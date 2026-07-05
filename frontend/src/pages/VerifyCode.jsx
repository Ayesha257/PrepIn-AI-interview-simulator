// src/pages/VerifyCode.jsx
import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";

export default function VerifyCode() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authAPI.verifyCode(email, code);
      localStorage.setItem("token", data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg("");
    setError("");
    try {
      await authAPI.resendVerification(email);
      setResendMsg("A new code has been sent to your email.");
    } catch (err) {
      setError(err.message);
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
          <h2 className="text-white font-display text-2xl font-semibold mb-2">
            Verify your email
          </h2>
          <p className="text-blush/60 text-sm mb-6">
            We sent a 6-digit code to <b>{email || "your email"}</b>. Enter it below.
          </p>

          {error && (
            <div className="bg-rose/20 border border-rose/40 text-blush text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}
          {resendMsg && (
            <div className="bg-purple/20 border border-purple/40 text-blush text-sm rounded-lg px-4 py-3 mb-4">
              {resendMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-blush/80 text-sm mb-1.5">Verification Code</label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber hover:bg-amber/90 text-navy font-semibold
                         rounded-xl py-3 text-sm transition shadow-glow-amber
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          <p className="text-center text-blush/60 text-sm mt-6">
            Didn't get a code?{" "}
            <button onClick={handleResend} className="text-amber hover:text-amber/80 font-medium transition">
              Resend
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}