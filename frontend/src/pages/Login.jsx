import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { authAPI } from "../services/api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Verification flow states
  const [needsVerification, setNeedsVerification] = useState(false);
  const [code, setCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      if (err.message?.toLowerCase().includes("verify")) {
        // Account exists but not verified — send code and show verification input
        try {
          await authAPI.resendVerification(form.email);
          setNeedsVerification(true);
          setInfoMsg("We've sent a verification code to your email.");
        } catch (resendErr) {
          setError(resendErr.message || "Could not send verification code");
        }
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    setVerifyLoading(true);
    try {
      const data = await authAPI.verifyCode(form.email, code);
      localStorage.setItem("token", data.access_token);
      navigate("/dashboard");
      window.location.reload(); // ensure AuthContext picks up new token
    } catch (err) {
      setError(err.message || "Invalid code");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfoMsg("");
    try {
      await authAPI.resendVerification(form.email);
      setInfoMsg("A new code has been sent to your email.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);
    try {
      const data = await authAPI.googleLogin(credentialResponse.credential);
      localStorage.setItem("token", data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Google login failed");
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
          {needsVerification ? (
            <>
              <h2 className="text-white font-display text-2xl font-semibold mb-2">
                Verify your email
              </h2>
              <p className="text-blush/60 text-sm mb-6">
                Enter the 6-digit code sent to <b>{form.email}</b>
              </p>

              {error && (
                <div className="bg-rose/20 border border-rose/40 text-blush text-sm rounded-lg px-4 py-3 mb-4">
                  {error}
                </div>
              )}
              {infoMsg && (
                <div className="bg-purple/20 border border-purple/40 text-blush text-sm rounded-lg px-4 py-3 mb-4">
                  {infoMsg}
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={verifyLoading}
                  className="w-full bg-amber hover:bg-amber/90 text-navy font-semibold
                             rounded-xl py-3 text-sm transition shadow-glow-amber
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {verifyLoading ? "Verifying..." : "Verify & Continue"}
                </button>
              </form>

              <p className="text-center text-blush/60 text-sm mt-6">
                Didn't get a code?{" "}
                <button onClick={handleResend} className="text-amber hover:text-amber/80 font-medium transition">
                  Resend
                </button>
              </p>
            </>
          ) : (
            <>
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
                  <div className="flex justify-end mt-1.5">
                    <Link to="/reset-password" className="text-amber/80 hover:text-amber text-xs transition">
                      Forgot Password?
                    </Link>
                  </div>
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

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-purple/40" />
                <span className="text-blush/50 text-xs">OR</span>
                <div className="flex-1 h-px bg-purple/40" />
              </div>

              {/* Google Login */}
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google login failed")}
                />
              </div>

              <p className="text-center text-blush/60 text-sm mt-6">
                Don't have an account?{" "}
                <Link to="/register" className="text-amber hover:text-amber/80 font-medium transition">
                  Create one
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}