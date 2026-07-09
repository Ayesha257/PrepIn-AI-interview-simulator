import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Check, Sparkles, Brain, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { authAPI } from "../services/api";

// ---------- Neural network canvas background ----------
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

// ---------- Cursor-reactive spotlight (desktop only, avoids mobile jank) ----------
function CursorSpotlight() {
  const ref = useRef(null);
  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return; // skip on touch devices
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

// ---------- Floating glass badge ----------
function FloatingBadge({ icon: Icon, text, className, delay = 0, floatDelay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      className={`absolute ${className}`}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: floatDelay }}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04]
                   backdrop-blur-md px-3.5 py-2 xl:px-4 shadow-lg"
      >
        <Icon size={13} className="text-amber flex-shrink-0" />
        <span className="text-[11px] text-blush/70 font-medium whitespace-nowrap">{text}</span>
      </motion.div>
    </motion.div>
  );
}

// ---------- Word-by-word gradient heading ----------
function CinematicHeading() {
  const words = ["Ace", "your", "next", "interview."];
  return (
    <h1 className="font-display text-4xl xl:text-5xl 2xl:text-6xl font-bold leading-[1.05] mb-4">
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: 0.15 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block mr-3 bg-clip-text text-transparent bg-gradient-to-br from-white via-blush/90 to-amber/80"
        >
          {w}
        </motion.span>
      ))}
    </h1>
  );
}

// ---------- Magnetic button (mouse-follow disabled on touch) ----------
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

// ---------- Premium input ----------
function Field({ icon: Icon, label, type = "text", name, value, onChange, showToggle, showValue, onToggle }) {
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
          required
          className="peer w-full bg-transparent text-white text-sm rounded-xl pl-11 pr-11 pt-5 pb-2 focus:outline-none min-w-0"
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

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [needsVerification, setNeedsVerification] = useState(false);
  const [code, setCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  const panelRef = useRef(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 150, damping: 20 });
  const sry = useSpring(ry, { stiffness: 150, damping: 20 });

  function handlePanelMove(e) {
    if (window.innerWidth < 1280 || window.matchMedia("(hover: none)").matches || !panelRef.current) return;
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
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 500);
    } catch (err) {
      setLoading(false);
      if (err.message?.toLowerCase().includes("verify")) {
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
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    setVerifyLoading(true);
    try {
      const data = await authAPI.verifyCode(form.email, code);
      localStorage.setItem("token", data.access_token);
      setSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
        window.location.reload();
      }, 500);
    } catch (err) {
      setError(err.message || "Invalid code");
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
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 500);
    } catch (err) {
      setError(err.message || "Google login failed");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#05040a] overflow-x-hidden">
      <NeuralBackground />
      <CursorSpotlight />
      <ScanLine />

      <div className="relative z-10 min-h-screen flex flex-col xl:flex-row">
        {/* LEFT — cinematic storytelling (xl+ only, avoids cramped laptop overlap) */}
        <div className="hidden xl:flex xl:w-[54%] relative items-center px-12 xl:px-16 2xl:px-24 py-10">
          <div className="max-w-lg">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 mb-8"
            >
              <Brain size={13} className="text-amber flex-shrink-0" />
              <span className="text-[11px] text-blush/60 tracking-wide">AI-powered mock interviews</span>
            </motion.div>

            <CinematicHeading />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-blush/50 text-base max-w-md mb-2"
            >
              Practice with questions tailored to your resume, get scored instantly, and walk in prepared.
            </motion.p>
          </div>

          <FloatingBadge icon={Sparkles} text="Instant AI feedback" className="top-[12%] right-[4%]" delay={0.9} floatDelay={0} />
          <FloatingBadge icon={Zap} text="5 tailored questions" className="bottom-[16%] left-[6%]" delay={1.05} floatDelay={1.2} />
          <FloatingBadge icon={Check} text="Resume-aware scoring" className="bottom-[5%] right-[3%]" delay={1.2} floatDelay={0.6} />
        </div>

        {/* RIGHT — floating glass panel (centered up to xl, offset on xl+) */}
        <div className="flex-1 flex items-center justify-center xl:justify-end px-4 sm:px-6 xl:pr-16 2xl:pr-24 py-8 sm:py-10">
          <div className="w-full max-w-[420px] xl:mt-[-3vh]" style={{ perspective: 1200 }}>
            <div className="xl:hidden text-center mb-6">
              <h1 className="font-display text-3xl font-bold text-amber tracking-tight">PrepIn</h1>
              <p className="text-blush/50 mt-1 text-sm">AI Interview Simulator</p>
            </div>

            <motion.div
              ref={panelRef}
              onMouseMove={handlePanelMove}
              onMouseLeave={handlePanelLeave}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" }}
              className="relative rounded-3xl border border-white/10 bg-white/[0.045] backdrop-blur-2xl
                         shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 sm:p-8"
            >
              <div className="hidden xl:block mb-6">
                <p className="text-blush/40 text-xs uppercase tracking-[0.2em] mb-1">Welcome back</p>
                <h2 className="text-white font-display text-2xl font-semibold">Sign in to PrepIn</h2>
              </div>

              <AnimatePresence mode="wait">
                {needsVerification ? (
                  <motion.div key="verify" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.3 }}>
                    <h2 className="xl:hidden text-white font-display text-xl font-semibold mb-2">Verify your email</h2>
                    <p className="text-blush/50 text-sm mb-6 break-words">
                      Enter the 6-digit code sent to <span className="text-blush/80">{form.email}</span>
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
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-purple-500/10 border border-purple-500/20 text-blush/80 text-sm rounded-xl px-4 py-3 mb-4">
                        {infoMsg}
                      </motion.div>
                    )}

                    <form onSubmit={handleVerifyCode} className="space-y-5">
                      <div className="flex justify-center gap-1.5 sm:gap-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <motion.div
                            key={i}
                            animate={code[i] ? { scale: [1, 1.15, 1] } : {}}
                            transition={{ duration: 0.2 }}
                            className={`w-9 h-11 sm:w-11 sm:h-12 rounded-xl border flex items-center justify-center text-base sm:text-lg font-semibold transition-colors duration-200 ${
                              code[i] ? "border-amber/60 bg-amber/10 text-amber" : "border-white/10 bg-white/[0.03] text-blush/20"
                            }`}
                          >
                            {code[i] || ""}
                          </motion.div>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Type the code"
                        maxLength={6}
                        autoFocus
                        className="w-full bg-white/[0.03] border border-white/10 text-white placeholder-blush/25 rounded-xl px-4 py-3 text-sm text-center focus:outline-none focus:border-amber/50 transition-colors duration-200"
                      />

                      <MagneticButton
                        type="submit"
                        disabled={verifyLoading}
                        className="w-full bg-amber text-navy font-semibold rounded-xl py-3 text-sm transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(237,158,89,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {success ? (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex items-center gap-2">
                            <Check size={16} /> Verified
                          </motion.span>
                        ) : verifyLoading ? (
                          <span className="inline-flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Verifying</span>
                        ) : (
                          "Verify & continue"
                        )}
                      </MagneticButton>
                    </form>

                    <p className="text-center text-blush/50 text-sm mt-6">
                      Didn't get a code?{" "}
                      <button onClick={handleResend} className="text-amber hover:text-amber/80 font-medium transition-colors duration-200">Resend</button>
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="login" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.3 }}>
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

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Field icon={Mail} label="Email" type="email" name="email" value={form.email} onChange={handleChange} />
                      <div>
                        <Field icon={Lock} label="Password" name="password" value={form.password} onChange={handleChange} showToggle showValue={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                        <div className="flex justify-end mt-1.5">
                          <Link to="/reset-password" className="text-blush/40 hover:text-amber text-xs transition-colors duration-200">Forgot password?</Link>
                        </div>
                      </div>

                      <MagneticButton
                        type="submit"
                        disabled={loading}
                        className="w-full bg-amber text-navy font-semibold rounded-xl py-3 text-sm mt-2 flex items-center justify-center gap-2 transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(237,158,89,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {success ? (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex items-center gap-2">
                            <Check size={16} /> Welcome
                          </motion.span>
                        ) : loading ? (
                          <><Loader2 size={15} className="animate-spin" /> Signing in</>
                        ) : (
                          <>Sign in <ArrowRight size={15} /></>
                        )}
                      </MagneticButton>
                    </form>

                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-blush/30 text-xs">or</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} className="flex justify-center w-full overflow-hidden">
                      <div className="max-w-full">
                        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google login failed")} />
                      </div>
                    </motion.div>

                    <p className="text-center text-blush/50 text-sm mt-6">
                      Don't have an account?{" "}
                      <Link to="/register" className="text-amber hover:text-amber/80 font-medium transition-colors duration-200">Create one</Link>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}