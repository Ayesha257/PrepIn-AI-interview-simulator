import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Mail, KeyRound, Lock, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { authAPI } from "../services/api";

// ---------- Neural network canvas background (same as Login) ----------
function NeuralBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    let w, h;
    const NODE_COUNT = 40;
    let nodes = [];

    function resize() {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.5 + 0.8,
    }));

    function onMove(e) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }
    window.addEventListener("mousemove", onMove);

    function tick() {
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        const dx = mouseRef.current.x - n.x;
        const dy = mouseRef.current.y - n.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120) {
          n.x -= dx * 0.004;
          n.y -= dy * 0.004;
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.strokeStyle = `rgba(237,158,89,${0.12 * (1 - d / 130)})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(233,140,185,0.5)";
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// ---------- Cursor-reactive spotlight ----------
function CursorSpotlight() {
  const ref = useRef(null);
  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    function onMove(e) {
      if (ref.current) {
        ref.current.style.setProperty("--x", `${e.clientX}px`);
        ref.current.style.setProperty("--y", `${e.clientY}px`);
      }
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 z-0 hidden sm:block"
      style={{
        background:
          "radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(237,158,89,0.05), transparent 70%)",
      }}
    />
  );
}

// ---------- Scanning line ----------
function ScanLine() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 h-full overflow-hidden z-0">
      <div className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-amber/[0.04] to-transparent animate-scan" />
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-30%); }
          100% { transform: translateY(130%); }
        }
        .animate-scan { animation: scan 7s linear infinite; }
      `}</style>
    </div>
  );
}

// ---------- Magnetic button ----------
function MagneticButton({ children, className, disabled, ...props }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 20 });
  const sy = useSpring(y, { stiffness: 300, damping: 20 });

  function onMove(e) {
    if (window.matchMedia("(hover: none)").matches) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set(relX * 0.12);
    y.set(relY * 0.25);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.96 }}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// ---------- Premium input (same as Login) ----------
function Field({ icon: Icon, label, type = "text", name, value, onChange, showToggle, showValue, onToggle, maxLength, inputMode, center }) {
  const [focused, setFocused] = useState(false);
  const hasValue = value?.length > 0;

  return (
    <div className="relative rounded-xl p-[1px] overflow-hidden">
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500"
        style={{
          opacity: focused ? 1 : 0,
          background: "linear-gradient(90deg, transparent, rgba(237,158,89,0.6), transparent)",
          backgroundSize: "200% 100%",
          animation: focused ? "shimmerSlide 2.5s linear infinite" : "none",
        }}
      />
      <div
        className={`relative flex items-center rounded-xl border transition-colors duration-300
                   ${focused ? "border-white/[0.02] bg-white/[0.06]" : "border-white/10 bg-white/[0.03]"}`}
      >
        <Icon size={16} className={`absolute left-4 transition-colors duration-300 flex-shrink-0 ${focused ? "text-amber" : "text-blush/30"}`} />
        <input
          type={showToggle ? (showValue ? "text" : "password") : type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder=" "
          maxLength={maxLength}
          inputMode={inputMode}
          required
          className={`peer w-full bg-transparent text-white text-sm rounded-xl pl-11 pr-11 pt-5 pb-2 focus:outline-none min-w-0
                     ${center ? "text-center tracking-[0.4em]" : ""}`}
        />
        <label
          className={`absolute left-11 transition-all duration-300 pointer-events-none
                     ${focused || hasValue ? "top-1.5 text-[10px] text-amber/80 font-medium tracking-wide" : "top-1/2 -translate-y-1/2 text-sm text-blush/40"}`}
        >
          {label}
        </label>
        {showToggle && (
          <button type="button" tabIndex={-1} onClick={onToggle} className="absolute right-4 text-blush/30 hover:text-blush/60 transition-colors duration-200 flex-shrink-0">
            {showValue ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      <style>{`
        @keyframes shimmerSlide {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export default function ResetPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState("request"); // "request" | "reset"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const panelRef = useRef(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 150, damping: 20 });
  const sry = useSpring(ry, { stiffness: 150, damping: 20 });

  function handlePanelMove(e) {
    if (window.matchMedia("(hover: none)").matches || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * 8);
    rx.set(-py * 8);
  }
  function handlePanelLeave() {
    rx.set(0);
    ry.set(0);
  }

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMsg("");
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setInfoMsg("If an account exists with this email, a reset code has been sent.");
      setStep("reset");
    } catch (err) {
      setError(err.message || "Could not send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(email, code, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfoMsg("");
    try {
      await authAPI.forgotPassword(email);
      setInfoMsg("A new code has been sent to your email.");
    } catch (err) {
      setError(err.message || "Could not resend code");
    }
  };

  return (
    <div className="relative min-h-screen bg-[#05040a] overflow-x-hidden">
      <NeuralBackground />
      <CursorSpotlight />
      <ScanLine />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-[420px]" style={{ perspective: 1200 }}>
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6"
          >
            <h1 className="font-display text-3xl font-bold text-amber tracking-tight">PrepIn</h1>
            <p className="text-blush/50 mt-1 text-sm">AI Interview Simulator</p>
          </motion.div>

          <motion.div
            ref={panelRef}
            onMouseMove={handlePanelMove}
            onMouseLeave={handlePanelLeave}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" }}
            className="relative rounded-3xl border border-white/10 bg-white/[0.045] backdrop-blur-2xl
                       shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 sm:p-8"
          >
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="mx-auto mb-4 w-14 h-14 rounded-full bg-amber/10 border border-amber/30 flex items-center justify-center"
                  >
                    <Check size={26} className="text-amber" />
                  </motion.div>
                  <h2 className="text-white font-display text-xl font-semibold mb-2">
                    Password reset successfully
                  </h2>
                  <p className="text-blush/50 text-sm">Redirecting to login...</p>
                </motion.div>
              ) : step === "request" ? (
                <motion.div
                  key="request"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-blush/40 text-xs uppercase tracking-[0.2em] mb-1">Trouble signing in?</p>
                  <h2 className="text-white font-display text-2xl font-semibold mb-2">Forgot password</h2>
                  <p className="text-blush/50 text-sm mb-6">
                    Enter your email and we'll send you a reset code.
                  </p>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl px-4 py-3 mb-4"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleRequestCode} className="space-y-4">
                    <Field
                      icon={Mail}
                      label="Email"
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />

                    <MagneticButton
                      type="submit"
                      disabled={loading}
                      className="w-full bg-amber text-navy font-semibold rounded-xl py-3 text-sm mt-2
                                 flex items-center justify-center gap-2 transition-shadow duration-300
                                 hover:shadow-[0_0_30px_rgba(237,158,89,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <><Loader2 size={15} className="animate-spin" /> Sending</>
                      ) : (
                        "Send reset code"
                      )}
                    </MagneticButton>
                  </form>

                  <p className="text-center text-blush/50 text-sm mt-6">
                    <Link to="/login" className="text-amber hover:text-amber/80 font-medium transition-colors duration-200">
                      Back to login
                    </Link>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="reset"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-blush/40 text-xs uppercase tracking-[0.2em] mb-1">Almost there</p>
                  <h2 className="text-white font-display text-2xl font-semibold mb-2">Reset password</h2>
                  <p className="text-blush/50 text-sm mb-6 break-words">
                    Enter the code sent to <span className="text-blush/80">{email}</span> and choose a new password.
                  </p>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl px-4 py-3 mb-4"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {infoMsg && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-purple-500/10 border border-purple-500/20 text-blush/80 text-sm rounded-xl px-4 py-3 mb-4"
                    >
                      {infoMsg}
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Field
                      icon={KeyRound}
                      label="Reset code"
                      type="text"
                      name="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      inputMode="numeric"
                      center
                    />

                    <Field
                      icon={Lock}
                      label="New password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      showToggle
                      showValue={showPassword}
                      onToggle={() => setShowPassword((v) => !v)}
                    />

                    <Field
                      icon={Lock}
                      label="Confirm password"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      showToggle
                      showValue={showConfirm}
                      onToggle={() => setShowConfirm((v) => !v)}
                    />

                    <MagneticButton
                      type="submit"
                      disabled={loading}
                      className="w-full bg-amber text-navy font-semibold rounded-xl py-3 text-sm mt-2
                                 flex items-center justify-center gap-2 transition-shadow duration-300
                                 hover:shadow-[0_0_30px_rgba(237,158,89,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <><Loader2 size={15} className="animate-spin" /> Resetting</>
                      ) : (
                        "Reset password"
                      )}
                    </MagneticButton>
                  </form>

                  <p className="text-center text-blush/50 text-xs mt-5">
                    Didn't get a code?{" "}
                    <button onClick={handleResend} className="text-amber hover:text-amber/80 font-medium transition-colors duration-200">
                      Resend
                    </button>
                  </p>

                  <p className="text-center text-blush/50 text-sm mt-4">
                    <Link to="/login" className="text-amber hover:text-amber/80 font-medium transition-colors duration-200">
                      Back to login
                    </Link>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}